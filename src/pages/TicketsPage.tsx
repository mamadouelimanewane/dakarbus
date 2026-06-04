import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { buyTicket } from '@/store/store';
import { QRCodeSVG } from 'qrcode.react';

export default function TicketsPage() {
  const dispatch = useAppDispatch();
  const { myTickets } = useAppSelector(s => s.tickets);
  const [tab, setTab] = useState<'buy' | 'wallet'>('wallet');

  const [buyOp, setBuyOp] = useState<'DDD' | 'AFTU' | 'BRT' | 'TER'>('DDD');
  const [buyPrice, setBuyPrice] = useState(200);

  const handleBuy = () => {
    dispatch(buyTicket({ operator: buyOp, price: buyPrice }));
    setTab('wallet');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden">
      <div className="p-4 bg-slate-800/50 border-b border-slate-700 shrink-0">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <span>🎟️</span> Billetterie
        </h2>
        <div className="flex gap-2 mt-4">
          <button 
            onClick={() => setTab('wallet')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${tab === 'wallet' ? 'bg-brand-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            Mes Billets
          </button>
          <button 
            onClick={() => setTab('buy')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${tab === 'buy' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            Acheter
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'wallet' && (
          <div className="space-y-4 pb-20">
            {myTickets.length === 0 ? (
              <div className="text-center text-slate-500 mt-10">
                <div className="text-4xl mb-3">🎫</div>
                <p>Aucun billet pour le moment.</p>
              </div>
            ) : (
              myTickets.map(t => (
                <div key={t.id} className="bg-white rounded-2xl p-4 shadow-xl flex flex-col items-center relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-2 ${t.status === 'valid' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                  <h3 className="font-black text-slate-800 text-lg">{t.operator} - {t.price} FCFA</h3>
                  <p className="text-xs text-slate-500 mb-4">{new Date(t.purchaseTime).toLocaleString('fr-FR')}</p>
                  
                  <div className={`p-2 bg-white rounded-xl ${t.status === 'used' ? 'opacity-30' : ''}`}>
                    <QRCodeSVG value={t.qrData} size={150} level="M" />
                  </div>
                  
                  {t.status === 'used' ? (
                    <div className="mt-4 font-bold text-slate-400 bg-slate-100 px-4 py-1 rounded-full text-sm">UTILISÉ</div>
                  ) : (
                    <div className="mt-4 font-bold text-green-600 bg-green-50 px-4 py-1 rounded-full text-sm animate-pulse">VALIDE</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'buy' && (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Choisissez le réseau</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { op: 'DDD', p: 200, c: 'bg-blue-600' },
                  { op: 'AFTU', p: 150, c: 'bg-yellow-500' },
                  { op: 'BRT', p: 300, c: 'bg-orange-500' },
                  { op: 'TER', p: 500, c: 'bg-slate-800' }
                ].map(x => (
                  <button 
                    key={x.op}
                    onClick={() => { setBuyOp(x.op as any); setBuyPrice(x.p); }}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${buyOp === x.op ? `border-${x.c.split('-')[1]}-500 ${x.c} text-white` : 'border-slate-700 bg-slate-800 text-slate-300'}`}
                  >
                    <span className="font-black">{x.op}</span>
                    <span className="text-xs opacity-80">{x.p} FCFA</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Moyen de paiement</label>
              <div className="space-y-3">
                <button onClick={handleBuy} className="w-full flex items-center justify-between p-4 rounded-xl bg-[#00a8cc] hover:bg-[#0090b0] text-white transition-colors">
                  <span className="font-bold">Payer avec Wave 🌊</span>
                  <span className="font-black">{buyPrice} F</span>
                </button>
                <button onClick={handleBuy} className="w-full flex items-center justify-between p-4 rounded-xl bg-[#ff6600] hover:bg-[#e05a00] text-white transition-colors">
                  <span className="font-bold">Orange Money 🟠</span>
                  <span className="font-black">{buyPrice} F</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
