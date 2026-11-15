import 'dotenv/config';
import express from 'express';
import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { getIndonesianVoicePresetById } from './src/data/indonesianVoices.ts';
import type { IndonesianVoicePreset } from './src/types/bell.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const TTS_MODELS = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'] as const;

const ttsCache = new Map<string, string>();
const MAX_CACHE_ENTRIES = 100;
const modelCooldownUntil = new Map<string, number>();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function splitIndonesianChunks(text: string, maxLen = 175): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  if (normalized.length <= maxLen) return [normalized];

  const sentences = normalized
    .split(/(?<=[.!?])\s+|(?<=,)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  for (const part of sentences) {
    if (part.length > maxLen) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      const words = part.split(' ');
      let slice = '';
      for (const word of words) {
        if ((slice + ' ' + word).trim().length > maxLen) {
          if (slice) chunks.push(slice.trim());
          slice = word;
        } else {
          slice = (slice + ' ' + word).trim();
        }
      }
      if (slice) chunks.push(slice.trim());
      continue;
    }

    const candidate = current ? `${current} ${part}` : part;
    if (candidate.length <= maxLen) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = part;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile('ffmpeg', args, { timeout: 15000 }, (err, _stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
      } else {
        resolve();
      }
    });
  });
}

async function synthesizeIndonesianFallbackWav(
  text: string,
  preset: IndonesianVoicePreset
): Promise<string | null> {
  const chunks = splitIndonesianChunks(text, 175);
  if (chunks.length === 0) return null;

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'alhuda-tts-'));
  try {
    const chunkFiles: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=id&client=tw-ob&q=${encodeURIComponent(
        chunks[i]
      )}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          Referer: 'https://translate.google.com/',
        },
        signal: AbortSignal.timeout(7000),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const mp3Buf = Buffer.from(await res.arrayBuffer());
      if (mp3Buf.length < 256) {
        throw new Error('Empty audio payload');
      }
      const chunkPath = path.join(tempDir, `chunk_${i}.mp3`);
      await fs.writeFile(chunkPath, mp3Buf);
      chunkFiles.push(chunkPath);
    }

    let sourceInputPath = chunkFiles[0];
    if (chunkFiles.length > 1) {
      const listPath = path.join(tempDir, 'concat.txt');
      const listBody = chunkFiles
        .map((f) => `file '${f.replace(/'/g, "'\\''")}'`)
        .join('\n');
      await fs.writeFile(listPath, listBody, 'utf8');
      const mergedPath = path.join(tempDir, 'merged.mp3');
      await runFfmpeg([
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        listPath,
        '-c:a',
        'libmp3lame',
        '-q:a',
        '4',
        mergedPath,
      ]);
      sourceInputPath = mergedPath;
    }

    const pitchScale = Math.max(
      0.68,
      Math.min(1.22, preset.serverPitchScale ?? 1.0)
    );
    const tempoScale = Math.max(
      0.82,
      Math.min(1.22, preset.serverTempoScale ?? 1.0)
    );
    const atempoComp = Math.max(
      0.55,
      Math.min(1.85, tempoScale / pitchScale)
    ).toFixed(4);

    const filters = [
      'aresample=24000',
      `asetrate=${Math.round(24000 * pitchScale)}`,
      'aresample=24000',
      `atempo=${atempoComp}`,
    ];
    if (preset.serverEqFilter) {
      filters.push(preset.serverEqFilter);
    }
    filters.push('volume=1.15');

    const outWavPath = path.join(tempDir, 'out.wav');
    await runFfmpeg([
      '-y',
      '-i',
      sourceInputPath,
      '-af',
      filters.join(','),
      '-ar',
      '24000',
      '-ac',
      '1',
      outWavPath,
    ]);

    const wavBuf = await fs.readFile(outWavPath);
    return wavBuf.toString('base64');
  } catch {
    return null;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function generateGeminiTtsWav(
  ai: GoogleGenAI,
  text: string,
  preset: IndonesianVoicePreset
): Promise<string | null> {
  const now = Date.now();
  for (const model of TTS_MODELS) {
    const blockedUntil = modelCooldownUntil.get(model) ?? 0;
    if (blockedUntil > now) continue;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text,
                speechMetadata: {
                  style: preset.geminiStyle,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: preset.geminiVoiceName,
              },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return base64Audio;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isQuotaOrRate =
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('quota');
      modelCooldownUntil.set(
        model,
        Date.now() + (isQuotaOrRate ? 10 * 60 * 1000 : 60 * 1000)
      );
    }
  }
  return null;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.post('/api/tts', async (req, res) => {
    try {
      const body = (req.body || {}) as { text?: unknown; voiceId?: unknown };
      const rawText = typeof body.text === 'string' ? body.text.trim() : '';
      const voiceId = typeof body.voiceId === 'string' ? body.voiceId : '';

      if (!rawText) {
        res.status(400).json({ error: 'Teks pengumuman tidak boleh kosong.' });
        return;
      }

      const cleanText = rawText.slice(0, 700);
      const preset = getIndonesianVoicePresetById(voiceId);
      const cacheKey = `${preset.id}::${cleanText}`;

      const cached = ttsCache.get(cacheKey);
      if (cached) {
        res.json({
          audioBase64: cached,
          mimeType: 'audio/wav',
          voiceName: preset.name,
        });
        return;
      }

      let base64Audio: string | null = null;
      const ai = getGeminiClient();
      if (ai) {
        base64Audio = await generateGeminiTtsWav(ai, cleanText, preset);
      }

      if (!base64Audio) {
        base64Audio = await synthesizeIndonesianFallbackWav(cleanText, preset);
      }

      if (!base64Audio) {
        res.status(503).json({
          error: 'Layanan suara studio belum aktif, menggunakan suara perangkat.',
        });
        return;
      }

      if (ttsCache.size >= MAX_CACHE_ENTRIES) {
        const firstKey = ttsCache.keys().next().value;
        if (firstKey !== undefined) {
          ttsCache.delete(firstKey);
        }
      }
      ttsCache.set(cacheKey, base64Audio);

      res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
        voiceName: preset.name,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal menghasilkan suara Indonesia.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bel Madrasah Aliyah server running on http://localhost:${PORT}`);
  });
}

startServer();
