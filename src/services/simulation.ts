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

const simRouteCache: Record<string, [number, number][]> = {};

// ── Filtre basique : exclure les positions en mer autour de Dakar ──
// Polygone simplifié de la presqu'île : points dans le sens des aiguilles
const DAKAR_LAND: [number, number][] = [
  [14.6450, -17.4430], // pointe sud du Plateau
  [14.6650, -17.4550], // côte SO Plateau
  [14.6900, -17.4780], // Mermoz/Fann Résidence
  [14.7100, -17.4950], // Mamelles
  [14.7300, -17.5000], // Ouest Ouakam
  [14.7450, -17.5150], // Almadies pointe
  [14.7600, -17.5050], // Nord Almadies
  [14.7700, -17.4800], // Yoff côte nord
  [14.7700, -17.4400], // Yoff intérieur
  [14.8000, -17.3800], // Guédiawaye nord
  [14.8600, -17.3000], // Limite est
  [14.8600, -17.0500], // AIBD est
  [14.6500, -17.0500], // sud-est
  [14.6450, -17.4430], // retour pointe
];

function pointInPolygon(lat: number, lng: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function isOnLand(lat: number, lng: number): boolean {
  return pointInPolygon(lat, lng, DAKAR_LAND);
}

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
  const stops = line.stops.map(sid => STOPS.find(s => s.id === sid)).filter(Boolean) as Stop[];
  const points = stops.map(s => ({ lat: s.lat, lng: s.lng }));
  const coords = await routeOnRoads(points);
  const route = coords || points.map(p => [p.lat, p.lng] as [number, number]);
  const interpolated: [number, number][] = [];
  for (let i = 0; i < route.length - 1; i++) {
    const p1 = route[i]; const p2 = route[i + 1];
    if (isOnLand(p1[0], p1[1])) interpolated.push(p1);
    for (let j = 1; j <= 5; j++) {
      const pt: [number, number] = [p1[0] + (p2[0] - p1[0]) * (j / 6), p1[1] + (p2[1] - p1[1]) * (j / 6)];
      if (isOnLand(pt[0], pt[1])) interpolated.push(pt);
    }
  }
  const last = route[route.length - 1];
  if (isOnLand(last[0], last[1])) interpolated.push(last);
  // Si trop peu de points valides, garder les stops de départ/arrivée directement
  if (interpolated.length < 2) {
    return points.filter(p => isOnLand(p.lat, p.lng)).map(p => [p.lat, p.lng] as [number, number]);
  }
  simRouteCache[lineId] = interpolated;
  return interpolated;
}

export async function initSimulation() {
  if (simInterval) return;
  // TER-01 exclu : c'est un train qui ne suit pas les routes OSRM
  // → le fallback "ligne droite" traverserait la baie de Hann
  const linesToSimulate = ['L1A', 'L8', 'BRT-L1', 'A3', 'L6'];
  for (const lineId of linesToSimulate) {
    const route = await buildSimRoute(lineId);
    if (route.length > 0) {
      simulatedBuses.push({
        id: `bus_${lineId}_1`, lineId, route,
        currentIndex: Math.floor(Math.random() * route.length),
        direction: 1, speedMultiplier: 1,
      });
      simulatedBuses.push({
        id: `bus_${lineId}_2`, lineId, route,
        currentIndex: Math.floor(Math.random() * route.length),
        direction: -1, speedMultiplier: 2,
      });
    }
  }

  simInterval = setInterval(() => {
    const positions: BusPosition[] = simulatedBuses.map(bus => {
      bus.currentIndex += bus.direction * bus.speedMultiplier;
      if (bus.currentIndex >= bus.route.length - 1) { bus.currentIndex = bus.route.length - 1; bus.direction = -1; }
      else if (bus.currentIndex <= 0) { bus.currentIndex = 0; bus.direction = 1; }
      const coord = bus.route[Math.floor(bus.currentIndex)];
      const driver = MOCK_DRIVERS[bus.id];
      return {
        busId: bus.id,
        lineId: bus.lineId,
        lat: coord[0],
        lng: coord[1],
        speed: Math.round(35 + bus.speedMultiplier * 8 + Math.random() * 10),
        occupancy: Math.floor(Math.random() * 100),
        driverId: driver?.id,
        timestamp: Date.now(),
      };
    });
    store.dispatch(setBusPositions(positions));
  }, 2000);
}

export function stopSimulation() {
  if (simInterval) { clearInterval(simInterval); simInterval = null; }
  simulatedBuses = [];
}
