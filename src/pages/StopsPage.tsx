import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedStop, toggleFavStop, setMapCenter, setMapZoom } from '@/store/store';
import { STOPS, OPERATORS, getNextDepartures } from '@/data/transportData';
import type { OperatorId } from '@/types';

export default function StopsPage() {
  const dispatch = useAppDispatch();
  const { selectedOperator } = useAppSelector(s=>s.mobility);
  const { stopIds: favIds } = useAppSelector(s=>s.favorites);
  const [search, setSearch] = useState('');
  const [favsOnly, setFavsOnly] = useState(false);

  let stops = selectedOperator==='all' ? STOPS : STOPS.filter(s=>s.operators.includes(selectedOperator as OperatorId));
  if (search) { const q=search.toLowerCase(); stops=stops.filter(s=>s.name.toLowerCase().includes(q)||s.zone.toLowerCase().includes(q)); }
  if (favsOnly) stops=stops.filter(s=>favIds.includes(s.id));

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 flex-shrink-0 space-y-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{color:'#475569'}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un arrêt…" className="input pl-9" />
          {search&&<button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{background:'rgba(255,255,255,.1)',color:'#64748b'}}>✕</button>}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{color:'#475569'}}>{stops.length} arrêt{stops.length>1?'s':''}</span>
          <button onClick={()=>setFavsOnly(!favsOnly)}
            className="text-xs font-bold px-3 py-1 rounded-full transition-all"
            style={favsOnly?{background:'rgba(234,179,8,.1)',color:'#facc15',border:'1px solid rgba(234,179,8,.2)'}:{color:'#475569'}}>
            {favsOnly?'⭐':'☆'} Favoris
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-2">
        {stops.length===0 ? (
          <div className="text-center py-16" style={{color:'#1e293b'}}>
            <div className="text-4xl mb-3">📍</div>
            <p className="font-bold text-sm">{favsOnly?'Aucun favori':'Aucun arrêt'}</p>
          </div>
        ) : stops.map(stop=>{
          const deps=getNextDepartures(stop.id).slice(0,2);
          const mainOp=stop.operators[0];
          const opColor=OPERATORS[mainOp]?.color||'#2563eb';
          const isFav=favIds.includes(stop.id);
          return (
            <div key={stop.id} className="card rounded-2xl p-4 cursor-pointer transition-all active:scale-[.98] group"
              onClick={()=>{dispatch(setSelectedStop(stop.id));dispatch(setMapCenter([stop.lat,stop.lng]));dispatch(setMapZoom(16));}}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{background:opColor+'20'}}>
                  <span className="text-base">{OPERATORS[mainOp]?.icon||'📍'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">{stop.name}</h3>
                  <p className="text-xs mt-0.5" style={{color:'#475569'}}>{stop.zone}</p>
                  {stop.terConnection&&<span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1" style={{background:'rgba(5,150,105,.15)',color:'#34d399',border:'1px solid rgba(5,150,105,.2)'}}>🚆 TER</span>}
                </div>
                <button onClick={e=>{e.stopPropagation();dispatch(toggleFavStop(stop.id));}}
                  className="text-lg transition-all hover:scale-125 active:scale-90 flex-shrink-0"
                  style={{color:isFav?'#facc15':'#1e293b'}}>
                  {isFav?'⭐':'☆'}
                </button>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {stop.operators.map(op=>(
                  <span key={op} className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                    style={{background:OPERATORS[op]?.color||'#64748b'}}>{op}</span>
                ))}
              </div>

              {deps.length>0&&(
                <div className="space-y-2 pt-2.5" style={{borderTop:'1px solid var(--c-border)'}}>
                  {deps.map((d,i)=>(
                    <div key={i} className="flex items-center gap-2.5">
                      <span className="text-[9px] font-black text-white px-2 py-1 rounded-lg flex-shrink-0" style={{background:d.color,minWidth:46,textAlign:'center'}}>{d.lineName}</span>
                      <span className="text-xs flex-1 truncate" style={{color:'#64748b'}}>{d.route.split('↔')[1]?.trim()||d.route}</span>
                      <span className="text-sm font-black flex-shrink-0"
                        style={{color:d.waitMin<=3?'#34d399':d.waitMin<=10?'#fbbf24':'#475569'}}>
                        {d.waitMin}<span className="text-[9px] ml-0.5" style={{color:'#334155'}}>m</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
