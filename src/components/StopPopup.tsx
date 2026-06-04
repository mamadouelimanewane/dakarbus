import React from 'react';
import type { Stop } from '@/types';
import { getNextDepartures, OPERATORS } from '@/data/transportData';

export default function StopPopup({ stop }: { stop: Stop }) {
  const deps = getNextDepartures(stop.id).slice(0, 4);
  const mainOp = stop.operators[0];
  const accentColor = OPERATORS[mainOp]?.color || '#2563eb';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minWidth: 220, maxWidth: 260 }}>

      {/* Header */}
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: accentColor + '25',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
            📍
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#f1f5f9', lineHeight: 1.3, marginBottom: 2 }}>{stop.name}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{stop.zone}</div>
          </div>
        </div>

        {/* Operator badges */}
        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
          {stop.operators.map(op => (
            <span key={op} style={{
              background: OPERATORS[op]?.color || '#64748b', color: 'white',
              fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
              letterSpacing: '.02em',
            }}>{op}</span>
          ))}
          {stop.terConnection && (
            <span style={{ background:'rgba(5,150,105,.2)', color:'#34d399', fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:99, border:'1px solid rgba(5,150,105,.3)' }}>
              🚆 TER
            </span>
          )}
        </div>
      </div>

      {/* Departures */}
      <div style={{ padding: '10px 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
          Prochains passages
        </div>
        {deps.length === 0 ? (
          <div style={{ fontSize: 11, color: '#475569', textAlign: 'center', padding: '8px 0' }}>Aucun départ disponible</div>
        ) : (
          deps.map((d, i) => {
            const waitColor = d.waitMin <= 3 ? '#34d399' : d.waitMin <= 10 ? '#fbbf24' : '#94a3b8';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < deps.length - 1 ? 7 : 0 }}>
                <div style={{
                  background: d.color, color: 'white', fontSize: 9, fontWeight: 800,
                  padding: '3px 7px', borderRadius: 6, flexShrink: 0, minWidth: 52, textAlign: 'center',
                }}>{d.lineName}</div>
                <span style={{ fontSize: 11, color: '#64748b', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {d.route.split('↔')[1]?.trim() || d.route}
                </span>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: waitColor }}>{d.waitMin}</span>
                  <span style={{ fontSize: 9, color: '#475569', marginLeft: 1 }}>m</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
