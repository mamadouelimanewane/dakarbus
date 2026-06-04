import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveTab, logout } from '@/store/store';
import OperatorFilter from '@/components/OperatorFilter';
import MapView from '@/components/MapView';
import GeolocGate from '@/components/GeolocGate';
import ToastContainer from '@/components/ToastContainer';
import JourneyEndModal from '@/components/JourneyEndModal';
import PlanPage from '@/pages/PlanPage';
import LinesPage from '@/pages/LinesPage';
import StopsPage from '@/pages/StopsPage';
import AlertsPage from '@/pages/AlertsPage';
import TicketsPage from '@/pages/TicketsPage';
import ProfilePage from '@/pages/ProfilePage';
import ActiveJourneyPage from '@/pages/ActiveJourneyPage';

type Tab = 'plan' | 'lines' | 'stops' | 'alerts' | 'tickets' | 'profile';

const BASE_TABS: { id: Tab; label: string; icon: string; mapRelevant?: boolean }[] = [
  { id: 'plan',    label: 'Planifier', icon: '🗺️', mapRelevant: true },
  { id: 'lines',   label: 'Lignes',    icon: '🚌', mapRelevant: true },
  { id: 'stops',   label: 'Arrêts',    icon: '📍', mapRelevant: true },
  { id: 'alerts',  label: 'Alertes',   icon: '⚠️' },
  { id: 'tickets', label: 'Billets',   icon: '🎫' },
  { id: 'profile', label: 'Profil',    icon: '👤' },
];

const PAGES: Record<Tab, React.ComponentType> = {
  plan: PlanPage, lines: LinesPage, stops: StopsPage,
  alerts: AlertsPage, tickets: TicketsPage, profile: ProfilePage,
};

export default function PassengerApp() {
  const dispatch = useAppDispatch();
  const { activeTab } = useAppSelector(s => s.mobility);
  const { reports, myTickets } = useAppSelector(s => s.tickets);
  const { active: activeJourney } = useAppSelector(s => s.journey);
  const [geoReady, setGeoReady] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [journeyPanelOpen, setJourneyPanelOpen] = useState(false);

  // Auto-open journey panel when a journey starts
  React.useEffect(() => {
    if (activeJourney) setJourneyPanelOpen(true);
    else setJourneyPanelOpen(false);
  }, [!!activeJourney]);

  const validTickets  = myTickets.filter(t => t.status === 'valid').length;
  const recentAlerts  = reports.filter(r => Date.now() - r.timestamp < 1000 * 60 * 30).length;

  const currentTab  = BASE_TABS.find(t => t.id === activeTab);
  const showMap     = (currentTab?.mapRelevant ?? false) && !journeyPanelOpen;

  const Page = PAGES[activeTab] || PlanPage;

  const getBadge = (id: Tab) => {
    if (id === 'alerts'  && recentAlerts > 0)  return recentAlerts;
    if (id === 'tickets' && validTickets > 0)  return validTickets;
    return null;
  };

  const journeyStatusColor: Record<string, string> = {
    walking: '#059669', waiting: '#d97706', on_bus: '#2563eb', arrived: '#7c3aed',
  };
  const jColor = activeJourney ? journeyStatusColor[activeJourney.status] : '#2563eb';

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      {!geoReady && <GeolocGate onDone={() => setGeoReady(true)} />}
      <ToastContainer />
      <JourneyEndModal />

      <div className={`flex-1 flex flex-col overflow-hidden ${!geoReady ? 'opacity-0 pointer-events-none' : ''}`}
        style={{ transition: 'opacity .3s' }}>

        {/* ── HEADER ─────────────────────────────────────── */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 h-14 z-50"
          style={{ background: 'rgba(10,15,30,.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--c-border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', boxShadow: '0 4px 14px rgba(37,99,235,.4)' }}>🚌</div>
            <div>
              <span className="text-base font-black text-white leading-none">SunuBus</span>
              <span className="text-[10px] font-semibold ml-1.5" style={{ color: '#3b82f6' }}>Dakar 🇸🇳</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Active journey badge in header */}
            {activeJourney && (
              <button onClick={() => setJourneyPanelOpen(o => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95"
                style={{ background: `${jColor}20`, border: `1px solid ${jColor}40`, color: 'white' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: jColor, animation: 'live-pulse 2s infinite' }} />
                <span style={{ color: jColor }}>En cours</span>
              </button>
            )}
            {showMap && (
              <button onClick={() => setMapOpen(o => !o)}
                className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all active:scale-90"
                style={{ background: mapOpen ? 'rgba(37,99,235,.25)' : 'rgba(255,255,255,.06)', border: '1px solid var(--c-border)' }}>
                {mapOpen ? '📋' : '🗺️'}
              </button>
            )}
            <button onClick={() => dispatch(logout())}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--c-border)', color: '#64748b' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>↩</button>
          </div>
        </header>

        {/* ── OPERATOR FILTER ────────────────────────────── */}
        {!journeyPanelOpen && (
          <div className="flex-shrink-0 z-40"
            style={{ background: 'rgba(10,15,30,.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--c-border)' }}>
            <OperatorFilter />
          </div>
        )}

        {/* ── BODY ───────────────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden relative">

          {/* Desktop vertical nav */}
          <nav className="hidden lg:flex flex-col flex-shrink-0 z-40"
            style={{ width: 64, background: 'rgba(10,15,30,.95)', backdropFilter: 'blur(20px)', borderRight: '1px solid var(--c-border)' }}>
            <div className="flex-1 flex flex-col items-center py-3 gap-1">
              {/* Active journey shortcut */}
              {activeJourney && (
                <button onClick={() => setJourneyPanelOpen(o => !o)}
                  title="Mon trajet en cours"
                  className="relative w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 mb-2"
                  style={{ background: `${jColor}20`, border: `1.5px solid ${jColor}50` }}>
                  <span className="text-lg">🚀</span>
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full" style={{ background: jColor, animation: 'live-pulse 2s infinite' }} />
                </button>
              )}
              {BASE_TABS.map(tab => {
                const active = activeTab === tab.id && !journeyPanelOpen;
                const badge  = getBadge(tab.id);
                return (
                  <button key={tab.id} onClick={() => { dispatch(setActiveTab(tab.id)); setJourneyPanelOpen(false); }}
                    className="relative w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90"
                    title={tab.label}
                    style={{ background: active ? 'rgba(37,99,235,.2)' : 'transparent', border: active ? '1px solid rgba(37,99,235,.35)' : '1px solid transparent' }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.05)'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                    <span className="text-lg leading-none">{tab.icon}</span>
                    {badge !== null && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center"
                        style={{ background: '#dc2626', boxShadow: '0 2px 8px rgba(220,38,38,.6)' }}>
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-blue-500" />}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Page / Journey panel */}
          <aside className={`flex flex-col z-30 overflow-hidden transition-all duration-300 ${
            showMap
              ? 'absolute lg:relative inset-y-0 left-0 w-full lg:w-[380px] xl:w-[420px]'
              : 'w-full'
          }`}
            style={{
              background: 'var(--c-bg)',
              borderRight: showMap ? '1px solid var(--c-border)' : 'none',
              transform: showMap && mapOpen ? 'translateX(-100%)' : 'translateX(0)',
            }}>
            <div className="flex-1 overflow-y-auto">
              {journeyPanelOpen ? <ActiveJourneyPage /> : <Page />}
            </div>
          </aside>

          {/* Map */}
          {showMap && (
            <main className={`flex-1 relative overflow-hidden ${mapOpen ? 'block' : 'hidden lg:block'}`}>
              {mapOpen && (
                <button onClick={() => setMapOpen(false)}
                  className="lg:hidden absolute top-3 left-3 z-[900] flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white active:scale-95"
                  style={{ background: 'rgba(10,15,30,.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.1)' }}>
                  ← Retour
                </button>
              )}
              <MapView />
            </main>
          )}
        </div>

        {/* ── BOTTOM TAB BAR ─────────────────────────────── */}
        <nav className="lg:hidden flex-shrink-0 tab-bar pb-safe">
          {/* Active journey tab */}
          {activeJourney && (
            <button onClick={() => { setJourneyPanelOpen(true); setMapOpen(false); }}
              className={`tab-item flex-1 ${journeyPanelOpen ? 'active' : ''}`}
              style={{ color: journeyPanelOpen ? jColor : jColor + '80' }}>
              <div className="relative">
                <span className="tab-icon">🚀</span>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{ background: jColor, animation: 'live-pulse 2s infinite' }} />
              </div>
              <span>Trajet</span>
            </button>
          )}
          {BASE_TABS.map(tab => {
            const active = activeTab === tab.id && !journeyPanelOpen;
            const badge  = getBadge(tab.id);
            return (
              <button key={tab.id} onClick={() => { dispatch(setActiveTab(tab.id)); setJourneyPanelOpen(false); setMapOpen(false); }}
                className={`tab-item flex-1 ${active ? 'active' : ''}`}>
                {active && <div className="absolute inset-0 rounded-xl opacity-100 pointer-events-none" style={{ background: 'rgba(37,99,235,.12)' }} />}
                <span className="tab-icon relative z-10">{tab.icon}</span>
                <span className="relative z-10">{tab.label}</span>
                {badge !== null && (
                  <span className="absolute -top-0.5 right-1 w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center"
                    style={{ background: '#dc2626' }}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

      </div>
    </div>
  );
}
