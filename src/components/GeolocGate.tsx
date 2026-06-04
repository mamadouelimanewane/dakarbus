import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setUserLocation, setMapCenter } from '@/store/store';

interface Props { onDone: () => void; }

export default function GeolocGate({ onDone }: Props) {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<'asking' | 'denied' | 'error'>('asking');

  useEffect(() => {
    if (!navigator.geolocation) { onDone(); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        dispatch(setUserLocation(loc));
        dispatch(setMapCenter(loc));
        onDone();
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setStatus('denied');
        else setStatus('error');
        setTimeout(onDone, 2000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [dispatch, onDone]);

  if (status === 'asking') return (
    <div className="fixed inset-0 z-[9999] bg-brand-600 flex flex-col items-center justify-center text-white">
      <div className="text-7xl mb-6 animate-bounce">🚌</div>
      <h1 className="text-3xl font-black mb-2">SunuBus</h1>
      <p className="text-blue-200 mb-8">Transport en commun · Dakar 🇸🇳</p>
      <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-6 py-4">
        <span className="text-2xl animate-spin">📍</span>
        <p className="font-medium">Détection de votre position…</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-brand-600 flex flex-col items-center justify-center text-white">
      <div className="text-7xl mb-6">📍</div>
      <p className="font-bold text-lg mb-2">{status === 'denied' ? 'Accès GPS refusé' : 'Erreur de localisation'}</p>
      <p className="text-blue-200 text-sm">Chargement en mode carte générale…</p>
    </div>
  );
}
