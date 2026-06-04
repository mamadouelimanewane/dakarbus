import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup,
  Polyline, Circle, useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedStop, setMapCenter, setMapZoom, clearFocusedLine, setUserLocation } from '@/store/store';
import { STOPS, LINES, OPERATORS } from '@/data/transportData';
import { routeOnRoads, routeLine, lineRouteCache } from '@/utils/osrm';
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
        return (
          <div style={{ background: fl.color }}
            className="absolute top-3 left-3 z-[900] text-white rounded-xl px-4 py-2 shadow-xl flex items-center gap-3 text-sm max-w-xs">
            <span className="font-black">{fl.name}</span>
            <span className="opacity-80 text-xs truncate">{fl.route}</span>
            <button onClick={() => dispatch(clearFocusedLine())}
              className="bg-white/25 hover:bg-white/40 rounded-lg px-2 py-0.5 text-xs font-bold transition-colors flex-shrink-0">
              ✕
            </button>
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
        style={{ width: '100%', height: '100%' }} zoomControl={true}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution=""
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
              <Popup maxWidth={240} minWidth={210}><StopPopup stop={stop} /></Popup>
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
            <Popup>
              <div style={{ padding: 12, fontFamily: 'Inter', background: '#1e293b', borderRadius: 12 }}>
                <div style={{ fontWeight: 900, color: '#34d399' }}>🟢 Départ</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{route.origin.name}</div>
              </div>
            </Popup>
          </Marker>
        )}
        {routeMode && route?.destination && (
          <Marker position={[route.destination.lat, route.destination.lng]} icon={destIcon} zIndexOffset={1000}>
            <Popup>
              <div style={{ padding: 12, fontFamily: 'Inter', background: '#1e293b', borderRadius: 12 }}>
                <div style={{ fontWeight: 900, color: '#f87171' }}>🔴 Arrivée</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{route.destination.name}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {userLocation && (
          <>
            <Marker position={userLocation} icon={userIcon}>
              <Popup>
                <div style={{ padding: 12, fontFamily: 'Inter', background: '#1e293b', borderRadius: 12, fontWeight: 700, fontSize: 13 }}>
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
          return (
            <Marker key={i} position={[bus.lat, bus.lng]} icon={makeBusMarkerIcon(color, bus.speed, bus.occupancy)}>
              <Popup maxWidth={220}>
                <div style={{ padding: 12, fontFamily: 'Inter', background: '#1e293b', borderRadius: 12 }}>
                  <div style={{ fontWeight: 900, color, fontSize: 13, marginBottom: 6 }}>
                    {line?.name ?? bus.lineId} — {line?.operator}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11, color: '#94a3b8' }}>
                    <span>🚌 {driver?.plate ?? 'N/A'}</span>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>{bus.speed} km/h</span>
                    <span>👤 {driver?.name ?? '—'}</span>
                    <span>👥 {bus.occupancy}% plein</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
