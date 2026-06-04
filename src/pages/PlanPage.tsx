import React from 'react';
import RoutePanel from '@/components/RoutePanel';

export default function PlanPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <RoutePanel />
      
      <div className="p-4 mt-4">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
            <span>🎫</span> Tarifs & Info
          </h3>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between items-center">
              <span>DDD Bus</span>
              <span className="font-bold text-white">200 FCFA</span>
            </div>
            <div className="flex justify-between items-center">
              <span>AFTU Car Rapide</span>
              <span className="font-bold text-white">150 FCFA</span>
            </div>
            <div className="flex justify-between items-center">
              <span>BRT</span>
              <span className="font-bold text-white">300 FCFA</span>
            </div>
            <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-2">
              <span>TER (Zone 1)</span>
              <span className="font-bold text-white">500 FCFA</span>
            </div>
            
            <div className="pt-3">
              <button 
                onClick={() => document.dispatchEvent(new CustomEvent('navToTickets'))}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>💳</span> Acheter un M-Ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
