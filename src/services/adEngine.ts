/**
 * adEngine.ts — Moteur de sélection et de tracking publicitaire SunuBus.
 *
 * Fonctionnalités :
 *  - Sélection d'annonces selon ciblage (heure, zone, ligne, opérateur)
 *  - Frequency capping par session (localStorage)
 *  - Rotation prioritaire (priority + round-robin)
 *  - Tracking impressions / clics → Redux store
 *  - Calcul du revenu généré (CPM)
 */

import { AD_CAMPAIGNS } from '@/data/ads';
import type { AdCampaign, AdFormat } from '@/data/ads';
import { store } from '@/store/store';
import { recordImpression, recordClick } from '@/store/store';

// ── Contexte de sélection ────────────────────────────────────────
export interface AdContext {
  format:    AdFormat;
  zone?:     string;          // zone de l'arrêt affiché
  lineId?:   string;          // ligne en contexte
  operator?: string;          // opérateur en contexte
}

// ── Frequency cap (session) ─────────────────────────────────────
const SESSION_KEY = 'sunubus_ad_freq';

function getFreqMap(): Record<string, number> {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}'); }
  catch { return {}; }
}
function bumpFreq(id: string) {
  const m = getFreqMap();
  m[id] = (m[id] || 0) + 1;
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(m)); } catch {}
}
function getFreq(id: string): number { return getFreqMap()[id] || 0; }

// ── Éligibilité ──────────────────────────────────────────────────
function isEligible(ad: AdCampaign, ctx: AdContext): boolean {
  if (ad.status !== 'active') return false;
  if (ad.format !== ctx.format) return false;

  const now = Date.now();
  if (now < ad.startDate || now > ad.endDate) return false;

  // Budget épuisé ?
  const impressionsDone = store.getState().ads.impressions[ad.id] || 0;
  if (impressionsDone >= ad.maxImpressions) return false;

  // Frequency cap session
  if (getFreq(ad.id) >= ad.freqCap) return false;

  const t = ad.targeting;
  const h = new Date().getHours();

  if (t.hours && (h < t.hours[0] || h > t.hours[1])) return false;
  if (t.days  && !t.days.includes(new Date().getDay())) return false;
  if (t.zones && ctx.zone && t.zones.length > 0) {
    if (!t.zones.some(z => ctx.zone?.toLowerCase().includes(z.toLowerCase()))) return false;
  }
  if (t.lines && ctx.lineId && t.lines.length > 0) {
    if (!t.lines.includes(ctx.lineId)) return false;
  }
  if (t.operators && ctx.operator && t.operators.length > 0) {
    if (!t.operators.includes(ctx.operator as any)) return false;
  }

  return true;
}

// ── Sélection ────────────────────────────────────────────────────
// Round-robin par priorité : renvoie l'annonce suivante éligible
let _rrCursor: Record<string, number> = {};

export function selectAd(ctx: AdContext): AdCampaign | null {
  const eligible = AD_CAMPAIGNS
    .filter(ad => isEligible(ad, ctx))
    .sort((a, b) => a.priority - b.priority);

  if (eligible.length === 0) return null;

  // Grouper par priorité, choisir dans le groupe le plus prioritaire
  const topPriority = eligible[0].priority;
  const top = eligible.filter(a => a.priority === topPriority);

  const key = `${ctx.format}_${topPriority}`;
  const idx = (_rrCursor[key] || 0) % top.length;
  _rrCursor[key] = idx + 1;

  return top[idx];
}

// ── Tracking ─────────────────────────────────────────────────────
export function trackImpression(ad: AdCampaign) {
  bumpFreq(ad.id);
  store.dispatch(recordImpression(ad.id));
}

export function trackClick(ad: AdCampaign) {
  store.dispatch(recordClick(ad.id));
  // Ouvre le CTA
  try { window.open(ad.ctaUrl, '_blank', 'noopener,noreferrer'); } catch {}
}

// ── Utilitaires ──────────────────────────────────────────────────
export function getAdStats(id: string) {
  const state = store.getState().ads;
  const impr  = state.impressions[id] || 0;
  const clks  = state.clicks[id]      || 0;
  const ctr   = impr > 0 ? ((clks / impr) * 100).toFixed(1) : '0.0';
  const ad    = AD_CAMPAIGNS.find(a => a.id === id);
  const rev   = ad ? Math.round((impr / 1000) * ad.cpmFcfa) : 0;
  return { impr, clks, ctr, rev };
}

export function getTotalAdRevenue(): number {
  const state = store.getState().ads;
  return AD_CAMPAIGNS.reduce((sum, ad) => {
    const impr = state.impressions[ad.id] || 0;
    return sum + Math.round((impr / 1000) * ad.cpmFcfa);
  }, 0);
}

export function getTotalImpressions(): number {
  return Object.values(store.getState().ads.impressions).reduce((s, v) => s + v, 0);
}

export function getTotalClicks(): number {
  return Object.values(store.getState().ads.clicks).reduce((s, v) => s + v, 0);
}
