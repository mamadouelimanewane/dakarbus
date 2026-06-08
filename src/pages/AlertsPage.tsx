import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { usePopBack } from '@/hooks/usePopBack';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addReport, upvoteReport, acknowledgeReport, showToast, addPoints, earnBadge } from '@/store/store';

// Expiry countdown (30 min)
function ExpiryBar({ timestamp }: { timestamp: number }) {
  const LIFE = 30 * 60 * 1000;
  const [pct, setPct] = useState(() => Math.max(0, 100 - (Date.now() - timestamp) / LIFE * 100));
  useEffect(() => {
    const id = setInterval(() => {
      setPct(Math.max(0, 100 - (Date.now() - timestamp) / LIFE * 100));
    }, 10_000);
    return () => clearInterval(id);
  }, [timestamp]);
  const minLeft = Math.max(0, Math.round((LIFE - (Date.now() - timestamp)) / 60000));
  const color = pct > 50 ? '#dc2626' : pct > 20 ? '#f59e0b' : '#334155';
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,.06)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[9px] font-bold flex-shrink-0" style={{ color }}>
        {pct > 1 ? `expire dans ${minLeft}m` : 'expiré'}
      </span>
    </div>
  );
}

function fireNotif(type: string, desc: string) {
  if (Notification.permission !== 'granted') return;
  const t = type === 'delay' ? '🐌 Retard signalé' : type === 'accident' ? '💥 Accident signalé' : type === 'crowd' ? '👥 Forte affluence' : '⚠️ Incident';
  new Notification(`SunuBus — ${t}`, { body: desc.slice(0, 100), icon: '/icon-192.png' });
}
import { LINES, STOPS } from '@/data/transportData';
import type { CrowdsourceReport } from '@/types';

const TYPES = {
  delay:    { e:'🐌', c:'#d97706', l:'Bouchon / Retard',  bg:'rgba(217,119,6,.08)',   border:'rgba(217,119,6,.2)' },
  accident: { e:'💥', c:'#dc2626', l:'Accident',           bg:'rgba(220,38,38,.08)',   border:'rgba(220,38,38,.2)' },
  crowd:    { e:'👥', c:'#2563eb', l:'Forte affluence',    bg:'rgba(37,99,235,.08)',   border:'rgba(37,99,235,.2)' },
  other:    { e:'⚠️', c:'#64748b', l:'Autre incident',     bg:'rgba(255,255,255,.04)', border:'rgba(255,255,255,.08)' },
} as const;

const FILTER_OPTS = ['Tous', 'Retard', 'Accident', 'Affluence', 'Récents'] as const;

function relTime(ts: number) {
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return 'À l\'instant';
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h`;
}

// Find lines near a report location
function nearbyLines(loc: [number, number]): string[] {
  const [lat, lng] = loc;
  return LINES
    .filter(l => {
      return l.stops.some(sid => {
        const s = STOPS.find(x => x.id === sid);
        if (!s) return false;
        const d = Math.sqrt((s.lat - lat) ** 2 + (s.lng - lng) ** 2);
        return d < 0.05; // ~5km radius
      });
    })
    .map(l => l.id)
    .slice(0, 4);
}

export default function AlertsPage() {
  const dispatch = useAppDispatch();
  const { reports } = useAppSelector(s => s.tickets);
  const { userLocation } = useAppSelector(s => s.mobility);
  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<CrowdsourceReport['type']>('delay');
  const [voted, setVoted] = useState(new Set<string>());
  const [filter, setFilter] = useState<typeof FILTER_OPTS[number]>('Tous');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Retour depuis le formulaire de signalement
  usePopBack(() => { setShowForm(false); setDesc(''); setHasPhoto(false); setPhotoPreview(null); }, showForm);
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const pullStart = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const triggerRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }, []);
  const onPullStart = useCallback((e: React.TouchEvent) => {
    if ((listRef.current?.scrollTop ?? 0) === 0) pullStart.current = e.touches[0].clientY;
  }, []);
  const onPullMove = useCallback((e: React.TouchEvent) => {
    if (pullStart.current === null) return;
    const dy = e.touches[0].clientY - pullStart.current;
    if (dy > 0) setPullY(Math.min(dy * 0.45, 64));
  }, []);
  const onPullEnd = useCallback(() => {
    if (pullY > 48) triggerRefresh();
    pullStart.current = null; setPullY(0);
  }, [pullY, triggerRefresh]);

  const filtered = useMemo(() => {
    let r = [...reports];
    if (filter === 'Retard')    r = r.filter(x => x.type === 'delay');
    if (filter === 'Accident')  r = r.filter(x => x.type === 'accident');
    if (filter === 'Affluence') r = r.filter(x => x.type === 'crowd');
    if (filter === 'Récents')   r = r.filter(x => Date.now() - x.timestamp < 30 * 60 * 1000);
    return r;
  }, [reports, filter]);

  // Stats summary
  const recentCount = reports.filter(r => Date.now() - r.timestamp < 30 * 60 * 1000).length;
  const hotLines = useMemo(() => {
    const lineCount: Record<string, number> = {};
    reports.forEach(r => {
      nearbyLines(r.location).forEach(lid => {
        lineCount[lid] = (lineCount[lid] || 0) + 1;
      });
    });
    return Object.entries(lineCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([lid, count]) => ({ line: LINES.find(l => l.id === lid), count }))
      .filter(x => x.line);
  }, [reports]);

  const submit = () => {
    const t = desc.trim();
    if (!t) { dispatch(showToast({ type: 'warning', message: 'Décrivez l\'incident en quelques mots.' })); return; }
    if (t.length < 8) { dispatch(showToast({ type: 'warning', message: 'Description trop courte.' })); return; }
    dispatch(addReport({
      id: Math.random().toString(36).substring(2, 11),
      type, description: t.slice(0, 200),
      location: userLocation ?? [14.7167, -17.4677],
      timestamp: Date.now(), upvotes: 0,
    }));
    fireNotif(type, t);
    dispatch(addPoints(15));
    dispatch(earnBadge('sentinel'));
    dispatch(showToast({ type: 'success', message: `Signalement envoyé${hasPhoto ? ' avec photo' : ''} · +15 pts 🏅` }));
    setShowForm(false); setDesc(''); setHasPhoto(false); setPhotoPreview(null);
  };

  const upvote = (id: string) => {
    if (voted.has(id)) return;
    dispatch(upvoteReport(id));
    setVoted(p => new Set([...p, id]));
  };

  return (
    <div className="flex flex-col h-full">

      {/* Network status banner */}
      <div className="mx-4 mt-4 mb-2 p-3.5 rounded-2xl flex gap-3"
        style={{ background: 'rgba(217,119,6,.08)', border: '1px solid rgba(217,119,6,.2)' }}>
        <span className="text-xl flex-shrink-0">⚠️</span>
        <div className="flex-1">
          <p className="text-xs font-black" style={{ color: '#fbbf24' }}>Info réseau en temps réel</p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(251,191,36,.6)' }}>
            {recentCount > 0 ? `${recentCount} incident${recentCount > 1 ? 's' : ''} signalé${recentCount > 1 ? 's' : ''} dans les 30 dernières minutes.` : 'Aucun incident récent — réseau normal.'}
          </p>
        </div>
      </div>

      {/* Affected lines summary */}
      {hotLines.length > 0 && (
        <div className="mx-4 mb-3 flex gap-2 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-widest self-center" style={{ color: '#334155' }}>Lignes perturbées :</span>
          {hotLines.map(({ line, count }) => line && (
            <span key={line.id} className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg text-white"
              style={{ background: line.color }}>
              {line.name} <span className="opacity-70">·{count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="px-4 mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {FILTER_OPTS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all"
            style={filter === f
              ? { background: 'rgba(37,99,235,.3)', color: '#60a5fa', border: '1px solid rgba(37,99,235,.4)' }
              : { background: 'rgba(255,255,255,.04)', color: '#64748b', border: '1px solid var(--c-border)' }}>
            {f}
          </button>
        ))}
        <button onClick={() => setShowForm(true)}
          className="flex-shrink-0 text-[11px] font-black px-3 py-1.5 rounded-xl ml-auto transition-all active:scale-95"
          style={{ background: 'rgba(220,38,38,.12)', color: '#f87171', border: '1px solid rgba(220,38,38,.25)' }}>
          + Signaler
        </button>
      </div>

      {(pullY > 0 || refreshing) && (
        <div className="flex-shrink-0 flex justify-center items-center" style={{ height: refreshing ? 40 : pullY, overflow: 'hidden' }}>
          <div className={`text-xl ${refreshing ? 'animate-spin' : ''}`} style={{ opacity: refreshing || pullY > 24 ? 1 : 0.3 }}>
            {refreshing ? '🔄' : '↓'}
          </div>
        </div>
      )}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-20"
        onTouchStart={onPullStart} onTouchMove={onPullMove} onTouchEnd={onPullEnd}>

        {/* Form */}
        {showForm && (
          <div className="card rounded-2xl p-4 mb-4 animate-fade-up">
            <h3 className="font-black text-sm text-white mb-3">🚨 Nouveau signalement</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(Object.entries(TYPES) as [CrowdsourceReport['type'], typeof TYPES[keyof typeof TYPES]][]).map(([k, m]) => (
                <button key={k} onClick={() => setType(k)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={type === k
                    ? { background: m.bg, border: `1px solid ${m.border}`, color: 'white' }
                    : { background: 'rgba(255,255,255,.03)', border: '1px solid var(--c-border)', color: '#64748b' }}>
                  <span>{m.e}</span><span>{m.l.split(' ')[0]}</span>
                </button>
              ))}
            </div>
            <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0, 200))}
              placeholder="Décrivez l'incident…" className="input mb-1 h-20 resize-none" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px]" style={{ color: '#334155' }}>{desc.length}/200</span>
              {userLocation && <span className="text-[10px]" style={{ color: 'rgba(52,211,153,.6)' }}>📡 GPS détecté</span>}
            </div>
            {/* Photo upload réelle */}
            <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                  setPhotoPreview(ev.target?.result as string);
                  setHasPhoto(true);
                  dispatch(showToast({ type: 'success', message: '📷 Photo ajoutée !' }));
                };
                reader.readAsDataURL(file);
              }} />
            {photoPreview ? (
              <div className="relative mb-3 rounded-xl overflow-hidden" style={{ maxHeight: 140 }}>
                <img src={photoPreview} alt="Signalement" className="w-full object-cover" style={{ maxHeight: 140 }} />
                <button onClick={() => { setPhotoPreview(null); setHasPhoto(false); if (photoInputRef.current) photoInputRef.current.value = ''; }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                  style={{ background: 'rgba(0,0,0,.7)', color: 'white' }}>✕</button>
              </div>
            ) : (
              <button onClick={() => photoInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl mb-3 text-xs font-bold transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px dashed rgba(255,255,255,.12)', color: '#64748b' }}>
                📷 Ajouter une photo (optionnel)
              </button>
            )}
            <div className="flex gap-2">
              <button onClick={submit} className="btn btn-primary flex-1">Envoyer</button>
              <button onClick={() => { setShowForm(false); setDesc(''); setHasPhoto(false); }} className="btn btn-ghost px-5">Annuler</button>
            </div>
          </div>
        )}

        {/* Count */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>
            {filtered.length} signalement{filtered.length !== 1 ? 's' : ''}
          </h2>
          {filtered.length > 0 && (
            <span className="text-[10px]" style={{ color: '#334155' }}>
              Trier : <span style={{ color: '#60a5fa' }}>Plus récents</span>
            </span>
          )}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-bold text-sm text-white">Aucun signalement</p>
            <p className="text-xs mt-1" style={{ color: '#475569' }}>Le réseau est calme pour ce filtre.</p>
          </div>
        )}

        {/* Reports */}
        <div className="space-y-2.5">
          {filtered.map(r => {
            const m = TYPES[r.type] || TYPES.other;
            const hasVoted = voted.has(r.id);
            const nearby = nearbyLines(r.location).slice(0, 2);
            return (
              <div key={r.id} className="rounded-2xl p-4 transition-all"
                style={{ background: m.bg, border: `1px solid ${m.border}` }}>
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${m.c}25` }}>{m.e}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{m.l}</span>
                      {nearby.map(lid => {
                        const l = LINES.find(x => x.id === lid);
                        return l ? (
                          <span key={lid} className="text-[9px] font-black px-1.5 py-0.5 rounded-md text-white"
                            style={{ background: l.color }}>{l.name}</span>
                        ) : null;
                      })}
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,.3)' }}>Il y a {relTime(r.timestamp)}</p>
                  </div>
                  <button onClick={() => upvote(r.id)} disabled={hasVoted}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-90"
                    style={hasVoted
                      ? { background: 'rgba(37,99,235,.2)', color: '#60a5fa', cursor: 'default' }
                      : { background: 'rgba(255,255,255,.08)', color: '#94a3b8' }}>
                    👍 {r.upvotes}
                  </button>
                </div>
                <p className="text-xs pl-12 leading-relaxed" style={{ color: 'rgba(241,245,249,.7)' }}>
                  {r.description}
                </p>
                <div className="pl-12">
                  <ExpiryBar timestamp={r.timestamp} />
                </div>
                {r.upvotes >= 5 && (
                  <div className="pl-12 mt-1.5">
                    <button onClick={() => dispatch(acknowledgeReport(r.id))}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95"
                      style={{ background: 'rgba(255,255,255,.04)', color: '#334155', border: '1px solid rgba(255,255,255,.06)' }}>
                      ✕ Marquer résolu
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
