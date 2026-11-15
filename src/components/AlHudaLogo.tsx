import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

interface AlHudaLogoProps {
  className?: string;
}

const LOGO_SRC = '/assets/aistudio/Logo_Al-Huda_f2456984.jpeg';
let cachedTransparentUrl: string | null = null;

export const AlHudaLogo: React.FC<AlHudaLogoProps> = ({
  className = 'h-10 w-10',
}) => {
  const [src, setSrc] = useState<string>(cachedTransparentUrl || LOGO_SRC);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (cachedTransparentUrl) {
      setSrc(cachedTransparentUrl);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) return;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        const isNearWhite = (idx: number) => {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          return r >= 232 && g >= 232 && b >= 232;
        };

        // Flood-fill from all 4 outer borders so internal white elements (ribbon, book) stay intact
        const visited = new Uint8Array(w * h);
        const queue = new Int32Array(w * h);
        let head = 0;
        let tail = 0;

        const enqueueIfWhite = (x: number, y: number) => {
          const pos = y * w + x;
          if (visited[pos]) return;
          if (isNearWhite(pos * 4)) {
            visited[pos] = 1;
            queue[tail++] = pos;
          }
        };

        for (let x = 0; x < w; x++) {
          enqueueIfWhite(x, 0);
          enqueueIfWhite(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
          enqueueIfWhite(0, y);
          enqueueIfWhite(w - 1, y);
        }

        while (head < tail) {
          const pos = queue[head++];
          const x = pos % w;
          const y = (pos - x) / w;
          data[pos * 4 + 3] = 0;

          if (x > 0) enqueueIfWhite(x - 1, y);
          if (x < w - 1) enqueueIfWhite(x + 1, y);
          if (y > 0) enqueueIfWhite(x, y - 1);
          if (y < h - 1) enqueueIfWhite(x, y + 1);
        }

        // Soften 1px anti-aliased fringe adjacent to transparent background
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const pos = y * w + x;
            if (visited[pos]) continue;
            const hasTransparentNeighbor =
              visited[pos - 1] ||
              visited[pos + 1] ||
              visited[pos - w] ||
              visited[pos + w];
            if (hasTransparentNeighbor) {
              const i = pos * 4;
              const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
              if (lum > 200) {
                data[i + 3] = Math.round(Math.max(0, 255 - (lum - 200) * 4));
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const resultUrl = canvas.toDataURL('image/png');
        cachedTransparentUrl = resultUrl;
        if (!cancelled) {
          setSrc(resultUrl);
        }
      } catch {
        // Fallback to clipped JPEG if canvas read fails
      }
    };
    img.onerror = () => {
      if (!cancelled) setFailed(true);
    };
    img.src = LOGO_SRC;

    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <div className={`${className} flex items-center justify-center shrink-0`}>
        <Bell className="h-5 w-5 text-amber-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Logo Pondok Pesantren Al-Huda Gorontalo"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      style={
        src === LOGO_SRC
          ? {
              clipPath: 'polygon(50% 1%, 98% 36%, 80% 97%, 20% 97%, 2% 36%)',
            }
          : undefined
      }
      className={`${className} object-contain shrink-0 select-none`}
    />
  );
};
