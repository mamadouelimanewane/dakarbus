// ══════════════════════════════════════════════════════════════
//  Moteur de recherche hybride — Local + LocationIQ AI autocomplete
//  Comprend : fuzzy local, synonymes, détection d'intention, géo-boost
// ══════════════════════════════════════════════════════════════
import { DAKAR_PLACES, CATEGORY_META, type DakarPlace, type PlaceCategory } from '@/data/dakarPlaces';
import { STOPS } from '@/data/transportData';
import type { Stop } from '@/types';

const LIQ_KEY = import.meta.env.VITE_LOCATIONIQ_KEY as string | undefined;

export interface SearchResult {
  type: 'stop' | 'place' | 'ai';
  stop?: Stop;
  place?: DakarPlace;
  // Pour les résultats AI (LocationIQ)
  aiName?: string;
  aiLat?: number;
  aiLng?: number;
  aiType?: string;
  nearestStop?: Stop;
  walkMin?: number;
  score: number;
  categoryEmoji?: string;
  categoryLabel?: string;
  categoryColor?: string;
}

// ── Détection d'intention par mots-clés ──────────────────────
const INTENT_KEYWORDS: Record<PlaceCategory, string[]> = {
  santé:          ['hôpital','hopital','clinique','médecin','docteur','urgence','pharmacie','soin','santé','sante'],
  marché:         ['marché','marche','market','boutique','achat','shopping'],
  éducation:      ['école','ecole','lycée','lycee','université','universite','campus','étude','etude','formation'],
  culte:          ['mosquée','mosquee','église','eglise','prière','priere','cathédrale','cathedrale'],
  plage:          ['plage','mer','ocean','baignade','natation','plage','sable'],
  monument:       ['monument','tourisme','touristique','visite','patrimoine','musée','musee'],
  hôtel:          ['hôtel','hotel','hébergement','hebergement','chambre','nuit','résidence','residence'],
  transport:      ['gare','aéroport','aeroport','station','terminal','bus','taxi'],
  administration: ['mairie','préfecture','prefecture','ambassade','ministère','ministere','officiel'],
  commerce:       ['supermarché','supermarche','mall','centre commercial','magasin'],
  sport:          ['stade','sport','football','basket','match'],
  culture:        ['théâtre','theatre','musée','musee','cinéma','cinema','concert','expo'],
  restauration:   ['restaurant','resto','manger','repas','nourriture'],
  finance:        ['banque','bank','argent','transfert','wave','orange money','atm'],
  quartier:       [],
};

function detectIntent(query: string): PlaceCategory | null {
  const q = query.toLowerCase();
  for (const [cat, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some(k => q.includes(k))) return cat as PlaceCategory;
  }
  return null;
}

// ── Score fuzzy local ─────────────────────────────────────────
function localScore(query: string, place: DakarPlace): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  const texts = [place.name, ...place.aliases, ...(place.keywords || []), place.commune || ''].map(t => t.toLowerCase());
  let best = 0;

  for (const t of texts) {
    if (t === q) { best = Math.max(best, 300); continue; }
    if (t.startsWith(q)) { best = Math.max(best, 200); continue; }
    if (t.includes(q)) { best = Math.max(best, 150); continue; }

    // Acronyme : "ucad" → "Université Cheikh Anta Diop"
    const words = t.split(/[\s\-\/()]+/);
    const acronym = words.map(w => w[0] || '').join('');
    if (acronym.includes(q)) { best = Math.max(best, 120); continue; }

    // Subsequence matching
    let qi = 0, score = 0, consecutive = 0;
    for (let i = 0; i < t.length && qi < q.length; i++) {
      if (t[i] === q[qi]) { qi++; consecutive++; score += 5 + consecutive * 2; }
      else { consecutive = 0; }
    }
    if (qi === q.length) best = Math.max(best, score);
  }

  return best;
}

function stopScore(query: string, stop: Stop): number {
  const q = query.toLowerCase().trim();
  const texts = [stop.name, stop.zone].map(t => t.toLowerCase());
  let best = 0;
  for (const t of texts) {
    if (t === q) best = Math.max(best, 300);
    else if (t.startsWith(q)) best = Math.max(best, 200);
    else if (t.includes(q)) best = Math.max(best, 150);
    else {
      let qi = 0, score = 0, consec = 0;
      for (let i = 0; i < t.length && qi < q.length; i++) {
        if (t[i] === q[qi]) { qi++; consec++; score += 5 + consec * 2; }
        else consec = 0;
      }
      if (qi === q.length) best = Math.max(best, score);
    }
  }
  return best;
}

// ── Distance géographique ─────────────────────────────────────
function geoBoost(lat: number, lng: number, userLat?: number, userLng?: number): number {
  if (userLat == null || userLng == null) return 0;
  const d = Math.sqrt((lat - userLat) ** 2 + (lng - userLng) ** 2);
  return Math.max(0, 25 - d * 600);
}

function nearestStop(lat: number, lng: number): { stop: Stop; walkMin: number } | null {
  let best: Stop | null = null;
  let bestD = Infinity;
  for (const s of STOPS) {
    const d = Math.sqrt((s.lat - lat) ** 2 + (s.lng - lng) ** 2);
    if (d < bestD) { bestD = d; best = s; }
  }
  if (!best) return null;
  const meters = bestD * 111000;
  return { stop: best, walkMin: Math.ceil(meters / 72) };
}

// ── Recherche locale ──────────────────────────────────────────
export function searchLocal(
  query: string,
  userLat?: number,
  userLng?: number,
  maxResults = 5,
): SearchResult[] {
  const intent = detectIntent(query);
  const results: SearchResult[] = [];

  // 1. Arrêts de bus
  for (const stop of STOPS) {
    const sc = stopScore(query, stop);
    if (sc > 0) {
      results.push({
        type: 'stop', stop,
        score: sc + geoBoost(stop.lat, stop.lng, userLat, userLng),
        categoryEmoji: '🚏', categoryLabel: 'Arrêt de bus', categoryColor: '#2563eb',
      });
    }
  }

  // 2. Lieux Dakar
  for (const place of DAKAR_PLACES) {
    let sc = localScore(query, place);
    if (sc === 0) continue;

    // Boost si la catégorie correspond à l'intention détectée
    if (intent && place.category === intent) sc += 50;

    // Boost géographique
    sc += geoBoost(place.lat, place.lng, userLat, userLng);

    const ns = nearestStop(place.lat, place.lng);
    const meta = CATEGORY_META[place.category];
    results.push({
      type: 'place', place,
      nearestStop: ns?.stop,
      walkMin: ns?.walkMin,
      score: sc,
      categoryEmoji: meta.emoji,
      categoryLabel: meta.label,
      categoryColor: meta.color,
    });
  }

  results.sort((a, b) => b.score - a.score);
  // Déduplique par nom similaire
  const seen = new Set<string>();
  return results.filter(r => {
    const key = (r.stop?.name || r.place?.name || '').toLowerCase().slice(0, 12);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, maxResults);
}

// ── LocationIQ AI Autocomplete ─────────────────────────────────
export interface LocationIQResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: Record<string, string>;
}

export async function searchLocationIQ(query: string): Promise<SearchResult[]> {
  if (!LIQ_KEY || !query.trim() || query.length < 2) return [];
  try {
    const url = `https://api.locationiq.com/v1/autocomplete?key=${LIQ_KEY}&q=${encodeURIComponent(query)}&limit=5&countrycodes=sn&dedupe=1&normalizecity=1&lang=fr`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return [];
    const data: LocationIQResult[] = await res.json();
    return data.map((item, i) => {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);
      const ns  = nearestStop(lat, lng);
      // Clean up display_name: keep first 2 parts max
      const parts = item.display_name.split(',');
      const shortName = parts.slice(0, 2).join(',').trim();
      return {
        type: 'ai' as const,
        aiName: shortName,
        aiLat: lat,
        aiLng: lng,
        aiType: item.type,
        nearestStop: ns?.stop,
        walkMin: ns?.walkMin,
        score: 80 - i * 5,
        categoryEmoji: '🌍',
        categoryLabel: 'Résultat IA',
        categoryColor: '#7c3aed',
      };
    });
  } catch {
    return [];
  }
}

// ── Suggestions contextuelle (sans requête) ───────────────────
export function getContextualSuggestions(
  favStopIds: string[],
  userLat?: number,
  userLng?: number,
): SearchResult[] {
  const results: SearchResult[] = [];

  // Arrêts favoris
  for (const id of favStopIds.slice(0, 3)) {
    const stop = STOPS.find(s => s.id === id);
    if (stop) results.push({ type:'stop', stop, score: 200, categoryEmoji:'⭐', categoryLabel:'Favori', categoryColor:'#f59e0b' });
  }

  // Lieux proches si GPS disponible
  if (userLat != null && userLng != null) {
    const nearby = DAKAR_PLACES
      .map(p => ({ p, d: Math.sqrt((p.lat - userLat) ** 2 + (p.lng - userLng) ** 2) }))
      .filter(x => x.d < 0.08)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
    for (const { p } of nearby) {
      const ns   = nearestStop(p.lat, p.lng);
      const meta = CATEGORY_META[p.category];
      results.push({ type:'place', place:p, nearestStop:ns?.stop, walkMin:ns?.walkMin, score:180, categoryEmoji:meta.emoji, categoryLabel:'À proximité', categoryColor:meta.color });
    }
  }

  return results.slice(0, 5);
}
