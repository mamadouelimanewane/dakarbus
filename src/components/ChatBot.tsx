// ── Chatbot assistant en langage naturel ──────────────────────
// Comprend des requêtes comme "comment aller à Sandaga depuis UCAD ?"
import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setRouteOrigin, setRouteDestination, setActiveTab, showToast } from '@/store/store';
import { searchLocal } from '@/utils/placeSearch';
import { STOPS } from '@/data/transportData';
import type { Stop } from '@/types';

interface Message {
  role: 'user' | 'bot';
  text: string;
  stops?: { origin?: Stop; dest?: Stop };
}

// Patterns NL pour extraire origine et destination
const FROM_PATTERNS = [
  /depuis\s+(.+?)(?:\s+(?:vers|pour|jusqu'à|à|jusqu'a)|\s*$)/i,
  /de\s+(.+?)\s+(?:vers|pour|jusqu'à|à|jusqu'a)\s+/i,
  /(?:partir|départ)\s+(?:de|depuis)\s+(.+?)(?:\s+(?:vers|pour|à)|\s*$)/i,
];
const TO_PATTERNS = [
  /(?:aller|aller à|vers|pour|jusqu'à|jusqu'a|destination)\s+(.+?)(?:\s+depuis|\s+de\s|\s*$)/i,
  /(?:jusqu'à|jusqu'a|à)\s+(.+?)(?:\s+depuis|\s+de\s|\s*$)/i,
  /\bà\s+(.+?)(?:\s+depuis|\s+de\s|\s*$)/i,
];

function extractPlaces(q: string): { fromText?: string; toText?: string } {
  let fromText: string | undefined;
  let toText: string | undefined;

  for (const p of FROM_PATTERNS) {
    const m = q.match(p);
    if (m?.[1]) { fromText = m[1].trim(); break; }
  }
  for (const p of TO_PATTERNS) {
    const m = q.match(p);
    if (m?.[1]) { toText = m[1].trim(); break; }
  }

  // Fallback: "X vers Y" simple
  if (!fromText && !toText) {
    const vers = q.match(/(.+?)\s+(?:vers|pour|à)\s+(.+)/i);
    if (vers) { fromText = vers[1].trim(); toText = vers[2].trim(); }
  }

  return { fromText, toText };
}

function resolveStop(text: string, userLat?: number, userLng?: number): Stop | null {
  const results = searchLocal(text, userLat, userLng, 1);
  if (!results.length) return null;
  const r = results[0];
  if (r.type === 'stop') return r.stop!;
  if (r.nearestStop) return r.nearestStop;
  return null;
}

const SUGGESTIONS = [
  'Comment aller à Sandaga depuis UCAD ?',
  'Aller à l\'hôpital Principal depuis Parcelles',
  'Trajet de Ouakam à la Gare Routière',
  'Comment aller à la plage de Yoff ?',
];

export default function ChatBot() {
  const dispatch = useAppDispatch();
  const { userLocation } = useAppSelector(s => s.mobility);
  const [open, setOpen]     = useState(false);
  const [input, setInput]   = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Bonjour ! Demandez-moi un itinéraire en langage naturel 😊\nEx: "Comment aller à Sandaga depuis UCAD ?"' }
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleSend = (text = input.trim()) => {
    if (!text) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text }]);
    setLoading(true);

    setTimeout(() => {
      const q = text.toLowerCase();

      // Detect greeting
      if (/^(bonjour|salut|hello|hi|bonsoir)\b/.test(q)) {
        setMessages(m => [...m, { role: 'bot', text: 'Bonjour ! Comment puis-je vous aider ? Dites-moi où vous souhaitez aller 😊' }]);
        setLoading(false);
        return;
      }

      // Detect "merci"
      if (/\bmerci\b/.test(q)) {
        setMessages(m => [...m, { role: 'bot', text: 'De rien ! Bon voyage 🚌' }]);
        setLoading(false);
        return;
      }

      const { fromText, toText } = extractPlaces(text);
      const userLat = userLocation?.[0];
      const userLng = userLocation?.[1];

      const originStop = fromText ? resolveStop(fromText, userLat, userLng) : null;
      const destStop   = toText   ? resolveStop(toText,   userLat, userLng) : null;

      if (!fromText && !toText) {
        setMessages(m => [...m, { role: 'bot', text: 'Je n\'ai pas compris votre demande. Essayez :\n"Aller à [destination] depuis [départ]"' }]);
        setLoading(false);
        return;
      }

      if (destStop && !originStop) {
        dispatch(setRouteDestination(destStop));
        dispatch(setActiveTab('plan'));
        setMessages(m => [...m, { role: 'bot', text: `Destination trouvée : **${destStop.name}**\nIndiquez votre point de départ dans l'onglet Planifier 🗺️`, stops: { dest: destStop } }]);
        setLoading(false);
        return;
      }

      if (originStop && !destStop) {
        dispatch(setRouteOrigin(originStop));
        dispatch(setActiveTab('plan'));
        setMessages(m => [...m, { role: 'bot', text: `Départ : **${originStop.name}**\nIndiquez votre destination dans l'onglet Planifier 🗺️`, stops: { origin: originStop } }]);
        setLoading(false);
        return;
      }

      if (originStop && destStop) {
        dispatch(setRouteOrigin(originStop));
        dispatch(setRouteDestination(destStop));
        dispatch(setActiveTab('plan'));
        setMessages(m => [...m, {
          role: 'bot',
          text: `Itinéraire trouvé !\n🟢 Départ : **${originStop.name}**\n🔴 Arrivée : **${destStop.name}**\n\nCalcul en cours dans l'onglet Planifier... 🗺️`,
          stops: { origin: originStop, dest: destStop }
        }]);
        dispatch(showToast({ type: 'success', message: `Itinéraire : ${originStop.name} → ${destStop.name}` }));
        setLoading(false);
        return;
      }

      setMessages(m => [...m, { role: 'bot', text: `Désolé, je n'ai pas trouvé "${toText || fromText}" dans ma base de données.\nEssayez un nom d'arrêt ou de quartier connu.` }]);
      setLoading(false);
    }, 600);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-24 right-4 z-[9999] w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-2xl transition-all hover:scale-110 active:scale-95"
        style={{
          background: open ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
          boxShadow: open ? '0 8px 32px rgba(124,58,237,.5)' : '0 8px 32px rgba(37,99,235,.5)',
        }}>
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-40 right-4 z-[9998] w-80 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-slide-up"
          style={{
            maxHeight: '60vh',
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border2)',
            boxShadow: '0 24px 64px rgba(0,0,0,.6)',
          }}>

          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#2563eb22,#7c3aed18)', borderBottom: '1px solid var(--c-border)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>🤖</div>
            <div>
              <div className="text-sm font-black text-white">Assistant SunuBus</div>
              <div className="text-[10px]" style={{ color: '#64748b' }}>Langage naturel · IA locale</div>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-green-400" style={{ animation: 'live-pulse 2s infinite' }} />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ scrollbarWidth: 'none' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-snug whitespace-pre-wrap"
                  style={msg.role === 'user'
                    ? { background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white', borderBottomRightRadius: 6 }
                    : { background: 'var(--c-surface2)', color: 'var(--c-text)', borderBottomLeftRadius: 6, border: '1px solid var(--c-border)' }}>
                  {msg.text}
                  {msg.stops?.origin && (
                    <div className="mt-1.5 text-[10px] px-2 py-1 rounded-lg" style={{ background: '#05966920', color: '#34d399' }}>
                      🟢 {msg.stops.origin.name}
                    </div>
                  )}
                  {msg.stops?.dest && (
                    <div className="mt-1 text-[10px] px-2 py-1 rounded-lg" style={{ background: '#dc262620', color: '#f87171' }}>
                      🔴 {msg.stops.dest.name}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-1 px-3 py-2.5 rounded-2xl" style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)' }}>
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: '#7c3aed', animation: `bounce 1s ${i*0.15}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
              {SUGGESTIONS.slice(0, 2).map((s, i) => (
                <button key={i} onClick={() => handleSend(s)}
                  className="text-[10px] font-semibold px-2.5 py-1.5 rounded-xl flex-shrink-0 transition-all active:scale-95"
                  style={{ background: 'rgba(37,99,235,.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,.25)' }}>
                  {s.length > 35 ? s.slice(0, 35) + '…' : s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 flex gap-2 flex-shrink-0" style={{ borderTop: '1px solid var(--c-border)', paddingTop: 10 }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Comment aller à… ?"
              className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--c-surface2)',
                border: '1.5px solid var(--c-border)',
                color: 'var(--c-text)',
              }}
            />
            <button onClick={() => handleSend()}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all active:scale-90"
              style={{
                background: input.trim() ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : 'rgba(255,255,255,.06)',
                color: input.trim() ? 'white' : '#475569',
              }}>
              ↗
            </button>
          </div>
        </div>
      )}
    </>
  );
}
