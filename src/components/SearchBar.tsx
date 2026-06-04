import React, { useState, useRef, useEffect } from 'react';
import { STOPS } from '@/data/transportData';
import type { Stop } from '@/types';

interface Props {
  placeholder?: string;
  onSelect: (stop: Stop) => void;
  value?: Stop | null;
  className?: string;
}

export default function SearchBar({ placeholder = 'Rechercher un arrêt…', onSelect, value, className = '' }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = query.length > 1
    ? STOPS.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.zone.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        type="text"
        value={value ? value.name : query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {results.map(stop => (
            <button
              key={stop.id}
              onClick={() => { onSelect(stop); setQuery(''); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
            >
              <span className="text-lg">🚏</span>
              <div>
                <p className="text-sm font-semibold text-white">{stop.name}</p>
                <p className="text-xs text-slate-400">{stop.zone} · {stop.operators.join(', ')}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
