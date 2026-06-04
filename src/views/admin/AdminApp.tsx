import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/store';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { LINES, STOPS, OPERATORS } from '@/data/transportData';
import { MOCK_DRIVERS, type DriverInfo } from '@/services/simulation';
import type { Line } from '@/types';

// ── Icons ──────────────────────────────────────────────────────
const makeBusIcon = (color: string) => L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:${color};border-radius:50%;border:2.5px solid white;box-shadow:0 0 12px ${color}88;display:flex;align-items:center;justify-content:center;font-size:8px">🚌</div>`,
  iconSize: [16, 16], iconAnchor: [8, 8],
});

// ── Mock fleet data ────────────────────────────────────────────
interface FleetBus {
  id: string; plate: string; operator: string; lineId: string; status: 'active' | 'maintenance' | 'idle';
  driver: string; driverPhone: string;
}

const INITIAL_FLEET: FleetBus[] = Object.entries(MOCK_DRIVERS).map(([busId, d]) => ({
  id: busId, plate: d.plate, operator: d.operator, lineId: d.lineId,
  status: 'active', driver: d.name, driverPhone: d.phone,
}));

// ── Admin App ──────────────────────────────────────────────────
export default function AdminApp() {
  const dispatch = useAppDispatch();
  const { busPositions } = useAppSelector(s => s.mobility);
  const { adminRevenue } = useAppSelector(s => s.tickets);

  const [activeTab, setActiveTab] = useState<'map' | 'fleet' | 'routes' | 'alerts' | 'finance'>('map');
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [fleet, setFleet] = useState<FleetBus[]>(INITIAL_FLEET);
  const [showAddBus, setShowAddBus] = useState(false);
  const [newBus, setNewBus] = useState({ plate: '', operator: 'DDD', lineId: 'L8', driver: '', driverPhone: '' });
  const [editBusId, setEditBusId] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');

  const focusedLine = selectedLine ? LINES.find(l => l.id === selectedLine) : null;
  const focusedBuses = selectedLine ? busPositions.filter((b: any) => b.lineId === selectedLine) : busPositions;

  const opColor = (op: string) => OPERATORS[op]?.color || '#64748b';

  const filteredFleet = fleet.filter(b =>
    b.plate.toLowerCase().includes(searchQ.toLowerCase()) ||
    b.driver.toLowerCase().includes(searchQ.toLowerCase()) ||
    b.lineId.toLowerCase().includes(searchQ.toLowerCase())
  );

  const addBus = () => {
    if (!newBus.plate || !newBus.driver) return;
    setFleet(prev => [...prev, { ...newBus, id: `bus_custom_${Date.now()}`, status: 'active' }]);
    setNewBus({ plate: '', operator: 'DDD', lineId: 'L8', driver: '', driverPhone: '' });
    setShowAddBus(false);
  };

  const tabs = [
    { id: 'map', label: 'Carte Live', icon: '🗺️' },
    { id: 'fleet', label: 'Flotte', icon: '🚌' },
    { id: 'routes', label: 'Lignes', icon: '🛤️' },
    { id: 'alerts', label: 'Alertes', icon: '⚠️' },
    { id: 'finance', label: 'Revenus', icon: '💰' },
  ] as const;

  return (
    <div className="h-screen w-screen bg-slate-900 flex flex-col font-sans overflow-hidden">

      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-lg">🛡️</div>
          <div>
            <h1 className="text-base font-black text-white leading-none">Administration</h1>
            <p className="text-[10px] text-brand-400 font-bold">SunuBus · Supervision Réseau</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-lg text-[10px] font-bold">{busPositions.length} bus actifs</span>
            <span className="bg-brand-500/20 text-brand-400 px-2 py-1 rounded-lg text-[10px] font-bold">{fleet.length} flotte</span>
          </div>
          <button onClick={() => dispatch(logout())} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Déco.</button>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="bg-slate-800 border-b border-slate-700 flex flex-shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2.5 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${activeTab === t.id ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── MAP TAB ── */}
        {activeTab === 'map' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden flex-shrink-0">
              <div className="p-3 border-b border-slate-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Filtrer par ligne</p>
                <button
                  onClick={() => setSelectedLine(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold mb-2 transition-colors ${!selectedLine ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  🌐 Toutes les lignes
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {LINES.slice(0, 20).map(line => {
                  const busesOnLine = busPositions.filter((b: any) => b.lineId === line.id);
                  const active = selectedLine === line.id;
                  return (
                    <button key={line.id} onClick={() => setSelectedLine(active ? null : line.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-left transition-all ${active ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                      <span className="w-2 h-7 rounded-full flex-shrink-0" style={{ backgroundColor: line.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{line.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{line.route}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-xs font-black ${busesOnLine.length > 0 ? 'text-green-400' : 'text-slate-600'}`}>{busesOnLine.length}</div>
                        <span className="text-[9px] font-bold px-1 rounded" style={{ background: opColor(line.operator) + '33', color: opColor(line.operator) }}>{line.operator}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Focused line detail */}
              {focusedLine && (
                <div className="border-t border-slate-800 p-3 bg-slate-800/50">
                  <div className="text-xs font-black text-white mb-2" style={{ color: focusedLine.color }}>● {focusedLine.name}</div>
                  <p className="text-[10px] text-slate-400 mb-2">{focusedLine.route}</p>
                  <p className="text-[10px] text-slate-500">{focusedLine.stops.length} arrêts · {focusedLine.freq} · {focusedLine.tarif} FCFA</p>
                  {focusedBuses.map((b: any, i: number) => {
                    const driver = MOCK_DRIVERS[b.busId || ''] || Object.values(MOCK_DRIVERS).find(d => d.lineId === b.lineId);
                    return (
                      <div key={i} className="mt-2 bg-slate-700/50 p-2 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-white">{driver?.plate || '??'}</span>
                          <span className="text-[10px] text-green-400 font-bold">{b.speed?.toFixed(0)} km/h</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{driver?.name}</div>
                        <div className="text-[10px] text-brand-400">{driver?.phone}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </aside>

            {/* Map */}
            <div className="flex-1 relative">
              <MapContainer center={[14.7167, -17.4677]} zoom={12} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                <TileLayer
                  attribution='© <a href="https://carto.com">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                {busPositions.map((bus: any, i: number) => {
                  const line = LINES.find(l => l.id === bus.lineId);
                  const color = line?.color || '#10b981';
                  const driver = MOCK_DRIVERS[bus.busId || ''] || Object.values(MOCK_DRIVERS).find(d => d.lineId === bus.lineId);
                  const visible = !selectedLine || bus.lineId === selectedLine;
                  if (!visible) return null;
                  return (
                    <Marker key={i} position={[bus.lat, bus.lng]} icon={makeBusIcon(color)}>
                      <Popup minWidth={200}>
                        <div style={{ fontFamily: 'Inter, sans-serif', padding: 12 }}>
                          <div style={{ fontWeight: 900, color, fontSize: 13, marginBottom: 4 }}>{line?.name} — {line?.operator}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11, color: '#475569' }}>
                            <span>🚌 {driver?.plate || 'N/A'}</span>
                            <span style={{ color: '#059669', fontWeight: 700 }}>{bus.speed?.toFixed(0)} km/h</span>
                            <span>👤 {driver?.name || 'N/A'}</span>
                            <span>📞 {driver?.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        )}

        {/* ── FLEET TAB ── */}
        {activeTab === 'fleet' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-black text-white">{fleet.length} véhicules enregistrés</h2>
              <button onClick={() => setShowAddBus(true)} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-2">
                + Ajouter Bus
              </button>
            </div>

            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="🔍 Rechercher plaque, chauffeur, ligne…"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 mb-4" />

            {/* Add Bus Form */}
            {showAddBus && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-4">
                <h3 className="font-black text-white text-sm mb-3">Nouveau Bus</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'plate', label: 'Immatriculation', placeholder: 'DK-0000-XX' },
                    { key: 'driver', label: 'Chauffeur', placeholder: 'Prénom Nom' },
                    { key: 'driverPhone', label: 'Téléphone', placeholder: '+221 77 000 00 00' },
                  ].map(f => (
                    <input key={f.key} placeholder={f.placeholder}
                      value={(newBus as any)[f.key]}
                      onChange={e => setNewBus(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500" />
                  ))}
                  <select value={newBus.operator} onChange={e => setNewBus(p => ({ ...p, operator: e.target.value }))}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500">
                    {['DDD', 'AFTU', 'BRT', 'TER'].map(op => <option key={op}>{op}</option>)}
                  </select>
                  <select value={newBus.lineId} onChange={e => setNewBus(p => ({ ...p, lineId: e.target.value }))}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500">
                    {LINES.filter(l => l.operator === newBus.operator).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={addBus} className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-lg text-xs font-black">✓ Enregistrer</button>
                  <button onClick={() => setShowAddBus(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs">Annuler</button>
                </div>
              </div>
            )}

            {/* Fleet Table */}
            <div className="space-y-2">
              {filteredFleet.map(bus => {
                const line = LINES.find(l => l.id === bus.lineId);
                const isActive = busPositions.some((b: any) => b.lineId === bus.lineId);
                return (
                  <div key={bus.id} className={`bg-slate-800 border rounded-2xl p-4 transition-all ${editBusId === bus.id ? 'border-brand-500' : 'border-slate-700'}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: opColor(bus.operator) + '22' }}>🚌</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-white text-sm">{bus.plate}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: opColor(bus.operator) }}>{bus.operator}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>{isActive ? '● En service' : '○ Inactif'}</span>
                        </div>
                        <div className="flex gap-4 text-xs text-slate-400">
                          <span>👤 {bus.driver}</span>
                          <span>📞 {bus.driverPhone}</span>
                          <span style={{ color: line?.color }}>🛤️ {line?.name || bus.lineId}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditBusId(editBusId === bus.id ? null : bus.id)}
                          className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-colors">Éditer</button>
                        <button onClick={() => setFleet(f => f.filter(b => b.id !== bus.id))}
                          className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg transition-colors">✕</button>
                      </div>
                    </div>
                    {/* Inline Edit */}
                    {editBusId === bus.id && (
                      <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-2">
                        {[
                          { key: 'plate', label: 'Plaque' },
                          { key: 'driver', label: 'Chauffeur' },
                          { key: 'driverPhone', label: 'Téléphone' },
                        ].map(f => (
                          <input key={f.key} placeholder={f.label} value={(bus as any)[f.key]}
                            onChange={e => setFleet(prev => prev.map(b => b.id === bus.id ? { ...b, [f.key]: e.target.value } : b))}
                            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500" />
                        ))}
                        <button onClick={() => setEditBusId(null)} className="col-span-2 bg-brand-600 hover:bg-brand-500 text-white py-1.5 rounded-lg text-xs font-bold">✓ Sauvegarder</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ROUTES TAB ── */}
        {activeTab === 'routes' && (
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="text-sm font-black text-white mb-4">{LINES.length} lignes actives</h2>
            <div className="space-y-3">
              {['DDD', 'AFTU', 'BRT', 'TER'].map(op => {
                const opLines = LINES.filter(l => l.operator === op);
                if (!opLines.length) return null;
                return (
                  <div key={op}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: opColor(op) }} />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">{OPERATORS[op]?.fullName} ({op})</span>
                    </div>
                    {opLines.map(line => {
                      const busCount = busPositions.filter((b: any) => b.lineId === line.id).length;
                      return (
                        <div key={line.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3 mb-2 flex items-center gap-3">
                          <span className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: line.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white text-sm">{line.name}</div>
                            <div className="text-xs text-slate-400 truncate">{line.route}</div>
                            <div className="text-[10px] text-slate-500 mt-1">{line.stops.length} arrêts · {line.freq} · {line.tarif} FCFA</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className={`text-sm font-black ${busCount > 0 ? 'text-green-400' : 'text-slate-600'}`}>{busCount}</div>
                            <div className="text-[10px] text-slate-500">bus</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ALERTS TAB ── */}
        {activeTab === 'alerts' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 mb-4">
              <h3 className="font-black text-orange-400 mb-1 flex items-center gap-2">⚠️ Alerte Réseau Active</h3>
              <p className="text-xs text-orange-200">Fort trafic détecté sur la VDN. Lignes L8, L9, A3 — retards estimés +15 min.</p>
            </div>
            <div className="space-y-3">
              {[
                { time: '17:35', type: 'Retard', line: 'L8', msg: 'Bus DK-7731-CC signale un embouteillage à Yoff', color: '#f59e0b' },
                { time: '17:20', type: 'Panne', line: 'BRT-L1', msg: 'Bus DK-9901-EE — Incident moteur, assistance demandée', color: '#dc2626' },
                { time: '16:55', type: 'Info', line: 'TER-01', msg: 'TER-2024-01 — Départ AIBD avec 10min de retard', color: '#3b82f6' },
              ].map((a, i) => (
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black px-2 py-1 rounded-lg text-white" style={{ backgroundColor: a.color + 'cc' }}>{a.type}</span>
                    <span className="text-[10px] text-slate-500">{a.time}</span>
                  </div>
                  <p className="text-xs text-slate-300">{a.msg}</p>
                  <div className="flex gap-2 mt-3">
                    <button className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-lg">Accusé ✓</button>
                    <button className="text-[10px] bg-brand-600/20 text-brand-400 px-3 py-1 rounded-lg">Contacter chauffeur</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FINANCE TAB ── */}
        {activeTab === 'finance' && (
          <div className="flex-1 overflow-y-auto p-4 bg-slate-900">
            <h2 className="text-xl font-black text-white mb-6">Tableau de bord financier</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="col-span-2 bg-gradient-to-r from-brand-600 to-blue-800 rounded-3xl p-6 text-white shadow-xl shadow-brand-900/50">
                <p className="text-sm font-bold text-blue-200 mb-1">Chiffre d'Affaires Global (Aujourd'hui)</p>
                <h3 className="text-4xl font-black tracking-tight">
                  {(adminRevenue.DDD + adminRevenue.AFTU + adminRevenue.BRT + adminRevenue.TER).toLocaleString('fr-FR')} <span className="text-xl text-blue-300">FCFA</span>
                </h3>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-green-300">
                  <span className="bg-green-500/20 px-2 py-1 rounded-full">+14.5%</span>
                  <span>vs hier</span>
                </div>
              </div>

              {['DDD', 'AFTU', 'BRT', 'TER'].map(op => (
                <div key={op} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: opColor(op) }} />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">{op}</span>
                  </div>
                  <h4 className="text-xl font-black text-white">
                    {adminRevenue[op as keyof typeof adminRevenue].toLocaleString('fr-FR')} <span className="text-xs text-slate-500">FCFA</span>
                  </h4>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Dernières Transactions (M-Ticket)</h3>
              <div className="space-y-3">
                {[
                  { id: 'T-8F9A', op: 'BRT', price: 300, time: 'À l\'instant', method: 'Wave' },
                  { id: 'T-2B4C', op: 'DDD', price: 200, time: 'Il y a 2 min', method: 'Orange Money' },
                  { id: 'T-9D1E', op: 'AFTU', price: 150, time: 'Il y a 5 min', method: 'Wave' },
                  { id: 'T-5C7F', op: 'TER', price: 500, time: 'Il y a 8 min', method: 'Orange Money' },
                ].map((tx, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-900 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: opColor(tx.op) }}>{tx.op[0]}</div>
                      <div>
                        <div className="font-bold text-sm text-white">{tx.id}</div>
                        <div className="text-[10px] text-slate-500">{tx.time} · {tx.method}</div>
                      </div>
                    </div>
                    <div className="font-black text-green-400">+{tx.price} F</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
