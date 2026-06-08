import React, { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  updateJourneyStatus, cancelJourney, setActiveTab,
  setFocusedLine, setMapCenter, setMapZoom, showToast,
} from '@/store/store';
import { walkingMinutes } from '@/utils/nearest';
import { getNextDepartures } from '@/data/transportData';
import { STOPS, LINES } from '@/data/transportData';
import WalkToStopGuide from '@/components/WalkToStopGuide';
import type { JourneyStatus } from '@/types';
import type { RouteStep } from '@/utils/routeFinder';

const STATUS_CONFIG: Record<JourneyStatus, { emoji: string; label: string; color: string }> = {
  walking:  { emoji: '🚶', label: 'En marche vers l\'arrêt', color: '#059669' },
  waiting:  { emoji: '🕐', label: 'En attente du bus',       color: '#d97706' },
  on_bus:   { emoji: '🚌', label: 'À bord du bus',           color: '#2563eb' },
  arrived:  { emoji: '🏁', label: 'Arrivé à destination !',  color: '#7c3aed' },
};
const STATUS_ORDER: JourneyStatus[] = ['walking', 'waiting', 'on_bus', 'arrived'];

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

// Mini step-by-step directions panel
function TurnByTurnPanel({ steps, currentStatus, walkingStopName }: {
  steps: RouteStep[];
  currentStatus: JourneyStatus;
  walkingStopName: string;
}) {
  return (
    <div className="mx-4 mb-3 card rounded-2xl overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b" style={{ borderColor: 'var(--c-border)' }}>
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>
          Itinéraire détaillé
        </p>
      </div>
      {steps.map((step, i) => {
        const stopFrom = step.fromStopId ? STOPS.find(s => s.id === step.fromStopId) : null;
        const stopTo   = step.toStopId   ? STOPS.find(s => s.id === step.toStopId)   : null;
        const line     = step.lineId     ? LINES.find(l => l.id === step.lineId)      : null;
        const stepColor = step.color || (step.type === 'walk' ? '#059669' : '#2563eb');
        const isCurrent = (step.type === 'walk' && currentStatus === 'walking')
          || (step.type === 'bus' && (currentStatus === 'waiting' || currentStatus === 'on_bus'))
          || (step.type === 'transfer');

        // Libellé principal
        let label = '';
        if (step.type === 'walk') {
          label = `🚶 Marcher vers ${walkingStopName}`;
        } else if (step.type === 'transfer') {
          label = `🔄 Correspondance${stopFrom ? ` à ${stopFrom.name}` : ''}`;
        } else {
          const lineName = line?.name || step.label?.split('·')[0]?.trim() || 'Bus';
          label = `🚌 Prendre ${lineName}`;
        }

        // Sous-libellé pour les étapes bus
        let sublabel = '';
        if (step.type === 'bus') {
          const from = stopFrom?.name || (step.fromStopId ? `Arrêt ${step.fromStopId}` : null);
          const to   = stopTo?.name   || (step.toStopId   ? `Arrêt ${step.toStopId}`   : null);
          if (from && to)      sublabel = `${from} → ${to}`;
          else if (from)       sublabel = `Depuis ${from}`;
          else if (line?.route) sublabel = line.route;
        }

        return (
          <div key={i} className="flex items-start gap-3 px-4 py-3"
            style={{
              borderTop: i > 0 ? '1px solid var(--c-border)' : 'none',
              background: isCurrent ? stepColor + '10' : 'transparent',
            }}>
            {/* Dot + vertical line */}
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                style={{ background: stepColor + '22', border: `1.5px solid ${isCurrent ? stepColor : 'transparent'}` }}>
                {step.type === 'walk' ? '🚶' : step.type === 'transfer' ? '🔄' : line?.operator === 'TER' ? '🚆' : line?.operator === 'BRT' ? '🚍' : '🚌'}
              </div>
              {i < steps.length - 1 && (
                <div className="w-0.5 flex-1 rounded-full mt-0.5" style={{ minHeight: 12, background: 'var(--c-border)' }} />
              )}
            </div>

            <div className="flex-1 min-w-0 py-0.5">
              <p className="text-sm font-bold leading-snug" style={{ color: isCurrent ? 'white' : '#94a3b8' }}>
                {label}
              </p>
              {sublabel && (
                <p className="text-xs mt-0.5 leading-snug" style={{ color: '#475569' }}>{sublabel}</p>
              )}
              {step.type === 'bus' && line && (
                <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-lg mt-1 text-white"
                  style={{ background: stepColor }}>
                  {line.name} · {line.tarif} FCFA
                </span>
              )}
            </div>

            <span className="text-xs font-black flex-shrink-0 mt-1"
              style={{ color: isCurrent ? stepColor : '#334155' }}>
              {step.durationMin} min
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ActiveJourneyPage({ onGoToMap }: { onGoToMap?: () => void } = {}) {
  const dispatch = useAppDispatch();
  const { active } = useAppSelector(s => s.journey);
  const { myTickets } = useAppSelector(s => s.tickets);
  const { userLocation } = useAppSelector(s => s.mobility);
  const [elapsed, setElapsed] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showWalkGuide, setShowWalkGuide] = useState(false);
  const prevStatus = useRef<JourneyStatus | null>(null);

  // ── All effects BEFORE early return (Rules of Hooks) ──────
  // Vibrate on status change
  useEffect(() => {
    if (!active) return;
    if (prevStatus.current && prevStatus.current !== active.status) {
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      const cfg = STATUS_CONFIG[active.status];
      dispatch(showToast({ type: 'info', message: `${cfg.emoji} ${cfg.label}` }));
    }
    prevStatus.current = active.status;
  }, [active?.status]);

  // Auto-advance status
  useEffect(() => {
    if (!active || active.status === 'arrived') return;
    const walkMin2 = walkingMinutes(active.walkingMeters);
    const departures2 = getNextDepartures(active.walkingStop.id);
    const nextBus2 = departures2.find(d => d.lineId === active.lineId) ?? departures2[0];
    const currentIdx2 = STATUS_ORDER.indexOf(active.status);
    const delays: Record<JourneyStatus, number> = {
      walking: (active.walkingMeters > 60 ? walkMin2 : 1) * 60 * 1000,
      waiting: (nextBus2?.waitMin ?? 5) * 60 * 1000,
      on_bus:  active.estimatedDuration * 60 * 1000 * 0.7,
      arrived: 0,
    };
    const t = setTimeout(() => {
      const next = STATUS_ORDER[currentIdx2 + 1];
      if (next) dispatch(updateJourneyStatus(next));
    }, delays[active.status]);
    return () => clearTimeout(t);
  }, [active?.status]);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - active.startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [active?.startedAt]);

  // ── Early return after ALL hooks ──────────────────────────
  if (!active) return null;

  const departures  = getNextDepartures(active.walkingStop.id);
  const nextBus     = departures.find(d => d.lineId === active.lineId) ?? departures[0];
  const currentIdx  = STATUS_ORDER.indexOf(active.status);
  const walkMin     = walkingMinutes(active.walkingMeters);
  const elapsedMin  = Math.floor((Date.now() - active.startedAt) / 60000);
  const remainingMin = Math.max(0, active.estimatedDuration - elapsedMin);

  const ticket = myTickets.find(t => t.id === active.ticketId)
    ?? (() => { const v = myTickets.filter(t => t.operator === active.operator && t.status === 'valid'); return v[v.length - 1]; })();

  const focusMap = () => {
    dispatch(setFocusedLine(active.lineId));
    dispatch(setMapCenter([active.walkingStop.lat, active.walkingStop.lng]));
    dispatch(setMapZoom(14));
    if (onGoToMap) {
      // Ferme le panel trajet et ouvre la vue carte Lignes
      onGoToMap();
    } else {
      dispatch(setActiveTab('lines'));
    }
  };

  const statusCfg  = STATUS_CONFIG[active.status];
  const progressPct = Math.min(100, (elapsedMin / active.estimatedDuration) * 100);

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6">

      {/* Status hero */}
      <div className="m-4 rounded-3xl overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${statusCfg.color}22 0%, var(--c-surface) 100%)`, border: `1px solid ${statusCfg.color}30` }}>
        <div className="p-5 text-center">
          <div className="text-5xl mb-3" style={{ animation: active.status !== 'arrived' ? 'live-pulse 2s infinite' : 'none' }}>
            {statusCfg.emoji}
          </div>
          <h2 className="text-xl font-black text-white">{statusCfg.label}</h2>
          <p className="text-sm mt-1" style={{ color: statusCfg.color }}>
            {active.originStop.name} → {active.destinationStop.name}
          </p>
        </div>
        <div className="px-5 pb-5">
          <div className="flex justify-between text-[10px] mb-1.5" style={{ color: 'rgba(255,255,255,.3)' }}>
            <span>Départ</span><span>{progressPct.toFixed(0)}%</span><span>Arrivée</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(255,255,255,.08)' }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ background: `linear-gradient(90deg, ${statusCfg.color}, ${statusCfg.color}88)`, width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Status steps */}
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
                <span className="text-[11px] font-bold" style={{ color: current ? 'white' : '#334155' }}>
                  {{ walking:'Marche', waiting:'Attente', on_bus:'En bus', arrived:'Arrivé' }[s]}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 rounded-full"
                  style={{ background: done ? statusCfg.color : 'rgba(255,255,255,.08)' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Current step detail */}
      <div className="mx-4 mb-3 card rounded-2xl p-4">
        {active.status === 'walking' && (
          <>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--c-muted)' }}>
              👣 Maintenant — marchez vers l'arrêt
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(5,150,105,.15)' }}>🚶</div>
              <div>
                <p className="font-bold text-white">{active.walkingStop.name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                  {active.walkingMeters} m · <LiveCountdown seconds={walkMin * 60} /> à pied
                </p>
              </div>
            </div>
          </>
        )}
        {active.status === 'waiting' && nextBus && (
          <>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--c-muted)' }}>
              🕐 Attendez le bus
            </p>
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
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--c-muted)' }}>
              🚌 Vous êtes à bord
            </p>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-black text-blue-400">
                <LiveCountdown seconds={remainingMin * 60} />
              </div>
              <div>
                <p className="font-bold text-white">Vers {active.destinationStop.name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{active.lineName} · {active.transfers} corresp.</p>
              </div>
            </div>
          </>
        )}
        {active.status === 'arrived' && (
          <div className="text-center py-2">
            <p className="text-2xl font-black text-white mb-1">Vous êtes arrivé ! 🎉</p>
            <p className="text-sm" style={{ color: '#64748b' }}>
              Durée : {elapsedMin} min · {active.fare} FCFA · ~{(active.estimatedDuration * 0.008).toFixed(2)} kg CO₂ économisé
            </p>
          </div>
        )}
      </div>

      {/* Turn-by-turn directions */}
      {active.steps && active.steps.length > 0 && (
        <TurnByTurnPanel
          steps={active.steps}
          currentStatus={active.status}
          walkingStopName={active.walkingStop.name}
        />
      )}

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
              Voir QR
            </button>
          </div>
        </div>
      )}

      {!ticket && active.status !== 'arrived' && (
        <div className="mx-4 mb-3 rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'rgba(217,119,6,.08)', border: '1px solid rgba(217,119,6,.25)' }}>
          <span className="text-xl">🎫</span>
          <p className="text-xs text-white flex-1">Pas encore de billet pour ce trajet.</p>
          <button onClick={() => dispatch(setActiveTab('tickets'))}
            className="btn btn-primary flex-shrink-0" style={{ padding: '5px 12px', fontSize: 11 }}>
            Acheter
          </button>
        </div>
      )}

      {/* Bouton carte — walking: navigation piétonne, sinon: ligne bus */}
      {active.status === 'walking' ? (
        <button onClick={() => setShowWalkGuide(true)}
          className="mx-4 mb-3 flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[.98]"
          style={{ background: 'rgba(5,150,105,.12)', border: '1px solid rgba(5,150,105,.35)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'rgba(5,150,105,.25)' }}>🗺️</div>
          <div className="text-left flex-1">
            <p className="font-bold text-white text-sm">Voir le chemin sur la carte</p>
            <p className="text-xs mt-0.5" style={{ color: '#34d399' }}>
              Navigation piétonne vers {active.walkingStop.name}
            </p>
          </div>
          <span className="text-base font-black" style={{ color: '#34d399' }}>→</span>
        </button>
      ) : (
        <button onClick={focusMap}
          className="mx-4 mb-3 flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[.98]"
          style={{ background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.2)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'rgba(37,99,235,.15)' }}>🗺️</div>
          <div className="text-left flex-1">
            <p className="font-bold text-white text-sm">Voir sur la carte</p>
            <p className="text-xs mt-0.5" style={{ color: '#60a5fa' }}>Suivre la ligne {active.lineName}</p>
          </div>
          <span className="text-base font-black" style={{ color: '#475569' }}>→</span>
        </button>
      )}

      {/* Guidage piéton plein écran OSRM — fallback si pas GPS */}
      {showWalkGuide && (() => {
        // Si GPS dispo, utilise la vraie position ; sinon, simule à 400m de l'arrêt
        const startPos: [number, number] = userLocation ?? [
          active.walkingStop.lat - 0.0035,
          active.walkingStop.lng - 0.0035,
        ];
        return (
          <WalkToStopGuide
            stop={active.walkingStop}
            initialPos={startPos}
            onClose={() => setShowWalkGuide(false)}
          />
        );
      })()}

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
