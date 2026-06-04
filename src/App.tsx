import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { loginPassenger, loginDriver, loginAdmin } from './store/store';
import PassengerApp from './views/passenger/PassengerApp';
import DriverApp from './views/driver/DriverApp';
import AdminApp from './views/admin/AdminApp';
import { initSimulation } from './services/simulation';

function RoleSelection() {
  const dispatch = useAppDispatch();
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="text-7xl mb-6 animate-bounce">🚌</div>
      <h1 className="text-4xl font-black mb-1 tracking-tight">DakarBus</h1>
      <p className="text-brand-400 font-bold mb-2">SunuBus v5.0 · Dakar 🇸🇳</p>
      <p className="text-slate-400 mb-10 text-center text-sm">Sélectionnez votre profil</p>

      <div className="w-full max-w-sm space-y-4">
        <button
          className="w-full bg-brand-600 hover:bg-brand-500 text-white p-5 rounded-2xl font-bold flex items-center gap-4 transition-all hover:scale-[1.02] shadow-lg shadow-brand-500/30"
          onClick={() => dispatch(loginPassenger())}
        >
          <span className="text-3xl">👤</span>
          <div className="text-left">
            <div className="font-black">Mode Passager</div>
            <div className="text-xs text-blue-200 font-normal">Planifier, voir les lignes, alertes</div>
          </div>
        </button>

        <button
          className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 p-5 rounded-2xl font-bold flex items-center gap-4 transition-all hover:scale-[1.02]"
          onClick={() => dispatch(loginDriver({ name: 'Chauffeur Test', lineId: 'L8' }))}
        >
          <span className="text-3xl">👨‍✈️</span>
          <div className="text-left">
            <div className="font-black">Mode Chauffeur</div>
            <div className="text-xs text-slate-400 font-normal">GPS, signalement, service en cours</div>
          </div>
        </button>

        <button
          className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 p-5 rounded-2xl font-bold flex items-center gap-4 transition-all hover:scale-[1.02]"
          onClick={() => dispatch(loginAdmin({ name: 'Admin' }))}
        >
          <span className="text-3xl">🛡️</span>
          <div className="text-left">
            <div className="font-black">Mode Admin</div>
            <div className="text-xs text-slate-400 font-normal">Supervision, gestion flotte, alertes</div>
          </div>
        </button>
      </div>

      <p className="text-slate-600 text-xs mt-10">v5.0 — Simulation locale active</p>
    </div>
  );
}

export default function App() {
  const { role, isAuthenticated } = useAppSelector(s => s.auth);

  useEffect(() => {
    initSimulation();
  }, []);

  if (!isAuthenticated) return <RoleSelection />;
  if (role === 'driver') return <DriverApp />;
  if (role === 'admin') return <AdminApp />;
  return <PassengerApp />;
}
