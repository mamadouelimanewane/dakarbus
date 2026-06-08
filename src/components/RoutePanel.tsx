import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import {
  setRouteOrigin, setRouteDestination, clearRoute, recordTrip,
  setActiveTab, showToast, buyTicket, startJourney, setFocusedLine, setRouteDisplay,
} from '@/store/store';
import type { RouteDisplay } from '@/store/store';
import { STOPS, LINES, getNextDepartures, getAffluence } from '@/data/transportData';
import { getNearestStop, walkingMinutes } from '@/utils/nearest';
import { findRoutes, type RouteOption } from '@/utils/routeFinder';
import { shareRoute } from '@/utils/share';
import type { Stop, ActiveJourney } from '@/types';
import SearchBar from './SearchBar';

// ── Live countdown ─────────────────────────────────────────────
function Countdown({ seconds }: { seconds: number }) {
  const [s, setS] = useState(seconds);
  useEffect(() => {
    const t = setInterval(() => setS(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  if (s <= 0) return <span className="text-emerald-400 font-black">Maintenant</span>;
  const m = Math.floor(s / 60), ss = s % 60;
  return <span>{m > 0 ? `${m} min ${String(ss).padStart(2,'0')} s` : `${ss} s`}</span>;
}

// ── Fare breakdown badge ──────────────────────────────────────
function FareBreakdown({ option }: { option: RouteOption }) {
  const busSteps = option.steps.filter(s => s.type === 'bus' && s.lineId);
  if (busSteps.length <= 1) return null;
  return (
    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
      {busSteps.map((s, i) => {
        const line = LINES.find(l => l.id === s.lineId);
        return (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-[10px]" style={{ color: '#334155' }}>+</span>}
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: s.color + '20', color: s.color }}>
              {line?.name} {line?.tarif}F
            </span>
          </React.Fragment>
        );
      })}
      <span className="text-[10px]" style={{ color: '#334155' }}>= {option.fare} FCFA total</span>
    </div>
  );
}

// ── Option card ───────────────────────────────────────────────
function OptionCard({ option, selected, onSelect }: { option: RouteOption; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[.98]"
      style={{
        background: selected
          ? `linear-gradient(145deg, ${option.primaryLineColor}18 0%, var(--c-surface) 100%)`
          : 'var(--c-surface)',
        border: selected
          ? `1.5px solid ${option.primaryLineColor}55`
          : '1.5px solid var(--c-border)',
        boxShadow: selected ? `0 6px 24px ${option.primaryLineColor}20` : 'none',
      }}>
      <div className="h-0.5" style={{ background: selected ? option.primaryLineColor : 'transparent' }} />
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ background: option.labelColor + '22', color: option.labelColor, border: `1px solid ${option.labelColor}33` }}>
            {option.label}
          </span>
          <span className="text-xs font-black px-2 py-1 rounded-md text-white"
            style={{ background: option.primaryLineColor }}>
            {option.primaryLineName}
          </span>
          <div className="flex items-center gap-3 text-right">
            <div>
              <div className="text-lg font-black text-white leading-none">{option.totalMin}</div>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: '#475569' }}>min</div>
            </div>
            <div className="w-px h-6" style={{ background: 'rgba(255,255,255,.08)' }} />
            <div>
              <div className="text-lg font-black leading-none" style={{ color: option.primaryLineColor }}>{option.fare}</div>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: '#475569' }}>FCFA</div>
            </div>
            {option.transfers > 0 && (
              <>
                <div className="w-px h-6" style={{ background: 'rgba(255,255,255,.08)' }} />
                <div>
                  <div className="text-lg font-black text-white leading-none">{option.transfers}</div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: '#475569' }}>corresp.</div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {option.steps.map((step, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-[10px]" style={{ color: '#334155' }}>→</span>}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${step.type === 'transfer' ? 'italic' : ''}`}
                style={step.type !== 'transfer'
                  ? { background: step.color + '22', color: step.color }
                  : { color: '#475569' }}>
                {step.type === 'walk' ? `🚶 ${step.durationMin}m`
                 : step.type === 'transfer' ? '↻'
                 : step.lineId ? LINES.find(l => l.id === step.lineId)?.name || step.label.split('·')[0].trim()
                 : step.label.split('·')[0].trim()}
              </span>
            </React.Fragment>
          ))}
        </div>

        <FareBreakdown option={option} />

        {option.walkMin > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-[10px]" style={{ color: '#475569' }}>
            <span>🚶</span>
            <span>{option.walkMeters} m à pied jusqu'à l'arrêt · {option.walkMin} min</span>
          </div>
        )}
      </div>
    </button>
  );
}

// ── Affluence badge + prediction ──────────────────────────────
function AffluenceWidget({ stopId }: { stopId: string }) {
  const [offset, setOffset] = useState(0); // minutes from now
  const aff = getAffluence(stopId);
  const times = [0, 30, 60, 90];

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#334155' }}>Affluence prévue</span>
        <div className="flex gap-1 ml-auto">
          {times.map(t => (
            <button key={t} onClick={() => setOffset(t)}
              className="text-[10px] font-bold px-2 py-0.5 rounded-md transition-all"
              style={offset === t
                ? { background: 'rgba(37,99,235,.3)', color: '#60a5fa', border: '1px solid rgba(37,99,235,.4)' }
                : { background: 'rgba(255,255,255,.04)', color: '#475569', border: '1px solid transparent' }}>
              {t === 0 ? 'Maint.' : `+${t}m`}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: aff.color + '12', border: `1px solid ${aff.color}25` }}>
        <span>{aff.emoji}</span>
        <span className="text-xs font-bold" style={{ color: aff.color }}>{aff.level}</span>
        {aff.extra && <span className="text-[10px]" style={{ color: '#475569' }}>{aff.extra}</span>}
        <div className="ml-auto flex-shrink-0 rounded-full overflow-hidden" style={{ width: 60, height: 5, background: 'rgba(255,255,255,.08)' }}>
          <div className="h-full rounded-full" style={{ width: `${aff.pct}%`, background: aff.color }} />
        </div>
      </div>
    </div>
  );
}

// ── Timeline claire de l'itinéraire ──────────────────────────
function RouteTimeline({ option, origin, dest, onBuy, onStart }: {
  option: RouteOption; origin: Stop; dest: Stop;
  onBuy: (method: string) => void; onStart: () => void;
}) {
  const [buying, setBuying] = useState(false);
  const nextDep = getNextDepartures(origin.id)[0];

  // Construire une liste de nœuds lisibles depuis les steps
  type Node =
    | { kind: 'stop';     name: string; color: string; role: 'start' | 'end' | 'transfer' }
    | { kind: 'segment';  lineName: string; color: string; durationMin: number; stops?: string }
    | { kind: 'walk';     durationMin: number; meters?: number };

  const nodes: Node[] = [];
  nodes.push({ kind: 'stop', name: origin.name, color: '#059669', role: 'start' });

  for (const step of option.steps) {
    if (step.type === 'walk') {
      nodes.push({ kind: 'walk', durationMin: step.durationMin, meters: option.walkMeters });
    } else if (step.type === 'bus') {
      const line = LINES.find(l => l.id === step.lineId);
      const from = step.fromStopId ? STOPS.find(s => s.id === step.fromStopId) : null;
      const to   = step.toStopId   ? STOPS.find(s => s.id === step.toStopId)   : null;
      nodes.push({
        kind: 'segment',
        lineName: line?.name || step.label,
        color: step.color,
        durationMin: step.durationMin,
        stops: from && to ? `${from.name} → ${to.name}` : undefined,
      });
      if (to && step !== option.steps[option.steps.length - 1]) {
        nodes.push({ kind: 'stop', name: to.name, color: '#d97706', role: 'transfer' });
      }
    } else if (step.type === 'transfer') {
      // skip — déjà géré par le stop précédent
    }
  }
  nodes.push({ kind: 'stop', name: dest.name, color: '#dc2626', role: 'end' });

  return (
    <div className="rounded-2xl overflow-hidden mt-2 animate-fade-up"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>

      {/* Prochain départ */}
      {nextDep && (
        <div className="flex items-center gap-3 px-4 py-2.5"
          style={{ background: 'rgba(37,99,235,.1)', borderBottom: '1px solid var(--c-border)' }}>
          <span className="text-base">🕐</span>
          <span className="text-xs font-bold" style={{ color: '#94a3b8' }}>Prochain départ</span>
          <span className="ml-auto text-sm font-black" style={{ color: '#60a5fa' }}>
            <Countdown seconds={nextDep.waitMin * 60} />
          </span>
        </div>
      )}

      {/* Timeline verticale */}
      <div className="px-4 py-3">
        {nodes.map((node, i) => (
          <div key={i} className="flex gap-3">
            {/* Colonne icône + ligne verticale */}
            <div className="flex flex-col items-center" style={{ minWidth: 28 }}>
              {node.kind === 'stop' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0 z-10"
                  style={{ background: node.color, border: '2px solid var(--c-surface)', boxShadow: `0 0 0 2px ${node.color}40` }}>
                  {node.role === 'start' ? 'A' : node.role === 'end' ? 'B' : '↻'}
                </div>
              )}
              {node.kind === 'segment' && (
                <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 z-10 text-sm"
                  style={{ background: node.color, border: '2px solid var(--c-surface)' }}>
                  🚌
                </div>
              )}
              {node.kind === 'walk' && (
                <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 z-10 text-sm"
                  style={{ background: 'rgba(5,150,105,.2)', border: '2px solid var(--c-surface)' }}>
                  🚶
                </div>
              )}
              {/* Ligne verticale entre nœuds */}
              {i < nodes.length - 1 && (
                <div className="flex-1 w-0.5 my-0.5"
                  style={{
                    background: nodes[i+1]?.kind === 'segment' ? (nodes[i+1] as any).color + '60'
                      : node.kind === 'segment' ? (node as any).color + '60'
                      : 'rgba(255,255,255,.1)',
                    minHeight: 16,
                  }} />
              )}
            </div>

            {/* Contenu du nœud */}
            <div className="flex-1 pb-2 pt-0.5 min-w-0">
              {node.kind === 'stop' && (
                <div>
                  <span className="text-sm font-black" style={{ color: node.color }}>{node.name}</span>
                  {node.role === 'transfer' && (
                    <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ background: 'rgba(217,119,6,.2)', color: '#fbbf24' }}>
                      Correspondance
                    </span>
                  )}
                </div>
              )}
              {node.kind === 'segment' && (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black px-2.5 py-0.5 rounded-full text-white"
                      style={{ background: node.color }}>
                      {node.lineName}
                    </span>
                    <span className="text-xs font-bold" style={{ color: '#94a3b8' }}>
                      {node.durationMin} min
                    </span>
                  </div>
                  {node.stops && (
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: '#475569' }}>{node.stops}</p>
                  )}
                </div>
              )}
              {node.kind === 'walk' && (
                <span className="text-xs font-bold" style={{ color: '#34d399' }}>
                  À pied {node.meters ? `${node.meters} m · ` : ''}{node.durationMin} min
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      {!buying ? (
        <div className="flex gap-2 px-4 pb-4 pt-1" style={{ borderTop: '1px solid var(--c-border)' }}>
          <button onClick={onStart}
            className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 6px 20px rgba(5,150,105,.3)' }}>
            🚀 Démarrer
          </button>
          <button onClick={() => setBuying(true)}
            className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', boxShadow: '0 6px 20px rgba(37,99,235,.3)' }}>
            🎫 {option.fare} FCFA
          </button>
        </div>
      ) : (
        <div className="px-4 pb-4 pt-1" style={{ borderTop: '1px solid var(--c-border)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3 pt-2" style={{ color: '#475569' }}>
            Payer {option.fare} FCFA via
          </p>
          <div className="space-y-2">
            {[
              { l:'Wave',         e:'🌊', g:'linear-gradient(135deg,#00c5e3,#0082a3)' },
              { l:'Orange Money', e:'🟠', g:'linear-gradient(135deg,#f97316,#c2410c)' },
              { l:'Free Money',   e:'🏦', g:'linear-gradient(135deg,#7c3aed,#4c1d95)' },
            ].map(m => (
              <button key={m.l} onClick={() => { onBuy(m.l); setBuying(false); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white font-bold transition-all active:scale-[.98]"
                style={{ background: m.g }}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{m.e}</span>
                  <span className="font-black">{m.l}</span>
                </div>
                <span className="font-black">{option.fare} F</span>
              </button>
            ))}
            <button onClick={() => setBuying(false)} className="w-full py-2 rounded-xl text-xs btn btn-ghost">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function buildRouteDisplay(opt: RouteOption, userLoc: [number, number] | null): RouteDisplay {
  const busSteps = opt.steps.filter(s => s.type === 'bus' && s.lineId && s.fromStopId && s.toStopId);
  const segments = busSteps.map(s => {
    const line = LINES.find(l => l.id === s.lineId);
    return { lineId: s.lineId!, lineName: line?.name || s.lineId!, color: s.color, fromStopId: s.fromStopId!, toStopId: s.toStopId! };
  });
  const transferStopIds = opt.steps
    .filter(s => s.type === 'transfer' && s.fromStopId)
    .map(s => s.fromStopId!);
  return {
    segments,
    originStopId: opt.walkingStop.id,
    destStopId: (() => { const bs = opt.steps.filter(s => s.type === 'bus'); return bs[bs.length - 1]?.toStopId || ''; })(),
    transferStopIds,
    walkFrom: opt.walkMin > 0 && userLoc ? userLoc : null,
    fare: opt.fare,
  };
}

// ── Main RoutePanel ───────────────────────────────────────────
export default function RoutePanel() {
  const dispatch = useAppDispatch();
  const { route, userLocation } = useAppSelector(s => s.mobility);
  const { history } = useAppSelector(s => s.journey);
  const [options, setOptions]   = useState<RouteOption[]>([]);
  const [selected, setSelected] = useState<RouteOption | null>(null);
  const [noRoute, setNoRoute]   = useState(false);
  const [nearestInfo, setNearestInfo] = useState<{ stop: Stop; meters: number } | null>(null);

  // Détecte l'arrêt le plus proche mais NE pré-remplit PAS l'origine
  useEffect(() => {
    if (!userLocation) return;
    const res = getNearestStop(userLocation[0], userLocation[1]);
    if (!res) return;
    setNearestInfo({ stop: res.stop, meters: res.distanceMeters });
  }, [userLocation]);

  const calculate = () => {
    if (!route.origin || !route.destination) return;
    setOptions([]); setSelected(null); setNoRoute(false);
    const results = findRoutes(route.origin, route.destination, userLocation?.[0], userLocation?.[1]);
    if (results.length === 0) { setNoRoute(true); dispatch(setRouteDisplay(null)); return; }
    setOptions(results);
    setSelected(results[0]);
    if (results[0]) {
      dispatch(recordTrip({ fare: results[0].fare, operator: results[0].operator }));
      dispatch(setRouteDisplay(buildRouteDisplay(results[0], userLocation)));
      // NE PAS setFocusedLine ici — la FocusedLineOverlay pollue le tracé avec ses numéros
    }
  };

  const handleStartJourney = () => {
    if (!selected || !route.origin || !route.destination) return;
    const journey: ActiveJourney = {
      id: Math.random().toString(36).substring(2, 11),
      originStop: route.origin,
      destinationStop: route.destination,
      walkingStop: selected.walkingStop,
      walkingMeters: selected.walkMeters,
      lineId: selected.primaryLineId,
      lineName: selected.primaryLineName,
      lineColor: selected.primaryLineColor,
      operator: selected.operator,
      fare: selected.fare,
      transfers: selected.transfers,
      startedAt: Date.now(),
      estimatedDuration: selected.totalMin,
      status: selected.walkMin > 0 ? 'walking' : 'waiting',
      ticketId: null,
      steps: selected.steps,
    };
    dispatch(startJourney(journey));
    dispatch(showToast({ type: 'success', message: `Trajet démarré → ${route.destination.name} !` }));
  };

  const handleBuy = (method: string) => {
    if (!selected) return;
    dispatch(buyTicket({ operator: selected.operator, price: selected.fare }));
    dispatch(showToast({ type: 'success', message: `Billet acheté via ${method} !` }));
  };

  const handleSelectOption = (opt: RouteOption) => {
    setSelected(opt);
    dispatch(recordTrip({ fare: opt.fare, operator: opt.operator }));
    dispatch(setRouteDisplay(buildRouteDisplay(opt, userLocation)));
  };

  const handleShare = () => {
    if (!route.origin || !route.destination) return;
    shareRoute(route.origin.id, route.destination.id, dispatch, showToast);
  };

  const handleRefaire = (rec: { originId?: string; destId?: string }) => {
    const origin = STOPS.find(s => s.id === rec.originId);
    const dest   = STOPS.find(s => s.id === rec.destId);
    if (!origin || !dest) return;
    dispatch(setRouteOrigin(origin));
    dispatch(setRouteDestination(dest));
    setOptions([]); setSelected(null); setNoRoute(false);
  };

  const departures = route.origin ? getNextDepartures(route.origin.id) : [];

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-sm font-black" style={{ color: 'var(--c-text)' }}>
        🗺️ Où voulez-vous aller ?
      </h2>

      {nearestInfo && !route.origin && !options.length && (
        <button
          onClick={() => { dispatch(setRouteOrigin(nearestInfo.stop)); setOptions([]); setSelected(null); setNoRoute(false); }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs animate-fade-up transition-all active:scale-[.98]"
          style={{ background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.2)' }}>
          <span>📍</span>
          <div className="flex-1 text-left">
            <span className="font-bold text-white">Arrêt le plus proche :</span>
            <span className="ml-1.5" style={{ color: '#60a5fa' }}>{nearestInfo.stop.name}</span>
            <span className="ml-1.5" style={{ color: '#334155' }}>
              {nearestInfo.meters < 1000 ? `${nearestInfo.meters} m` : `${(nearestInfo.meters / 1000).toFixed(1)} km`}
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'rgba(37,99,235,.2)', color: '#60a5fa' }}>
            Utiliser →
          </span>
        </button>
      )}

      {/* Origin */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 4px 12px rgba(5,150,105,.4)' }}>A</div>
        <SearchBar placeholder="D'où partez-vous ?" value={route.origin}
          onSelect={s => { dispatch(setRouteOrigin(s)); setOptions([]); setSelected(null); setNoRoute(false); }}
          className="flex-1" />
      </div>

      {/* Swap */}
      {route.origin && route.destination && (
        <div className="flex justify-center -my-1">
          <button onClick={() => { dispatch(setRouteOrigin(route.destination)); dispatch(setRouteDestination(route.origin)); setOptions([]); setSelected(null); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all active:scale-90 hover:scale-110"
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--c-border)', color: '#94a3b8' }}>⇅</button>
        </div>
      )}

      {/* Destination */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#991b1b,#dc2626)', boxShadow: '0 4px 12px rgba(220,38,38,.4)' }}>B</div>
        <SearchBar placeholder="Où allez-vous ?" value={route.destination}
          onSelect={s => { dispatch(setRouteDestination(s)); setOptions([]); setSelected(null); setNoRoute(false); }}
          className="flex-1" />
      </div>

      {/* Calculate + Share buttons */}
      <div className="flex gap-2">
        <button onClick={calculate} disabled={!route.origin || !route.destination}
          className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={route.origin && route.destination
            ? { background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', boxShadow: '0 6px 20px rgba(37,99,235,.35)' }
            : { background: 'var(--c-surface2)' }}>
          Calculer l'itinéraire
        </button>
        {options.length > 0 && (
          <button onClick={handleShare}
            className="w-11 rounded-xl flex items-center justify-center text-lg transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--c-border)' }}
            title="Partager cet itinéraire">🔗</button>
        )}
        {(route.origin || route.destination) && (
          <button onClick={() => { dispatch(clearRoute()); dispatch(setRouteDisplay(null)); setOptions([]); setSelected(null); setNoRoute(false); setNearestInfo(null); }}
            className="w-11 rounded-xl flex items-center justify-center text-sm transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--c-border)', color: '#64748b' }}>✕</button>
        )}
      </div>

      {/* ══ VOYAGER — juste sous Calculer l'itinéraire ══ */}
      {options.length === 0 && !noRoute && (
        <div className="relative flex items-center gap-3 my-1">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,.08)' }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#334155' }}>ou</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,.08)' }} />
        </div>
      )}

      {noRoute && (
        <div className="rounded-2xl p-4 text-center animate-fade-up"
          style={{ background: 'rgba(217,119,6,.08)', border: '1px solid rgba(217,119,6,.2)' }}>
          <div className="text-2xl mb-1.5">🗺️</div>
          <p className="font-bold text-sm" style={{ color: '#fbbf24' }}>Aucun itinéraire trouvé</p>
          <p className="text-xs mt-1" style={{ color: '#64748b' }}>Ces arrêts ne sont pas connectés directement. Essayez un arrêt intermédiaire.</p>
        </div>
      )}

      {/* OPTIONS */}
      {options.length > 0 && (
        <div className="space-y-2 animate-fade-up">
          {options.length > 1 && (
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#334155' }}>
              {options.length} itinéraire{options.length > 1 ? 's' : ''} disponible{options.length > 1 ? 's' : ''}
            </p>
          )}
          {options.map(opt => (
            <OptionCard key={opt.id} option={opt}
              selected={selected?.id === opt.id}
              onSelect={() => handleSelectOption(opt)} />
          ))}
          {selected && route.origin && route.destination && (
            <RouteTimeline option={selected} origin={route.origin} dest={route.destination}
              onBuy={handleBuy} onStart={handleStartJourney} />
          )}
        </div>
      )}

      {/* Recent trips */}
      {!options.length && !noRoute && history.length > 0 && (
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest mb-2.5" style={{ color: '#334155' }}>
            🕐 Trajets récents
          </h3>
          <div className="space-y-1.5">
            {history.slice(0, 3).map((rec, i) => (
              <button key={rec.id} onClick={() => handleRefaire({ originId: rec.originId, destId: rec.destId })}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all active:scale-[.98]"
                style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: 'rgba(37,99,235,.12)' }}>🔄</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{rec.originName} → {rec.destName}</p>
                  <p className="text-[10px]" style={{ color: '#475569' }}>
                    {rec.duration} min · {rec.fare} FCFA · {new Date(rec.date).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
                  </p>
                </div>
                <span className="text-xs font-black" style={{ color: '#2563eb' }}>Refaire →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nearby departures */}
      {route.origin && !options.length && !noRoute && departures.length > 0 && (
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest mb-2.5" style={{ color: '#334155' }}>
            Prochains départs · {route.origin.name}
          </h3>
          {departures.slice(0, 5).map((d, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all"
              style={{ borderBottom: i < 4 ? '1px solid var(--c-border)' : '' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span className="text-[9px] font-black text-white px-2 py-1 rounded-lg flex-shrink-0"
                style={{ background: d.color, minWidth: 48, textAlign: 'center' }}>{d.lineName}</span>
              <span className="text-xs flex-1 truncate" style={{ color: '#64748b' }}>
                {d.route.split('↔')[1]?.trim() || d.route}
              </span>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-black leading-none"
                  style={{ color: d.waitMin <= 3 ? '#34d399' : d.waitMin <= 10 ? '#fbbf24' : '#475569' }}>
                  <Countdown seconds={d.waitMin * 60} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
