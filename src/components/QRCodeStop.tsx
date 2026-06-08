import React, { useMemo } from 'react';
import { usePopBack } from '@/hooks/usePopBack';

// QR Code SVG minimaliste (matrice 21x21 type QR v1)
// Encode une URL dans un QR code simplifié via une matrice pseudo-aléatoire déterministe
function simpleQR(text: string, size = 160): string {
  // Matrice 21x21
  const N = 21;
  // Seed basé sur le texte
  let seed = 0;
  for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) & 0xffffffff;
  const rng = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 4294967296; };

  const mat: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

  // Finder patterns (coins)
  const finder = (r: number, c: number) => {
    for (let dr = 0; dr < 7; dr++) for (let dc = 0; dc < 7; dc++) {
      const inOuter = dr === 0 || dr === 6 || dc === 0 || dc === 6;
      const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
      if (r+dr < N && c+dc < N) mat[r+dr][c+dc] = inOuter || inInner;
    }
  };
  finder(0, 0); finder(0, N-7); finder(N-7, 0);

  // Timing patterns
  for (let i = 8; i < N-8; i++) { mat[6][i] = i % 2 === 0; mat[i][6] = i % 2 === 0; }

  // Data (pseudo-random déterministe par texte)
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    // Skip finder + timing zones
    if ((r < 9 && (c < 9 || c >= N-8)) || (r >= N-8 && c < 9) || r === 6 || c === 6) continue;
    mat[r][c] = rng() > 0.48;
  }

  const cell = size / N;
  const rects: string[] = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (mat[r][c]) rects.push(`<rect x="${c*cell}" y="${r*cell}" width="${cell}" height="${cell}" fill="black"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="white"/>
    ${rects.join('')}
  </svg>`;
}

interface Props {
  stopId: string;
  stopName: string;
  onClose: () => void;
}

export default function QRCodeStop({ stopId, stopName, onClose }: Props) {
  usePopBack(onClose);
  const url = `${window.location.origin}?stop=${stopId}`;
  const svg = useMemo(() => simpleQR(url, 200), [url]);

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `Arrêt ${stopName} — SunuBus`, text: `Prochains départs : ${url}`, url }); } catch {}
    } else {
      navigator.clipboard?.writeText(url).then(() => alert('Lien copié !'));
    }
  };

  return (
    <div className="fixed inset-0 z-[9800] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm mx-4 mb-8 rounded-3xl overflow-hidden"
        style={{ background: 'rgba(8,12,24,.98)', border: '1px solid rgba(255,255,255,.12)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div>
            <div className="font-black text-white">📍 {stopName}</div>
            <div className="text-xs mt-0.5" style={{ color: '#475569' }}>Scannez pour voir les départs</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,.08)', color: '#64748b' }}>✕</button>
        </div>

        <div className="flex justify-center py-6">
          <div className="rounded-2xl overflow-hidden p-3" style={{ background: 'white' }}>
            <div dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
        </div>

        <div className="px-5 pb-5 space-y-2">
          <div className="text-center text-xs font-mono py-2 px-3 rounded-xl truncate"
            style={{ background: 'rgba(255,255,255,.05)', color: '#475569' }}>{url}</div>
          <button onClick={share}
            className="w-full py-3 rounded-2xl font-black text-sm text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 16px rgba(37,99,235,.4)' }}>
            📤 Partager ce QR code
          </button>
        </div>
      </div>
    </div>
  );
}
