import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addReport, upvoteReport, showToast } from '@/store/store';
import type { CrowdsourceReport } from '@/types';

const TYPES = {
  delay:    { e:'🐌', c:'#d97706', l:'Bouchon / Retard',  bg:'rgba(217,119,6,.08)',   border:'rgba(217,119,6,.2)' },
  accident: { e:'💥', c:'#dc2626', l:'Accident',           bg:'rgba(220,38,38,.08)',   border:'rgba(220,38,38,.2)' },
  crowd:    { e:'👥', c:'#2563eb', l:'Forte affluence',    bg:'rgba(37,99,235,.08)',   border:'rgba(37,99,235,.2)' },
  other:    { e:'⚠️', c:'#64748b', l:'Autre incident',     bg:'rgba(255,255,255,.04)', border:'rgba(255,255,255,.08)' },
} as const;

export default function AlertsPage() {
  const dispatch = useAppDispatch();
  const { reports } = useAppSelector(s=>s.tickets);
  const { userLocation } = useAppSelector(s=>s.mobility);
  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<CrowdsourceReport['type']>('delay');
  const [voted, setVoted] = useState(new Set<string>());

  const submit = () => {
    const t=desc.trim();
    if(!t){ dispatch(showToast({type:'warning',message:'Décrivez l\'incident en quelques mots.'})); return; }
    if(t.length<8){ dispatch(showToast({type:'warning',message:'Description trop courte.'})); return; }
    dispatch(addReport({ id:Math.random().toString(36).substring(2,11), type, description:t.slice(0,200),
      location:userLocation??[14.7167,-17.4677], timestamp:Date.now(), upvotes:0 }));
    dispatch(showToast({type:'success',message:'Signalement envoyé, merci !'}));
    setShowForm(false); setDesc('');
  };

  const upvote = (id:string) => {
    if(voted.has(id)) return;
    dispatch(upvoteReport(id)); setVoted(p=>new Set([...p,id]));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Info banner */}
      <div className="mx-4 mt-4 mb-2 p-3.5 rounded-2xl flex gap-3" style={{background:'rgba(217,119,6,.08)',border:'1px solid rgba(217,119,6,.2)'}}>
        <span className="text-xl flex-shrink-0">⚠️</span>
        <div>
          <p className="text-xs font-black" style={{color:'#fbbf24'}}>Info réseau</p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{color:'rgba(251,191,36,.6)'}}>Fort trafic sur la VDN. Lignes L8, L9, A3 — retards +15 min.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-black uppercase tracking-widest" style={{color:'var(--c-muted)'}}>
            Signalements ({reports.length})
          </h2>
          {!showForm&&(
            <button onClick={()=>setShowForm(true)}
              className="text-xs font-black px-3 py-1.5 rounded-xl transition-all active:scale-95"
              style={{background:'rgba(220,38,38,.1)',color:'#f87171',border:'1px solid rgba(220,38,38,.2)'}}>
              + Signaler
            </button>
          )}
        </div>

        {/* Form */}
        {showForm&&(
          <div className="card rounded-2xl p-4 mb-4 animate-fade-up">
            <h3 className="font-black text-sm text-white mb-3">🚨 Nouveau signalement</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(Object.entries(TYPES) as [CrowdsourceReport['type'], typeof TYPES[keyof typeof TYPES]][]).map(([k,m])=>(
                <button key={k} onClick={()=>setType(k)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={type===k?{background:m.bg,border:`1px solid ${m.border}`,color:'white'}:{background:'rgba(255,255,255,.03)',border:'1px solid var(--c-border)',color:'#64748b'}}>
                  <span>{m.e}</span><span>{m.l.split(' ')[0]}</span>
                </button>
              ))}
            </div>
            <textarea value={desc} onChange={e=>setDesc(e.target.value.slice(0,200))}
              placeholder="Décrivez l'incident…" className="input mb-1 h-20 resize-none" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px]" style={{color:'#334155'}}>{desc.length}/200</span>
              {userLocation&&<span className="text-[10px]" style={{color:'rgba(52,211,153,.6)'}}>📡 GPS détecté</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={submit} className="btn btn-primary flex-1">Envoyer</button>
              <button onClick={()=>{setShowForm(false);setDesc('');}} className="btn btn-ghost px-5">Annuler</button>
            </div>
          </div>
        )}

        {/* Reports */}
        <div className="space-y-2.5">
          {reports.map(r=>{
            const m=TYPES[r.type]||TYPES.other;
            const min=Math.floor((Date.now()-r.timestamp)/60000);
            const time=min<1?'À l\'instant':min<60?`${min} min`:`${Math.floor(min/60)}h`;
            const hasVoted=voted.has(r.id);
            return (
              <div key={r.id} className="rounded-2xl p-4 transition-all" style={{background:m.bg,border:`1px solid ${m.border}`}}>
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{background:`${m.c}25`}}>{m.e}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{m.l}</span>
                    </div>
                    <p className="text-[10px] mt-0.5" style={{color:'rgba(255,255,255,.3)'}}>Il y a {time}</p>
                  </div>
                  <button onClick={()=>upvote(r.id)} disabled={hasVoted}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-90"
                    style={hasVoted?{background:'rgba(37,99,235,.2)',color:'#60a5fa',cursor:'default'}:{background:'rgba(255,255,255,.08)',color:'#94a3b8'}}>
                    👍 {r.upvotes}
                  </button>
                </div>
                <p className="text-xs pl-12 leading-relaxed" style={{color:'rgba(241,245,249,.7)'}}>{r.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
