import React from 'react';
import { REPORT_TYPES } from '@/data/transportData';

export default function AlertsPage() {
  const alerts = [
    { id: 1, type: 'retard', title: 'Trafic dense sur VDN', desc: 'Retards moyens de 15min sur les lignes L8, L9 et A3.', time: 'Il y a 10 min' },
    { id: 2, type: 'degrade', title: 'Arrêt UCAD déplacé', desc: 'Travaux en cours. L\'arrêt est reculé de 50m vers Fann.', time: 'Il y a 1h' },
    { id: 3, type: 'bonde', title: 'Forte affluence TER', desc: 'Gare de Rufisque très fréquentée. Prévoyez de l\'attente.', time: 'Il y a 2h' },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div className="bg-orange-500/20 border border-orange-500/30 rounded-2xl p-4">
        <h3 className="font-black text-orange-400 text-sm mb-1 flex items-center gap-2">
          <span>⚠️</span> Info Réseau
        </h3>
        <p className="text-xs text-orange-200">En raison d'un événement sportif au Stade Abdoulaye Wade, les lignes AFTU vers Diamniadio sont renforcées ce weekend.</p>
      </div>

      <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mt-2">Derniers signalements</h2>
      
      <div className="space-y-3">
        {alerts.map(alert => {
          const typeInfo = REPORT_TYPES.find(t => t.id === alert.type) || REPORT_TYPES[0];
          return (
            <div key={alert.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: typeInfo.color + '30' }}>
                  {typeInfo.emoji}
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm">{alert.title}</h4>
                  <p className="text-[10px] text-slate-400">{alert.time}</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 pl-11">{alert.desc}</p>
            </div>
          );
        })}
      </div>

      <button className="mt-4 w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
        <span>🚨</span> Signaler un incident
      </button>
    </div>
  );
}
