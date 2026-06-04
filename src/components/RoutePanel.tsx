import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setRouteOrigin, setRouteDestination, clearRoute, recordTrip,
  setActiveTab, showToast, buyTicket, startJourney, attachTicketToJourney,
} from '@/store/store';
import { STOPS, LINES, getNextDepartures, getAffluence } from '@/data/transportData';
import { getNearestStop, walkingMinutes, stopDistance } from '@/utils/nearest';
import type { Stop, OperatorId, ActiveJourney } from '@/types';
import SearchBar from './SearchBar';

// ── Route computation ──────────────────────────────────────────
interface Step { label: string; color: string; time: string; type: 'walk' | 'bus' | 'transfer' }
interface RouteResult {
  duration: number; fare: number; transfers: number;
  operator: OperatorId; lineId: string; lineName: string; lineColor: string;
  walkingStop: Stop; walkingMeters: number;
  steps: Step[];
}

function computeRoute(o: Stop, d: Stop): RouteResult | null {
  if (o.id === d.id) return null;
  const common = o.lines.filter(id => d.lines.includes(id));
  if (common.length) {
    const line = LINES.find(l => l.id === common[0]); if (!line) return null;
    const stops = Math.abs(line.stops.indexOf(o.id) - line.stops.indexOf(d.id));
    const dur = Math.max(5, stops * 3 + 4);
    return {
      duration: dur, fare: line.tarif, transfers: 0,
      operator: line.operator, lineId: line.id, lineName: line.name, lineColor: line.color,
      walkingStop: o, walkingMeters: 0,
      steps: [
        { label: `Prendre ${line.name}`, color: line.color, time: 'au départ', type: 'bus' },
        { label: `Descendre à ${d.name}`, color: line.color, time: `${dur} min`, type: 'bus' },
      ],
    };
  }
  for (const oId of o.lines) {
    const oLine = LINES.find(l => l.id === oId); if (!oLine) continue;
    for (const midId of oLine.stops) {
      const mid = STOPS.find(s => s.id === midId); if (!mid) continue;
      const dId = mid.lines.find(id => d.lines.includes(id)); if (!dId) continue;
      const dLine = LINES.find(l => l.id === dId); if (!dLine) continue;
      const d1 = Math.max(3, Math.abs(oLine.stops.indexOf(o.id) - oLine.stops.indexOf(midId)) * 3 + 3);
      const d2 = Math.max(3, Math.abs(dLine.stops.indexOf(midId) - dLine.stops.indexOf(d.id)) * 3 + 3);
      return {
        duration: d1 + 5 + d2, fare: oLine.tarif + dLine.tarif, transfers: 1,
        operator: oLine.operator, lineId: oLine.id, lineName: oLine.name, lineColor: oLine.color,
        walkingStop: o, walkingMeters: 0,
        steps: [
          { label: `${oLine.name} → ${mid.name}`, color: oLine.color, time: `${d1} min`, type: 'bus' },
          { label: `Correspondance · ${mid.name}`, color: '#475569', time: '5 min', type: 'transfer' },
          { label: `${dLine.name} → ${d.name}`, color: dLine.color, time: `${d2} min`, type: 'bus' },
        ],
      };
    }
  }
  return null;
}

// ── Live countdown hook ────────────────────────────────────────
function useCountdown(targetSeconds: number) {
  const [secs, setSecs] = useState(targetSeconds);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(secs / 60), s = secs % 60;
  return secs <= 0 ? 'maintenant' : m > 0 ? `${m} min ${String(s).padStart(2, '0')} s` : `${s} s`;
}

// ── Departure countdown item ───────────────────────────────────
function DepartureItem({ waitMin, first }: { waitMin: number; first: boolean }) {
  const display = useCountdown(waitMin * 60);
  return (
    <div className={`flex-1 text-center py-2 rounded-xl`}
      style={first
        ? { background: 'rgba(37,99,235,.15)', border: '1px solid rgba(37,99,235,.35)' }
        : { background: 'rgba(255,255,255,.04)', border: '1px solid transparent' }}>
      <div className={`text-xs font-black leading-none ${first ? 'text-blue-400' : 'text-slate-400'}`}>{display}</div>
      {first && <div className="text-[9px] mt-0.5" style={{ color: '#3b82f6' }}>prochain</div>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function RoutePanel() {
  const dispatch = useAppDispatch();
  const { route, userLocation } = useAppSelector(s => s.mobility);
  const { active: activeJourney } = useAppSelector(s => s.journey);
  const { myTickets } = useAppSelector(s => s.tickets);
  const [result, setResult] = useState<RouteResult | 'none' | null>(null);
  const [nearestInfo, setNearestInfo] = useState<{ stop: Stop; meters: number } | null>(null);
  const [buying, setBuying] = useState(false);

  // Bloc 1: Auto-fill origin with nearest stop
  useEffect(() => {
    if (!userLocation || route.origin) return;
    const res = getNearestStop(userLocation[0], userLocation[1]);
    if (!res) return;
    setNearestInfo({ stop: res.stop, meters: res.distanceMeters });
    dispatch(setRouteOrigin(res.stop));
  }, [userLocation]);

  const calculate = () => {
    if (!route.origin || !route.destination) return;
    const r = computeRoute(route.origin, route.destination);
    if (!r) { setResult('none'); return; }
    // Add walking distance from userLocation to origin stop
    let walkMeters = 0;
    if (userLocation) {
      const { distanceMeters } = getNearestStop(userLocation[0], userLocation[1]) ?? { distanceMeters: 0 };
      walkMeters = distanceMeters;
    }
    setResult({ ...r, walkingMeters: walkMeters });
    dispatch(recordTrip({ fare: r.fare, operator: r.operator }));
  };

  // Bloc 2: Start journey action
  const handleStartJourney = () => {
    if (!result || result === 'none' || !route.origin || !route.destination) return;
    const r = result as RouteResult;
    const journey: ActiveJourney = {
      id: Math.random().toString(36).substring(2, 11),
      originStop: route.origin,
      destinationStop: route.destination,
      walkingStop: r.walkingStop,
      walkingMeters: r.walkingMeters,
      lineId: r.lineId, lineName: r.lineName, lineColor: r.lineColor,
      operator: r.operator, fare: r.fare, transfers: r.transfers,
      startedAt: Date.now(),
      estimatedDuration: r.duration + (r.walkingMeters > 0 ? walkingMinutes(r.walkingMeters) : 0),
      status: r.walkingMeters > 60 ? 'walking' : 'waiting',
      ticketId: null,
    };
    dispatch(startJourney(journey));
    dispatch(setActiveTab('plan'));
    dispatch(showToast({ type: 'success', message: `Trajet démarré vers ${route.destination.name} !` }));
  };

  // Bloc 2: Quick buy + auto-attach to journey
  const handleQuickBuy = (method: string) => {
    if (!result || result === 'none') return;
    const r = result as RouteResult;
    const id = Math.random().toString(36).substring(2, 11).toUpperCase();
    dispatch(buyTicket({ operator: r.operator, price: r.fare }));
    // Find the newly created ticket (last one)
    dispatch(showToast({ type: 'success', message: `Billet acheté via ${method} !` }));
    setBuying(false);
    if (activeJourney) dispatch(attachTicketToJourney(id));
  };

  const departures = route.origin ? getNextDepartures(route.origin.id).slice(0, 3) : [];
  const affluence  = route.origin ? getAffluence(route.origin.id) : null;
  const walkMin    = result && result !== 'none' && (result as RouteResult).walkingMeters > 60
    ? walkingMinutes((result as RouteResult).walkingMeters) : 0;

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>Planifier un trajet</h2>

      {/* Nearest stop notice */}
      {nearestInfo && !route.destination && (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs animate-fade-up"
          style={{ background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.2)' }}>
          <span className="text-base">📍</span>
          <div>
            <span className="font-bold text-white">Arrêt le plus proche détecté</span>
            <span className="ml-1.5 font-medium" style={{ color: '#64748b' }}>
              {route.origin?.name} · {nearestInfo.meters < 1000 ? `${nearestInfo.meters} m` : `${(nearestInfo.meters / 1000).toFixed(1)} km`}
            </span>
          </div>
        </div>
      )}

      {/* Origin */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 4px 12px rgba(5,150,105,.4)' }}>A</div>
        <SearchBar placeholder="D'où partez-vous ?" value={route.origin}
          onSelect={s => { dispatch(setRouteOrigin(s)); setResult(null); }} className="flex-1" />
      </div>

      {/* Swap */}
      {route.origin && route.destination && (
        <div className="flex justify-center -my-1">
          <button onClick={() => { dispatch(setRouteOrigin(route.destination)); dispatch(setRouteDestination(route.origin)); setResult(null); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all active:scale-90 hover:scale-110"
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--c-border)', color: '#94a3b8' }}>⇅</button>
        </div>
      )}

      {/* Destination */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#991b1b,#dc2626)', boxShadow: '0 4px 12px rgba(220,38,38,.4)' }}>B</div>
        <SearchBar placeholder="Où allez-vous ?" value={route.destination}
          onSelect={s => { dispatch(setRouteDestination(s)); setResult(null); }} className="flex-1" />
      </div>

      {/* Calculate */}
      <div className="flex gap-2">
        <button onClick={calculate} disabled={!route.origin || !route.destination}
          className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={route.origin && route.destination
            ? { background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', boxShadow: '0 6px 20px rgba(37,99,235,.35)' }
            : { background: 'var(--c-surface2)' }}>
          Calculer l'itinéraire
        </button>
        {(route.origin || route.destination) && (
          <button onClick={() => { dispatch(clearRoute()); setResult(null); setNearestInfo(null); }}
            className="w-11 rounded-xl flex items-center justify-center text-sm transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--c-border)', color: '#64748b' }}>✕</button>
        )}
      </div>

      {/* No route */}
      {result === 'none' && (
        <div className="rounded-2xl p-4 text-center animate-fade-up"
          style={{ background: 'rgba(217,119,6,.08)', border: '1px solid rgba(217,119,6,.2)' }}>
          <div className="text-2xl mb-1.5">🗺️</div>
          <p className="font-bold text-sm" style={{ color: '#fbbf24' }}>Aucun itinéraire trouvé</p>
          <p className="text-xs mt-1" style={{ color: '#64748b' }}>Ces arrêts ne sont pas connectés.</p>
        </div>
      )}

      {/* ── RÉSULTATS ENRICHIS ─────────────────────────────────── */}
      {result && result !== 'none' && (() => {
        const r = result as RouteResult;
        return (
          <div className="rounded-2xl overflow-hidden animate-fade-up"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>

            {/* Walking section */}
            {walkMin > 0 && (
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--c-border)', background: 'rgba(5,150,105,.06)' }}>
                <span className="text-xl">🚶</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-white">Marche vers {r.walkingStop.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>
                    {r.walkingMeters} m · environ {walkMin} min à pied
                  </p>
                </div>
                <span className="text-sm font-black" style={{ color: '#34d399' }}>{walkMin} min</span>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
              {[
                { v: walkMin > 0 ? r.duration + walkMin : r.duration, u: 'min total' },
                { v: r.fare, u: 'FCFA' },
                { v: r.transfers, u: 'corresp.' },
              ].map((s, i) => (
                <div key={i} className="text-center px-3">
                  <div className="text-2xl font-black text-white leading-none">{s.v}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: '#475569' }}>{s.u}</div>
                </div>
              ))}
            </div>

            {/* Route type badge */}
            <div className="px-4 pt-3 pb-1">
              <span className="badge" style={r.transfers === 0
                ? { background: 'rgba(5,150,105,.15)', color: '#34d399', border: '1px solid rgba(5,150,105,.2)' }
                : { background: 'rgba(217,119,6,.15)', color: '#fbbf24', border: '1px solid rgba(217,119,6,.2)' }}>
                {r.transfers === 0 ? '✓ DIRECT' : `↻ ${r.transfers} CORRESPONDANCE`}
              </span>
            </div>

            {/* Steps */}
            <div className="px-4 pb-3 space-y-1.5 mt-2">
              {r.steps.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2" style={{ borderTop: i > 0 ? '1px solid var(--c-border)' : 'none' }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: s.type === 'transfer' ? '#334155' : s.color }} />
                  <span className="text-xs flex-1" style={{ color: s.type === 'transfer' ? '#475569' : '#cbd5e1' }}>{s.label}</span>
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: s.type === 'transfer' ? '#334155' : 'white' }}>{s.time}</span>
                </div>
              ))}
            </div>

            {/* Bloc 1: Prochains départs + affluence */}
            {departures.length > 0 && (
              <div className="px-4 pb-3" style={{ borderTop: '1px solid var(--c-border)' }}>
                <div className="flex items-center justify-between mb-2 pt-3">
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
                    <DepartureItem key={i} waitMin={d.waitMin} first={i === 0} />
                  ))}
                </div>
              </div>
            )}

            {/* Bloc 2: Action buttons */}
            {!buying ? (
              <div className="flex gap-2 px-4 pb-4" style={{ borderTop: '1px solid var(--c-border)', paddingTop: 12 }}>
                {/* Start journey */}
                <button onClick={handleStartJourney}
                  className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 6px 20px rgba(5,150,105,.35)' }}>
                  🚀 Démarrer
                </button>
                {/* Buy ticket */}
                <button onClick={() => setBuying(true)}
                  className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', boxShadow: '0 6px 20px rgba(37,99,235,.35)' }}>
                  🎫 Acheter {r.fare} F
                </button>
              </div>
            ) : (
              <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--c-border)', paddingTop: 12 }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Payer {r.fare} FCFA via</p>
                <div className="space-y-2">
                  {[
                    { l: 'Wave', e: '🌊', g: 'linear-gradient(135deg,#00c5e3,#0082a3)' },
                    { l: 'Orange Money', e: '🟠', g: 'linear-gradient(135deg,#f97316,#c2410c)' },
                    { l: 'Free Money', e: '🏦', g: 'linear-gradient(135deg,#7c3aed,#4c1d95)' },
                  ].map(m => (
                    <button key={m.l} onClick={() => handleQuickBuy(m.l)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white font-bold transition-all active:scale-[.98] hover:scale-[1.01]"
                      style={{ background: m.g }}>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{m.e}</span>
                        <span className="font-black">{m.l}</span>
                      </div>
                      <span className="font-black">{r.fare} F</span>
                    </button>
                  ))}
                  <button onClick={() => setBuying(false)} className="w-full py-2 rounded-xl text-xs btn btn-ghost">Annuler</button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Nearby departures (before calculate) */}
      {route.origin && !result && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#334155' }}>
              Prochains départs · {route.origin.name}
            </h3>
            {affluence && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: affluence.color + '20', color: affluence.color }}>
                {affluence.emoji} {affluence.level}
              </span>
            )}
          </div>
          {departures.map((d, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all"
              style={{ borderBottom: i < departures.length - 1 ? '1px solid var(--c-border)' : '' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span className="text-[9px] font-black text-white px-2 py-1 rounded-lg flex-shrink-0"
                style={{ background: d.color, minWidth: 48, textAlign: 'center' }}>{d.lineName}</span>
              <span className="text-xs flex-1 truncate" style={{ color: '#64748b' }}>
                {d.route.split('↔')[1]?.trim() || d.route}
              </span>
              <DepartureItem waitMin={d.waitMin} first={i === 0} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
