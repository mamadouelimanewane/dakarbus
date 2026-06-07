import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { t } from '@/i18n';

const SLIDES = [
  {
    emoji: '🌍',
    titleKey: 'ob1_title' as const,
    textKey:  'ob1_text'  as const,
    bg: 'linear-gradient(160deg,#1e3a8a 0%,#0a0f1e 100%)',
    accent: '#3b82f6',
    features: ['🗺️ Carte temps réel', '🚌 200+ arrêts', '📍 GPS intégré'],
  },
  {
    emoji: '🚀',
    titleKey: 'ob2_title' as const,
    textKey:  'ob2_text'  as const,
    bg: 'linear-gradient(160deg,#7f1d1d 0%,#0a0f1e 100%)',
    accent: '#dc2626',
    features: ['🛤️ Trajet guidé', '💰 Tarif calculé', '🏃 Chemin à pied'],
  },
  {
    emoji: '🎫',
    titleKey: 'ob3_title' as const,
    textKey:  'ob3_text'  as const,
    bg: 'linear-gradient(160deg,#064e3b 0%,#0a0f1e 100%)',
    accent: '#059669',
    features: ['🌊 Wave', '🟠 Orange Money', '⚠️ Signalements'],
  },
];

const LS_KEY = 'sunubus_onboarded_v1';

export default function OnboardingModal() {
  const lang = useAppSelector(s => s.ui.lang);
  const [slide, setSlide] = useState(0);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(LS_KEY)) setVisible(true);
  }, []);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => { setVisible(false); localStorage.setItem(LS_KEY, '1'); }, 350);
  };

  const next = () => {
    if (slide < SLIDES.length - 1) setSlide(s => s + 1);
    else dismiss();
  };

  if (!visible) return null;

  const s = SLIDES[slide];

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{
        background: 'rgba(0,0,0,.75)',
        backdropFilter: 'blur(14px)',
        animation: exiting ? 'fadeOut .35s ease forwards' : 'fadeIn .35s ease both',
      }}>
      <div className="w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-3xl overflow-hidden"
        style={{
          background: s.bg,
          border: `1px solid ${s.accent}30`,
          boxShadow: `0 32px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.06)`,
          animation: exiting ? 'slideDown .35s ease forwards' : 'slideUp .35s ease both',
        }}>

        {/* Skip button */}
        <div className="flex justify-end px-5 pt-5">
          <button onClick={dismiss}
            className="text-xs font-bold px-3 py-1.5 rounded-full transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.5)' }}>
            {t('ob_skip', lang as any)}
          </button>
        </div>

        {/* Emoji hero */}
        <div className="flex justify-center pt-4 pb-6">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
            style={{
              background: `${s.accent}22`,
              border: `2px solid ${s.accent}40`,
              boxShadow: `0 16px 48px ${s.accent}40`,
              animation: 'bounceIn .5s cubic-bezier(.34,1.56,.64,1) both',
            }}>
            {s.emoji}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-4 text-center">
          <h2 className="text-2xl font-black text-white mb-3">{t(s.titleKey, lang as any)}</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,.65)' }}>
            {t(s.textKey, lang as any)}
          </p>
        </div>

        {/* Features */}
        <div className="flex justify-center gap-3 px-6 pb-6 flex-wrap">
          {s.features.map((f, i) => (
            <span key={i} className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: `${s.accent}18`, color: s.accent, border: `1px solid ${s.accent}30` }}>
              {f}
            </span>
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 pb-4">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className="rounded-full transition-all"
              style={{
                width: i === slide ? 24 : 8, height: 8,
                background: i === slide ? s.accent : 'rgba(255,255,255,.2)',
              }} />
          ))}
        </div>

        {/* Action button */}
        <div className="px-5 pb-6">
          <button onClick={next}
            className="w-full py-4 rounded-2xl font-black text-base text-white transition-all active:scale-[.98] hover:brightness-110"
            style={{
              background: `linear-gradient(135deg, ${s.accent}, ${s.accent}cc)`,
              boxShadow: `0 8px 28px ${s.accent}55`,
            }}>
            {slide < SLIDES.length - 1 ? t('next', lang as any) : t('ob_start', lang as any)} →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeOut { from { opacity:1 } to { opacity:0 } }
        @keyframes slideUp { from { transform:translateY(40px); opacity:0 } to { transform:translateY(0); opacity:1 } }
        @keyframes slideDown { from { transform:translateY(0); opacity:1 } to { transform:translateY(40px); opacity:0 } }
        @keyframes bounceIn { from { transform:scale(.5); opacity:0 } to { transform:scale(1); opacity:1 } }
      `}</style>
    </div>
  );
}
