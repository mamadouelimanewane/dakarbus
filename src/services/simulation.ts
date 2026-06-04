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
    interpolated.push(p1);
    for (let j = 1; j <= 5; j++) {
      interpolated.push([p1[0] + (p2[0] - p1[0]) * (j / 6), p1[1] + (p2[1] - p1[1]) * (j / 6)]);
    }
  }
  interpolated.push(route[route.length - 1]);
  simRouteCache[lineId] = interpolated;
  return interpolated;
}

export async function initSimulation() {
  if (simInterval) return;
  const linesToSimulate = ['L1A', 'L8', 'BRT-L1', 'TER-01', 'A3'];
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
