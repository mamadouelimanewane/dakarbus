import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateJourneyStatus, cancelJourney, setActiveTab, setFocusedLine, setMapCenter, setMapZoom } from '@/store/store';
import { walkingMinutes } from '@/utils/nearest';
import { getNextDepartures } from '@/data/transportData';
import type { JourneyStatus } from '@/types';

const STATUS_CONFIG: Record<JourneyStatus, { emoji: string; label: string; color: string }> = {
  walking:  { emoji: '🚶', label: 'En marche vers l\'arrêt', color: '#059669' },
  waiting:  { emoji: '🕐', label: 'En attente du bus',       color: '#d97706' },
  on_bus:   { emoji: '🚌', label: 'À bord du bus',           color: '#2563eb' },
  arrived:  { emoji: '🏁', label: 'Arrivé à destination !',  color: '#7c3aed' },
};

const STATUS_ORDER: JourneyStatus[] = ['walking', 'waiting', 'on_bus', 'arrived'];

// Live countdown component
function LiveCountdown({ seconds }: { seconds: number }) {
  const [s, setS] = useState(seconds);
  useEffect(() => {
    const t = setInterval(() => setS(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(s / 60), ss = s % 60;
  if (s <= 0) return <span className="text-emerald-400 font-black">Maintenant</span>;
  return <span>{m > 0 ? `${m}:${String(ss).padStart(2, '0')}` : `${ss}s`}</span>;
}

export default function ActiveJourneyPage() {
  const dispatch = useAppDispatch();
  const { active } = useAppSelector(s => s.journey);
  const { myTickets } = useAppSelector(s => s.tickets);
  const [elapsed, setElapsed] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!active) return null;

  const departures = getNextDepartures(active.walkingStop.id);
  const nextBus = departures.find(d => d.lineId === active.lineId) ?? departures[0];
  const currentIdx = STATUS_ORDER.indexOf(active.status);
  const walkMin = walkingMinutes(active.walkingMeters);
  const elapsedMin = Math.floor((Date.now() - active.startedAt) / 60000);
  const remainingMin = Math.max(0, active.estimatedDuration - elapsedMin);

  const ticket = myTickets.find(t => t.id === active.ticketId) ??
    (() => { const v = myTickets.filter(t => t.operator === active.operator && t.status === 'valid'); return v[v.length - 1]; })();

  // Auto-advance status simulation
  useEffect(() => {
    if (active.status === 'arrived') return;
    const delays: Record<JourneyStatus, number> = {
      walking: (active.walkingMeters > 60 ? walkMin : 1) * 60 * 1000,
      waiting: (nextBus?.waitMin ?? 5) * 60 * 1000,
      on_bus:  active.estimatedDuration * 60 * 1000 * 0.7,
      arrived: 0,
    };
    const delay = delays[active.status];
    const t = setTimeout(() => {
      const next = STATUS_ORDER[currentIdx + 1];
      if (next) dispatch(updateJourneyStatus(next));
    }, delay);
    return () => clearTimeout(t);
  }, [active.status]);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - active.startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [active.startedAt]);

  const focusMapOnLine = () => {
    dispatch(setFocusedLine(active.lineId));
    dispatch(setMapCenter([active.walkingStop.lat, active.walkingStop.lng]));
    dispatch(setMapZoom(14));
    dispatch(setActiveTab('plan'));
  };

  const statusCfg = STATUS_CONFIG[active.status];
  const progressPct = Math.min(100, (elapsedMin / active.estimatedDuration) * 100);

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6">

      {/* Header card — status hero */}
      <div className="m-4 rounded-3xl overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${statusCfg.color}22 0%, var(--c-surface) 100%)`, border: `1px solid ${statusCfg.color}30` }}>
        <div className="p-5 text-center">
          <div className="text-5xl mb-3 animate-bounce">{statusCfg.emoji}</div>
          <h2 className="text-xl font-black text-white">{statusCfg.label}</h2>
          <p className="text-sm mt-1" style={{ color: statusCfg.color }}>
            {active.originStop.name} → {active.destinationStop.name}
          </p>
        </div>

        {/* Progress bar */}
        <div className="px-5 pb-5">
          <div className="flex justify-between text-[10px] mb-1.5" style={{ color: 'rgba(255,255,255,.3)' }}>
            <span>Départ</span>
            <span>{progressPct.toFixed(0)}%</span>
            <span>Arrivée</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(255,255,255,.08)' }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ background: `linear-gradient(90deg, ${statusCfg.color}, ${statusCfg.color}88)`, width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Journey steps indicator */}
      <div className="mx-4 mb-4 flex items-center">
        {STATUS_ORDER.filter(s => s !== 'walking' || active.walkingMeters > 60).map((s, i, arr) => {
          const cfg = STATUS_CONFIG[s];
          const idx = STATUS_ORDER.indexOf(s);
          const done = currentIdx > idx;
          const current = currentIdx === idx;
          return (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${done || current ? '' : 'opacity-30'}`}
                  style={{
                    background: done ? cfg.color : current ? `${cfg.color}30` : 'rgba(255,255,255,.06)',
                    border: `2px solid ${current ? cfg.color : done ? cfg.color : 'rgba(255,255,255,.1)'}`,
                    boxShadow: current ? `0 0 20px ${cfg.color}55` : 'none',
                  }}>
                  {done ? '✓' : cfg.emoji}
                </div>
                <span className="text-[9px] font-bold" style={{ color: current ? 'white' : '#334155' }}>
                  {{ walking: 'Marche', waiting: 'Attente', on_bus: 'En bus', arrived: 'Arrivé' }[s]}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 rounded-full" style={{ background: done ? statusCfg.color : 'rgba(255,255,255,.08)' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Current step detail */}
      <div className="mx-4 mb-3 card rounded-2xl p-4">
        {active.status === 'walking' && (
          <>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--c-muted)' }}>À faire maintenant</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(5,150,105,.15)' }}>🚶</div>
              <div>
                <p className="font-bold text-white">Marchez vers {active.walkingStop.name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                  {active.walkingMeters} m · <LiveCountdown seconds={walkMin * 60} /> à pied
                </p>
              </div>
            </div>
          </>
        )}

        {active.status === 'waiting' && nextBus && (
          <>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--c-muted)' }}>Prochain bus</p>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-black" style={{ color: active.lineColor }}>
                <LiveCountdown seconds={nextBus.waitMin * 60} />
              </div>
              <div>
                <p className="font-bold text-white">{active.lineName}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Arrêt {active.walkingStop.name}</p>
              </div>
            </div>
          </>
        )}

        {active.status === 'on_bus' && (
          <>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--c-muted)' }}>Temps restant estimé</p>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-black text-blue-400">
                <LiveCountdown seconds={remainingMin * 60} />
              </div>
              <div>
                <p className="font-bold text-white">Vers {active.destinationStop.name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{active.lineName} en cours</p>
              </div>
            </div>
          </>
        )}

        {active.status === 'arrived' && (
          <div className="text-center py-2">
            <p className="text-2xl font-black text-white mb-1">Vous êtes arrivé ! 🎉</p>
            <p className="text-sm" style={{ color: '#64748b' }}>Durée totale : {elapsedMin} min · {active.fare} FCFA · ~{(active.estimatedDuration * 0.008).toFixed(2)} kg CO₂ économisé</p>
          </div>
        )}
      </div>

      {/* Ticket */}
      {ticket && active.status !== 'arrived' && (
        <div className="mx-4 mb-3 card rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--c-muted)' }}>Mon billet</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}>QR</div>
            <div className="flex-1">
              <p className="font-bold text-white text-sm">{ticket.operator} · {ticket.price} FCFA</p>
              <p className="text-xs" style={{ color: '#64748b' }}>Valide · #{ticket.id}</p>
            </div>
            <button onClick={() => dispatch(setActiveTab('tickets'))}
              className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11 }}>
              Afficher QR
            </button>
          </div>
        </div>
      )}

      {!ticket && active.status !== 'arrived' && (
        <div className="mx-4 mb-3 rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'rgba(217,119,6,.08)', border: '1px solid rgba(217,119,6,.25)' }}>
          <span className="text-xl">🎫</span>
          <p className="text-xs text-white flex-1">Vous n'avez pas encore acheté de billet pour ce trajet.</p>
          <button onClick={() => dispatch(setActiveTab('tickets'))}
            className="btn btn-primary flex-shrink-0" style={{ padding: '5px 12px', fontSize: 11 }}>
            Acheter
          </button>
        </div>
      )}

      {/* Map shortcut */}
      <button onClick={focusMapOnLine}
        className="mx-4 mb-3 flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[.98]"
        style={{ background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.2)' }}>
        <span className="text-xl">🗺️</span>
        <div className="text-left">
          <p className="font-bold text-white text-sm">Voir sur la carte</p>
          <p className="text-xs" style={{ color: '#64748b' }}>Suivre la ligne {active.lineName} en temps réel</p>
        </div>
        <span className="ml-auto" style={{ color: '#475569' }}>→</span>
      </button>

      {/* Cancel */}
      {active.status !== 'arrived' && (
        <div className="mx-4">
          {!showCancelConfirm ? (
            <button onClick={() => setShowCancelConfirm(true)}
              className="w-full py-3 rounded-xl text-xs font-bold transition-colors"
              style={{ color: '#475569' }}>
              Annuler le trajet
            </button>
          ) : (
            <div className="card rounded-2xl p-4">
              <p className="text-sm font-bold text-white mb-3 text-center">Annuler ce trajet ?</p>
              <div className="flex gap-2">
                <button onClick={() => { dispatch(cancelJourney()); dispatch(setActiveTab('plan')); }}
                  className="flex-1 py-2 rounded-xl text-sm font-black btn btn-danger">Oui, annuler</button>
                <button onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2 rounded-xl text-sm btn btn-ghost">Continuer</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
