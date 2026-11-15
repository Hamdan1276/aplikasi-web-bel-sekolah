import React, { useRef, useState } from 'react';
import { Music2, Play, Square, Trash2, Upload } from 'lucide-react';
import { BUILT_IN_TONES } from '../data/defaultSchedules';
import { CustomAudioTrack } from '../types/bell';

interface AudioLibraryViewProps {
  customTracks: CustomAudioTrack[];
  playingSoundId: string | null;
  onPlaySound: (soundId: string, label: string) => void;
  onStopSound: () => void;
  onUploadFiles: (files: FileList) => Promise<void>;
  onDeleteCustomTrack: (id: string) => Promise<void>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const AudioLibraryView: React.FC<AudioLibraryViewProps> = ({
  customTracks,
  playingSoundId,
  onPlaySound,
  onStopSound,
  onUploadFiles,
  onDeleteCustomTrack,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('Semua Model');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError('');
    setUploading(true);
    try {
      await onUploadFiles(files);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Gagal mengunggah berkas audio.'
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Built-in Synthesized Chimes */}
      <section className="bg-white border border-[#E2E6DD] rounded-xl p-5 sm:p-6 space-y-4">
        <div className="pb-3 border-b border-[#EAECE6]">
          <h2 className="text-base font-bold text-[#13221C]">
            Nada Lonceng Bawaan Sistem
          </h2>
          <p className="text-xs text-[#5B6B62] mt-0.5">
            Nada polifonik jernih yang dihasilkan langsung oleh sistem tanpa memerlukan koneksi internet.
          </p>
        </div>

        {/* Acoustic Model Filter */}
        <div className="flex items-center gap-1 p-1 bg-[#F3F4EE] rounded-lg overflow-x-auto">
          {['Semua Model', ...Array.from(new Set(BUILT_IN_TONES.map((t) => t.modelName)))].map(
            (model) => (
              <button
                key={model}
                type="button"
                onClick={() => setSelectedModel(model)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  selectedModel === model
                    ? 'bg-white text-[#0B3B2C] shadow-xs'
                    : 'text-[#5B6B62] hover:text-[#13221C]'
                }`}
              >
                {model}
              </button>
            )
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {BUILT_IN_TONES.filter(
            (t) =>
              selectedModel === 'Semua Model' || t.modelName === selectedModel
          ).map((tone) => {
            const isPlaying = playingSoundId === tone.id;
            return (
              <div
                key={tone.id}
                className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${
                  isPlaying
                    ? 'border-[#C89B3C] bg-[#FBF7EC]'
                    : 'border-[#E2E6DD] bg-[#FCFBF8]'
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="text-sm font-bold text-[#13221C] flex items-center gap-2 flex-wrap">
                    <span className="truncate">{tone.name}</span>
                    <span className="text-xs font-mono font-normal tabular-nums text-[#5B6B62] shrink-0">
                      · {tone.durationLabel}
                    </span>
                    <span className="text-xs font-medium text-[#0E4A38] shrink-0">
                      · {tone.modelName}
                    </span>
                  </div>
                  <p className="text-xs text-[#5B6B62] leading-relaxed">
                    {tone.description}
                  </p>
                </div>

                {isPlaying ? (
                  <button
                    type="button"
                    onClick={onStopSound}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shrink-0 whitespace-nowrap"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Hentikan</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onPlaySound(tone.id, tone.name)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#CFD7CE] bg-white hover:bg-[#EFF5F1] hover:border-[#B6CCBF] text-[#0B3B2C] text-xs font-semibold shrink-0 whitespace-nowrap transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Putar</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Custom Audio Upload & Storage */}
      <section className="bg-white border border-[#E2E6DD] rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAECE6]">
          <div>
            <h2 className="text-base font-bold text-[#13221C]">
              Audio Kustom Sekolah (MP3 / WAV / OGG)
            </h2>
            <p className="text-xs text-[#5B6B62] mt-0.5">
              Unggah rekaman bel, lagu wajib nasional, atau murattal untuk dipasang pada jadwal bel. Tersimpan lokal di browser.
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B3B2C] hover:bg-[#082D21] disabled:opacity-50 text-[#FAF8F2] text-xs font-semibold whitespace-nowrap transition-colors"
            >
              <Upload className="h-3.5 w-3.5 text-[#E5C167]" />
              <span>{uploading ? 'Menyimpan...' : 'Unggah Audio'}</span>
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-medium text-red-700">
            {uploadError}
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            isDragging
              ? 'border-[#0B3B2C] bg-[#EFF5F1]'
              : 'border-[#CFD7CE] bg-[#F9FAF6]'
          }`}
        >
          <Music2 className="h-6 w-6 text-[#6E7D74] mx-auto mb-2" />
          <div className="text-xs font-semibold text-[#2A3B33]">
            Seret dan lepas berkas audio ke sini, atau klik Unggah Audio
          </div>
          <div className="text-xs text-[#5B6B62] mt-1">
            Mendukung format MP3, WAV, M4A, dan OGG
          </div>
        </div>

        {/* Uploaded Files List */}
        {customTracks.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#5B6B62]">
            Belum ada berkas audio kustom yang diunggah.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#E2E6DD] rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E4E8DF] bg-[#F5F7F2] text-xs font-semibold text-[#3C5247]">
                  <th className="py-2.5 pl-4 pr-3">Nama Berkas</th>
                  <th className="py-2.5 px-3 w-28">Durasi</th>
                  <th className="py-2.5 px-3 w-28">Ukuran</th>
                  <th className="py-2.5 pl-3 pr-4 w-36 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEFE8] text-sm">
                {customTracks.map((track) => {
                  const fullSoundId = `custom:${track.id}`;
                  const isPlaying = playingSoundId === fullSoundId;
                  return (
                    <tr key={track.id} className="hover:bg-[#FAFBF8]">
                      <td className="py-2.5 pl-4 pr-3 font-medium text-[#13221C]">
                        {track.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs tabular-nums text-slate-600">
                        {track.durationSec > 0
                          ? `${track.durationSec} dtk`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs tabular-nums text-slate-600">
                        {formatFileSize(track.size)}
                      </td>
                      <td className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">
                        {confirmDeleteId === track.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteCustomTrack(track.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                            >
                              Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded border border-slate-300 text-xs font-medium text-slate-600"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            {isPlaying ? (
                              <button
                                type="button"
                                onClick={onStopSound}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-700"
                                aria-label={`Hentikan ${track.name}`}
                              >
                                <Square className="h-3.5 w-3.5 fill-current" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  onPlaySound(fullSoundId, track.name)
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                aria-label={`Putar ${track.name}`}
                              >
                                <Play className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(track.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700"
                              aria-label={`Hapus ${track.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
