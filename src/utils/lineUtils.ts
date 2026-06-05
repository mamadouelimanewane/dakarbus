import type { Stop, Line } from '@/types';
import { STOPS, LINES, OPERATORS } from '@/data/transportData';

// Average urban bus speed in Dakar: ~22 km/h = ~367 m/min
const BUS_MPS = 367;

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface StopTiming {
  stop: Stop;
  index: number;         // 1-based
  cumMin: number;        // cumulative minutes from terminus
  distFromPrev: number;  // meters from previous stop
  isTerminus: boolean;
}

/** Build ordered stop list with cumulative travel times for a line */
export function buildStopTimings(line: Line): StopTiming[] {
  const stops = line.stops.map(id => STOPS.find(s => s.id === id)).filter(Boolean) as Stop[];
  let cum = 0;
  return stops.map((stop, i) => {
    let dist = 0;
    if (i > 0) {
      dist = haversineM(stops[i - 1].lat, stops[i - 1].lng, stop.lat, stop.lng);
      cum += Math.ceil(dist / BUS_MPS);
    }
    return {
      stop, index: i + 1, cumMin: cum,
      distFromPrev: Math.round(dist),
      isTerminus: i === 0 || i === stops.length - 1,
    };
  });
}

/** Find all lines that serve a given stop */
export function linesServingStop(stopId: string): Line[] {
  const stop = STOPS.find(s => s.id === stopId);
  if (!stop) return [];
  return LINES.filter(l => stop.lines.includes(l.id));
}

/** Inverse search: given a stop name query, find lines passing through matching stops */
export function searchLinesByStop(query: string): { line: Line; matchedStop: Stop }[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: { line: Line; matchedStop: Stop }[] = [];
  const seen = new Set<string>();
  for (const stop of STOPS) {
    if (!stop.name.toLowerCase().includes(q) && !stop.zone.toLowerCase().includes(q)) continue;
    for (const lineId of stop.lines) {
      const key = `${lineId}-${stop.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const line = LINES.find(l => l.id === lineId);
      if (line) results.push({ line, matchedStop: stop });
    }
  }
  return results.sort((a, b) => a.line.operator.localeCompare(b.line.operator));
}

/** Bearing in degrees between two lat/lng points (for arrow direction) */
export function bearing(p1: [number, number], p2: [number, number]): number {
  const dy = p2[0] - p1[0];
  const dx = p2[1] - p1[1];
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

/** Sample points along a route for direction arrow placement */
export function sampleArrowPoints(
  coords: [number, number][],
  count = 4
): { lat: number; lng: number; deg: number }[] {
  if (coords.length < 2) return [];
  const step = Math.max(1, Math.floor(coords.length / (count + 1)));
  const arrows: { lat: number; lng: number; deg: number }[] = [];
  for (let i = step; i < coords.length - 1; i += step) {
    const p1 = coords[i - 1], p2 = coords[i + 1] ?? coords[i];
    arrows.push({ lat: coords[i][0], lng: coords[i][1], deg: bearing(p1, p2) });
    if (arrows.length >= count) break;
  }
  return arrows;
}
