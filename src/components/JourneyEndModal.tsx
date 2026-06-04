import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { finishJourney, dismissEndModal, setRouteOrigin, setRouteDestination, startJourney, setActiveTab, showToast } from '@/store/store';
import { LINES } from '@/data/transportData';
import { walkingMinutes } from '@/utils/nearest';
import type { ActiveJourney } from '@/types';

function StatBubble({ icon, value, unit, label }: { icon: string; value: string | number; unit?: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
      <span className="text-2xl">{icon}</span>
      <div className="font-black text-white text-xl leading-none">{value}<span className="text-sm font-semibold ml-0.5" style={{ color: '#64748b' }}>{unit}</span></div>
      <span className="text-[10px] font-medium" style={{ color: '#475569' }}>{label}</span>
    </div>
  );
}

const MILESTONES = [
  { trips: 1,  badge: '🌱', label: 'Premier voyage !' },
  { trips: 5,  badge: '⭐', label: '5 voyages' },
  { trips: 10, badge: '🏅', label: '10 voyages — Bronze' },
  { trips: 25, badge: '🥈', label: '25 voyages — Argent' },
  { trips: 50, badge: '🥇', label: '50 voyages — Or' },
];

export default function JourneyEndModal() {
  const dispatch = useAppDispatch();
  const { active, showEndModal, history } = useAppSelector(s => s.journey);
  const { tripCount } = useAppSelector(s => s.favorites);

  if (!showEndModal || !active) return null;

  const elapsedMin = Math.max(1, Math.round((Date.now() - active.startedAt) / 60000));
  const co2 = (active.estimatedDuration * 0.008).toFixed(2);
  const km  = (active.estimatedDuration * 0.35).toFixed(1); // ~21km/h avg
  const newTotal = tripCount + 1;
  const milestone = [...MILESTONES].reverse().find(m => m.trips === newTotal);

  const handleFinish = () => {
    dispatch(finishJourney());
    dispatch(setActiveTab('plan'));
  };

  const handleRepeat = () => {
    dispatch(finishJourney());
    // Re-fill origin & destination
    dispatch(setRouteOrigin(active.originStop));
    dispatch(setRouteDestination(active.destinationStop));
    dispatch(setActiveTab('plan'));
    dispatch(showToast({ type: 'info', message: 'Trajet pré-rempli — relancez le calcul !' }));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(16px)' }}>

      <div className="w-full max-w-sm rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border2)', boxShadow: 'var(--shadow-xl)' }}>

        {/* Hero */}
        <div className="p-6 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, rgba(124,58,237,.3) 0%, rgba(37,99,235,.2) 100%)' }}>
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            {['🚌','🌿','⭐'].map((e, i) => (
              <div key={i} className="absolute text-4xl" style={{ top: `${15 + i * 30}%`, left: `${10 + i * 35}%`, transform: 'rotate(-15deg)' }}>{e}</div>
            ))}
          </div>
          <div className="text-5xl mb-3">🏁</div>
          <h2 className="text-2xl font-black text-white">Arrivé !</h2>
          <p className="text-sm mt-1 font-medium" style={{ color: 'rgba(196,181,253,.7)' }}>
            {active.originStop.name} → {active.destinationStop.name}
          </p>
          {milestone && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full animate-fade-up"
              style={{ background: 'rgba(250,204,21,.15)', border: '1px solid rgba(250,204,21,.3)' }}>
              <span className="text-xl">{milestone.badge}</span>
              <span className="text-xs font-black text-yellow-300">{milestone.label}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="p-4 grid grid-cols-2 gap-3">
          <StatBubble icon="⏱️" value={elapsedMin} unit=" min" label="Durée" />
          <StatBubble icon="💰" value={active.fare} unit=" F" label="Dépensé" />
          <StatBubble icon="🌿" value={co2} unit=" kg" label="CO₂ économisé" />
          <StatBubble icon="📏" value={km} unit=" km" label="Distance" />
        </div>

        {/* Message contextuel */}
        <div className="mx-4 mb-4 px-4 py-3 rounded-2xl text-xs text-center"
          style={{ background: 'rgba(5,150,105,.08)', border: '1px solid rgba(5,150,105,.2)', color: 'rgba(52,211,153,.8)' }}>
          🌱 En prenant le bus, vous avez évité {(parseFloat(km) * 0.21).toFixed(1)} kg de CO₂ vs voiture
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2 px-4 pb-6">
          <button onClick={handleRepeat}
            className="w-full py-3.5 rounded-2xl text-sm font-black text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 6px 20px rgba(5,150,105,.35)' }}>
            🔁 Refaire ce trajet
          </button>
          <button onClick={handleFinish}
            className="w-full py-3 rounded-2xl text-sm font-black transition-all active:scale-95 btn btn-ghost">
            Terminer
          </button>
        </div>
      </div>
    </div>
  );
}
