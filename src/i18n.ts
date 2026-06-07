// ── Traductions FR / WO (Wolof) / EN ──────────────────────────
export type Lang = 'fr' | 'wo' | 'en';

const T = {
  // Navigation tabs
  plan:       { fr:'Planifier',  wo:'Jëfandikoo',  en:'Plan' },
  lines:      { fr:'Lignes',     wo:'Liñu',         en:'Lines' },
  stops:      { fr:'Arrêts',     wo:'Téy',          en:'Stops' },
  alerts:     { fr:'Alertes',    wo:'Xibaaral',     en:'Alerts' },
  tickets:    { fr:'Billets',    wo:'Tikke',        en:'Tickets' },
  profile:    { fr:'Profil',     wo:'Sama doom',    en:'Profile' },

  // Common
  search:     { fr:'Rechercher…',wo:'Wuté…',        en:'Search…' },
  loading:    { fr:'Chargement…',wo:'Jëm ci kanam…',en:'Loading…' },
  close:      { fr:'Fermer',     wo:'Tëj',          en:'Close' },
  back:       { fr:'Retour',     wo:'Dellu',        en:'Back' },
  next:       { fr:'Suivant',    wo:'Ci kanam',     en:'Next' },
  done:       { fr:'Terminer',   wo:'Jeex',         en:'Done' },
  cancel:     { fr:'Annuler',    wo:'Baayal',       en:'Cancel' },
  confirm:    { fr:'Confirmer',  wo:'Dafa soxor',   en:'Confirm' },
  buy:        { fr:'Acheter',    wo:'Jënd',         en:'Buy' },
  send:       { fr:'Envoyer',    wo:'Yónnee',       en:'Send' },
  save:       { fr:'Sauvegarder',wo:'Dëkk',         en:'Save' },
  favorites:  { fr:'Favoris',    wo:'Yëgël',        en:'Favorites' },
  settings:   { fr:'Réglages',   wo:'Reeg',         en:'Settings' },
  logout:     { fr:'Déconnexion',wo:'Génn',         en:'Logout' },
  yes:        { fr:'Oui',        wo:'Waaw',         en:'Yes' },
  no:         { fr:'Non',        wo:'Déedéet',      en:'No' },

  // Stops page
  stops_search:{ fr:'Rechercher un arrêt…', wo:'Wuté téy…',      en:'Search a stop…' },
  stops_near:  { fr:'Arrêts proches',       wo:'Téy yi ci kanam',en:'Nearby stops' },
  stops_fav:   { fr:'Favoris',              wo:'Yëgël yi',        en:'Favorites' },
  stops_all:   { fr:'Tous les arrêts',      wo:'Téy yépp',        en:'All stops' },
  no_stops:    { fr:'Aucun arrêt',          wo:'Amul téy',        en:'No stops' },
  next_bus:    { fr:'Prochain bus',         wo:'Kaar bu jiitu',   en:'Next bus' },

  // Alerts
  report:      { fr:'Signaler',    wo:'Wax ko',     en:'Report' },
  delay:       { fr:'Retard',      wo:'Yëf',        en:'Delay' },
  accident:    { fr:'Accident',    wo:'Dëkk',       en:'Accident' },
  crowd:       { fr:'Affluence',   wo:'Ndaw',       en:'Crowd' },
  ago:         { fr:'il y a',      wo:'ci kanam',   en:'ago' },

  // Tickets
  my_tickets:  { fr:'Mes billets', wo:'Sama tikke', en:'My tickets' },
  valid:       { fr:'Valide',      wo:'Dafa bari',  en:'Valid' },
  used:        { fr:'Utilisé',     wo:'Jeex na',    en:'Used' },
  expired:     { fr:'Expiré',      wo:'Léébu na',   en:'Expired' },
  pay_wave:    { fr:'Payer via Wave',         wo:'Fey ak Wave',        en:'Pay with Wave' },
  pay_om:      { fr:'Payer via Orange Money', wo:'Fey ak Orange Money',en:'Pay with Orange Money' },

  // Voyager
  voyager:     { fr:'Voyager',     wo:'Dem',        en:'Travel' },
  gps_pos:     { fr:'Ma position GPS',wo:'Sama yoon',en:'My GPS position' },
  depart:      { fr:'Départ',      wo:'Dem',        en:'From' },
  arrive:      { fr:'Arrivée',     wo:'Jóge',       en:'To' },
  duration:    { fr:'Durée',       wo:'Yoon bi',    en:'Duration' },
  fare:        { fr:'Tarif',       wo:'Prix bi',    en:'Fare' },
  operator:    { fr:'Opérateur',   wo:'Kumpañi',    en:'Operator' },

  // Profile
  trips:       { fr:'Voyages',     wo:'Dem-dëkk yi',en:'Trips' },
  spending:    { fr:'Dépenses',    wo:'Xaalis',     en:'Spending' },
  eco:         { fr:'CO₂ évité',   wo:'Air bu saa', en:'CO₂ saved' },
  history:     { fr:'Historique',  wo:'Yoon yi',    en:'History' },
  stats:       { fr:'Statistiques',wo:'Limu',       en:'Stats' },
  dark_mode:   { fr:'Thème sombre',wo:'Dëkk bu weex',en:'Dark mode' },
  auto_theme:  { fr:'Thème auto',  wo:'Auto',       en:'Auto theme' },
  notifications:{ fr:'Notifications',wo:'Xibaaral', en:'Notifications' },
  language:    { fr:'Langue',      wo:'Làkk',       en:'Language' },

  // Onboarding
  ob1_title:   { fr:'Bienvenue sur SunuBus', wo:'Dalal ak SunuBus', en:'Welcome to SunuBus' },
  ob1_text:    { fr:'Planifiez vos trajets dans Dakar et sa banlieue en temps réel.', wo:'Jëf sa yoon ci Dakar ak ci kanam ci dëkk bi.', en:'Plan your trips in Dakar and suburbs in real time.' },
  ob2_title:   { fr:'Voyager avec le GPS', wo:'Dem ak GPS bi', en:'Travel with GPS' },
  ob2_text:    { fr:'Appuyez 🚀 pour un trajet guidé depuis votre position, opérateur et tarif inclus.', wo:'Tappe 🚀 ngir dem ak yoon bi, kumpañi ak prix bi.', en:'Tap 🚀 for a guided trip from your position, with operator and fare.' },
  ob3_title:   { fr:'Billets & Alertes', wo:'Tikke ak Xibaaral', en:'Tickets & Alerts' },
  ob3_text:    { fr:'Achetez vos billets via Wave ou Orange Money et signalez les incidents en temps réel.', wo:'Jënd sa tikke ak Wave wala Orange Money, wax ko xibaaral yi.', en:'Buy tickets via Wave or Orange Money and report incidents in real time.' },
  ob_skip:     { fr:'Passer',      wo:'Baayal',     en:'Skip' },
  ob_start:    { fr:'Commencer',   wo:'Tambali',    en:'Get started' },
} as const;

export type TKey = keyof typeof T;

export function t(key: TKey, lang: Lang = 'fr'): string {
  const entry = T[key];
  if (!entry) return key;
  return entry[lang] ?? entry['fr'] ?? key;
}

export default T;
