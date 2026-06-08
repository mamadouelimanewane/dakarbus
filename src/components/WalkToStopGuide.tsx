/**
 * WalkToStopGuide — Guidage piéton de la position GPS vers un arrêt
 *
 * Phases :
 *  1. WALK  — chemin affiché sur carte, distance + ETA + boussole
 *  2. WAIT  — arrivé (<50m), affiche les prochains bus avec countdown
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { routeOnFoot } from '@/utils/osrm';
import { getNextDepartures, OPERATORS } from '@/data/transportData';
import { usePopBack } from '@/hooks/usePopBack';
import { haptic } from '@/utils/haptic';
import type { Stop } from '@/types';

// ── Helpers géo ───────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180)
          - Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

function cardinal(deg: number): { label: string; arrow: string } {
  const dirs = [
    { label: 'Nord',       arrow: '↑' },
    { label: 'Nord-Est',   arrow: '↗' },
    { label: 'Est',        arrow: '→' },
    { label: 'Sud-Est',    arrow: '↘' },
    { label: 'Sud',        arrow: '↓' },
    { label: 'Sud-Ouest',  arrow: '↙' },
    { label: 'Ouest',      arrow: '←' },
    { label: 'Nord-Ouest', arrow: '↖' },
  ];
  return dirs[Math.round(deg / 45) % 8];
}

function fmtDist(m: number): string {
  if (m < 10)   return 'Vous y êtes !';
  if (m < 1000) return `${Math.round(m / 5) * 5} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

function etaText(m: number): string {
  const mins = Math.ceil(m / 72); // 72 m/min = ~4.3 km/h
  if (mins <= 0) return '< 1 min';
  if (mins === 1) return '1 min';
  return `${mins} min à pied`;
}

// ── Icônes Leaflet ────────────────────────────────────────────
const userIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:24px;height:24px">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(37,99,235,.25);animation:pr 2s ease-out infinite"></div>
    <div style="position:absolute;inset:4px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 0 16px rgba(37,99,235,.8)"></div>
  </div>
  <style>@keyframes pr{0%{transform:scale(.8);opacity:.8}100%{transform:scale(2.8);opacity:0}}</style>`,
  iconSize: [24, 24], iconAnchor: [12, 12],
});

const stopIcon = (color: string) => L.divIcon({
  className: '',
  html: `<div style="position:relative;width:32px;height:32px">
    <div style="position:absolute;inset:0;border-radius:50%;background:${color}40;animation:pr 1.5s ease-out infinite"></div>
    <div style="position:absolute;inset:5px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 0 14px ${color}99;display:flex;align-items:center;justify-content:center;font-size:10px">📍</div>
  </div>
  <style>@keyframes pr{0%{transform:scale(.8);opacity:.7}100%{transform:scale(2.4);opacity:0}}</style>`,
  iconSize: [32, 32], iconAnchor: [16, 16],
});

// ── Sous-composant : suit la position sur la carte ────────────
function MapFollower({ pos }: { pos: [number, number] }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      // Premier centrage : fit les deux points
      return;
    }
    map.panTo(pos, { animate: true, duration: 1 });
  }, [pos[0], pos[1]]);
  return null;
}

// ── Sous-composant : fit initial ──────────────────────────────
function InitialFit({ userPos, stopPos }: { userPos: [number, number]; stopPos: [number, number] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    try {
      map.fitBounds([userPos, stopPos], { padding: [60, 60], maxZoom: 17 });
    } catch {}
  }, []);
  return null;
}

// ── Countdown chip ────────────────────────────────────────────
function Countdown({ waitMin }: { waitMin: number }) {
  const [secs, setSecs] = useState(waitMin * 60);
  useEffect(() => {
    setSecs(waitMin * 60);
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [waitMin]);
  const m = Math.floor(secs / 60), s = secs % 60;
  const color = m <= 2 ? '#34d399' : m <= 8 ? '#fbbf24' : '#94a3b8';
  return (
    <span className="font-black tabular-nums text-sm" style={{ color }}>
      {m > 0 ? `${m}m` : ''}{s > 0 || m === 0 ? `${String(s).padStart(2, '0')}s` : ''}
    </span>
  );
}

// ── Composant principal ───────────────────────────────────────
interface Props {
  stop: Stop;
  initialPos: [number, number];
  onClose: () => void;
  onBoardBus?: (stopId: string) => void;
}

export default function WalkToStopGuide({ stop, initialPos, onClose, onBoardBus }: Props) {
  usePopBack(onClose);

  const [currentPos, setCurrentPos] = useState<[number, number]>(initialPos);
  const [walkPath, setWalkPath]     = useState<[number, number][] | null>(null);
  const [pathLoading, setPathLoading] = useState(true);
  const [arrived, setArrived]       = useState(false);
  const [deps, setDeps]             = useState(() => getNextDepartures(stop.id));
  const [accuracy, setAccuracy]     = useState<number | null>(null);
  const watchRef = useRef<number | null>(null);
  const initialDist = useRef(haversine(initialPos[0], initialPos[1], stop.lat, stop.lng));

  const mainOp   = stop.operators[0];
  const opColor  = OPERATORS[mainOp]?.color || '#2563eb';
  const currentDist = haversine(currentPos[0], currentPos[1], stop.lat, stop.lng);
  const pct      = Math.max(0, Math.min(100, ((initialDist.current - currentDist) / initialDist.current) * 100));
  const dir      = cardinal(bearing(currentPos[0], currentPos[1], stop.lat, stop.lng));

  // ── Tracé du chemin OSRM ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setPathLoading(true);
    routeOnFoot([
      { lat: initialPos[0], lng: initialPos[1] },
      { lat: stop.lat,      lng: stop.lng },
    ]).then(path => {
      if (cancelled) return;
      setWalkPath(path ?? [[initialPos[0], initialPos[1]], [stop.lat, stop.lng]]);
      setPathLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // ── Suivi GPS en continu ──────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCurrentPos(p);
        setAccuracy(Math.round(pos.coords.accuracy));
        const d = haversine(p[0], p[1], stop.lat, stop.lng);
        if (d < 50 && !arrived) {
          setArrived(true);
          haptic('success');
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
    );
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [arrived]);

  // ── Rafraîchissement des départs ─────────────────────────
  useEffect(() => {
    setDeps(getNextDepartures(stop.id));
    const id = setInterval(() => setDeps(getNextDepartures(stop.id)), 20_000);
    return () => clearInterval(id);
  }, [stop.id]);

  // ── Rendu carte ───────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9900] flex flex-col" style={{ background: '#0a0f1e' }}>

      {/* ── Barre de titre ─────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 z-10"
        style={{ background: 'rgba(8,12,24,.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'rgba(255,255,255,.07)', color: '#94a3b8' }}>‹</button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: opColor }} />
            <span className="font-black text-white text-sm truncate">{stop.name}</span>
          </div>
          <div className="text-[10px] mt-0.5 flex items-center gap-2" style={{ color: '#475569' }}>
            {arrived
              ? <span style={{ color: '#34d399' }}>✅ Vous êtes arrivé(e) !</span>
              : <><span>{fmtDist(currentDist)}</span><span>·</span><span>{etaText(currentDist)}</span></>}
            {accuracy !== null && !arrived && (
              <span style={{ color: accuracy < 20 ? '#34d399' : accuracy < 50 ? '#fbbf24' : '#dc2626' }}>
                GPS ±{accuracy}m
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <div className="text-xl font-black" style={{ color: arrived ? '#34d399' : opColor }}>
            {arrived ? '🏁' : dir.arrow}
          </div>
          <div className="text-[9px] font-bold" style={{ color: '#334155' }}>
            {arrived ? 'Arrêt' : dir.label}
          </div>
        </div>
      </div>

      {/* ── Carte ─────────────────────────────────────────── */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        <MapContainer
          center={currentPos}
          zoom={16}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            keepBuffer={4}
          />
          <InitialFit userPos={currentPos} stopPos={[stop.lat, stop.lng]} />
          <MapFollower pos={currentPos} />

          {/* Chemin piéton */}
          {walkPath && (
            <Polyline
              positions={walkPath}
              pathOptions={{
                color: '#3b82f6',
                weight: 5,
                opacity: 0.85,
                dashArray: arrived ? undefined : '10, 8',
                lineCap: 'round',
              }}
            />
          )}

          {/* Utilisateur */}
          <Marker position={currentPos} icon={userIcon} zIndexOffset={1000} />

          {/* Arrêt cible */}
          <Marker position={[stop.lat, stop.lng]} icon={stopIcon(opColor)} zIndexOffset={900} />
        </MapContainer>

        {/* Chargement du tracé */}
        {pathLoading && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(8,12,24,.9)', color: '#60a5fa', backdropFilter: 'blur(8px)' }}>
            🗺️ Calcul du chemin…
          </div>
        )}

        {/* Badge distance flottant */}
        {!arrived && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-2 px-4 py-2 rounded-2xl"
            style={{ background: 'rgba(8,12,24,.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.1)' }}>
            <span className="text-base">{dir.arrow}</span>
            <span className="font-black text-white text-sm">{fmtDist(currentDist)}</span>
            <span className="text-xs" style={{ color: '#475569' }}>·</span>
            <span className="text-xs font-bold" style={{ color: '#60a5fa' }}>{etaText(currentDist)}</span>
          </div>
        )}
      </div>

      {/* ── Bottom sheet ────────────────────────────────────── */}
      <div className="flex-shrink-0"
        style={{
          background: 'rgba(8,12,24,.98)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,.08)',
          borderRadius: '22px 22px 0 0',
          maxHeight: '42vh',
          overflowY: 'auto',
          scrollbarWidth: 'none',
        }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 40, height: 4, borderRadius: 3, background: 'rgba(255,255,255,.18)' }} />
        </div>

        {/* ── MODE MARCHE ─────────────────────────────────── */}
        {!arrived && (
          <div className="px-4 pb-5 space-y-3">

            {/* Progression */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#334155' }}>
                  Progression
                </span>
                <span className="text-[10px] font-bold" style={{ color: '#475569' }}>
                  {Math.round(pct)}%
                </span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(255,255,255,.06)' }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${opColor}, #34d399)` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px]" style={{ color: '#334155' }}>📍 Votre position</span>
                <span className="text-[9px]" style={{ color: '#334155' }}>{stop.name} 🚏</span>
              </div>
            </div>

            {/* Instruction de marche */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl"
              style={{ background: `${opColor}12`, border: `1px solid ${opColor}25` }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${opColor}20` }}>
                {dir.arrow}
              </div>
              <div>
                <div className="font-black text-white text-sm">
                  Marchez vers le {dir.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#475569' }}>
                  encore {fmtDist(currentDist)} · {etaText(currentDist)}
                </div>
              </div>
            </div>

            {/* Aperçu des prochains bus */}
            {deps.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#334155' }}>
                  Prochains bus à {stop.name}
                </p>
                <div className="space-y-1.5">
                  {deps.slice(0, 3).map((d, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(255,255,255,.04)' }}>
                      <span className="text-[10px] font-black px-2 py-1 rounded-lg flex-shrink-0 text-white"
                        style={{ background: d.color }}>
                        {d.lineName}
                      </span>
                      <span className="flex-1 text-xs truncate" style={{ color: '#64748b' }}>
                        {d.route.split('↔')[1]?.trim() || d.route}
                      </span>
                      <Countdown waitMin={d.waitMin} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MODE ATTENTE ────────────────────────────────── */}
        {arrived && (
          <div className="px-4 pb-6 space-y-3">

            {/* Succès */}
            <div className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: 'rgba(5,150,105,.12)', border: '1px solid rgba(5,150,105,.3)' }}>
              <div className="text-3xl">✅</div>
              <div>
                <div className="font-black text-white">Vous êtes à l'arrêt !</div>
                <div className="text-xs mt-0.5" style={{ color: '#34d399' }}>
                  {stop.name} · {stop.zone}
                </div>
              </div>
            </div>

            {/* Opérateurs à cet arrêt */}
            <div className="flex gap-2 flex-wrap">
              {stop.operators.map(op => {
                const o = OPERATORS[op];
                return (
                  <span key={op} className="text-[10px] font-black px-3 py-1.5 rounded-xl text-white"
                    style={{ background: o?.color || '#64748b' }}>
                    {o?.icon} {op}
                  </span>
                );
              })}
              <span className="text-[10px] font-semibold px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,.06)', color: '#64748b' }}>
                {stop.lines.length} ligne{stop.lines.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Prochains passages — liste complète */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#334155' }}>
                Prochains passages
              </p>
              {deps.length === 0 ? (
                <div className="text-center py-6 text-sm" style={{ color: '#334155' }}>
                  Aucun départ prévu pour l'instant
                </div>
              ) : (
                <div className="space-y-2">
                  {deps.map((d, i) => (
                    <div key={i}
                      className="flex items-center gap-3 p-3 rounded-2xl transition-all"
                      style={{ background: `${d.color}10`, border: `1px solid ${d.color}20` }}>
                      {/* Badge ligne */}
                      <span className="text-[11px] font-black px-2.5 py-1.5 rounded-xl flex-shrink-0 text-white"
                        style={{ background: d.color, minWidth: 52, textAlign: 'center' }}>
                        {d.lineName}
                      </span>
                      {/* Direction */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {d.route.split('↔')[1]?.trim() || d.route}
                        </div>
                        <div className="text-[9px] mt-0.5" style={{ color: '#475569' }}>
                          {d.time}
                        </div>
                      </div>
                      {/* Countdown */}
                      <div className="text-right flex-shrink-0">
                        <Countdown waitMin={d.waitMin} />
                        <div className="text-[9px] mt-0.5" style={{ color: '#334155' }}>
                          {d.waitMin <= 1 ? 'imminent' : `dans ${d.waitMin} min`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bouton planifier depuis cet arrêt */}
            {onBoardBus && (
              <button onClick={() => { haptic('medium'); onBoardBus(stop.id); }}
                className="w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all active:scale-95"
                style={{ background: `linear-gradient(135deg, ${opColor}, ${opColor}cc)`, boxShadow: `0 6px 24px ${opColor}40` }}>
                🚌 Planifier un trajet depuis cet arrêt
              </button>
            )}

            <button onClick={onClose}
              className="w-full py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,.05)', color: '#64748b', border: '1px solid rgba(255,255,255,.08)' }}>
              Terminer le guidage
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
