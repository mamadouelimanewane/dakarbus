/**
 * VoyagerWizard — Workflow guidé "Je veux voyager"
 * Étapes : GPS → Destination → Proposition → Confirmation → Navigation + arrivée bus
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setUserLocation, setRouteOrigin, setRouteDestination,
  setRouteDisplay, setMapCenter, setMapZoom, setActiveTab, showToast,
} from '@/store/store';
import { searchLocal } from '@/utils/placeSearch';
import { getNearestStop, walkingMinutes } from '@/utils/nearest';
import { findRoutes } from '@/utils/routeFinder';
import { STOPS, LINES, OPERATORS } from '@/data/transportData';
import type { Stop } from '@/types';
import type { RouteOption } from '@/utils/routeFinder';

// ── Types ──────────────────────────────────────────────────────
type Step = 'geolocate' | 'destination' | 'propose' | 'navigate';

interface Proposal {
  option: RouteOption;
  nearestStop: Stop;
  walkMeters: number;
  walkMin: number;
  destStop: Stop;
  operator: string;
  operatorColor: string;
  busArrivalMin: number; // minutes avant arrivée du bus simulée
}

// ── Countdown formaté ──────────────────────────────────────────
function Countdown({ totalSec, onDone }: { totalSec: number; onDone: () => void }) {
  const [sec, setSec] = useState(totalSec);
  useEffect(() => {
    if (sec <= 0) { onDone(); return; }
    const t = setTimeout(() => setSec(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sec]);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return <span>{m}:{String(s).padStart(2, '0')}</span>;
}

// ── Barre de progression ───────────────────────────────────────
function StepDots({ step }: { step: Step }) {
  const steps: Step[] = ['geolocate', 'destination', 'propose', 'navigate'];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div key={s} className="rounded-full transition-all duration-300"
          style={{
            width: i === idx ? 24 : 8, height: 8,
            background: i <= idx ? '#2563eb' : 'rgba(255,255,255,.15)',
          }} />
      ))}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────
export default function VoyagerWizard({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { userLocation } = useAppSelector(s => s.mobility);

  const [step, setStep] = useState<Step>('geolocate');
  const [geoError, setGeoError] = useState('');
  const [myPos, setMyPos] = useState<[number, number] | null>(userLocation);
  const [destInput, setDestInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [destStop, setDestStop] = useState<Stop | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [busArrived, setBusArrived] = useState(false);
  const [busProgress, setBusProgress] = useState(0); // 0→1
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Étape 1 : Géolocalisation ──────────────────────────────
  useEffect(() => {
    if (step !== 'geolocate') return;
    if (myPos) { setStep('destination'); return; }
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMyPos(loc);
        dispatch(setUserLocation(loc));
        setStep('destination');
      },
      () => setGeoError('Géolocalisation refusée. Activez le GPS puis réessayez.'),
      { timeout: 10000 }
    );
  }, [step]);

  // Focus input quand on passe à destination
  useEffect(() => {
    if (step === 'destination') setTimeout(() => inputRef.current?.focus(), 300);
  }, [step]);

  // ── Recherche de destination ───────────────────────────────
  useEffect(() => {
    if (!destInput.trim()) { setSuggestions([]); return; }
    const results = searchLocal(destInput, myPos?.[0], myPos?.[1], 6);
    setSuggestions(results);
  }, [destInput]);

  // ── Sélection destination + calcul proposition ─────────────
  const selectDest = useCallback((result: any) => {
    const stop: Stop | null = result.type === 'stop' ? result.stop : result.nearestStop;
    if (!stop) return;
    setDestStop(stop);
    setDestInput(result.label || stop.name);
    setSuggestions([]);
    buildProposal(stop);
  }, [myPos]);

  const buildProposal = (dest: Stop) => {
    if (!myPos) return;
    const nearest = getNearestStop(myPos[0], myPos[1]);
    if (!nearest) return;
    const options = findRoutes(nearest.stop, dest);
    if (!options.length) {
      dispatch(showToast({ type: 'error', message: 'Aucun trajet trouvé vers cette destination.' }));
      return;
    }
    const best = options[0];
    const op = OPERATORS[best.operator as keyof typeof OPERATORS];
    setProposal({
      option: best,
      nearestStop: nearest.stop,
      walkMeters: nearest.distanceMeters,
      walkMin: walkingMinutes(nearest.distanceMeters),
      destStop: dest,
      operator: best.operator,
      operatorColor: op?.color || '#2563eb',
      busArrivalMin: 6,
    });
    setStep('propose');
  };

  // ── Validation → démarrer navigation ──────────────────────
  const startJourney = () => {
    if (!proposal || !myPos) return;
    const { option, nearestStop, destStop } = proposal;

    // Dispatche l'origine/destination
    dispatch(setRouteOrigin(nearestStop));
    dispatch(setRouteDestination(destStop));
    dispatch(setActiveTab('plan'));

    // Construit routeDisplay (même logique que RoutePanel)
    const busSteps = option.steps.filter((s: any) => s.type === 'bus' && s.lineId && s.fromStopId && s.toStopId);
    const segments = busSteps.map((s: any) => {
      const line = LINES.find(l => l.id === s.lineId);
      return { lineId: s.lineId!, lineName: line?.name || s.lineId!, color: s.color, fromStopId: s.fromStopId!, toStopId: s.toStopId! };
    });
    const transferStopIds = option.steps
      .filter((s: any) => s.type === 'transfer' && s.fromStopId)
      .map((s: any) => s.fromStopId!);
    const allBus = option.steps.filter((s: any) => s.type === 'bus');
    dispatch(setRouteDisplay({
      segments,
      originStopId: nearestStop.id,
      destStopId: allBus[allBus.length - 1]?.toStopId || destStop.id,
      transferStopIds,
      walkFrom: option.walkMin > 0 && myPos ? myPos : null,
      fare: option.fare,
    }));

    dispatch(setMapCenter([nearestStop.lat, nearestStop.lng]));
    dispatch(setMapZoom(15));
    setStep('navigate');
    setBusProgress(0);
    setBusArrived(false);
  };

  // ── Bus progress animation ─────────────────────────────────
  useEffect(() => {
    if (step !== 'navigate' || busArrived) return;
    const totalSec = (proposal?.busArrivalMin || 6) * 60;
    const interval = setInterval(() => {
      setBusProgress(p => Math.min(1, p + 1 / totalSec));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, busArrived]);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9990] flex items-end sm:items-center justify-center p-3"
      style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(14px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full max-w-sm rounded-3xl overflow-hidden animate-slide-up"
        style={{
          background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid rgba(255,255,255,.1)',
          boxShadow: '0 32px 80px rgba(0,0,0,.7)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>🚀</div>
            <div>
              <div className="text-sm font-black text-white">Voyager</div>
              <div className="text-[10px]" style={{ color: '#475569' }}>Trajet guidé depuis ma position</div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all hover:scale-110"
            style={{ background: 'rgba(255,255,255,.07)', color: '#64748b' }}>✕</button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-5" style={{ scrollbarWidth: 'none' }}>
          <StepDots step={step} />

          {/* ── Étape 1 : GPS ── */}
          {step === 'geolocate' && (
            <div className="text-center py-8">
              {geoError ? (
                <>
                  <div className="text-4xl mb-3">📍</div>
                  <p className="text-sm font-bold text-red-400 mb-4">{geoError}</p>
                  <button onClick={() => { setGeoError(''); setStep('geolocate'); }}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                    style={{ background: '#2563eb' }}>Réessayer</button>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4" style={{ animation: 'spin 2s linear infinite' }}>🌐</div>
                  <p className="text-sm font-bold text-white mb-1">Localisation en cours…</p>
                  <p className="text-xs" style={{ color: '#475569' }}>Veuillez autoriser l'accès au GPS</p>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </>
              )}
            </div>
          )}

          {/* ── Étape 2 : Destination ── */}
          {step === 'destination' && (
            <div>
              <p className="text-lg font-black text-white mb-1">Où voulez-vous aller ?</p>
              <p className="text-xs mb-4" style={{ color: '#475569' }}>
                📍 Position détectée — entrez votre destination
              </p>
              <div className="relative">
                <input
                  ref={inputRef}
                  value={destInput}
                  onChange={e => setDestInput(e.target.value)}
                  placeholder="Ex: Sandaga, UCAD, Liberté 6…"
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{
                    background: 'rgba(255,255,255,.07)',
                    border: '1.5px solid rgba(255,255,255,.12)',
                    color: 'white',
                  }}
                />
                {destInput && (
                  <button onClick={() => { setDestInput(''); setSuggestions([]); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">✕</button>
                )}
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-2 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,.08)' }}>
                  {suggestions.slice(0, 5).map((r, i) => (
                    <button key={i} onClick={() => selectDest(r)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                      style={{ background: i % 2 === 0 ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.02)', borderBottom: i < 4 ? '1px solid rgba(255,255,255,.05)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,99,235,.15)')}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.02)')}>
                      <span className="text-base flex-shrink-0">{r.type === 'stop' ? '🚏' : '📍'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{r.label}</div>
                        {r.nearestStop && r.type !== 'stop' && (
                          <div className="text-[10px] truncate" style={{ color: '#475569' }}>
                            Arrêt proche : {r.nearestStop.name}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {destInput.length > 2 && suggestions.length === 0 && (
                <p className="text-xs text-center mt-3" style={{ color: '#475569' }}>Aucun résultat pour "{destInput}"</p>
              )}
            </div>
          )}

          {/* ── Étape 3 : Proposition ── */}
          {step === 'propose' && proposal && (
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#475569' }}>
                Trajet proposé
              </p>

              {/* Destination */}
              <div className="flex items-center gap-2 mb-4 p-3 rounded-2xl"
                style={{ background: 'rgba(37,99,235,.1)', border: '1px solid rgba(37,99,235,.2)' }}>
                <span>🎯</span>
                <div>
                  <div className="text-xs" style={{ color: '#475569' }}>Destination</div>
                  <div className="text-sm font-black text-white">{proposal.destStop.name}</div>
                </div>
              </div>

              {/* Opérateur recommandé */}
              <div className="flex items-center gap-3 p-4 rounded-2xl mb-3"
                style={{ background: proposal.operatorColor + '18', border: `1px solid ${proposal.operatorColor}30` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: proposal.operatorColor + '25' }}>🚌</div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: proposal.operatorColor }}>
                    Opérateur recommandé
                  </div>
                  <div className="text-base font-black text-white">
                    {OPERATORS[proposal.operator as keyof typeof OPERATORS]?.fullName || proposal.operator}
                  </div>
                  <div className="text-xs font-bold mt-0.5" style={{ color: proposal.operatorColor }}>
                    {proposal.option.primaryLineName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black" style={{ color: proposal.operatorColor }}>{proposal.option.fare}</div>
                  <div className="text-[10px]" style={{ color: '#475569' }}>FCFA</div>
                </div>
              </div>

              {/* Infos clés */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { icon: '🚶', label: 'À pied', value: `${proposal.walkMeters}m`, sub: `${proposal.walkMin} min` },
                  { icon: '🕐', label: 'Bus dans', value: `${proposal.busArrivalMin} min`, sub: 'simulé' },
                  { icon: '⏱️', label: 'Trajet', value: `${proposal.option.totalMin} min`, sub: 'total' },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-2xl text-center"
                    style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)' }}>
                    <div className="text-lg mb-0.5">{item.icon}</div>
                    <div className="text-[10px] font-bold" style={{ color: '#475569' }}>{item.label}</div>
                    <div className="text-sm font-black text-white">{item.value}</div>
                    <div className="text-[9px]" style={{ color: '#334155' }}>{item.sub}</div>
                  </div>
                ))}
              </div>

              {/* Arrêt de départ */}
              <div className="flex items-center gap-3 p-3 rounded-2xl mb-4"
                style={{ background: 'rgba(5,150,105,.1)', border: '1px solid rgba(5,150,105,.25)' }}>
                <span className="text-xl">🟢</span>
                <div>
                  <div className="text-[10px] font-bold" style={{ color: '#34d399' }}>Arrêt de départ le plus proche</div>
                  <div className="text-sm font-black text-white">{proposal.nearestStop.name}</div>
                  <div className="text-[10px]" style={{ color: '#475569' }}>
                    {proposal.walkMeters} m de votre position · {proposal.walkMin} min à pied
                  </div>
                </div>
              </div>

              <button onClick={startJourney}
                className="w-full py-4 rounded-2xl text-white font-black text-base transition-all hover:scale-[1.02] active:scale-98"
                style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', boxShadow: '0 8px 32px rgba(37,99,235,.4)' }}>
                ✅ Valider et démarrer la navigation
              </button>

              <button onClick={() => { setStep('destination'); setDestInput(''); setProposal(null); }}
                className="w-full py-3 mt-2 text-sm font-bold transition-colors"
                style={{ color: '#475569' }}>
                ← Changer de destination
              </button>
            </div>
          )}

          {/* ── Étape 4 : Navigation ── */}
          {step === 'navigate' && proposal && (
            <div>
              {!busArrived ? (
                <>
                  <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#475569' }}>
                    Navigation en cours
                  </p>

                  {/* Marche vers l'arrêt */}
                  <div className="p-4 rounded-2xl mb-4"
                    style={{ background: 'rgba(5,150,105,.1)', border: '1px solid rgba(5,150,105,.3)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🚶</span>
                      <div>
                        <div className="text-sm font-black text-white">Marchez vers l'arrêt</div>
                        <div className="font-black" style={{ color: '#34d399' }}>{proposal.nearestStop.name}</div>
                        <div className="text-xs" style={{ color: '#475569' }}>{proposal.walkMeters} m · {proposal.walkMin} min</div>
                      </div>
                    </div>
                    {/* Barre de progression marche */}
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.1)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, busProgress * 100 * 0.3)}%`, background: '#34d399' }} />
                    </div>
                  </div>

                  {/* Arrivée bus countdown */}
                  <div className="p-4 rounded-2xl mb-4"
                    style={{ background: 'rgba(37,99,235,.1)', border: '1px solid rgba(37,99,235,.3)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🚌</span>
                        <div>
                          <div className="text-sm font-black text-white">{proposal.option.primaryLineName}</div>
                          <div className="text-xs" style={{ color: '#475569' }}>approche de l'arrêt…</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black" style={{ color: '#60a5fa' }}>
                          <Countdown totalSec={proposal.busArrivalMin * 60} onDone={() => setBusArrived(true)} />
                        </div>
                        <div className="text-[10px]" style={{ color: '#475569' }}>avant arrivée</div>
                      </div>
                    </div>

                    {/* Barre bus qui approche */}
                    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.1)' }}>
                      <div className="absolute h-full rounded-full transition-all"
                        style={{ width: `${busProgress * 100}%`, background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }} />
                      <div className="absolute top-1/2 -translate-y-1/2 text-sm transition-all"
                        style={{ left: `${Math.max(0, busProgress * 100 - 4)}%` }}>🚌</div>
                    </div>
                    <div className="flex justify-between text-[9px] mt-1" style={{ color: '#334155' }}>
                      <span>Terminus</span>
                      <span>{proposal.nearestStop.name}</span>
                    </div>
                  </div>

                  {/* Infos trajet */}
                  <div className="flex items-center gap-2 p-3 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
                    <span>🎯</span>
                    <div className="flex-1 text-xs" style={{ color: '#94a3b8' }}>
                      Destination : <span className="text-white font-bold">{proposal.destStop.name}</span>
                    </div>
                    <span className="text-sm font-black" style={{ color: '#fbbf24' }}>{proposal.option.fare} F</span>
                  </div>
                </>
              ) : (
                /* Bus arrivé ! */
                <div className="text-center py-6">
                  <div className="text-6xl mb-4" style={{ animation: 'bounce 1s infinite' }}>🚌</div>
                  <h2 className="text-xl font-black text-white mb-2">Le bus est arrivé !</h2>
                  <p className="text-sm mb-1" style={{ color: '#34d399' }}>
                    {proposal.option.primaryLineName} — {proposal.nearestStop.name}
                  </p>
                  <p className="text-xs mb-6" style={{ color: '#475569' }}>
                    Montez à bord · Destination : {proposal.destStop.name}
                  </p>
                  <div className="p-3 rounded-2xl mb-4"
                    style={{ background: 'rgba(250,204,21,.1)', border: '1px solid rgba(250,204,21,.25)' }}>
                    <div className="text-2xl font-black" style={{ color: '#fbbf24' }}>{proposal.option.fare} FCFA</div>
                    <div className="text-xs mt-0.5" style={{ color: '#475569' }}>Tarif à payer au chauffeur</div>
                  </div>
                  <button onClick={onClose}
                    className="w-full py-3 rounded-2xl text-white font-black"
                    style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                    Bon voyage ! 🎉
                  </button>
                  <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}`}</style>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
