/**
 * BFS multi-options route finder
 * Returns up to 3 ranked route options between two stops
 */
import { STOPS, LINES } from '@/data/transportData';
import type { Stop, Line, OperatorId } from '@/types';

const WALK_MPM     = 72;   // m/min walking (~4.3 km/h)
const BUS_MPM      = 330;  // m/min bus (~20 km/h urban Dakar)
const TRANSFER_PEN = 5;    // minutes wait at transfer stop

function hav(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Minutes to travel between two stops on a given line */
function rideMinutes(line: Line, fromId: string, toId: string): number {
  const stops = line.stops.map(id => STOPS.find(s => s.id === id)).filter(Boolean) as Stop[];
  const iA = stops.findIndex(s => s.id === fromId);
  const iB = stops.findIndex(s => s.id === toId);
  if (iA < 0 || iB < 0) return 999;
  const [lo, hi] = iA < iB ? [iA, iB] : [iB, iA];
  let dist = 0;
  for (let i = lo; i < hi; i++) {
    dist += hav(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng);
  }
  return Math.max(2, Math.ceil(dist / BUS_MPM));
}

export interface RouteStep {
  type: 'walk' | 'bus' | 'transfer';
  label: string;
  color: string;
  durationMin: number;
  lineId?: string;
  lineColor?: string;
}

export interface RouteOption {
  id: string;
  kind: 'direct' | 'transfer1' | 'transfer2';
  label: string;
  labelColor: string;
  totalMin: number;
  fare: number;
  transfers: number;
  walkMin: number;
  walkMeters: number;
  steps: RouteStep[];
  score: number;
  operator: OperatorId;
  primaryLineId: string;
  primaryLineName: string;
  primaryLineColor: string;
  walkingStop: Stop;
}

export function findRoutes(
  origin: Stop,
  dest: Stop,
  userLat?: number,
  userLng?: number
): RouteOption[] {
  if (origin.id === dest.id) return [];

  const walkMeters = userLat != null
    ? Math.round(hav(userLat, userLng!, origin.lat, origin.lng))
    : 0;
  const walkMin = walkMeters > 80 ? Math.ceil(walkMeters / WALK_MPM) : 0;

  const options: RouteOption[] = [];
  const seen = new Set<string>();

  // ── PHASE 1: Direct ──────────────────────────────────────────
  for (const lineId of origin.lines) {
    if (!dest.lines.includes(lineId)) continue;
    const line = LINES.find(l => l.id === lineId);
    if (!line) continue;
    const ride = rideMinutes(line, origin.id, dest.id);
    if (ride >= 999) continue;

    const steps: RouteStep[] = [];
    if (walkMin > 0) steps.push({ type: 'walk', label: `${walkMin} min à pied → ${origin.name}`, color: '#059669', durationMin: walkMin });
    steps.push({ type: 'bus', label: `${line.name}  ·  ${origin.name} → ${dest.name}`, color: line.color, durationMin: ride, lineId: line.id, lineColor: line.color });

    options.push({
      id: `d-${lineId}`,
      kind: 'direct',
      label: 'Direct', labelColor: '#059669',
      totalMin: walkMin + ride,
      fare: line.tarif,
      transfers: 0,
      walkMin, walkMeters,
      steps,
      score: walkMin + ride,
      operator: line.operator,
      primaryLineId: line.id,
      primaryLineName: line.name,
      primaryLineColor: line.color,
      walkingStop: origin,
    });
  }

  // ── PHASE 2: 1 transfer ───────────────────────────────────────
  for (const oId of origin.lines) {
    const oLine = LINES.find(l => l.id === oId);
    if (!oLine) continue;

    for (const midStopId of oLine.stops) {
      if (midStopId === origin.id) continue;
      const mid = STOPS.find(s => s.id === midStopId);
      if (!mid) continue;

      for (const dId of mid.lines) {
        if (dId === oId) continue;
        if (!dest.lines.includes(dId)) continue;
        const dLine = LINES.find(l => l.id === dId);
        if (!dLine) continue;

        const seg1 = rideMinutes(oLine, origin.id, midStopId);
        const seg2 = rideMinutes(dLine, midStopId, dest.id);
        if (seg1 >= 60 || seg2 >= 60) continue;

        const key = `${oId}|${midStopId}|${dId}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const steps: RouteStep[] = [];
        if (walkMin > 0) steps.push({ type: 'walk', label: `${walkMin} min à pied → ${origin.name}`, color: '#059669', durationMin: walkMin });
        steps.push({ type: 'bus',      label: `${oLine.name}  ·  → ${mid.name}`,  color: oLine.color, durationMin: seg1, lineId: oLine.id, lineColor: oLine.color });
        steps.push({ type: 'transfer', label: `Correspondance à ${mid.name}`,       color: '#475569',   durationMin: TRANSFER_PEN });
        steps.push({ type: 'bus',      label: `${dLine.name}  ·  → ${dest.name}`, color: dLine.color, durationMin: seg2, lineId: dLine.id, lineColor: dLine.color });

        options.push({
          id: key,
          kind: 'transfer1',
          label: '1 corresp.', labelColor: '#d97706',
          totalMin: walkMin + seg1 + TRANSFER_PEN + seg2,
          fare: oLine.tarif + dLine.tarif,
          transfers: 1,
          walkMin, walkMeters,
          steps,
          score: walkMin + seg1 + TRANSFER_PEN + seg2 + 7,
          operator: oLine.operator,
          primaryLineId: oLine.id,
          primaryLineName: oLine.name,
          primaryLineColor: oLine.color,
          walkingStop: origin,
        });

        if (options.filter(o => o.kind === 'transfer1').length >= 4) break;
      }
      if (options.filter(o => o.kind === 'transfer1').length >= 4) break;
    }
    if (options.filter(o => o.kind === 'transfer1').length >= 4) break;
  }

  if (options.length === 0) return [];

  // ── Rank & label ──────────────────────────────────────────────
  options.sort((a, b) => a.score - b.score);

  // Deduplicate by primaryLineId + transfers
  const deduped = options.filter((o, i, arr) =>
    arr.findIndex(x => x.primaryLineId === o.primaryLineId && x.transfers === o.transfers) === i
  );

  const top3 = deduped.slice(0, 3);

  // Assign labels
  if (top3[0]) { top3[0].label = top3[0].transfers === 0 ? '⭐ Direct' : '⭐ Recommandé'; top3[0].labelColor = '#f59e0b'; }
  if (top3[1]) {
    if (top3[1].fare < top3[0].fare) { top3[1].label = '💸 Moins cher'; top3[1].labelColor = '#34d399'; }
    else if (top3[1].totalMin < top3[0].totalMin + 5) { top3[1].label = '⚡ Rapide'; top3[1].labelColor = '#60a5fa'; }
    else { top3[1].label = top3[1].transfers === 0 ? 'Alternatif direct' : 'Alternative'; top3[1].labelColor = '#94a3b8'; }
  }
  if (top3[2]) {
    if (top3[2].walkMin < top3[0].walkMin) { top3[2].label = '🚶 Moins de marche'; top3[2].labelColor = '#a78bfa'; }
    else { top3[2].label = 'Option 3'; top3[2].labelColor = '#475569'; }
  }

  return top3;
}
