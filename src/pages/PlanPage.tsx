import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveTab, clearRoute } from '@/store/store';
import RoutePanel from '@/components/RoutePanel';
import RouteMap from '@/components/RouteMap';
import { useAppSelector } from '@/store/hooks';

const FARES = [
  { id:'DDD',  emoji:'🚌', label:'Bus Urbain',    price:'200', color:'#2563eb' },
  { id:'AFTU', emoji:'🚐', label:'Car Rapide',    price:'150', color:'#e11d48' },
  { id:'BRT',  emoji:'🚍', label:'BRT Climatisé', price:'300', color:'#7c3aed' },
  { id:'TER',  emoji:'🚆', label:'TER Train',     price:'500', color:'#059669' },
];

export default function PlanPage() {
  const dispatch = useAppDispatch();
  const { route } = useAppSelector(s => s.mobility);
  const hasRoute = !!(route.origin && route.destination);
  return (
    <div className="flex flex-col h-full">
      <RouteMap show={hasRoute} onClose={() => dispatch(clearRoute())} />
      <div className="flex-1 overflow-y-auto pb-6">
      <RoutePanel />

      {/* Tariffs */}
      <div className="px-4 mt-1">
        <div className="rounded-2xl overflow-hidden" style={{background:'var(--c-surface)',border:'1px solid var(--c-border)'}}>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest" style={{color:'var(--c-muted)'}}>Tarifs réseau</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 px-4 pb-3">
            {FARES.map(f=>(
              <div key={f.id} className="flex items-center gap-2.5 p-3 rounded-xl" style={{background:f.color+'10'}}>
                <span className="text-xl">{f.emoji}</span>
                <div>
                  <div className="text-xs font-bold text-white truncate">{f.label}</div>
                  <div className="text-sm font-black" style={{color:f.color}}>{f.price} <span className="text-[10px] opacity-70">FCFA</span></div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <button onClick={()=>dispatch(setActiveTab('tickets'))}
              className="w-full py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95"
              style={{background:'linear-gradient(135deg,#1d4ed8,#7c3aed)',boxShadow:'0 6px 20px rgba(37,99,235,.3)'}}>
              💳 Acheter un M-Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
