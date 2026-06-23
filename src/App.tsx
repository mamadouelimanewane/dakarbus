import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { setRouteOrigin, setRouteDestination } from './store/store';
import { STOPS } from './data/transportData';
import { parseRouteFromURL } from './utils/share';
import PassengerApp from './views/passenger/PassengerApp';
import DriverApp from './views/driver/DriverApp';
import AdminApp from './views/admin/AdminApp';
import FleetManagerApp from './views/fleet/FleetManagerApp';
import { initSimulation } from './services/simulation';
import RoleSelection from './components/auth/RoleSelection';
import SplashScreen from './components/SplashScreen';

/* ── App Root ─────────────────────────────────────────────── */
export default function App() {
  const dispatch = useAppDispatch();
  const { role, isAuthenticated } = useAppSelector(s => s.auth);
  const { darkMode, theme } = useAppSelector(s => s.ui);
  const fleetOp = useAppSelector(s => s.fleet.operator);
  
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('sb_splash_shown');
  });

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme ?? (darkMode ? 'dark' : 'light'));
  }, [theme, darkMode]);

  useEffect(() => {
    initSimulation();
    // Handle deep-link share ?from=xxx&to=yyy
    const { from, to } = parseRouteFromURL();
    if (from || to) {
      if (from) { const s = STOPS.find(x => x.id === from); if (s) dispatch(setRouteOrigin(s)); }
      if (to)   { const s = STOPS.find(x => x.id === to);   if (s) dispatch(setRouteDestination(s)); }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [dispatch]);

  if (showSplash) {
    return (
      <SplashScreen
        onDone={() => {
          sessionStorage.setItem('sb_splash_shown', '1');
          setShowSplash(false);
        }}
      />
    );
  }

  // Gestionnaire de flotte — ne requiert pas isAuthenticated classique
  if (fleetOp) return <FleetManagerApp operator={fleetOp} />;

  if (!isAuthenticated) return <RoleSelection />;
  if (role === 'driver')  return <DriverApp />;
  if (role === 'admin')   return <AdminApp />;
  return <PassengerApp />;
}
