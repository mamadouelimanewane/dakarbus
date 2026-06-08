import React, { useState, useEffect, useRef, useCallback } from 'react';
import { haptic } from '@/utils/haptic';
import { usePopBack } from '@/hooks/usePopBack';

interface Msg { id: string; author: string; text: string; ts: number; self: boolean; }

const PSEUDO_NAMES = ['Ibou', 'Fatou', 'Moussa', 'Aminata', 'Omar', 'Mariama', 'Abdou', 'Rokhaya', 'Lamine', 'Ndeye'];
const SAMPLE_MSGS: Omit<Msg, 'self'>[] = [
  { id: 'a1', author: 'Ibou',     text: 'Bus en route, dans 5 min à Liberté 6 !',  ts: Date.now() - 1000*60*4 },
  { id: 'a2', author: 'Fatou',    text: 'Merci ! Y\'a de la place ?',               ts: Date.now() - 1000*60*3 },
  { id: 'a3', author: 'Ibou',     text: 'Oui, à moitié rempli environ',             ts: Date.now() - 1000*60*2 },
  { id: 'a4', author: 'Moussa',   text: 'Bouchon sur VDN, le prochain mettra 15 min', ts: Date.now() - 1000*55 },
];

const STORAGE_KEY = (lineId: string) => `sunubus_chat_${lineId}`;
function getMyPseudo() {
  let p = localStorage.getItem('sunubus_pseudo');
  if (!p) { p = PSEUDO_NAMES[Math.floor(Math.random() * PSEUDO_NAMES.length)] + Math.floor(Math.random()*99); localStorage.setItem('sunubus_pseudo', p); }
  return p;
}

// Simulated incoming messages
const BOT_REPLIES = [
  'Le bus arrive bientôt !', 'Gare bus chargée ce soir', 'Bonne route à tous 🤝',
  'Attention bouchon Corniche', 'Bus climatisé en service', 'Merci pour l\'info 👍',
  'Quelqu\'un à l\'arrêt Petersen ?', 'Le prochain passe en 8 min', 'Chauffeur sympa aujourd\'hui 😄',
];

interface Props { lineId: string; lineName: string; onClose: () => void; }

export default function LineChatPanel({ lineId, lineName, onClose }: Props) {
  usePopBack(onClose);
  const myPseudo = useRef(getMyPseudo());
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY(lineId)) || '[]') as Msg[];
      return [...SAMPLE_MSGS.map(m => ({ ...m, self: false })), ...stored].sort((a, b) => a.ts - b.ts).slice(-30);
    } catch { return SAMPLE_MSGS.map(m => ({ ...m, self: false })); }
  });
  const [input, setInput] = useState('');
  const [botTyping, setBotTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  // Simulate incoming messages occasionally
  useEffect(() => {
    const scheduleNext = () => {
      const delay = 15000 + Math.random() * 45000;
      return setTimeout(() => {
        setBotTyping(true);
        setTimeout(() => {
          const author = PSEUDO_NAMES[Math.floor(Math.random() * PSEUDO_NAMES.length)];
          const text   = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
          const msg: Msg = { id: Math.random().toString(36).slice(2), author, text, ts: Date.now(), self: false };
          setMsgs(m => [...m, msg].slice(-40));
          setBotTyping(false);
          scheduleNext();
        }, 1500 + Math.random() * 1000);
      }, delay);
    };
    const t = scheduleNext();
    return () => clearTimeout(t);
  }, []);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    haptic('light');
    const msg: Msg = { id: Math.random().toString(36).slice(2), author: myPseudo.current, text, ts: Date.now(), self: true };
    setMsgs(m => {
      const next = [...m, msg].slice(-40);
      try {
        const mine = next.filter(x => x.self);
        localStorage.setItem(STORAGE_KEY(lineId), JSON.stringify(mine.slice(-10)));
      } catch {}
      return next;
    });
    setInput('');
  }, [input, lineId]);

  const fmt = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  return (
    <div className="fixed inset-0 z-[9700] flex flex-col"
      style={{ background: 'rgba(5,8,18,.97)', backdropFilter: 'blur(20px)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,.08)', background: 'rgba(8,12,24,.95)' }}>
        <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,.07)', color: '#94a3b8' }}>‹</button>
        <div className="flex-1">
          <div className="font-black text-white text-sm">💬 Chat — {lineName}</div>
          <div className="text-[10px]" style={{ color: '#334155' }}>Pseudonyme : {myPseudo.current}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e', animation: 'live-pulse 2s infinite' }} />
          <span className="text-[10px] font-bold" style={{ color: '#22c55e' }}>En direct</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ scrollbarWidth: 'none' }}>
        {msgs.map(msg => (
          <div key={msg.id} className={`flex gap-2 ${msg.self ? 'flex-row-reverse' : ''}`}>
            {!msg.self && (
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black"
                style={{ background: 'rgba(37,99,235,.25)', color: '#60a5fa' }}>
                {msg.author[0]}
              </div>
            )}
            <div className={`max-w-[78%] ${msg.self ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
              {!msg.self && <span className="text-[10px] font-bold px-1" style={{ color: '#334155' }}>{msg.author}</span>}
              <div className="px-3 py-2 rounded-2xl text-sm font-medium leading-snug"
                style={{
                  background: msg.self ? 'rgba(37,99,235,.85)' : 'rgba(255,255,255,.07)',
                  color: msg.self ? 'white' : '#cbd5e1',
                  borderRadius: msg.self ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                }}>
                {msg.text}
              </div>
              <span className="text-[9px] px-1" style={{ color: '#1e293b' }}>{fmt(msg.ts)}</span>
            </div>
          </div>
        ))}

        {botTyping && (
          <div className="flex gap-2 items-center">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black"
              style={{ background: 'rgba(37,99,235,.25)', color: '#60a5fa' }}>?</div>
            <div className="px-4 py-2.5 rounded-2xl" style={{ background: 'rgba(255,255,255,.07)', borderRadius: '16px 16px 16px 4px' }}>
              <div className="flex gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#475569', animation: `bounce 1.2s ${i*0.2}s ease-in-out infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 flex gap-2 px-4 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,.06)', background: 'rgba(8,12,24,.95)' }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Signaler, informer, partager…"
          className="flex-1 rounded-2xl px-4 py-2.5 text-sm text-white outline-none"
          style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', caretColor: '#3b82f6' }} />
        <button onClick={send}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition-all active:scale-90"
          style={{ background: input.trim() ? 'rgba(37,99,235,.9)' : 'rgba(255,255,255,.05)', color: input.trim() ? 'white' : '#334155' }}>
          ➤
        </button>
      </div>
    </div>
  );
}
