import { STOPS } from '@/data/transportData';
import type { Stop } from '@/types';

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearestStop(lat: number, lng: number): { stop: Stop; distanceMeters: number } | null {
  let nearest: Stop | null = null;
  let minDist = Infinity;
  for (const stop of STOPS) {
    const d = haversineMeters(lat, lng, stop.lat, stop.lng);
    if (d < minDist) { minDist = d; nearest = stop; }
  }
  return nearest ? { stop: nearest, distanceMeters: Math.round(minDist) } : null;
}

// Walking speed ~1.2 m/s = 72 m/min
export function walkingMinutes(meters: number): number {
  return Math.max(1, Math.ceil(meters / 72));
}

// Distance between two stops in meters
export function stopDistance(a: Stop, b: Stop): number {
  return haversineMeters(a.lat, a.lng, b.lat, b.lng);
}
