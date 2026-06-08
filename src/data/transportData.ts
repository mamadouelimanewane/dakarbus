import type { Stop, Line, Operator, OperatorId, Departure, ComfortIndex, AffluenceData } from '@/types';

export const OPERATORS: Record<string, Operator> = {
  DDD:  { id:'DDD',  name:'DDD',  fullName:'Dakar Dem Dikk',        icon:'🚌', color:'#1a56db', bg:'#eff6ff', tarif:200, climatise:false },
  AFTU: { id:'AFTU', name:'AFTU', fullName:'AFTU Car Rapide',        icon:'🚐', color:'#e11d48', bg:'#fff1f2', tarif:150, climatise:false },
  BRT:  { id:'BRT',  name:'BRT',  fullName:'Bus Rapid Transit',      icon:'🚍', color:'#7c3aed', bg:'#f5f3ff', tarif:300, climatise:true  },
  TER:  { id:'TER',  name:'TER',  fullName:'Train Express Régional', icon:'🚆', color:'#059669', bg:'#ecfdf5', tarif:500, climatise:true  },
};

export const TER_TARIFS = [
  { from:'Dakar', to:'Thiaroye',   prix:500,  classe:'2e' },
  { from:'Dakar', to:'Rufisque',   prix:900,  classe:'2e' },
  { from:'Dakar', to:'Bargny',     prix:1200, classe:'2e' },
  { from:'Dakar', to:'Diamniadio', prix:1500, classe:'2e' },
  { from:'Dakar', to:'AIBD',       prix:2000, classe:'2e' },
  { from:'Dakar', to:'Sébikotane', prix:2500, classe:'2e' },
  { from:'Dakar', to:'Thiès',      prix:3000, classe:'2e' },
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
//  ARRÊTS
//
//  Deux réseaux distincts, peu complémentaires :
//
//  ● DDD (Dakar Dem Dikk) — Grands bus sur artères principales.
//    Relie le Plateau aux banlieues lointaines via les boulevards
//    (VDN, Route Nationale, Av. Bourguiba, Route de Rufisque…).
//    Arrêts espacés ~600 m–1 km, aux grandes intersections.
//
//  ● AFTU (Car Rapide / Ndiaga Ndiaye) — Minibus de quartier.
//    Dessert l'intérieur des zones résidentielles, les ruelles,
//    les marchés locaux. Arrêts rapprochés, ~200–400 m.
//    Territoire quasi-exclusif : Ouakam/Ngor/Almadies,
//    Parcelles internes, Pikine internes, Sicap/Fann/Mermoz,
//    Thiaroye Azur, Yeumbeul, Keur Massar interne…
//
//  ● HUBS (~18) — seuls points où les deux réseaux se croisent
//    (correspondances DDD ↔ AFTU).
// ══════════════════════════════════════════════════════════════

export const STOPS: Stop[] = [

  // ════════════════════════════════════════════════════════════
  //  HUBS INTERMODAUX — DDD + AFTU (correspondances)
  // ════════════════════════════════════════════════════════════
  { id:'p01', name:'Gare Palais (Rebeuss)',      zone:'Plateau',     lat:14.6697, lng:-17.4386, operators:['DDD','TER'],        lines:['L6','L7','L8','L9','L10','L12','L15','L20','L23','L35','L45','L46','TER-01'] },
  { id:'p02', name:'Avenue Petersen',            zone:'Plateau',     lat:14.6811, lng:-17.4464, operators:['DDD','AFTU','BRT'], lines:['A2','A3','A5','A7','A8','A13','A15','A17','A25','A27','A29','BRT-L1'] },
  { id:'p04', name:'Colobane Gare',              zone:'Médina',      lat:14.6908, lng:-17.4478, operators:['DDD','AFTU'],       lines:['L9','A18','A20','A30','A75'] },
  { id:'lc1', name:'Leclerc Terminus',           zone:'Liberté',     lat:14.7117, lng:-17.4567, operators:['DDD','AFTU'],       lines:['L1','L2','L11','L14','L18','L20','L30','L39','L43','A1','A19'] },
  { id:'lb5', name:'Terminus Liberté 5',         zone:'Liberté 5',   lat:14.7242, lng:-17.4528, operators:['DDD','AFTU'],       lines:['L1','L4','L10','L13','L18','L20','L23','L32','L36','L37','A2','A5','A10','A14','A16','A19','A25'] },
  { id:'lb6', name:'Rond-Point Liberté 6',       zone:'Liberté 6',   lat:14.7200, lng:-17.4450, operators:['DDD','AFTU'],       lines:['L6','L9','L13','L31','L33','A2','A9','A27','A33','A57','A85','A87'] },
  { id:'po1', name:'Patte d\'Oie',               zone:'Patte d\'Oie',lat:14.7247, lng:-17.4672, operators:['DDD','AFTU'],       lines:['L11','L16','L17','L41','A5','A29','A72','A50','A96'] },
  { id:'nf1', name:'Nord Foire',                 zone:'Nord Foire',  lat:14.7358, lng:-17.4639, operators:['DDD','AFTU'],       lines:['L16','L17','L19','L53','A29','A50','A72','A105'] },
  { id:'ok1', name:'Ouakam Terminus',            zone:'Ouakam',      lat:14.7186, lng:-17.4897, operators:['DDD','AFTU'],       lines:['L7','L22','L24','L36','L41','L65','A35','A36','A42','A44','A49','A61','A72','A91','A94'] },
  { id:'gy1', name:'Grand Yoff Terminus',        zone:'Grand Yoff',  lat:14.7268, lng:-17.4553, operators:['DDD','AFTU'],       lines:['L17','L19','L20','L22','L24','L34','L40','L43','L47','A3','A7','A18','A33','A35','A42','A61','A66','A72'] },
  { id:'pk1', name:'Pikine Gare Routière',       zone:'Pikine',      lat:14.7499, lng:-17.3858, operators:['DDD','BRT','AFTU'], lines:['L12','L15','L21','L24','L30','L35','L44','L45','L46','L57','L58','L64','BRT-L1','A9','A16','A19','A26','A35','A43','A44','A52','A55','A64','A84','A85','A89','A92','A95','A103'] },
  { id:'gd1', name:'Guédiawaye Marché',          zone:'Guédiawaye',  lat:14.7769, lng:-17.3986, operators:['DDD','BRT','AFTU'], lines:['L2','L11','L12','L22','L34','L37','L44','L54','L63','BRT-L1','A20','A27','A33','A42','A56','A61','A64','A70','A75','A84','A87','A88','A101'] },
  { id:'pa1', name:'Terminus Parcelles',         zone:'Parcelles',   lat:14.7583, lng:-17.4308, operators:['DDD','AFTU'],       lines:['L1','L6','L19','L23','L28','L41','A2','A5','A6','A13','A25','A29','A72','A90','A98'] },
  { id:'rf1', name:'Rufisque Gare Routière',     zone:'Rufisque',    lat:14.7153, lng:-17.2747, operators:['DDD','TER','AFTU'], lines:['L15','L33','L47','L48','L52','L58','L64','TER-01','A40','A55','A57','A64','A92','A93','A95'], terConnection:true },
  { id:'km1', name:'Keur Massar Marché',         zone:'Keur Massar', lat:14.7833, lng:-17.3183, operators:['DDD','AFTU'],       lines:['L11','L21','L34','A51','A52','A61','A65','A73','A99','A100','A103'] },
  { id:'th1', name:'Thiaroye Marché',            zone:'Thiaroye',    lat:14.7358, lng:-17.3533, operators:['DDD','TER'],        lines:['L15','L30','L46','TER-01'] },
  { id:'mb5', name:'Mbao Gare (TER)',            zone:'Mbao',        lat:14.7490, lng:-17.3008, operators:['DDD','TER','AFTU'], lines:['L39','L48','TER-01','A40','A43'], terConnection:true },
  { id:'ml1', name:'Malika Terminus',            zone:'Malika',      lat:14.7958, lng:-17.3475, operators:['DDD','AFTU'],       lines:['L16','A50','A75','A96','A104'] },

  // ════════════════════════════════════════════════════════════
  //  DDD — ARRÊTS SUR ARTÈRES PRINCIPALES
  //  (grands bus, voies larges, ~600 m entre arrêts)
  // ════════════════════════════════════════════════════════════

  // ── Plateau / Médina — avenues principales ────────────────
  { id:'p03', name:'Sandaga',                    zone:'Plateau',     lat:14.6756, lng:-17.4436, operators:['DDD'],              lines:['L6','L7','L9','L10','L12','L26','L27','L35','L46'] },
  { id:'p05', name:'Tilène',                     zone:'Médina',      lat:14.6788, lng:-17.4428, operators:['DDD'],              lines:['L9','L10','L23','L26','L27'] },
  { id:'p08', name:'Place de l\'Indépendance',   zone:'Plateau',     lat:14.6706, lng:-17.4428, operators:['DDD'],              lines:['L6','L7','L8','L15','L26','L27','L35','L38'] },
  { id:'p10', name:'Hôpital Principal',          zone:'Plateau',     lat:14.6725, lng:-17.4447, operators:['DDD'],              lines:['L6','L15','L35'] },
  { id:'p11', name:'Médina Marché',              zone:'Médina',      lat:14.6858, lng:-17.4442, operators:['DDD'],              lines:['L9','L3','L26'] },
  { id:'p15', name:'Avenue Bourguiba',           zone:'Plateau',     lat:14.6736, lng:-17.4417, operators:['DDD'],              lines:['L6','L8','L9','L26','L38'] },
  { id:'p16', name:'Port de Dakar',              zone:'Plateau',     lat:14.6700, lng:-17.4320, operators:['DDD'],              lines:['L3','L35','L46'] },
  { id:'p17', name:'Avenue Lamine Guèye',        zone:'Plateau',     lat:14.6792, lng:-17.4500, operators:['DDD'],              lines:['L27'] },
  { id:'me3', name:'Médina Gare SNCS',           zone:'Médina',      lat:14.6852, lng:-17.4402, operators:['DDD'],              lines:['L3','L26'] },

  // ── Axe Liberté (DDD — Avenue Cheikh Anta Diop, RN1) ─────
  { id:'lb1', name:'Liberté 1',                  zone:'Liberté 1',   lat:14.7083, lng:-17.4519, operators:['DDD'],              lines:['L4','L10','L13','L42'] },
  { id:'lb2', name:'Liberté 2',                  zone:'Liberté 2',   lat:14.7117, lng:-17.4489, operators:['DDD'],              lines:['L10','L13','L42'] },
  { id:'lb3', name:'Liberté 3',                  zone:'Liberté 3',   lat:14.7150, lng:-17.4467, operators:['DDD'],              lines:['L4','L13','L42'] },
  { id:'lb4', name:'Liberté 4',                  zone:'Liberté 4',   lat:14.7178, lng:-17.4500, operators:['DDD'],              lines:['L13','L42'] },
  { id:'sc1', name:'Sicap Liberté',              zone:'Sicap',       lat:14.7133, lng:-17.4603, operators:['DDD'],              lines:['L4','L10','L13','L27'] },
  { id:'sc7', name:'Stade Léopold S. Senghor',   zone:'Médina',      lat:14.7067, lng:-17.4492, operators:['DDD'],              lines:['L13','L5'] },
  { id:'sc8', name:'HLM 5',                      zone:'HLM',         lat:14.7228, lng:-17.4522, operators:['DDD'],              lines:['L18','L20','L43'] },
  { id:'lc2', name:'HLM Grand Yoff',             zone:'HLM',         lat:14.7183, lng:-17.4553, operators:['DDD'],              lines:['L20','L43'] },
  { id:'hlm1',name:'HLM 1',                      zone:'HLM',         lat:14.7100, lng:-17.4480, operators:['DDD'],              lines:['L26','L5'] },

  // ── Axe VDN / Nord (DDD) ──────────────────────────────────
  { id:'gy3', name:'Grand Yoff Marché',          zone:'Grand Yoff',  lat:14.7312, lng:-17.4528, operators:['DDD'],              lines:['L19','L40','L43'] },
  { id:'zo1', name:'Zone de Captage',            zone:'Captage',     lat:14.7389, lng:-17.4711, operators:['DDD'],              lines:['L16','L17','L18'] },
  { id:'cm1', name:'Cité Millionnaire',          zone:'Liberté',     lat:14.7314, lng:-17.4769, operators:['DDD'],              lines:['L18','L17'] },
  { id:'ci1', name:'CICES Foire Internationale', zone:'CICES',       lat:14.7342, lng:-17.4688, operators:['DDD'],              lines:['L53','L60','L65'] },

  // ── Axe Hann / Route Nationale (DDD) ─────────────────────
  { id:'ha2', name:'Front de Terre',             zone:'Hann',        lat:14.7172, lng:-17.4069, operators:['DDD'],              lines:['L8','L9','L15','L45'] },
  { id:'bm1', name:'Baux Maraîchers',            zone:'Hann',        lat:14.7192, lng:-17.3997, operators:['DDD'],              lines:['L8','L9'] },
  { id:'ha4', name:'Zone Industrielle Hann',     zone:'Hann',        lat:14.7197, lng:-17.3994, operators:['DDD'],              lines:['L45','L15'] },
  { id:'pk5', name:'Pikine Icotaf',              zone:'Pikine',      lat:14.7532, lng:-17.3900, operators:['DDD'],              lines:['L24','L35','L44'] },
  { id:'pk6', name:'Pikine Ancien',              zone:'Pikine',      lat:14.7558, lng:-17.3853, operators:['DDD'],              lines:['L24','L35'] },
  { id:'pk11',name:'Marché Syndicat',            zone:'Pikine',      lat:14.7482, lng:-17.3820, operators:['DDD'],              lines:['L35','L64'] },
  { id:'th3', name:'Thiaroye Gare',              zone:'Thiaroye',    lat:14.7330, lng:-17.3528, operators:['DDD'],              lines:['L46','L30'] },

  // ── Axe Guédiawaye (DDD) ──────────────────────────────────
  { id:'gd3', name:'Sam Notaire',                zone:'Guédiawaye',  lat:14.7672, lng:-17.4072, operators:['DDD'],              lines:['L11','L12','L44'] },
  { id:'gd4', name:'Golf Sud',                   zone:'Guédiawaye',  lat:14.7808, lng:-17.3942, operators:['DDD'],              lines:['L12','L22','BRT-L1'] },
  { id:'gd2', name:'Wakhinane Nimzat',           zone:'Guédiawaye',  lat:14.7833, lng:-17.4025, operators:['DDD'],              lines:['L12','L16','L37'] },
  { id:'gd5', name:'Médina Gounass',             zone:'Guédiawaye',  lat:14.7906, lng:-17.3956, operators:['DDD'],              lines:['L16','L38'] },

  // ── Axe Parcelles / Cambérène / Daroukhane (DDD) ─────────
  { id:'pa3', name:'Parcelles Unité 10',         zone:'Parcelles',   lat:14.7483, lng:-17.4333, operators:['DDD'],              lines:['L23','L28'] },
  { id:'pa5', name:'Parcelles Garage',           zone:'Parcelles',   lat:14.7500, lng:-17.4317, operators:['DDD'],              lines:['L1','L23','L28'] },
  { id:'cb1', name:'Cambérène Cité Nations',     zone:'Cambérène',   lat:14.7633, lng:-17.4292, operators:['DDD'],              lines:['L6','L19','L29','L41'] },
  { id:'cb3', name:'Cambérène Terminus',         zone:'Cambérène',   lat:14.7683, lng:-17.4248, operators:['DDD'],              lines:['L29'] },
  { id:'dk1', name:'Daroukhane Terminus',        zone:'Daroukhane',  lat:14.7850, lng:-17.4175, operators:['DDD'],              lines:['L2','L38'] },
  { id:'dk2', name:'Daroukhane Marché',          zone:'Daroukhane',  lat:14.7902, lng:-17.4122, operators:['DDD'],              lines:['L38','L2'] },

  // ── Yoff / Mbao / Rufisque (DDD) ─────────────────────────
  { id:'yf1', name:'Yoff Village',               zone:'Yoff',        lat:14.7467, lng:-17.4903, operators:['DDD'],              lines:['L8','L25','L40','L65'] },
  { id:'yf2', name:'Yoff Aéroport (ancien)',     zone:'Yoff',        lat:14.7403, lng:-17.4914, operators:['DDD'],              lines:['L8','L25'] },
  { id:'mb1', name:'Grand Mbao',                 zone:'Mbao',        lat:14.7500, lng:-17.2917, operators:['DDD'],              lines:['L39','L45','L48','L58','L49'] },
  { id:'mb3', name:'Petit Mbao',                 zone:'Mbao',        lat:14.7472, lng:-17.3052, operators:['DDD'],              lines:['L39','L48','L49'] },
  // ── Village de Mbao (nouveaux arrêts) ──────────────────────────
  { id:'vmb1',name:'Village de Mbao',            zone:'Mbao',        lat:14.7455, lng:-17.3145, operators:['DDD'],              lines:['L49'] },
  { id:'rf2', name:'Rufisque Centre',            zone:'Rufisque',    lat:14.7167, lng:-17.2783, operators:['DDD'],              lines:['L15','L47'] },

  // ── Keur Massar / Périurbain (DDD) ───────────────────────
  { id:'km4', name:'Keur Massar Extension',      zone:'Keur Massar', lat:14.7822, lng:-17.3152, operators:['DDD'],              lines:['L21','L54'] },
  { id:'km6', name:'Citynord',                   zone:'Keur Massar', lat:14.7702, lng:-17.3382, operators:['DDD'],              lines:['L34','L21'] },
  { id:'kn1', name:'Keur Massar Nord',           zone:'Keur Massar', lat:14.7953, lng:-17.3086, operators:['DDD'],              lines:['L54'] },
  { id:'di1', name:'Diamniadio Centre',          zone:'Diamniadio',  lat:14.7289, lng:-17.1747, operators:['DDD'],              lines:['L52'] },
  { id:'di3', name:'Diamniadio Gare Routière',   zone:'Diamniadio',  lat:14.7272, lng:-17.1764, operators:['DDD'],              lines:['L52'] },
  { id:'bg1', name:'Bargny Centre',              zone:'Bargny',      lat:14.6964, lng:-17.2272, operators:['DDD'],              lines:['L58'] },
  { id:'se1', name:'Sébikotane Centre',          zone:'Sébikotane',  lat:14.7403, lng:-17.0958, operators:['DDD'],              lines:['L52'] },

  // ── Lignes transversales DDD ──────────────────────────────
  { id:'gd8', name:'Guédiawaye HCW',             zone:'Guédiawaye',  lat:14.7750, lng:-17.4022, operators:['DDD'],              lines:['L37','L44'] },
  { id:'gd9', name:'Diamalaye',                  zone:'Guédiawaye',  lat:14.7700, lng:-17.4050, operators:['DDD'],              lines:['L37','L44'] },
  { id:'gd11',name:'Cité Aliou Sow',             zone:'Guédiawaye',  lat:14.7780, lng:-17.3962, operators:['DDD'],              lines:['L22','L44'] },
  { id:'gr1', name:'Guinaw Rails Nord',          zone:'Guinaw Rails', lat:14.7419, lng:-17.3808, operators:['DDD'],             lines:['L57'] },
  { id:'gr2', name:'Guinaw Rails Sud',           zone:'Guinaw Rails', lat:14.7383, lng:-17.3797, operators:['DDD'],             lines:['L57'] },

  // ════════════════════════════════════════════════════════════
  //  AFTU — ARRÊTS DE QUARTIER (car rapides / ndiaga ndiaye)
  //  Réseau capillaire, intérieur des zones résidentielles.
  //  Peu ou pas de superposition avec DDD.
  // ════════════════════════════════════════════════════════════

  // ── Fann / Point-E / Mermoz (AFTU quasi-exclusif) ─────────
  { id:'p06', name:'Lat Dior (UCAD)',            zone:'Fann',        lat:14.6944, lng:-17.4594, operators:['AFTU'],             lines:['A1','A34','A36','A17'] },
  { id:'p07', name:'Fann Résidence',             zone:'Fann',        lat:14.6933, lng:-17.4669, operators:['AFTU'],             lines:['A24','A36','A97'] },
  { id:'p12', name:'Corniche Ouest',             zone:'Plateau',     lat:14.6856, lng:-17.4661, operators:['AFTU'],             lines:['A36','A49'] },
  { id:'p13', name:'Fann Hôpital',               zone:'Fann',        lat:14.6953, lng:-17.4631, operators:['AFTU'],             lines:['A24','A36'] },
  { id:'p14', name:'UCAD Université',            zone:'Fann',        lat:14.6922, lng:-17.4572, operators:['AFTU'],             lines:['A34','A36','A17','A97'] },
  { id:'pe1', name:'Point-E Marché',             zone:'Point-E',     lat:14.7000, lng:-17.4650, operators:['AFTU'],             lines:['A16','A19'] },
  { id:'pe2', name:'Fann Point',                 zone:'Point-E',     lat:14.7022, lng:-17.4700, operators:['AFTU'],             lines:['A16','A19'] },
  { id:'pe3', name:'Amitié 3',                   zone:'Amitié',      lat:14.7053, lng:-17.4720, operators:['AFTU'],             lines:['A16','A34'] },
  { id:'pe4', name:'Résidence Fann',             zone:'Fann',        lat:14.6972, lng:-17.4658, operators:['AFTU'],             lines:['A36','A19'] },
  { id:'mn1', name:'Mermoz Pyrotechnie',         zone:'Mermoz',      lat:14.7094, lng:-17.4750, operators:['AFTU'],             lines:['A97','A102'] },
  { id:'mn2', name:'Sotrac Mermoz',              zone:'Mermoz',      lat:14.7078, lng:-17.4728, operators:['AFTU'],             lines:['A97','A102'] },
  { id:'mn3', name:'Mermoz Nouveau',             zone:'Mermoz',      lat:14.7058, lng:-17.4708, operators:['AFTU'],             lines:['A97'] },

  // ── Sicap / HLM internes (AFTU) ───────────────────────────
  { id:'sc2', name:'Sicap Baobab',               zone:'Sicap',       lat:14.7072, lng:-17.4592, operators:['AFTU'],             lines:['A34','A102'] },
  { id:'sc3', name:'Sicap Mermoz',               zone:'Sicap',       lat:14.7022, lng:-17.4608, operators:['AFTU'],             lines:['A34','A91'] },
  { id:'sc4', name:'Sacré-Cœur',                 zone:'Mermoz',      lat:14.7056, lng:-17.4628, operators:['AFTU'],             lines:['A34','A36','A91'] },
  { id:'sc5', name:'Dieuppeul',                  zone:'Dieuppeul',   lat:14.7008, lng:-17.4547, operators:['AFTU'],             lines:['A30','A15'] },
  { id:'sc6', name:'Grand Dakar',                zone:'Grand Dakar', lat:14.7008, lng:-17.4483, operators:['AFTU'],             lines:['A30','A15'] },
  { id:'si1', name:'Sicap Liberté 1',            zone:'Sicap',       lat:14.7092, lng:-17.4600, operators:['AFTU'],             lines:['A34','A16'] },
  { id:'si2', name:'Sicap Liberté 4',            zone:'Sicap',       lat:14.7162, lng:-17.4622, operators:['AFTU'],             lines:['A34','A16'] },
  { id:'si3', name:'Sicap Mermoz 2',             zone:'Sicap',       lat:14.7042, lng:-17.4638, operators:['AFTU'],             lines:['A34','A36'] },
  { id:'hlm2',name:'HLM 2',                      zone:'HLM',         lat:14.7122, lng:-17.4460, operators:['AFTU'],             lines:['A15','A17'] },
  { id:'hlm3',name:'HLM 8',                      zone:'HLM',         lat:14.7203, lng:-17.4478, operators:['AFTU'],             lines:['A15'] },
  { id:'hlm4',name:'HLM Fass',                   zone:'HLM',         lat:14.6963, lng:-17.4453, operators:['AFTU'],             lines:['A15','A30'] },
  { id:'gd6', name:'Biscuiterie',                zone:'Grand Dakar', lat:14.6982, lng:-17.4478, operators:['AFTU'],             lines:['A15'] },
  { id:'gd7', name:'Grand Dakar Village',        zone:'Grand Dakar', lat:14.7033, lng:-17.4500, operators:['AFTU'],             lines:['A30'] },
  { id:'zb1', name:'Zone B',                     zone:'Zone B',      lat:14.7083, lng:-17.4508, operators:['AFTU'],             lines:['A17'] },
  { id:'zc1', name:'Zone C',                     zone:'Zone C',      lat:14.7102, lng:-17.4473, operators:['AFTU'],             lines:['A17'] },

  // ── Médina / Tilène internes (AFTU) ───────────────────────
  { id:'me1', name:'Médina Rue 18',              zone:'Médina',      lat:14.6880, lng:-17.4460, operators:['AFTU'],             lines:['A18','A30'] },
  { id:'me2', name:'Médina Rue 22',              zone:'Médina',      lat:14.6902, lng:-17.4442, operators:['AFTU'],             lines:['A18','A30','A20'] },
  { id:'ti1', name:'Tilène Marché',              zone:'Médina',      lat:14.6800, lng:-17.4438, operators:['AFTU'],             lines:['A18','A30'] },
  { id:'ti2', name:'Tilène Mosquée',             zone:'Médina',      lat:14.6843, lng:-17.4473, operators:['AFTU'],             lines:['A18','A20'] },
  { id:'co1', name:'Colobane Marché',            zone:'Médina',      lat:14.6952, lng:-17.4498, operators:['AFTU'],             lines:['A20','A33','A75'] },
  { id:'co2', name:'Colobane Terminus',          zone:'Médina',      lat:14.6975, lng:-17.4520, operators:['AFTU'],             lines:['A20','A33'] },
  { id:'p09', name:'Kermel Marché',              zone:'Plateau',     lat:14.6744, lng:-17.4403, operators:['AFTU'],             lines:['A30'] },
  { id:'p18', name:'Rue Moussé Diop',            zone:'Plateau',     lat:14.6825, lng:-17.4478, operators:['AFTU'],             lines:['A7','A18'] },
  { id:'p20', name:'Bel-Air Corniche',           zone:'Plateau',     lat:14.6720, lng:-17.4480, operators:['AFTU'],             lines:['A7','A36'] },

  // ── Ouakam / Ngor / Almadies (AFTU quasi-exclusif) ────────
  { id:'ok2', name:'Ouakam École',               zone:'Ouakam',      lat:14.7222, lng:-17.4920, operators:['AFTU'],             lines:['A35','A42','A91','A94'] },
  { id:'ok3', name:'Ouakam Marché',              zone:'Ouakam',      lat:14.7252, lng:-17.4872, operators:['AFTU'],             lines:['A35','A91'] },
  { id:'ng1', name:'Ngor Village',               zone:'Ngor',        lat:14.7469, lng:-17.5031, operators:['AFTU'],             lines:['A35','A49','A61','A94'] },
  { id:'ng2', name:'Ngor International',         zone:'Ngor',        lat:14.7522, lng:-17.4978, operators:['AFTU'],             lines:['A49','A61','A94'] },
  { id:'al1', name:'Almadies',                   zone:'Almadies',    lat:14.7447, lng:-17.5108, operators:['AFTU'],             lines:['A49','A61','A91','A94','A105'] },
  { id:'ca1', name:'Castors',                    zone:'Castors',     lat:14.7128, lng:-17.4778, operators:['AFTU'],             lines:['A91','A94','A102'] },
  { id:'of1', name:'Ouest Foire',                zone:'Ouest Foire', lat:14.7353, lng:-17.4836, operators:['AFTU'],             lines:['A94','A105'] },
  { id:'of2', name:'Ouest Foire Résidence',      zone:'Ouest Foire', lat:14.7378, lng:-17.4864, operators:['AFTU'],             lines:['A94'] },

  // ── Yoff / Grand Yoff internes (AFTU) ─────────────────────
  { id:'yf3', name:'Yoff Tonghor',               zone:'Yoff',        lat:14.7519, lng:-17.4847, operators:['AFTU'],             lines:['A4','A66','A10'] },
  { id:'yf4', name:'Yoff Liberté',               zone:'Yoff',        lat:14.7533, lng:-17.4819, operators:['AFTU'],             lines:['A10','A66'] },
  { id:'yf5', name:'Yoff Marché',                zone:'Yoff',        lat:14.7452, lng:-17.4878, operators:['AFTU'],             lines:['A4','A10','A66','A105'] },
  { id:'gy2', name:'Grand Yoff HLM',             zone:'Grand Yoff',  lat:14.7292, lng:-17.4570, operators:['AFTU'],             lines:['A3','A66'] },
  { id:'gy4', name:'Cité Arafat',                zone:'Grand Yoff',  lat:14.7352, lng:-17.4603, operators:['AFTU'],             lines:['A72','A50'] },
  { id:'gy5', name:'Soprim',                     zone:'Grand Yoff',  lat:14.7378, lng:-17.4578, operators:['AFTU'],             lines:['A35','A72','A3'] },
  { id:'gy6', name:'Grand Yoff Bambey',          zone:'Grand Yoff',  lat:14.7333, lng:-17.4548, operators:['AFTU'],             lines:['A3','A33','A18'] },

  // ── Parcelles internes (AFTU) ─────────────────────────────
  { id:'pa2', name:'Parcelles Unité 17',         zone:'Parcelles',   lat:14.7533, lng:-17.4275, operators:['AFTU'],             lines:['A2','A25'] },
  { id:'pa4', name:'Parcelles Unité 26',         zone:'Parcelles',   lat:14.7617, lng:-17.4325, operators:['AFTU'],             lines:['A6','A29'] },
  { id:'pa6', name:'Parcelles Unité 1',          zone:'Parcelles',   lat:14.7450, lng:-17.4380, operators:['AFTU'],             lines:['A6','A98'] },
  { id:'pa7', name:'Parcelles Unité 5',          zone:'Parcelles',   lat:14.7478, lng:-17.4382, operators:['AFTU'],             lines:['A6'] },
  { id:'pa8', name:'Parcelles Unité 8',          zone:'Parcelles',   lat:14.7502, lng:-17.4358, operators:['AFTU'],             lines:['A25'] },
  { id:'pa9', name:'Parcelles Unité 12',         zone:'Parcelles',   lat:14.7522, lng:-17.4302, operators:['AFTU'],             lines:['A2'] },
  { id:'pa10',name:'Parcelles Unité 15',         zone:'Parcelles',   lat:14.7542, lng:-17.4272, operators:['AFTU'],             lines:['A2','A25'] },
  { id:'pa11',name:'Parcelles Unité 20',         zone:'Parcelles',   lat:14.7562, lng:-17.4282, operators:['AFTU'],             lines:['A6'] },
  { id:'pa12',name:'Parcelles Unité 23',         zone:'Parcelles',   lat:14.7578, lng:-17.4298, operators:['AFTU'],             lines:['A6','A29'] },
  { id:'ky1', name:'Khar Yalla',                 zone:'Khar Yalla',  lat:14.7503, lng:-17.4225, operators:['AFTU'],             lines:['A87','A90','A98','A101'] },
  { id:'ky2', name:'Khar Yalla Marché',          zone:'Khar Yalla',  lat:14.7531, lng:-17.4200, operators:['AFTU'],             lines:['A90','A98'] },
  { id:'ss1', name:'Sam Sam 1',                  zone:'Sam Sam',     lat:14.7603, lng:-17.4178, operators:['AFTU'],             lines:['A87','A98'] },
  { id:'ss2', name:'Sam Sam 2',                  zone:'Sam Sam',     lat:14.7653, lng:-17.4142, operators:['AFTU'],             lines:['A87','A101'] },
  { id:'zr1', name:'Zone de Recasement',         zone:'Parcelles',   lat:14.7533, lng:-17.4156, operators:['AFTU'],             lines:['A98'] },

  // ── Cambérène / Daroukhane / Tivaouane Peul (AFTU) ────────
  { id:'cb2', name:'Cambérène CRSE',             zone:'Cambérène',   lat:14.7567, lng:-17.4297, operators:['AFTU'],             lines:['A29','A50'] },
  { id:'cb4', name:'Cambérène Unité 19',         zone:'Cambérène',   lat:14.7642, lng:-17.4268, operators:['AFTU'],             lines:['A29'] },
  { id:'dk3', name:'Daroukhane Sud',             zone:'Daroukhane',  lat:14.7802, lng:-17.4152, operators:['AFTU'],             lines:['A70','A104'] },
  { id:'tp1', name:'Tivaouane Peul',             zone:'Tivaouane Peul',lat:14.7786,lng:-17.4403,operators:['AFTU'],             lines:['A88','A104'] },
  { id:'tp2', name:'Tivaouane Peul Marché',      zone:'Tivaouane Peul',lat:14.7819,lng:-17.4358,operators:['AFTU'],             lines:['A88','A96','A104'] },
  { id:'ma2', name:'Malika Plage',               zone:'Malika',      lat:14.8047, lng:-17.3592, operators:['AFTU'],             lines:['A96'] },
  { id:'ma3', name:'Malika Cité',                zone:'Malika',      lat:14.7989, lng:-17.3528, operators:['AFTU'],             lines:['A96','A104'] },

  // ── Guédiawaye internes (AFTU) ────────────────────────────
  { id:'gd10',name:'Sahm Notaire',               zone:'Guédiawaye',  lat:14.7722, lng:-17.3978, operators:['AFTU'],             lines:['A33','A20'] },
  { id:'gd12',name:'Nimzat',                     zone:'Guédiawaye',  lat:14.7820, lng:-17.4003, operators:['AFTU'],             lines:['A70','A101'] },
  { id:'kn2', name:'Keur Massar Cité SICAP',     zone:'Keur Massar', lat:14.7906, lng:-17.3058, operators:['AFTU'],             lines:['A99'] },

  // ── Pikine internes (AFTU) ────────────────────────────────
  { id:'pk2', name:'Tound Pikine',               zone:'Pikine',      lat:14.7467, lng:-17.3656, operators:['AFTU'],             lines:['A52','A68','A9'] },
  { id:'pk3', name:'Dalifort Forail',            zone:'Pikine',      lat:14.7533, lng:-17.3717, operators:['AFTU'],             lines:['A52','A9','A89'] },
  { id:'pk4', name:'Djiddah Thiaroye Kao',       zone:'Pikine',      lat:14.7408, lng:-17.3542, operators:['AFTU'],             lines:['A68','A57'] },
  { id:'pk7', name:'Pikine Extension',           zone:'Pikine',      lat:14.7453, lng:-17.3803, operators:['AFTU'],             lines:['A52','A9','A44'] },
  { id:'pk8', name:'Pikine Nord',                zone:'Pikine',      lat:14.7602, lng:-17.3782, operators:['AFTU'],             lines:['A52','A64'] },
  { id:'pk9', name:'Pikine Village',             zone:'Pikine',      lat:14.7480, lng:-17.3703, operators:['AFTU'],             lines:['A52','A9','A68'] },
  { id:'pk10',name:'Tally Icotaf',               zone:'Pikine',      lat:14.7412, lng:-17.3778, operators:['AFTU'],             lines:['A9','A85'] },
  { id:'dl2', name:'Dalifort Terminus',          zone:'Pikine',      lat:14.7572, lng:-17.3639, operators:['AFTU'],             lines:['A89'] },
  { id:'dg1', name:'Diamaguène',                 zone:'Diamaguène',  lat:14.7453, lng:-17.3558, operators:['DDD','AFTU'],      lines:['A84','A85','L49'] },
  { id:'dg2', name:'Diamaguène Marché',          zone:'Diamaguène',  lat:14.7428, lng:-17.3528, operators:['DDD','AFTU'],      lines:['A84','A85','L49'] },
  { id:'dg3', name:'Diamaguène HLM',             zone:'Diamaguène',  lat:14.7472, lng:-17.3583, operators:['AFTU'],             lines:['A84'] },
  { id:'dg4', name:'Diamaguène Cité Tamba',      zone:'Diamaguène',  lat:14.7502, lng:-17.3608, operators:['AFTU'],             lines:['A84','A85'] },
  { id:'dg5', name:'Diamaguène Cité Soprim',     zone:'Diamaguène',  lat:14.7418, lng:-17.3498, operators:['AFTU'],             lines:['A85'] },

  // ── Thiaroye Azur / Thiaroye sur Mer (AFTU) ───────────────
  { id:'th2', name:'Thiaroye sur Mer',           zone:'Thiaroye',    lat:14.7283, lng:-17.3508, operators:['DDD','AFTU'],      lines:['A57','A68','A83','L49'] },
  { id:'th4', name:'Thiaroye Kao',               zone:'Thiaroye',    lat:14.7380, lng:-17.3422, operators:['AFTU'],             lines:['A68','A57'] },
  { id:'th5', name:'Thiaroye Aviation',          zone:'Thiaroye',    lat:14.7282, lng:-17.3470, operators:['AFTU'],             lines:['A68','A57','A83'] },
  { id:'taz1',name:'Thiaroye Azur',              zone:'Thiaroye',    lat:14.7183, lng:-17.3392, operators:['AFTU'],             lines:['A57','A68','A82','A83'] },
  { id:'taz2',name:'Thiaroye Azur Plage',        zone:'Thiaroye',    lat:14.7152, lng:-17.3428, operators:['AFTU'],             lines:['A82','A83'] },
  { id:'taz3',name:'Thiaroye Azur Cité',         zone:'Thiaroye',    lat:14.7202, lng:-17.3362, operators:['AFTU'],             lines:['A82','A57'] },
  { id:'tsm1',name:'Thiaroye sur Mer Centre',    zone:'Thiaroye',    lat:14.7253, lng:-17.3488, operators:['AFTU'],             lines:['A57','A68','A83'] },
  { id:'tsm2',name:'Thiaroye sur Mer Marché',    zone:'Thiaroye',    lat:14.7272, lng:-17.3452, operators:['AFTU'],             lines:['A57','A83'] },
  { id:'tsm3',name:'Thiaroye sur Mer Extension', zone:'Thiaroye',    lat:14.7238, lng:-17.3522, operators:['AFTU'],             lines:['A68','A83'] },

  // ── Yeumbeul / Keur Massar internes (AFTU) ────────────────
  { id:'ye1', name:'Yeumbeul Nord',              zone:'Yeumbeul',    lat:14.7722, lng:-17.3452, operators:['AFTU'],             lines:['A68','A100'] },
  { id:'ye2', name:'Yeumbeul Sud',               zone:'Yeumbeul',    lat:14.7602, lng:-17.3482, operators:['AFTU'],             lines:['A26','A68'] },
  { id:'ye3', name:'Yeumbeul Marché',            zone:'Yeumbeul',    lat:14.7652, lng:-17.3502, operators:['AFTU'],             lines:['A26','A68','A100'] },
  { id:'km2', name:'Yeumbeul Est',               zone:'Yeumbeul',    lat:14.7633, lng:-17.3500, operators:['AFTU'],             lines:['A26','A52'] },
  { id:'km3', name:'Keur Mbaye Fall',            zone:'Keur Massar', lat:14.7625, lng:-17.3789, operators:['AFTU'],             lines:['A52','A65'] },
  { id:'km5', name:'Wakhinane Keur Massar',      zone:'Keur Massar', lat:14.7752, lng:-17.3302, operators:['AFTU'],             lines:['A99','A65'] },
  { id:'jx1', name:'Jaxaay',                     zone:'Jaxaay',      lat:14.7900, lng:-17.2200, operators:['AFTU'],             lines:['A51','A56','A65'] },
  { id:'sgk', name:'Sangalkam',                  zone:'Sangalkam',   lat:14.7702, lng:-17.2352, operators:['AFTU'],             lines:['A73'] },
  { id:'ba1', name:'Bambilor',                   zone:'Bambilor',    lat:14.8500, lng:-17.2500, operators:['AFTU'],             lines:['A73'] },

  // ── Mbao / Rufisque internes (AFTU) ───────────────────────
  { id:'mb2', name:'Mbao Marché',                zone:'Mbao',        lat:14.7483, lng:-17.2956, operators:['AFTU'],             lines:['A40','A44'] },
  { id:'mb4', name:'Grand Mbao Marché',          zone:'Mbao',        lat:14.7532, lng:-17.2952, operators:['AFTU'],             lines:['A40','A44'] },
  { id:'mb6', name:'Mbao Sotrac',                zone:'Mbao',        lat:14.7462, lng:-17.3075, operators:['AFTU'],             lines:['A40','A43'] },
  { id:'mb7', name:'Mbao Cité CIF',              zone:'Mbao',        lat:14.7518, lng:-17.2988, operators:['AFTU'],             lines:['A43','A44'] },
  { id:'mb8', name:'Mbao Cité Cayor',            zone:'Mbao',        lat:14.7542, lng:-17.2933, operators:['AFTU'],             lines:['A40','A43'] },
  { id:'rf3', name:'Rufisque Keury Kaw',         zone:'Rufisque',    lat:14.7252, lng:-17.2700, operators:['AFTU'],             lines:['A40','A12'] },
  { id:'rf4', name:'Rufisque Diokoul',           zone:'Rufisque',    lat:14.7182, lng:-17.2803, operators:['AFTU'],             lines:['A12','A55'] },
  { id:'rf5', name:'Rufisque Santhiaba',         zone:'Rufisque',    lat:14.7132, lng:-17.2752, operators:['AFTU'],             lines:['A12','A57'] },
  { id:'rf6', name:'Touba Toul',                 zone:'Rufisque',    lat:14.7332, lng:-17.2602, operators:['AFTU'],             lines:['A12','A40'] },
  { id:'bg2', name:'Bargny Marché',              zone:'Bargny',      lat:14.6978, lng:-17.2244, operators:['AFTU'],             lines:['A95'] },
  { id:'di2', name:'Diamniadio Technopole',      zone:'Diamniadio',  lat:14.7347, lng:-17.1639, operators:['AFTU'],             lines:['A92','A93'] },

  // ── Hann internes (AFTU) ──────────────────────────────────
  { id:'ha3', name:'Hann Bel-Air',               zone:'Hann',        lat:14.7225, lng:-17.4100, operators:['AFTU'],             lines:['A51','A86'] },
  { id:'ha5', name:'Hann Marché',                zone:'Hann',        lat:14.7248, lng:-17.4050, operators:['AFTU'],             lines:['A86'] },
  { id:'ha6', name:'Hann Maristes',              zone:'Hann',        lat:14.7308, lng:-17.4133, operators:['DDD','AFTU'],      lines:['A86','L49'] },
  { id:'ha7', name:'Hann Maristes Cité',         zone:'Hann',        lat:14.7335, lng:-17.4108, operators:['DDD','AFTU'],      lines:['A86','L49'] },
  { id:'ha8', name:'Hann Maristes Carrefour',    zone:'Hann',        lat:14.7282, lng:-17.4158, operators:['AFTU'],             lines:['A86'] },
  { id:'hr1', name:'Hann Pêcheurs',              zone:'Hann',        lat:14.7136, lng:-17.4069, operators:['AFTU'],             lines:['A86'] },
  // ── Hann Mariste — arrêt carrefour Route Nationale ────────────
  { id:'hm1', name:'Hann Mariste Carrefour RN',  zone:'Hann',        lat:14.7327, lng:-17.4015, operators:['DDD'],             lines:['L49'] },

  // ════════════════════════════════════════════════════════════
  //  NOUVEAUX ARRÊTS — Densification (< 500 m de marche)
  // ════════════════════════════════════════════════════════════

  // ── DDD Corridor: Colobane → Liberté 1 (intermédiaires) ──
  { id:'cl1', name:'Amitié Carrefour',             zone:'Amitié',      lat:14.7045, lng:-17.4512, operators:['DDD'],              lines:['L9','L10','L13'] },
  { id:'cl2', name:'Cité Gorgui',                  zone:'Amitié',      lat:14.6995, lng:-17.4497, operators:['DDD'],              lines:['L9','L10'] },
  { id:'cl3', name:'Gueule Tapée Bis',             zone:'Médina',      lat:14.6955, lng:-17.4483, operators:['DDD'],              lines:['L9','L3'] },

  // ── DDD Route Nationale: Front de Terre → Pikine ─────────
  { id:'rn1', name:'Hann Zone Industrielle 2',     zone:'Hann',        lat:14.7203, lng:-17.4028, operators:['DDD'],              lines:['L12','L15','L45','L46'] },
  { id:'rn2', name:'Hann Cité Biagui',             zone:'Hann',        lat:14.7237, lng:-17.3997, operators:['DDD'],              lines:['L12','L15'] },
  { id:'rn3', name:'Pikine Route Nationale 1',     zone:'Pikine',      lat:14.7303, lng:-17.3953, operators:['DDD'],              lines:['L12','L15'] },
  { id:'rn4', name:'Pikine Route Nationale 2',     zone:'Pikine',      lat:14.7358, lng:-17.3925, operators:['DDD'],              lines:['L12','L35'] },
  { id:'rn5', name:'Pikine Route Nationale 3',     zone:'Pikine',      lat:14.7408, lng:-17.3900, operators:['DDD'],              lines:['L12','L35','L46'] },
  { id:'rn6', name:'Pikine Entrée RN',             zone:'Pikine',      lat:14.7453, lng:-17.3875, operators:['DDD'],              lines:['L12','L15','L35'] },

  // ── DDD axe Liberté–Plateau intermédiaires ────────────────
  { id:'p21', name:'Avenue Pompidou',              zone:'Plateau',     lat:14.6769, lng:-17.4447, operators:['DDD'],              lines:['L6','L9','L10'] },
  { id:'p22', name:'Médina Santiaba',              zone:'Médina',      lat:14.6836, lng:-17.4458, operators:['DDD'],              lines:['L9','L3'] },

  // ── DDD VDN / Parcelles–Cambérène axe Nord ───────────────
  { id:'vd1', name:'VDN Bifurcation',              zone:'Patte d\'Oie',lat:14.7278, lng:-17.4678, operators:['DDD'],              lines:['L16','L38'] },
  { id:'vd2', name:'Cité ASECNA',                  zone:'Patte d\'Oie',lat:14.7303, lng:-17.4703, operators:['DDD'],              lines:['L16','L18'] },
  { id:'p24', name:'Parcelles–Cambérène km16',     zone:'Parcelles',   lat:14.7567, lng:-17.4220, operators:['DDD'],              lines:['L19','L29'] },
  { id:'p23', name:'Guédiawaye km17',              zone:'Guédiawaye',  lat:14.7547, lng:-17.4142, operators:['DDD'],              lines:['L11','L2'] },

  // ── Fann / Point-E / Mermoz densification AFTU ────────────
  { id:'fa1', name:'Fann Résidence Nord',          zone:'Fann',        lat:14.6967, lng:-17.4708, operators:['AFTU'],             lines:['A36','A24'] },
  { id:'fa2', name:'Fann Stade Iba Mar Diop',      zone:'Fann',        lat:14.6978, lng:-17.4628, operators:['AFTU'],             lines:['A97','A36'] },
  { id:'fa3', name:'UCAD Bibliothèque',            zone:'Fann',        lat:14.6931, lng:-17.4598, operators:['AFTU'],             lines:['A34','A17'] },
  { id:'fa4', name:'Cité Universitaire',           zone:'Fann',        lat:14.6911, lng:-17.4545, operators:['AFTU'],             lines:['A17','A34'] },
  { id:'fa5', name:'Fann Colobane Bis',            zone:'Fann',        lat:14.6942, lng:-17.4531, operators:['AFTU'],             lines:['A18','A34'] },
  { id:'fa6', name:'Point-E Boulevard',            zone:'Point-E',     lat:14.7011, lng:-17.4672, operators:['AFTU'],             lines:['A16','A97'] },
  { id:'fa7', name:'Mermoz Cité',                  zone:'Mermoz',      lat:14.7119, lng:-17.4764, operators:['AFTU'],             lines:['A97','A102'] },
  { id:'fa8', name:'Mermoz Liberté 6',             zone:'Mermoz',      lat:14.7069, lng:-17.4683, operators:['AFTU'],             lines:['A91','A102'] },

  // ── Sicap / HLM densification AFTU ───────────────────────
  { id:'si4', name:'Sicap Amitié',                 zone:'Sicap',       lat:14.7078, lng:-17.4638, operators:['AFTU'],             lines:['A34','A16'] },
  { id:'si5', name:'Sicap Foire Extension',        zone:'Sicap',       lat:14.7136, lng:-17.4650, operators:['AFTU'],             lines:['A34','A16'] },
  { id:'si6', name:'Sicap Liberté 2',              zone:'Sicap',       lat:14.7107, lng:-17.4617, operators:['AFTU'],             lines:['A34','A91'] },
  { id:'hlm5',name:'HLM 3',                        zone:'HLM',         lat:14.7125, lng:-17.4470, operators:['AFTU'],             lines:['A15','A17'] },
  { id:'hlm6',name:'HLM 7',                        zone:'HLM',         lat:14.7183, lng:-17.4492, operators:['AFTU'],             lines:['A15'] },
  { id:'gd13',name:'Grand Dakar Extension',        zone:'Grand Dakar', lat:14.7058, lng:-17.4520, operators:['AFTU'],             lines:['A30'] },
  { id:'gd14',name:'Grand Dakar Cité 2',           zone:'Grand Dakar', lat:14.7022, lng:-17.4525, operators:['AFTU'],             lines:['A30'] },
  { id:'gd15',name:'Biscuiterie Cité',             zone:'Grand Dakar', lat:14.6997, lng:-17.4490, operators:['AFTU'],             lines:['A15'] },

  // ── Ouakam / Ngor / Almadies densification AFTU ───────────
  { id:'ok4', name:'Ouakam Cité',                  zone:'Ouakam',      lat:14.7228, lng:-17.4948, operators:['AFTU'],             lines:['A35','A94'] },
  { id:'ok5', name:'Ouakam Bifurcation',           zone:'Ouakam',      lat:14.7203, lng:-17.4930, operators:['AFTU'],             lines:['A91','A42'] },
  { id:'ok6', name:'Ouakam Mosquée',               zone:'Ouakam',      lat:14.7239, lng:-17.4903, operators:['AFTU'],             lines:['A35','A36'] },
  { id:'ng3', name:'Ngor Aéroport Bis',            zone:'Ngor',        lat:14.7497, lng:-17.5008, operators:['AFTU'],             lines:['A49','A94'] },
  { id:'ng4', name:'Ngor Plage',                   zone:'Ngor',        lat:14.7542, lng:-17.5003, operators:['AFTU'],             lines:['A49','A105'] },
  { id:'al2', name:'Almadies Résidence',           zone:'Almadies',    lat:14.7453, lng:-17.5072, operators:['AFTU'],             lines:['A49','A61'] },
  { id:'al3', name:'Almadies Club',                zone:'Almadies',    lat:14.7467, lng:-17.5133, operators:['AFTU'],             lines:['A91','A94'] },
  { id:'ca2', name:'Castors Marché',               zone:'Castors',     lat:14.7147, lng:-17.4800, operators:['AFTU'],             lines:['A94','A91'] },
  { id:'of3', name:'Ouest Foire Entrée',           zone:'Ouest Foire', lat:14.7325, lng:-17.4817, operators:['AFTU'],             lines:['A94','A105'] },

  // ── Yoff / Grand Yoff densification AFTU ─────────────────
  { id:'yf6', name:'Yoff Cité II',                 zone:'Yoff',        lat:14.7472, lng:-17.4869, operators:['AFTU'],             lines:['A10','A4'] },
  { id:'yf7', name:'Yoff Route Aéroport',          zone:'Yoff',        lat:14.7433, lng:-17.4893, operators:['AFTU'],             lines:['A66','A105'] },
  { id:'yf8', name:'Yoff Résidence',               zone:'Yoff',        lat:14.7453, lng:-17.4847, operators:['AFTU'],             lines:['A10','A66'] },
  { id:'gy7', name:'Grand Yoff Centre',            zone:'Grand Yoff',  lat:14.7298, lng:-17.4528, operators:['AFTU'],             lines:['A3','A66'] },
  { id:'gy8', name:'Grand Yoff Cité Gestion',      zone:'Grand Yoff',  lat:14.7278, lng:-17.4560, operators:['AFTU'],             lines:['A3','A7'] },
  { id:'gy9', name:'Grand Yoff Extension',         zone:'Grand Yoff',  lat:14.7322, lng:-17.4512, operators:['AFTU'],             lines:['A66','A3'] },
  { id:'gy10',name:'Grand Yoff Sud',               zone:'Grand Yoff',  lat:14.7262, lng:-17.4543, operators:['AFTU'],             lines:['A18','A66'] },

  // ── Parcelles densification AFTU ──────────────────────────
  { id:'pa13',name:'Parcelles Unité 3',            zone:'Parcelles',   lat:14.7458, lng:-17.4395, operators:['AFTU'],             lines:['A6','A98'] },
  { id:'pa14',name:'Parcelles Unité 6',            zone:'Parcelles',   lat:14.7483, lng:-17.4375, operators:['AFTU'],             lines:['A6'] },
  { id:'pa15',name:'Parcelles Unité 9',            zone:'Parcelles',   lat:14.7503, lng:-17.4348, operators:['AFTU'],             lines:['A25','A2'] },
  { id:'pa16',name:'Parcelles Unité 13',           zone:'Parcelles',   lat:14.7528, lng:-17.4315, operators:['AFTU'],             lines:['A2','A25'] },
  { id:'pa17',name:'Parcelles Unité 18',           zone:'Parcelles',   lat:14.7548, lng:-17.4258, operators:['AFTU'],             lines:['A2','A90'] },
  { id:'pa18',name:'Parcelles Unité 21',           zone:'Parcelles',   lat:14.7567, lng:-17.4273, operators:['AFTU'],             lines:['A6','A90'] },
  { id:'pa19',name:'Parcelles Unité 24',           zone:'Parcelles',   lat:14.7592, lng:-17.4310, operators:['AFTU'],             lines:['A29','A90'] },
  { id:'pa20',name:'Parcelles Cité Lobatt Fall',   zone:'Parcelles',   lat:14.7468, lng:-17.4358, operators:['AFTU'],             lines:['A98','A6'] },
  { id:'pa21',name:'Parcelles Cité Asecna',        zone:'Parcelles',   lat:14.7517, lng:-17.4335, operators:['AFTU'],             lines:['A2','A25'] },
  { id:'pa22',name:'Parcelles Unité 25 Bis',       zone:'Parcelles',   lat:14.7608, lng:-17.4295, operators:['AFTU'],             lines:['A29','A13'] },

  // ── Sam Sam / Khar Yalla densification AFTU ───────────────
  { id:'ky3', name:'Khar Yalla Extension',         zone:'Khar Yalla',  lat:14.7520, lng:-17.4181, operators:['AFTU'],             lines:['A87','A98'] },
  { id:'ky4', name:'Khar Yalla Nord',              zone:'Khar Yalla',  lat:14.7548, lng:-17.4217, operators:['AFTU'],             lines:['A90','A87'] },
  { id:'ss3', name:'Sam Sam 3',                    zone:'Sam Sam',     lat:14.7625, lng:-17.4128, operators:['AFTU'],             lines:['A87','A101'] },
  { id:'ss4', name:'Sam Sam 4',                    zone:'Sam Sam',     lat:14.7642, lng:-17.4108, operators:['AFTU'],             lines:['A101','A87'] },
  { id:'zr2', name:'Zone Recasement Est',          zone:'Parcelles',   lat:14.7553, lng:-17.4138, operators:['AFTU'],             lines:['A98','A90'] },

  // ── Cambérène / Daroukhane / Tivaouane / Malika AFTU ──────
  { id:'cb5', name:'Cambérène Extension',          zone:'Cambérène',   lat:14.7700, lng:-17.4228, operators:['AFTU'],             lines:['A29','A50'] },
  { id:'cb6', name:'Cambérène Cité Soprim',        zone:'Cambérène',   lat:14.7658, lng:-17.4252, operators:['AFTU'],             lines:['A29','A13'] },
  { id:'cb7', name:'Cambérène Marché',             zone:'Cambérène',   lat:14.7617, lng:-17.4272, operators:['AFTU'],             lines:['A13','A29'] },
  { id:'dk4', name:'Daroukhane Est',               zone:'Daroukhane',  lat:14.7861, lng:-17.4147, operators:['AFTU'],             lines:['A70','A104'] },
  { id:'tp3', name:'Tivaouane Peul Extension',     zone:'Tivaouane Peul',lat:14.7800,lng:-17.4380,operators:['AFTU'],             lines:['A88','A96'] },
  { id:'ma4', name:'Malika Nord',                  zone:'Malika',      lat:14.7978, lng:-17.3503, operators:['AFTU'],             lines:['A96','A104'] },
  { id:'ma5', name:'Malika Extension',             zone:'Malika',      lat:14.8017, lng:-17.3547, operators:['AFTU'],             lines:['A96','A50'] },
  { id:'ml2', name:'Malika Cité II',               zone:'Malika',      lat:14.7967, lng:-17.3447, operators:['AFTU'],             lines:['A75','A96'] },

  // ── Guédiawaye densification AFTU ────────────────────────
  { id:'gd16',name:'Guédiawaye Cité Aliou',        zone:'Guédiawaye',  lat:14.7728, lng:-17.4028, operators:['AFTU'],             lines:['A27','A56'] },
  { id:'gd17',name:'Guédiawaye Ndoye Mbaye',       zone:'Guédiawaye',  lat:14.7753, lng:-17.4058, operators:['AFTU'],             lines:['A56','A27'] },
  { id:'gd18',name:'Guédiawaye Wakhinane 2',       zone:'Guédiawaye',  lat:14.7847, lng:-17.4008, operators:['AFTU'],             lines:['A75','A27'] },
  { id:'gd19',name:'Guédiawaye Grand Médine',      zone:'Guédiawaye',  lat:14.7797, lng:-17.3975, operators:['AFTU'],             lines:['A70','A64'] },
  { id:'gd20',name:'Golf Franc',                   zone:'Guédiawaye',  lat:14.7825, lng:-17.3968, operators:['AFTU'],             lines:['A56','A64'] },
  { id:'gd21',name:'Guédiawaye Cité Mansor',       zone:'Guédiawaye',  lat:14.7783, lng:-17.3947, operators:['AFTU'],             lines:['A64','A84'] },
  { id:'gd22',name:'Nimzat Extension',             zone:'Guédiawaye',  lat:14.7839, lng:-17.4025, operators:['AFTU'],             lines:['A27','A75'] },

  // ── Pikine densification AFTU ─────────────────────────────
  { id:'pk12',name:'Pikine Cité Fayçal',           zone:'Pikine',      lat:14.7432, lng:-17.3826, operators:['AFTU'],             lines:['A9','A52'] },
  { id:'pk13',name:'Pikine Rue 10',                zone:'Pikine',      lat:14.7447, lng:-17.3780, operators:['AFTU'],             lines:['A9','A85'] },
  { id:'pk14',name:'Pikine Cité Derrière',         zone:'Pikine',      lat:14.7462, lng:-17.3672, operators:['AFTU'],             lines:['A52','A68'] },
  { id:'pk15',name:'Pikine Cité Keur Massar',      zone:'Pikine',      lat:14.7487, lng:-17.3728, operators:['AFTU'],             lines:['A52','A9'] },
  { id:'pk16',name:'Pikine Nord Marché',           zone:'Pikine',      lat:14.7622, lng:-17.3803, operators:['AFTU'],             lines:['A64','A52'] },
  { id:'pk17',name:'Pikine Cité Soprim',           zone:'Pikine',      lat:14.7468, lng:-17.3843, operators:['AFTU'],             lines:['A9','A52'] },
  { id:'pk18',name:'Pikine Cité Khar Yalla',       zone:'Pikine',      lat:14.7513, lng:-17.3750, operators:['AFTU'],             lines:['A52','A9'] },
  { id:'pk19',name:'Pikine Unité 19',              zone:'Pikine',      lat:14.7397, lng:-17.3750, operators:['AFTU'],             lines:['A68','A84'] },
  { id:'pk20',name:'Pikine Cité Darou',            zone:'Pikine',      lat:14.7518, lng:-17.3778, operators:['AFTU'],             lines:['A52','A64'] },

  // ── Diamaguène densification AFTU ─────────────────────────
  { id:'dg6', name:'Diamaguène Résidence',         zone:'Diamaguène',  lat:14.7487, lng:-17.3543, operators:['AFTU'],             lines:['A84','A85'] },
  { id:'dg7', name:'Diamaguène Extension',         zone:'Diamaguène',  lat:14.7458, lng:-17.3572, operators:['AFTU'],             lines:['A84','A68'] },
  { id:'dg8', name:'Diamaguène Cité 2',            zone:'Diamaguène',  lat:14.7512, lng:-17.3583, operators:['AFTU'],             lines:['A84','A85'] },

  // ── Thiaroye densification AFTU ───────────────────────────
  { id:'th6', name:'Thiaroye Cité Soprim',         zone:'Thiaroye',    lat:14.7322, lng:-17.3488, operators:['AFTU'],             lines:['A57','A83'] },
  { id:'th7', name:'Thiaroye Cité Planète',        zone:'Thiaroye',    lat:14.7347, lng:-17.3458, operators:['AFTU'],             lines:['A68','A57'] },
  { id:'th8', name:'Thiaroye Cité HLM',            zone:'Thiaroye',    lat:14.7367, lng:-17.3405, operators:['AFTU'],             lines:['A68','A89'] },
  { id:'th9', name:'Thiaroye Extension Nord',      zone:'Thiaroye',    lat:14.7400, lng:-17.3452, operators:['AFTU'],             lines:['A68','A82'] },
  { id:'taz4',name:'Thiaroye Azur Extension',      zone:'Thiaroye',    lat:14.7183, lng:-17.3360, operators:['AFTU'],             lines:['A82','A57'] },
  { id:'taz5',name:'Thiaroye Azur Résidence',      zone:'Thiaroye',    lat:14.7167, lng:-17.3408, operators:['AFTU'],             lines:['A82','A83'] },
  { id:'tsm4',name:'TSM Extension',                zone:'Thiaroye',    lat:14.7242, lng:-17.3455, operators:['AFTU'],             lines:['A83','A68'] },
  { id:'tsm5',name:'TSM Nord',                     zone:'Thiaroye',    lat:14.7258, lng:-17.3517, operators:['AFTU'],             lines:['A83','A57'] },

  // ── Yeumbeul / Keur Massar densification AFTU ─────────────
  { id:'ye4', name:'Yeumbeul Extension',           zone:'Yeumbeul',    lat:14.7637, lng:-17.3465, operators:['AFTU'],             lines:['A68','A26'] },
  { id:'ye5', name:'Yeumbeul Cité',                zone:'Yeumbeul',    lat:14.7667, lng:-17.3478, operators:['AFTU'],             lines:['A100','A68'] },
  { id:'ye6', name:'Yeumbeul Marché 2',            zone:'Yeumbeul',    lat:14.7692, lng:-17.3488, operators:['AFTU'],             lines:['A100','A26'] },
  { id:'km7', name:'Keur Massar Cité Biagui',      zone:'Keur Massar', lat:14.7803, lng:-17.3217, operators:['AFTU'],             lines:['A65','A51'] },
  { id:'km8', name:'Keur Massar Route',            zone:'Keur Massar', lat:14.7817, lng:-17.3167, operators:['AFTU'],             lines:['A99','A65'] },
  { id:'km9', name:'Keur Massar Extension Est',    zone:'Keur Massar', lat:14.7843, lng:-17.3108, operators:['AFTU'],             lines:['A99','A56'] },
  { id:'km10',name:'Keur Massar Centre Bis',       zone:'Keur Massar', lat:14.7853, lng:-17.3152, operators:['AFTU'],             lines:['A65','A99'] },
  { id:'kn3', name:'Keur Massar Nord Bis',         zone:'Keur Massar', lat:14.7983, lng:-17.3083, operators:['AFTU'],             lines:['A56','A73'] },
  { id:'kn4', name:'Keur Massar Nord Cité',        zone:'Keur Massar', lat:14.7967, lng:-17.3119, operators:['AFTU'],             lines:['A56','A99'] },

  // ── Mbao densification AFTU ───────────────────────────────
  { id:'mb9', name:'Grand Mbao Extension',         zone:'Mbao',        lat:14.7517, lng:-17.2897, operators:['AFTU'],             lines:['A40','A44'] },
  { id:'mb10',name:'Mbao Cité Keur Ndiaye',        zone:'Mbao',        lat:14.7497, lng:-17.2972, operators:['AFTU'],             lines:['A43','A44'] },
  { id:'mb11',name:'Mbao Résidence',               zone:'Mbao',        lat:14.7508, lng:-17.2942, operators:['AFTU'],             lines:['A40','A43'] },
  { id:'mb12',name:'Mbao Cité CIF 2',              zone:'Mbao',        lat:14.7528, lng:-17.2963, operators:['AFTU'],             lines:['A43','A40'] },

  // ── Rufisque densification AFTU ───────────────────────────
  { id:'rf8', name:'Rufisque Colobane',            zone:'Rufisque',    lat:14.7202, lng:-17.2773, operators:['AFTU'],             lines:['A12','A55'] },
  { id:'rf9', name:'Rufisque Thiawlène',           zone:'Rufisque',    lat:14.7173, lng:-17.2836, operators:['AFTU'],             lines:['A55','A12'] },
  { id:'rf10',name:'Rufisque PAPS',                zone:'Rufisque',    lat:14.7242, lng:-17.2762, operators:['AFTU'],             lines:['A12','A40'] },

  // ── Hann densification AFTU ───────────────────────────────
  { id:'ha9', name:'Hann Maristes Extension',      zone:'Hann',        lat:14.7352, lng:-17.4092, operators:['AFTU'],             lines:['A86'] },
  { id:'ha10',name:'Hann Cité Mixte',              zone:'Hann',        lat:14.7272, lng:-17.4183, operators:['AFTU'],             lines:['A86'] },
  { id:'ha11',name:'Hann Bel-Air Extension',       zone:'Hann',        lat:14.7208, lng:-17.4133, operators:['AFTU'],             lines:['A86'] },
  { id:'ha12',name:'Hann Pêcheurs Plage',          zone:'Hann',        lat:14.7108, lng:-17.4092, operators:['AFTU'],             lines:['A86'] },

  // ── Médina / Tilène densification AFTU ────────────────────
  { id:'me4', name:'Médina Rue 8',                 zone:'Médina',      lat:14.6863, lng:-17.4448, operators:['AFTU'],             lines:['A18','A20'] },
  { id:'me5', name:'Médina Pharmacie',             zone:'Médina',      lat:14.6892, lng:-17.4453, operators:['AFTU'],             lines:['A18','A30'] },
  { id:'me6', name:'Médina Liberté',               zone:'Médina',      lat:14.6917, lng:-17.4462, operators:['AFTU'],             lines:['A20','A30'] },
  { id:'ti3', name:'Tilène Bis',                   zone:'Médina',      lat:14.6822, lng:-17.4458, operators:['AFTU'],             lines:['A30','A18'] },
  { id:'ti4', name:'Tilène Est',                   zone:'Médina',      lat:14.6858, lng:-17.4430, operators:['AFTU'],             lines:['A18','A20'] },

  // ── Bargny / Diamniadio densification AFTU ────────────────
  { id:'bg3', name:'Bargny Extension',             zone:'Bargny',      lat:14.6992, lng:-17.2258, operators:['AFTU'],             lines:['A95','A93'] },
  { id:'di4', name:'Diamniadio Parc Industriel',   zone:'Diamniadio',  lat:14.7311, lng:-17.1680, operators:['AFTU'],             lines:['A92','A103'] },
  { id:'di5', name:'Diamniadio Cité',              zone:'Diamniadio',  lat:14.7275, lng:-17.1725, operators:['AFTU'],             lines:['A92','A93'] },

  // ── Guinaw Rails / Dalifort densification AFTU ────────────
  { id:'gr3', name:'Guinaw Rails Centre',          zone:'Guinaw Rails', lat:14.7400, lng:-17.3805, operators:['AFTU'],            lines:['A100','A84'] },
  { id:'dl3', name:'Dalifort Cité',                zone:'Pikine',      lat:14.7547, lng:-17.3647, operators:['AFTU'],             lines:['A89','A52'] },

  // ── BRT ───────────────────────────────────────────────────
  { id:'b01', name:'Petersen (BRT)',             zone:'Plateau',     lat:14.6811, lng:-17.4464, operators:['BRT'],              lines:['BRT-L1'] },
  { id:'b02', name:'Colobane (BRT)',             zone:'Médina',      lat:14.6908, lng:-17.4478, operators:['BRT'],              lines:['BRT-L1'] },
  { id:'b03', name:'Liberté 6 (BRT)',            zone:'Liberté',     lat:14.7200, lng:-17.4558, operators:['BRT'],              lines:['BRT-L1'] },
  { id:'b04', name:'Grand Yoff (BRT)',           zone:'Grand Yoff',  lat:14.7268, lng:-17.4553, operators:['BRT'],              lines:['BRT-L1'] },
  { id:'b05', name:'CICES (BRT)',                zone:'CICES',       lat:14.7342, lng:-17.4681, operators:['BRT'],              lines:['BRT-L1'] },
  { id:'b06', name:'Patte d\'Oie (BRT)',         zone:'Patte d\'Oie',lat:14.7247, lng:-17.4672, operators:['BRT'],              lines:['BRT-L1'] },
  { id:'b07', name:'Sam Notaire (BRT)',          zone:'Guédiawaye',  lat:14.7672, lng:-17.4072, operators:['BRT'],              lines:['BRT-L1'] },

  // ── TER ───────────────────────────────────────────────────
  { id:'t01', name:'Dakar Gare TER',             zone:'Plateau',     lat:14.6697, lng:-17.4386, operators:['TER'],              lines:['TER-01'], terConnection:true },
  { id:'t02', name:'Thiaroye Gare TER',          zone:'Thiaroye',    lat:14.7300, lng:-17.3558, operators:['TER'],              lines:['TER-01'], terConnection:true },
  { id:'t03', name:'Rufisque Gare TER',          zone:'Rufisque',    lat:14.7142, lng:-17.2753, operators:['TER'],              lines:['TER-01'], terConnection:true },
  { id:'t04', name:'Bargny Gare TER',            zone:'Bargny',      lat:14.6964, lng:-17.2269, operators:['TER'],              lines:['TER-01'], terConnection:true },
  { id:'t05', name:'Diamniadio Gare TER',        zone:'Diamniadio',  lat:14.7289, lng:-17.1742, operators:['TER'],              lines:['TER-01'], terConnection:true },
  { id:'t06', name:'AIBD Aéroport',              zone:'AIBD',        lat:14.7411, lng:-17.0900, operators:['TER'],              lines:['TER-01'], terConnection:true },
  { id:'t07', name:'Sébikotane Gare TER',        zone:'Sébikotane',  lat:14.7403, lng:-17.0953, operators:['TER'],              lines:['TER-01'], terConnection:true },
];

// ══════════════════════════════════════════════════════════════
//  LIGNES DDD — Artères principales, grands bus
//  Territoire : Plateau ↔ banlieues, via boulevards majeurs.
//  Arrêts = intersections principales, espacement ~600 m.
// ══════════════════════════════════════════════════════════════
const DDD_LINES: Line[] = [
  // ── Axe Plateau–Liberté–Nord ──────────────────────────────
  { id:'L1',   name:'Ligne 1',   operator:'DDD', route:'Parcelles ↔ Leclerc',                  color:'#1a56db', freq:'8 min',  tarif:200, stops:['pa1','pa5','pa3','lb5','lc1'] },
  { id:'L2',   name:'Ligne 2',   operator:'DDD', route:'Daroukhane ↔ Leclerc',                 color:'#2563eb', freq:'10 min', tarif:200, stops:['dk2','dk1','gd5','gd2','gd1','lb5','lc1'] },
  { id:'L3',   name:'Ligne 3',   operator:'DDD', route:'Palais ↔ Médina ↔ Colobane',           color:'#1a56db', freq:'8 min',  tarif:200, stops:['p01','p16','me3','p11','p05','p03','p04'] },
  { id:'L4',   name:'Ligne 4',   operator:'DDD', route:'Liberté 5 ↔ Leclerc',                  color:'#3b82f6', freq:'8 min',  tarif:200, stops:['lb5','sc1','lb1','lb3','lc1'] },
  { id:'L5',   name:'Ligne 5',   operator:'DDD', route:'HLM ↔ Stade Senghor ↔ Palais',         color:'#2563eb', freq:'10 min', tarif:200, stops:['hlm1','sc7','p05','p03','p08','p01'] },
  { id:'L6',   name:'Ligne 6',   operator:'DDD', route:'Parcelles ↔ Palais',                   color:'#1d4ed8', freq:'12 min', tarif:200, stops:['pa1','pa5','pa3','cb1','lb5','lb6','p03','p08','p01'] },
  { id:'L7',   name:'Ligne 7',   operator:'DDD', route:'Ouakam ↔ Palais',                      color:'#3b82f6', freq:'15 min', tarif:200, stops:['ok1','yf2','bm1','ha2','p03','p15','p08','p01'] },
  { id:'L8',   name:'Ligne 8',   operator:'DDD', route:'Yoff ↔ Palais',                        color:'#60a5fa', freq:'15 min', tarif:200, stops:['yf1','yf2','ha2','bm1','ha4','p03','p15','p01'] },
  { id:'L9',   name:'Ligne 9',   operator:'DDD', route:'Liberté 6 ↔ Palais',                   color:'#2563eb', freq:'10 min', tarif:200, stops:['lb6','sc1','lb1','cl1','cl2','cl3','p22','p04','p11','p05','p21','p03','p01'] },
  { id:'L10',  name:'Ligne 10',  operator:'DDD', route:'Liberté 5 ↔ Palais',                   color:'#1e40af', freq:'12 min', tarif:200, stops:['lb5','sc1','lb2','lb1','cl1','cl2','p11','p05','p21','p03','p01'] },
  { id:'L13',  name:'Ligne 13',  operator:'DDD', route:'Liberté 5 ↔ Palais (Sicap)',           color:'#3b82f6', freq:'10 min', tarif:200, stops:['lb5','lb4','lb3','lb2','lb6','sc7','p05','p03','p01'] },
  { id:'L14',  name:'Ligne 14',  operator:'DDD', route:'Liberté 5 ↔ Leclerc (Axe Sicap)',     color:'#93c5fd', freq:'15 min', tarif:200, stops:['lb5','sc1','lb1','lc1'] },
  { id:'L18',  name:'Ligne 18',  operator:'DDD', route:'Cité Millionnaire ↔ Leclerc',          color:'#2563eb', freq:'20 min', tarif:200, stops:['cm1','zo1','nf1','gy3','po1','sc8','lb5','lb4','lb3','lb1','lc1'] },
  { id:'L20',  name:'Ligne 20',  operator:'DDD', route:'Grand Yoff ↔ Palais Express',          color:'#1d4ed8', freq:'10 min', tarif:200, stops:['p01','lc1','lc2','gy1','sc8','lb5'] },
  { id:'L26',  name:'Ligne 26',  operator:'DDD', route:'HLM ↔ Palais',                         color:'#1a56db', freq:'10 min', tarif:200, stops:['hlm1','p11','me3','p05','p03','p08','p01'] },
  { id:'L27',  name:'Ligne 27',  operator:'DDD', route:'Sicap ↔ Palais (Avenue)',              color:'#2563eb', freq:'12 min', tarif:200, stops:['sc1','p17','p15','p08','p01'] },
  { id:'L42',  name:'Ligne 42',  operator:'DDD', route:'Zone C–B ↔ Liberté 6',                color:'#3b82f6', freq:'10 min', tarif:200, stops:['lb1','lb2','lb3','lb4','lb6'] },
  { id:'L43',  name:'Ligne 43',  operator:'DDD', route:'HLM ↔ Grand Yoff',                    color:'#2563eb', freq:'15 min', tarif:200, stops:['lc1','lc2','sc8','gy3','gy1'] },

  // ── Axe Route Nationale — Pikine, Thiaroye, Rufisque ──────
  { id:'L12',  name:'Ligne 12',  operator:'DDD', route:'Guédiawaye ↔ Palais',                  color:'#1a56db', freq:'12 min', tarif:200, stops:['gd4','gd1','gd8','gd3','pk1','rn6','rn5','rn4','rn3','rn2','rn1','ha2','p03','p01'] },
  { id:'L15',  name:'Ligne 15',  operator:'DDD', route:'Rufisque ↔ Palais',                    color:'#1d4ed8', freq:'20 min', tarif:300, stops:['rf1','rf2','th1','pk5','pk1','rn6','rn3','rn2','rn1','ha4','ha2','p03','p10','p01'] },
  { id:'L21',  name:'Ligne 21',  operator:'DDD', route:'Keur Massar ↔ Palais Express',         color:'#1e3a8a', freq:'20 min', tarif:300, stops:['km1','km4','km6','pk1','ha2','p03','p01'] },
  { id:'L24',  name:'Ligne 24',  operator:'DDD', route:'Pikine ↔ Ouakam',                      color:'#1d4ed8', freq:'20 min', tarif:200, stops:['pk1','pk5','pk6','gd3','gd8','gd1','gy1','ok1'] },
  { id:'L30',  name:'Ligne 30',  operator:'DDD', route:'Thiaroye ↔ Leclerc',                   color:'#1e40af', freq:'20 min', tarif:250, stops:['th1','th3','pk1','pk5','pk6','gd3','gd1','lb5','lc1'] },
  { id:'L33',  name:'Ligne 33',  operator:'DDD', route:'Rufisque ↔ Liberté 6',                 color:'#1d4ed8', freq:'25 min', tarif:350, stops:['rf1','rf2','th3','th1','pk1','ha2','lb6'] },
  { id:'L35',  name:'Ligne 35',  operator:'DDD', route:'Pikine ↔ Palais',                      color:'#3b82f6', freq:'20 min', tarif:250, stops:['pk1','rn6','rn5','rn4','pk11','pk5','pk6','bm1','ha2','p16','p08','p10','p01'] },
  { id:'L44',  name:'Ligne 44',  operator:'DDD', route:'Pikine ↔ Guédiawaye',                  color:'#1d4ed8', freq:'15 min', tarif:200, stops:['pk1','pk5','pk6','gd3','gd8','gd9','gd11','gd1'] },
  { id:'L45',  name:'Ligne 45',  operator:'DDD', route:'Mbao ↔ Palais',                        color:'#1e40af', freq:'20 min', tarif:300, stops:['mb1','mb3','pk1','rn1','ha4','ha2','p03','p01'] },
  { id:'L46',  name:'Ligne 46',  operator:'DDD', route:'Thiaroye ↔ Palais',                    color:'#1e40af', freq:'20 min', tarif:250, stops:['th1','th3','pk1','rn5','rn1','ha4','ha2','p16','p03','p01'] },
  { id:'L47',  name:'Ligne 47',  operator:'DDD', route:'Rufisque ↔ Grand Yoff',                color:'#1a56db', freq:'30 min', tarif:300, stops:['rf1','rf2','mb1','pk1','ha2','gy1'] },
  { id:'L48',  name:'Ligne 48',  operator:'DDD', route:'Mbao ↔ Palais Express',                color:'#2563eb', freq:'25 min', tarif:300, stops:['mb1','mb3','pk1','ha4','ha2','p03','p01'] },
  { id:'L49',  name:'Ligne 49',  operator:'DDD', route:'Hann Mariste ↔ Diamaguène ↔ TSM ↔ Mbao', color:'#0369a1', freq:'20 min', tarif:300, stops:['ha7','ha6','hm1','rn3','rn4','rn5','pk1','dg2','dg1','th2','mb3','vmb1','mb1'] },

  // ── Axe VDN / Guédiawaye / Parcelles ─────────────────────
  { id:'L11',  name:'Ligne 11',  operator:'DDD', route:'Keur Massar ↔ Leclerc',                color:'#1e3a8a', freq:'15 min', tarif:250, stops:['km1','km6','gd3','gd1','po1','lb5','lc1'] },
  { id:'L16',  name:'Ligne 16',  operator:'DDD', route:'Malika ↔ Palais',                      color:'#60a5fa', freq:'25 min', tarif:300, stops:['ml1','gd5','gd2','gd1','nf1','zo1','cm1','po1','lb5','p01'] },
  { id:'L17',  name:'Ligne 17',  operator:'DDD', route:'Zone Captage ↔ Grand Yoff ↔ Patte d\'Oie', color:'#3b82f6', freq:'15 min', tarif:200, stops:['zo1','nf1','gy4','cm1','po1','gy1'] },
  { id:'L19',  name:'Ligne 19',  operator:'DDD', route:'Parcelles ↔ Grand Yoff',               color:'#1d4ed8', freq:'10 min', tarif:200, stops:['pa1','pa5','pa3','cb1','nf1','gy3','gy1'] },
  { id:'L22',  name:'Ligne 22',  operator:'DDD', route:'Guédiawaye ↔ Ouakam',                  color:'#2563eb', freq:'20 min', tarif:200, stops:['gd4','gd11','gd1','gd8','gy1','ok1'] },
  { id:'L23',  name:'Ligne 23',  operator:'DDD', route:'Parcelles Nord ↔ Palais',              color:'#1a56db', freq:'12 min', tarif:200, stops:['pa1','pa5','pa3','lb5','lb6','p04','p11','p05','p03','p01'] },
  { id:'L28',  name:'Ligne 28',  operator:'DDD', route:'Parcelles ↔ Liberté 6',                color:'#1d4ed8', freq:'12 min', tarif:200, stops:['pa1','pa5','pa3','lb5','lb6'] },
  { id:'L29',  name:'Ligne 29',  operator:'DDD', route:'Cambérène ↔ Palais',                   color:'#3b82f6', freq:'15 min', tarif:200, stops:['cb3','cb1','pa5','pa1','nf1','gy1','lb5','p01'] },

  // ── Lignes transversales / circulaires (DDD) ──────────────
  { id:'L25',  name:'Ligne 25',  operator:'DDD', route:'Yoff ↔ Liberté 6',                     color:'#60a5fa', freq:'15 min', tarif:200, stops:['yf1','yf2','ok1','gy1','lb6'] },
  { id:'L31',  name:'Ligne 31',  operator:'DDD', route:'Pikine ↔ Liberté 6',                   color:'#1a56db', freq:'20 min', tarif:250, stops:['pk1','pk5','pk6','gd3','gd1','gy1','lb6'] },
  { id:'L32',  name:'Ligne 32',  operator:'DDD', route:'Mbao ↔ Liberté 5',                     color:'#2563eb', freq:'25 min', tarif:300, stops:['mb1','mb3','pk1','bm1','ha2','lb5'] },
  { id:'L34',  name:'Ligne 34',  operator:'DDD', route:'Keur Massar ↔ Grand Yoff',             color:'#1e3a8a', freq:'20 min', tarif:250, stops:['km1','km6','km3','ye3','pk8','gd8','gd1','gy1'] },
  { id:'L36',  name:'Ligne 36',  operator:'DDD', route:'Ouakam ↔ Liberté 5',                   color:'#1a56db', freq:'15 min', tarif:200, stops:['ok1','gy1','nf1','lb5'] },
  { id:'L37',  name:'Ligne 37',  operator:'DDD', route:'Guédiawaye Nord ↔ Liberté 5',          color:'#2563eb', freq:'20 min', tarif:200, stops:['gd2','gd5','gd1','gd8','gd9','lb5'] },
  { id:'L38',  name:'Ligne 38',  operator:'DDD', route:'Daroukhane ↔ Palais',                  color:'#1d4ed8', freq:'25 min', tarif:250, stops:['dk2','dk1','gd5','gd2','gd1','nf1','po1','lb5','p08','p01'] },
  { id:'L39',  name:'Ligne 39',  operator:'DDD', route:'Grand Mbao ↔ Leclerc',                 color:'#60a5fa', freq:'30 min', tarif:300, stops:['mb1','mb3','pk1','bm1','ha2','lc1'] },
  { id:'L40',  name:'Ligne 40',  operator:'DDD', route:'Yoff ↔ Grand Yoff',                    color:'#1e40af', freq:'15 min', tarif:200, stops:['yf1','yf2','ok1','gy1','gy3'] },
  { id:'L41',  name:'Ligne 41',  operator:'DDD', route:'Parcelles ↔ Ouakam',                   color:'#1a56db', freq:'20 min', tarif:200, stops:['pa1','pa5','cb1','nf1','gy1','ok1','po1'] },

  // ── Express périurbains (DDD) ─────────────────────────────
  { id:'L52',  name:'Ligne 52',  operator:'DDD', route:'Diamniadio ↔ Rufisque ↔ Palais',       color:'#1a56db', freq:'25 min', tarif:400, stops:['se1','di3','di1','t05','bg1','rf1','pk1','ha2','p03','p01'] },
  { id:'L53',  name:'Ligne 53',  operator:'DDD', route:'CICES ↔ Liberté 5 ↔ Palais',           color:'#2563eb', freq:'12 min', tarif:200, stops:['ci1','nf1','po1','lb5','p03','p01'] },
  { id:'L54',  name:'Ligne 54',  operator:'DDD', route:'Keur Massar Nord ↔ Guédiawaye ↔ Palais', color:'#1e3a8a', freq:'20 min', tarif:250, stops:['kn1','km4','km1','gd5','gd2','gd1','lb5','p01'] },
  { id:'L57',  name:'Ligne 57',  operator:'DDD', route:'Guinaw Rails ↔ Pikine ↔ Liberté 6',   color:'#1d4ed8', freq:'15 min', tarif:200, stops:['gr1','gr2','pk1','pk5','ha4','ha2','lb6'] },
  { id:'L58',  name:'Ligne 58',  operator:'DDD', route:'Bargny ↔ Rufisque ↔ Mbao',            color:'#1e40af', freq:'30 min', tarif:300, stops:['bg1','rf1','rf2','mb1','mb3','pk1'] },
  { id:'L60',  name:'Ligne 60',  operator:'DDD', route:'Nord Foire ↔ CICES ↔ Patte d\'Oie ↔ Palais', color:'#1a56db', freq:'15 min', tarif:200, stops:['nf1','ci1','zo1','cm1','po1','lb5','p03','p01'] },
  { id:'L64',  name:'Ligne 64',  operator:'DDD', route:'Diamniadio ↔ Pikine ↔ Leclerc',       color:'#2563eb', freq:'30 min', tarif:350, stops:['di3','di1','rf1','pk1','pk5','pk11','gd3','gd1','lb5','lc1'] },
  { id:'L65',  name:'Ligne 65',  operator:'DDD', route:'Ouest Foire ↔ Ouakam ↔ Yoff',         color:'#60a5fa', freq:'20 min', tarif:200, stops:['ci1','nf1','ok1','yf1','yf2'] },
];

// ══════════════════════════════════════════════════════════════
//  LIGNES AFTU — Réseau de quartier (car rapides / ndiaga ndiaye)
//  Territoire : intérieur des zones résidentielles.
//  Départ/arrivée aux hubs DDD pour les correspondances.
//  Peu ou pas de superposition avec les lignes DDD.
// ══════════════════════════════════════════════════════════════
const AC = ['#e11d48','#f43f5e','#be123c'];
const AFTU_LINES: Line[] = [
  // ── Fann / Point-E / Mermoz / Corniche ────────────────────
  { id:'A1',  name:'AFTU 1',  operator:'AFTU', route:'Lat Dior ↔ Leclerc',                    color:AC[0], freq:'8 min',  tarif:150, stops:['p06','p14','sc1','lc1'] },
  { id:'A17', name:'AFTU 17', operator:'AFTU', route:'Zone B–C ↔ Plateau',                    color:AC[1], freq:'10 min', tarif:150, stops:['zc1','zb1','hlm2','p14','p06','p02'] },
  { id:'A24', name:'AFTU 24', operator:'AFTU', route:'Fann ↔ Liberté 5',                      color:AC[2], freq:'12 min', tarif:150, stops:['p07','p13','pe4','p14','p06','sc1','lb5'] },
  { id:'A34', name:'AFTU 34', operator:'AFTU', route:'Lat Dior ↔ Sacré-Cœur ↔ Sicap',        color:AC[0], freq:'15 min', tarif:150, stops:['p06','p14','si1','si2','sc2','si3','sc3','sc4','pe3','pe2'] },
  { id:'A36', name:'AFTU 36', operator:'AFTU', route:'Corniche ↔ Fann ↔ Ouakam',             color:AC[2], freq:'15 min', tarif:150, stops:['p12','p20','p13','pe4','p07','p14','p06','si3','sc3','ok1'] },
  { id:'A97', name:'AFTU 97', operator:'AFTU', route:'Mermoz ↔ Fann ↔ Petersen',             color:AC[0], freq:'10 min', tarif:150, stops:['mn3','mn2','mn1','sc4','si3','p14','p07','p13','p02'] },
  { id:'A102',name:'AFTU 102',operator:'AFTU', route:'Castors ↔ Mermoz ↔ Liberté 5',         color:AC[1], freq:'15 min', tarif:150, stops:['ca1','mn1','mn2','sc2','si1','sc1','lb5'] },

  // ── Sicap / HLM / Grand Dakar internes ────────────────────
  { id:'A15', name:'AFTU 15', operator:'AFTU', route:'HLM ↔ Petersen',                        color:AC[2], freq:'10 min', tarif:150, stops:['hlm3','hlm2','hlm4','sc6','sc5','gd7','gd6','p02'] },
  { id:'A16', name:'AFTU 16', operator:'AFTU', route:'Sicap ↔ Liberté 5',                     color:AC[0], freq:'20 min', tarif:150, stops:['si3','si2','si1','sc3','pe3','pe2','pe1','p06','lb5'] },
  { id:'A19', name:'AFTU 19', operator:'AFTU', route:'Point-E ↔ Liberté 5 ↔ Pikine',         color:AC[1], freq:'20 min', tarif:150, stops:['pe1','pe2','pe3','pe4','p07','lb5','pk1'] },

  // ── Médina / Tilène / Colobane internes ───────────────────
  { id:'A18', name:'AFTU 18', operator:'AFTU', route:'Médina ↔ Grand Yoff',                   color:AC[2], freq:'12 min', tarif:150, stops:['me1','me2','ti2','ti1','co2','co1','p04','gy6','gy1'] },
  { id:'A20', name:'AFTU 20', operator:'AFTU', route:'Colobane ↔ Guédiawaye',                 color:AC[0], freq:'15 min', tarif:150, stops:['co2','co1','me2','ti2','p04','lb6','gd10','gd1'] },
  { id:'A30', name:'AFTU 30', operator:'AFTU', route:'Colobane ↔ Grand Dakar ↔ HLM Fass',    color:AC[1], freq:'8 min',  tarif:150, stops:['co2','co1','p04','me2','me1','ti1','ti2','p09','sc6','sc5','gd7','hlm4'] },
  { id:'A33', name:'AFTU 33', operator:'AFTU', route:'Colobane ↔ Guédiawaye interne',         color:AC[2], freq:'12 min', tarif:150, stops:['co1','p04','lb6','gy6','gy1','gd10','gd1'] },
  { id:'A75', name:'AFTU 75', operator:'AFTU', route:'Malika ↔ Colobane',                     color:AC[2], freq:'30 min', tarif:200, stops:['ml1','gd5','gd12','gd1','co1','p04'] },

  // ── Ouakam / Ngor / Almadies / Ouest Foire (AFTU exclusif) ─
  { id:'A35', name:'AFTU 35', operator:'AFTU', route:'Ngor ↔ Ouakam ↔ Pikine',               color:AC[1], freq:'20 min', tarif:150, stops:['ng1','ng2','ok2','ok3','ok1','gy5','gy1','gd1','pk1'] },
  { id:'A42', name:'AFTU 42', operator:'AFTU', route:'Guédiawaye ↔ Ouakam interne',           color:AC[2], freq:'20 min', tarif:150, stops:['gd4','gd11','gd1','gy6','gy1','ok3','ok1'] },
  { id:'A44', name:'AFTU 44', operator:'AFTU', route:'Grand Mbao ↔ Ouakam',                   color:AC[0], freq:'25 min', tarif:200, stops:['mb2','mb4','pk7','pk1','gd3','gy1','ok1'] },
  { id:'A49', name:'AFTU 49', operator:'AFTU', route:'Almadies ↔ Ngor ↔ Corniche',           color:AC[1], freq:'20 min', tarif:150, stops:['al1','ng2','ng1','ok2','ok1','p12'] },
  { id:'A61', name:'AFTU 61', operator:'AFTU', route:'Almadies ↔ Keur Massar',               color:AC[2], freq:'25 min', tarif:200, stops:['al1','ng1','ok2','ok1','gy1','gd1','km6','km1'] },
  { id:'A91', name:'AFTU 91', operator:'AFTU', route:'CICES ↔ Castors ↔ Ouakam ↔ Almadies', color:AC[0], freq:'15 min', tarif:150, stops:['nf1','ok2','ok3','ok1','ca1','sc3','sc4','ng1','al1'] },
  { id:'A94', name:'AFTU 94', operator:'AFTU', route:'Almadies ↔ Ouest Foire ↔ Patte d\'Oie', color:AC[2], freq:'15 min', tarif:150, stops:['al1','ng2','ng1','of2','of1','ca1','ok1','po1'] },
  { id:'A105',name:'AFTU 105',operator:'AFTU', route:'CICES ↔ Yoff ↔ Ngor ↔ Almadies',      color:AC[1], freq:'15 min', tarif:150, stops:['nf1','yf5','yf3','yf4','ng1','ng2','al1'] },

  // ── Yoff / Grand Yoff internes ────────────────────────────
  { id:'A3',  name:'AFTU 3',  operator:'AFTU', route:'Yoff ↔ Grand Yoff ↔ Petersen',         color:AC[0], freq:'10 min', tarif:150, stops:['yf1','yf5','gy5','gy2','gy6','gy1','lb6','p04','p02'] },
  { id:'A4',  name:'AFTU 4',  operator:'AFTU', route:'Yoff Tonghor ↔ Grand Yoff',             color:AC[1], freq:'10 min', tarif:150, stops:['yf3','yf4','yf5','yf1','gy2','gy1'] },
  { id:'A10', name:'AFTU 10', operator:'AFTU', route:'Yoff ↔ Liberté 5 interne',              color:AC[2], freq:'15 min', tarif:150, stops:['yf3','yf4','yf5','yf1','gy5','gy2','gy1','lb5'] },
  { id:'A66', name:'AFTU 66', operator:'AFTU', route:'Yoff Tonghor ↔ Grand Yoff interne',     color:AC[0], freq:'15 min', tarif:150, stops:['yf3','yf4','yf5','yf1','gy2','gy1'] },

  // ── Parcelles internes (AFTU exclusif) ────────────────────
  { id:'A2',  name:'AFTU 2',  operator:'AFTU', route:'Parcelles internes ↔ Petersen',         color:AC[1], freq:'6 min',  tarif:150, stops:['pa1','pa5','pa2','pa9','pa10','pa8','lb5','lb6','p04','p02'] },
  { id:'A5',  name:'AFTU 5',  operator:'AFTU', route:'Parcelles ↔ Patte d\'Oie',              color:AC[2], freq:'8 min',  tarif:150, stops:['pa1','pa5','pa3','cb1','nf1','po1'] },
  { id:'A6',  name:'AFTU 6',  operator:'AFTU', route:'Parcelles unités ↔ Ouakam',             color:AC[0], freq:'15 min', tarif:150, stops:['pa1','pa12','pa11','pa4','pa6','pa7','lb6','gy1','ok1'] },
  { id:'A13', name:'AFTU 13', operator:'AFTU', route:'Cambérène internes ↔ Petersen',         color:AC[1], freq:'12 min', tarif:150, stops:['cb3','cb4','cb2','cb1','pa4','pa12','pa1','po1','p02'] },
  { id:'A25', name:'AFTU 25', operator:'AFTU', route:'Parcelles express ↔ Petersen',          color:AC[2], freq:'8 min',  tarif:150, stops:['pa1','pa5','pa8','pa2','pa10','lb5','p02'] },
  { id:'A29', name:'AFTU 29', operator:'AFTU', route:'Cambérène ↔ Petersen (Nord Foire)',     color:AC[0], freq:'10 min', tarif:150, stops:['cb3','cb4','cb2','cb1','pa4','pa12','pa1','po1','nf1','lb5','p02'] },
  { id:'A72', name:'AFTU 72', operator:'AFTU', route:'Parcelles ↔ Ouakam interne',            color:AC[1], freq:'20 min', tarif:150, stops:['pa1','pa4','cb1','nf1','gy4','gy5','gy1','ok1','po1'] },
  { id:'A87', name:'AFTU 87', operator:'AFTU', route:'Sam Sam ↔ Khar Yalla ↔ Liberté 6',     color:AC[2], freq:'12 min', tarif:150, stops:['ss2','ss1','ky1','pa1','cb1','gd12','gd1','lb6'] },
  { id:'A90', name:'AFTU 90', operator:'AFTU', route:'Khar Yalla ↔ Sam Sam ↔ Cambérène',     color:AC[0], freq:'12 min', tarif:150, stops:['ky2','ky1','zr1','ss1','ss2','pa1','cb1','cb4','cb3'] },
  { id:'A98', name:'AFTU 98', operator:'AFTU', route:'Zone Recasement ↔ Parcelles internes',  color:AC[1], freq:'10 min', tarif:150, stops:['zr1','ky2','ky1','pa6','pa5','pa3','pa1','lb5','lb6'] },

  // ── Daroukhane / Tivaouane Peul / Malika internes ─────────
  { id:'A50', name:'AFTU 50', operator:'AFTU', route:'Malika ↔ Nord Foire ↔ Patte d\'Oie',   color:AC[2], freq:'25 min', tarif:200, stops:['ml1','cb3','cb2','cb1','nf1','gy4','po1'] },
  { id:'A70', name:'AFTU 70', operator:'AFTU', route:'Daroukhane ↔ Guédiawaye ↔ Liberté 6', color:AC[0], freq:'20 min', tarif:200, stops:['dk2','dk1','dk3','gd12','gd5','gd2','gd1','lb6'] },
  { id:'A88', name:'AFTU 88', operator:'AFTU', route:'Tivaouane Peul ↔ Guédiawaye ↔ Thiaroye', color:AC[1], freq:'15 min', tarif:150, stops:['tp2','tp1','gd12','gd5','gd2','gd1','pk1','th3','th1'] },
  { id:'A96', name:'AFTU 96', operator:'AFTU', route:'Malika Nord ↔ Tivaouane ↔ Cambérène',  color:AC[2], freq:'20 min', tarif:200, stops:['ma2','ma3','ml1','tp2','tp1','cb3','cb1','nf1','gy4','po1'] },
  { id:'A101',name:'AFTU 101',operator:'AFTU', route:'Sam Sam ↔ Daroukhane ↔ Guédiawaye',   color:AC[0], freq:'20 min', tarif:150, stops:['ss2','ss1','ky1','tp1','dk3','dk1','gd12','gd1'] },
  { id:'A104',name:'AFTU 104',operator:'AFTU', route:'Tivaouane Peul ↔ Daroukhane ↔ Malika', color:AC[1], freq:'20 min', tarif:150, stops:['tp2','tp1','dk3','dk1','dk2','ma3','ml1'] },

  // ── Guédiawaye internes ────────────────────────────────────
  { id:'A27', name:'AFTU 27', operator:'AFTU', route:'Guédiawaye ↔ Petersen interne',         color:AC[2], freq:'12 min', tarif:150, stops:['gd5','gd2','gd12','gd1','gd10','lb6','p04','p02'] },
  { id:'A56', name:'AFTU 56', operator:'AFTU', route:'Jaxaay ↔ Guédiawaye interne',           color:AC[0], freq:'25 min', tarif:200, stops:['jx1','km4','km5','gd12','gd5','gd2','gd1'] },

  // ── Pikine / Dalifort / Diamaguène internes ────────────────
  { id:'A7',  name:'AFTU 7',  operator:'AFTU', route:'Grand Yoff ↔ Petersen (internes)',       color:AC[1], freq:'12 min', tarif:150, stops:['gy6','gy3','gy1','lc2','p18','p02'] },
  { id:'A8',  name:'AFTU 8',  operator:'AFTU', route:'Guédiawaye internes ↔ Petersen',         color:AC[2], freq:'15 min', tarif:150, stops:['gd1','gd10','gd9','gd8','gd3','bm1','ha2','p02'] },
  { id:'A9',  name:'AFTU 9',  operator:'AFTU', route:'Pikine internes ↔ Liberté 6',            color:AC[0], freq:'15 min', tarif:150, stops:['pk1','pk10','pk9','pk7','pk3','pk2','lb6'] },
  { id:'A26', name:'AFTU 26', operator:'AFTU', route:'Yeumbeul internes ↔ Petersen',           color:AC[1], freq:'15 min', tarif:150, stops:['km2','ye2','ye3','pk2','pk9','pk1','ha2','p02'] },
  { id:'A52', name:'AFTU 52', operator:'AFTU', route:'Pikine internes ↔ Keur Massar',         color:AC[2], freq:'15 min', tarif:150, stops:['pk2','pk9','pk7','pk1','pk3','km3','km6','km2','ye3','km1'] },
  { id:'A84', name:'AFTU 84', operator:'AFTU', route:'Diamaguène ↔ Guédiawaye interne',        color:AC[0], freq:'15 min', tarif:150, stops:['dg4','dg3','dg1','dg2','dg5','pk9','pk1','gd9','gd8','gd1'] },
  { id:'A85', name:'AFTU 85', operator:'AFTU', route:'Diamaguène ↔ Liberté 6',                 color:AC[1], freq:'20 min', tarif:150, stops:['dg4','dg3','dg1','dg2','dg5','pk10','pk1','ha2','lb6'] },
  { id:'A89', name:'AFTU 89', operator:'AFTU', route:'Guinaw Rails ↔ Dalifort ↔ Thiaroye',   color:AC[2], freq:'15 min', tarif:150, stops:['dl2','pk3','pk2','pk9','th5','th3','th1'] },
  { id:'A100',name:'AFTU 100',operator:'AFTU', route:'Guinaw Rails ↔ Yeumbeul ↔ Keur Massar', color:AC[0], freq:'15 min', tarif:150, stops:['gr1','gr2','pk4','pk2','ye2','ye1','km2','km6','km1'] },

  // ── Thiaroye Azur / Thiaroye sur Mer (AFTU exclusif) ──────
  { id:'A57', name:'AFTU 57', operator:'AFTU', route:'Liberté 6 ↔ Thiaroye ↔ Rufisque',      color:AC[1], freq:'20 min', tarif:250, stops:['lb6','pk4','th5','th2','rf5','rf1'] },
  { id:'A68', name:'AFTU 68', operator:'AFTU', route:'Yeumbeul ↔ Thiaroye internes',          color:AC[2], freq:'20 min', tarif:150, stops:['ye1','ye3','km2','pk2','pk9','pk4','th5','th2','tsm3','th1'] },
  { id:'A82', name:'AFTU 82', operator:'AFTU', route:'Thiaroye Azur ↔ Pikine',               color:AC[0], freq:'15 min', tarif:150, stops:['taz2','taz1','taz3','tsm3','tsm1','th5','th3','pk1'] },
  { id:'A83', name:'AFTU 83', operator:'AFTU', route:'Thiaroye sur Mer ↔ Thiaroye Azur ↔ Petersen', color:AC[1], freq:'20 min', tarif:200, stops:['tsm3','tsm1','tsm2','taz3','taz1','taz2','th5','th3','th1','ha2','p02'] },

  // ── Keur Massar / Jaxaay / Bambilor internes ──────────────
  { id:'A51', name:'AFTU 51', operator:'AFTU', route:'Jaxaay ↔ Keur Massar ↔ Hann',          color:AC[2], freq:'30 min', tarif:200, stops:['jx1','km4','km5','km6','km3','pk8','pk1','ha3','bm1'] },
  { id:'A65', name:'AFTU 65', operator:'AFTU', route:'Keur Massar ↔ Jaxaay interne',          color:AC[0], freq:'30 min', tarif:200, stops:['km1','km5','km3','jx1'] },
  { id:'A73', name:'AFTU 73', operator:'AFTU', route:'Bambilor ↔ Sangalkam ↔ Pikine',         color:AC[1], freq:'30 min', tarif:250, stops:['ba1','sgk','km1','km4','pk1'] },
  { id:'A99', name:'AFTU 99', operator:'AFTU', route:'Keur Massar Nord ↔ Médina ↔ Petersen',  color:AC[2], freq:'20 min', tarif:250, stops:['kn2','kn1','km4','km1','km6','km3','ye3','pk1','ha2','p04','p02'] },

  // ── Mbao / Rufisque / Bargny / Diamniadio internes ─────────
  { id:'A40', name:'AFTU 40', operator:'AFTU', route:'Mbao internes ↔ Rufisque',              color:AC[0], freq:'20 min', tarif:150, stops:['mb8','mb2','mb4','mb5','rf6','rf3','rf2','rf1'] },
  { id:'A43', name:'AFTU 43', operator:'AFTU', route:'Mbao internes ↔ Pikine',               color:AC[1], freq:'15 min', tarif:150, stops:['mb8','mb7','mb5','mb6','mb3','pk1'] },
  { id:'A12', name:'AFTU 12', operator:'AFTU', route:'Rufisque internes ↔ Liberté 5',         color:AC[2], freq:'25 min', tarif:250, stops:['rf1','rf3','rf6','rf2','rf4','rf5','mb4','mb1','pk1','ha2','lb5'] },
  { id:'A55', name:'AFTU 55', operator:'AFTU', route:'Rufisque internes ↔ Petersen',          color:AC[0], freq:'20 min', tarif:250, stops:['rf2','rf5','rf4','rf1','pk11','pk1','ha2','p02'] },
  { id:'A64', name:'AFTU 64', operator:'AFTU', route:'Guédiawaye ↔ Rufisque',                 color:AC[1], freq:'20 min', tarif:200, stops:['gd3','gd8','gd9','gd1','pk8','pk1','rf1'] },
  { id:'A92', name:'AFTU 92', operator:'AFTU', route:'Diamniadio internes ↔ Pikine',          color:AC[2], freq:'20 min', tarif:250, stops:['di2','di3','di1','bg1','rf1','mb1','pk1'] },
  { id:'A93', name:'AFTU 93', operator:'AFTU', route:'Sébikotane ↔ Diamniadio ↔ Rufisque',   color:AC[0], freq:'30 min', tarif:300, stops:['se1','di2','di3','di1','bg2','bg1','rf1'] },
  { id:'A95', name:'AFTU 95', operator:'AFTU', route:'Bargny ↔ Mbao ↔ Pikine',               color:AC[1], freq:'25 min', tarif:200, stops:['bg2','bg1','rf5','rf1','mb2','mb4','mb1','pk1'] },
  { id:'A103',name:'AFTU 103',operator:'AFTU', route:'Diamniadio ↔ Keur Massar ↔ Pikine',    color:AC[2], freq:'25 min', tarif:250, stops:['di3','di1','bg1','rf1','mb1','pk1','gd3','km6','km1'] },
  { id:'A80', name:'AFTU 80', operator:'AFTU', route:'Diamniadio ↔ Guédiawaye ↔ Petersen',   color:AC[0], freq:'30 min', tarif:300, stops:['di3','di1','rf1','pk1','pk11','ha2','p04','p02'] },

  // ── Hann internes (AFTU exclusif) ─────────────────────────
  { id:'A86', name:'AFTU 86', operator:'AFTU', route:'Hann Maristes ↔ Hann Pêcheurs ↔ Petersen', color:AC[1], freq:'15 min', tarif:150, stops:['ha7','ha6','ha8','ha5','ha3','hr1','ha2','bm1','p02'] },
];

const BRT_LINES: Line[] = [
  { id:'BRT-L1', name:'BRT L1', operator:'BRT',
    route:'Petersen ↔ Guédiawaye', color:'#7c3aed', freq:'5 min', tarif:300,
    stops:['b01','b02','b03','b04','b05','b06','b07','gd4','gd1'] },
];

const TER_LINES: Line[] = [
  { id:'TER-01', name:'TER 01', operator:'TER',
    route:'Dakar ↔ AIBD ↔ Sébikotane', color:'#059669', freq:'30 min', tarif:500,
    stops:['p01','th1','rf1','t04','t05','t06','t07'] },
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
