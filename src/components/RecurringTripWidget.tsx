import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addRecurringTrip, removeRecurringTrip, earnBadge, addPoints, setRouteOrigin, setRouteDestination, setActiveTab } from '@/store/store';
import { STOPS } from '@/data/transportData';
import { haptic } from '@/utils/haptic';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function RecurringTripWidget() {
  const dispatch = useAppDispatch();
  const { recurringTrips } = useAppSelector(s => s.gamif);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [originId, setOriginId] = useState('');
  const [destId, setDestId] = useState('');
  const [days, setDays] = useState<number[]>([1,2,3,4,5]);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(30);

  const toggleDay = (d: number) => setDays(ds => ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d].sort());

  const save = () => {
    if (!originId || !destId) return;
    haptic('medium');
    dispatch(addRecurringTrip({
      label: label || `${STOPS.find(s=>s.id===originId)?.name} → ${STOPS.find(s=>s.id===destId)?.name}`,
      originId, destId, days, hour, minute,
    }));
    dispatch(earnBadge('planner'));
    dispatch(addPoints(10));
    setOpen(false);
    setOriginId(''); setDestId(''); setLabel(''); setDays([1,2,3,4,5]);
  };

  const now = new Date();
  const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const todayTrips = recurringTrips.filter(t => t.days.includes(todayIdx));

  const launch = (t: typeof recurringTrips[0]) => {
    haptic('medium');
    const o = STOPS.find(s => s.id === t.originId);
    const d = STOPS.find(s => s.id === t.destId);
    if (o) dispatch(setRouteOrigin(o));
    if (d) dispatch(setRouteDestination(d));
    dispatch(setActiveTab('plan'));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>
          📅 Trajets récurrents
        </p>
        <button onClick={() => setOpen(o => !o)}
          className="text-[10px] font-black px-3 py-2 rounded-xl transition-all active:scale-95"
          style={{ minHeight: 40 }}
          style={{ background: 'rgba(37,99,235,.12)', color: '#60a5fa' }}>
          {open ? '✕ Fermer' : '+ Ajouter'}
        </button>
      </div>

      {/* Today alert */}
      {todayTrips.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {todayTrips.map(t => {
            const tripMins = t.hour * 60 + t.minute;
            const diff = tripMins - nowMins;
            const soon = diff >= 0 && diff <= 30;
            return (
              <button key={t.id} onClick={() => launch(t)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-[.98]"
                style={{ background: soon ? 'rgba(37,99,235,.15)' : 'rgba(255,255,255,.04)', border: `1px solid ${soon ? 'rgba(37,99,235,.35)' : 'rgba(255,255,255,.07)'}` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: soon ? 'rgba(37,99,235,.3)' : 'rgba(255,255,255,.06)' }}>
                  {soon ? '⏰' : '📅'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-white truncate">{t.label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: '#475569' }}>
                    {String(t.hour).padStart(2,'0')}:{String(t.minute).padStart(2,'0')} · {t.days.map(d => DAYS[d]).join(', ')}
                  </div>
                </div>
                {soon && <span className="text-[10px] font-black px-2 py-1 rounded-lg flex-shrink-0"
                  style={{ background: 'rgba(37,99,235,.3)', color: '#60a5fa' }}>
                  {diff <= 0 ? 'Maintenant' : `${diff} min`}
                </span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Form */}
      {open && (
        <div className="rounded-2xl p-4 space-y-3 mb-2" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}>
          <input value={label} onChange={e => setLabel(e.target.value)}
            placeholder="Nom du trajet (optionnel)"
            className="w-full rounded-xl px-3 py-2 text-xs text-white outline-none"
            style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)' }} />
          <select value={originId} onChange={e => setOriginId(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-xs text-white outline-none"
            style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)' }}>
            <option value="">Départ…</option>
            {STOPS.slice(0,60).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={destId} onChange={e => setDestId(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-xs text-white outline-none"
            style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)' }}>
            <option value="">Destination…</option>
            {STOPS.slice(0,60).filter(s => s.id !== originId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="flex gap-1.5">
            {DAYS.map((d, i) => (
              <button key={i} onClick={() => toggleDay(i)}
                className="flex-1 py-1.5 rounded-xl text-[10px] font-black transition-all active:scale-90"
                style={{ background: days.includes(i) ? '#2563eb' : 'rgba(255,255,255,.05)', color: days.includes(i) ? 'white' : '#334155' }}>
                {d}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold" style={{ color: '#475569' }}>Heure :</span>
            <select value={hour} onChange={e => setHour(+e.target.value)}
              className="rounded-xl px-2 py-1.5 text-xs text-white outline-none"
              style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)' }}>
              {Array.from({length:24},(_,i)=>i).map(h => <option key={h} value={h}>{String(h).padStart(2,'0')}</option>)}
            </select>
            <span className="text-white font-black">:</span>
            <select value={minute} onChange={e => setMinute(+e.target.value)}
              className="rounded-xl px-2 py-1.5 text-xs text-white outline-none"
              style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)' }}>
              {[0,5,10,15,20,25,30,35,40,45,50,55].map(m => <option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
            </select>
          </div>
          <button onClick={save} disabled={!originId || !destId}
            className="w-full py-2.5 rounded-xl font-black text-xs text-white transition-all active:scale-95"
            style={{ background: originId && destId ? 'rgba(37,99,235,.9)' : 'rgba(255,255,255,.05)' }}>
            ✅ Enregistrer le trajet récurrent
          </button>
        </div>
      )}

      {/* All trips list */}
      {recurringTrips.length > 0 && !open && (
        <div className="space-y-1">
          {recurringTrips.map(t => (
            <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,.03)' }}>
              <span className="text-base">📅</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{t.label}</div>
                <div className="text-[11px]" style={{ color: '#334155' }}>{t.days.map(d=>DAYS[d]).join(', ')} · {String(t.hour).padStart(2,'0')}:{String(t.minute).padStart(2,'0')}</div>
              </div>
              <button onClick={() => dispatch(removeRecurringTrip(t.id))}
                className="text-[10px] w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(220,38,38,.1)', color: '#f87171' }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
