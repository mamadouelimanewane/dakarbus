import React, { useEffect, useRef, useState } from 'react';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { loginPassenger, loginDriver, loginAdmin, loginFleetManager, setRouteOrigin, setRouteDestination, setAutoTheme } from './store/store';
import { STOPS } from './data/transportData';
import { parseRouteFromURL } from './utils/share';
import PassengerApp from './views/passenger/PassengerApp';
import DriverApp from './views/driver/DriverApp';
import AdminApp from './views/admin/AdminApp';
import FleetManagerApp from './views/fleet/FleetManagerApp';
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
const FLEET_DDD_PINS:  Record<string, { name: string; operator: 'DDD' | 'AFTU' }> = {
  'ddd1': { name: 'Directeur Exploitation DDD', operator: 'DDD' },
  'ddd2': { name: 'Régulateur DDD',             operator: 'DDD' },
};
const FLEET_AFTU_PINS: Record<string, { name: string; operator: 'DDD' | 'AFTU' }> = {
  'aftu1': { name: 'Coordinateur AFTU',    operator: 'AFTU' },
  'aftu2': { name: 'Superviseur AFTU',     operator: 'AFTU' },
};

/* ── PIN Modal ─────────────────────────────────────────────── */
function PinModal({ role, onClose, onSuccess }: {
  role: 'driver' | 'admin';
  onClose: () => void;
  onSuccess: (pin: string) => void;
}) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDriver = role === 'driver';
  const accent   = isDriver ? '#2563eb' : '#7c3aed';
  const hint     = isDriver ? '1234 · 5678 · 0000' : 'admin · 9999';

  const trySubmit = (p: string) => {
    const ok = isDriver ? DRIVER_PINS[p] : ADMIN_PINS[p];
    if (ok) { onSuccess(p); return; }
    setShake(true);
    setTimeout(() => { setShake(false); setPin(''); if (inputRef.current) inputRef.current.value = ''; }, 520);
  };

  const handleKey = (k: string) => {
    if (shake) return;
    if (k === 'DEL') { setPin(p => p.slice(0, -1)); return; }
    if (k === 'OK') { trySubmit(pin); return; }
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

        {/* Input clavier natif */}
        <div className="px-5 pt-4 pb-2"
          style={{ animation: shake ? 'shake .5s cubic-bezier(.36,.07,.19,.97)' : 'none' }}>
          <input
            ref={inputRef}
            type="text"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Tapez votre code…"
            value={pin}
            onChange={e => { if (!shake) setPin(e.target.value.slice(0, 6)); }}
            onKeyDown={e => { if (e.key === 'Enter') trySubmit(pin); }}
            className="w-full rounded-xl px-4 text-center font-mono font-black text-lg tracking-widest outline-none"
            style={{
              height: 52,
              background: 'rgba(255,255,255,.06)',
              border: `1.5px solid ${shake ? '#f87171' : accent + '55'}`,
              color: pin.length > 0 ? accent : '#475569',
              caretColor: accent,
            }}
          />
          {shake && <p className="text-center text-xs text-red-400 font-bold pt-1">Code incorrect</p>}
          {!shake && <p className="text-center text-[10px] pt-1" style={{ color: '#475569' }}>
            Tapez ici ou utilisez le pavé
          </p>}
        </div>

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
type ModalRole = 'driver' | 'admin' | 'fleet_ddd' | 'fleet_aftu';

// PinModal étendu pour supporter les rôles flotte
function FleetPinModal({ operator, onClose, onSuccess }: {
  operator: 'DDD' | 'AFTU';
  onClose: () => void;
  onSuccess: (pin: string) => void;
}) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const accent = operator === 'DDD' ? '#2563eb' : '#f59e0b';
  const hint   = operator === 'DDD' ? 'ddd1 · ddd2' : 'aftu1 · aftu2';
  const PINS   = operator === 'DDD' ? FLEET_DDD_PINS : FLEET_AFTU_PINS;

  const trySubmit = (p: string) => {
    if (PINS[p]) { onSuccess(p); return; }
    setShake(true);
    setTimeout(() => { setShake(false); setPin(''); if (inputRef.current) inputRef.current.value = ''; }, 520);
  };

  const handleKey = (k: string) => {
    if (shake) return;
    if (k === 'DEL') { setPin(p => p.slice(0, -1)); return; }
    if (k === 'OK') { trySubmit(pin); return; }
    if (pin.length < 8) setPin(p => p + k);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xs rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border2)', boxShadow: 'var(--shadow-xl)' }}>
        <div className="px-6 py-5 text-center"
          style={{ background: `linear-gradient(160deg, ${accent}40 0%, ${accent}18 100%)`, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div className="text-4xl mb-2">{operator === 'DDD' ? '🚌' : '🚐'}</div>
          <h2 className="text-base font-black text-white">Gestionnaire {operator}</h2>
          <p className="text-xs mt-1 font-medium" style={{ color: accent + 'cc' }}>Code : {hint}</p>
        </div>
        {/* Input clavier natif + affichage */}
        <div className="px-5 pt-4 pb-2"
          style={{ animation: shake ? 'shake .5s cubic-bezier(.36,.07,.19,.97)' : 'none' }}>
          <input
            ref={inputRef}
            type="text"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Tapez votre code…"
            value={pin}
            onChange={e => { if (!shake) setPin(e.target.value.slice(0, 8)); }}
            onKeyDown={e => { if (e.key === 'Enter') trySubmit(pin); }}
            className="w-full rounded-xl px-4 text-center font-mono font-black text-lg tracking-widest outline-none"
            style={{
              height: 52,
              background: 'rgba(255,255,255,.06)',
              border: `1.5px solid ${shake ? '#f87171' : accent + '55'}`,
              color: pin.length > 0 ? accent : '#475569',
              letterSpacing: '0.2em',
              caretColor: accent,
            }}
          />
          {shake && <p className="text-center text-xs text-red-400 font-bold pt-1">Code incorrect</p>}
          {!shake && <p className="text-center text-[10px] pt-1" style={{ color: '#475569' }}>
            Tapez ici ou utilisez le pavé
          </p>}
        </div>
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
          style={{ color:'var(--c-muted)', borderTop:'1px solid var(--c-border)' }}>
          Annuler
        </button>
      </div>
      <style>{`@keyframes shake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(3px)}30%,50%,70%{transform:translateX(-4px)}40%,60%{transform:translateX(4px)}}`}</style>
    </div>
  );
}

function RoleSelection() {
  const dispatch = useAppDispatch();
  const [modal, setModal] = useState<ModalRole | null>(null);

  const handlePin = (role: ModalRole, pin: string) => {
    if (role === 'driver') {
      const d = DRIVER_PINS[pin];
      dispatch(loginDriver({ name: d.name, lineId: d.lineId }));
    } else if (role === 'admin') {
      const a = ADMIN_PINS[pin];
      dispatch(loginAdmin({ name: a.name }));
    } else if (role === 'fleet_ddd') {
      const f = FLEET_DDD_PINS[pin];
      dispatch(loginFleetManager({ operator: 'DDD', name: f.name }));
    } else if (role === 'fleet_aftu') {
      const f = FLEET_AFTU_PINS[pin];
      dispatch(loginFleetManager({ operator: 'AFTU', name: f.name }));
    }
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
          style={{ width:200, height:200, top:'50%', right:'20%', background:'radial-gradient(circle, #f59e0b, transparent)', filter:'blur(40px)' }} />
      </div>

      {/* Logo */}
      <div className="relative mb-8 flex flex-col items-center animate-fade-up">
        <div className="relative mb-5">
          <div className="w-24 h-24 rounded-[32px] flex items-center justify-center text-5xl"
            style={{ background:'linear-gradient(145deg, #1d4ed8, #2563eb)', boxShadow:'0 32px 80px rgba(37,99,235,.5), 0 0 0 1px rgba(255,255,255,.08)' }}>
            🚌
          </div>
          <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
            style={{ background:'linear-gradient(135deg, #059669, #10b981)', boxShadow:'0 6px 20px rgba(5,150,105,.5)' }}>✓</div>
        </div>
        <h1 className="text-5xl font-black tracking-tight gradient-text">SunuBus</h1>
        <p className="text-sm mt-2 font-semibold" style={{ color:'rgba(147,197,253,.7)' }}>DakarBus v5 · Sénégal 🇸🇳</p>
      </div>

      {/* Role cards */}
      <div className="w-full max-w-sm space-y-2.5 animate-fade-up" style={{ animationDelay:'.1s' }}>
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

        {/* Séparateur Gestionnaires de flotte */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,.06)' }} />
          <span className="text-[10px] font-black" style={{ color: '#334155' }}>GESTION DE FLOTTE</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,.06)' }} />
        </div>

        <RoleCard
          icon="🚌" title="Gestionnaire DDD" accent="#2563eb" locked
          subtitle="Tableau de bord · Carte live · Flotte · Lignes · Alertes"
          onClick={() => setModal('fleet_ddd')} />
        <RoleCard
          icon="🚐" title="Gestionnaire AFTU" accent="#f59e0b" locked
          subtitle="Tableau de bord · Carte live · Flotte · Lignes · Alertes"
          onClick={() => setModal('fleet_aftu')} />
      </div>

      <p className="mt-8 text-xs animate-fade-up" style={{ color:'#1e293b', animationDelay:'.2s' }}>
        v5.2 · Simulation locale · © 2026 DakarBus
      </p>

      {(modal === 'driver' || modal === 'admin') && (
        <PinModal
          role={modal as 'driver' | 'admin'}
          onClose={() => setModal(null)}
          onSuccess={p => handlePin(modal!, p)} />
      )}
      {modal === 'fleet_ddd' && (
        <FleetPinModal operator="DDD" onClose={() => setModal(null)} onSuccess={p => handlePin('fleet_ddd', p)} />
      )}
      {modal === 'fleet_aftu' && (
        <FleetPinModal operator="AFTU" onClose={() => setModal(null)} onSuccess={p => handlePin('fleet_aftu', p)} />
      )}
    </div>
  );
}

/* ── App Root ─────────────────────────────────────────────── */
export default function App() {
  const dispatch = useAppDispatch();
  const { role, isAuthenticated } = useAppSelector(s => s.auth);
  const { darkMode } = useAppSelector(s => s.ui);
  const fleetOp = useAppSelector(s => s.fleet.operator);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

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

  // Gestionnaire de flotte — ne requiert pas isAuthenticated classique
  if (fleetOp) return <FleetManagerApp operator={fleetOp} />;

  if (!isAuthenticated) return <RoleSelection />;
  if (role === 'driver')  return <DriverApp />;
  if (role === 'admin')   return <AdminApp />;
  return <PassengerApp />;
}
