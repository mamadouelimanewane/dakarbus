import { store, setBusPositions } from '@/store/store';
import { LINES, STOPS } from '@/data/transportData';
import { routeOnRoads } from '@/utils/osrm';
import type { BusPosition, Stop } from '@/types';

export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  plate: string;
  operator: string;
  lineId: string;
}

export const MOCK_DRIVERS: Record<string, DriverInfo> = {
  'bus_L1A_1': { id: 'd01', name: 'Modou Diallo',    phone: '+221 77 123 45 67', plate: 'DK-2341-AA', operator: 'DDD',  lineId: 'L1A' },
  'bus_L1A_2': { id: 'd02', name: 'Ibrahima Sow',    phone: '+221 76 234 56 78', plate: 'DK-4892-BB', operator: 'DDD',  lineId: 'L1A' },
  'bus_L8_1':  { id: 'd03', name: 'Ousmane Ndiaye',  phone: '+221 70 345 67 89', plate: 'DK-7731-CC', operator: 'DDD',  lineId: 'L8'  },
  'bus_L8_2':  { id: 'd04', name: 'Mamadou Fall',    phone: '+221 77 456 78 90', plate: 'DK-3342-DD', operator: 'DDD',  lineId: 'L8'  },
  'bus_BRT-L1_1': { id: 'd05', name: 'Aliou Gaye',   phone: '+221 78 567 89 01', plate: 'DK-9901-EE', operator: 'BRT',  lineId: 'BRT-L1' },
  'bus_BRT-L1_2': { id: 'd06', name: 'Cheikh Ba',    phone: '+221 76 678 90 12', plate: 'DK-1123-FF', operator: 'BRT',  lineId: 'BRT-L1' },
  'bus_TER-01_1': { id: 'd07', name: 'Abdou Sy',     phone: '+221 70 789 01 23', plate: 'TER-2024-01', operator: 'TER', lineId: 'TER-01' },
  'bus_TER-01_2': { id: 'd08', name: 'Lamine Diouf', phone: '+221 77 890 12 34', plate: 'TER-2024-02', operator: 'TER', lineId: 'TER-01' },
  'bus_A3_1':  { id: 'd09', name: 'Pape Mbaye',      phone: '+221 76 901 23 45', plate: 'DK-5521-GG', operator: 'AFTU', lineId: 'A3' },
  'bus_A3_2':  { id: 'd10', name: 'Serigne Touba',   phone: '+221 78 012 34 56', plate: 'DK-8834-HH', operator: 'AFTU', lineId: 'A3' },
};

// ══════════════════════════════════════════════════════════════
//  POLYGONE TERRE — presqu'île de Dakar + continent
//  Défini en [lat, lng], sens horaire depuis la pointe sud
//  Inclut l'exclusion de la baie de Hann (rentrant côté est)
// ══════════════════════════════════════════════════════════════
const DAKAR_LAND: [number, number][] = [
  // Pointe du Cap Manuel (sud)
  [14.6430, -17.4270],
  [14.6480, -17.4380],
  [14.6550, -17.4490],
  [14.6650, -17.4560],
  // Côte ouest — Plateau / Corniche
  [14.6750, -17.4580],
  [14.6850, -17.4650],
  [14.6950, -17.4720],
  // Mamelles / Fann
  [14.7050, -17.4850],
  [14.7150, -17.4920],
  [14.7220, -17.4960],
  // Ouakam
  [14.7300, -17.5020],
  [14.7380, -17.5050],
  // Almadies (pointe extrême ouest)
  [14.7450, -17.5160],
  [14.7520, -17.5120],
  [14.7580, -17.5030],
  // Côte nord — Ngor / Yoff
  [14.7620, -17.4950],
  [14.7670, -17.4850],
  [14.7700, -17.4750],
  [14.7730, -17.4620],
  [14.7750, -17.4500],
  // Parcelles / Cambérène
  [14.7750, -17.4300],
  [14.7780, -17.4150],
  [14.7820, -17.4050],
  // Daroukhane
  [14.7900, -17.3950],
  [14.7950, -17.3850],
  // Guédiawaye nord
  [14.8050, -17.3750],
  [14.8150, -17.3550],
  [14.8250, -17.3300],
  // Malika / limite nord-est
  [14.8350, -17.3100],
  [14.8500, -17.2800],
  // ── Virage sud-est : évite la mer au nord ──
  [14.8600, -17.2500],
  [14.8600, -17.1500],
  [14.8600, -17.0500],
  // AIBD / Sébikotane — limite est lointaine
  [14.7500, -17.0400],
  [14.6500, -17.0400],
  // ── Baie de Hann : rentrant côté est de Dakar ──
  // On remonte vers le nord en longeant la baie (exclu de la terre)
  // Pour le PiP, on trace la côte réelle de la baie
  [14.6500, -17.1800],
  [14.6600, -17.2200],
  [14.6700, -17.2600],
  [14.6800, -17.3000],
  // Pointe de Bel-Air (separates baie de Hann from mer)
  [14.7050, -17.3650],
  [14.7100, -17.3800],
  [14.7150, -17.3950],
  [14.7180, -17.4050],
  // Retour vers Hann / Zone Industrielle
  [14.7220, -17.4100],
  [14.7250, -17.4150],
  // Corniche Est / Plateau est
  [14.7100, -17.4250],
  [14.6900, -17.4300],
  [14.6700, -17.4280],
  [14.6550, -17.4300],
  [14.6450, -17.4270],
];

// ── Point-in-polygon (ray casting) ────────────────────────────
function pointInPolygon(lat: number, lng: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const latI = poly[i][0], lngI = poly[i][1];
    const latJ = poly[j][0], lngJ = poly[j][1];
    const intersect = ((lngI > lng) !== (lngJ > lng)) &&
      (lat < (latJ - latI) * (lng - lngI) / (lngJ - lngI) + latI);
    if (intersect) inside = !inside;
  }
  return inside;
}

// ── Bounding box rapide pour rejeter les points loin de Dakar ─
const BBOX = {
  latMin: 14.62, latMax: 14.87,
  lngMin: -17.52, lngMax: -17.04,
};

export function isOnLand(lat: number, lng: number): boolean {
  // Rejet rapide hors bounding box
  if (lat < BBOX.latMin || lat > BBOX.latMax || lng < BBOX.lngMin || lng > BBOX.lngMax) return false;
  return pointInPolygon(lat, lng, DAKAR_LAND);
}

// ══════════════════════════════════════════════════════════════
//  SIMULATION
// ══════════════════════════════════════════════════════════════
const simRouteCache: Record<string, [number, number][]> = {};

// Dernière position terrestre connue par bus (filet de sécurité)
const lastValidPos: Record<string, [number, number]> = {};

let simulatedBuses: {
  id: string;
  lineId: string;
  route: [number, number][];
  currentIndex: number;
  direction: 1 | -1;
  speedMultiplier: number;
}[] = [];

let simInterval: ReturnType<typeof setInterval> | null = null;

async function buildSimRoute(lineId: string): Promise<[number, number][]> {
  if (simRouteCache[lineId]) return simRouteCache[lineId];
  const line = LINES.find(l => l.id === lineId);
  if (!line || line.stops.length < 2) return [];

  const stops = line.stops
    .map(sid => STOPS.find(s => s.id === sid))
    .filter(Boolean) as Stop[];

  // Filtrer les stops eux-mêmes en mer (sécurité données)
  const landStops = stops.filter(s => isOnLand(s.lat, s.lng));
  if (landStops.length < 2) return [];

  const points = landStops.map(s => ({ lat: s.lat, lng: s.lng }));

  // Essai OSRM (route sur routes réelles)
  const coords = await routeOnRoads(points);
  const rawRoute = coords || points.map(p => [p.lat, p.lng] as [number, number]);

  // Filtrage strict : on ne garde QUE les points sur terre
  // + interpolation dense pour éviter les sauts
  const landRoute: [number, number][] = [];
  for (let i = 0; i < rawRoute.length - 1; i++) {
    const p1 = rawRoute[i];
    const p2 = rawRoute[i + 1];
    if (isOnLand(p1[0], p1[1])) landRoute.push(p1);
    // 10 points interpolés entre chaque paire
    for (let j = 1; j <= 10; j++) {
      const t = j / 11;
      const pt: [number, number] = [
        p1[0] + (p2[0] - p1[0]) * t,
        p1[1] + (p2[1] - p1[1]) * t,
      ];
      if (isOnLand(pt[0], pt[1])) landRoute.push(pt);
    }
  }
  const last = rawRoute[rawRoute.length - 1];
  if (isOnLand(last[0], last[1])) landRoute.push(last);

  // Fallback ultime : positions brutes des stops (toutes validées)
  const result = landRoute.length >= 2 ? landRoute : points.map(p => [p.lat, p.lng] as [number, number]);
  simRouteCache[lineId] = result;
  return result;
}

export async function initSimulation() {
  if (simInterval) return;
  // TER-01 exclu : train — fallback ligne droite traverserait la baie de Hann
  const linesToSimulate = ['L1A', 'L8', 'BRT-L1', 'A3', 'L6'];

  for (const lineId of linesToSimulate) {
    const route = await buildSimRoute(lineId);
    if (route.length < 2) continue;
    for (const suffix of ['_1', '_2'] as const) {
      const id = `bus_${lineId}${suffix}`;
      const startIdx = Math.floor(Math.random() * route.length);
      simulatedBuses.push({
        id, lineId, route,
        currentIndex: startIdx,
        direction: suffix === '_1' ? 1 : -1,
        speedMultiplier: suffix === '_1' ? 1 : 2,
      });
      // Initialise la dernière position valide
      lastValidPos[id] = route[startIdx];
    }
  }

  simInterval = setInterval(() => {
    const positions: BusPosition[] = simulatedBuses.map(bus => {
      // Avance le bus
      bus.currentIndex += bus.direction * bus.speedMultiplier;
      if (bus.currentIndex >= bus.route.length - 1) {
        bus.currentIndex = bus.route.length - 1;
        bus.direction = -1;
      } else if (bus.currentIndex <= 0) {
        bus.currentIndex = 0;
        bus.direction = 1;
      }

      const coord = bus.route[Math.floor(bus.currentIndex)];

      // ── Filet de sécurité : si le point est en mer, on utilise
      //    la dernière position valide connue ───────────────────
      let lat: number;
      let lng: number;
      if (coord && isOnLand(coord[0], coord[1])) {
        lat = coord[0];
        lng = coord[1];
        lastValidPos[bus.id] = [lat, lng];
      } else {
        // Fallback : cherche le point valide le plus proche dans la route
        const fallback = findNearestLandPoint(bus.route, bus.currentIndex) ?? lastValidPos[bus.id];
        lat = fallback?.[0] ?? bus.route[0][0];
        lng = fallback?.[1] ?? bus.route[0][1];
        // Avance l'index vers un point valide
        bus.currentIndex = Math.min(bus.route.length - 1, bus.currentIndex + bus.direction);
      }

      const driver = MOCK_DRIVERS[bus.id];
      return {
        busId: bus.id,
        lineId: bus.lineId,
        lat,
        lng,
        speed: Math.round(30 + bus.speedMultiplier * 8 + Math.random() * 15),
        occupancy: Math.floor(Math.random() * 100),
        driverId: driver?.id,
        timestamp: Date.now(),
      };
    });

    // Dernier rempart : filtre global avant dispatch
    const safePositions = positions.filter(p => isOnLand(p.lat, p.lng));
    store.dispatch(setBusPositions(safePositions));
  }, 2000);
}

// Cherche le point terrestre le plus proche dans la route autour de l'index actuel
function findNearestLandPoint(
  route: [number, number][],
  fromIndex: number,
): [number, number] | null {
  for (let radius = 1; radius < 30; radius++) {
    for (const delta of [radius, -radius]) {
      const idx = Math.max(0, Math.min(route.length - 1, fromIndex + delta));
      if (isOnLand(route[idx][0], route[idx][1])) return route[idx];
    }
  }
  return null;
}

export function stopSimulation() {
  if (simInterval) { clearInterval(simInterval); simInterval = null; }
  simulatedBuses = [];
}
