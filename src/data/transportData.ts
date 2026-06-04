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

export const STOPS: Stop[] = [
  { id:'p01', name:'Gare Palais (Rebeuss)',    zone:'Plateau',    lat:14.6697, lng:-17.4386, operators:['DDD','TER'],        lines:['L6','L7','L8','L9','L10','L12','L15','L23','TER-01'] },
  { id:'p02', name:'Avenue Petersen',          zone:'Plateau',    lat:14.6811, lng:-17.4464, operators:['DDD','AFTU','BRT'], lines:['A2','A3','A5','A25','BRT-L1'] },
  { id:'p03', name:'Sandaga',                  zone:'Plateau',    lat:14.6756, lng:-17.4436, operators:['DDD'],              lines:['L6','L9','L10'] },
  { id:'p04', name:'Colobane Gare',            zone:'Médina',     lat:14.6908, lng:-17.4478, operators:['DDD','AFTU'],       lines:['L9','A30','A33','A75'] },
  { id:'p05', name:'Tilène',                   zone:'Médina',     lat:14.6788, lng:-17.4428, operators:['DDD'],              lines:['L9','L10'] },
  { id:'p06', name:'Lat Dior (UCAD)',          zone:'Fann',       lat:14.6944, lng:-17.4594, operators:['AFTU'],             lines:['A1','A34'] },
  { id:'p07', name:'Fann Résidence',           zone:'Fann',       lat:14.6933, lng:-17.4669, operators:['DDD','AFTU'],       lines:['L10','A24'] },
  { id:'lc1', name:'Leclerc Terminus',         zone:'Liberté',    lat:14.7117, lng:-17.4567, operators:['DDD'],              lines:['L1A','L2A','L11','L14','L121'] },
  { id:'lc2', name:'HLM Grand Yoff',           zone:'HLM',        lat:14.7183, lng:-17.4553, operators:['DDD','AFTU'],       lines:['L121','A1'] },
  { id:'lb5', name:'Terminus Liberté 5',       zone:'Liberté 5',  lat:14.7242, lng:-17.4528, operators:['DDD'],              lines:['L10','L13','L18','L20'] },
  { id:'lb6', name:'Rond-Point Liberté 6',     zone:'Liberté 6',  lat:14.7200, lng:-17.4450, operators:['DDD','AFTU'],       lines:['L9','L13','A57'] },
  { id:'pa1', name:'Terminus Parcelles',       zone:'Parcelles',  lat:14.7583, lng:-17.4308, operators:['DDD','AFTU'],       lines:['L1A','L23','A2','A5','A25'] },
  { id:'pa2', name:'Parcelles Unité 17',       zone:'Parcelles',  lat:14.7533, lng:-17.4275, operators:['DDD'],              lines:['L1A','L23'] },
  { id:'pa3', name:'Parcelles Unité 10',       zone:'Parcelles',  lat:14.7483, lng:-17.4333, operators:['DDD'],              lines:['L23'] },
  { id:'yf1', name:'Yoff Village',             zone:'Yoff',       lat:14.7467, lng:-17.4903, operators:['DDD','AFTU'],       lines:['L8','A3','A4','A66'] },
  { id:'yf2', name:'Yoff Aéroport (ancien)',   zone:'Yoff',       lat:14.7403, lng:-17.4914, operators:['DDD'],              lines:['L8'] },
  { id:'ng1', name:'Ngor Village',             zone:'Ngor',       lat:14.7464, lng:-17.5178, operators:['AFTU'],             lines:['A35','A49'] },
  { id:'al1', name:'Almadies',                 zone:'Almadies',   lat:14.7481, lng:-17.5289, operators:['AFTU'],             lines:['A61'] },
  { id:'ok1', name:'Ouakam Terminus',          zone:'Ouakam',     lat:14.7183, lng:-17.5058, operators:['DDD','AFTU'],       lines:['L7','A42','A44'] },
  { id:'gy1', name:'Grand Yoff Terminus',      zone:'Grand Yoff', lat:14.7268, lng:-17.4553, operators:['DDD','AFTU'],       lines:['L121','L20','A3'] },
  { id:'sc1', name:'Sicap Liberté',            zone:'Sicap',      lat:14.7133, lng:-17.4603, operators:['DDD'],              lines:['L10','L13'] },
  { id:'bm1', name:'Baux Maraîchers',          zone:'Hann',       lat:14.7192, lng:-17.3997, operators:['DDD','AFTU'],       lines:['L8','A51'] },
  { id:'ha2', name:'Front de Terre',           zone:'Hann',       lat:14.7172, lng:-17.4069, operators:['DDD'],              lines:['L8','L9'] },
  { id:'gd1', name:'Guédiawaye Marché',        zone:'Guédiawaye', lat:14.7769, lng:-17.3986, operators:['DDD','BRT','AFTU'], lines:['L12','BRT-L1','A27','A64'] },
  { id:'gd2', name:'Wakhinane Nimzat',         zone:'Guédiawaye', lat:14.7833, lng:-17.4025, operators:['DDD'],              lines:['L12'] },
  { id:'pk1', name:'Pikine Gare Routière',     zone:'Pikine',     lat:14.7499, lng:-17.3858, operators:['DDD','BRT','AFTU'], lines:['L15','L45','BRT-L1','A35'] },
  { id:'km1', name:'Keur Massar Marché',       zone:'Keur Massar',lat:14.7833, lng:-17.3183, operators:['DDD','AFTU'],       lines:['L11','A52','A61'] },
  { id:'km2', name:'Yeumbeul',                 zone:'Yeumbeul',   lat:14.7633, lng:-17.3500, operators:['AFTU'],             lines:['A26','A68'] },
  { id:'dk1', name:'Daroukhane Terminus',      zone:'Daroukhane', lat:14.7850, lng:-17.4175, operators:['DDD','AFTU'],       lines:['L2A','A70'] },
  { id:'cb1', name:'Camberène Cité Nations',   zone:'Camberène',  lat:14.7633, lng:-17.4292, operators:['DDD','AFTU'],       lines:['L6','A29'] },
  { id:'rf1', name:'Rufisque Gare Routière',   zone:'Rufisque',   lat:14.7153, lng:-17.2747, operators:['DDD','TER','AFTU'], lines:['L15','TER-01','A55','A57'], terConnection:true },
  { id:'th1', name:'Thiaroye Marché',          zone:'Thiaroye',   lat:14.7358, lng:-17.3533, operators:['DDD','TER'],        lines:['TER-01'] },
  { id:'ml1', name:'Malika Terminus',          zone:'Malika',     lat:14.7958, lng:-17.3475, operators:['DDD','AFTU'],       lines:['L16A','A50','A75'] },
  { id:'mb1', name:'Grand Mbao',               zone:'Mbao',       lat:14.7500, lng:-17.2917, operators:['DDD','AFTU'],       lines:['L45','A40','A44'] },
  { id:'ba1', name:'Bambilor',                 zone:'Bambilor',   lat:14.8500, lng:-17.2500, operators:['AFTU'],             lines:['A73','A80'] },
  { id:'jx1', name:'Jaxaay',                   zone:'Jaxaay',     lat:14.7900, lng:-17.2200, operators:['AFTU'],             lines:['A51','A56','A65'] },
  { id:'b01', name:'Petersen (BRT)',           zone:'Plateau',    lat:14.6811, lng:-17.4464, operators:['BRT'],              lines:['BRT-L1'] },
  { id:'b03', name:'Liberté 6 (BRT)',          zone:'Liberté',    lat:14.7200, lng:-17.4558, operators:['BRT'],              lines:['BRT-L1'] },
  { id:'b05', name:'CICES (BRT)',              zone:'CICES',      lat:14.7342, lng:-17.4681, operators:['BRT'],              lines:['BRT-L1'] },
  { id:'t01', name:'Dakar Gare TER',           zone:'Plateau',    lat:14.6697, lng:-17.4386, operators:['TER'],              lines:['TER-01'], terConnection:true },
  { id:'t02', name:'Thiaroye Gare TER',        zone:'Thiaroye',   lat:14.7300, lng:-17.3558, operators:['TER'],              lines:['TER-01'], terConnection:true },
  { id:'t03', name:'Rufisque Gare TER',        zone:'Rufisque',   lat:14.7142, lng:-17.2753, operators:['TER'],              lines:['TER-01'], terConnection:true },
  { id:'t04', name:'Bargny Gare TER',          zone:'Bargny',     lat:14.6964, lng:-17.2269, operators:['TER'],              lines:['TER-01'], terConnection:true },
  { id:'t05', name:'Diamniadio Gare TER',      zone:'Diamniadio', lat:14.7289, lng:-17.1742, operators:['TER'],              lines:['TER-01'], terConnection:true },
  { id:'t06', name:'AIBD Aéroport',            zone:'AIBD',       lat:14.7411, lng:-17.0900, operators:['TER'],              lines:['TER-01'], terConnection:true },
];

const DDD_LINES: Line[] = [
  { id:'L1A', name:'Ligne 1A', operator:'DDD', route:'Parcelles ↔ Leclerc',          color:'#1a56db', freq:'8 min',  tarif:200, stops:['pa1','pa2','pa3','lb5','lc1'] },
  { id:'L2A', name:'Ligne 2A', operator:'DDD', route:'Daroukhane ↔ Leclerc',         color:'#2563eb', freq:'10 min', tarif:200, stops:['dk1','gd1','lb5','lc1'] },
  { id:'L6',  name:'Ligne 6',  operator:'DDD', route:'Camberène ↔ Palais',           color:'#1d4ed8', freq:'12 min', tarif:200, stops:['cb1','pa1','lb5','lb6','lc1','p03','p01'] },
  { id:'L7',  name:'Ligne 7',  operator:'DDD', route:'Ouakam ↔ Palais',              color:'#3b82f6', freq:'15 min', tarif:200, stops:['ok1','lb6','p03','p01'] },
  { id:'L8',  name:'Ligne 8',  operator:'DDD', route:'Yoff ↔ Palais',               color:'#60a5fa', freq:'15 min', tarif:200, stops:['yf1','yf2','bm1','ha2','p03','p01'] },
  { id:'L9',  name:'Ligne 9',  operator:'DDD', route:'Liberté 6 ↔ Palais',          color:'#2563eb', freq:'10 min', tarif:200, stops:['lb6','sc1','ha2','p05','p03','p01'] },
  { id:'L10', name:'Ligne 10', operator:'DDD', route:'Liberté 5 ↔ Palais',          color:'#1e40af', freq:'12 min', tarif:200, stops:['lb5','sc1','p05','p03','p01'] },
  { id:'L11', name:'Ligne 11', operator:'DDD', route:'Keur Massar ↔ Leclerc',       color:'#1e3a8a', freq:'15 min', tarif:250, stops:['km1','km2','gd1','lb5','lc1'] },
  { id:'L12', name:'Ligne 12', operator:'DDD', route:'Guédiawaye ↔ Palais',         color:'#1a56db', freq:'12 min', tarif:200, stops:['gd1','gd2','pk1','p03','p01'] },
  { id:'L13', name:'Ligne 13', operator:'DDD', route:'Liberté 5 ↔ Palais (Sicap)',  color:'#3b82f6', freq:'10 min', tarif:200, stops:['lb5','lb6','sc1','p05','p03','p01'] },
  { id:'L15', name:'Ligne 15', operator:'DDD', route:'Rufisque ↔ Palais',           color:'#1d4ed8', freq:'20 min', tarif:300, stops:['rf1','th1','pk1','ha2','p03','p01'] },
  { id:'L16A',name:'Ligne 16A',operator:'DDD', route:'Malika ↔ Palais',             color:'#60a5fa', freq:'25 min', tarif:300, stops:['ml1','gd2','gd1','pk1','p01'] },
  { id:'L20', name:'Ligne 20', operator:'DDD', route:'Liberté 5 (express)',          color:'#2563eb', freq:'10 min', tarif:200, stops:['lb5','gy1','lc2','lc1'] },
  { id:'L23', name:'Ligne 23', operator:'DDD', route:'Parcelles ↔ Palais',          color:'#1a56db', freq:'12 min', tarif:200, stops:['pa1','pa2','pa3','lb5','lb6','p05','p03','p01'] },
  { id:'L45', name:'Ligne 45', operator:'DDD', route:'Mbao ↔ Palais',               color:'#1e40af', freq:'20 min', tarif:300, stops:['mb1','pk1','ha2','p03','p01'] },
  { id:'L121',name:'Ligne 121',operator:'DDD', route:'HLM Grand Yoff ↔ Leclerc',   color:'#3b82f6', freq:'15 min', tarif:200, stops:['lc2','gy1','lb5','lc1'] },
];

const AFTU_COLORS = ['#e11d48','#f43f5e','#be123c'];
const AFTU_LINES: Line[] = [
  { id:'A1',  name:'AFTU 1',  operator:'AFTU', route:'Lat Dior ↔ HLM',         color:AFTU_COLORS[0], freq:'8 min',  tarif:150, stops:['p06','lc2','gy1'] },
  { id:'A2',  name:'AFTU 2',  operator:'AFTU', route:'Parcelles ↔ Petersen',   color:AFTU_COLORS[1], freq:'6 min',  tarif:150, stops:['pa1','lb5','lb6','p04','p02'] },
  { id:'A3',  name:'AFTU 3',  operator:'AFTU', route:'Yoff ↔ Petersen',        color:AFTU_COLORS[2], freq:'10 min', tarif:150, stops:['yf1','ok1','gy1','lb6','p04','p02'] },
  { id:'A4',  name:'AFTU 4',  operator:'AFTU', route:'Yoff Village ↔ Petersen',color:AFTU_COLORS[0], freq:'10 min', tarif:150, stops:['yf1','yf2','ok1','p04','p02'] },
  { id:'A5',  name:'AFTU 5',  operator:'AFTU', route:'Parcelles ↔ Petersen',   color:AFTU_COLORS[1], freq:'8 min',  tarif:150, stops:['pa1','cb1','lb5','p02'] },
  { id:'A25', name:'AFTU 25', operator:'AFTU', route:'Parcelles ↔ Petersen',   color:AFTU_COLORS[2], freq:'8 min',  tarif:150, stops:['pa1','lb5','p02'] },
  { id:'A27', name:'AFTU 27', operator:'AFTU', route:'Guédiawaye ↔ Petersen',  color:AFTU_COLORS[0], freq:'12 min', tarif:150, stops:['gd1','lb6','p04','p02'] },
  { id:'A29', name:'AFTU 29', operator:'AFTU', route:'Cité Nations ↔ Petersen',color:AFTU_COLORS[1], freq:'10 min', tarif:150, stops:['cb1','pa1','lb5','p04','p02'] },
  { id:'A33', name:'AFTU 33', operator:'AFTU', route:'Colobane ↔ Guédiawaye',  color:AFTU_COLORS[2], freq:'12 min', tarif:150, stops:['p04','lb6','gy1','gd1'] },
  { id:'A35', name:'AFTU 35', operator:'AFTU', route:'Ngor ↔ Pikine',          color:AFTU_COLORS[0], freq:'20 min', tarif:150, stops:['ng1','ok1','gy1','pk1'] },
  { id:'A42', name:'AFTU 42', operator:'AFTU', route:'Gadaye ↔ Ouakam',        color:AFTU_COLORS[1], freq:'20 min', tarif:150, stops:['gd1','gy1','ok1'] },
  { id:'A44', name:'AFTU 44', operator:'AFTU', route:'Grand Mbao ↔ Ouakam',    color:AFTU_COLORS[2], freq:'25 min', tarif:200, stops:['mb1','pk1','gy1','ok1'] },
  { id:'A52', name:'AFTU 52', operator:'AFTU', route:'Pikine ↔ Keur Massar',   color:AFTU_COLORS[0], freq:'15 min', tarif:150, stops:['pk1','km2','km1'] },
  { id:'A55', name:'AFTU 55', operator:'AFTU', route:'Rufisque ↔ Petersen',    color:AFTU_COLORS[1], freq:'20 min', tarif:250, stops:['rf1','pk1','ha2','p02'] },
  { id:'A57', name:'AFTU 57', operator:'AFTU', route:'Liberté 6 ↔ Rufisque',   color:AFTU_COLORS[2], freq:'20 min', tarif:250, stops:['lb6','pk1','rf1'] },
  { id:'A61', name:'AFTU 61', operator:'AFTU', route:'Almadies ↔ Keur Massar', color:AFTU_COLORS[0], freq:'25 min', tarif:200, stops:['al1','ng1','ok1','gy1','km1'] },
  { id:'A64', name:'AFTU 64', operator:'AFTU', route:'Guédiawaye ↔ Rufisque',  color:AFTU_COLORS[1], freq:'20 min', tarif:200, stops:['gd1','pk1','rf1'] },
  { id:'A80', name:'AFTU 80', operator:'AFTU', route:'Diamniadio ↔ Médina',    color:AFTU_COLORS[2], freq:'30 min', tarif:300, stops:['t05','rf1','pk1','p04'] },
];

const BRT_LINES: Line[] = [
  { id:'BRT-L1', name:'BRT L1', operator:'BRT', route:'Petersen ↔ Guédiawaye', color:'#7c3aed', freq:'5 min',  tarif:300, stops:['b01','b03','b05','pk1','gd1'] },
];

const TER_LINES: Line[] = [
  { id:'TER-01', name:'TER 01', operator:'TER', route:'Dakar ↔ AIBD', color:'#059669', freq:'30 min', tarif:500, stops:['t01','t02','t03','t04','t05','t06'] },
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
  { id:'retard',   label:'Bus en retard',    emoji:'⏰', color:'#d97706' },
  { id:'bonde',    label:'Arrêt bondé',      emoji:'👥', color:'#dc2626' },
  { id:'degrade',  label:'Arrêt dégradé',    emoji:'🚧', color:'#94a3b8' },
  { id:'insecure', label:'Insécurité',       emoji:'⚠️', color:'#dc2626' },
  { id:'accident', label:'Accident/Incident',emoji:'🚨', color:'#dc2626' },
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
