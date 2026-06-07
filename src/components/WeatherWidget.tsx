import React, { useState, useEffect } from 'react';

// Météo réaliste Dakar — simulée selon saison + heure
function getDakarWeather() {
  const h = new Date().getHours();
  const m = new Date().getMonth(); // 0-11
  // Saison sèche : nov-mai | saison des pluies : juin-oct
  const rainy = m >= 5 && m <= 9;
  const hot   = m >= 3 && m <= 10;

  const conditions = rainy
    ? h >= 14 && h <= 19 ? [{ icon: '⛈️', label: 'Orages possibles', color: '#7c3aed', tip: 'Prévoir retards bus 15–30 min' },
                             { icon: '🌦️', label: 'Averses',           color: '#3b82f6', tip: 'Prendre parapluie' }]
    : [{ icon: '🌤️', label: 'Partiellement nuageux', color: '#0ea5e9', tip: 'Bonne visibilité' }]
    : h >= 12 && h <= 16 ? [{ icon: '🌞', label: 'Forte chaleur', color: '#f59e0b', tip: 'Hydratez-vous, bus chargés' }]
    : [{ icon: '☀️', label: 'Ensoleillé',   color: '#fbbf24', tip: 'Conditions normales' }];

  const cond = conditions[Math.floor(Math.random() * conditions.length)];
  const baseTemp = hot ? (rainy ? 28 : 32) : 24;
  const temp = baseTemp + (h >= 12 && h <= 16 ? 3 : h < 6 || h >= 22 ? -4 : 0);
  const wind = rainy ? Math.floor(Math.random() * 20 + 15) : Math.floor(Math.random() * 12 + 5);
  const humidity = rainy ? Math.floor(Math.random() * 20 + 70) : Math.floor(Math.random() * 20 + 45);

  return { ...cond, temp, wind, humidity };
}

export default function WeatherWidget() {
  const [wx, setWx] = useState(getDakarWeather);

  useEffect(() => {
    const id = setInterval(() => setWx(getDakarWeather()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: `${wx.color}10`, border: `1px solid ${wx.color}25` }}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{wx.icon}</span>
          <div>
            <div className="flex items-end gap-1.5">
              <span className="text-2xl font-black text-white leading-none">{wx.temp}°</span>
              <span className="text-xs font-bold mb-0.5" style={{ color: wx.color }}>Dakar</span>
            </div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: '#64748b' }}>{wx.label}</div>
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className="text-[10px] font-bold" style={{ color: '#475569' }}>💨 {wx.wind} km/h</div>
          <div className="text-[10px] font-bold" style={{ color: '#475569' }}>💧 {wx.humidity}%</div>
        </div>
      </div>
      {wx.tip && (
        <div className="px-4 py-2 text-[11px] font-bold"
          style={{ borderTop: `1px solid ${wx.color}20`, color: wx.color, background: `${wx.color}08` }}>
          ⚡ {wx.tip}
        </div>
      )}
    </div>
  );
}
