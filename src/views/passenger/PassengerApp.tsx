import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveTab, toggleDarkMode } from '@/store/store';
import OperatorFilter from '@/components/OperatorFilter';
import MapView from '@/components/MapView';
import GeolocGate from '@/components/GeolocGate';
import PlanPage from '@/pages/PlanPage';
import LinesPage from '@/pages/LinesPage';
import StopsPage from '@/pages/StopsPage';
import AlertsPage from '@/pages/AlertsPage';

const TABS = [
  { id: 'plan', label: 'Planifier', icon: '🗺️' },
  { id: 'lines', label: 'Lignes', icon: '🛤️' },
  { id: 'stops', label: 'Arrêts', icon: '🚏' },
  { id: 'alerts', label: 'Alertes', icon: '⚠️' },
] as const;

const PAGES = {
  plan: PlanPage,
  lines: LinesPage,
  stops: StopsPage,
  alerts: AlertsPage,
};

export default function PassengerApp() {
  const dispatch = useAppDispatch();
  const { activeTab } = useAppSelector(s => s.mobility);
  const { darkMode } = useAppSelector(s => s.ui);
  
  const [geoReady, setGeoReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const Page = PAGES[activeTab] || PlanPage;

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden ${darkMode ? 'dark' : ''} bg-slate-900 text-slate-200 font-sans`}>
      {!geoReady && <GeolocGate onDone={() => setGeoReady(true)} />}
      
      <div className={`flex-1 flex flex-col ${!geoReady ? 'invisible' : ''}`}>
        
        {/* Header */}
        <header className="bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 py-3 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-xl shadow-lg shadow-brand-500/30">🚌</div>
            <div>
              <h1 className="text-xl font-black text-white leading-none tracking-tight">SunuBus</h1>
              <p className="text-xs text-brand-400 font-bold mt-1">Dakar · Sénégal 🇸🇳</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors lg:hidden"
            >
              {sidebarCollapsed ? '📋' : '🗺️'}
            </button>
            <button 
              onClick={() => dispatch(toggleDarkMode())}
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-slate-900 border-b border-slate-800 z-40">
          <OperatorFilter />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex relative overflow-hidden">
          {/* Sidebar */}
          <aside className={`absolute lg:relative z-30 lg:z-10 top-0 bottom-0 w-full lg:w-[400px] bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col transition-transform duration-300 ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}>
            <Page />
          </aside>
          
          {/* Map Area */}
          <main className="flex-1 relative bg-slate-800">
            <MapView />
          </main>
        </div>

        {/* Bottom Nav */}
        <nav className="bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 py-2 pb-safe lg:hidden z-50">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { dispatch(setActiveTab(tab.id)); setSidebarCollapsed(false); }}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl min-w-[72px] transition-all ${active ? 'text-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <span className={`text-xl transition-transform ${active ? 'scale-110' : ''}`}>{tab.icon}</span>
                <span className="text-[10px] font-bold">{tab.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </div>
  );
}
