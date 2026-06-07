import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup,
  Polyline, Circle, useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedStop, setMapCenter, setMapZoom, clearFocusedLine, setUserLocation } from '@/store/store';
import type { RouteDisplay } from '@/store/store';
import { STOPS, LINES, OPERATORS } from '@/data/transportData';
import { routeOnRoads, routeLine, lineRouteCache } from '@/utils/osrm';
import { buildStopTimings, sampleArrowPoints } from '@/utils/lineUtils';
import StopPopup from './StopPopup';
import type { Stop, Line, BusPosition } from '@/types';
import { MOCK_DRIVERS } from '@/services/simulation';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const makeStopIcon = (color: string, size = 10) => L.divIcon({
  className: '',
  html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,.8);box-shadow:0 2px 8px rgba(0,0,0,.5)"></div>`,
  iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size],
});

const makeTerminusIcon = (color: string) => L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:${color};border:2.5px solid rgba(255,255,255,.9);transform:rotate(45deg);box-shadow:0 2px 12px rgba(0,0,0,.4);border-radius:3px"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7], popupAnchor: [0, -12],
});

const makeBusMarkerIcon = (color: string, speed: number, occupancy: number) => {
  const occ = occupancy > 80 ? '#dc2626' : occupancy > 50 ? '#f59e0b' : '#22c55e';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:28px;height:28px">
      <div style="position:absolute;inset:0;border-radius:50%;background:${color}22;animation:pr 2.5s ease-out infinite"></div>
      <div style="position:absolute;inset:3px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 12px ${color}88;display:flex;align-items:center;justify-content:center;font-size:10px">🚌</div>
      <div style="position:absolute;-bottom:2px;-right:-2px;bottom:-2px;right:-2px;width:8px;height:8px;border-radius:50%;background:${occ};border:1.5px solid #0f172a"></div>
    </div>
    <style>@keyframes pr{0%{transform:scale(.8);opacity:.6}100%{transform:scale(2);opacity:0}}</style>`,
    iconSize: [28, 28], iconAnchor: [14, 14],
  });
};

const userIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:22px;height:22px">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(26,86,219,.2);animation:pr 2s ease-out infinite"></div>
    <div style="position:absolute;inset:4px;border-radius:50%;background:#1a56db;border:2.5px solid white;box-shadow:0 0 16px rgba(26,86,219,.6)"></div>
  </div>
  <style>@keyframes pr{0%{transform:scale(.8);opacity:.8}100%{transform:scale(2.6);opacity:0}}</style>`,
  iconSize: [22, 22], iconAnchor: [11, 11],
});

const makeRouteEndIcon = (color: string, label: string) => L.divIcon({
  className: '',
  html: `<div style="display:flex;flex-direction:column;align-items:center">
    <div style="width:22px;height:22px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 4px 16px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:white">${label}</div>
    <div style="width:3px;height:10px;background:${color};margin-top:-1px;border-radius:0 0 2px 2px;opacity:.8"></div>
  </div>`,
  iconSize: [22, 30], iconAnchor: [11, 30], popupAnchor: [0, -32],
});

const originIcon = makeRouteEndIcon('#059669', 'A');
const destIcon   = makeRouteEndIcon('#dc2626', 'B');

// ── Numbered stop icon for focused line ───────────────────────
const makeNumberedStopIcon = (index: number, color: string, isTerminus: boolean) => L.divIcon({
  className: '',
  html: isTerminus
    ? `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
        <div style="width:22px;height:22px;border-radius:50%;background:${color};border:2.5px solid white;
          box-shadow:0 0 16px ${color}88,0 4px 12px rgba(0,0,0,.5);
          display:flex;align-items:center;justify-content:center;
          font-size:9px;font-weight:900;color:white;line-height:1">
          ${index === 1 ? 'A' : 'Z'}
        </div>
        <div style="width:2px;height:8px;background:${color};border-radius:2px;opacity:.7"></div>
      </div>`
    : `<div style="width:18px;height:18px;border-radius:50%;background:${color}dd;
        border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4);
        display:flex;align-items:center;justify-content:center;
        font-size:8px;font-weight:900;color:white;line-height:1">
        ${index}
      </div>`,
  iconSize: isTerminus ? [22, 32] : [18, 18],
  iconAnchor: isTerminus ? [11, 32] : [9, 9],
  popupAnchor: [0, isTerminus ? -34 : -20],
});

// ── Direction arrow icon ──────────────────────────────────────
const makeArrowIcon = (deg: number, color: string) => L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;display:flex;align-items:center;justify-content:center;
    transform:rotate(${deg}deg);filter:drop-shadow(0 1px 3px rgba(0,0,0,.6))">
    <svg width="14" height="14" viewBox="0 0 14 14">
      <polygon points="7,1 13,13 7,10 1,13" fill="${color}" opacity="0.9"/>
    </svg>
  </div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// ── Focused line: numbered stops + arrows ─────────────────────
function FocusedLineOverlay({ line }: { line: Line }) {
  const dispatch = useAppDispatch();
  const [coords, setCoords] = useState<[number, number][] | null>(null);
  const timings = buildStopTimings(line);

  useEffect(() => {
    if (lineRouteCache[line.id]) { setCoords(lineRouteCache[line.id]); return; }
    const stops = line.stops.map(id => STOPS.find(s => s.id === id)).filter(Boolean) as Stop[];
    if (stops.length < 2) return;
    routeLine(stops).then(result => {
      const c = result || stops.map(s => [s.lat, s.lng] as [number, number]);
      lineRouteCache[line.id] = c;
      setCoords(c);
    });
  }, [line.id]);

  if (!coords || coords.length < 2) return null;

  const arrows = sampleArrowPoints(coords, 5);

  return (
    <>
      {/* Shadow polyline */}
      <Polyline positions={coords} color="rgba(0,0,0,.4)" weight={14} opacity={1} />
      {/* Main line */}
      <Polyline positions={coords} color={line.color} weight={8} opacity={1}
        dashArray={line.operator === 'TER' ? '18 9' : undefined} />
      {/* Bright inner line */}
      <Polyline positions={coords} color="rgba(255,255,255,.25)" weight={3} opacity={1} />

      {/* Direction arrows */}
      {arrows.map((a, i) => (
        <Marker key={`arrow-${i}`} position={[a.lat, a.lng]}
          icon={makeArrowIcon(a.deg, line.color)} interactive={false} />
      ))}

      {/* Numbered stop markers */}
      {timings.map(({ stop, index, isTerminus }) => (
        <Marker key={stop.id} position={[stop.lat, stop.lng]}
          icon={makeNumberedStopIcon(index, line.color, isTerminus)}
          zIndexOffset={isTerminus ? 500 : 100}
          eventHandlers={{ click: () => dispatch(setSelectedStop(stop.id)) }}>
          <Popup maxWidth={240} minWidth={210}>
            <div style={{ fontFamily: 'Inter, sans-serif', padding: 12, background: '#ffffff', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: line.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 900, color: 'white', flexShrink: 0 }}>
                  {isTerminus ? (index === 1 ? 'A' : 'Z') : index}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#1e293b', fontSize: 13 }}>{stop.name}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{stop.zone}</div>
                </div>
              </div>
              {isTerminus && (
                <div style={{ fontSize: 10, color: line.color, fontWeight: 700 }}>
                  {index === 1 ? '🟢 Terminus départ' : '🏁 Terminus arrivée'}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function MapController() {
  const map = useMap();
  const { mapCenter, mapZoom } = useAppSelector(s => s.mobility);
  const prev = useRef<string | null>(null);

  useEffect(() => {
    const move = () => {
      const key = `${mapCenter[0]},${mapCenter[1]},${mapZoom}`;
      if (key === prev.current) return;
      prev.current = key;
      try { map.setView(mapCenter, mapZoom, { animate: true, duration: 1 }); } catch (_) {}
    };
    // Wait for map to be ready before panning
    if ((map as any)._loaded) {
      move();
    } else {
      map.once('load', move);
    }
    return () => { map.off('load', move); };
  }, [mapCenter, mapZoom, map]);

  return null;
}

function FitRouteBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 1) {
      try { map.fitBounds(L.latLngBounds(coords), { padding: [60, 60], maxZoom: 14 }); } catch (_) { /* map not ready */ }
    }
  }, [coords, map]);
  return null;
}

function BusLine({ line, isFocused, hasFocus }: { line: Line; isFocused: boolean; hasFocus: boolean }) {
  const [coords, setCoords] = useState<[number, number][] | null>(null);

  useEffect(() => {
    if (lineRouteCache[line.id]) { setCoords(lineRouteCache[line.id]); return; }
    const stops = line.stops.map(sid => STOPS.find(s => s.id === sid)).filter(Boolean) as Stop[];
    if (stops.length < 2) return;
    routeLine(stops).then(result => {
      const c = result || stops.map(s => [s.lat, s.lng] as [number, number]);
      lineRouteCache[line.id] = c;
      setCoords(c);
    });
  }, [line.id]);

  if (!coords || coords.length < 2) return null;

  const opacity = hasFocus && !isFocused ? 0.05 : isFocused ? 1 : 0.7;
  const weight  = isFocused ? 8 : 4;

  return (
    <>
      {!hasFocus || isFocused ? (
        <Polyline positions={coords} color="rgba(0,0,0,.3)" weight={weight + 4} opacity={1} />
      ) : null}
      <Polyline positions={coords} color={line.color} weight={weight} opacity={opacity}
        dashArray={line.operator === 'TER' ? '16 8' : undefined} />
    </>
  );
}

function TripRoute({ origin, destination, onCoordsReady }: {
  origin: Stop; destination: Stop; onCoordsReady: (c: [number, number][]) => void;
}) {
  const [coords, setCoords] = useState<[number, number][] | null>(null);

  useEffect(() => {
    setCoords(null);
    routeOnRoads([origin, destination]).then(res => {
      const c = res || [[origin.lat, origin.lng], [destination.lat, destination.lng]] as [number, number][];
      setCoords(c);
      onCoordsReady(c);
    });
  }, [origin.id, destination.id]);

  if (!coords || coords.length < 2) return null;

  return (
    <>
      <Polyline positions={coords} color="rgba(255,255,255,.8)" weight={18} opacity={0.6} />
      <Polyline positions={coords} color="rgba(0,0,0,.4)"      weight={14} opacity={1} />
      <Polyline positions={coords} color="#1a56db"              weight={8}  opacity={1} />
      <Polyline positions={coords} color="rgba(255,255,255,.9)" weight={2}  opacity={1} dashArray="10 22" />
    </>
  );
}

// ── Route overlay icons ────────────────────────────────────────
const makeLetterIcon = (letter: string, color: string) => L.divIcon({
  className: '',
  iconSize: [34, 42],
  iconAnchor: [17, 42],
  html: `<div style="position:relative;width:34px;height:42px">
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color}"></div>
    <div style="width:34px;height:34px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 4px 12px ${color}80;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:15px;color:white">${letter}</div>
  </div>`,
});

// ── Étiquette du numéro de bus sur le tracé ──────────────────
const makeLineLabelIcon = (lineName: string, color: string) => L.divIcon({
  className: '',
  iconSize: [72, 28],
  iconAnchor: [36, 14],
  html: `<div style="
    background:${color};
    color:white;
    font-family:'Inter',sans-serif;
    font-size:11px;
    font-weight:900;
    padding:4px 10px;
    border-radius:20px;
    border:2.5px solid white;
    box-shadow:0 3px 12px rgba(0,0,0,.35);
    white-space:nowrap;
    text-align:center;
    line-height:1.2;
    letter-spacing:.02em;
  ">🚌 ${lineName}</div>`,
});

const makeTransferIcon = (lineNames: string) => L.divIcon({
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  html: `<div style="width:30px;height:30px;border-radius:50%;background:#d97706;border:3px solid white;box-shadow:0 3px 10px #d9770660;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:white" title="${lineNames}">↻</div>`,
});

// ── RouteOverlay ───────────────────────────────────────────────
function RouteOverlay() {
  const map = useMap();
  const { routeDisplay, userLocation } = useAppSelector(s => s.mobility);
  const { active: journey } = useAppSelector(s => s.journey);
  const [busCoords, setBusCoords] = useState<Record<string, [number, number][]>>({});

  useEffect(() => {
    if (!routeDisplay) { setBusCoords({}); return; }
    let cancelled = false;

    async function fetchSegments() {
      for (const seg of routeDisplay!.segments) {
        const line = LINES.find(l => l.id === seg.lineId);
        if (!line) continue;
        const fromIdx = line.stops.indexOf(seg.fromStopId);
        const toIdx   = line.stops.indexOf(seg.toStopId);
        if (fromIdx < 0 || toIdx < 0) continue;
        const [lo, hi] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
        const waypoints = line.stops.slice(lo, hi + 1)
          .map(id => STOPS.find(s => s.id === id))
          .filter(Boolean)
          .map(s => ({ lat: s!.lat, lng: s!.lng }));
        const key = `${seg.lineId}:${seg.fromStopId}:${seg.toStopId}`;
        const coords = await routeOnRoads(waypoints);
        if (!cancelled) {
          const fallback = waypoints.map(w => [w.lat, w.lng] as [number, number]);
          setBusCoords(prev => ({ ...prev, [key]: coords ?? fallback }));
        }
      }
    }

    fetchSegments();
    return () => { cancelled = true; };
  }, [routeDisplay]);

  // Fit map bounds to show the whole route
  useEffect(() => {
    if (!routeDisplay) return;
    const pts: [number, number][] = [];
    if (routeDisplay.walkFrom) pts.push(routeDisplay.walkFrom);
    const origin = STOPS.find(s => s.id === routeDisplay.originStopId);
    const dest   = STOPS.find(s => s.id === routeDisplay.destStopId);
    if (origin) pts.push([origin.lat, origin.lng]);
    if (dest)   pts.push([dest.lat, dest.lng]);
    routeDisplay.transferStopIds.forEach(id => {
      const s = STOPS.find(x => x.id === id);
      if (s) pts.push([s.lat, s.lng]);
    });
    if (pts.length >= 2) map.fitBounds(pts, { padding: [50, 50], maxZoom: 15 });
  }, [routeDisplay]);

  // Walking-only mode during active journey
  if (!routeDisplay) {
    if (journey?.status === 'walking' && userLocation && journey.walkingStop) {
      return (
        <Polyline
          positions={[userLocation, [journey.walkingStop.lat, journey.walkingStop.lng]]}
          pathOptions={{ color: '#059669', weight: 4, dashArray: '10 8', opacity: 0.9 }}
        />
      );
    }
    return null;
  }

  const origin  = STOPS.find(s => s.id === routeDisplay.originStopId);
  const dest    = STOPS.find(s => s.id === routeDisplay.destStopId);
  const transfers = routeDisplay.transferStopIds
    .map(id => STOPS.find(s => s.id === id))
    .filter(Boolean) as typeof STOPS;

  return (
    <>
      {/* Walking segment: dashed green */}
      {routeDisplay.walkFrom && origin && (
        <Polyline
          positions={[routeDisplay.walkFrom, [origin.lat, origin.lng]]}
          pathOptions={{ color: '#059669', weight: 3, dashArray: '8 7', opacity: 0.85 }}
        />
      )}

      {/* Bus segments + étiquette numéro de ligne au milieu du tracé */}
      {routeDisplay.segments.map((seg, i) => {
        const key = `${seg.lineId}:${seg.fromStopId}:${seg.toStopId}`;
        const coords = busCoords[key];
        if (!coords) return null;
        // Point au 1/3 du tracé (évite le chevauchement avec les marqueurs A/B)
        const labelIdx = Math.floor(coords.length * 0.4);
        const labelPos = coords[labelIdx] ?? coords[Math.floor(coords.length / 2)];
        return (
          <React.Fragment key={i}>
            {/* Halo blanc */}
            <Polyline positions={coords} pathOptions={{ color: '#fff', weight: 12, opacity: 0.3, lineCap: 'round' }} />
            {/* Tracé principal */}
            <Polyline positions={coords} pathOptions={{ color: seg.color, weight: 7, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
            {/* Numéro de ligne centré sur le tracé */}
            <Marker position={labelPos} icon={makeLineLabelIcon(seg.lineName, seg.color)} interactive={false} zIndexOffset={800} />
          </React.Fragment>
        );
      })}

      {/* Origin marker A */}
      {origin && (
        <Marker position={[origin.lat, origin.lng]} icon={makeLetterIcon('A', '#059669')} zIndexOffset={1000}>
          <Popup>
            <div style={{ fontWeight: 700 }}>{origin.name}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Départ</div>
          </Popup>
        </Marker>
      )}

      {/* Destination marker B */}
      {dest && (
        <Marker position={[dest.lat, dest.lng]} icon={makeLetterIcon('B', '#dc2626')} zIndexOffset={1000}>
          <Popup>
            <div style={{ fontWeight: 700 }}>{dest.name}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Arrivée</div>
          </Popup>
        </Marker>
      )}

      {/* Transfer stop markers */}
      {transfers.map((stop, i) => {
        const lineNames = routeDisplay.segments.map(s => s.lineName).join(' → ');
        return (
          <Marker key={i} position={[stop.lat, stop.lng]} icon={makeTransferIcon(lineNames)} zIndexOffset={900}>
            <Popup>
              <div style={{ fontWeight: 700 }}>{stop.name}</div>
              <div style={{ fontSize: 11, color: '#d97706' }}>Correspondance</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{lineNames}</div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function MapView() {
  const dispatch = useAppDispatch();
  const { selectedOperator, userLocation, route, focusedLine, busPositions, routeDisplay } = useAppSelector(s => s.mobility);
  const darkMode = useAppSelector(s => s.ui.darkMode);
  const [loadingCount, setLoadingCount] = useState(0);
  const [routeCoords, setRouteCoords]   = useState<[number, number][] | null>(null);
  const [locLoading, setLocLoading]     = useState(false);

  // routeMode = using old direct-road TripRoute (only when no bus routeDisplay)
  const routeMode = !!(route?.origin && route?.destination && !routeDisplay);

  const visibleLines = routeMode ? [] : (
    focusedLine
      ? LINES.filter(l => l.id === focusedLine)
      : (selectedOperator === 'all' ? LINES : LINES.filter(l => l.operator === selectedOperator))
  );

  const routeStopIds = routeMode
    ? [route.origin?.id, route.destination?.id].filter(Boolean) as string[]
    : focusedLine ? (LINES.find(l => l.id === focusedLine)?.stops || []) : null;

  const allVisibleStops = routeMode ? [] : routeStopIds
    ? STOPS.filter(s => routeStopIds.includes(s.id))
    : (selectedOperator === 'all' ? STOPS : STOPS.filter(s => s.operators.includes(selectedOperator as any)));

  // Dédoublonnage par position géographique : si deux arrêts sont à moins de 20m,
  // on garde celui qui a le plus d'opérateurs (hubs BRT/DDD colocalisés → un seul marqueur)
  const visibleStops = allVisibleStops.filter((stop, idx) => {
    if (selectedOperator !== 'all') return true; // pas de dédup quand on filtre par opérateur
    return !allVisibleStops.some((other, oidx) => {
      if (oidx >= idx) return false;
      const dlat = Math.abs(stop.lat - other.lat);
      const dlng = Math.abs(stop.lng - other.lng);
      // ~20m threshold
      if (dlat > 0.0002 || dlng > 0.0002) return false;
      // garde l'arrêt avec le plus d'opérateurs/lignes
      return other.lines.length >= stop.lines.length;
    });
  });

  useEffect(() => {
    if (routeMode) { setLoadingCount(0); return; }
    const t = setInterval(() => {
      const c = visibleLines.filter(l => lineRouteCache[l.id]).length;
      setLoadingCount(c < visibleLines.length ? visibleLines.length - c : 0);
    }, 600);
    return () => clearInterval(t);
  }, [selectedOperator, focusedLine, routeMode, visibleLines.length]);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        dispatch(setMapCenter(loc));
        dispatch(setMapZoom(16));
        dispatch(setUserLocation(loc));
        setLocLoading(false);
      },
      () => setLocLoading(false),
      { timeout: 8000 }
    );
  };

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden', height: '100%' }}>

      {/* Loading indicator */}
      {!routeMode && loadingCount > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[900] glass rounded-2xl px-4 py-2 text-xs font-bold text-blue-400 flex items-center gap-2 border border-blue-500/20 shadow-xl">
          <span className="animate-spin inline-block">◌</span>
          Tracés… ({loadingCount})
        </div>
      )}

      {routeMode && !routeCoords && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[900] bg-blue-600 text-white rounded-2xl px-5 py-2.5 shadow-lg text-xs font-bold flex items-center gap-2">
          <span className="animate-spin inline-block">◌</span>
          Calcul itinéraire sur routes réelles…
        </div>
      )}

      {/* Focused line banner */}
      {!routeMode && focusedLine && (() => {
        const fl = LINES.find(l => l.id === focusedLine);
        if (!fl) return null;
        const liveBuses = busPositions.filter((b: BusPosition) => b.lineId === focusedLine);
        return (
          <div className="absolute top-3 left-3 z-[900] rounded-2xl shadow-2xl overflow-hidden max-w-xs"
            style={{ background: 'rgba(10,15,30,.92)', backdropFilter: 'blur(16px)', border: `1px solid ${fl.color}40` }}>
            <div className="h-1" style={{ background: fl.color }} />
            <div className="px-4 py-2.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-sm">{fl.name}</span>
                  {liveBuses.length > 0 && (
                    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(74,222,128,.15)', color: '#4ade80' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ animation: 'live-pulse 2s infinite' }} />
                      {liveBuses.length} bus
                    </span>
                  )}
                </div>
                <p className="text-[10px] truncate" style={{ color: '#64748b' }}>{fl.route}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ background: fl.color + '20', color: fl.color }}>
                  {fl.freq}
                </div>
                <button onClick={() => dispatch(clearFocusedLine())}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-colors"
                  style={{ background: 'rgba(255,255,255,.08)', color: '#64748b' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,.2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.08)')}>
                  ✕
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Geolocate button */}
      <button onClick={handleLocate} title="Ma position"
        className="absolute bottom-6 right-4 z-[900] w-12 h-12 rounded-xl border border-blue-500/20 shadow-xl flex items-center justify-center text-xl hover:scale-105 active:scale-95 transition-all"
        style={{ background: 'rgba(15,23,42,.9)', backdropFilter: 'blur(8px)' }}>
        {locLoading ? <span className="animate-spin text-blue-400 text-base">◌</span> : '📍'}
      </button>

      <MapContainer center={[14.7167, -17.4677]} zoom={12}
        style={{ width: '100%', height: '100%', background: '#e8eaf0' }} zoomControl={true}>
        {/* Carte toujours en clair : lignes colorées et arrêts bien lisibles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution=""
          keepBuffer={4}
        />
        <MapController />
        <RouteOverlay />

        {/* When a line is focused: show full overlay with numbered stops + arrows */}
        {!routeMode && focusedLine && (() => {
          const fl = LINES.find(l => l.id === focusedLine);
          if (!fl) return null;
          return (
            <>
              {/* Dim all other lines */}
              {visibleLines.filter(l => l.id !== focusedLine).map(line => (
                <BusLine key={line.id} line={line} isFocused={false} hasFocus={true} />
              ))}
              {/* Full focused overlay */}
              <FocusedLineOverlay line={fl} />
            </>
          );
        })()}

        {/* Normal mode: all lines + simple stop markers */}
        {!routeMode && !focusedLine && (
          <>
            {visibleLines.map(line => (
              <BusLine key={line.id} line={line} isFocused={false} hasFocus={false} />
            ))}
            {visibleStops.map(stop => {
              const mainOp = stop.operators[0];
              const color  = OPERATORS[mainOp]?.color || '#1a56db';
              const isHub  = stop.lines.length > 2;
              const icon   = isHub ? makeTerminusIcon(color) : makeStopIcon(color, stop.operators.length > 1 ? 13 : 10);
              return (
                <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={icon}
                  eventHandlers={{ click: () => dispatch(setSelectedStop(stop.id)) }}>
                  <Popup maxWidth={240} minWidth={210}><StopPopup stop={stop} /></Popup>
                </Marker>
              );
            })}
          </>
        )}

        {routeMode && route?.origin && route?.destination && (
          <>
            <TripRoute origin={route.origin} destination={route.destination}
              onCoordsReady={c => setRouteCoords(c)} />
            {routeCoords && <FitRouteBounds coords={routeCoords} />}
          </>
        )}

        {routeMode && route?.origin && (
          <Marker position={[route.origin.lat, route.origin.lng]} icon={originIcon} zIndexOffset={1000}>
            <Popup>
              <div style={{ padding: 12, fontFamily: 'Inter', background: '#ffffff', borderRadius: 12 }}>
                <div style={{ fontWeight: 900, color: '#059669' }}>🟢 Départ</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{route.origin.name}</div>
              </div>
            </Popup>
          </Marker>
        )}
        {routeMode && route?.destination && (
          <Marker position={[route.destination.lat, route.destination.lng]} icon={destIcon} zIndexOffset={1000}>
            <Popup>
              <div style={{ padding: 12, fontFamily: 'Inter', background: '#ffffff', borderRadius: 12 }}>
                <div style={{ fontWeight: 900, color: '#dc2626' }}>🔴 Arrivée</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{route.destination.name}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {userLocation && (
          <>
            <Marker position={userLocation} icon={userIcon}>
              <Popup>
                <div style={{ padding: 12, fontFamily: 'Inter', background: '#ffffff', borderRadius: 12, fontWeight: 700, fontSize: 13 }}>
                  📍 Ma position
                </div>
              </Popup>
            </Marker>
            <Circle center={userLocation} radius={200} color="#1a56db" fillColor="#1a56db" fillOpacity={0.08} weight={1.5} />
          </>
        )}

        {!routeMode && busPositions.map((bus: BusPosition, i: number) => {
          const line = LINES.find(l => l.id === bus.lineId);
          const color = line?.color || '#10b981';
          const driver = MOCK_DRIVERS[bus.busId] ?? Object.values(MOCK_DRIVERS).find(d => d.lineId === bus.lineId);
          const isOnFocusedLine = focusedLine && bus.lineId === focusedLine;
          // Hide buses not on focused line
          if (focusedLine && !isOnFocusedLine) return null;

          const busIcon = isOnFocusedLine
            ? L.divIcon({
                className: '',
                html: `<div style="position:relative;width:34px;height:34px">
                  <div style="position:absolute;inset:0;border-radius:50%;background:${color}30;animation:pr 2s ease-out infinite"></div>
                  <div style="position:absolute;inset:4px;border-radius:50%;background:${color};border:3px solid white;
                    box-shadow:0 0 20px ${color},0 4px 12px rgba(0,0,0,.6);
                    display:flex;align-items:center;justify-content:center;font-size:12px">🚌</div>
                </div>
                <style>@keyframes pr{0%{transform:scale(.8);opacity:.8}100%{transform:scale(2.2);opacity:0}}</style>`,
                iconSize: [34, 34], iconAnchor: [17, 17],
              })
            : makeBusMarkerIcon(color, bus.speed, bus.occupancy);

          return (
            <Marker key={i} position={[bus.lat, bus.lng]} icon={busIcon}
              zIndexOffset={isOnFocusedLine ? 1000 : 0}>
              <Popup maxWidth={240}>
                <div style={{ padding: 12, fontFamily: 'Inter', background: '#ffffff', borderRadius: 12 }}>
                  <div style={{ fontWeight: 900, color, fontSize: 13, marginBottom: 8 }}>
                    {line?.name ?? bus.lineId}
                    <span style={{ fontWeight: 500, color: '#64748b', marginLeft: 6, fontSize: 11 }}>{line?.operator}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                    <div style={{ color: '#64748b' }}>🚌 {driver?.plate ?? 'N/A'}</div>
                    <div style={{ color: '#059669', fontWeight: 700 }}>{bus.speed} km/h</div>
                    <div style={{ color: '#64748b' }}>👤 {driver?.name ?? '—'}</div>
                    <div style={{ color: '#64748b' }}>👥 {bus.occupancy}% plein</div>
                  </div>
                  {driver?.phone && (
                    <div style={{ marginTop: 8, fontSize: 10, color: '#475569' }}>📞 {driver.phone}</div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
