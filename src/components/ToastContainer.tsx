import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { dismissToast } from '@/store/store';

const CONFIG = {
  success: { bg: '#059669', border: '#10b981', icon: '✓' },
  error:   { bg: '#dc2626', border: '#ef4444', icon: '✕' },
  info:    { bg: '#2563eb', border: '#3b82f6', icon: 'ℹ' },
  warning: { bg: '#d97706', border: '#f59e0b', icon: '⚠' },
};

function ToastItem({ toast }: { toast: { id: string; type: keyof typeof CONFIG; message: string } }) {
  const dispatch = useAppDispatch();
  const cfg = CONFIG[toast.type];

  useEffect(() => {
    const t = setTimeout(() => dispatch(dismissToast(toast.id)), 3800);
    return () => clearTimeout(t);
  }, [toast.id, dispatch]);

  return (
    <div
      className="flex items-center gap-3 pr-4 pl-3 py-3 rounded-2xl font-semibold text-sm text-white animate-slide-right"
      style={{
        background: `linear-gradient(135deg, ${cfg.bg}ee, ${cfg.bg}cc)`,
        border: `1px solid ${cfg.border}66`,
        boxShadow: `0 8px 32px ${cfg.bg}55`,
        minWidth: 240, maxWidth: 340,
      }}>
      <div className="w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
        style={{ background: 'rgba(255,255,255,.2)' }}>
        {cfg.icon}
      </div>
      <span className="flex-1 text-xs font-semibold leading-snug">{toast.message}</span>
      <button onClick={() => dispatch(dismissToast(toast.id))}
        className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] flex-shrink-0 transition-all hover:scale-110"
        style={{ background: 'rgba(255,255,255,.2)' }}>✕</button>
    </div>
  );
}

export default function ToastContainer() {
  const { items } = useAppSelector(s => s.toasts);
  if (!items.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {items.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t as any} />
        </div>
      ))}
    </div>
  );
}
