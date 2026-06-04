import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addReport, upvoteReport } from '@/store/store';
import { REPORT_TYPES } from '@/data/transportData';

export default function AlertsPage() {
  const dispatch = useAppDispatch();
  const { reports } = useAppSelector(s => s.tickets);
  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<'delay' | 'accident' | 'crowd' | 'other'>('delay');

  const handleSubmit = () => {
    if (!desc.trim()) return;
    dispatch(addReport({
      id: Math.random().toString(36).substr(2, 9),
      type,
      description: desc,
      location: [14.7, -17.45], // Mock loc
      timestamp: Date.now(),
      upvotes: 0
    }));
    setShowForm(false);
    setDesc('');
  };
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
        {reports.map(report => {
          const typeInfo = {
            delay: { emoji: '🐌', color: '#f59e0b', title: 'Retard / Bouchon' },
            accident: { emoji: '💥', color: '#dc2626', title: 'Accident' },
            crowd: { emoji: '👥', color: '#3b82f6', title: 'Forte affluence' },
            other: { emoji: '⚠️', color: '#64748b', title: 'Autre incident' }
          }[report.type] || { emoji: '⚠️', color: '#64748b', title: 'Incident' };
          
          const minAgo = Math.floor((Date.now() - report.timestamp) / 60000);
          
          return (
            <div key={report.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: typeInfo.color + '30' }}>
                  {typeInfo.emoji}
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm">{typeInfo.title}</h4>
                  <p className="text-[10px] text-slate-400">Il y a {minAgo} min</p>
                </div>
                <button 
                  onClick={() => dispatch(upvoteReport(report.id))}
                  className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-xs font-bold text-slate-300 transition-colors flex items-center gap-1"
                >
                  👍 {report.upvotes}
                </button>
              </div>
              <p className="text-xs text-slate-300 pl-11">{report.description}</p>
            </div>
          );
        })}
      </div>

      {!showForm ? (
        <button 
          onClick={() => setShowForm(true)}
          className="mt-4 w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          <span>🚨</span> Signaler un incident
        </button>
      ) : (
        <div className="mt-4 bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <h3 className="font-black text-white text-sm mb-3">Nouveau signalement</h3>
          <select 
            value={type} 
            onChange={e => setType(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm mb-3"
          >
            <option value="delay">🐌 Retard / Bouchon</option>
            <option value="accident">💥 Accident</option>
            <option value="crowd">👥 Forte affluence</option>
            <option value="other">⚠️ Autre</option>
          </select>
          <textarea 
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Décrivez l'incident..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm mb-3 h-20 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-xl text-sm font-bold">Envoyer</button>
            <button onClick={() => setShowForm(false)} className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded-xl text-sm font-bold">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
