import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { loginDriver, loginAdmin } from './store/store';
import PassengerApp from './views/passenger/PassengerApp';
import DriverApp from './views/driver/DriverApp';
import AdminApp from './views/admin/AdminApp';
import { initSimulation } from './services/simulation';

function RoleSelection() {
  const dispatch = useAppDispatch();
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="text-6xl mb-6">🚌</div>
      <h1 className="text-4xl font-black mb-2">SunuBus</h1>
      <p className="text-slate-400 mb-10 text-center">Sélectionnez votre profil de démonstration</p>

      <div className="w-full max-w-sm space-y-4">
        <button className="w-full bg-brand-600 hover:bg-brand-500 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors"
          onClick={() => { /* default is passenger, just reload or set state, actually we dispatch a default passenger? we need a passenger login action */ window.location.reload(); }}>
          <span className="text-2xl">👤</span> Mode Passager
        </button>
        <button className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors"
          onClick={() => dispatch(loginDriver({ name: 'Chauffeur Test', lineId: 'L8' }))}>
          <span className="text-2xl">👨‍✈️</span> Mode Chauffeur
        </button>
        <button className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors"
          onClick={() => dispatch(loginAdmin({ name: 'Admin Test' }))}>
          <span className="text-2xl">🛡️</span> Mode Admin
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { role, isAuthenticated } = useAppSelector(s => s.auth);

  useEffect(() => {
    initSimulation();
  }, []);

  if (!isAuthenticated && role === 'passenger') {
    // Actually our initial state is role='passenger' but isAuthenticated=false. Let's show role selection if not authenticated, unless they click passenger.
    // Let's modify: if role is passenger and not authenticated, we could show the selector, but we want Passenger to be default without login?
    // Let's just use PassengerApp by default, and provide a way to switch.
  }

  // If we want a landing page:
  if (!isAuthenticated) return <RoleSelection />;

  if (role === 'driver') return <DriverApp />;
  if (role === 'admin') return <AdminApp />;
  return <PassengerApp />;
}

