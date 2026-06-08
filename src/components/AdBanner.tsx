/**
 * AdBanner.tsx — Composants d'affichage publicitaire SunuBus
 *
 * Exports :
 *  · AdBanner       — Bandeau horizontal (format 'banner')
 *  · AdCard         — Card native insérée dans les listes (format 'card')
 *  · AdInterstitial — Plein écran temporisé (format 'interstitial')
 *  · AdSlot         — Sélectionne et affiche automatiquement la bonne pub
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { selectAd, trackImpression, trackClick } from '@/services/adEngine';
import type { AdCampaign, AdFormat } from '@/data/ads';
import type { AdContext } from '@/services/adEngine';

// ── Props communes ───────────────────────────────────────────────
interface AdProps {
  ad: AdCampaign;
  onClose?: () => void;
}

// ── AdBanner ─────────────────────────────────────────────────────
// Bandeau discret pleine largeur — fond neutre, pas de barre colorée
export function AdBanner({ ad, onClose }: AdProps) {
  const fired = useRef(false);
  useEffect(() => {
    if (!fired.current) { trackImpression(ad); fired.current = true; }
  }, [ad]);

  return (
    <div className="relative overflow-hidden select-none"
      style={{
        background: 'rgba(255,255,255,.03)',
        borderTop:    '1px solid rgba(255,255,255,.06)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}>

      <div className="flex items-center gap-3 px-4 py-2">
        {/* Sponsorisé label — visible en premier */}
        <span className="text-[11px] font-semibold flex-shrink-0 px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(255,255,255,.06)', color: '#475569' }}>
          Pub
        </span>

        {/* Logo petit */}
        <span className="text-base flex-shrink-0 leading-none opacity-80">{ad.logo}</span>

        {/* Copy compact */}
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-semibold text-white leading-tight truncate">{ad.title}</span>
        </div>

        {/* CTA sobre */}
        <button
          onClick={() => trackClick(ad)}
          className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all active:scale-90"
          style={{ background: `${ad.accentColor}18`, color: ad.accentColor, border: `1px solid ${ad.accentColor}25` }}>
          {ad.ctaLabel}
        </button>

        {/* Dismiss toujours visible */}
        <button onClick={onClose ?? (() => {})}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all active:scale-90"
          style={{ background: 'rgba(255,255,255,.05)', color: '#475569' }}>
          ✕
        </button>
      </div>
    </div>
  );
}

// ── AdCard ────────────────────────────────────────────────────────
// Card native discrète — identifiable clairement comme publicité,
// sans fond flashy, CTA sobre, toujours fermable
export function AdCard({ ad, onClose }: AdProps) {
  const [dismissed, setDismissed] = useState(false);
  const fired = useRef(false);
  useEffect(() => {
    if (!fired.current) { trackImpression(ad); fired.current = true; }
  }, [ad]);

  if (dismissed) return null;
  const handleClose = () => { if (onClose) onClose(); else setDismissed(true); };

  return (
    <div className="rounded-xl overflow-hidden relative select-none"
      style={{
        background: 'var(--c-surface)',
        border: '1px solid rgba(255,255,255,.07)',
      }}>
      {/* Header : label "Pub" bien visible + fermeture */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(255,255,255,.06)', color: '#475569' }}>
          Publicité
        </span>
        <span className="text-sm leading-none opacity-75">{ad.logo}</span>
        <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: '#64748b' }}>{ad.advertiser}</span>
        <button onClick={handleClose}
          className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
          style={{ background: 'rgba(255,255,255,.05)', color: '#475569' }}>
          ✕
        </button>
      </div>

      {/* Body compact */}
      <div className="px-3 pb-3">
        <p className="text-xs font-semibold text-white mb-1 leading-snug">{ad.title}</p>
        <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: '#64748b' }}>{ad.body}</p>

        <button
          onClick={() => trackClick(ad)}
          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
          style={{
            background: `${ad.accentColor}15`,
            color: ad.accentColor,
            border: `1px solid ${ad.accentColor}25`,
          }}>
          {ad.ctaLabel} →
        </button>
      </div>
    </div>
  );
}

// ── AdInterstitial ────────────────────────────────────────────────
// Plein écran avec countdown (5s avant possibilité de fermer)
export function AdInterstitial({ ad, onClose }: AdProps) {
  const [countdown, setCountdown] = useState(5);
  const fired = useRef(false);

  useEffect(() => {
    if (!fired.current) { trackImpression(ad); fired.current = true; }
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [ad]);

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(16px)' }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden animate-fade-up"
        style={{
          background: `linear-gradient(160deg, var(--c-surface) 0%, ${ad.bgColor} 100%)`,
          border: `1px solid ${ad.accentColor}40`,
          boxShadow: `0 32px 80px ${ad.accentColor}30`,
        }}>
        {/* Countdown badge */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="text-[10px] font-semibold" style={{ color: '#334155' }}>Publicité</div>
          {countdown > 0 ? (
            <div className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,.08)', color: '#64748b' }}>
              Fermer dans {countdown}s
            </div>
          ) : (
            <button onClick={onClose}
              className="text-[10px] font-black px-2 py-0.5 rounded-full transition-all active:scale-90"
              style={{ background: `${ad.accentColor}20`, color: ad.accentColor }}>
              ✕ Fermer
            </button>
          )}
        </div>

        {/* Ad content */}
        <div className="px-5 pb-6 text-center">
          <div className="text-6xl mb-4 mt-2">{ad.logo}</div>
          <div className="text-[11px] font-black mb-1" style={{ color: ad.accentColor }}>{ad.advertiser}</div>
          <h2 className="text-xl font-black text-white mb-2">{ad.title}</h2>
          <p className="text-sm leading-relaxed mb-5" style={{ color: '#94a3b8' }}>{ad.body}</p>

          <button
            onClick={() => trackClick(ad)}
            className="w-full py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${ad.accentColor}dd, ${ad.accentColor})`,
              color: '#fff',
              boxShadow: `0 8px 28px ${ad.accentColor}50`,
            }}>
            {ad.ctaLabel}
          </button>

          <button onClick={onClose}
            className="mt-3 w-full py-2.5 text-xs font-semibold"
            style={{ color: '#334155' }}>
            {countdown > 0 ? `Ignorer dans ${countdown}s` : 'Ignorer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AdSlot ────────────────────────────────────────────────────────
// Composant intelligent : sélectionne la pub et gère le cycle de vie
interface AdSlotProps {
  context: Omit<AdContext, 'format'>;
  format:  AdFormat;
  className?: string;
}

export function AdSlot({ context, format, className }: AdSlotProps) {
  const [ad, setAd]           = useState<AdCampaign | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const selected = selectAd({ ...context, format });
    setAd(selected);
    setDismissed(false);
  }, [format, context.zone, context.lineId, context.operator]);

  const dismiss = useCallback(() => setDismissed(true), []);

  if (!ad || dismissed) return null;

  return (
    <div className={className}>
      {format === 'banner'       && <AdBanner      ad={ad} onClose={dismiss} />}
      {format === 'card'         && <AdCard        ad={ad} onClose={dismiss} />}
      {format === 'interstitial' && <AdInterstitial ad={ad} onClose={dismiss} />}
    </div>
  );
}

// ── Hook useAdSlot ────────────────────────────────────────────────
// Utile pour contrôler finement l'affichage d'un interstitiel
export function useAdSlot(context: AdContext): {
  ad:      AdCampaign | null;
  dismiss: () => void;
  refresh: () => void;
} {
  const [ad, setAd]         = useState<AdCampaign | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const refresh = useCallback(() => {
    setDismissed(false);
    setAd(selectAd(context));
  }, [context.format, context.zone, context.lineId]);

  useEffect(() => { refresh(); }, []);

  return {
    ad:      dismissed ? null : ad,
    dismiss: () => setDismissed(true),
    refresh,
  };
}
