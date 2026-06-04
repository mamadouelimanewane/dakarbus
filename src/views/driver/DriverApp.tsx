import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/store';

export default function DriverApp() {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<'idle' | 'driving'>('idle');
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);

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
              Trafic
            </button>
            <button 
              onClick={() => { setScanMode(true); setScanResult(null); }}
              className="col-span-2 bg-brand-600 hover:bg-brand-500 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-colors"
            >
              <span className="text-2xl">📷</span>
              Scanner un M-Ticket
            </button>
          </div>
        )}

        {/* Modal Scanner */}
        {scanMode && (
          <div className="fixed inset-0 z-[100] bg-slate-900/95 flex flex-col items-center justify-center p-6">
            <h2 className="text-white text-xl font-black mb-8">Scanner le Billet</h2>
            
            <div className="relative w-64 h-64 border-2 border-brand-500 rounded-3xl overflow-hidden mb-8">
              <div className="absolute inset-0 bg-brand-500/20 animate-pulse"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-400 shadow-[0_0_10px_#3b82f6] animate-[scan_2s_ease-in-out_infinite_alternate]"></div>
            </div>
            
            <style>{`@keyframes scan { from { top: 0; } to { top: 100%; } }`}</style>
            
            {scanResult === 'success' && (
              <div className="bg-green-500 text-white px-6 py-3 rounded-xl font-black text-lg animate-bounce">
                ✅ Billet Valide
              </div>
            )}
            
            {scanResult === 'error' && (
              <div className="bg-red-500 text-white px-6 py-3 rounded-xl font-black text-lg animate-bounce">
                ❌ Billet Invalide / Déjà utilisé
              </div>
            )}
            
            {!scanResult && (
              <div className="flex gap-4">
                <button onClick={() => setScanResult('success')} className="bg-slate-800 text-green-400 px-4 py-2 rounded-lg font-bold border border-green-500/30">Simuler Valide</button>
                <button onClick={() => setScanResult('error')} className="bg-slate-800 text-red-400 px-4 py-2 rounded-lg font-bold border border-red-500/30">Simuler Invalide</button>
              </div>
            )}
            
            <button 
              onClick={() => setScanMode(false)}
              className="mt-8 bg-slate-800 text-slate-300 px-6 py-3 rounded-xl font-bold"
            >
              Fermer
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
