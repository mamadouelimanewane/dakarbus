import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout, addReport, showToast, setUserLocation } from '@/store/store';
import { LINES, STOPS } from '@/data/transportData';
import ToastContainer from '@/components/ToastContainer';
import jsQR from 'jsqr';
import type { CrowdsourceReport } from '@/types';

const INCIDENT_TYPES: { id: CrowdsourceReport['type']; emoji: string; label: string; color: string }[] = [
  { id:'delay',    emoji:'🐌', label:'Bouchon',   color:'#d97706' },
  { id:'accident', emoji:'💥', label:'Accident',  color:'#dc2626' },
  { id:'crowd',    emoji:'👥', label:'Affluence', color:'#2563eb' },
  { id:'other',    emoji:'⚠️', label:'Autre',     color:'#64748b' },
];

function StatCard({ label, value, unit, color = '#f1f5f9' }: { label:string; value:string|number; unit?:string; color?:string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-3 rounded-2xl"
      style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.06)' }}>
      <div className="text-2xl font-black leading-none" style={{ color }}>{value}</div>
      {unit && <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color:'rgba(255,255,255,.3)' }}>{unit}</div>}
      <div className="text-[10px] font-medium mt-0.5" style={{ color:'#64748b' }}>{label}</div>
    </div>
  );
}

// Occupancy bar indicator
function OccupancyBar({ pct }: { pct: number }) {
  const color = pct > 80 ? '#dc2626' : pct > 50 ? '#f59e0b' : '#22c55e';
  const label = pct > 80 ? 'Complet' : pct > 50 ? 'Chargé' : 'Disponible';
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1.5" style={{ color: 'rgba(255,255,255,.4)' }}>
        <span>Taux d'occupation</span>
        <span style={{ color }}>{label} · {pct}%</span>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(255,255,255,.08)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
      </div>
    </div>
  );
}

// Next stops panel for active line
function NextStopsPanel({ lineId, currentPassengers, lineColor }: { lineId: string; currentPassengers: number; lineColor: string }) {
  const line = LINES.find(l => l.id === lineId);
  const [currentStopIdx, setCurrentStopIdx] = useState(0);
  const [eta, setEta] = useState(0); // seconds to next stop

  useEffect(() => {
    setEta(Math.floor(2 + Math.random() * 4) * 60);
    const t = setInterval(() => setEta(s => {
      if (s <= 0) { setCurrentStopIdx(i => (i + 1) % (line?.stops.length || 1)); return Math.floor(2 + Math.random() * 4) * 60; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [line?.id]);

  if (!line) return null;

  const upcomingStopIds = line.stops.slice(currentStopIdx, currentStopIdx + 4);
  const upcomingStops = upcomingStopIds.map(id => STOPS.find(s => s.id === id)).filter(Boolean);

  const mm = Math.floor(eta / 60), ss = eta % 60;
  const etaStr = mm > 0 ? `${mm}:${String(ss).padStart(2, '0')}` : `${ss}s`;

  return (
    <div className="rounded-2xl card overflow-hidden">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between" style={{ borderBottom: '1px solid var(--c-border)' }}>
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>Prochains arrêts</p>
        <span className="text-xs font-black" style={{ color: lineColor }}>Prochain dans {etaStr}</span>
      </div>
      {upcomingStops.map((stop, i) => stop && (
        <div key={stop.id} className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: i < upcomingStops.length - 1 ? '1px solid var(--c-border)' : 'none',
            background: i === 0 ? `${lineColor}0a` : 'transparent' }}>
          <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0"
            style={{ background: i === 0 ? lineColor : 'rgba(255,255,255,.06)' }}>
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: i === 0 ? 'white' : '#64748b' }}>
              {stop.name}
            </p>
            <p className="text-[10px]" style={{ color: '#334155' }}>{stop.zone}</p>
          </div>
          <span className="text-xs font-black flex-shrink-0"
            style={{ color: i === 0 ? lineColor : '#334155' }}>
            {i === 0 ? etaStr : `~${(i * 3) + Math.floor(eta / 60)} min`}
          </span>
        </div>
      ))}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--c-border)' }}>
        <OccupancyBar pct={Math.min(100, Math.round((currentPassengers / 45) * 100))} />
      </div>
    </div>
  );
}

export default function DriverApp() {
  const dispatch = useAppDispatch();
  const { name, lineId } = useAppSelector(s => s.auth);
  const [status, setStatus]             = useState<'idle'|'driving'>('idle');
  const [location, setLocation]         = useState<[number,number]|null>(null);
  const [speed, setSpeed]               = useState(0);
  const [passengers, setPassengers]     = useState(0);
  const [shiftSecs, setShiftSecs]       = useState(0);
  const [totalRuns, setTotalRuns]       = useState(0);
  const [earnings, setEarnings]         = useState(0);
  const [scanMode, setScanMode]         = useState(false);
  const [scanResult, setScanResult]     = useState<'valid'|'invalid'|null>(null);
  const [cameraError, setCameraError]   = useState<string|null>(null);
  const [showIncident, setShowIncident] = useState(false);
  const [incidentType, setIncidentType] = useState<CrowdsourceReport['type']>('delay');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [activeTab, setActiveTab_]      = useState<'drive'|'stops'|'stats'>('drive');
  const videoRef       = useRef<HTMLVideoElement>(null);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const scanActiveRef  = useRef(false);

  const activeLine = LINES.find(l => l.id === lineId);
  const lineColor  = activeLine?.color || '#2563eb';

  useEffect(() => {
    if (status !== 'driving' || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      p => {
        const l: [number,number] = [p.coords.latitude, p.coords.longitude];
        setLocation(l); dispatch(setUserLocation(l));
        setSpeed(p.coords.speed != null && p.coords.speed > 0
          ? Math.round(p.coords.speed * 3.6)
          : Math.floor(25 + Math.random() * 30));
      },
      () => setSpeed(Math.floor(30 + Math.random() * 20)),
      { enableHighAccuracy: true, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [status, dispatch]);

  useEffect(() => {
    if (status !== 'driving') return;
    const t = setInterval(() => {
      setShiftSecs(s => s + 1);
      // Simulate earnings (tarif per minute)
      if (passengers > 0) setEarnings(e => e + (activeLine?.tarif || 200) / 60 * passengers / 60);
    }, 1000);
    return () => clearInterval(t);
  }, [status, passengers]);

  useEffect(() => {
    if (!scanMode) return;
    let stream: MediaStream | null = null;
    let raf: number;
    scanActiveRef.current = true;
    setCameraError(null);

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        stream = s;
        const vid = videoRef.current!;
        vid.srcObject = s; vid.setAttribute('playsinline', 'true'); vid.play();
        const tick = () => {
          if (!scanActiveRef.current) return;
          const cvs = canvasRef.current!; const ctx = cvs.getContext('2d')!;
          if (vid.readyState === vid.HAVE_ENOUGH_DATA) {
            cvs.width = vid.videoWidth; cvs.height = vid.videoHeight;
            ctx.drawImage(vid, 0, 0);
            const img = ctx.getImageData(0, 0, cvs.width, cvs.height);
            const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
            if (code) {
              const valid = code.data.startsWith('TICKET-');
              setScanResult(valid ? 'valid' : 'invalid');
              if (valid) { setPassengers(n => n + 1); setEarnings(e => e + (activeLine?.tarif || 200)); }
              setTimeout(() => { setScanMode(false); setScanResult(null); }, 2000);
              return;
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      })
      .catch(e => {
        const msg = e.name === 'NotAllowedError' ? 'Accès caméra refusé.'
          : e.name === 'NotFoundError' ? 'Aucune caméra détectée.' : `Erreur: ${e.message}`;
        setCameraError(msg);
        dispatch(showToast({ type: 'error', message: msg }));
      });
    return () => { scanActiveRef.current = false; cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()); };
  }, [scanMode, dispatch]);

  const sendIncident = () => {
    const d = incidentDesc.trim();
    if (!d) return;
    dispatch(addReport({
      id: Math.random().toString(36).substring(2, 11), type: incidentType,
      description: `[${name}] ${d}`,
      location: location ?? [14.7167, -17.4677], timestamp: Date.now(), upvotes: 0,
    }));
    dispatch(showToast({ type: 'success', message: 'Incident signalé !' }));
    setShowIncident(false); setIncidentDesc('');
  };

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    return h > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  };

  const occPct = Math.min(100, Math.round((passengers / 45) * 100));

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      <ToastContainer />

      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 h-14"
        style={{ background: 'rgba(10,15,30,.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: `${lineColor}22`, border: `1px solid ${lineColor}44` }}>👨‍✈️</div>
          <div>
            <div className="text-sm font-black text-white leading-none">{name}</div>
            {activeLine && <div className="text-[10px] font-semibold mt-0.5" style={{ color: lineColor }}>{activeLine.name} · {activeLine.operator}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === 'driving' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black"
              style={{ background: 'rgba(5,150,105,.15)', border: '1px solid rgba(5,150,105,.3)', color: '#34d399' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ animation: 'live-pulse 2s infinite' }} />
              En service
            </div>
          )}
          <button onClick={() => { if (window.confirm('Se déconnecter ?')) dispatch(logout()); }} className="btn btn-danger" style={{ padding: '5px 12px', fontSize: 11 }}>
            Déconn.
          </button>
        </div>
      </header>

      {/* Tab nav */}
      <div className="flex-shrink-0 flex px-4 pt-3 gap-2">
        {(['drive','stops','stats'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab_(t)}
            className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
            style={activeTab === t
              ? { background: `${lineColor}25`, color: 'white', border: `1px solid ${lineColor}40` }
              : { background: 'rgba(255,255,255,.04)', color: '#475569', border: '1px solid var(--c-border)' }}>
            {{ drive:'🚌 Service', stops:'📍 Arrêts', stats:'📊 Stats' }[t]}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto p-4 space-y-3 pb-safe">

        {/* ── DRIVE TAB ─────────────────────────── */}
        {activeTab === 'drive' && (
          <>
            {/* Status hero */}
            <div className="rounded-3xl p-5 relative overflow-hidden transition-all duration-500"
              style={{
                background: status === 'driving'
                  ? `linear-gradient(145deg, rgba(5,150,105,.15) 0%, rgba(10,15,30,1) 100%)`
                  : 'var(--c-surface)',
                border: status === 'driving' ? '1px solid rgba(5,150,105,.25)' : '1px solid var(--c-border)',
              }}>
              {status === 'driving' && (
                <div className="flex gap-2 mb-4">
                  <StatCard label="Vitesse"    value={speed}            unit="km/h"  color="#34d399" />
                  <StatCard label="Passagers"  value={passengers}                    color="#60a5fa" />
                  <StatCard label="Durée"      value={fmt(shiftSecs)}               color="#c084fc" />
                </div>
              )}

              {status === 'driving' && (
                <div className="mb-4">
                  <OccupancyBar pct={occPct} />
                </div>
              )}

              {status === 'driving' && location && (
                <div className="flex items-center gap-2 mb-3 text-[10px] font-mono"
                  style={{ color: 'rgba(52,211,153,.5)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ animation: 'live-pulse 2s infinite' }} />
                  GPS {location[0].toFixed(5)}, {location[1].toFixed(5)}
                </div>
              )}

              <button
                onClick={() => {
                  const next = status === 'driving' ? 'idle' : 'driving';
                  setStatus(next);
                  if (next === 'idle') { setTotalRuns(r => r + 1); setShiftSecs(0); setPassengers(0); }
                }}
                className="w-full py-3.5 rounded-2xl font-black text-sm text-white uppercase tracking-wider transition-all active:scale-95"
                style={status === 'driving'
                  ? { background: 'linear-gradient(135deg,#991b1b,#dc2626)', boxShadow: '0 6px 24px rgba(220,38,38,.35)' }
                  : { background: 'linear-gradient(135deg,#065f46,#059669)', boxShadow: '0 6px 24px rgba(5,150,105,.35)' }}>
                {status === 'driving' ? '■  Terminer le service' : '▶  Démarrer le service'}
              </button>
            </div>

            {/* Actions */}
            {status === 'driving' && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setScanMode(true); setScanResult(null); setCameraError(null); }}
                  className="col-span-2 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-white transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', boxShadow: '0 8px 28px rgba(37,99,235,.4)' }}>
                  <span className="text-2xl">📷</span><span>Scanner M-Ticket</span>
                </button>

                <div className="flex flex-col items-center gap-2.5 py-3 px-3 rounded-2xl card">
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>Passagers</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPassengers(n => Math.max(0, n - 1))}
                      className="w-8 h-8 rounded-xl font-black text-lg transition-all active:scale-90"
                      style={{ background: 'rgba(255,255,255,.07)', color: '#94a3b8' }}>−</button>
                    <span className="text-xl font-black text-white w-8 text-center">{passengers}</span>
                    <button onClick={() => setPassengers(n => Math.min(50, n + 1))}
                      className="w-8 h-8 rounded-xl font-black text-lg transition-all active:scale-90"
                      style={{ background: 'rgba(37,99,235,.3)', color: '#60a5fa' }}>+</button>
                  </div>
                </div>

                <button onClick={() => setShowIncident(true)}
                  className="flex flex-col items-center gap-2.5 py-3 rounded-2xl font-bold transition-all active:scale-95"
                  style={{ background: 'rgba(217,119,6,.1)', border: '1px solid rgba(217,119,6,.2)', color: '#fbbf24' }}>
                  <span className="text-2xl">🚧</span>
                  <span className="text-xs font-black">Incident</span>
                </button>
              </div>
            )}

            {showIncident && (
              <div className="card rounded-2xl p-4 animate-fade-up" style={{ borderColor: 'rgba(217,119,6,.3)' }}>
                <h3 className="font-black text-sm mb-3" style={{ color: '#fbbf24' }}>🚧 Signaler un incident</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {INCIDENT_TYPES.map(t => (
                    <button key={t.id} onClick={() => setIncidentType(t.id)}
                      className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all active:scale-95"
                      style={incidentType === t.id
                        ? { background: `${t.color}25`, border: `1px solid ${t.color}55`, color: 'white' }
                        : { background: 'rgba(255,255,255,.04)', border: '1px solid var(--c-border)', color: '#64748b' }}>
                      <span>{t.emoji}</span><span>{t.label}</span>
                    </button>
                  ))}
                </div>
                <textarea value={incidentDesc} onChange={e => setIncidentDesc(e.target.value.slice(0, 200))}
                  placeholder="Décrivez l'incident…" className="input mb-3 h-20 resize-none" />
                <div className="flex gap-2">
                  <button onClick={sendIncident} className="btn btn-primary flex-1">Envoyer</button>
                  <button onClick={() => { setShowIncident(false); setIncidentDesc(''); }} className="btn btn-ghost px-5">Annuler</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── STOPS TAB ─────────────────────────── */}
        {activeTab === 'stops' && lineId && (
          <NextStopsPanel lineId={lineId} currentPassengers={passengers} lineColor={lineColor} />
        )}
        {activeTab === 'stops' && !lineId && (
          <div className="text-center py-12 text-sm" style={{ color: '#475569' }}>Aucune ligne assignée</div>
        )}

        {/* ── STATS TAB ─────────────────────────── */}
        {activeTab === 'stats' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { e:'🔄', l:'Rotations',    v: totalRuns,                        c:'#60a5fa' },
                { e:'👤', l:'Passagers/j',  v: passengers,                       c:'#a78bfa' },
                { e:'💰', l:'Recettes',     v: `${Math.round(earnings)} F`,      c:'#fbbf24' },
                { e:'⏱',  l:'Temps service',v: fmt(shiftSecs),                   c:'#34d399' },
              ].map((s, i) => (
                <div key={i} className="card rounded-2xl p-4">
                  <div className="text-2xl mb-1">{s.e}</div>
                  <div className="font-black text-lg" style={{ color: s.c }}>{s.v}</div>
                  <div className="text-[10px]" style={{ color: '#475569' }}>{s.l}</div>
                </div>
              ))}
            </div>

            {activeLine && (
              <div className="card rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--c-muted)' }}>Ma ligne</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: activeLine.color }} />
                  <div>
                    <div className="font-black text-white text-sm">{activeLine.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>{activeLine.route}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: activeLine.stops.length, l: 'arrêts' },
                    { v: activeLine.freq,          l: 'fréq.' },
                    { v: `${activeLine.tarif}F`,   l: 'tarif' },
                  ].map(x => (
                    <div key={x.l} className="text-center py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,.04)' }}>
                      <div className="font-black text-white text-sm">{x.v}</div>
                      <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--c-muted)' }}>{x.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* QR Scanner Modal */}
      {scanMode && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6"
          style={{ background: 'rgba(10,15,30,.97)', backdropFilter: 'blur(24px)' }}>
          <h2 className="text-xl font-black text-white mb-1">Scanner le billet</h2>
          <p className="text-xs mb-6" style={{ color: 'var(--c-muted)' }}>Présentez le QR code face à la caméra</p>

          {cameraError ? (
            <div className="rounded-2xl p-6 text-center max-w-xs" style={{ background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)' }}>
              <div className="text-4xl mb-3">📵</div>
              <p className="font-bold text-sm" style={{ color: '#f87171' }}>Caméra inaccessible</p>
              <p className="text-xs mt-2" style={{ color: 'var(--c-muted)' }}>{cameraError}</p>
            </div>
          ) : (
            <div className="relative w-72 h-72 rounded-3xl overflow-hidden bg-black"
              style={{
                border: `2px solid ${scanResult === 'valid' ? '#22c55e' : scanResult === 'invalid' ? '#dc2626' : 'rgba(37,99,235,.6)'}`,
                boxShadow: scanResult === 'valid' ? '0 0 40px rgba(34,197,94,.4)' : scanResult === 'invalid' ? '0 0 40px rgba(220,38,38,.4)' : '0 0 24px rgba(37,99,235,.3)',
                transition: 'border-color .3s, box-shadow .3s',
              }}>
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
              <canvas ref={canvasRef} className="hidden" />
              {!scanResult && (
                <div className="absolute left-0 right-0 h-0.5 scan-beam"
                  style={{ background: 'linear-gradient(90deg,transparent,#60a5fa,transparent)', boxShadow: '0 0 12px #3b82f6' }} />
              )}
              {scanResult && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: scanResult === 'valid' ? 'rgba(5,150,105,.2)' : 'rgba(220,38,38,.2)' }}>
                  <div className="text-6xl animate-bounce">{scanResult === 'valid' ? '✅' : '❌'}</div>
                </div>
              )}
            </div>
          )}

          {scanResult && (
            <div className="mt-5 px-8 py-3 rounded-2xl font-black text-lg text-white"
              style={scanResult === 'valid'
                ? { background: 'linear-gradient(135deg,#065f46,#059669)', boxShadow: '0 8px 28px rgba(5,150,105,.4)' }
                : { background: 'linear-gradient(135deg,#991b1b,#dc2626)', boxShadow: '0 8px 28px rgba(220,38,38,.4)' }}>
              {scanResult === 'valid' ? '✓ Billet Valide' : '✕ Billet Invalide'}
            </div>
          )}
          <button onClick={() => { setScanMode(false); setScanResult(null); setCameraError(null); }}
            className="mt-6 btn btn-ghost px-8">Fermer</button>
        </div>
      )}
    </div>
  );
}
