import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedOperator } from '@/store/store';
import type { OperatorId } from '@/types';
import { OPERATORS } from '@/data/transportData';

const ALL = { id: 'all', name: 'Tous', icon: '🌐', color: '#64748b' };

export default function OperatorFilter() {
  const dispatch = useAppDispatch();
  const selected = useAppSelector(s => s.mobility.selectedOperator);

  const ops = [ALL, ...Object.values(OPERATORS)];

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide">
      {ops.map(op => {
        const active = selected === op.id;
        return (
          <button
            key={op.id}
            onClick={() => dispatch(setSelectedOperator(op.id as OperatorId))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
              active
                ? 'text-white border-transparent shadow-lg scale-105'
                : 'bg-white/10 border-white/20 text-slate-300 hover:bg-white/20'
            }`}
            style={active ? { backgroundColor: op.color, borderColor: op.color } : {}}
          >
            <span>{op.icon}</span>
            <span>{op.name}</span>
          </button>
        );
      })}
    </div>
  );
}
