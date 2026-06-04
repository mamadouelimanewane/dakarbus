import type { LatLng } from '@/types';

const OSRM = 'https://router.project-osrm.org/route/v1/driving';

export async function routeOnRoads(points: LatLng[]): Promise<[number, number][] | null> {
  if (points.length < 2) return null;
  const coords = points.map(p => `${p.lng},${p.lat}`).join(';');
  try {
    const res = await fetch(`${OSRM}/${coords}?overview=full&geometries=geojson&continue_straight=true`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;
    return data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
  } catch { return null; }
}

export async function routeLine(stops: LatLng[]): Promise<[number, number][] | null> {
  if (stops.length < 2) return null;
  const all: [number, number][] = [];
  const chunk = 20;
  for (let i = 0; i < stops.length - 1; i += chunk - 1) {
    const slice = stops.slice(i, i + chunk);
    const coords = await routeOnRoads(slice);
    if (coords) { if (all.length > 0) all.pop(); all.push(...coords); }
    else slice.forEach(s => all.push([s.lat, s.lng]));
  }
  return all.length > 1 ? all : null;
}

export const lineRouteCache: Record<string, [number, number][]> = {};
