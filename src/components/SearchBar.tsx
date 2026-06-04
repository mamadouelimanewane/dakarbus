import React, { useState, useRef, useEffect } from 'react';
import { STOPS, OPERATORS } from '@/data/transportData';
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
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.length > 1
    ? STOPS.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.zone.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 7)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (stop: Stop) => {
    onSelect(stop);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const displayValue = value ? value.name : query;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (!value) setOpen(true); }}
          placeholder={placeholder}
          className="input pr-10"
          style={{ paddingLeft: '0.875rem' }}
        />
        {value ? (
          <button
            onClick={() => { onSelect(null as any); setQuery(''); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110"
            style={{ background: 'rgba(255,255,255,.1)', color: '#94a3b8' }}>
            ✕
          </button>
        ) : query ? (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
            style={{ background: 'rgba(255,255,255,.1)', color: '#94a3b8' }}>
            ✕
          </button>
        ) : (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: '#475569' }}>🔍</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-[9999] animate-fade-up"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border2)', boxShadow: 'var(--shadow-xl)' }}>
          {results.map((stop, i) => {
            const mainOp = stop.operators[0];
            const color  = OPERATORS[mainOp]?.color || '#64748b';
            return (
              <button
                key={stop.id}
                onClick={() => handleSelect(stop)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group"
                style={{ borderBottom: i < results.length - 1 ? '1px solid var(--c-border)' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                  style={{ background: color + '25' }}>
                  📍
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{stop.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--c-muted)' }}>{stop.zone}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {stop.operators.slice(0, 2).map(op => (
                    <span key={op} className="text-[9px] font-black px-1.5 py-0.5 rounded-md text-white"
                      style={{ background: OPERATORS[op]?.color || '#64748b' }}>{op}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
