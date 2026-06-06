import type { Stop } from '@/types';

function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (!q) return 0;
  if (t === q) return 200;
  if (t.startsWith(q)) return 150;
  if (t.includes(q)) return 100;
  // Check acronym match (e.g. "gy" → "Grand Yoff")
  const words = t.split(/[\s\-\/]+/);
  const acronym = words.map(w => w[0] || '').join('');
  if (acronym.startsWith(q)) return 90;
  // Subsequence match
  let qi = 0;
  let score = 0;
  let consecutive = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      qi++;
      consecutive++;
      score += 5 + consecutive * 2;
    } else {
      consecutive = 0;
    }
  }
  return qi === q.length ? score : 0;
}

export function searchStops(
  query: string,
  stops: Stop[],
  userLat?: number,
  userLng?: number,
): Stop[] {
  if (!query.trim()) return [];
  const scored = stops.map(s => {
    const nameScore = fuzzyScore(query, s.name);
    const zoneScore = fuzzyScore(query, s.zone) * 0.5;
    let geoBoost = 0;
    if (userLat != null && userLng != null) {
      const d = Math.sqrt((s.lat - userLat) ** 2 + (s.lng - userLng) ** 2);
      geoBoost = Math.max(0, 20 - d * 500); // closer = higher boost
    }
    return { stop: s, score: Math.max(nameScore, zoneScore) + geoBoost };
  }).filter(x => x.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 8).map(x => x.stop);
}
