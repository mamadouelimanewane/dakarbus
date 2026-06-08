import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setUserLocation, setMapCenter } from '@/store/store';
import { AdSlot } from '@/components/AdBanner';

interface Props { onDone: () => void; }

export default function GeolocGate({ onDone }: Props) {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<'asking' | 'denied' | 'error'>('asking');
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // Auto-skip after 4s regardless (handles permission dialog blocking)
    const autoSkip = setTimeout(onDone, 4000);

    if (!navigator.geolocation) { clearTimeout(autoSkip); onDone(); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        clearTimeout(autoSkip);
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        dispatch(setUserLocation(loc));
        dispatch(setMapCenter(loc));
        onDone();
      },
      err => {
        clearTimeout(autoSkip);
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
        setTimeout(onDone, 1500);
      },
      { enableHighAccuracy: false, timeout: 3000 }
    );
    return () => clearTimeout(autoSkip);
  }, [dispatch, onDone]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 40% 30%, #1e3a8a 0%, #0a0f1e 65%)' }}>

      {/* Ambient blobs */}
      <div className="absolute w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #2563eb, transparent)', top: '10%', left: '10%', filter: 'blur(60px)', animation: 'blob 8s ease-in-out infinite' }} />
      <div className="absolute w-64 h-64 rounded-full opacity-8 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', bottom: '20%', right: '15%', filter: 'blur(50px)', animation: 'blob 10s ease-in-out infinite reverse' }} />

      {/* Logo */}
      <div className="relative mb-8 animate-fade-up">
        <div className="w-24 h-24 rounded-[28px] flex items-center justify-center text-5xl"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 24px 60px rgba(37,99,235,.5)' }}>
          🚌
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-emerald-500 flex items-center justify-center text-xs font-black"
          style={{ boxShadow: '0 4px 12px rgba(5,150,105,.5)' }}>✓</div>
      </div>

      <h1 className="text-4xl font-black mb-1 gradient-text animate-fade-up" style={{ animationDelay: '.05s' }}>SunuBus</h1>
      <p className="text-slate-400 text-sm mb-6 animate-fade-up" style={{ animationDelay: '.1s' }}>Transport intelligent · Dakar 🇸🇳</p>

      {/* Bannière pub pendant l'attente GPS — style sobre */}
      <div className="w-full max-w-sm mb-6 rounded-xl overflow-hidden animate-fade-up" style={{ animationDelay: '.15s' }}>
        <AdSlot format="banner" context={{}} />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '.2s' }}>
        {status === 'asking' ? (
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl border"
            style={{ background: 'rgba(37,99,235,.1)', borderColor: 'rgba(37,99,235,.3)' }}>
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin-smooth flex-shrink-0" />
            <p className="text-blue-300 font-medium text-sm">
              Détection de votre position{''.padEnd(dots, '.')}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl border"
            style={{ background: 'rgba(245,158,11,.1)', borderColor: 'rgba(245,158,11,.3)' }}>
            <span className="text-amber-400 text-lg">⚠️</span>
            <div>
              <p className="text-amber-300 font-bold text-sm">{status === 'denied' ? 'Accès GPS refusé' : 'GPS indisponible'}</p>
              <p className="text-amber-500/70 text-xs mt-0.5">Chargement en mode général…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
