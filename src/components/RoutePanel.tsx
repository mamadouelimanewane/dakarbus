import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

// Calculer le prix selon la distance (150-500 FCFA)
function calculatePrice(distance: number): number {
  if (distance < 2) return 150;
  if (distance < 5) return 200;
  if (distance < 10) return 300;
  return 500;
}

import {
  setRouteOrigin, setRouteDestination, clearRoute, recordTrip,
  setActiveTab, showToast, buyTicket, startJourney, setFocusedLine, setRouteDisplay,
} from '@/store/store';
import type { RouteDisplay } from '@/store/store';
import { STOPS, LINES, getNextDepartures, getAffluence } from '@/data/transportData';
import { getNearestStop, walkingMinutes } from '@/utils/nearest';
import { findRoutes, type RouteOption } from '@/utils/routeFinder';
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

// ── Option card ───────────────────────────────────────────────
function OptionCard({
  option, selected, onSelect,
}: { option: RouteOption; selected: boolean; onSelect: () => void }) {
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
      }}
    >
      {/* Top accent bar */}
      <div className="h-0.5" style={{ background: selected ? option.primaryLineColor : 'transparent' }} />

      <div className="px-4 py-3">
        {/* Label + stats row */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ background: option.labelColor + '22', color: option.labelColor, border: `1px solid ${option.labelColor}33` }}>
            {option.label}
          </span>
          <span className="text-xs font-black px-2 py-1 rounded-md text-white"
            style={{ background: option.primaryLineColor }}>
            LIGNE {option.primaryLineName}
          </span>
          <div className="flex items-center gap-3 text-right">
            <div>
              <div className="text-lg font-black text-white leading-none">{option.totalMin}</div>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: '#475569' }}>min</div>
            </div>
            <div className="w-px h-6 bg-white/8" />
            <div>
              <div className="text-lg font-black leading-none" style={{ color: option.primaryLineColor }}>{option.fare}</div>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: '#475569' }}>FCFA</div>
            </div>
            {option.transfers > 0 && (
              <>
                <div className="w-px h-6 bg-white/8" />
                <div>
                  <div className="text-lg font-black text-white leading-none">{option.transfers}</div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: '#475569' }}>corresp.</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Steps preview */}
        <div className="flex items-center gap-1 flex-wrap">
          {option.steps.map((step, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-[10px]" style={{ color: '#334155' }}>→</span>}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${step.type === 'transfer' ? 'italic' : ''}`}
                style={step.type !== 'transfer'
                  ? { background: step.color + '22', color: step.color }
                  : { color: '#475569' }}>
                {step.type === 'walk'     ? `🚶 ${step.durationMin}m`
                 : step.type === 'transfer' ? '↻'
                 : step.lineId ? LINES.find(l => l.id === step.lineId)?.name || step.label.split('·')[0].trim()
                 : step.label.split('·')[0].trim()}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Walk info */}
        {option.walkMin > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-[10px]" style={{ color: '#475569' }}>
            <span>🚶</span>
            <span>{option.walkMeters} m à pied jusqu'à l'arrêt</span>
          </div>
        )}
      </div>
    </button>
  );
}

// ── Detail panel for selected option ─────────────────────────
function OptionDetail({
  option, origin, dest, onBuy, onStart,
}: {
  option: RouteOption;
  origin: Stop; dest: Stop;
  onBuy: (method: string) => void;
  onStart: () => void;
}) {
  const [buying, setBuying] = useState(false);
  const departures = getNextDepartures(origin.id).slice(0, 3);
  const affluence  = getAffluence(origin.id);

  return (
    <div className="rounded-2xl overflow-hidden mt-2 animate-fade-up"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>

      {/* Steps detail */}
      <div className="px-4 pt-4 pb-3 space-y-2">
        {option.steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 py-2"
            style={{ borderTop: i > 0 ? '1px solid var(--c-border)' : 'none' }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
              style={step.type === 'transfer'
                ? { background: 'rgba(255,255,255,.05)' }
                : { background: step.color + '22' }}>
              {step.type === 'walk' ? '🚶' : step.type === 'transfer' ? '↻' : '🚌'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm" style={{ color: step.type === 'transfer' ? '#475569' : '#e2e8f0' }}>
                {step.label}
              </p>
            </div>
            <span className="text-sm font-black flex-shrink-0"
              style={{ color: step.type === 'transfer' ? '#334155' : 'white' }}>
              {step.durationMin} min
            </span>
          </div>
        ))}
      </div>

      {/* Next departures + affluence */}
      {departures.length > 0 && (
        <div className="px-4 pb-3" style={{ borderTop: '1px solid var(--c-border)' }}>
          <div className="flex items-center justify-between pt-3 mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#334155' }}>Prochains départs</p>
            {affluence && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: affluence.color + '20', color: affluence.color }}>
                {affluence.emoji} {affluence.level}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {departures.map((d, i) => (
              <div key={i} className="flex-1 text-center py-2 rounded-xl"
                style={i === 0
                  ? { background: 'rgba(37,99,235,.15)', border: '1px solid rgba(37,99,235,.35)' }
                  : { background: 'rgba(255,255,255,.04)', border: '1px solid transparent' }}>
                <div className={`text-xs font-black ${i === 0 ? 'text-blue-400' : 'text-slate-400'}`}>
                  <Countdown seconds={d.waitMin * 60} />
                </div>
                {i === 0 && <div className="text-[9px] mt-0.5 text-blue-500">prochain</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      {!buying ? (
        <div className="flex gap-2 px-4 pb-4" style={{ borderTop: '1px solid var(--c-border)', paddingTop: 12 }}>
          <button onClick={onStart}
            className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 6px 20px rgba(5,150,105,.3)' }}>
            🚀 Démarrer
          </button>
          <button onClick={() => setBuying(true)}
            className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', boxShadow: '0 6px 20px rgba(37,99,235,.3)' }}>
            🎫 Acheter {option.fare} F
          </button>
        </div>
      ) : (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--c-border)', paddingTop: 12 }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#475569' }}>
            Payer {option.fare} FCFA via
          </p>
          <div className="space-y-2">
            {[
              { l:'Wave',         e:'🌊', g:'linear-gradient(135deg,#00c5e3,#0082a3)' },
              { l:'Orange Money', e:'🟠', g:'linear-gradient(135deg,#f97316,#c2410c)' },
              { l:'Free Money',   e:'🏦', g:'linear-gradient(135deg,#7c3aed,#4c1d95)' },
            ].map(m => (
              <button key={m.l} onClick={() => { onBuy(m.l); setBuying(false); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white font-bold transition-all hover:scale-[1.01] active:scale-[.98]"
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
  };
}

// ── Main RoutePanel ───────────────────────────────────────────
export default function RoutePanel() {
  const dispatch = useAppDispatch();
  const { route, userLocation } = useAppSelector(s => s.mobility);
  const [options, setOptions]       = useState<RouteOption[]>([]);
  const [selected, setSelected]     = useState<RouteOption | null>(null);
  const [noRoute, setNoRoute]       = useState(false);
  const [nearestInfo, setNearestInfo] = useState<{ stop: Stop; meters: number } | null>(null);

  // Auto-fill nearest stop as origin
  useEffect(() => {
    if (!userLocation || route.origin) return;
    const res = getNearestStop(userLocation[0], userLocation[1]);
    if (!res) return;
    setNearestInfo({ stop: res.stop, meters: res.distanceMeters });
    dispatch(setRouteOrigin(res.stop));
  }, [userLocation]);

  const calculate = () => {
    if (!route.origin || !route.destination) return;
    setOptions([]); setSelected(null); setNoRoute(false);
    const results = findRoutes(
      route.origin, route.destination,
      userLocation?.[0], userLocation?.[1]
    );
    if (results.length === 0) { setNoRoute(true); dispatch(setRouteDisplay(null)); return; }
    setOptions(results);
    setSelected(results[0]);
    if (results[0]) {
      dispatch(recordTrip({ fare: results[0].fare, operator: results[0].operator }));
      dispatch(setRouteDisplay(buildRouteDisplay(results[0], userLocation)));
      dispatch(setFocusedLine(results[0].primaryLineId));
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
    };
    dispatch(startJourney(journey));
    dispatch(setFocusedLine(selected.primaryLineId));
    dispatch(showToast({ type: 'success', message: `Trajet démarré → ${route.destination.name} !` }));
  };

  const handleBuy = (method: string) => {
    if (!selected) return;
    dispatch(buyTicket({ operator: selected.operator, price: selected.fare }));
    dispatch(showToast({ type: 'success', message: `Billet acheté via ${method} !` }));
  };

  const handleSelectOption = (opt: RouteOption) => {
    setSelected(opt);
    dispatch(setFocusedLine(opt.primaryLineId));
    dispatch(recordTrip({ fare: opt.fare, operator: opt.operator }));
    dispatch(setRouteDisplay(buildRouteDisplay(opt, userLocation)));
  };

  const departures = route.origin ? getNextDepartures(route.origin.id) : [];

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>
        Planifier un trajet
      </h2>

      {/* Nearest stop notice */}
      {nearestInfo && !options.length && (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs animate-fade-up"
          style={{ background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.2)' }}>
          <span>📍</span>
          <span className="font-bold text-white">Arrêt le plus proche :</span>
          <span style={{ color: '#64748b' }}>{route.origin?.name}</span>
          <span style={{ color: '#334155' }}>
            {nearestInfo.meters < 1000 ? `${nearestInfo.meters} m` : `${(nearestInfo.meters/1000).toFixed(1)} km`}
          </span>
        </div>
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

      {/* Calculate button */}
      <div className="flex gap-2">
        <button onClick={calculate} disabled={!route.origin || !route.destination}
          className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={route.origin && route.destination
            ? { background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', boxShadow: '0 6px 20px rgba(37,99,235,.35)' }
            : { background: 'var(--c-surface2)' }}>
          Calculer l'itinéraire
        </button>
        {(route.origin || route.destination) && (
          <button onClick={() => { dispatch(clearRoute()); dispatch(setRouteDisplay(null)); setOptions([]); setSelected(null); setNoRoute(false); setNearestInfo(null); }}
            className="w-11 rounded-xl flex items-center justify-center text-sm transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--c-border)', color: '#64748b' }}>✕</button>
        )}
      </div>

      {/* No route */}
      {noRoute && (
        <div className="rounded-2xl p-4 text-center animate-fade-up"
          style={{ background: 'rgba(217,119,6,.08)', border: '1px solid rgba(217,119,6,.2)' }}>
          <div className="text-2xl mb-1.5">🗺️</div>
          <p className="font-bold text-sm" style={{ color: '#fbbf24' }}>Aucun itinéraire trouvé</p>
          <p className="text-xs mt-1" style={{ color: '#64748b' }}>Ces arrêts ne sont pas connectés dans le réseau.</p>
        </div>
      )}

      {/* ── OPTIONS ─────────────────────────────────────────────── */}
      {options.length > 0 && (
        <div className="space-y-2 animate-fade-up">
          {options.length > 1 && (
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#334155' }}>
              {options.length} itinéraire{options.length > 1 ? 's' : ''} disponible{options.length > 1 ? 's' : ''}
            </p>
          )}

          {/* Option cards */}
          {options.map(opt => (
            <OptionCard
              key={opt.id} option={opt}
              selected={selected?.id === opt.id}
              onSelect={() => handleSelectOption(opt)}
            />
          ))}

          {/* Detail of selected */}
          {selected && route.origin && route.destination && (
            <OptionDetail
              option={selected}
              origin={route.origin}
              dest={route.destination}
              onBuy={handleBuy}
              onStart={handleStartJourney}
            />
          )}
        </div>
      )}

      {/* Nearby departures (pre-calculate) */}
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
                  style={{ color: d.waitMin<=3?'#34d399':d.waitMin<=10?'#fbbf24':'#475569' }}>
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
