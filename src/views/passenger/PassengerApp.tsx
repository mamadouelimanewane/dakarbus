import React, { useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveTab, logout, clearFocusedLine } from '@/store/store';
import MapView from '@/components/MapView';
import GeolocGate from '@/components/GeolocGate';
import ToastContainer from '@/components/ToastContainer';
import JourneyEndModal from '@/components/JourneyEndModal';
import PlanPage from '@/pages/PlanPage';
import LinesPage from '@/pages/LinesPage';
// LinesPage also used directly in lines-tab layout
import StopsPage from '@/pages/StopsPage';
import AlertsPage from '@/pages/AlertsPage';
import TicketsPage from '@/pages/TicketsPage';
import ProfilePage from '@/pages/ProfilePage';
import ActiveJourneyPage from '@/pages/ActiveJourneyPage';
import OperatorFilter from '@/components/OperatorFilter';
import ChatBot from '@/components/ChatBot';

type Tab = 'plan' | 'lines' | 'stops' | 'alerts' | 'tickets' | 'profile';

const BASE_TABS: { id: Tab; label: string; icon: string; mapRelevant?: boolean }[] = [
  { id: 'plan',    label: 'Planifier', icon: '🗺️',  mapRelevant: true },
  { id: 'lines',   label: 'Lignes',    icon: '🚌',  mapRelevant: true },
  { id: 'stops',   label: 'Arrêts',    icon: '📍',  mapRelevant: true },
  { id: 'alerts',  label: 'Alertes',   icon: '⚠️' },
  { id: 'tickets', label: 'Billets',   icon: '🎫' },
  { id: 'profile', label: 'Profil',    icon: '👤' },
];

const PAGES: Record<Tab, React.ComponentType> = {
  plan: PlanPage, lines: LinesPage, stops: StopsPage,
  alerts: AlertsPage, tickets: TicketsPage, profile: ProfilePage,
};

// ── Bottom sheet draggable handle ─────────────────────────────
function SheetHandle() {
  return (
    <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
      <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.18)' }} />
    </div>
  );
}

export default function PassengerApp() {
  const dispatch = useAppDispatch();
  const { activeTab, routeDisplay, focusedLine } = useAppSelector(s => s.mobility);
  const { reports, myTickets } = useAppSelector(s => s.tickets);
  const { active: activeJourney } = useAppSelector(s => s.journey);
  const [geoReady, setGeoReady] = useState(false);
  const [journeyPanelOpen, setJourneyPanelOpen] = useState(false);
  // sheet: 'peek' = search only visible, 'half' = results visible, 'full' = full panel
  const [sheetState, setSheetState] = useState<'peek' | 'half' | 'full'>('peek');
  const sheetRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (activeJourney) setJourneyPanelOpen(true);
    else setJourneyPanelOpen(false);
  }, [!!activeJourney]);

  // Auto-expand sheet when route is calculated
  React.useEffect(() => {
    if (routeDisplay) setSheetState('half');
  }, [routeDisplay]);

  // Reset sheet on tab change
  React.useEffect(() => {
    setSheetState('peek');
  }, [activeTab]);

  const validTickets = myTickets.filter(t => t.status === 'valid').length;
  const recentAlerts = reports.filter(r => Date.now() - r.timestamp < 1000 * 60 * 30).length;

  const getBadge = (id: Tab) => {
    if (id === 'alerts'  && recentAlerts > 0) return recentAlerts;
    if (id === 'tickets' && validTickets > 0) return validTickets;
    return null;
  };

  const journeyStatusColor: Record<string, string> = {
    walking: '#059669', waiting: '#d97706', on_bus: '#2563eb', arrived: '#7c3aed',
  };
  const jColor = activeJourney ? journeyStatusColor[activeJourney.status] : '#2563eb';

  // Citymapper layout: map + bottom sheet on plan/stops tab (lines has its own layout)
  const isCitymapper = (activeTab === 'plan' || activeTab === 'stops') && !journeyPanelOpen;
  // Lines tab: full list → click → full map
  const isLinesTab = activeTab === 'lines' && !journeyPanelOpen;

  const sheetHeights: Record<string, string> = {
    peek: '288px',
    half: '58vh',
    full: '88vh',
  };

  const Page = PAGES[activeTab] || PlanPage;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      {!geoReady && <GeolocGate onDone={() => setGeoReady(true)} />}
      <ToastContainer />
      <JourneyEndModal />

      <ChatBot />

      <div className={`flex-1 flex flex-col overflow-hidden ${!geoReady ? 'opacity-0 pointer-events-none' : ''}`}
        style={{ transition: 'opacity .3s' }}>

        {/* ── DESKTOP HEADER (hidden on mobile citymapper) ─── */}
        <header className={`flex-shrink-0 flex items-center justify-between px-4 h-14 z-50 ${isCitymapper ? 'hidden lg:flex' : 'flex'}`}
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
            {activeJourney && (
              <button onClick={() => setJourneyPanelOpen(o => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95"
                style={{ background: `${jColor}20`, border: `1px solid ${jColor}40`, color: 'white' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: jColor, animation: 'live-pulse 2s infinite' }} />
                <span style={{ color: jColor }}>En cours</span>
              </button>
            )}
            <button onClick={() => dispatch(logout())}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--c-border)', color: '#64748b' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>↩</button>
          </div>
        </header>

        {/* ── BODY ──────────────────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden relative">

          {/* Desktop vertical nav */}
          <nav className="hidden lg:flex flex-col flex-shrink-0 z-40"
            style={{ width: 64, background: 'rgba(10,15,30,.95)', backdropFilter: 'blur(20px)', borderRight: '1px solid var(--c-border)' }}>
            <div className="flex-1 flex flex-col items-center py-3 gap-1">
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

          {/* ══ MOBILE CITYMAPPER LAYOUT ══════════════════════ */}
          {isCitymapper && (
            <div className="lg:hidden flex-1 flex flex-col overflow-hidden relative">

              {/* Map — fills remaining space above sheet */}
              <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
                {/* Floating top bar on map */}
                <div className="absolute top-0 inset-x-0 z-[800] flex items-center justify-between px-3 pt-3 gap-2 pointer-events-none">
                  <div className="flex items-center gap-2 pointer-events-auto"
                    style={{ background: 'rgba(10,15,30,.88)', backdropFilter: 'blur(16px)', borderRadius: 14, padding: '6px 12px', border: '1px solid rgba(255,255,255,.1)' }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                      style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}>🚌</div>
                    <span className="text-sm font-black text-white">SunuBus</span>
                    <span className="text-[10px]" style={{ color: '#3b82f6' }}>🇸🇳</span>
                  </div>
                  <div className="flex items-center gap-1.5 pointer-events-auto">
                    {activeJourney && (
                      <button onClick={() => setJourneyPanelOpen(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black"
                        style={{ background: `${jColor}22`, border: `1px solid ${jColor}50`, color: 'white', backdropFilter: 'blur(12px)' }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: jColor, animation: 'live-pulse 2s infinite' }} />
                        <span style={{ color: jColor }}>Trajet</span>
                      </button>
                    )}
                    <button onClick={() => dispatch(logout())}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                      style={{ background: 'rgba(10,15,30,.88)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.1)', color: '#64748b' }}>↩</button>
                  </div>
                </div>

                {/* Operator filter chips — floating on map */}
                {activeTab !== 'plan' && (
                  <div className="absolute bottom-0 inset-x-0 z-[800] pointer-events-none">
                    <div className="pointer-events-auto" style={{ background: 'linear-gradient(to top, rgba(10,15,30,.7) 0%, transparent 100%)', paddingBottom: 4 }}>
                      <OperatorFilter />
                    </div>
                  </div>
                )}

                <MapView />
              </div>

              {/* ── BOTTOM SHEET ─────────────────────────────── */}
              <div
                ref={sheetRef}
                style={{
                  height: sheetHeights[sheetState],
                  transition: 'height .35s cubic-bezier(.32,.72,0,1)',
                  background: 'rgba(10,15,30,.97)',
                  backdropFilter: 'blur(24px)',
                  borderTop: '1px solid rgba(255,255,255,.09)',
                  borderRadius: '20px 20px 0 0',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: '0 -8px 40px rgba(0,0,0,.5)',
                  zIndex: 500,
                }}>

                {/* Sheet handle — tap to cycle states */}
                <button
                  onClick={() => setSheetState(s => s === 'peek' ? 'half' : s === 'half' ? 'full' : 'peek')}
                  className="flex-shrink-0 w-full flex justify-center items-center"
                  style={{ paddingTop: 10, paddingBottom: 6, touchAction: 'none' }}>
                  <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)' }} />
                </button>

                {/* Sheet content scrollable */}
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                  <Page />
                </div>
              </div>
            </div>
          )}

          {/* ══ LINES TAB — liste pleine / carte de ligne ══════ */}
          {isLinesTab && (
            <div className="flex-1 flex overflow-hidden relative">
              {/* Carte de ligne — visible quand une ligne est sélectionnée */}
              {focusedLine ? (
                <div className="flex-1 relative overflow-hidden">
                  {/* Bouton retour flottant */}
                  <button
                    onClick={() => { dispatch(clearFocusedLine()); }}
                    className="absolute top-3 left-3 z-[900] flex items-center gap-2 px-3 py-2 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'rgba(10,15,30,.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.15)', color: 'white', fontSize: 13, fontWeight: 800 }}>
                    ← Retour
                  </button>
                  <MapView />
                </div>
              ) : (
                /* Liste complète des lignes */
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-shrink-0 z-40"
                    style={{ background: 'rgba(10,15,30,.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--c-border)' }}>
                    <OperatorFilter />
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <LinesPage />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ DESKTOP / NON-MAP TABS LAYOUT ════════════════ */}
          {!isCitymapper && (
            <>
              <aside className="w-full lg:w-[380px] xl:w-[420px] flex flex-col z-30 overflow-hidden"
                style={{ background: 'var(--c-bg)', borderRight: '1px solid var(--c-border)' }}>
                {!journeyPanelOpen && (
                  <div className="flex-shrink-0 z-40"
                    style={{ background: 'rgba(10,15,30,.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--c-border)' }}>
                    <OperatorFilter />
                  </div>
                )}
                <div className="flex-1 overflow-y-auto">
                  {journeyPanelOpen ? <ActiveJourneyPage /> : <Page />}
                </div>
              </aside>
              {/* Map on desktop for non-map tabs shown as secondary */}
              <main className="hidden lg:block flex-1 relative overflow-hidden">
                <MapView />
              </main>
            </>
          )}

          {/* Desktop map for citymapper tabs */}
          {isCitymapper && (
            <div className="hidden lg:flex flex-1 flex-col overflow-hidden">
              <div className="flex-shrink-0 z-40"
                style={{ background: 'rgba(10,15,30,.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--c-border)' }}>
                <OperatorFilter />
              </div>
              <aside className="w-[380px] xl:w-[420px] absolute inset-y-0 left-0 z-30 flex flex-col overflow-hidden"
                style={{ background: 'var(--c-bg)', borderRight: '1px solid var(--c-border)' }}>
                <div className="flex-1 overflow-y-auto">
                  <Page />
                </div>
              </aside>
              <main className="flex-1 relative overflow-hidden" style={{ marginLeft: 380 }}>
                <MapView />
              </main>
            </div>
          )}

        </div>

        {/* ── BOTTOM TAB BAR (mobile) ──────────────────────── */}
        <nav className="lg:hidden flex-shrink-0"
          style={{
            display: 'flex',
            background: 'rgba(8,12,24,.97)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,.07)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}>

          {/* Journey shortcut */}
          {activeJourney && (
            <button onClick={() => { setJourneyPanelOpen(true); }}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
              style={{ color: journeyPanelOpen ? jColor : jColor + '80' }}>
              <div className="relative">
                <span className="text-xl">🚀</span>
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: jColor, animation: 'live-pulse 2s infinite' }} />
              </div>
              <span className="text-[9px] font-bold">Trajet</span>
            </button>
          )}

          {BASE_TABS.map(tab => {
            const active = activeTab === tab.id && !journeyPanelOpen;
            const badge  = getBadge(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => {
                  dispatch(setActiveTab(tab.id));
                  setJourneyPanelOpen(false);
                  if (tab.mapRelevant) setSheetState('peek');
                }}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative transition-all"
                style={{ color: active ? '#3b82f6' : '#475569' }}>
                {active && (
                  <div className="absolute top-0 inset-x-1/4 h-0.5 rounded-full" style={{ background: '#3b82f6' }} />
                )}
                <span className="text-xl leading-none">{tab.icon}</span>
                <span className="text-[9px] font-bold">{tab.label}</span>
                {badge !== null && (
                  <span className="absolute top-1 right-2 w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center"
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
