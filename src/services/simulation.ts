import { store, setBusPositions } from '@/store/store';
import { LINES, STOPS } from '@/data/transportData';
import { routeOnRoads } from '@/utils/osrm';
import type { BusPosition, Stop } from '@/types';

// Cache for simulated routes so we don't spam OSRM
const simRouteCache: Record<string, [number, number][]> = {};

// Active simulated buses
let simulatedBuses: {
  id: string;
  lineId: string;
  route: [number, number][];
  currentIndex: number;
  direction: 1 | -1;
  speedMultiplier: number;
}[] = [];

let simInterval: number | null = null;

// Build a simple point-to-point route for simulation
async function buildSimRoute(lineId: string): Promise<[number, number][]> {
  if (simRouteCache[lineId]) return simRouteCache[lineId];
  
  const line = LINES.find(l => l.id === lineId);
  if (!line || line.stops.length < 2) return [];

  const stops = line.stops.map(sid => STOPS.find(s => s.id === sid)).filter(Boolean) as Stop[];
  
  // To keep it light, we just take the first, middle, and last stops and route between them 
  // or just use straight lines if OSRM fails.
  const points = stops.map(s => ({ lat: s.lat, lng: s.lng }));
  const coords = await routeOnRoads(points);
  
  const route = coords || points.map(p => [p.lat, p.lng] as [number, number]);
  
  // Interpolate to have more points for smooth animation
  const interpolated: [number, number][] = [];
  for (let i = 0; i < route.length - 1; i++) {
    const p1 = route[i];
    const p2 = route[i + 1];
    interpolated.push(p1);
    
    // Add 5 intermediate points
    for (let j = 1; j <= 5; j++) {
      interpolated.push([
        p1[0] + (p2[0] - p1[0]) * (j / 6),
        p1[1] + (p2[1] - p1[1]) * (j / 6)
      ]);
    }
  }
  interpolated.push(route[route.length - 1]);
  
  simRouteCache[lineId] = interpolated;
  return interpolated;
}

export async function initSimulation() {
  if (simInterval) return; // Already running
  
  console.log('🚗 Initialisation de la simulation des bus...');

  // Select a few popular lines to simulate
  const linesToSimulate = ['L1A', 'L8', 'BRT-L1', 'TER-01', 'A3'];

  for (const lineId of linesToSimulate) {
    const route = await buildSimRoute(lineId);
    if (route.length > 0) {
      // Add 2 buses per line
      simulatedBuses.push({
        id: `bus_${lineId}_1`,
        lineId,
        route,
        currentIndex: Math.floor(Math.random() * route.length),
        direction: 1,
        speedMultiplier: Math.floor(Math.random() * 2) + 1,
      });
      simulatedBuses.push({
        id: `bus_${lineId}_2`,
        lineId,
        route,
        currentIndex: Math.floor(Math.random() * route.length),
        direction: -1,
        speedMultiplier: Math.floor(Math.random() * 2) + 1,
      });
    }
  }

  // Start loop
  simInterval = window.setInterval(() => {
    const positions: BusPosition[] = simulatedBuses.map(bus => {
      // Move bus
      bus.currentIndex += bus.direction * bus.speedMultiplier;
      
      // Reverse direction if at ends
      if (bus.currentIndex >= bus.route.length - 1) {
        bus.currentIndex = bus.route.length - 1;
        bus.direction = -1;
      } else if (bus.currentIndex <= 0) {
        bus.currentIndex = 0;
        bus.direction = 1;
      }

      const coord = bus.route[bus.currentIndex];
      
      return {
        lineId: bus.lineId,
        lat: coord[0],
        lng: coord[1],
        speed: 40 * bus.speedMultiplier, // Simulated speed
        occupancy: Math.floor(Math.random() * 100),
        timestamp: Date.now()
      };
    });

    // We merge with real drivers if we had a backend. Here we just push to Redux.
    store.dispatch(setBusPositions(positions));
  }, 2000); // Update every 2s
}

export function stopSimulation() {
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
  }
}
