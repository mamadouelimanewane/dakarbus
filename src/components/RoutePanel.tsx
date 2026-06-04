import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setRouteOrigin, setRouteDestination, clearRoute } from '@/store/store';
import { STOPS, getNextDepartures } from '@/data/transportData';
import type { Stop } from '@/types';
import SearchBar from './SearchBar';

export default function RoutePanel() {
  const dispatch = useAppDispatch();
  const { route } = useAppSelector(s => s.mobility);
  const [result, setResult] = useState<null | {
    duration: number; fare: number; transfers: number;
    steps: { label: string; color: string; time: string }[];
  }>(null);

  const calculate = () => {
    if (!route.origin || !route.destination) return;
    // Simulation calcul itinéraire
    const direct = route.origin.lines.some(l => route.destination!.lines.includes(l));
    const duration = direct ? Math.floor(15 + Math.random() * 20) : Math.floor(30 + Math.random() * 25);
    const fare = direct ? 200 : 350;
    const transfers = direct ? 0 : 1;
    setResult({
      duration, fare, transfers,
      steps: direct
        ? [{ label: `Bus direct → ${route.destination.name}`, color: '#1a56db', time: `${duration} min` }]
        : [
          { label: `Bus → ${route.origin.name} (correspondance)`, color: '#1a56db', time: `${Math.floor(duration * 0.5)} min` },
          { label: `Bus → ${route.destination.name}`, color: '#e11d48', time: `${Math.ceil(duration * 0.5)} min` },
        ],
    });
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Planifier un trajet</h2>

      {/* Origin */}
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">A</span>
        <SearchBar
          placeholder="D'où partez-vous ?"
          onSelect={s => dispatch(setRouteOrigin(s))}
          value={route.origin}
          className="flex-1"
        />
      </div>

      {/* Destination */}
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">B</span>
        <SearchBar
          placeholder="Où allez-vous ?"
          onSelect={s => dispatch(setRouteDestination(s))}
          value={route.destination}
          className="flex-1"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={calculate}
          disabled={!route.origin || !route.destination}
          className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
        >
          🔍 Calculer
        </button>
        {(route.origin || route.destination) && (
          <button
            onClick={() => { dispatch(clearRoute()); setResult(null); }}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-bold transition-all"
          >
            ✕
          </button>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="mt-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {/* Summary */}
          <div className="p-4 border-b border-white/10 flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-black text-white">{result.duration}</div>
              <div className="text-[10px] text-slate-400 uppercase">min</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-black text-white">{result.fare}</div>
              <div className="text-[10px] text-slate-400 uppercase">FCFA</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-black text-white">{result.transfers}</div>
              <div className="text-[10px] text-slate-400 uppercase">Corresp.</div>
            </div>
            <div className="ml-auto">
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black text-white ${result.transfers === 0 ? 'bg-green-600' : 'bg-orange-500'}`}>
                {result.transfers === 0 ? 'DIRECT' : 'CORRESP.'}
              </span>
            </div>
          </div>
          {/* Steps */}
          <div className="p-4 flex flex-col gap-3">
            {result.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: step.color }} />
                <p className="text-xs text-slate-300 flex-1">{step.label}</p>
                <span className="text-xs font-bold text-white">{step.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nearby departures */}
      {route.origin && !result && (
        <div className="mt-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Prochains départs depuis {route.origin.name}</h3>
          {getNextDepartures(route.origin.id).slice(0, 4).map((d, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <span className="px-2 py-0.5 rounded text-[10px] font-black text-white" style={{ backgroundColor: d.color }}>{d.lineName}</span>
              <span className="text-xs text-slate-400 flex-1 truncate">{d.route.split('↔')[1]?.trim()}</span>
              <span className={`text-sm font-black ${d.waitMin <= 5 ? 'text-green-400' : d.waitMin <= 15 ? 'text-yellow-400' : 'text-slate-400'}`}>{d.waitMin} min</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
