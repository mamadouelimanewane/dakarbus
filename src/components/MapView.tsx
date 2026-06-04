import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup,
  Polyline, Circle, useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedStop, setMapCenter, setMapZoom, clearFocusedLine } from '@/store/store';
import { STOPS, LINES, OPERATORS } from '@/data/transportData';
import { routeOnRoads, routeLine, lineRouteCache } from '@/utils/osrm';
import StopPopup from './StopPopup';
import type { Stop, Line } from '@/types';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Icons ─────────────────────────────────────────────────────
const makeStopIcon = (color: string, size = 10) => L.divIcon({
  className: '',
  html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`,
  iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size],
});

const makeTerminusIcon = (color: string) => L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:${color};border:2.5px solid white;transform:rotate(45deg);box-shadow:0 2px 10px rgba(0,0,0,.35);border-radius:3px"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7], popupAnchor: [0, -12],
});

const userIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:22px;height:22px">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(26,86,219,.2);animation:pr 2s ease-out infinite"></div>
    <div style="position:absolute;inset:4px;border-radius:50%;background:#1a56db;border:2.5px solid white;box-shadow:0 2px 10px rgba(26,86,219,.5)"></div>
  </div>
  <style>@keyframes pr{0%{transform:scale(.8);opacity:.8}100%{transform:scale(2.6);opacity:0}}</style>`,
  iconSize: [22, 22], iconAnchor: [11, 11],
});

const makeRouteEndIcon = (color: string, label: string) => L.divIcon({
  className: '',
  html: `<div style="display:flex;flex-direction:column;align-items:center">
    <div style="width:20px;height:20px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:white">${label}</div>
    <div style="width:3px;height:10px;background:${color};margin-top:-1px;border-radius:0 0 2px 2px"></div>
  </div>`,
  iconSize: [20, 30], iconAnchor: [10, 30], popupAnchor: [0, -32],
});

const originIcon = makeRouteEndIcon('#059669', 'A');
const destIcon   = makeRouteEndIcon('#dc2626', 'B');

const busIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#10b981;border-radius:50%;border:2px solid white;box-shadow:0 0 10px #10b981"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

// ── Map Controller ────────────────────────────────────────────
function MapController() {
  const map = useMap();
  const { mapCenter, mapZoom } = useAppSelector(s => s.mobility);
  const prev = useRef<string | null>(null);
  useEffect(() => {
    const key = `${mapCenter[0]},${mapCenter[1]},${mapZoom}`;
    if (key !== prev.current) { prev.current = key; map.flyTo(mapCenter, mapZoom, { duration: 1.2 }); }
  }, [mapCenter, mapZoom, map]);
  return null;
}

function FitRouteBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 1) {
      map.fitBounds(L.latLngBounds(coords), { padding: [60, 60], maxZoom: 14, duration: 1.2 });
    }
  }, [coords]);
  return null;
}

// ── Bus Line ──────────────────────────────────────────────────
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

  const opacity = hasFocus && !isFocused ? 0.07 : isFocused ? 1 : 0.75;
  const weight  = isFocused ? 7 : 4;

  return (
    <>
      <Polyline positions={coords} color="rgba(0,0,0,.15)" weight={hasFocus && !isFocused ? 0 : weight + 3} opacity={1} />
      <Polyline positions={coords} color={line.color} weight={weight} opacity={opacity}
        dashArray={line.operator === 'TER' ? '14 7' : undefined} />
    </>
  );
}

// ── Trip Route ────────────────────────────────────────────────
function TripRoute({ origin, destination, onCoordsReady }: {
  origin: Stop; destination: Stop; onCoordsReady: (c: [number, number][]) => void;
}) {
  const [coords, setCoords] = useState<[number, number][] | null>(null);

  useEffect(() => {
    if (!origin || !destination) { setCoords(null); return; }
    setCoords(null);
    routeOnRoads([origin, destination]).then(res => {
      const c = res || [[origin.lat, origin.lng], [destination.lat, destination.lng]] as [number, number][];
      setCoords(c);
      onCoordsReady(c);
    });
  }, [origin?.id, destination?.id]);

  if (!coords || coords.length < 2) return null;

  return (
    <>
      <Polyline positions={coords} color="white"            weight={16} opacity={0.85} />
      <Polyline positions={coords} color="rgba(0,0,0,.25)" weight={14} opacity={1} />
      <Polyline positions={coords} color="#1a56db"          weight={9}  opacity={1} />
      <Polyline positions={coords} color="rgba(255,255,255,.9)" weight={3} opacity={1} dashArray="8 20" />
    </>
  );
}

// ══════════════════════════════════════════════════════════════
export default function MapView() {
  const dispatch = useAppDispatch();
  const { selectedOperator, userLocation, route, focusedLine, busPositions } = useAppSelector(s => s.mobility);
  const [loadingCount, setLoadingCount] = useState(0);
  const [routeCoords, setRouteCoords]   = useState<[number, number][] | null>(null);
  const [locLoading, setLocLoading]     = useState(false);

  const routeMode = !!(route?.origin && route?.destination);

  const visibleLines = routeMode ? [] : (
    focusedLine
      ? LINES.filter(l => l.id === focusedLine)
      : (selectedOperator === 'all' ? LINES : LINES.filter(l => l.operator === selectedOperator))
  );

  const routeStopIds = routeMode
    ? [route.origin?.id, route.destination?.id].filter(Boolean) as string[]
    : focusedLine ? (LINES.find(l => l.id === focusedLine)?.stops || []) : null;

  const visibleStops = routeMode ? [] : routeStopIds
    ? STOPS.filter(s => routeStopIds.includes(s.id))
    : (selectedOperator === 'all' ? STOPS : STOPS.filter(s => s.operators.includes(selectedOperator as any)));

  useEffect(() => {
    if (routeMode) { setLoadingCount(0); return; }
    const t = setInterval(() => {
      const c = visibleLines.filter(l => lineRouteCache[l.id]).length;
      setLoadingCount(c < visibleLines.length ? visibleLines.length - c : 0);
    }, 600);
    return () => clearInterval(t);
  }, [selectedOperator, focusedLine, routeMode]);

  const handleLocate = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        dispatch(setMapCenter([pos.coords.latitude, pos.coords.longitude]));
        dispatch(setMapZoom(15));
        setLocLoading(false);
      },
      () => setLocLoading(false)
    );
  };

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>

      {/* Loading OSRM */}
      {!routeMode && loadingCount > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[900] bg-white rounded-2xl px-4 py-2 shadow-lg text-xs font-bold text-brand-600 flex items-center gap-2">
          <span className="animate-spin inline-block">⟳</span>
          Tracés… ({loadingCount} restant{loadingCount > 1 ? 's' : ''})
        </div>
      )}

      {routeMode && !routeCoords && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[900] bg-brand-600 text-white rounded-2xl px-5 py-2.5 shadow-lg text-xs font-bold flex items-center gap-2">
          <span className="animate-spin inline-block">⟳</span>
          Calcul du tracé sur routes réelles…
        </div>
      )}

      {/* Focus Banner */}
      {!routeMode && focusedLine && (() => {
        const fl = LINES.find(l => l.id === focusedLine);
        return fl ? (
          <div style={{ background: fl.color }}
            className="absolute top-3 left-3 z-[900] text-white rounded-xl px-4 py-2 shadow-lg flex items-center gap-3 text-sm">
            <span className="font-black">{fl.name}</span>
            <span className="opacity-90 text-xs">{fl.route}</span>
            <button onClick={() => dispatch(clearFocusedLine())}
              className="bg-white/25 rounded-lg px-2 py-1 text-xs font-bold hover:bg-white/35 transition-colors">
              ✕ Tout
            </button>
          </div>
        ) : null;
      })()}

      {/* Geolocate Button */}
      <button onClick={handleLocate} title="Ma position"
        className="absolute bottom-6 right-4 z-[900] w-12 h-12 bg-white rounded-xl border border-brand-600/20 shadow-lg flex items-center justify-center text-xl hover:bg-blue-50 transition-colors">
        {locLoading ? <span className="animate-spin inline-block text-brand-600">⟳</span> : '📍'}
      </button>

      <MapContainer center={[14.7167, -17.4677]} zoom={12}
        style={{ width: '100%', height: '100%' }} zoomControl={false}>
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController />

        {!routeMode && visibleLines.map(line => (
          <BusLine key={line.id} line={line}
            isFocused={focusedLine === line.id}
            hasFocus={!!focusedLine} />
        ))}

        {!routeMode && visibleStops.map(stop => {
          const mainOp = stop.operators[0];
          const color  = OPERATORS[mainOp]?.color || '#1a56db';
          const isHub  = stop.lines.length > 2;
          const icon   = isHub ? makeTerminusIcon(color) : makeStopIcon(color, stop.operators.length > 1 ? 13 : 10);
          return (
            <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={icon}
              eventHandlers={{ click: () => dispatch(setSelectedStop(stop.id)) }}>
              <Popup maxWidth={230} minWidth={210}><StopPopup stop={stop} /></Popup>
            </Marker>
          );
        })}

        {routeMode && route?.origin && route?.destination && (
          <>
            <TripRoute origin={route.origin} destination={route.destination}
              onCoordsReady={c => setRouteCoords(c)} />
            {routeCoords && <FitRouteBounds coords={routeCoords} />}
          </>
        )}

        {routeMode && route?.origin && (
          <Marker position={[route.origin.lat, route.origin.lng]} icon={originIcon} zIndexOffset={1000}>
            <Popup><div className="p-3 font-sans"><div className="font-bold text-green-600">🟢 Départ</div><div className="text-sm mt-1">{route.origin.name}</div></div></Popup>
          </Marker>
        )}
        {routeMode && route?.destination && (
          <Marker position={[route.destination.lat, route.destination.lng]} icon={destIcon} zIndexOffset={1000}>
            <Popup><div className="p-3 font-sans"><div className="font-bold text-red-600">🔴 Arrivée</div><div className="text-sm mt-1">{route.destination.name}</div></div></Popup>
          </Marker>
        )}

        {userLocation && (
          <>
            <Marker position={userLocation} icon={userIcon}>
              <Popup><div className="p-3 font-bold text-sm">📍 Ma position</div></Popup>
            </Marker>
            <Circle center={userLocation} radius={300} color="#1a56db" fillColor="#1a56db" fillOpacity={0.07} weight={1} />
          </>
        )}

        {!routeMode && busPositions.map((bus, i) => (
          <Marker key={i} position={[bus.lat, bus.lng]} icon={busIcon}>
            <Popup>
              <div className="p-2">
                <div className="font-bold text-sm">Ligne {bus.lineId}</div>
                <div className="text-xs text-slate-500">Vitesse: {bus.speed.toFixed(0)} km/h</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
