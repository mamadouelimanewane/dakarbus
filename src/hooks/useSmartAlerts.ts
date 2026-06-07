import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import { STOPS } from '@/data/transportData';

/**
 * Hook — Alertes intelligentes
 * 1. Surveille les trajets récurrents : prévient 15 min avant l'heure programmée
 * 2. Surveille les incidents alertes : notifie les nouvelles alertes réseau
 */
export function useSmartAlerts() {
  const { recurringTrips } = useAppSelector(s => s.gamif);
  const { notifEnabled } = useAppSelector(s => s.ui);
  const { reports } = useAppSelector(s => s.tickets);
  const knownReports = useRef<Set<string>>(new Set(reports.map(r => r.id)));

  // ── Recurring trip reminders ─────────────────────────────────
  useEffect(() => {
    if (!notifEnabled || !('Notification' in window) || Notification.permission !== 'granted') return;
    if (recurringTrips.length === 0) return;

    const check = () => {
      const now  = new Date();
      const day  = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Lun
      const mins = now.getHours() * 60 + now.getMinutes();

      recurringTrips.forEach(trip => {
        if (!trip.days.includes(day)) return;
        const tripMins = trip.hour * 60 + trip.minute;
        // Prévenir à J-15 min et J-5 min
        const diff = tripMins - mins;
        if (diff === 15 || diff === 5) {
          const origin = STOPS.find(s => s.id === trip.originId);
          const dest   = STOPS.find(s => s.id === trip.destId);
          try {
            new Notification(`🚌 Départ dans ${diff} min — SunuBus`, {
              body: `${origin?.name || trip.originId} → ${dest?.name || trip.destId}\nPartez maintenant pour ne pas manquer votre bus !`,
              icon: '/icon-192.png',
              badge: '/favicon.svg',
              tag: `trip-${trip.id}-${diff}`,
            });
          } catch {}
        }
      });
    };

    // Check every minute, aligned to minute boundaries
    const ms = (60 - new Date().getSeconds()) * 1000;
    const t1 = setTimeout(() => {
      check();
      const interval = setInterval(check, 60_000);
      return () => clearInterval(interval);
    }, ms);
    return () => clearTimeout(t1);
  }, [recurringTrips, notifEnabled]);

  // ── New alert notifications ──────────────────────────────────
  useEffect(() => {
    if (!notifEnabled || !('Notification' in window) || Notification.permission !== 'granted') return;
    const newReports = reports.filter(r => !knownReports.current.has(r.id));
    newReports.forEach(r => {
      const typeLabel = r.type === 'delay' ? 'Bouchon / Retard' : r.type === 'accident' ? 'Accident' : 'Forte affluence';
      try {
        new Notification(`⚠️ ${typeLabel} — SunuBus`, {
          body: r.description.slice(0, 100),
          icon: '/icon-192.png',
          tag: `alert-${r.id}`,
        });
      } catch {}
      knownReports.current.add(r.id);
    });
  }, [reports, notifEnabled]);
}
