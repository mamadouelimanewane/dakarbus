import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedStop } from '@/store/store';
import { STOPS, OPERATORS, getNextDepartures } from '@/data/transportData';
import type { OperatorId } from '@/types';

export default function StopsPage() {
  const dispatch = useAppDispatch();
  const { selectedOperator } = useAppSelector(s => s.mobility);

  const stops = selectedOperator === 'all' 
    ? STOPS 
    : STOPS.filter(s => s.operators.includes(selectedOperator as OperatorId));

  return (
    <div className="flex flex-col gap-2 p-4 h-full overflow-y-auto">
      <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
        {stops.length} arrêt{stops.length > 1 ? 's' : ''}
      </h2>
      
      {stops.map(stop => {
        const deps = getNextDepartures(stop.id).slice(0, 2);
        const mainOp = stop.operators[0];
        const op = OPERATORS[mainOp];
        
        return (
          <button
            key={stop.id}
            onClick={() => dispatch(setSelectedStop(stop.id))}
            className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black text-white mb-2" style={{ backgroundColor: op?.color }}>
                  {op?.name || 'Arrêt'}
                </span>
                <h3 className="font-bold text-white text-sm group-hover:text-brand-400 transition-colors">{stop.name}</h3>
                <p className="text-xs text-slate-400">{stop.zone}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs group-hover:bg-brand-600 transition-colors">
                📍
              </div>
            </div>
            
            <div className="space-y-2">
              {deps.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-10 text-center px-1 py-0.5 rounded text-[10px] font-black text-white" style={{ backgroundColor: d.color }}>
                    {d.lineName}
                  </span>
                  <span className="text-xs text-slate-300 flex-1 truncate">{d.route.split('↔')[1]?.trim() || d.route}</span>
                  <span className={`text-xs font-bold ${d.waitMin <= 5 ? 'text-green-400' : d.waitMin <= 15 ? 'text-yellow-400' : 'text-slate-400'}`}>
                    {d.waitMin} min
                  </span>
                </div>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
