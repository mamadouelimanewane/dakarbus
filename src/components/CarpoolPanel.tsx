import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addCarpoolRequest, removeCarpoolRequest, addPoints, earnBadge } from '@/store/store';
import { STOPS } from '@/data/transportData';
import { haptic } from '@/utils/haptic';

// Quelques demandes simulées pour donner vie à la fonctionnalité
const SIMULATED: { id: string; userId: string; from: string; to: string; ts: number }[] = [
  { id: 'sim1', userId: 'Aminata D.', from: 'Parcelles Assainies',  to: 'Plateau / Centre-ville', ts: Date.now() - 1000*60*3  },
  { id: 'sim2', userId: 'Moussa K.',  from: 'Guédiawaye Centre',    to: 'Université UCAD',         ts: Date.now() - 1000*60*11 },
  { id: 'sim3', userId: 'Ndeye F.',   from: 'Pikine Icotaf',        to: 'Marché HLM',              ts: Date.now() - 1000*60*22 },
  { id: 'sim4', userId: 'Ibrahima S.', from: 'Rufisque Ville',      to: 'Colobane',                ts: Date.now() - 1000*60*35 },
];

function relTime(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'À l\'instant';
  if (m < 60) return `${m} min`;
  return `${Math.floor(m/60)}h`;
}

interface Props { onClose: () => void; }

export default function CarpoolPanel({ onClose }: Props) {
  const dispatch = useAppDispatch();
  const { carpoolRequests } = useAppSelector(s => s.gamif);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [sent, setSent] = useState(false);

  const allRequests = [...SIMULATED, ...carpoolRequests.map(r => ({ ...r, userId: 'Moi' }))].sort((a, b) => b.ts - a.ts);

  const handleSubmit = () => {
    if (!fromId || !toId) return;
    haptic('medium');
    const from = STOPS.find(s => s.id === fromId)?.name || fromId;
    const to   = STOPS.find(s => s.id === toId)?.name || toId;
    dispatch(addCarpoolRequest({ from, to }));
    dispatch(addPoints(5));
    dispatch(earnBadge('sharer'));
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setFromId(''); setToId('');
  };

  return (
    <div className="fixed inset-0 z-[9700] flex flex-col"
      style={{ background: 'rgba(5,8,18,.97)', backdropFilter: 'blur(20px)' }}>

      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,.07)', color: '#94a3b8' }}>‹</button>
        <div>
          <div className="font-black text-white text-sm">🤝 Covoiturage informel</div>
          <div className="text-[10px]" style={{ color: '#334155' }}>Trouvez des voyageurs sur votre trajet</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: 'none' }}>

        {/* Poster une demande */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.2)' }}>
          <p className="text-xs font-black text-white">📍 Je cherche quelqu'un pour aller…</p>
          <select value={fromId} onChange={e => setFromId(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)' }}>
            <option value="">De quel arrêt ?</option>
            {STOPS.slice(0, 60).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={toId} onChange={e => setToId(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)' }}>
            <option value="">Vers quel arrêt ?</option>
            {STOPS.slice(0, 60).filter(s => s.id !== fromId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={handleSubmit} disabled={!fromId || !toId}
            className="w-full py-2.5 rounded-xl font-black text-sm text-white transition-all active:scale-95"
            style={{ background: fromId && toId ? 'rgba(37,99,235,.9)' : 'rgba(255,255,255,.05)', color: fromId && toId ? 'white' : '#334155' }}>
            {sent ? '✅ Demande envoyée !' : '📤 Publier ma demande'}
          </button>
        </div>

        {/* Liste des demandes */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#334155' }}>
            {allRequests.length} demandes actives
          </p>
          <div className="space-y-2">
            {allRequests.map(req => (
              <div key={req.id} className="rounded-2xl p-3.5 flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.2)' }}>
                  {req.userId === 'Moi' ? '👤' : req.userId[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-white truncate">{req.from}</div>
                  <div className="text-[10px] mt-0.5 truncate" style={{ color: '#475569' }}>→ {req.to}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: '#334155' }}>{req.userId} · {relTime(req.ts)}</div>
                </div>
                {req.userId === 'Moi' ? (
                  <button onClick={() => dispatch(removeCarpoolRequest(req.id))}
                    className="text-[10px] px-2 py-1 rounded-lg font-bold"
                    style={{ background: 'rgba(220,38,38,.1)', color: '#f87171' }}>✕</button>
                ) : (
                  <button onClick={() => { haptic('light'); }}
                    className="text-[10px] px-2.5 py-1.5 rounded-xl font-black"
                    style={{ background: 'rgba(16,185,129,.12)', color: '#34d399', border: '1px solid rgba(16,185,129,.2)' }}>
                    👋 Rejoindre
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
