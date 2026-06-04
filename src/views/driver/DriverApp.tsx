import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/store';

export default function DriverApp() {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<'idle' | 'driving'>('idle');
  const [location, setLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (status === 'driving' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setLocation([pos.coords.latitude, pos.coords.longitude]),
        console.error,
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [status]);

  return (
    <div className="h-screen w-screen bg-slate-900 text-slate-200 flex flex-col font-sans">
      <header className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
        <div>
          <h1 className="text-xl font-black text-white">SunuBus Chauffeur</h1>
          <p className="text-xs text-brand-400">Mode Conduite</p>
        </div>
        <button 
          onClick={() => dispatch(logout())}
          className="bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold"
        >
          Déconnexion
        </button>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-6">
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 text-center">
          <div className="text-4xl mb-4">{status === 'driving' ? '🚌' : '☕'}</div>
          <h2 className="text-lg font-bold text-white mb-2">
            {status === 'driving' ? 'En service' : 'En pause'}
          </h2>
          {status === 'driving' && location && (
            <p className="text-xs text-slate-400 font-mono mb-4">
              GPS: {location[0].toFixed(4)}, {location[1].toFixed(4)}
            </p>
          )}
          <button
            onClick={() => setStatus(s => s === 'driving' ? 'idle' : 'driving')}
            className={`w-full py-3 rounded-xl font-black text-white uppercase tracking-widest transition-all ${
              status === 'driving' ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'
            }`}
          >
            {status === 'driving' ? 'Terminer le service' : 'Démarrer le service'}
          </button>
        </div>

        {status === 'driving' && (
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-orange-500/20 text-orange-400 border border-orange-500/30 p-4 rounded-xl font-bold flex flex-col items-center gap-2 hover:bg-orange-500/30">
              <span className="text-2xl">🚧</span>
              Signaler Trafic
            </button>
            <button className="bg-red-500/20 text-red-400 border border-red-500/30 p-4 rounded-xl font-bold flex flex-col items-center gap-2 hover:bg-red-500/30">
              <span className="text-2xl">🚨</span>
              Urgence
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
