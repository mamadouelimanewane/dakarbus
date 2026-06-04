import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setFocusedLine, clearFocusedLine, setActiveTab, toggleFavLine } from '@/store/store';
import { LINES, OPERATORS } from '@/data/transportData';

export default function LinesPage() {
  const dispatch = useAppDispatch();
  const { selectedOperator, focusedLine, busPositions } = useAppSelector(s=>s.mobility);
  const { lineIds: favIds } = useAppSelector(s=>s.favorites);
  const [search, setSearch] = useState('');
  const [favsOnly, setFavsOnly] = useState(false);

  let lines = selectedOperator==='all' ? LINES : LINES.filter(l=>l.operator===selectedOperator);
  if (search) { const q=search.toLowerCase(); lines=lines.filter(l=>l.name.toLowerCase().includes(q)||l.route.toLowerCase().includes(q)); }
  if (favsOnly) lines=lines.filter(l=>favIds.includes(l.id));

  const groups = Array.from(new Set(lines.map(l=>l.operator)));

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 flex-shrink-0 space-y-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{color:'#475569'}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une ligne…"
            className="input pl-9" />
          {search&&<button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs w-5 h-5 rounded-full flex items-center justify-center" style={{background:'rgba(255,255,255,.1)',color:'#64748b'}}>✕</button>}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{color:'#475569'}}>{lines.length} ligne{lines.length>1?'s':''}</span>
          <button onClick={()=>setFavsOnly(!favsOnly)}
            className="text-xs font-bold px-3 py-1 rounded-full transition-all"
            style={favsOnly?{background:'rgba(239,68,68,.1)',color:'#f87171',border:'1px solid rgba(239,68,68,.2)'}:{color:'#475569'}}>
            {favsOnly?'❤️':'🤍'} Favoris
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {lines.length===0 ? (
          <div className="text-center py-16" style={{color:'#1e293b'}}>
            <div className="text-4xl mb-3">🚌</div>
            <p className="font-bold text-sm">{favsOnly?'Aucun favori':'Aucune ligne'}</p>
          </div>
        ) : groups.map(op => {
          const opLines=lines.filter(l=>l.operator===op);
          return (
            <div key={op} className="mb-5">
              <div className="flex items-center gap-2 mb-2 sticky top-0 py-1.5" style={{background:'var(--c-bg)'}}>
                <span className="w-2.5 h-2.5 rounded-full" style={{background:OPERATORS[op]?.color}}/>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{color:OPERATORS[op]?.color}}>{OPERATORS[op]?.fullName||op}</span>
                <span className="text-[9px]" style={{color:'#1e293b'}}>({opLines.length})</span>
              </div>
              {opLines.map(line=>{
                const active=focusedLine===line.id;
                const isFav=favIds.includes(line.id);
                const buses=busPositions.filter(b=>b.lineId===line.id).length;
                return (
                  <div key={line.id} className="flex items-center rounded-xl mb-1 transition-all"
                    style={{background:active?'rgba(255,255,255,.06)':'transparent',border:`1px solid ${active?'rgba(255,255,255,.12)':'transparent'}`}}
                    onMouseEnter={e=>{if(!active)(e.currentTarget.style.background='rgba(255,255,255,.04)');}}
                    onMouseLeave={e=>{if(!active)(e.currentTarget.style.background='transparent');}}>
                    <button onClick={()=>{if(active)dispatch(clearFocusedLine());else{dispatch(setFocusedLine(line.id));dispatch(setActiveTab('plan'));}}}
                      className="flex-1 flex items-center gap-3 px-3 py-3 text-left min-w-0">
                      <span className="w-1.5 h-8 rounded-full flex-shrink-0" style={{background:line.color}}/>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{line.name}</div>
                        <div className="text-xs truncate" style={{color:'#475569'}}>{line.route}</div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        {buses>0&&<div className="text-[10px] font-black px-1.5 py-0.5 rounded-md mb-0.5 text-center" style={{background:'rgba(74,222,128,.1)',color:'#4ade80'}}>{buses}</div>}
                        <div className="text-[10px]" style={{color:'#334155'}}>{line.tarif} F</div>
                      </div>
                    </button>
                    <button onClick={()=>dispatch(toggleFavLine(line.id))}
                      className="pr-3 text-base transition-all hover:scale-125 active:scale-90"
                      style={{color:isFav?'#f87171':'#1e293b'}}>
                      {isFav?'❤️':'🤍'}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
