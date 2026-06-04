import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/store';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

export default function AdminApp() {
  const dispatch = useAppDispatch();
  const { busPositions } = useAppSelector(s => s.mobility);

  const busIcon = L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;background:#10b981;border-radius:50%;border:2px solid white;box-shadow:0 0 10px #10b981"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  return (
    <div className="h-screen w-screen bg-slate-900 flex font-sans">
      <aside className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-black text-white">Administration</h1>
            <p className="text-xs text-brand-400">SunuBus Supervision</p>
          </div>
          <button onClick={() => dispatch(logout())} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-700 p-3 rounded-xl">
              <div className="text-2xl font-black text-white">{busPositions.length}</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Bus Actifs</div>
            </div>
            <div className="bg-slate-700 p-3 rounded-xl">
              <div className="text-2xl font-black text-green-400">OK</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">État Réseau</div>
            </div>
          </div>

          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Bus en circulation</h2>
          <div className="space-y-2">
            {busPositions.slice(0, 10).map((b, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-700/50 p-2 rounded-lg">
                <span className="text-xs font-bold text-white bg-brand-600 px-2 py-0.5 rounded">{b.lineId}</span>
                <span className="text-xs text-slate-400">{b.speed.toFixed(0)} km/h</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 relative">
        <MapContainer center={[14.7167, -17.4677]} zoom={12} style={{ width: '100%', height: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {busPositions.map((bus, i) => (
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
      </main>
    </div>
  );
}
