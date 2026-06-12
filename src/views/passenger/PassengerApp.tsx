import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveTab, logout, clearFocusedLine, setMapCenter, setMapZoom, setRouteDisplay } from '@/store/store';
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
import OperatorFilter from '@/components/OperatorFilter';
import ChatBot from '@/components/ChatBot';
import OnboardingModal from '@/components/OnboardingModal';
import GlobalSearch from '@/components/GlobalSearch';
import WalkToStopGuide from '@/components/WalkToStopGuide';
import { haptic } from '@/utils/haptic';
import { useSmartAlerts } from '@/hooks/useSmartAlerts';
import { usePopBack } from '@/hooks/usePopBack';
import { getNearestStop } from '@/utils/nearest';
import type { Stop } from '@/types';

const LAST_TAB_KEY = 'sunubus_last_tab';

// ── Types ──────────────────────────────────────────────────────
type Tab = 'plan' | 'lines' | 'stops' | 'alerts' | 'tickets' | 'profile';

const TAB_ORDER: Tab[] = ['plan', 'lines', 'stops', 'alerts', 'tickets', 'profile'];

const TABS: { id: Tab; label: string; icon: string; mapRelevant?: boolean }[] = [
  { id: 'plan',    label: 'Planifier', icon: '🗺️',  mapRelevant: true },
  { id: 'lines',   label: 'Lignes',    icon: '🚌',  mapRelevant: true },
  { id: 'stops',   label: 'Arrêts',    icon: '📍',  mapRelevant: true },
  { id: 'alerts',  label: 'Alertes',   icon: '⚠️' },
  { id: 'tickets', label: 'Billets',   icon: '🎫' },
  { id: 'profile', label: 'Profil',    icon: '👤' },
];

const PAGES: Record<Tab, React.ComponentType<any>> = {
  plan: PlanPage, lines: LinesPage, stops: StopsPage,
  alerts: AlertsPage, tickets: TicketsPage, profile: ProfilePage,
};

const TAB_COLORS: Record<Tab, string> = {
  plan: '#3b82f6', lines: '#3b82f6', stops: '#10b981',
  alerts: '#f59e0b', tickets: '#8b5cf6', profile: '#64748b',
};

// ── Composant ──────────────────────────────────────────────────
// ── Bannière hors-ligne ────────────────────────────────────────
function OfflineBanner() {
  const [online, setOnline] = React.useState(navigator.onLine);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    const on  = () => { setOnline(true);  setDismissed(false); };
    const off = () => { setOnline(false); setDismissed(false); };
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (online || dismissed) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[9990] flex items-center justify-between gap-3 px-4 py-2.5 animate-slide-down"
      style={{
        background: 'linear-gradient(135deg,rgba(217,119,6,.97),rgba(180,83,9,.97))',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,.4)',
      }}>
      <div className="flex items-center gap-2.5">
        <span className="text-xl">📵</span>
        <div>
          <p className="text-xs font-black text-white leading-tight">Mode hors ligne</p>
          <p className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,.75)' }}>
            Tracés des lignes disponibles · Calcul d'itinéraire indisponible
          </p>
        </div>
      </div>
      <button onClick={() => setDismissed(true)}
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
        style={{ background: 'rgba(0,0,0,.2)', color: 'white' }}>✕</button>
    </div>
  );
}

export default function PassengerApp() {
  const dispatch = useAppDispatch();
  const { activeTab, routeDisplay, focusedLine } = useAppSelector(s => s.mobility);
  const { reports, myTickets } = useAppSelector(s => s.tickets);
  const { active: activeJourney } = useAppSelector(s => s.journey);

  const [geoReady, setGeoReady] = useState(false);
  const handleGeoReady = useCallback(() => setGeoReady(true), []);
  const [journeyPanelOpen, setJourneyPanelOpen] = useState(false);
  const [sheetState, setSheetState] = useState<'peek' | 'half' | 'full'>('peek');
  const [linesMapView, setLinesMapView] = useState(false);
  const [prevTab, setPrevTab] = useState<Tab>(activeTab as Tab);
  const [transitionDir, setTransitionDir] = useState<'right' | 'left'>('right');
  const [transitionKey, setTransitionKey] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [walkGuideStop, setWalkGuideStop] = useState<Stop | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);

  // ── Pile de navigation onglets ────────────────────────────
  // Stocke l'historique des onglets visités pour que "back" revienne
  // à l'onglet précédent (et non à l'accueil/login)
  const navStack = useRef<Tab[]>([activeTab as Tab]);

  // ── Sauvegarde/restaure le dernier onglet ─────────────────
  useEffect(() => {
    const saved = localStorage.getItem(LAST_TAB_KEY) as Tab | null;
    if (saved && TAB_ORDER.includes(saved) && saved !== 'plan') {
      dispatch(setActiveTab(saved));
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(LAST_TAB_KEY, activeTab as string);
  }, [activeTab]);

  // ── Auto-centrage GPS à l'ouverture ───────────────────────
  const { userLocation } = useAppSelector(s => s.mobility);
  const hasAutocentered = useRef(false);
  useEffect(() => {
    if (!hasAutocentered.current && userLocation && geoReady) {
      hasAutocentered.current = true;
      dispatch(setMapCenter(userLocation));
      dispatch(setMapZoom(11));
    }
  }, [userLocation, geoReady]);

  // ── Swipe horizontal pour changer d'onglet (mobile) ──────
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const swipeTarget = useRef<EventTarget | null>(null);

  const onSwipeStart = useCallback((e: React.TouchEvent) => {
    swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    swipeTarget.current = e.target;
  }, []);

  const onSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeStart.current) return;
    const dx = e.changedTouches[0].clientX - swipeStart.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - swipeStart.current.y);
    swipeStart.current = null;
    // Ignore si scroll vertical dominant ou si l'événement vient d'un input/scroll
    if (dy > 60 || Math.abs(dx) < 80) return;
    const el = swipeTarget.current as HTMLElement | null;
    if (el?.closest('[data-no-swipe]')) return;
    const curIdx = TAB_ORDER.indexOf(activeTab as Tab);
    if (dx < 0 && curIdx < TAB_ORDER.length - 1) {
      haptic('light');
      goTab(TAB_ORDER[curIdx + 1]);
    } else if (dx > 0 && curIdx > 0) {
      haptic('light');
      goTab(TAB_ORDER[curIdx - 1]);
    }
  }, [activeTab]);

  // ── Drag bottom sheet (natif) ─────────────────────────────
  const sheetDragStart = useRef<{ y: number; state: string } | null>(null);
  const SHEET_HEIGHTS = { peek: 290, half: Math.round(window.innerHeight * 0.58), full: Math.round(window.innerHeight * 0.91) };
  const [sheetDragY, setSheetDragY] = useState(0);
  const isDraggingSheet = useRef(false);

  const onSheetTouchStart = useCallback((e: React.TouchEvent) => {
    sheetDragStart.current = { y: e.touches[0].clientY, state: sheetState };
    isDraggingSheet.current = false;
  }, [sheetState]);

  const onSheetTouchMove = useCallback((e: React.TouchEvent) => {
    if (!sheetDragStart.current) return;
    const dy = e.touches[0].clientY - sheetDragStart.current.y;
    if (Math.abs(dy) > 8) isDraggingSheet.current = true;
    if (isDraggingSheet.current) setSheetDragY(Math.max(-40, dy));
  }, []);

  const onSheetTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!sheetDragStart.current || !isDraggingSheet.current) { sheetDragStart.current = null; setSheetDragY(0); return; }
    const dy = e.changedTouches[0].clientY - sheetDragStart.current.y;
    sheetDragStart.current = null;
    setSheetDragY(0);
    isDraggingSheet.current = false;
    if (dy < -60) setSheetState(s => s === 'peek' ? 'half' : 'full');
    else if (dy > 60) setSheetState(s => s === 'full' ? 'half' : 'peek');
  }, []);

  // ── Tab change avec direction de transition ────────────────
  const goTab = useCallback((tab: Tab) => {
    if (tab === activeTab) return;
    const fromIdx = TAB_ORDER.indexOf(activeTab as Tab);
    const toIdx   = TAB_ORDER.indexOf(tab);
    setTransitionDir(toIdx > fromIdx ? 'right' : 'left');
    setTransitionKey(k => k + 1);
    setPrevTab(activeTab as Tab);
    // Empiler l'onglet courant AVANT de changer
    navStack.current.push(tab);
    dispatch(setActiveTab(tab));
    // Effacer l'itinéraire affiché quand on quitte vers un onglet non-plan
    if (tab !== 'plan') dispatch(setRouteDisplay(null));
    // Effacer la ligne focalisée quand on quitte l'onglet Lignes
    if (activeTab === 'lines' && tab !== 'lines') dispatch(clearFocusedLine());
    setJourneyPanelOpen(false);
    if (TABS.find(t => t.id === tab)?.mapRelevant) setSheetState('peek');
  }, [activeTab, dispatch]);

  // ── Bouton retour : handlers par ordre de priorité ────────
  // Les modales / sous-vues (priorité haute) sont empilées PAR-DESSUS
  // le handler d'onglet (priorité basse) grâce à usePopBack.

  // Retour sur l'onglet précédent (toujours actif — couche de base)
  usePopBack(useCallback(() => {
    if (navStack.current.length > 1) {
      navStack.current.pop(); // retire l'onglet courant
      const prev = navStack.current[navStack.current.length - 1];
      const fromIdx = TAB_ORDER.indexOf(activeTab as Tab);
      const toIdx   = TAB_ORDER.indexOf(prev);
      setTransitionDir(toIdx < fromIdx ? 'left' : 'right');
      setTransitionKey(k => k + 1);
      setPrevTab(activeTab as Tab);
      dispatch(setActiveTab(prev));
      // Nettoyage des états carte lors du retour
      if (prev !== 'plan') dispatch(setRouteDisplay(null));
      if (activeTab === 'lines' && prev !== 'lines') dispatch(clearFocusedLine());
      setJourneyPanelOpen(false);
    }
    // Si pile vide : on reste sur l'onglet courant (pas de sortie de l'app)
  }, [activeTab, dispatch]));

  // Sous-vues / états dans PassengerApp (priorité variable, s'empilent)
  // isFullPage = !plan && !lines — stops n'utilise plus la carte
  const isFullPageForBack = activeTab !== 'plan' && activeTab !== 'lines';
  usePopBack(useCallback(() => setJourneyPanelOpen(false), []), journeyPanelOpen);
  usePopBack(useCallback(() => setMapFullscreen(false),    []), mapFullscreen);
  usePopBack(useCallback(() => { setLinesMapView(false); dispatch(clearFocusedLine()); }, [dispatch]), linesMapView);

  useSmartAlerts();

  const handleGPSCenter = useCallback(() => {
    if (userLocation) {
      haptic('medium');
      dispatch(setMapCenter(userLocation));
      dispatch(setMapZoom(15));
    }
  }, [userLocation, dispatch]);

  React.useEffect(() => {
    if (activeJourney) setJourneyPanelOpen(true);
    else setJourneyPanelOpen(false);
  }, [!!activeJourney]);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const stop = (e as CustomEvent).detail as Stop;
      setWalkGuideStop(stop);
    };
    window.addEventListener('open-walk-guide', handler);
    return () => window.removeEventListener('open-walk-guide', handler);
  }, []);

  const handleNearestStop = useCallback(() => {
    if (!userLocation) return;
    haptic('medium');
    const result = getNearestStop(userLocation[0], userLocation[1]);
    if (result) setWalkGuideStop(result.stop);
  }, [userLocation]);

  React.useEffect(() => {
    if (routeDisplay) setSheetState('half');
  }, [routeDisplay]);

  React.useEffect(() => {
    setLinesMapView(false);
  }, [activeTab]);

  const validTickets  = myTickets.filter(t => t.status === 'valid').length;
  const recentAlerts  = reports.filter(r => Date.now() - r.timestamp < 1800000).length;
  const getBadge = (id: Tab) => {
    if (id === 'alerts'  && recentAlerts > 0)  return recentAlerts;
    if (id === 'tickets' && validTickets > 0) return validTickets;
    return null;
  };

  const journeyStatusColor: Record<string, string> = {
    walking: '#059669', waiting: '#d97706', on_bus: '#2563eb', arrived: '#7c3aed',
  };
  const jColor = activeJourney ? (journeyStatusColor[activeJourney.status] || '#2563eb') : '#2563eb';

  // Layout logic
  const isCitymapper = activeTab === 'plan' && !journeyPanelOpen;
  const isLinesTab   = activeTab === 'lines' && !journeyPanelOpen;
  const isFullPage   = !isCitymapper && !isLinesTab; // alerts / tickets / profile / journey

  const sheetHeights: Record<string, string> = {
    peek: '290px', half: '58vh', full: '91vh',
  };

  const Page = PAGES[activeTab as Tab] || PlanPage;
  const accentColor = TAB_COLORS[activeTab as Tab] || '#3b82f6';

  return (
    <div className="h-screen flex flex-col overflow-hidden"
      style={{ background: 'var(--c-bg)' }}
      onTouchStart={onSwipeStart}
      onTouchEnd={onSwipeEnd}>
      {!geoReady && <GeolocGate onDone={handleGeoReady} />}
      <OfflineBanner />
      <ToastContainer />
      <JourneyEndModal />
      <ChatBot />

      {/* ── Onboarding (1re visite) ─────────────────────────── */}
      <OnboardingModal />

      {/* ── Recherche universelle ────────────────────────────── */}
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}

      {/* ── Guidage piéton vers arrêt ────────────────────────── */}
      {walkGuideStop && userLocation && (
        <WalkToStopGuide
          stop={walkGuideStop}
          initialPos={userLocation}
          onClose={() => setWalkGuideStop(null)}
        />
      )}

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col overflow-hidden ${!geoReady ? 'opacity-0 pointer-events-none' : ''}`}
        style={{ transition: 'opacity .4s' }}>

        {/* ══════════════════════════════════════════════════════
            DESKTOP HEADER — visible uniquement sur lg+
        ══════════════════════════════════════════════════════ */}
        <header className="hidden lg:flex flex-shrink-0 items-center justify-between px-5 h-14 z-50"
          style={{ background: 'rgba(10,15,30,.97)', backdropFilter: 'blur(24px)', borderBottom: '1px solid var(--c-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', boxShadow: '0 4px 14px rgba(37,99,235,.45)' }}>🚌</div>
            <div>
              <span className="text-base font-black text-white">SunuBus</span>
              <span className="text-[10px] font-bold ml-2 px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(37,99,235,.2)', color: '#60a5fa' }}>Dakar 🇸🇳</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeJourney && (
              <button onClick={() => setJourneyPanelOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black"
                style={{ background: `${jColor}20`, border: `1px solid ${jColor}40`, color: 'white' }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: jColor, animation: 'live-pulse 2s infinite' }} />
                <span style={{ color: jColor }}>En cours</span>
              </button>
            )}
            <button
              title="Changer de rôle"
              onClick={() => { if (window.confirm('Quitter et changer de rôle ?')) dispatch(logout()); }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors"
              style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--c-border)', color: '#64748b' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>↩</button>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════
            BODY
        ══════════════════════════════════════════════════════ */}
        <div className="flex-1 flex overflow-hidden relative">

          {/* Desktop vertical nav ───────────────────────────── */}
          <nav className="hidden lg:flex flex-col flex-shrink-0 z-40"
            style={{ width: 68, background: 'rgba(10,15,30,.97)', backdropFilter: 'blur(24px)', borderRight: '1px solid var(--c-border)' }}>
            <div className="flex-1 flex flex-col items-center py-3 gap-1">
              {activeJourney && (
                <button onClick={() => setJourneyPanelOpen(o => !o)} title="Trajet en cours"
                  className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-1 transition-all active:scale-90"
                  style={{ background: `${jColor}20`, border: `1.5px solid ${jColor}50` }}>
                  <span className="text-xl">🚀</span>
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full" style={{ background: jColor, animation: 'live-pulse 2s infinite' }} />
                </button>
              )}
              {TABS.map(tab => {
                const active = activeTab === tab.id && !journeyPanelOpen;
                const badge  = getBadge(tab.id);
                return (
                  <button key={tab.id} onClick={() => goTab(tab.id)} title={tab.label}
                    className="relative w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90"
                    style={{
                      background: active ? accentColor + '22' : 'transparent',
                      border: `1px solid ${active ? accentColor + '40' : 'transparent'}`,
                    }}>
                    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full" style={{ background: accentColor }} />}
                    <span className="text-lg leading-none">{tab.icon}</span>
                    {badge !== null && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center"
                        style={{ background: '#dc2626' }}>
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* ══════════════════════════════════════════════════
              MOBILE : CITYMAPPER LAYOUT (plan + stops)
          ══════════════════════════════════════════════════ */}
          {isCitymapper && (
            <div className="lg:hidden flex-1 flex flex-col overflow-hidden relative">

              {/* Carte full-screen */}
              <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>

                {/* Top bar flottante sur la carte */}
                <div className="absolute top-0 inset-x-0 z-[800] flex items-center justify-between px-3 pt-3 gap-2 pointer-events-none">
                  <div className="flex items-center gap-2 pointer-events-auto">
                    {/* Logo */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                      style={{ background: 'rgba(10,15,30,.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,.1)' }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}>🚌</div>
                      <span className="text-sm font-black text-white">SunuBus</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pointer-events-auto">
                    {/* Bouton recherche — 44px minimum pour accessibilité mobile */}
                    <button onClick={() => { haptic('light'); setSearchOpen(true); }}
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: 'rgba(10,15,30,.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.1)' }}>🔍</button>
                    {activeJourney && (
                      <button onClick={() => setJourneyPanelOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-black"
                        style={{ background: `${jColor}22`, backdropFilter: 'blur(12px)', border: `1px solid ${jColor}50`, color: 'white', minHeight: 40 }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: jColor, animation: 'live-pulse 2s infinite' }} />
                        <span style={{ color: jColor }}>Trajet</span>
                      </button>
                    )}
                    <button
                      title="Changer de rôle"
                      onClick={() => { if (window.confirm('Quitter et changer de rôle ?')) dispatch(logout()); }}
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: 'rgba(10,15,30,.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.1)', color: '#64748b' }}>↩</button>
                  </div>
                </div>

                {/* Filtre opérateurs */}
                {activeTab !== 'plan' && (
                  <div className="absolute bottom-0 inset-x-0 z-[800] pointer-events-auto">
                    <div style={{ background: 'linear-gradient(to top,rgba(10,15,30,.75) 0%,transparent 100%)', paddingBottom: 4 }}>
                      <OperatorFilter />
                    </div>
                  </div>
                )}

                {/* Bouton retour itinéraire — visible quand plein écran + route calculée */}
                {mapFullscreen && routeDisplay && (
                  <button
                    onClick={() => { haptic('light'); setMapFullscreen(false); setSheetState('half'); }}
                    className="absolute z-[1000] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl transition-all active:scale-95 pointer-events-auto"
                    style={{
                      bottom: 16, left: 12,
                      background: 'rgba(29,78,216,.95)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(96,165,250,.5)',
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 800,
                      boxShadow: '0 4px 20px rgba(29,78,216,.5)',
                    }}>
                    ← Itinéraire
                  </button>
                )}

                {/* Boutons GPS + fullscreen flottants */}
                <div className="absolute z-[1000] flex flex-col gap-2 pointer-events-auto"
                  style={{ bottom: activeTab !== 'plan' ? 52 : 12, right: 12 }}>
                  <button onClick={handleGPSCenter}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-2xl transition-all active:scale-90"
                    style={{ background: 'rgba(8,12,24,.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.15)', boxShadow: '0 4px 16px rgba(0,0,0,.5)' }}
                    title="Centrer sur ma position">
                    📍
                  </button>
                  {userLocation && (
                    <button onClick={handleNearestStop}
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-2xl transition-all active:scale-90"
                      style={{ background: 'rgba(8,12,24,.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.15)', boxShadow: '0 4px 16px rgba(0,0,0,.5)' }}
                      title="M'y guider vers l'arrêt le plus proche">
                      🚶
                    </button>
                  )}
                  <button onClick={() => { haptic('light'); setMapFullscreen(f => !f); }}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shadow-2xl transition-all active:scale-90"
                    style={{ background: 'rgba(8,12,24,.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.15)', boxShadow: '0 4px 16px rgba(0,0,0,.5)' }}
                    title={mapFullscreen ? 'Réduire la carte' : 'Plein écran'}>
                    {mapFullscreen ? '⊡' : '⛶'}
                  </button>
                </div>

                <MapView />

                {/* Rappel itinéraire — visible quand sheet en peek + route calculée */}
                {!mapFullscreen && sheetState === 'peek' && routeDisplay && (
                  <button
                    onClick={() => setSheetState('half')}
                    className="absolute z-[1000] left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl transition-all active:scale-95 pointer-events-auto"
                    style={{
                      bottom: 8,
                      background: 'rgba(29,78,216,.95)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(96,165,250,.5)',
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 20px rgba(29,78,216,.5)',
                    }}>
                    🗺️ Voir l'itinéraire ↑
                  </button>
                )}
              </div>

              {/* ── BOTTOM SHEET ──────────────────────────── */}
              <div ref={sheetRef} className="sheet-open" style={{
                height: mapFullscreen ? 0 : sheetHeights[sheetState],
                transition: 'height .38s cubic-bezier(.32,.72,0,1)',
                background: 'rgba(8,12,24,.98)',
                backdropFilter: 'blur(28px)',
                borderTop: '1px solid rgba(255,255,255,.1)',
                borderRadius: '22px 22px 0 0',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 -12px 48px rgba(0,0,0,.6)',
                zIndex: 500,
              }}>
                {/* Handle drag */}
                <button
                  onClick={() => setSheetState(s => s === 'peek' ? 'half' : s === 'half' ? 'full' : 'peek')}
                  onTouchStart={onSheetTouchStart}
                  onTouchMove={onSheetTouchMove}
                  onTouchEnd={onSheetTouchEnd}
                  className="flex-shrink-0 w-full flex justify-center items-center pt-4 pb-3"
                  style={{ touchAction: 'none', minHeight: 44 }}>
                  <div style={{ width: 44, height: 4, borderRadius: 3, background: 'rgba(255,255,255,.22)' }} />
                </button>

                {/* Contenu scrollable */}
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                  <Page />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              MOBILE : LINES TAB
          ══════════════════════════════════════════════════ */}
          {isLinesTab && (
            <div className="lg:hidden flex-1 flex overflow-hidden relative">
              {/* Liste */}
              <div className="flex-1 flex flex-col overflow-hidden" style={{ display: linesMapView ? 'none' : 'flex' }}>
                <div className="flex-shrink-0 z-40"
                  style={{ background: 'rgba(10,15,30,.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--c-border)' }}>

                  {/* Mobile header lignes */}
                  <div className="lg:hidden flex items-center px-4 pt-3 pb-2 gap-2">
                    <span className="text-2xl">🚌</span>
                    <span className="text-base font-black text-white">Lignes</span>
                  </div>
                  <OperatorFilter />
                </div>
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                  <LinesPage onShowMap={() => setLinesMapView(true)} />
                </div>
              </div>

              {/* Vue carte ligne */}
              {linesMapView && (
                <div className="flex-1 relative overflow-hidden page-enter-right">
                  <button onClick={() => { setLinesMapView(false); dispatch(clearFocusedLine()); }}
                    className="absolute z-[1000] flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-2xl transition-all active:scale-95"
                    style={{
                      bottom: 90, left: 12,
                      background: 'rgba(8,12,24,.95)', backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255,255,255,.15)',
                      color: 'white', fontSize: 13, fontWeight: 800,
                      boxShadow: '0 8px 32px rgba(0,0,0,.5)',
                    }}>
                    ← Retour
                  </button>
                  <MapView />
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              MOBILE : PAGES PLEIN ÉCRAN (alerts/tickets/profile/journey)
          ══════════════════════════════════════════════════ */}
          {isFullPage && (
            <div className="flex-1 flex flex-col overflow-hidden lg:hidden">

              {/* Header mobile avec nom de la page */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 pt-safe"
                style={{
                  background: 'rgba(8,12,24,.97)',
                  backdropFilter: 'blur(24px)',
                  borderBottom: '1px solid var(--c-border)',
                  minHeight: 56,
                }}>
                <div className="flex items-center gap-3">
                  {activeJourney && journeyPanelOpen ? (
                    <>
                      <button onClick={() => setJourneyPanelOpen(false)}
                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90"
                        style={{ background: 'rgba(255,255,255,.07)', color: '#94a3b8' }}>‹</button>
                      <span className="text-sm font-black text-white">Mon trajet</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                        style={{ background: accentColor + '22', border: `1px solid ${accentColor}30` }}>
                        {TABS.find(t => t.id === activeTab)?.icon}
                      </div>
                      <span className="text-sm font-black text-white">
                        {TABS.find(t => t.id === activeTab)?.label}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Indicateur trajet en cours */}
                  {activeJourney && !journeyPanelOpen && (
                    <button onClick={() => setJourneyPanelOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-black"
                      style={{ background: `${jColor}20`, border: `1px solid ${jColor}40`, color: 'white', minHeight: 40 }}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: jColor, animation: 'live-pulse 2s infinite' }} />
                      <span style={{ color: jColor }}>En cours</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Page content avec transition */}
              <div
                key={`${activeTab}-${transitionKey}`}
                className={`flex-1 overflow-y-auto ${transitionDir === 'right' ? 'page-enter-right' : 'page-enter-left'}`}
                style={{ scrollbarWidth: 'none' }}>
                {journeyPanelOpen ? (
                  <div key="journey-panel" className="animate-fade-up h-full">
                    <ActiveJourneyPage onGoToMap={() => {
                      setJourneyPanelOpen(false);
                      dispatch(setActiveTab('lines'));
                      setLinesMapView(true);
                    }} />
                  </div>
                ) : <Page />}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              DESKTOP LAYOUT COMPLET (lg+)
          ══════════════════════════════════════════════════ */}
          <div className="hidden lg:flex flex-1 overflow-hidden">

            {/* Panel gauche */}
            <aside className={`${isCitymapper ? 'absolute inset-y-0 left-0 z-30' : ''} w-[360px] xl:w-[400px] flex flex-col overflow-hidden`}
              style={{ background: 'var(--c-bg)', borderRight: '1px solid var(--c-border)' }}>

              {!journeyPanelOpen && (
                <div className="flex-shrink-0 z-40"
                  style={{ background: 'rgba(10,15,30,.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--c-border)' }}>
                  <OperatorFilter />
                </div>
              )}

              <div
                key={`desktop-${activeTab}-${transitionKey}`}
                className={`flex-1 overflow-y-auto ${transitionDir === 'right' ? 'page-enter-right' : 'page-enter-left'}`}
                style={{ scrollbarWidth: 'none' }}>
                {journeyPanelOpen ? (
                  <div key="journey-panel-desktop" className="animate-fade-up h-full">
                    <ActiveJourneyPage onGoToMap={() => {
                      setJourneyPanelOpen(false);
                      dispatch(setActiveTab('lines'));
                      setLinesMapView(true);
                    }} />
                  </div>
                ) : <Page />}
              </div>

            </aside>

            {/* Carte desktop — toujours visible à droite du panel */}
            <main className={`flex-1 relative overflow-hidden${isCitymapper ? ' ml-[360px] xl:ml-[400px]' : ''}`}>
              {/* Bouton retour liste — uniquement sur Lignes avec carte ouverte */}
              {isLinesTab && linesMapView && (
                <button onClick={() => { setLinesMapView(false); dispatch(clearFocusedLine()); }}
                  className="absolute z-[1000] flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-2xl transition-all active:scale-95"
                  style={{ bottom: 24, left: 16, background: 'rgba(8,12,24,.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,.15)', color: 'white', fontSize: 13, fontWeight: 800 }}>
                  ← Retour à la liste
                </button>
              )}
              <MapView />
            </main>
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════
            MOBILE BOTTOM TAB BAR
        ══════════════════════════════════════════════════════ */}
        <nav className="lg:hidden flex-shrink-0"
          style={{
            background: 'rgba(6,10,20,.98)',
            backdropFilter: 'blur(28px)',
            borderTop: '1px solid rgba(255,255,255,.08)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            boxShadow: '0 -4px 24px rgba(0,0,0,.4)',
          }}>

          <div className="flex items-stretch" style={{ minHeight: 64 }}>
            {/* Journey shortcut */}
            {activeJourney && (
              <button onClick={() => setJourneyPanelOpen(true)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-all active:scale-90"
                style={{ color: journeyPanelOpen ? jColor : jColor + '90' }}>
                <div className="relative w-10 h-10 flex items-center justify-center rounded-xl"
                  style={{ background: journeyPanelOpen ? jColor + '22' : 'transparent' }}>
                  <span className="text-2xl leading-none">🧭</span>
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                    style={{ background: jColor, borderColor: 'rgba(6,10,20,.98)', animation: 'live-pulse 2s infinite' }} />
                </div>
                <span className="text-[11px] font-bold tracking-wide">Trajet</span>
              </button>
            )}

            {/* Tous les onglets à largeur égale */}
            {TABS.map(tab => {
              const active = activeTab === tab.id && !journeyPanelOpen;
              const badge  = getBadge(tab.id);
              const color  = TAB_COLORS[tab.id];
              return (
                <button key={tab.id}
                  onClick={() => goTab(tab.id)}
                  className="flex-1 flex flex-col items-center justify-center gap-1 py-2 relative transition-all active:scale-90"
                  style={{ color: active ? color : '#6b7280', minWidth: 0 }}>
                  {active && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-full"
                      style={{ background: color }} />
                  )}
                  <div className="relative w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                    style={{ background: active ? color + '20' : 'transparent' }}>
                    <span className="text-2xl leading-none">{tab.icon}</span>
                    {badge !== null && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[11px] font-black flex items-center justify-center"
                        style={{ background: '#dc2626', boxShadow: '0 2px 6px rgba(220,38,38,.5)' }}>
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold leading-tight" style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingInline: 2 }}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

      </div>
    </div>
  );
}
