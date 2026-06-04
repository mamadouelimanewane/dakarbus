import React from 'react';
import type { Stop } from '@/types';
import { getNextDepartures, OPERATORS } from '@/data/transportData';

interface Props { stop: Stop; }

export default function StopPopup({ stop }: Props) {
  const deps = getNextDepartures(stop.id);
  return (
    <div style={{ minWidth: 210, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#1a56db', color: 'white', padding: '10px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{stop.name}</div>
        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{stop.zone}</div>
      </div>
      <div style={{ padding: '8px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {stop.operators.map(op => (
          <span key={op} style={{ background: OPERATORS[op]?.color || '#64748b', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>{op}</span>
        ))}
      </div>
      <div style={{ padding: '8px 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Prochains passages</div>
        {deps.slice(0, 3).map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <div style={{ background: d.color, color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, minWidth: 60, textAlign: 'center' }}>{d.lineName}</div>
            <span style={{ fontSize: 11, color: '#475569', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{d.route.split('↔')[1]?.trim() || d.route}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: d.waitMin <= 5 ? '#059669' : d.waitMin <= 15 ? '#d97706' : '#94a3b8' }}>{d.waitMin} min</span>
          </div>
        ))}
      </div>
    </div>
  );
}
