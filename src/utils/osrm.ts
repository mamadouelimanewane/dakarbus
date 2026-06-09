import type { LatLng } from '@/types';

// LocationIQ key via env — falls back to public OSRM if not set
const LIQ_KEY = import.meta.env.VITE_LOCATIONIQ_KEY as string | undefined;

function buildUrl(profile: 'driving' | 'walking', coordStr: string): string {
  if (LIQ_KEY) {
    return `https://us1.locationiq.com/v1/directions/${profile}/${coordStr}?key=${LIQ_KEY}&overview=full&geometries=geojson&steps=false`;
  }
  return `https://router.project-osrm.org/route/v1/${profile}/${coordStr}?overview=full&geometries=geojson&continue_straight=true`;
}

async function fetchRoute(profile: 'driving' | 'walking', points: LatLng[]): Promise<[number, number][] | null> {
  if (points.length < 2) return null;
  const coordStr = points.map(p => `${p.lng},${p.lat}`).join(';');
  try {
    const res = await fetch(buildUrl(profile, coordStr));
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;
    return data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
  } catch { return null; }
}

/** Driving route along roads */
export async function routeOnRoads(points: LatLng[]): Promise<[number, number][] | null> {
  return fetchRoute('driving', points);
}

/** Walking route — used for the segment from user position to nearest stop */
export async function routeOnFoot(points: LatLng[]): Promise<[number, number][] | null> {
  return fetchRoute('walking', points);
}

/** Chunked driving route for long lines (>20 waypoints) */
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

// ── Cache persistant des tracés de lignes (survit aux rechargements) ──

const LS_KEY = 'sunubus_line_routes_v2';

function loadCache(): Record<string, [number, number][]> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function persistCache(cache: Record<string, [number, number][]>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cache));
  } catch {
    // Quota localStorage dépassé : vider l'ancien cache et réessayer
    try { localStorage.removeItem(LS_KEY); } catch {}
  }
}

export const lineRouteCache: Record<string, [number, number][]> = loadCache();

/** Ajoute un tracé dans le cache mémoire ET le persiste dans localStorage */
export function cacheLineRoute(lineId: string, coords: [number, number][]): void {
  lineRouteCache[lineId] = coords;
  persistCache(lineRouteCache);
}
