import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { loginPassenger, loginDriver, loginAdmin, setRouteOrigin, setRouteDestination, setAutoTheme } from './store/store';
import { STOPS } from './data/transportData';
import { parseRouteFromURL } from './utils/share';
import PassengerApp from './views/passenger/PassengerApp';
import DriverApp from './views/driver/DriverApp';
import AdminApp from './views/admin/AdminApp';
import { initSimulation } from './services/simulation';

const DRIVER_PINS: Record<string, { name: string; lineId: string }> = {
  '1234': { name: 'Moussa Diallo',  lineId: 'L8' },
  '5678': { name: 'Ibrahima Sy',    lineId: 'BRT-L1' },
  '0000': { name: 'Chauffeur Test', lineId: 'L1A' },
};
const ADMIN_PINS: Record<string, { name: string }> = {
  'admin': { name: 'Super Admin' },
  '9999':  { name: 'Administrateur' },
};

/* ── PIN Modal ─────────────────────────────────────────────── */
function PinModal({ role, onClose, onSuccess }: {
  role: 'driver' | 'admin';
  onClose: () => void;
  onSuccess: (pin: string) => void;
}) {
  const [pin, setPin] = useState('');
  const [shake, setShake]   = useState(false);
  const isDriver = role === 'driver';
  const accent   = isDriver ? '#2563eb' : '#7c3aed';
  const hint     = isDriver ? '1234 · 5678 · 0000' : 'admin · 9999';

  const handleKey = (k: string) => {
    if (shake) return;
    if (k === 'DEL') { setPin(p => p.slice(0, -1)); return; }
    if (k === 'OK') {
      const ok = isDriver ? DRIVER_PINS[pin] : ADMIN_PINS[pin];
      if (ok) { onSuccess(pin); }
      else {
        setShake(true);
        setTimeout(() => { setShake(false); setPin(''); }, 520);
      }
      return;
    }
    if (pin.length < 6) setPin(p => p + k);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full max-w-xs rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border2)', boxShadow: 'var(--shadow-xl)' }}>

        {/* Header */}
        <div className="px-6 py-5 text-center"
          style={{ background: `linear-gradient(160deg, ${accent}40 0%, ${accent}18 100%)`, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div className="text-4xl mb-2">{isDriver ? '👨‍✈️' : '🛡️'}</div>
          <h2 className="text-base font-black text-white">{isDriver ? 'Espace Chauffeur' : 'Administration'}</h2>
          <p className="text-xs mt-1 font-medium" style={{ color: accent + 'cc' }}>Code : {hint}</p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-3 pt-5 pb-2 px-6"
          style={{ animation: shake ? 'shake .5s cubic-bezier(.36,.07,.19,.97)' : 'none' }}>
          {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-200"
              style={{
                width: i < pin.length ? 14 : 10,
                height: i < pin.length ? 14 : 10,
                background: i < pin.length ? accent : 'rgba(255,255,255,.12)',
                boxShadow: i < pin.length ? `0 0 12px ${accent}88` : 'none',
              }} />
          ))}
        </div>
        {shake && <p className="text-center text-xs text-red-400 font-bold pb-1">Code incorrect</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 p-4">
          {['1','2','3','4','5','6','7','8','9','DEL','0','OK'].map(k => (
            <button key={k} onClick={() => handleKey(k)}
              className="h-14 rounded-2xl font-black text-xl transition-all active:scale-90 select-none"
              style={
                k === 'OK'  ? { background: `linear-gradient(135deg, ${accent}dd, ${accent})`, color:'white', boxShadow:`0 6px 20px ${accent}55` }
                : k === 'DEL' ? { background:'rgba(255,255,255,.05)', color:'#94a3b8', border:'1px solid rgba(255,255,255,.08)' }
                : { background:'rgba(255,255,255,.06)', color:'white', border:'1px solid rgba(255,255,255,.06)' }
              }>
              {k === 'DEL' ? '⌫' : k === 'OK' ? '✓' : k}
            </button>
          ))}
        </div>
        <button onClick={onClose}
          className="w-full py-4 text-xs font-bold transition-colors"
          style={{ color:'var(--c-muted)', borderTop:'1px solid var(--c-border)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-muted)')}>
          Annuler
        </button>
      </div>

      <style>{`@keyframes shake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(3px)}30%,50%,70%{transform:translateX(-4px)}40%,60%{transform:translateX(4px)}}`}</style>
    </div>
  );
}

/* ── Role Card ─────────────────────────────────────────────── */
function RoleCard({ icon, title, subtitle, onClick, accent, locked = false }: {
  icon: string; title: string; subtitle: string;
  onClick: () => void; accent: string; locked?: boolean;
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all group active:scale-[.98]"
      style={{
        background: `linear-gradient(135deg, ${accent}22 0%, ${accent}08 100%)`,
        border: `1px solid ${accent}30`,
        boxShadow: `0 8px 32px ${accent}18`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${accent}30`; (e.currentTarget as HTMLElement).style.borderColor = `${accent}55`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${accent}18`; (e.currentTarget as HTMLElement).style.borderColor = `${accent}30`; }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-110"
        style={{ background: `${accent}25` }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-black text-white">{title}</div>
        <div className="text-xs mt-0.5 font-medium truncate" style={{ color: accent + '99' }}>{subtitle}</div>
      </div>
      <div className="flex-shrink-0 text-lg transition-all" style={{ color: locked ? `${accent}60` : `${accent}99` }}>
        {locked ? '🔒' : '→'}
      </div>
    </button>
  );
}

/* ── Role Selection ─────────────────────────────────────────── */
function RoleSelection() {
  const dispatch = useAppDispatch();
  const [modal, setModal] = useState<'driver' | 'admin' | null>(null);

  const handlePin = (role: 'driver' | 'admin', pin: string) => {
    if (role === 'driver') { const d = DRIVER_PINS[pin]; dispatch(loginDriver({ name: d.name, lineId: d.lineId })); }
    else                   { const a = ADMIN_PINS[pin];  dispatch(loginAdmin({ name: a.name })); }
    setModal(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 35% 25%, #1e3a8a 0%, #0a0f1e 55%, #150d30 100%)' }}>

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full opacity-[.07]"
          style={{ width:600, height:600, top:'-15%', left:'-10%', background:'radial-gradient(circle, #2563eb, transparent)', filter:'blur(80px)' }} />
        <div className="absolute rounded-full opacity-[.05]"
          style={{ width:400, height:400, bottom:'-10%', right:'-5%', background:'radial-gradient(circle, #7c3aed, transparent)', filter:'blur(60px)' }} />
        <div className="absolute rounded-full opacity-[.04]"
          style={{ width:200, height:200, top:'50%', right:'20%', background:'radial-gradient(circle, #059669, transparent)', filter:'blur(40px)' }} />
      </div>

      {/* Logo */}
      <div className="relative mb-10 flex flex-col items-center animate-fade-up">
        <div className="relative mb-5">
          <div className="w-28 h-28 rounded-[32px] flex items-center justify-center text-6xl"
            style={{ background:'linear-gradient(145deg, #1d4ed8, #2563eb)', boxShadow:'0 32px 80px rgba(37,99,235,.5), 0 0 0 1px rgba(255,255,255,.08)' }}>
            🚌
          </div>
          <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
            style={{ background:'linear-gradient(135deg, #059669, #10b981)', boxShadow:'0 6px 20px rgba(5,150,105,.5)' }}>✓</div>
        </div>

        <h1 className="text-5xl font-black tracking-tight gradient-text">SunuBus</h1>
        <p className="text-sm mt-2 font-semibold" style={{ color:'rgba(147,197,253,.7)' }}>DakarBus v5 · Sénégal 🇸🇳</p>
        <p className="text-xs mt-1.5 text-center max-w-xs" style={{ color:'#475569' }}>
          Transport intelligent en temps réel
        </p>
      </div>

      {/* Role cards */}
      <div className="w-full max-w-sm space-y-3 animate-fade-up" style={{ animationDelay:'.1s' }}>
        <RoleCard
          icon="👤" title="Passager" accent="#2563eb"
          subtitle="Itinéraires · Billets · Carte live · Alertes"
          onClick={() => dispatch(loginPassenger())} />
        <RoleCard
          icon="👨‍✈️" title="Chauffeur" accent="#0ea5e9" locked
          subtitle="GPS · Scanner billets · Incidents · Service"
          onClick={() => setModal('driver')} />
        <RoleCard
          icon="🛡️" title="Administrateur" accent="#7c3aed" locked
          subtitle="Supervision · Flotte · Alertes · Revenus"
          onClick={() => setModal('admin')} />
      </div>

      {/* Footer */}
      <p className="mt-10 text-xs animate-fade-up" style={{ color:'#1e293b', animationDelay:'.2s' }}>
        v5.1 · Simulation locale · © 2026 DakarBus
      </p>

      {modal && (
        <PinModal role={modal} onClose={() => setModal(null)} onSuccess={p => handlePin(modal, p)} />
      )}
    </div>
  );
}

/* ── App Root ─────────────────────────────────────────────── */
export default function App() {
  const dispatch = useAppDispatch();
  const { role, isAuthenticated } = useAppSelector(s => s.auth);
  const { darkMode, autoTheme } = useAppSelector(s => s.ui);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Auto-theme: refresh every minute to catch hour change
  useEffect(() => {
    if (!autoTheme) return;
    const tick = () => {
      const h = new Date().getHours();
      const shouldBeDark = h < 6 || h >= 19;
      dispatch(setAutoTheme(true)); // re-evaluates in reducer
    };
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [autoTheme]);

  useEffect(() => {
    initSimulation();
    // Handle deep-link share ?from=xxx&to=yyy
    const { from, to } = parseRouteFromURL();
    if (from || to) {
      if (from) { const s = STOPS.find(x => x.id === from); if (s) dispatch(setRouteOrigin(s)); }
      if (to)   { const s = STOPS.find(x => x.id === to);   if (s) dispatch(setRouteDestination(s)); }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (!isAuthenticated) return <RoleSelection />;
  if (role === 'driver')  return <DriverApp />;
  if (role === 'admin')   return <AdminApp />;
  return <PassengerApp />;
}
