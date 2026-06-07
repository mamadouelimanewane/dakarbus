/**
 * VoyagerWizard — Workflow guidé "Voyager"
 * Étapes :
 *  1. Départ    — position GPS confirmée (PAS d'arrêt suggéré encore)
 *  2. Opérateur — DDD | AFTU | TER | BRT
 *  3. Destination — saisie + arrêt de départ affiché APRÈS choix opérateur
 *  4. Résultat  — tracé sur carte
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setUserLocation, setRouteOrigin, setRouteDestination,
  setRouteDisplay, setMapCenter, setMapZoom, setActiveTab,
} from '@/store/store';
import { searchLocal } from '@/utils/placeSearch';
import { getNearestStop, walkingMinutes } from '@/utils/nearest';
import { findRoutes } from '@/utils/routeFinder';
import { STOPS, LINES, OPERATORS } from '@/data/transportData';
import type { Stop } from '@/types';
import type { RouteOption } from '@/utils/routeFinder';

// ── Types ──────────────────────────────────────────────────────
type Step = 'depart' | 'operateur' | 'destination' | 'resultat';
type OperatorId = 'DDD' | 'AFTU' | 'TER' | 'BRT';

// ── Barre de progression ───────────────────────────────────────
const STEP_LABELS: Record<Step, string> = {
  depart: 'Départ',
  operateur: 'Opérateur',
  destination: 'Destination',
  resultat: 'Résultat',
};
const STEPS: Step[] = ['depart', 'operateur', 'destination', 'resultat'];

function StepBar({ step }: { step: Step }) {
  const idx = STEPS.indexOf(step);
  return (
    <div className="flex items-center justify-center gap-1 mb-5 px-2">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-1">
            <div className="rounded-full transition-all duration-300 flex items-center justify-center"
              style={{
                width: i <= idx ? 28 : 22, height: i <= idx ? 28 : 22,
                background: i < idx ? '#2563eb' : i === idx ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : 'rgba(255,255,255,.08)',
                boxShadow: i === idx ? '0 0 12px rgba(124,58,237,.6)' : 'none',
                fontSize: 11, fontWeight: 900, color: i <= idx ? 'white' : '#475569',
              }}>
              {i < idx ? '✓' : i + 1}
            </div>
            <span className="text-[8px] font-bold" style={{ color: i === idx ? '#818cf8' : '#334155' }}>
              {STEP_LABELS[s]}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-0.5 mb-4 rounded-full"
              style={{ background: i < idx ? '#2563eb' : 'rgba(255,255,255,.06)', maxWidth: 40 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── SearchInput réutilisable ───────────────────────────────────
function SearchInput({
  value, onChange, onSelect, placeholder, userPos, autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (stop: Stop) => void;
  placeholder: string;
  userPos?: [number, number];
  autoFocus?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) setTimeout(() => ref.current?.focus(), 250);
  }, [autoFocus]);

  useEffect(() => {
    if (!value.trim()) { setSuggestions([]); return; }
    setSuggestions(searchLocal(value, userPos?.[0], userPos?.[1], 6));
  }, [value]);

  return (
    <div className="relative">
      <input ref={ref} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
        style={{ background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.12)', color: 'white' }} />
      {value && (
        <button onClick={() => { onChange(''); setSuggestions([]); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">✕</button>
      )}
      {suggestions.length > 0 && (
        <div className="mt-1.5 rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,.08)', background: 'rgba(10,15,30,.95)' }}>
          {suggestions.slice(0, 5).map((r, i) => {
            const stop: Stop | null = r.type === 'stop' ? r.stop : r.nearestStop;
            if (!stop) return null;
            return (
              <button key={i} onClick={() => { onSelect(stop); onChange(stop.name); setSuggestions([]); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-blue-900/30"
                style={{ borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                <span>{r.type === 'stop' ? '🚏' : '📍'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{r.label || stop.name}</div>
                  {r.type !== 'stop' && r.nearestStop && (
                    <div className="text-[10px] truncate" style={{ color: '#475569' }}>→ {stop.name}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Opérateurs config ──────────────────────────────────────────
const OP_CONFIG: { id: OperatorId; emoji: string; color: string; desc: string }[] = [
  { id: 'DDD',  emoji: '🚌', color: '#1a56db', desc: 'Dakar Dem Dikk' },
  { id: 'AFTU', emoji: '🚐', color: '#e11d48', desc: 'Car Rapide' },
  { id: 'BRT',  emoji: '🚍', color: '#7c3aed', desc: 'Bus Rapide' },
  { id: 'TER',  emoji: '🚆', color: '#059669', desc: 'Train Express' },
];

// ── Composant principal ────────────────────────────────────────
export default function VoyagerWizard({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { userLocation } = useAppSelector(s => s.mobility);

  const [step, setStep] = useState<Step>('depart');

  // Étape 1 — Départ : juste la position GPS, PAS d'arrêt encore
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [myPos, setMyPos] = useState<[number, number] | null>(userLocation);

  // Étape 2 — Opérateur
  const [selectedOp, setSelectedOp] = useState<OperatorId | null>(null);

  // Étape 3 — Destination + arrêt de départ résolu APRÈS opérateur
  const [departStop, setDepartStop] = useState<Stop | null>(null);
  const [departInput, setDepartInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [destStop, setDestStop] = useState<Stop | null>(null);

  // Étape 4 — Résultat
  const [route, setRoute] = useState<RouteOption | null>(null);
  const [routeError, setRouteError] = useState('');

  // ── Init GPS au montage ────────────────────────────────────
  useEffect(() => {
    if (myPos) return; // position déjà connue, pas besoin de demander
    setGeoLoading(true);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMyPos(loc);
        dispatch(setUserLocation(loc));
        setGeoLoading(false);
      },
      () => { setGeoLoading(false); setGeoError('GPS indisponible'); },
      { timeout: 8000 }
    );
  }, []);

  // ── Résoudre l'arrêt de départ quand on arrive à l'étape destination ──
  // C'est ICI que l'arrêt est suggéré, APRÈS le choix d'opérateur
  useEffect(() => {
    if (step !== 'destination') return;
    if (!myPos) return;
    if (departStop) return; // déjà choisi manuellement

    const nearest = getNearestStop(myPos[0], myPos[1]);
    if (nearest) {
      setDepartStop(nearest.stop);
      setDepartInput(nearest.stop.name);
    }
  }, [step]);

  // ── Navigation entre étapes ────────────────────────────────
  const goNext = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };
  const goBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  // ── Calcul itinéraire (étape 4) ────────────────────────────
  useEffect(() => {
    if (step !== 'resultat') return;
    if (!departStop || !destStop) { setRouteError('Départ ou destination manquant'); return; }
    setRoute(null); setRouteError('');

    const options = findRoutes(departStop, destStop, myPos?.[0], myPos?.[1]);
    const filtered = selectedOp
      ? options.filter(o => o.operator === selectedOp)
      : options;
    const best = filtered[0] || options[0];

    if (!best) { setRouteError('Aucun trajet trouvé'); return; }
    setRoute(best);

    dispatch(setRouteOrigin(departStop));
    dispatch(setRouteDestination(destStop));
    const busSteps = best.steps.filter((s: any) => s.type === 'bus' && s.lineId && s.fromStopId && s.toStopId);
    const segments = busSteps.map((s: any) => {
      const line = LINES.find(l => l.id === s.lineId);
      return { lineId: s.lineId!, lineName: line?.name || s.lineId!, color: s.color, fromStopId: s.fromStopId!, toStopId: s.toStopId! };
    });
    const transferStopIds = best.steps.filter((s: any) => s.type === 'transfer' && s.fromStopId).map((s: any) => s.fromStopId!);
    const allBus = best.steps.filter((s: any) => s.type === 'bus');
    dispatch(setRouteDisplay({
      segments,
      originStopId: departStop.id,
      destStopId: allBus[allBus.length - 1]?.toStopId || destStop.id,
      transferStopIds,
      walkFrom: best.walkMin > 0 && myPos ? myPos : null,
      fare: best.fare,
    }));
    dispatch(setMapCenter([departStop.lat, departStop.lng]));
    dispatch(setMapZoom(14));
    dispatch(setActiveTab('plan'));
  }, [step]);

  const opConfig = OP_CONFIG.find(o => o.id === route?.operator);
  const nearestMeters = myPos && departStop
    ? Math.round(Math.sqrt(Math.pow((myPos[0] - departStop.lat) * 111000, 2) + Math.pow((myPos[1] - departStop.lng) * 85000, 2)))
    : null;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9990] flex items-end sm:items-center justify-center p-3"
      style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(14px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 100%)',
          border: '1px solid rgba(255,255,255,.1)',
          boxShadow: '0 32px 80px rgba(0,0,0,.7)',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>🚀</div>
            <div>
              <div className="text-sm font-black text-white">Voyager</div>
              <div className="text-[10px]" style={{ color: '#475569' }}>Trajet guidé pas à pas</div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'rgba(255,255,255,.07)', color: '#64748b' }}>✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'none' }}>
          <StepBar step={step} />

          {/* ══ ÉTAPE 1 : DÉPART — position GPS seulement ════════ */}
          {step === 'depart' && (
            <div>
              <p className="text-base font-black text-white mb-1">D'où partez-vous ?</p>
              <p className="text-xs mb-5" style={{ color: '#475569' }}>
                {geoLoading ? '📡 Localisation GPS en cours…'
                  : geoError ? `⚠️ ${geoError}`
                  : myPos ? '📍 Position GPS détectée'
                  : '📍 Activation du GPS…'}
              </p>

              {/* Carte de confirmation GPS */}
              {myPos ? (
                <div className="flex items-center gap-3 p-4 rounded-2xl mb-4"
                  style={{ background: 'rgba(5,150,105,.1)', border: '1.5px solid rgba(5,150,105,.3)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                    style={{ background: 'rgba(5,150,105,.2)' }}>📍</div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#34d399' }}>Position GPS confirmée</div>
                    <div className="text-sm font-black text-white mt-0.5">Ma position actuelle</div>
                    <div className="text-[10px] mt-0.5 font-mono" style={{ color: '#475569' }}>
                      {myPos[0].toFixed(5)}, {myPos[1].toFixed(5)}
                    </div>
                  </div>
                  <span className="text-2xl">✅</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-2xl mb-4"
                  style={{ background: 'rgba(234,179,8,.1)', border: '1.5px solid rgba(234,179,8,.3)' }}>
                  <div className="text-2xl">📡</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">
                      {geoLoading ? 'Recherche GPS…' : geoError || 'GPS non disponible'}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: '#92400e' }}>
                      Activez le GPS pour un trajet précis
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-center" style={{ color: '#334155' }}>
                L'arrêt de départ sera suggéré après le choix de l'opérateur
              </p>
            </div>
          )}

          {/* ══ ÉTAPE 2 : OPÉRATEUR ═══════════════════════════ */}
          {step === 'operateur' && (
            <div>
              <p className="text-base font-black text-white mb-1">Quel opérateur ?</p>
              <p className="text-xs mb-4" style={{ color: '#475569' }}>Choisissez ou passez pour toutes les lignes</p>
              <div className="grid grid-cols-2 gap-3">
                {OP_CONFIG.map(op => (
                  <button key={op.id} onClick={() => setSelectedOp(op.id === selectedOp ? null : op.id)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: selectedOp === op.id ? op.color + '28' : 'rgba(255,255,255,.05)',
                      border: `2px solid ${selectedOp === op.id ? op.color : 'rgba(255,255,255,.08)'}`,
                      boxShadow: selectedOp === op.id ? `0 4px 20px ${op.color}40` : 'none',
                    }}>
                    <span className="text-3xl">{op.emoji}</span>
                    <div className="text-center">
                      <div className="text-sm font-black text-white">{op.id}</div>
                      <div className="text-[10px]" style={{ color: selectedOp === op.id ? op.color : '#475569' }}>{op.desc}</div>
                    </div>
                    {selectedOp === op.id && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-white"
                        style={{ background: op.color }}>✓</div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-center mt-3" style={{ color: '#334155' }}>
                Sans sélection → meilleur itinéraire toutes lignes
              </p>
            </div>
          )}

          {/* ══ ÉTAPE 3 : DESTINATION + arrêt de départ ══════ */}
          {step === 'destination' && (
            <div className="space-y-4">
              <div>
                <p className="text-base font-black text-white mb-1">Où allez-vous ?</p>
                <p className="text-xs mb-3" style={{ color: '#475569' }}>Tapez un quartier, arrêt ou lieu</p>
              </div>

              {/* Arrêt de départ — résolu MAINTENANT, après l'opérateur */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#475569' }}>
                  Arrêt de départ suggéré
                </p>
                {departStop ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl mb-1"
                    style={{ background: 'rgba(37,99,235,.1)', border: '1px solid rgba(37,99,235,.25)' }}>
                    <span className="text-lg">🚏</span>
                    <div className="flex-1">
                      <div className="text-sm font-black text-white">{departStop.name}</div>
                      {nearestMeters && (
                        <div className="text-[10px]" style={{ color: '#60a5fa' }}>
                          {nearestMeters} m · {walkingMinutes(nearestMeters)} min à pied
                        </div>
                      )}
                    </div>
                    <span style={{ color: '#60a5fa' }}>✓</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl mb-1 text-xs" style={{ background: 'rgba(255,255,255,.04)', color: '#475569' }}>
                    GPS requis pour suggérer un arrêt
                  </div>
                )}
                {/* Possibilité de changer l'arrêt */}
                <SearchInput value={departInput} onChange={v => { setDepartInput(v); }}
                  onSelect={s => { setDepartStop(s); setDepartInput(s.name); }}
                  placeholder="Changer l'arrêt de départ…"
                  userPos={myPos ?? undefined} />
              </div>

              {/* Destination */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#475569' }}>
                  Destination
                </p>
                <SearchInput value={destInput} onChange={setDestInput}
                  onSelect={s => { setDestStop(s); setDestInput(s.name); }}
                  placeholder="Ex: Sandaga, UCAD, Liberté 6…"
                  userPos={myPos ?? undefined} autoFocus />

                {destStop && (
                  <div className="mt-2 flex items-center gap-2 p-3 rounded-2xl"
                    style={{ background: 'rgba(5,150,105,.1)', border: '1px solid rgba(5,150,105,.25)' }}>
                    <span>🎯</span>
                    <div className="flex-1">
                      <div className="text-[10px]" style={{ color: '#34d399' }}>Destination sélectionnée</div>
                      <div className="text-sm font-black text-white">{destStop.name}</div>
                    </div>
                    <span style={{ color: '#34d399', fontWeight: 900 }}>✓</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ ÉTAPE 4 : RÉSULTAT ════════════════════════════ */}
          {step === 'resultat' && (
            <div>
              {!route && !routeError && (
                <div className="text-center py-8">
                  <div className="text-3xl mb-3" style={{ animation: 'spin 1.5s linear infinite' }}>⚙️</div>
                  <p className="text-sm font-bold text-white">Calcul en cours…</p>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              )}
              {routeError && (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">🗺️</div>
                  <p className="text-sm font-bold text-yellow-400">{routeError}</p>
                  <button onClick={goBack} className="mt-4 text-xs text-blue-400 underline">← Modifier la destination</button>
                </div>
              )}
              {route && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#475569' }}>Itinéraire trouvé</p>

                  {/* Opérateur + ligne */}
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl"
                    style={{ background: (opConfig?.color || '#2563eb') + '18', border: `1px solid ${opConfig?.color || '#2563eb'}30` }}>
                    <span className="text-2xl">{opConfig?.emoji || '🚌'}</span>
                    <div className="flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: opConfig?.color || '#60a5fa' }}>
                        {OPERATORS[route.operator as keyof typeof OPERATORS]?.fullName || route.operator}
                      </div>
                      <div className="text-sm font-black text-white">{route.primaryLineName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black" style={{ color: opConfig?.color || '#60a5fa' }}>{route.fare}</div>
                      <div className="text-[9px]" style={{ color: '#475569' }}>FCFA</div>
                    </div>
                  </div>

                  {/* 3 métriques */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: '🚶', label: 'À pied', val: `${route.walkMeters}m`, sub: `${walkingMinutes(route.walkMeters)} min` },
                      { icon: '🚌', label: 'En bus', val: `${route.totalMin - route.walkMin} min`, sub: '' },
                      { icon: '⏱️', label: 'Total', val: `${route.totalMin} min`, sub: '' },
                    ].map((m, i) => (
                      <div key={i} className="p-3 rounded-2xl text-center"
                        style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)' }}>
                        <div className="text-lg">{m.icon}</div>
                        <div className="text-[9px] font-bold mt-0.5" style={{ color: '#475569' }}>{m.label}</div>
                        <div className="text-xs font-black text-white">{m.val}</div>
                        {m.sub && <div className="text-[9px]" style={{ color: '#334155' }}>{m.sub}</div>}
                      </div>
                    ))}
                  </div>

                  {/* Départ → Arrivée */}
                  <div className="p-3 rounded-2xl space-y-2" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                        style={{ background: '#059669' }}>A</div>
                      <div className="text-xs font-bold text-white truncate">{departStop?.name}</div>
                    </div>
                    <div className="ml-2.5 w-px h-3" style={{ background: 'rgba(255,255,255,.1)' }} />
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                        style={{ background: '#dc2626' }}>B</div>
                      <div className="text-xs font-bold text-white truncate">{destStop?.name}</div>
                    </div>
                  </div>

                  <p className="text-[10px] text-center" style={{ color: '#334155' }}>
                    Le tracé est affiché sur la carte ↓
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex-shrink-0 px-5 pb-5 pt-3 space-y-2"
          style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>

          {/* Bouton principal */}
          {step !== 'resultat' && (
            <button
              onClick={goNext}
              disabled={
                (step === 'depart' && !myPos) ||
                (step === 'destination' && (!departStop || !destStop))
              }
              className="w-full py-3.5 rounded-2xl text-white font-black text-sm transition-all hover:scale-[1.02] active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', boxShadow: '0 6px 24px rgba(37,99,235,.4)' }}>
              {step === 'depart' ? 'Choisir l\'opérateur →'
                : step === 'operateur' ? 'Choisir la destination →'
                : 'Calculer l\'itinéraire 🗺️'}
            </button>
          )}

          {/* Valider sur résultat */}
          {step === 'resultat' && route && (
            <button onClick={onClose}
              className="w-full py-3.5 rounded-2xl text-white font-black text-sm transition-all hover:scale-[1.02] active:scale-[.98]"
              style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 6px 24px rgba(5,150,105,.4)' }}>
              ✅ Voir le tracé sur la carte
            </button>
          )}

          {/* Retour */}
          {step !== 'depart' && (
            <button onClick={goBack}
              className="w-full py-2 text-sm font-bold transition-colors"
              style={{ color: '#475569' }}>
              ← Retour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
