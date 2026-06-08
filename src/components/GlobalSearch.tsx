import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePopBack } from '@/hooks/usePopBack';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveTab, setSelectedStop, setMapCenter, setMapZoom, setFocusedLine } from '@/store/store';
import { STOPS, LINES, OPERATORS } from '@/data/transportData';
import { searchStops } from '@/utils/fuzzy';
import { haptic } from '@/utils/haptic';

interface Result {
  type: 'stop' | 'line' | 'zone';
  id: string;
  label: string;
  sub: string;
  color: string;
  icon: string;
  lat?: number;
  lng?: number;
}

export default function GlobalSearch({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { userLocation } = useAppSelector(s => s.mobility);
  const [q, setQ] = useState('');
  const [listening, setListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  usePopBack(onClose);

  const startVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Reconnaissance vocale non disponible sur ce navigateur.'); return; }
    const rec = new SpeechRecognition();
    rec.lang = 'fr-FR';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onstart  = () => setListening(true);
    rec.onend    = () => setListening(false);
    rec.onerror  = () => setListening(false);
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setQ(transcript);
    };
    recognitionRef.current = rec;
    rec.start();
  }, []);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const results: Result[] = q.trim().length < 2 ? [] : (() => {
    const out: Result[] = [];
    const lq = q.toLowerCase();

    // Stops (fuzzy)
    const stops = searchStops(q, STOPS, userLocation?.[0], userLocation?.[1]).slice(0, 5);
    stops.forEach(s => {
      const op = OPERATORS[s.operators[0]];
      out.push({ type: 'stop', id: s.id, label: s.name, sub: s.zone, color: op?.color || '#2563eb', icon: op?.icon || '📍', lat: s.lat, lng: s.lng });
    });

    // Lines
    const lines = LINES.filter(l =>
      l.name.toLowerCase().includes(lq) ||
      l.id.toLowerCase().includes(lq) ||
      l.route.toLowerCase().includes(lq)
    ).slice(0, 4);
    lines.forEach(l => {
      out.push({ type: 'line', id: l.id, label: l.name, sub: l.route, color: l.color, icon: OPERATORS[l.operator]?.icon || '🚌' });
    });

    // Zones
    const zones = [...new Set(STOPS.map(s => s.zone))]
      .filter(z => z.toLowerCase().includes(lq))
      .slice(0, 3);
    zones.forEach(z => {
      const s = STOPS.find(x => x.zone === z);
      out.push({ type: 'zone', id: z, label: z, sub: `${STOPS.filter(x => x.zone === z).length} arrêts`, color: '#64748b', icon: '📌', lat: s?.lat, lng: s?.lng });
    });

    return out.slice(0, 8);
  })();

  const handleSelect = (r: Result) => {
    haptic('medium');
    if (r.type === 'stop') {
      dispatch(setSelectedStop(r.id));
      dispatch(setActiveTab('stops'));
      if (r.lat && r.lng) { dispatch(setMapCenter([r.lat, r.lng])); dispatch(setMapZoom(16)); }
    } else if (r.type === 'line') {
      dispatch(setFocusedLine(r.id));
      dispatch(setActiveTab('lines'));
    } else if (r.type === 'zone') {
      dispatch(setActiveTab('stops'));
      if (r.lat && r.lng) { dispatch(setMapCenter([r.lat, r.lng])); dispatch(setMapZoom(14)); }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9500] flex flex-col"
      style={{ background: 'rgba(5,8,18,.97)', backdropFilter: 'blur(20px)' }}>

      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 pt-safe"
        style={{ borderBottom: '1px solid var(--c-border)', minHeight: 60 }}>
        <span className="text-xl flex-shrink-0">🔍</span>
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Arrêt, ligne, quartier…"
          className="flex-1 bg-transparent text-white text-base font-semibold outline-none placeholder-slate-600"
          style={{ caretColor: '#3b82f6' }}
        />
        {/* Bouton micro */}
        <button onClick={listening ? stopVoice : startVoice}
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base transition-all active:scale-90"
          style={{ background: listening ? 'rgba(220,38,38,.25)' : 'rgba(255,255,255,.08)', border: listening ? '1px solid rgba(220,38,38,.5)' : 'none' }}
          title="Recherche vocale">
          {listening ? <span style={{ color: '#f87171', animation: 'live-pulse 1s infinite' }}>🎤</span> : '🎙️'}
        </button>
        <button onClick={onClose}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all active:scale-90"
          style={{ background: 'rgba(255,255,255,.1)', color: '#94a3b8' }}>✕</button>
      </div>

      {/* Quick categories when empty */}
      {q.trim().length < 2 && (
        <div className="px-4 pt-5">
          <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#334155' }}>
            Catégories
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Arrêts BRT',  icon: '🚍', color: '#7c3aed', q: 'BRT' },
              { label: 'Lignes DDD',  icon: '🚌', color: '#1d4ed8', q: 'Ligne' },
              { label: 'Gares TER',   icon: '🚆', color: '#059669', q: 'Gare TER' },
              { label: 'Pikine',      icon: '📍', color: '#e11d48', q: 'Pikine' },
              { label: 'Parcelles',   icon: '📍', color: '#d97706', q: 'Parcelles' },
              { label: 'Guédiawaye', icon: '📍', color: '#0ea5e9', q: 'Guédiawaye' },
            ].map(c => (
              <button key={c.q} onClick={() => setQ(c.q)}
                className="flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-95"
                style={{ background: c.color + '12', border: `1px solid ${c.color}25` }}>
                <span className="text-2xl">{c.icon}</span>
                <span className="text-sm font-bold text-white">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-8 space-y-1.5" style={{ scrollbarWidth: 'none' }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#334155' }}>
            {results.length} résultat{results.length > 1 ? 's' : ''}
          </p>
          {results.map((r, i) => (
            <button key={i} onClick={() => handleSelect(r)}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all active:scale-[.98]"
              style={{ background: r.color + '10', border: `1px solid ${r.color}20` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: r.color + '20' }}>
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm truncate">{r.label}</div>
                <div className="text-xs truncate mt-0.5" style={{ color: '#475569' }}>{r.sub}</div>
              </div>
              <div className="text-[10px] font-black px-2 py-1 rounded-lg flex-shrink-0"
                style={{ background: r.color + '20', color: r.color }}>
                {r.type === 'stop' ? 'Arrêt' : r.type === 'line' ? 'Ligne' : 'Zone'}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {q.trim().length >= 2 && results.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-bold text-white">Aucun résultat pour "{q}"</p>
          <p className="text-sm mt-1" style={{ color: '#475569' }}>Essayez un nom d'arrêt, numéro de ligne ou quartier</p>
        </div>
      )}
    </div>
  );
}
