import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout, acknowledgeReport, showToast } from '@/store/store';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { LINES, OPERATORS } from '@/data/transportData';
import { MOCK_DRIVERS } from '@/services/simulation';
import type { BusPosition, OperatorId } from '@/types';
import ToastContainer from '@/components/ToastContainer';

const makeBusIcon = (color: string) => L.divIcon({
  className:'',
  html:`<div style="width:22px;height:22px;position:relative"><div style="position:absolute;inset:0;border-radius:50%;background:${color}25;animation:pulse-ring 2.5s ease-out infinite"></div><div style="position:absolute;inset:3px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 16px ${color}99;display:flex;align-items:center;justify-content:center;font-size:8px">🚌</div></div><style>@keyframes pulse-ring{0%{transform:scale(.8);opacity:.8}100%{transform:scale(2.2);opacity:0}}</style>`,
  iconSize:[22,22], iconAnchor:[11,11],
});

interface FleetBus { id:string; plate:string; operator:string; lineId:string; status:'active'|'maintenance'|'idle'; driver:string; driverPhone:string; }
const INITIAL_FLEET: FleetBus[] = Object.entries(MOCK_DRIVERS).map(([busId,d]) => ({
  id:busId, plate:d.plate, operator:d.operator, lineId:d.lineId, status:'active', driver:d.name, driverPhone:d.phone,
}));

const opColor = (op:string) => OPERATORS[op]?.color || '#64748b';

export default function AdminApp() {
  const dispatch = useAppDispatch();
  const { busPositions }              = useAppSelector(s => s.mobility);
  const { adminRevenue, reports }     = useAppSelector(s => s.tickets);
  const { name }                      = useAppSelector(s => s.auth);
  const [activeTab, setActiveTab]     = useState<'map'|'fleet'|'routes'|'alerts'|'finance'>('map');
  const [selectedLine, setSelectedLine] = useState<string|null>(null);
  const [fleet, setFleet]             = useState<FleetBus[]>(INITIAL_FLEET);
  const [showAdd, setShowAdd]         = useState(false);
  const [newBus, setNewBus]           = useState({ plate:'', operator:'DDD', lineId:'L8', driver:'', driverPhone:'' });
  const [errors, setErrors]           = useState<Record<string,string>>({});
  const [editId, setEditId]           = useState<string|null>(null);
  const [searchQ, setSearchQ]         = useState('');

  const focusedBuses = selectedLine ? busPositions.filter((b:BusPosition)=>b.lineId===selectedLine) : busPositions;
  const focusedLine  = selectedLine ? LINES.find(l=>l.id===selectedLine) : null;
  const pendingAlerts = reports.filter(r=>Date.now()-r.timestamp < 1000*60*60).length;
  const totalRevenue  = (['DDD','AFTU','BRT','TER'] as OperatorId[]).reduce((s,op)=>s+adminRevenue[op],0);

  const filteredFleet = fleet.filter(b =>
    [b.plate,b.driver,b.lineId,b.operator].some(f=>f.toLowerCase().includes(searchQ.toLowerCase()))
  );

  const addBus = () => {
    const e:Record<string,string>={};
    if (!newBus.plate)  e.plate='Requis';
    if (!newBus.driver) e.driver='Requis';
    setErrors(e);
    if (Object.keys(e).length) return;
    setFleet(f=>[...f,{...newBus,id:`bus_${Date.now()}`,status:'active'}]);
    dispatch(showToast({type:'success',message:'Véhicule ajouté à la flotte !'}));
    setShowAdd(false); setNewBus({plate:'',operator:'DDD',lineId:'L8',driver:'',driverPhone:''});
  };

  const exportCSV = () => {
    const rows = [['Operateur','Revenus (FCFA)','Part (%)'],
      ...(['DDD','AFTU','BRT','TER'] as OperatorId[]).map(op=>[op,adminRevenue[op].toString(),totalRevenue>0?((adminRevenue[op]/totalRevenue)*100).toFixed(1)+'%':'0%']),
      ['TOTAL',totalRevenue.toString(),'100%']];
    const blob = new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv;charset=utf-8;'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=`dakarbus_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    dispatch(showToast({type:'success',message:'Export CSV téléchargé !'}));
  };

  const tabs: {id:typeof activeTab; label:string; icon:string; badge?:number}[] = [
    {id:'map',label:'Carte',icon:'🗺️'},{id:'fleet',label:'Flotte',icon:'🚌'},
    {id:'routes',label:'Lignes',icon:'🛤️'},{id:'alerts',label:'Alertes',icon:'⚠️',badge:pendingAlerts},
    {id:'finance',label:'Revenus',icon:'💰'},
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{background:'var(--c-bg)'}}>
      <ToastContainer />

      {/* Header */}
      <header className="flex-shrink-0 h-14 flex items-center justify-between px-4"
        style={{background:'rgba(10,15,30,.95)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--c-border)'}}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{background:'linear-gradient(135deg,#5b21b6,#7c3aed)',boxShadow:'0 4px 16px rgba(124,58,237,.4)',fontSize:16}}>🛡️</div>
          <div>
            <div className="text-sm font-black text-white leading-none">Admin · {name}</div>
            <div className="text-[10px] font-semibold mt-0.5" style={{color:'#a78bfa'}}>SunuBus · Supervision</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="badge badge-live px-2 py-1 rounded-lg text-[10px] font-black"
            style={{background:'rgba(5,150,105,.1)',color:'#34d399',border:'1px solid rgba(5,150,105,.2)'}}>
            {busPositions.length} actifs
          </div>
          <button onClick={()=>dispatch(logout())} className="btn btn-danger" style={{padding:'5px 10px',fontSize:11}}>Déco.</button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex-shrink-0 flex" style={{background:'rgba(10,15,30,.9)',borderBottom:'1px solid var(--c-border)'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors"
            style={{color:activeTab===t.id?'#a78bfa':'#475569',borderBottom:activeTab===t.id?'2px solid #7c3aed':'2px solid transparent'}}>
            <span className="text-sm">{t.icon}</span>
            <span className="text-[9px]">{t.label}</span>
            {t.badge != null && t.badge>0 && (
              <span className="absolute top-1 right-1/4 w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center"
                style={{background:'#dc2626',boxShadow:'0 2px 8px rgba(220,38,38,.5)'}}>
                {t.badge>9?'9+':t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── MAP ── */}
        {activeTab==='map' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar */}
            <aside className="w-60 flex flex-col overflow-hidden flex-shrink-0"
              style={{background:'var(--c-surface)',borderRight:'1px solid var(--c-border)'}}>
              <div className="p-3 flex-shrink-0" style={{borderBottom:'1px solid var(--c-border)'}}>
                <button onClick={()=>setSelectedLine(null)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-black transition-all mb-2"
                  style={!selectedLine?{background:'rgba(124,58,237,.2)',color:'#c4b5fd',border:'1px solid rgba(124,58,237,.3)'}:{color:'#64748b'}}>
                  🌐 Toutes · {busPositions.length} bus
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {LINES.map(line=>{
                  const n=busPositions.filter((b:BusPosition)=>b.lineId===line.id).length;
                  const a=selectedLine===line.id;
                  return (
                    <button key={line.id} onClick={()=>setSelectedLine(a?null:line.id)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl mb-0.5 text-left transition-all"
                      style={{background:a?'rgba(255,255,255,.07)':'transparent'}}
                      onMouseEnter={e=>{if(!a)(e.currentTarget.style.background='rgba(255,255,255,.04)');}}
                      onMouseLeave={e=>{if(!a)(e.currentTarget.style.background='transparent');}}>
                      <span className="w-1.5 h-6 rounded-full flex-shrink-0" style={{background:line.color}}/>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{line.name}</div>
                        <div className="text-[9px] truncate" style={{color:'#475569'}}>{line.operator}</div>
                      </div>
                      {n>0 && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0"
                        style={{background:'rgba(34,197,94,.15)',color:'#4ade80'}}>{n}</span>}
                    </button>
                  );
                })}
              </div>
              {focusedLine && (
                <div className="p-3 flex-shrink-0" style={{borderTop:'1px solid var(--c-border)',background:'rgba(255,255,255,.02)'}}>
                  <div className="text-xs font-black mb-2" style={{color:focusedLine.color}}>● {focusedLine.name}</div>
                  <p className="text-[10px] mb-1" style={{color:'#64748b'}}>{focusedLine.route}</p>
                  {focusedBuses.map((b:BusPosition,i:number)=>{
                    const d=MOCK_DRIVERS[b.busId]??Object.values(MOCK_DRIVERS).find(d=>d.lineId===b.lineId);
                    return (
                      <div key={i} className="mt-1.5 p-2 rounded-xl" style={{background:'rgba(255,255,255,.04)',border:'1px solid var(--c-border)'}}>
                        <div className="flex justify-between"><span className="text-[10px] font-black text-white">{d?.plate??'N/A'}</span>
                          <span className="text-[10px] font-bold" style={{color:'#4ade80'}}>{b.speed} km/h</span></div>
                        <div className="text-[10px] mt-0.5" style={{color:'#64748b'}}>{d?.name??'—'}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </aside>

            <div className="flex-1">
              <MapContainer center={[14.7167,-17.4677]} zoom={12} style={{width:'100%',height:'100%'}} zoomControl={true}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="" />
                {busPositions.map((bus:BusPosition,i:number)=>{
                  const line=LINES.find(l=>l.id===bus.lineId);
                  const color=line?.color||'#10b981';
                  const d=MOCK_DRIVERS[bus.busId]??Object.values(MOCK_DRIVERS).find(d=>d.lineId===bus.lineId);
                  if(selectedLine&&bus.lineId!==selectedLine) return null;
                  return (
                    <Marker key={i} position={[bus.lat,bus.lng]} icon={makeBusIcon(color)}>
                      <Popup minWidth={200}>
                        <div style={{padding:12,fontFamily:'Inter',fontSize:12}}>
                          <div style={{fontWeight:900,color,marginBottom:6}}>{line?.name} — {line?.operator}</div>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,color:'#94a3b8'}}>
                            <span>🚌 {d?.plate??'N/A'}</span>
                            <span style={{color:'#4ade80',fontWeight:700}}>{bus.speed} km/h</span>
                            <span>👤 {d?.name??'—'}</span>
                            <span>👥 {bus.occupancy}%</span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        )}

        {/* ── FLEET ── */}
        {activeTab==='fleet' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-white">{fleet.length} véhicules</h2>
              <button onClick={()=>setShowAdd(true)} className="btn btn-primary">+ Ajouter</button>
            </div>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 Rechercher…" className="input mb-4" />

            {showAdd && (
              <div className="card rounded-2xl p-4 mb-4 animate-fade-up">
                <h3 className="font-black text-white text-sm mb-3">Nouveau véhicule</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[{k:'plate',ph:'DK-1234-AB'},{k:'driver',ph:'Prénom Nom'},{k:'driverPhone',ph:'+221 77 …'}].map(f=>(
                    <div key={f.k}>
                      <input placeholder={f.ph} value={(newBus as any)[f.k]}
                        onChange={e=>setNewBus(p=>({...p,[f.k]:e.target.value}))}
                        className={`input ${errors[f.k]?'border-red-500':''}`} />
                      {errors[f.k] && <p className="text-[10px] text-red-400 mt-0.5">{errors[f.k]}</p>}
                    </div>
                  ))}
                  <select value={newBus.operator} onChange={e=>setNewBus(p=>({...p,operator:e.target.value,lineId:LINES.find(l=>l.operator===e.target.value)?.id||'L8'}))}
                    className="input">
                    {['DDD','AFTU','BRT','TER'].map(op=><option key={op}>{op}</option>)}
                  </select>
                  <select value={newBus.lineId} onChange={e=>setNewBus(p=>({...p,lineId:e.target.value}))} className="input">
                    {LINES.filter(l=>l.operator===newBus.operator).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={addBus} className="btn btn-primary flex-1">✓ Enregistrer</button>
                  <button onClick={()=>{setShowAdd(false);setErrors({});}} className="btn btn-ghost px-5">Annuler</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {filteredFleet.map(bus=>{
                const line=LINES.find(l=>l.id===bus.lineId);
                const isLive=busPositions.some((b:BusPosition)=>b.lineId===bus.lineId);
                return (
                  <div key={bus.id} className={`card rounded-2xl p-4 transition-all ${editId===bus.id?'card-active':''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{background:opColor(bus.operator)+'20'}}>🚌</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="font-black text-white text-sm">{bus.plate}</span>
                          <span className="badge text-white" style={{background:opColor(bus.operator)}}>{bus.operator}</span>
                          <span className="badge" style={isLive?{background:'rgba(34,197,94,.15)',color:'#4ade80'}:{background:'rgba(255,255,255,.05)',color:'#475569'}}>
                            {isLive?'● Live':'○ Inactif'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs" style={{color:'#64748b'}}>
                          <span>👤 {bus.driver}</span>
                          {bus.driverPhone&&<span>📞 {bus.driverPhone}</span>}
                          {line&&<span style={{color:line.color}}>🛤️ {line.name}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={()=>setEditId(editId===bus.id?null:bus.id)} className="btn btn-ghost" style={{padding:'5px 10px',fontSize:11}}>✎</button>
                        <button onClick={()=>{setFleet(f=>f.filter(b=>b.id!==bus.id));dispatch(showToast({type:'info',message:'Bus retiré.'}));}}
                          className="btn btn-danger" style={{padding:'5px 10px',fontSize:11}}>✕</button>
                      </div>
                    </div>
                    {editId===bus.id && (
                      <div className="mt-3 pt-3 grid grid-cols-2 gap-2" style={{borderTop:'1px solid var(--c-border)'}}>
                        {(['plate','driver','driverPhone'] as const).map(f=>(
                          <input key={f} value={bus[f]} placeholder={f} className="input"
                            onChange={e=>setFleet(p=>p.map(b=>b.id===bus.id?{...b,[f]:e.target.value}:b))} />
                        ))}
                        <button onClick={()=>setEditId(null)} className="btn btn-primary col-span-2">✓ Sauvegarder</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ROUTES ── */}
        {activeTab==='routes' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-white">{LINES.length} lignes</h2>
              <span className="badge" style={{background:'rgba(34,197,94,.1)',color:'#4ade80',border:'1px solid rgba(34,197,94,.2)'}}>
                {busPositions.length} bus actifs
              </span>
            </div>
            {(['DDD','AFTU','BRT','TER'] as const).map(op=>{
              const opLines=LINES.filter(l=>l.operator===op);
              if(!opLines.length) return null;
              return (
                <div key={op} className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{background:opColor(op)}}/>
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{color:opColor(op)}}>{OPERATORS[op]?.fullName}</span>
                    <span className="text-[9px]" style={{color:'#334155'}}>({opLines.length})</span>
                  </div>
                  {opLines.map(line=>{
                    const n=busPositions.filter((b:BusPosition)=>b.lineId===line.id).length;
                    return (
                      <div key={line.id} className="card rounded-xl p-3 mb-1.5 flex items-center gap-3">
                        <span className="w-1.5 h-10 rounded-full flex-shrink-0" style={{background:line.color}}/>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white text-sm">{line.name}</div>
                          <div className="text-xs truncate" style={{color:'#64748b'}}>{line.route}</div>
                          <div className="text-[9px] mt-0.5" style={{color:'#334155'}}>{line.stops.length} arrêts · {line.freq} · {line.tarif} FCFA</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-black" style={{color:n>0?'#4ade80':'#1e293b'}}>{n}</div>
                          <div className="text-[9px]" style={{color:'#334155'}}>bus</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ── ALERTS ── */}
        {activeTab==='alerts' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-white">Incidents signalés</h2>
              <span className={`badge ${pendingAlerts>0?'':'opacity-60'}`}
                style={pendingAlerts>0?{background:'rgba(220,38,38,.1)',color:'#f87171',border:'1px solid rgba(220,38,38,.2)'}:{background:'rgba(34,197,94,.1)',color:'#4ade80',border:'1px solid rgba(34,197,94,.2)'}}>
                {pendingAlerts>0?`${pendingAlerts} en cours`:'✓ RAS'}
              </span>
            </div>
            {reports.length===0 ? (
              <div className="text-center py-16" style={{color:'#1e293b'}}>
                <div className="text-5xl mb-3">✅</div>
                <p className="font-bold">Aucun incident</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map(r=>{
                  const meta={
                    delay:{e:'🐌',c:'#d97706',l:'Retard'},accident:{e:'💥',c:'#dc2626',l:'Accident'},
                    crowd:{e:'👥',c:'#2563eb',l:'Affluence'},other:{e:'⚠️',c:'#64748b',l:'Autre'},
                  }[r.type]||{e:'⚠️',c:'#64748b',l:'Incident'};
                  const min=Math.floor((Date.now()-r.timestamp)/60000);
                  return (
                    <div key={r.id} className="card rounded-2xl p-4">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{background:meta.c+'20'}}>{meta.e}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-white text-sm">{meta.l}</span>
                            <span className="badge" style={{background:meta.c+'25',color:'white'}}>
                              Il y a {min<1?'<1':min} min
                            </span>
                            <span className="badge" style={{background:'rgba(255,255,255,.05)',color:'#64748b'}}>👍 {r.upvotes}</span>
                          </div>
                          <p className="text-xs mt-1.5 leading-relaxed" style={{color:'#94a3b8'}}>{r.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>dispatch(acknowledgeReport(r.id))&&dispatch(showToast({type:'success',message:'Acquitté.'}))}
                          className="btn" style={{padding:'5px 12px',fontSize:11,background:'rgba(34,197,94,.1)',color:'#4ade80',border:'1px solid rgba(34,197,94,.2)'}}>
                          ✓ Acquitter
                        </button>
                        <button className="btn" style={{padding:'5px 12px',fontSize:11,background:'rgba(124,58,237,.1)',color:'#a78bfa',border:'1px solid rgba(124,58,237,.2)'}}>
                          📞 Contacter
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── FINANCE ── */}
        {activeTab==='finance' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Hero */}
            <div className="rounded-3xl p-6 relative overflow-hidden"
              style={{background:'linear-gradient(135deg,#4c1d95,#2563eb)',boxShadow:'0 24px 60px rgba(109,40,217,.3)'}}>
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10" style={{background:'white'}}/>
              <p className="text-sm font-semibold mb-2 relative" style={{color:'rgba(216,180,254,.8)'}}>CA Global · Aujourd'hui</p>
              <h3 className="text-4xl font-black text-white tracking-tight relative">
                {totalRevenue.toLocaleString('fr-FR')}<span className="text-xl ml-1" style={{color:'rgba(216,180,254,.7)'}}>F</span>
              </h3>
              <div className="mt-3 flex items-center gap-2 relative">
                <span className="badge" style={{background:'rgba(74,222,128,.2)',color:'#4ade80'}}>↑ +14.5%</span>
                <span className="text-xs" style={{color:'rgba(216,180,254,.6)'}}>vs hier</span>
              </div>
            </div>

            {/* Per-operator grid */}
            <div className="grid grid-cols-2 gap-3">
              {(['DDD','AFTU','BRT','TER'] as OperatorId[]).map(op=>{
                const pct=totalRevenue>0?(adminRevenue[op]/totalRevenue*100):0;
                return (
                  <div key={op} className="card rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-3 h-3 rounded-full" style={{background:opColor(op)}}/>
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{color:'#475569'}}>{op}</span>
                    </div>
                    <div className="text-xl font-black text-white mb-2">
                      {adminRevenue[op].toLocaleString('fr-FR')} <span className="text-[10px]" style={{color:'#334155'}}>FCFA</span>
                    </div>
                    <div className="rounded-full overflow-hidden mb-1.5" style={{height:4,background:'rgba(255,255,255,.06)'}}>
                      <div className="h-full rounded-full transition-all duration-700" style={{background:opColor(op),width:`${pct.toFixed(0)}%`}}/>
                    </div>
                    <p className="text-[10px]" style={{color:'#334155'}}>{pct.toFixed(1)}%</p>
                  </div>
                );
              })}
            </div>

            {/* Transactions */}
            <div className="card rounded-2xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest" style={{color:'#475569'}}>Transactions récentes</h3>
                <button onClick={exportCSV} className="btn" style={{padding:'5px 10px',fontSize:11,background:'rgba(5,150,105,.15)',color:'#34d399',border:'1px solid rgba(5,150,105,.2)'}}>⬇ CSV</button>
              </div>
              <div className="space-y-2">
                {[{id:'T-8F9A',op:'BRT',p:300,t:"À l'instant",m:'Wave'},
                  {id:'T-2B4C',op:'DDD',p:200,t:'Il y a 2 min',m:'Orange Money'},
                  {id:'T-9D1E',op:'AFTU',p:150,t:'Il y a 5 min',m:'Wave'},
                  {id:'T-5C7F',op:'TER',p:500,t:'Il y a 8 min',m:'Free Money'},
                ].map((tx,i)=>(
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{background:'rgba(255,255,255,.03)'}}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-xs flex-shrink-0"
                      style={{background:opColor(tx.op)}}>{tx.op[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-white">{tx.id}</div>
                      <div className="text-[10px]" style={{color:'#475569'}}>{tx.t} · {tx.m}</div>
                    </div>
                    <div className="font-black text-sm" style={{color:'#4ade80'}}>+{tx.p} F</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
