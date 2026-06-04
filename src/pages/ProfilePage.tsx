import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleFavStop, toggleFavLine, logout } from '@/store/store';
import { STOPS, LINES, OPERATORS } from '@/data/transportData';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { tripCount, totalFCFA, co2SavedKg, favOperator, stopIds, lineIds } = useAppSelector(s=>s.favorites);
  const { myTickets } = useAppSelector(s=>s.tickets);
  const { name } = useAppSelector(s=>s.auth);

  const favStops  = STOPS.filter(s=>stopIds.includes(s.id));
  const favLines  = LINES.filter(l=>lineIds.includes(l.id));
  const valid     = myTickets.filter(t=>t.status==='valid').length;
  const ecoLevel  = co2SavedKg>=10?'Or 🥇':co2SavedKg>=5?'Argent 🥈':co2SavedKg>0?'Bronze 🥉':'';
  const ecoPct    = Math.min(100,(co2SavedKg/10)*100);

  return (
    <div className="overflow-y-auto pb-20">
      {/* Hero */}
      <div className="relative px-4 pt-8 pb-7 text-center overflow-hidden"
        style={{background:'linear-gradient(160deg,rgba(29,78,216,.3) 0%,rgba(10,15,30,1) 100%)'}}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {['🚌','🚐','🚍','🚆'].map((e,i)=>(
            <div key={i} className="absolute text-5xl select-none" style={{opacity:.04,top:`${8+i*24}%`,left:`${i*27}%`,transform:`rotate(${i*14-16}deg)`}}>{e}</div>
          ))}
        </div>
        <div className="relative">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl"
            style={{background:'linear-gradient(135deg,rgba(37,99,235,.3),rgba(124,58,237,.3))',border:'1.5px solid rgba(255,255,255,.1)'}}>
            👤
          </div>
          <h2 className="text-2xl font-black text-white">{name||'Voyageur'}</h2>
          <p className="text-sm mt-1 font-medium" style={{color:'rgba(147,197,253,.6)'}}>
            {favOperator ? `Fidèle ${OPERATORS[favOperator]?.fullName||favOperator}` : 'Voyageur SunuBus'}
          </p>
          {ecoLevel&&<span className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full" style={{background:'rgba(5,150,105,.15)',color:'#34d399',border:'1px solid rgba(5,150,105,.2)'}}>Médaille {ecoLevel}</span>}
        </div>
      </div>

      <div className="px-4 space-y-5 mt-1">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {e:'🚌',l:'Voyages',    v:tripCount,                         u:'',      c:'#60a5fa'},
            {e:'🎫',l:'Billets',    v:valid,                             u:'valides',c:'#a78bfa'},
            {e:'💰',l:'Dépenses',   v:totalFCFA.toLocaleString('fr-FR'),  u:'FCFA',  c:'#fbbf24'},
            {e:'🌿',l:'CO₂ évité', v:co2SavedKg.toFixed(1),              u:'kg',    c:'#34d399'},
          ].map((s,i)=>(
            <div key={i} className="card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{s.e}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{color:'#334155'}}>{s.l}</span>
              </div>
              <div className="font-black text-white" style={{fontSize:22}}>
                {s.v}<span className="text-xs font-semibold ml-1" style={{color:'#475569'}}>{s.u}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Eco */}
        <div className="rounded-2xl overflow-hidden" style={{background:'linear-gradient(135deg,rgba(5,79,44,.8),rgba(6,78,59,.8))',border:'1px solid rgba(5,150,105,.2)'}}>
          <div className="p-4 flex items-start gap-4">
            <div className="text-4xl">🌍</div>
            <div className="flex-1">
              <h4 className="font-black text-white">Impact Écologique</h4>
              <p className="text-sm mt-0.5 font-medium" style={{color:'#6ee7b7'}}>
                {co2SavedKg>0?`${co2SavedKg.toFixed(2)} kg CO₂ économisés`:'Faites votre premier voyage !'}
              </p>
              {tripCount>0&&<p className="text-xs mt-0.5" style={{color:'rgba(110,231,183,.5)'}}>≈ {(tripCount*3.2).toFixed(1)} km en voiture évités</p>}
            </div>
          </div>
          {co2SavedKg>0&&(
            <div className="px-4 pb-4">
              <div className="flex justify-between text-[10px] mb-1.5" style={{color:'rgba(110,231,183,.5)'}}>
                <span>Progression vers l'Or</span><span>{ecoPct.toFixed(0)}%</span>
              </div>
              <div className="rounded-full overflow-hidden" style={{height:5,background:'rgba(255,255,255,.08)'}}>
                <div className="h-full rounded-full transition-all duration-1000" style={{background:'linear-gradient(90deg,#059669,#34d399)',width:`${ecoPct}%`}}/>
              </div>
            </div>
          )}
        </div>

        {/* Fav stops */}
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{color:'var(--c-muted)'}}>
            ⭐ Arrêts favoris <span style={{color:'#1e293b'}}>({favStops.length})</span>
          </h3>
          {favStops.length===0 ? (
            <div className="card rounded-xl p-4 text-center text-xs" style={{color:'#334155'}}>Appuyez sur ☆ dans Arrêts pour ajouter vos favoris</div>
          ) : favStops.map(s=>(
            <div key={s.id} className="card rounded-xl p-3 mb-1.5 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm">{s.name}</div>
                <div className="text-xs" style={{color:'#475569'}}>{s.zone} · {s.operators.join(', ')}</div>
              </div>
              <button onClick={()=>dispatch(toggleFavStop(s.id))} className="text-lg hover:scale-125 transition-transform">⭐</button>
            </div>
          ))}
        </div>

        {/* Fav lines */}
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{color:'var(--c-muted)'}}>
            ❤️ Lignes favorites <span style={{color:'#1e293b'}}>({favLines.length})</span>
          </h3>
          {favLines.length===0 ? (
            <div className="card rounded-xl p-4 text-center text-xs" style={{color:'#334155'}}>Appuyez sur 🤍 dans Lignes pour sauvegarder vos lignes</div>
          ) : favLines.map(l=>(
            <div key={l.id} className="card rounded-xl p-3 mb-1.5 flex items-center gap-3">
              <div className="w-2 h-10 rounded-full" style={{background:l.color}}/>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm">{l.name}</div>
                <div className="text-xs truncate" style={{color:'#475569'}}>{l.route}</div>
              </div>
              <button onClick={()=>dispatch(toggleFavLine(l.id))} className="text-lg hover:scale-125 transition-transform">❤️</button>
            </div>
          ))}
        </div>

        {/* Logout */}
        <button onClick={()=>dispatch(logout())} className="btn btn-danger w-full py-3.5 rounded-2xl">
          Déconnexion ↩
        </button>
      </div>
    </div>
  );
}
