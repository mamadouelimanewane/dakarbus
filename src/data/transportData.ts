import type { Stop, Line, Operator, OperatorId, Departure, ComfortIndex, AffluenceData } from '@/types';

export const OPERATORS: Record<string, Operator> = {
  DDD:  { id:'DDD',  name:'DDD',  fullName:'Dakar Dem Dikk',        icon:'🚌',   color:'#1a56db', bg:'#eff6ff', tarif:200, climatise:false },
  AFTU: { id:'AFTU', name:'AFTU', fullName:'AFTU Car Rapide',        icon:'🚐',   color:'#e11d48', bg:'#fff1f2', tarif:150, climatise:false },
  BRT:  { id:'BRT',  name:'BRT',  fullName:'Bus Rapid Transit',      icon:'🚍',   color:'#7c3aed', bg:'#f5f3ff', tarif:300, climatise:true  },
  TER:  { id:'TER',  name:'TER',  fullName:'Train Express Régional', icon:'🚆', color:'#059669', bg:'#ecfdf5', tarif:500, climatise:true  },
};

export const TER_TARIFS = [
  { from:'Dakar',    to:'Thiaroye',   prix:500,  classe:'2e' },
  { from:'Dakar',    to:'Rufisque',   prix:900,  classe:'2e' },
  { from:'Dakar',    to:'Bargny',     prix:1200, classe:'2e' },
  { from:'Dakar',    to:'Diamniadio', prix:1500, classe:'2e' },
  { from:'Dakar',    to:'AIBD',       prix:2000, classe:'2e' },
  { from:'Dakar',    to:'Sébikotane', prix:2500, classe:'2e' },
  { from:'Dakar',    to:'Thiès',      prix:3000, classe:'2e' },
];

export function getComfortIndex(operatorId: string): ComfortIndex {
  const h = new Date().getHours();
  const op = OPERATORS[operatorId];
  if (!op) return { score:3, label:'Moyen', color:'#d97706', emoji:'🌤️' };
  const isHotHour = h >= 11 && h <= 16;
  const isRush    = (h >= 7 && h <= 9) || (h >= 17 && h <= 20);
  if (op.climatise) {
    return isRush
      ? { score:4, label:'Bon (climatisé, dense)', color:'#059669', emoji:'❄️' }
      : { score:5, label:'Excellent (climatisé)',  color:'#059669', emoji:'❄️' };
  }
  if (isHotHour && isRush) return { score:1, label:'Très chaud + bondé', color:'#dc2626', emoji:'🔥' };
  if (isHotHour) return { score:2, label:'Chaud',   color:'#f59e0b', emoji:'☀️' };
  if (isRush)    return { score:2, label:'Bondé',   color:'#f59e0b', emoji:'👥' };
  if (h >= 20 || h <= 6) return { score:5, label:'Agréable (frais)', color:'#059669', emoji:'🌙' };
  return { score:3, label:'Correct', color:'#d97706', emoji:'🌤️' };
}

export function getAffluence(_stopId: string): AffluenceData {
  const now = new Date(); const h = now.getHours(); const day = now.getDay();
  const isRush = (h >= 7 && h <= 9) || (h >= 17 && h <= 20);
  let base = 30;
  if (isRush) base += 40; if (day === 6) base += 20; if (day === 5 && h >= 12 && h <= 14) base += 25;
  if (h >= 22 || h <= 5) base = 10;
  base = Math.min(100, base + Math.floor(Math.random() * 10));
  if (base >= 80) return { level:'Très fréquenté', pct:base, color:'#dc2626', emoji:'🔴', extra:'+15 min' };
  if (base >= 50) return { level:'Fréquenté',      pct:base, color:'#f59e0b', emoji:'🟡', extra:'+5 min'  };
  return            { level:'Calme',             pct:base, color:'#059669', emoji:'🟢', extra:''        };
}

export function getTerSchedule(gareName: string): { time: string; waitMin: number; direction: string }[] {
  const now = new Date(); const h = now.getHours(); const m = now.getMinutes();
  const currentMin = h * 60 + m;
  const start = gareName === 'Dakar' ? 270 : gareName === 'AIBD' ? 300 : 285;
  const end   = gareName === 'Dakar' ? 1410 : 1380;
  const trains: { time: string; waitMin: number; direction: string }[] = [];
  for (let t = start; t <= end; t += 30) {
    if (t >= currentMin - 5) {
      const hh = String(Math.floor(t / 60)).padStart(2, '0');
      const mm = String(t % 60).padStart(2, '0');
      trains.push({ time:`${hh}:${mm}`, waitMin: Math.max(0, t - currentMin), direction: t % 60 === 0 ? 'AIBD →' : '← Dakar' });
      if (trains.length >= 5) break;
    }
  }
  return trains;
}

// ══════════════════════════════════════════════════════════════
//  ARRÊTS — région dakaroise (~80 points)
// ══════════════════════════════════════════════════════════════
export const STOPS: Stop[] = [

  // ── PLATEAU / CENTRE-VILLE ────────────────────────────────
  { id:'p01', name:'Gare Palais (Rebeuss)',      zone:'Plateau',    lat:14.6697, lng:-17.4386, operators:['DDD','TER'],        lines:['L6','L7','L8','L9','L10','L12','L15','L16A','L20','L23','L45','TER-01'] },
  { id:'p02', name:'Avenue Petersen',            zone:'Plateau',    lat:14.6811, lng:-17.4464, operators:['DDD','AFTU','BRT'], lines:['A2','A3','A5','A25','A27','A55','BRT-L1'] },
  { id:'p03', name:'Sandaga',                    zone:'Plateau',    lat:14.6756, lng:-17.4436, operators:['DDD'],              lines:['L6','L7','L9','L10','L12'] },
  { id:'p04', name:'Colobane Gare',              zone:'Médina',     lat:14.6908, lng:-17.4478, operators:['DDD','AFTU'],       lines:['L9','A2','A3','A30','A33','A75'] },
  { id:'p05', name:'Tilène',                     zone:'Médina',     lat:14.6788, lng:-17.4428, operators:['DDD'],              lines:['L9','L10','L23'] },
  { id:'p06', name:'Lat Dior (UCAD)',            zone:'Fann',       lat:14.6944, lng:-17.4594, operators:['AFTU'],             lines:['A1','A34','A36'] },
  { id:'p07', name:'Fann Résidence',             zone:'Fann',       lat:14.6933, lng:-17.4669, operators:['DDD','AFTU'],       lines:['L10','A24','A36'] },
  { id:'p08', name:'Place de l\'Indépendance',   zone:'Plateau',    lat:14.6706, lng:-17.4428, operators:['DDD'],              lines:['L6','L7','L8','L15'] },
  { id:'p09', name:'Kermel Marché',              zone:'Plateau',    lat:14.6744, lng:-17.4403, operators:['DDD','AFTU'],       lines:['L9','A30'] },
  { id:'p10', name:'Hôpital Principal',          zone:'Plateau',    lat:14.6725, lng:-17.4447, operators:['DDD'],              lines:['L6','L15'] },
  { id:'p11', name:'Médina Marché',              zone:'Médina',     lat:14.6858, lng:-17.4442, operators:['DDD','AFTU'],       lines:['L9','A30','A33'] },
  { id:'p12', name:'Corniche Ouest',             zone:'Plateau',    lat:14.6856, lng:-17.4756, operators:['AFTU'],             lines:['A36','A49'] },
  { id:'p13', name:'Fann Hôpital',               zone:'Fann',       lat:14.6953, lng:-17.4631, operators:['AFTU'],             lines:['A24','A36'] },
  { id:'p14', name:'UCAD Université',            zone:'Fann',       lat:14.6922, lng:-17.4572, operators:['DDD','AFTU'],       lines:['L10','A34','A36'] },
  { id:'p15', name:'Avenue Bourguiba',           zone:'Plateau',    lat:14.6736, lng:-17.4417, operators:['DDD'],              lines:['L6','L8','L9'] },

  // ── LIBERTÉ / SICAP / HLM ────────────────────────────────
  { id:'lc1', name:'Leclerc Terminus',           zone:'Liberté',    lat:14.7117, lng:-17.4567, operators:['DDD'],              lines:['L1A','L2A','L4','L11','L14','L20','L121'] },
  { id:'lc2', name:'HLM Grand Yoff',             zone:'HLM',        lat:14.7183, lng:-17.4553, operators:['DDD','AFTU'],       lines:['L121','A1'] },
  { id:'lb5', name:'Terminus Liberté 5',         zone:'Liberté 5',  lat:14.7242, lng:-17.4528, operators:['DDD'],              lines:['L1A','L2A','L4','L10','L13','L18','L20','L23'] },
  { id:'lb6', name:'Rond-Point Liberté 6',       zone:'Liberté 6',  lat:14.7200, lng:-17.4450, operators:['DDD','AFTU'],       lines:['L6','L9','L13','A2','A3','A27','A33','A57'] },
  { id:'lb1', name:'Liberté 1',                  zone:'Liberté 1',  lat:14.7083, lng:-17.4519, operators:['DDD'],              lines:['L4','L10','L13','L18'] },
  { id:'lb2', name:'Liberté 2',                  zone:'Liberté 2',  lat:14.7117, lng:-17.4489, operators:['DDD'],              lines:['L10','L13'] },
  { id:'lb3', name:'Liberté 3',                  zone:'Liberté 3',  lat:14.7150, lng:-17.4467, operators:['DDD'],              lines:['L4','L13','L18'] },
  { id:'sc1', name:'Sicap Liberté',              zone:'Sicap',      lat:14.7133, lng:-17.4603, operators:['DDD'],              lines:['L4','L10','L13','L18'] },
  { id:'sc2', name:'Sicap Baobab',               zone:'Sicap',      lat:14.7072, lng:-17.4592, operators:['DDD','AFTU'],       lines:['L10','A34'] },
  { id:'sc3', name:'Sicap Mermoz',               zone:'Sicap',      lat:14.7022, lng:-17.4608, operators:['DDD','AFTU'],       lines:['L14','A34'] },
  { id:'sc4', name:'Sacré-Cœur',                 zone:'Mermoz',     lat:14.7056, lng:-17.4628, operators:['DDD','AFTU'],       lines:['L14','A34','A36'] },
  { id:'sc5', name:'Dieuppeul',                  zone:'Dieuppeul',  lat:14.7008, lng:-17.4547, operators:['DDD'],              lines:['L13','L14'] },
  { id:'sc6', name:'Grand Dakar',                zone:'Grand Dakar',lat:14.7008, lng:-17.4483, operators:['DDD','AFTU'],       lines:['L13','A30'] },
  { id:'sc7', name:'Stade Léopold Sédar Senghor',zone:'Médina',     lat:14.7067, lng:-17.4492, operators:['DDD'],              lines:['L13','L14'] },
  { id:'sc8', name:'HLM 5',                      zone:'HLM',        lat:14.7228, lng:-17.4522, operators:['DDD'],              lines:['L18','L20'] },
  { id:'po1', name:'Patte d\'Oie',               zone:'Patte d\'Oie',lat:14.7247,lng:-17.4672, operators:['DDD','AFTU'],       lines:['L11','L16A','A5','A29','A72'] },
  { id:'nf1', name:'Nord Foire',                 zone:'Nord Foire', lat:14.7358, lng:-17.4639, operators:['DDD','AFTU'],       lines:['L16A','A29','A50','A72'] },
  { id:'zo1', name:'Zone de Captage',            zone:'Captage',    lat:14.7389, lng:-17.4711, operators:['DDD'],              lines:['L16A','L18'] },
  { id:'cm1', name:'Cité Millionnaire',          zone:'Liberté',    lat:14.7314, lng:-17.4769, operators:['DDD'],              lines:['L18'] },

  // ── GRAND YOFF / OUAKAM / NGOR / ALMADIES ────────────────
  { id:'gy1', name:'Grand Yoff Terminus',        zone:'Grand Yoff', lat:14.7268, lng:-17.4553, operators:['DDD','AFTU'],       lines:['L20','L121','A3','A35','A42','A72'] },
  { id:'ok1', name:'Ouakam Terminus',            zone:'Ouakam',     lat:14.7186, lng:-17.4994, operators:['DDD','AFTU'],       lines:['L7','A35','A36','A42','A44','A61','A72'] },
  { id:'ng1', name:'Ngor Village',               zone:'Ngor',       lat:14.7461, lng:-17.5097, operators:['AFTU'],             lines:['A35','A49','A61'] },
  { id:'al1', name:'Almadies',                   zone:'Almadies',   lat:14.7472, lng:-17.5189, operators:['AFTU'],             lines:['A49','A61'] },
  { id:'al2', name:'Almadies Plage',             zone:'Almadies',   lat:14.7503, lng:-17.5228, operators:['AFTU'],             lines:['A49'] },

  // ── YOFF / AÉROPORT ──────────────────────────────────────
  { id:'yf1', name:'Yoff Village',               zone:'Yoff',       lat:14.7467, lng:-17.4903, operators:['DDD','AFTU'],       lines:['L8','A3','A4','A66'] },
  { id:'yf2', name:'Yoff Aéroport (ancien)',     zone:'Yoff',       lat:14.7403, lng:-17.4914, operators:['DDD'],              lines:['L8'] },
  { id:'yf3', name:'Yoff Tonghor',               zone:'Yoff',       lat:14.7519, lng:-17.4847, operators:['AFTU'],             lines:['A4','A66'] },

  // ── PARCELLES ASSAINIES / CAMBÉRÈNE ──────────────────────
  { id:'pa1', name:'Terminus Parcelles',         zone:'Parcelles',  lat:14.7583, lng:-17.4308, operators:['DDD','AFTU'],       lines:['L1A','L6','L23','A2','A5','A25','A29','A72'] },
  { id:'pa2', name:'Parcelles Unité 17',         zone:'Parcelles',  lat:14.7533, lng:-17.4275, operators:['DDD'],              lines:['L1A','L23'] },
  { id:'pa3', name:'Parcelles Unité 10',         zone:'Parcelles',  lat:14.7483, lng:-17.4333, operators:['DDD'],              lines:['L23'] },
  { id:'pa4', name:'Parcelles Unité 26',         zone:'Parcelles',  lat:14.7617, lng:-17.4325, operators:['DDD','AFTU'],       lines:['L6','A29'] },
  { id:'pa5', name:'Parcelles Garage',           zone:'Parcelles',  lat:14.7500, lng:-17.4317, operators:['DDD'],              lines:['L1A','L23'] },
  { id:'cb1', name:'Cambérène Cité Nations',     zone:'Cambérène',  lat:14.7633, lng:-17.4292, operators:['DDD','AFTU'],       lines:['L6','A29','A50','A72'] },
  { id:'cb2', name:'Cambérène CRSE',             zone:'Cambérène',  lat:14.7567, lng:-17.4297, operators:['AFTU'],             lines:['A29','A50'] },
  { id:'dk1', name:'Daroukhane Terminus',        zone:'Daroukhane', lat:14.7850, lng:-17.4175, operators:['DDD','AFTU'],       lines:['L2A','A70'] },

  // ── GUÉDIAWAYE ───────────────────────────────────────────
  { id:'gd1', name:'Guédiawaye Marché',          zone:'Guédiawaye', lat:14.7769, lng:-17.3986, operators:['DDD','BRT','AFTU'], lines:['L2A','L11','L12','L16A','BRT-L1','A27','A33','A42','A61','A64'] },
  { id:'gd2', name:'Wakhinane Nimzat',           zone:'Guédiawaye', lat:14.7833, lng:-17.4025, operators:['DDD'],              lines:['L12','L16A'] },
  { id:'gd3', name:'Sam Notaire',                zone:'Guédiawaye', lat:14.7672, lng:-17.4072, operators:['DDD','AFTU'],       lines:['L11','L12','A64'] },
  { id:'gd4', name:'Golf Sud',                   zone:'Guédiawaye', lat:14.7808, lng:-17.3942, operators:['DDD','BRT'],        lines:['L12','BRT-L1'] },
  { id:'gd5', name:'Médina Gounass',             zone:'Guédiawaye', lat:14.7906, lng:-17.3956, operators:['DDD','AFTU'],       lines:['L16A','A27'] },

  // ── PIKINE ───────────────────────────────────────────────
  { id:'pk1', name:'Pikine Gare Routière',       zone:'Pikine',     lat:14.7499, lng:-17.3858, operators:['DDD','BRT','AFTU'], lines:['L12','L15','L45','BRT-L1','A35','A52','A55','A64'] },
  { id:'pk2', name:'Tound Pikine',               zone:'Pikine',     lat:14.7467, lng:-17.3656, operators:['AFTU'],             lines:['A52','A68'] },
  { id:'pk3', name:'Dalifort Forail',            zone:'Pikine',     lat:14.7533, lng:-17.3717, operators:['DDD','AFTU'],       lines:['L45','A52'] },
  { id:'pk4', name:'Djiddah Thiaroye Kao',       zone:'Pikine',     lat:14.7408, lng:-17.3542, operators:['AFTU'],             lines:['A68','A57'] },

  // ── HANN / ZONE INDUSTRIELLE ─────────────────────────────
  { id:'bm1', name:'Baux Maraîchers',            zone:'Hann',       lat:14.7192, lng:-17.3997, operators:['DDD','AFTU'],       lines:['L8','L9','A51'] },
  { id:'ha2', name:'Front de Terre',             zone:'Hann',       lat:14.7172, lng:-17.4069, operators:['DDD'],              lines:['L8','L9','L15','L45'] },
  { id:'ha3', name:'Hann Bel-Air',               zone:'Hann',       lat:14.7225, lng:-17.4100, operators:['DDD','AFTU'],       lines:['L8','A51'] },
  { id:'ha4', name:'Zone Industrielle Hann',     zone:'Hann',       lat:14.7197, lng:-17.3994, operators:['DDD'],              lines:['L45','L15'] },

  // ── THIAROYE / YEUMBEUL / KEUR MASSAR ───────────────────
  { id:'th1', name:'Thiaroye Marché',            zone:'Thiaroye',   lat:14.7358, lng:-17.3533, operators:['DDD','TER'],        lines:['L15','TER-01'] },
  { id:'th2', name:'Thiaroye sur Mer',           zone:'Thiaroye',   lat:14.7283, lng:-17.3508, operators:['AFTU'],             lines:['A57','A68'] },
  { id:'km1', name:'Keur Massar Marché',         zone:'Keur Massar',lat:14.7833, lng:-17.3183, operators:['DDD','AFTU'],       lines:['L11','A52','A61','A65'] },
  { id:'km2', name:'Yeumbeul',                   zone:'Yeumbeul',   lat:14.7633, lng:-17.3500, operators:['AFTU'],             lines:['A26','A52','A68'] },
  { id:'km3', name:'Keur Mbaye Fall',            zone:'Keur Massar',lat:14.7625, lng:-17.3789, operators:['AFTU'],             lines:['A52','A65'] },
  { id:'ml1', name:'Malika Terminus',            zone:'Malika',     lat:14.7958, lng:-17.3475, operators:['DDD','AFTU'],       lines:['L16A','A50','A75'] },

  // ── MBAO / RUFISQUE / BARGNY ─────────────────────────────
  { id:'mb1', name:'Grand Mbao',                 zone:'Mbao',       lat:14.7500, lng:-17.2917, operators:['DDD','AFTU'],       lines:['L45','A40','A44'] },
  { id:'mb2', name:'Mbao Marché',                zone:'Mbao',       lat:14.7483, lng:-17.2956, operators:['AFTU'],             lines:['A40','A44'] },
  { id:'rf1', name:'Rufisque Gare Routière',     zone:'Rufisque',   lat:14.7153, lng:-17.2747, operators:['DDD','TER','AFTU'], lines:['L15','TER-01','A40','A55','A57','A64'], terConnection:true },
  { id:'rf2', name:'Rufisque Centre',            zone:'Rufisque',   lat:14.7167, lng:-17.2783, operators:['DDD','AFTU'],       lines:['L15','A55'] },

  // ── BAMBILOR / JAXAAY / KEUR MASSAR EST ─────────────────
  { id:'ba1', name:'Bambilor',                   zone:'Bambilor',   lat:14.8500, lng:-17.2500, operators:['AFTU'],             lines:['A73','A80'] },
  { id:'jx1', name:'Jaxaay',                     zone:'Jaxaay',     lat:14.7900, lng:-17.2200, operators:['AFTU'],             lines:['A51','A56','A65'] },

  // ── BRT DÉDIÉS ───────────────────────────────────────────
  { id:'b01', name:'Petersen (BRT)',             zone:'Plateau',    lat:14.6811, lng:-17.4464, operators:['BRT'],              lines:['BRT-L1'] },
  { id:'b02', name:'Colobane (BRT)',             zone:'Médina',     lat:14.6908, lng:-17.4478, operators:['BRT'],              lines:['BRT-L1'] },
  { id:'b03', name:'Liberté 6 (BRT)',            zone:'Liberté',    lat:14.7200, lng:-17.4558, operators:['BRT'],              lines:['BRT-L1'] },
  { id:'b04', name:'Grand Yoff (BRT)',           zone:'Grand Yoff', lat:14.7268, lng:-17.4553, operators:['BRT'],              lines:['BRT-L1'] },
  { id:'b05', name:'CICES (BRT)',                zone:'CICES',      lat:14.7342, lng:-17.4681, operators:['BRT'],              lines:['BRT-L1'] },
  { id:'b06', name:'Patte d\'Oie (BRT)',         zone:'Patte d\'Oie',lat:14.7247,lng:-17.4672, operators:['BRT'],             lines:['BRT-L1'] },
  { id:'b07', name:'Sam Notaire (BRT)',          zone:'Guédiawaye', lat:14.7672, lng:-17.4072, operators:['BRT'],              lines:['BRT-L1'] },

  // ── TER GARES ────────────────────────────────────────────
  { id:'t01', name:'Dakar Gare TER',             zone:'Plateau',    lat:14.6697, lng:-17.4386, operators:['TER'],              lines:['TER-01'], terConnection:true },
  { id:'t02', name:'Thiaroye Gare TER',          zone:'Thiaroye',   lat:14.7300, lng:-17.3558, operators:['TER'],              lines:['TER-01'], terConnection:true },
  { id:'t03', name:'Rufisque Gare TER',          zone:'Rufisque',   lat:14.7142, lng:-17.2753, operators:['TER'],              lines:['TER-01'], terConnection:true },
  { id:'t04', name:'Bargny Gare TER',            zone:'Bargny',     lat:14.6964, lng:-17.2269, operators:['TER'],              lines:['TER-01'], terConnection:true },
  { id:'t05', name:'Diamniadio Gare TER',        zone:'Diamniadio', lat:14.7289, lng:-17.1742, operators:['TER'],              lines:['TER-01'], terConnection:true },
  { id:'t06', name:'AIBD Aéroport',              zone:'AIBD',       lat:14.7411, lng:-17.0900, operators:['TER'],              lines:['TER-01'], terConnection:true },
  { id:'t07', name:'Sébikotane Gare TER',        zone:'Sébikotane', lat:14.7403, lng:-17.0953, operators:['TER'],              lines:['TER-01'], terConnection:true },
];

// ══════════════════════════════════════════════════════════════
//  LIGNES
// ══════════════════════════════════════════════════════════════

const DDD_LINES: Line[] = [
  // ─ Liaisons Plateau / Centre ────────────────────────────
  // L1 : confirmé OSM (ref=1, "Parcelles - Leclerc")
  { id:'L1A',  name:'Ligne 1',   operator:'DDD', route:'Parcelles ↔ Leclerc',            color:'#1a56db', freq:'8 min',  tarif:200, stops:['pa1','pa5','pa2','pa3','lb5','lc1'] },
  { id:'L2A',  name:'Ligne 2A',  operator:'DDD', route:'Daroukhane ↔ Leclerc',           color:'#2563eb', freq:'10 min', tarif:200, stops:['dk1','gd5','gd2','gd3','gd1','lb5','lc1'] },
  // L4 : confirmé OSM (ref=4, "Leclerc ↔ Liberté 5") — ligne courte urbaine
  { id:'L4',   name:'Ligne 4',   operator:'DDD', route:'Leclerc ↔ Liberté 5',            color:'#3b82f6', freq:'8 min',  tarif:200, stops:['lc1','lb1','lb3','sc1','lb5'] },
  // L6 : confirmé OSM (ref=6, "Palais ↔ Parcelles-Assainies")
  { id:'L6',   name:'Ligne 6',   operator:'DDD', route:'Parcelles ↔ Palais',             color:'#1d4ed8', freq:'12 min', tarif:200, stops:['pa1','pa4','cb1','lb5','lb6','p03','p08','p01'] },
  { id:'L7',   name:'Ligne 7',   operator:'DDD', route:'Ouakam ↔ Palais',               color:'#3b82f6', freq:'15 min', tarif:200, stops:['ok1','lb6','p03','p15','p08','p01'] },
  { id:'L8',   name:'Ligne 8',   operator:'DDD', route:'Yoff ↔ Palais',                 color:'#60a5fa', freq:'15 min', tarif:200, stops:['yf1','yf2','ha3','bm1','ha2','ha4','p03','p15','p01'] },
  { id:'L9',   name:'Ligne 9',   operator:'DDD', route:'Liberté 6 ↔ Palais',            color:'#2563eb', freq:'10 min', tarif:200, stops:['lb6','sc1','lb1','p14','p06','p04','p11','p05','p03','p09','p01'] },
  { id:'L10',  name:'Ligne 10',  operator:'DDD', route:'Liberté 5 ↔ Palais',            color:'#1e40af', freq:'12 min', tarif:200, stops:['lb5','sc1','lb2','lb1','sc2','p07','p13','p14','p05','p03','p01'] },
  { id:'L11',  name:'Ligne 11',  operator:'DDD', route:'Keur Massar ↔ Leclerc',         color:'#1e3a8a', freq:'15 min', tarif:250, stops:['km1','km3','pk2','gd3','gd1','po1','lb5','lc1'] },
  { id:'L12',  name:'Ligne 12',  operator:'DDD', route:'Guédiawaye ↔ Palais',           color:'#1a56db', freq:'12 min', tarif:200, stops:['gd4','gd1','gd3','pk1','bm1','ha2','p03','p01'] },
  { id:'L13',  name:'Ligne 13',  operator:'DDD', route:'Liberté 5 ↔ Palais (Sicap)',    color:'#3b82f6', freq:'10 min', tarif:200, stops:['lb5','lb3','lb2','lb6','sc7','sc5','sc6','p05','p03','p01'] },
  { id:'L14',  name:'Ligne 14',  operator:'DDD', route:'Sacré-Cœur ↔ Leclerc',          color:'#93c5fd', freq:'15 min', tarif:200, stops:['sc4','sc3','sc2','sc7','sc5','sc6','lb1','lc1'] },
  { id:'L15',  name:'Ligne 15',  operator:'DDD', route:'Rufisque ↔ Palais',             color:'#1d4ed8', freq:'20 min', tarif:300, stops:['rf1','rf2','th1','pk3','pk1','ha4','ha2','p03','p10','p01'] },
  { id:'L16A', name:'Ligne 16A', operator:'DDD', route:'Malika ↔ Palais',               color:'#60a5fa', freq:'25 min', tarif:300, stops:['ml1','gd5','gd2','gd1','nf1','zo1','po1','lb5','p01'] },
  { id:'L18',  name:'Ligne 18',  operator:'DDD', route:'Cité Millionnaire ↔ Leclerc',   color:'#2563eb', freq:'20 min', tarif:200, stops:['cm1','zo1','nf1','po1','sc8','lb5','lb3','lb1','sc1','lc1'] },
  { id:'L20',  name:'Ligne 20',  operator:'DDD', route:'Liberté 5 (express)',            color:'#1d4ed8', freq:'10 min', tarif:200, stops:['p01','lc1','lc2','gy1','sc8','lb5'] },
  { id:'L23',  name:'Ligne 23',  operator:'DDD', route:'Parcelles ↔ Palais',            color:'#1a56db', freq:'12 min', tarif:200, stops:['pa1','pa5','pa3','lb5','lb6','p04','p11','p05','p03','p01'] },
  { id:'L45',  name:'Ligne 45',  operator:'DDD', route:'Mbao ↔ Palais',                 color:'#1e40af', freq:'20 min', tarif:300, stops:['mb1','mb2','pk3','pk1','ha4','ha2','p03','p01'] },
  { id:'L121', name:'Ligne 121', operator:'DDD', route:'HLM Grand Yoff ↔ Leclerc',      color:'#3b82f6', freq:'15 min', tarif:200, stops:['lc2','gy1','sc8','lb5','lc1'] },
];

const AFTU_COLORS = ['#e11d48','#f43f5e','#be123c'];
const AFTU_LINES: Line[] = [
  // ─ Centre / Fann / Plateau ──────────────────────────────
  { id:'A1',   name:'AFTU 1',   operator:'AFTU', route:'Lat Dior ↔ HLM',              color:AFTU_COLORS[0], freq:'8 min',  tarif:150, stops:['p06','p14','lc2','gy1'] },
  { id:'A2',   name:'AFTU 2',   operator:'AFTU', route:'Parcelles ↔ Petersen',        color:AFTU_COLORS[1], freq:'6 min',  tarif:150, stops:['pa1','lb5','lb6','p04','p02'] },
  { id:'A3',   name:'AFTU 3',   operator:'AFTU', route:'Yoff ↔ Petersen',             color:AFTU_COLORS[2], freq:'10 min', tarif:150, stops:['yf1','ok1','gy1','lb6','p04','p02'] },
  { id:'A4',   name:'AFTU 4',   operator:'AFTU', route:'Yoff Tonghor ↔ Petersen',     color:AFTU_COLORS[0], freq:'10 min', tarif:150, stops:['yf3','yf1','yf2','ok1','p04','p02'] },
  { id:'A5',   name:'AFTU 5',   operator:'AFTU', route:'Parcelles ↔ Patte d\'Oie',   color:AFTU_COLORS[1], freq:'8 min',  tarif:150, stops:['pa1','cb1','po1','lb5','p02'] },
  { id:'A24',  name:'AFTU 24',  operator:'AFTU', route:'Fann ↔ Liberté',              color:AFTU_COLORS[2], freq:'12 min', tarif:150, stops:['p07','p13','p14','p06','sc2','sc1'] },
  { id:'A25',  name:'AFTU 25',  operator:'AFTU', route:'Parcelles ↔ Petersen',        color:AFTU_COLORS[0], freq:'8 min',  tarif:150, stops:['pa1','lb5','p02'] },
  { id:'A26',  name:'AFTU 26',  operator:'AFTU', route:'Yeumbeul ↔ Petersen',         color:AFTU_COLORS[1], freq:'15 min', tarif:150, stops:['km2','pk2','pk1','ha2','p02'] },
  { id:'A27',  name:'AFTU 27',  operator:'AFTU', route:'Guédiawaye ↔ Petersen',       color:AFTU_COLORS[2], freq:'12 min', tarif:150, stops:['gd5','gd1','lb6','p04','p02'] },
  { id:'A29',  name:'AFTU 29',  operator:'AFTU', route:'Cambérène ↔ Petersen',        color:AFTU_COLORS[0], freq:'10 min', tarif:150, stops:['cb1','pa4','pa1','po1','nf1','lb5','p04','p02'] },
  { id:'A30',  name:'AFTU 30',  operator:'AFTU', route:'Colobane ↔ Kermel',           color:AFTU_COLORS[1], freq:'8 min',  tarif:150, stops:['p04','p11','p09','p15','sc6','sc5'] },
  { id:'A33',  name:'AFTU 33',  operator:'AFTU', route:'Colobane ↔ Guédiawaye',       color:AFTU_COLORS[2], freq:'12 min', tarif:150, stops:['p04','lb6','gy1','gd3','gd1'] },
  { id:'A34',  name:'AFTU 34',  operator:'AFTU', route:'Lat Dior ↔ Sacré-Cœur',       color:AFTU_COLORS[0], freq:'15 min', tarif:150, stops:['p06','p14','sc2','sc3','sc4'] },
  { id:'A35',  name:'AFTU 35',  operator:'AFTU', route:'Ngor ↔ Pikine',               color:AFTU_COLORS[1], freq:'20 min', tarif:150, stops:['ng1','ok1','gy1','gd1','pk1'] },
  { id:'A36',  name:'AFTU 36',  operator:'AFTU', route:'Corniche ↔ Ouakam',            color:AFTU_COLORS[2], freq:'15 min', tarif:150, stops:['p12','p13','p07','p14','p06','sc4','sc3','ok1'] },
  { id:'A40',  name:'AFTU 40',  operator:'AFTU', route:'Mbao ↔ Rufisque',             color:AFTU_COLORS[0], freq:'20 min', tarif:150, stops:['mb2','mb1','rf2','rf1'] },
  { id:'A42',  name:'AFTU 42',  operator:'AFTU', route:'Guédiawaye ↔ Ouakam',         color:AFTU_COLORS[1], freq:'20 min', tarif:150, stops:['gd4','gd1','gy1','ok1'] },
  { id:'A44',  name:'AFTU 44',  operator:'AFTU', route:'Grand Mbao ↔ Ouakam',         color:AFTU_COLORS[2], freq:'25 min', tarif:200, stops:['mb1','pk1','gy1','ok1'] },
  { id:'A49',  name:'AFTU 49',  operator:'AFTU', route:'Almadies ↔ Corniche',         color:AFTU_COLORS[0], freq:'20 min', tarif:150, stops:['al2','al1','ng1','ok1','p12'] },
  { id:'A50',  name:'AFTU 50',  operator:'AFTU', route:'Malika ↔ Nord Foire',         color:AFTU_COLORS[1], freq:'25 min', tarif:200, stops:['ml1','cb2','cb1','nf1','po1'] },
  { id:'A51',  name:'AFTU 51',  operator:'AFTU', route:'Jaxaay ↔ Hann',              color:AFTU_COLORS[2], freq:'30 min', tarif:200, stops:['jx1','km1','km3','pk1','ha3','bm1'] },
  { id:'A52',  name:'AFTU 52',  operator:'AFTU', route:'Pikine ↔ Keur Massar',        color:AFTU_COLORS[0], freq:'15 min', tarif:150, stops:['pk2','pk1','pk3','km3','km2','km1'] },
  { id:'A55',  name:'AFTU 55',  operator:'AFTU', route:'Rufisque ↔ Petersen',         color:AFTU_COLORS[1], freq:'20 min', tarif:250, stops:['rf2','rf1','pk1','ha2','p02'] },
  { id:'A56',  name:'AFTU 56',  operator:'AFTU', route:'Jaxaay ↔ Guédiawaye',        color:AFTU_COLORS[2], freq:'25 min', tarif:200, stops:['jx1','km1','gd1'] },
  { id:'A57',  name:'AFTU 57',  operator:'AFTU', route:'Liberté 6 ↔ Rufisque',        color:AFTU_COLORS[0], freq:'20 min', tarif:250, stops:['lb6','pk4','th2','rf1'] },
  { id:'A61',  name:'AFTU 61',  operator:'AFTU', route:'Almadies ↔ Keur Massar',      color:AFTU_COLORS[1], freq:'25 min', tarif:200, stops:['al1','ng1','ok1','gy1','gd1','km1'] },
  { id:'A64',  name:'AFTU 64',  operator:'AFTU', route:'Guédiawaye ↔ Rufisque',       color:AFTU_COLORS[2], freq:'20 min', tarif:200, stops:['gd3','gd1','pk1','rf1'] },
  { id:'A65',  name:'AFTU 65',  operator:'AFTU', route:'Keur Massar ↔ Jaxaay',        color:AFTU_COLORS[0], freq:'30 min', tarif:200, stops:['km1','km3','jx1'] },
  { id:'A66',  name:'AFTU 66',  operator:'AFTU', route:'Yoff Tonghor ↔ Grand Yoff',   color:AFTU_COLORS[1], freq:'15 min', tarif:150, stops:['yf3','yf1','gy1'] },
  { id:'A68',  name:'AFTU 68',  operator:'AFTU', route:'Yeumbeul ↔ Thiaroye',         color:AFTU_COLORS[2], freq:'20 min', tarif:150, stops:['km2','pk4','th2','th1'] },
  { id:'A70',  name:'AFTU 70',  operator:'AFTU', route:'Daroukhane ↔ Liberté',        color:AFTU_COLORS[0], freq:'20 min', tarif:200, stops:['dk1','gd5','gd2','gd3','lb6'] },
  { id:'A73',  name:'AFTU 73',  operator:'AFTU', route:'Bambilor ↔ Pikine',           color:AFTU_COLORS[1], freq:'30 min', tarif:250, stops:['ba1','km1','pk1'] },
  { id:'A75',  name:'AFTU 75',  operator:'AFTU', route:'Malika ↔ Colobane',           color:AFTU_COLORS[2], freq:'30 min', tarif:200, stops:['ml1','gd5','gd1','p04'] },
  { id:'A72',  name:'AFTU 72',  operator:'AFTU', route:'Parcelles ↔ Ouakam',           color:AFTU_COLORS[0], freq:'20 min', tarif:150, stops:['pa1','cb1','po1','nf1','gy1','ok1'] },
  { id:'A80',  name:'AFTU 80',  operator:'AFTU', route:'Diamniadio ↔ Médina',         color:AFTU_COLORS[1], freq:'30 min', tarif:300, stops:['t05','rf1','pk1','p04'] },
];

const BRT_LINES: Line[] = [
  {
    id:'BRT-L1', name:'BRT L1', operator:'BRT',
    route:'Petersen ↔ Guédiawaye',
    color:'#7c3aed', freq:'5 min', tarif:300,
    stops:['b01','b02','b03','b04','b05','b06','b07','gd4','gd1'],
  },
];

const TER_LINES: Line[] = [
  {
    id:'TER-01', name:'TER 01', operator:'TER',
    route:'Dakar ↔ AIBD ↔ Sébikotane',
    color:'#059669', freq:'30 min', tarif:500,
    // p01/th1/rf1 = shared gares avec réseau bus (correspondances directes)
    // t04-t07 = gares TER uniquement (Bargny, Diamniadio, AIBD, Sébikotane)
    stops:['p01','th1','rf1','t04','t05','t06','t07'],
  },
];

export const LINES: Line[] = [...DDD_LINES, ...AFTU_LINES, ...BRT_LINES, ...TER_LINES];

export const getLinesByOp = (op: string) => op === 'all' ? LINES : LINES.filter(l => l.operator === op);
export const getStopsByOp = (op: string) => op === 'all' ? STOPS : STOPS.filter(s => s.operators.includes(op as OperatorId));

export const getNextDepartures = (stopId: string): Departure[] => {
  const now  = new Date();
  const stop = STOPS.find(s => s.id === stopId);
  if (!stop) return [];
  const waits = [3, 8, 14, 22, 35];
  return stop.lines.slice(0, 5).map((lineId, i) => {
    const line = LINES.find(l => l.id === lineId);
    const wait = waits[i % 5] + Math.floor(Math.random() * 4);
    const depTime = new Date(now.getTime() + wait * 60000);
    return {
      lineId,
      lineName:  line?.name  || lineId,
      operator:  (line?.operator || 'DDD') as OperatorId,
      color:     line?.color || '#1a56db',
      route:     line?.route || '',
      waitMin:   wait,
      time:      depTime.toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' }),
      comfort:   getComfortIndex(line?.operator || 'DDD'),
    };
  }).sort((a, b) => a.waitMin - b.waitMin);
};

export const REPORT_TYPES = [
  { id:'retard',   label:'Bus en retard',     emoji:'⏰', color:'#d97706' },
  { id:'bonde',    label:'Arrêt bondé',       emoji:'👥', color:'#dc2626' },
  { id:'degrade',  label:'Arrêt dégradé',     emoji:'🚧', color:'#94a3b8' },
  { id:'insecure', label:'Insécurité',        emoji:'⚠️', color:'#dc2626' },
  { id:'accident', label:'Accident/Incident', emoji:'🚨', color:'#dc2626' },
];

export function getReports(stopId: string) {
  try { return JSON.parse(localStorage.getItem(`senbus_reports_${stopId}`) || '[]'); } catch { return []; }
}

export function addReport(stopId: string, report: { type: string; label: string; emoji: string }) {
  const reports = getReports(stopId);
  reports.unshift({ ...report, time: new Date().toISOString(), id: Date.now() });
  localStorage.setItem(`senbus_reports_${stopId}`, JSON.stringify(reports.slice(0, 10)));
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
}
