import React, { useState, useEffect, useRef } from 'react';

export type PaymentProvider = 'wave' | 'orange' | 'free';

export interface PaymentConfig {
  amount: number;          // FCFA
  label: string;           // "Billet DDD" or "Pass Mensuel"
  emoji: string;
  onSuccess: (method: string, ref: string) => void;
  onCancel: () => void;
}

interface ProviderInfo {
  id: PaymentProvider;
  name: string;
  emoji: string;
  color: string;
  secondaryColor: string;
  gradient: string;
  bgLight: string;
  phonePrefix: string;
  logo: string;
  tagline: string;
}

const PROVIDERS: ProviderInfo[] = [
  {
    id: 'wave',
    name: 'Wave',
    emoji: '🌊',
    color: '#00b4d8',
    secondaryColor: '#0077b6',
    gradient: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
    bgLight: 'rgba(0, 180, 216, 0.1)',
    phonePrefix: '77',
    logo: '〜',
    tagline: 'Paiement ultra-rapide',
  },
  {
    id: 'orange',
    name: 'Orange Money',
    emoji: '🟠',
    color: '#ff6b00',
    secondaryColor: '#c2410c',
    gradient: 'linear-gradient(135deg, #ff6b00 0%, #c2410c 100%)',
    bgLight: 'rgba(255, 107, 0, 0.1)',
    phonePrefix: '76',
    logo: '◉',
    tagline: 'Paiement sécurisé',
  },
  {
    id: 'free',
    name: 'Free Money',
    emoji: '💜',
    color: '#7c3aed',
    secondaryColor: '#4c1d95',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
    bgLight: 'rgba(124, 58, 237, 0.1)',
    phonePrefix: '70',
    logo: '★',
    tagline: 'Instantané & sans frais',
  },
];

type Step = 'choose' | 'phone' | 'pin' | 'processing' | 'success' | 'receipt';

function generateRef() {
  return 'SB' + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).slice(2, 5).toUpperCase();
}

// ── Animated wave ripple background ──────────────────────────
function WaveBackground({ color }: { color: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', pointerEvents: 'none' }}>
      <style>{`
        @keyframes wave-ripple {
          0%   { transform: scale(0.6); opacity: 0.25; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
      {[0, 0.6, 1.2].map((delay, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 160,
          height: 160,
          borderRadius: '50%',
          border: `2px solid ${color}`,
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          animation: `wave-ripple 3s ${delay}s ease-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ── PIN input ─────────────────────────────────────────────────
function PinInput({ onChange }: { onChange: (pin: string) => void }) {
  const [pin, setPin] = useState('');
  const digits = [1,2,3,4,5,6,7,8,9,'',0,'⌫'];

  const press = (d: any) => {
    if (d === '⌫') {
      const next = pin.slice(0, -1);
      setPin(next);
      onChange(next);
    } else if (typeof d === 'number' && pin.length < 4) {
      const next = pin + d;
      setPin(next);
      onChange(next);
    }
  };

  return (
    <div>
      {/* PIN dots */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 18, height: 18, borderRadius: '50%',
            background: i < pin.length ? '#ffffff' : 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.4)',
            transition: 'all 0.2s',
            transform: i < pin.length ? 'scale(1.2)' : 'scale(1)',
          }} />
        ))}
      </div>

      {/* Keypad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {digits.map((d, i) => (
          <button
            key={i}
            onClick={() => press(d)}
            disabled={d === ''}
            style={{
              height: 56,
              borderRadius: 14,
              background: d === '⌫'
                ? 'rgba(220, 38, 38, 0.2)'
                : d === ''
                ? 'transparent'
                : 'rgba(255,255,255,0.12)',
              border: d === '⌫' ? '1px solid rgba(220,38,38,0.3)' : 'none',
              color: 'white',
              fontSize: d === '⌫' ? 18 : 22,
              fontWeight: 700,
              cursor: d === '' ? 'default' : 'pointer',
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => { if (d !== '') (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.22)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = d === '⌫' ? 'rgba(220,38,38,0.2)' : d === '' ? 'transparent' : 'rgba(255,255,255,0.12)'; }}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Processing spinner ────────────────────────────────────────
function ProcessingView({ provider }: { provider: ProviderInfo }) {
  const [dotCount, setDotCount] = useState(1);
  const [message, setMessage] = useState('Connexion au serveur');
  const messages = [
    'Connexion au serveur',
    'Vérification du compte',
    'Débitement en cours',
    'Confirmation sécurisée',
    'Génération du ticket',
  ];

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      if (i < messages.length) setMessage(messages[i]);
      setDotCount(d => d % 3 + 1);
    }, 480);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '32px 0', position: 'relative' }}>
      <WaveBackground color={provider.color} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: provider.gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto 24px',
          boxShadow: `0 0 40px ${provider.color}60`,
          animation: 'processing-spin 2s linear infinite',
        }}>
          {provider.emoji}
        </div>
        <style>{`
          @keyframes processing-spin {
            0%   { box-shadow: 0 0 40px ${provider.color}60; }
            50%  { box-shadow: 0 0 70px ${provider.color}90; }
            100% { box-shadow: 0 0 40px ${provider.color}60; }
          }
        `}</style>
        <p style={{ color: 'white', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
          {message}{''.padEnd(dotCount, '.')}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
          Ne fermez pas cette fenêtre
        </p>
      </div>
    </div>
  );
}

// ── Success view ──────────────────────────────────────────────
function SuccessView({ provider, amount, ref: txRef, label, onShowReceipt }: {
  provider: ProviderInfo;
  amount: number;
  ref?: string;
  label: string;
  onShowReceipt: () => void;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <style>{`
        @keyframes success-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          70%  { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes check-draw {
          0%   { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
      <div style={{
        width: 90, height: 90, borderRadius: '50%',
        background: 'linear-gradient(135deg, #059669, #10b981)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
        boxShadow: '0 0 50px rgba(5,150,105,0.5)',
        animation: show ? 'success-pop 0.6s ease-out forwards' : 'none',
        opacity: 0,
      }}>
        <svg width="44" height="44" viewBox="0 0 44 44">
          <polyline
            points="8,22 18,32 36,12"
            fill="none" stroke="white" strokeWidth="4"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="100" strokeDashoffset="100"
            style={{ animation: show ? 'check-draw 0.5s 0.4s ease-out forwards' : 'none' }}
          />
        </svg>
      </div>

      <h3 style={{ color: 'white', fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Paiement Réussi !</h3>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 20 }}>
        via {provider.name}
      </p>

      <div style={{
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '16px 20px',
        marginBottom: 20,
        border: '1px solid rgba(255,255,255,0.12)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Montant</span>
          <span style={{ color: 'white', fontWeight: 900, fontSize: 16 }}>
            {amount.toLocaleString('fr-FR')} FCFA
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Référence</span>
          <span style={{ color: provider.color, fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>
            {txRef}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Produit</span>
          <span style={{ color: 'white', fontSize: 13 }}>{label}</span>
        </div>
      </div>

      <button
        onClick={onShowReceipt}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 14,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'white',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
      >
        📄 Voir le reçu numérique
      </button>
    </div>
  );
}

// ── Digital Receipt ───────────────────────────────────────────
function ReceiptView({ provider, amount, txRef, label, emoji, onClose }: {
  provider: ProviderInfo;
  amount: number;
  txRef: string;
  label: string;
  emoji: string;
  onClose: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const handlePrint = () => {
    const content = receiptRef.current?.innerHTML;
    const w = window.open('', '_blank', 'width=400,height=600');
    if (w && content) {
      w.document.write(`
        <html><head><title>Reçu SunuBus - ${txRef}</title>
        <style>
          body { font-family: monospace; padding: 20px; background: white; color: black; }
          * { box-sizing: border-box; }
        </style></head>
        <body>${content}</body></html>
      `);
      w.document.close();
      w.print();
    }
  };

  return (
    <div>
      <div ref={receiptRef} style={{
        background: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
        fontFamily: 'monospace',
      }}>
        {/* Header band */}
        <div style={{ background: provider.gradient, padding: '16px 20px', textAlign: 'center' }}>
          <div style={{ color: 'white', fontSize: 28, marginBottom: 4 }}>🚌</div>
          <div style={{ color: 'white', fontWeight: 900, fontSize: 16 }}>SunuBus</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>REÇU DE PAIEMENT</div>
        </div>

        {/* Perforated edge */}
        <div style={{
          height: 16, background: `repeating-linear-gradient(90deg, #f1f5f9 0px, #f1f5f9 10px, white 10px, white 20px)`,
          borderTop: `2px dashed #e2e8f0`,
        }} />

        {/* Body */}
        <div style={{ padding: '16px 20px', background: '#f8fafc' }}>
          {/* Product */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>{emoji}</div>
            <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 15 }}>{label}</div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px dashed #cbd5e1', margin: '12px 0' }} />

          {/* Details */}
          {[
            { l: 'Référence', v: txRef, bold: true, color: provider.color },
            { l: 'Montant',   v: `${amount.toLocaleString('fr-FR')} FCFA`, bold: true, color: '#0f172a' },
            { l: 'Méthode',   v: provider.name,   bold: false, color: '#334155' },
            { l: 'Date',      v: dateStr,          bold: false, color: '#334155' },
            { l: 'Heure',     v: timeStr,          bold: false, color: '#334155' },
            { l: 'Statut',    v: '✓ PAYÉ',         bold: true, color: '#059669' },
          ].map(({ l, v, bold, color }) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: 12 }}>{l}</span>
              <span style={{ fontWeight: bold ? 900 : 600, color, fontSize: 13 }}>{v}</span>
            </div>
          ))}

          <div style={{ borderTop: '1px dashed #cbd5e1', margin: '12px 0' }} />

          {/* Footer note */}
          <p style={{ textAlign: 'center', fontSize: 10, color: '#94a3b8', lineHeight: 1.5 }}>
            Ce reçu est votre preuve de paiement.{'\n'}
            Conservez-le pour tout recours.{'\n'}
            SunuBus SARL — Dakar, Sénégal
          </p>
        </div>

        {/* Bottom perforated edge */}
        <div style={{
          height: 16,
          background: `repeating-linear-gradient(90deg, #f1f5f9 0px, #f1f5f9 10px, white 10px, white 20px)`,
          borderBottom: `2px dashed #e2e8f0`,
        }} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handlePrint}
          style={{
            flex: 1, padding: '14px', borderRadius: 14,
            background: provider.gradient,
            border: 'none', color: 'white', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          🖨️ Imprimer / Sauvegarder
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '14px 18px', borderRadius: 14,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Main PaymentModal ─────────────────────────────────────────
export default function PaymentModal({ amount, label, emoji, onSuccess, onCancel }: PaymentConfig) {
  const [step, setStep] = useState<Step>('choose');
  const [provider, setProvider] = useState<ProviderInfo>(PROVIDERS[0]);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [txRef, setTxRef] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleChooseProvider = (p: ProviderInfo) => {
    setProvider(p);
    setPhone(p.phonePrefix + ' ');
    setStep('phone');
  };

  const handlePhoneConfirm = () => {
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.length < 9) {
      setPhoneError('Entrez un numéro valide (9 chiffres)');
      return;
    }
    setPhoneError('');
    setStep('pin');
  };

  const handlePinComplete = (p: string) => {
    setPin(p);
    if (p.length === 4) {
      timerRef.current = setTimeout(() => {
        setStep('processing');
        const ref = generateRef();
        setTxRef(ref);
        timerRef.current = setTimeout(() => {
          setStep('success');
          onSuccess(provider.name, ref);
        }, 2600);
      }, 300);
    }
  };

  const styles = {
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '0 0 0 0',
    } as React.CSSProperties,
    sheet: {
      width: '100%',
      maxWidth: 480,
      maxHeight: '92vh',
      overflowY: 'auto' as const,
      borderRadius: '28px 28px 0 0',
      background: step === 'choose'
        ? '#0d1117'
        : `linear-gradient(180deg, ${provider.secondaryColor}dd 0%, #0d1117 60%)`,
      padding: '24px 20px 32px',
      boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
      position: 'relative' as const,
      transition: 'background 0.5s ease',
    } as React.CSSProperties,
  };

  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={styles.sheet}>
        {/* Handle bar */}
        <div style={{ width: 40, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.2)', margin: '0 auto 20px' }} />

        {/* STEP: choose provider */}
        {step === 'choose' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ color: 'white', fontSize: 20, fontWeight: 900, marginBottom: 4 }}>
                Choisir le mode de paiement
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{emoji}</span>
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{label} · </span>
                  <span style={{ color: 'white', fontWeight: 900, fontSize: 15 }}>
                    {amount.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleChooseProvider(p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '16px 20px', borderRadius: 18,
                    background: p.bgLight,
                    border: `1.5px solid ${p.color}40`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.border = `1.5px solid ${p.color}80`;
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.border = `1.5px solid ${p.color}40`;
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: p.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, flexShrink: 0,
                    boxShadow: `0 4px 16px ${p.color}50`,
                  }}>
                    {p.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontWeight: 900, fontSize: 15, marginBottom: 2 }}>{p.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{p.tagline}</div>
                  </div>
                  <div style={{ color: p.color, fontSize: 18 }}>›</div>
                </button>
              ))}
            </div>

            <button
              onClick={onCancel}
              style={{
                width: '100%', marginTop: 16, padding: '14px',
                borderRadius: 14, background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              Annuler
            </button>
          </div>
        )}

        {/* STEP: phone number */}
        {step === 'phone' && (
          <div>
            <button
              onClick={() => setStep('choose')}
              style={{ color: provider.color, background: 'none', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 16, padding: 0 }}
            >
              ← Changer de méthode
            </button>

            {/* Provider header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 16,
              background: provider.bgLight,
              border: `1px solid ${provider.color}30`,
              marginBottom: 24,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: provider.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
                boxShadow: `0 4px 16px ${provider.color}50`,
              }}>
                {provider.emoji}
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 900, fontSize: 15 }}>{provider.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                  {amount.toLocaleString('fr-FR')} FCFA
                </div>
              </div>
            </div>

            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
              Numéro de téléphone {provider.name}
            </label>
            <div style={{ position: 'relative', marginBottom: 6 }}>
              <span style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                color: provider.color, fontSize: 16, fontWeight: 700, pointerEvents: 'none',
              }}>
                🇸🇳 +221
              </span>
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
                placeholder={`${provider.phonePrefix} XXX XX XX`}
                maxLength={12}
                style={{
                  width: '100%', padding: '14px 16px 14px 90px',
                  borderRadius: 14, border: `2px solid ${phoneError ? '#ef4444' : provider.color}40`,
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white', fontSize: 18, fontWeight: 700,
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => (e.currentTarget.style.border = `2px solid ${provider.color}`)}
                onBlur={e => (e.currentTarget.style.border = `2px solid ${phoneError ? '#ef4444' : provider.color}40`)}
                autoFocus
              />
            </div>
            {phoneError && <p style={{ color: '#f87171', fontSize: 12, marginBottom: 16 }}>{phoneError}</p>}

            <button
              onClick={handlePhoneConfirm}
              style={{
                width: '100%', marginTop: 16, padding: '16px',
                borderRadius: 16, background: provider.gradient,
                border: 'none', color: 'white', fontWeight: 900, fontSize: 16,
                cursor: 'pointer',
                boxShadow: `0 8px 28px ${provider.color}50`,
                transition: 'all 0.2s',
              }}
            >
              Confirmer mon numéro →
            </button>
          </div>
        )}

        {/* STEP: PIN */}
        {step === 'pin' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: provider.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, margin: '0 auto 12px',
                boxShadow: `0 4px 20px ${provider.color}60`,
              }}>
                🔐
              </div>
              <h3 style={{ color: 'white', fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Code PIN {provider.name}</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                Entrez votre code à 4 chiffres
              </p>
            </div>

            <PinInput onChange={handlePinComplete} />
          </div>
        )}

        {/* STEP: processing */}
        {step === 'processing' && (
          <ProcessingView provider={provider} />
        )}

        {/* STEP: success */}
        {step === 'success' && (
          <SuccessView
            provider={provider}
            amount={amount}
            ref={txRef}
            label={label}
            onShowReceipt={() => setStep('receipt')}
          />
        )}

        {/* STEP: receipt */}
        {step === 'receipt' && (
          <ReceiptView
            provider={provider}
            amount={amount}
            txRef={txRef}
            label={label}
            emoji={emoji}
            onClose={onCancel}
          />
        )}
      </div>
    </div>
  );
}
