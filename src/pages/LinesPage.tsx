import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setFocusedLine, clearFocusedLine, setActiveTab } from '@/store/store';
import { LINES } from '@/data/transportData';

export default function LinesPage() {
  const dispatch = useAppDispatch();
  const { selectedOperator, focusedLine } = useAppSelector(s => s.mobility);

  const lines = selectedOperator === 'all' ? LINES : LINES.filter(l => l.operator === selectedOperator);

  const opGroups = Array.from(new Set(lines.map(l => l.operator)));

  return (
    <div className="flex flex-col gap-1 p-2">
      <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2 py-2">
        {lines.length} ligne{lines.length > 1 ? 's' : ''}
      </h2>
      {opGroups.map(op => (
        <div key={op}>
          <div className="px-2 py-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{op}</span>
          </div>
          {lines.filter(l => l.operator === op).map(line => {
            const active = focusedLine === line.id;
            return (
              <button
                key={line.id}
                onClick={() => {
                  if (active) dispatch(clearFocusedLine());
                  else { dispatch(setFocusedLine(line.id)); dispatch(setActiveTab('plan')); }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-left transition-all ${
                  active ? 'bg-white/15 shadow-md scale-[1.01]' : 'hover:bg-white/8'
                }`}
              >
                <span className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: line.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{line.name}</div>
                  <div className="text-xs text-slate-400 truncate">{line.route}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-black text-white">{line.freq}</div>
                  <div className="text-[10px] text-slate-500">{line.tarif} F</div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
