// ══════════════════════════════════════════════════════════════
//  SunuBus v5 — Types TypeScript globaux
// ══════════════════════════════════════════════════════════════

export type OperatorId = 'DDD' | 'AFTU' | 'BRT' | 'TER' | 'all';
export type UserRole   = 'passenger' | 'driver' | 'admin' | 'super_admin';
export type Lang       = 'fr' | 'wo' | 'en';
export type Theme      = 'dark' | 'light';

export interface Operator {
  id: OperatorId;
  name: string;
  fullName: string;
  icon: string;
  color: string;
  bg: string;
  tarif: number;
  climatise: boolean;
}

export interface TerInfo {
  gare: string;
  horaires: string;
  freq: string;
  quai: string[];
  services: string[];
  correspondances: string[];
}

export interface Stop {
  id: string;
  name: string;
  zone: string;
  lat: number;
  lng: number;
  operators: OperatorId[];
  lines: string[];
  terConnection?: boolean;
  terInfo?: TerInfo;
}

export interface Line {
  id: string;
  name: string;
  route: string;
  color: string;
  freq: string;
  tarif: number;
  stops: string[];
  operator: OperatorId;
}

export interface Departure {
  lineId: string;
  lineName: string;
  operator: OperatorId;
  color: string;
  route: string;
  waitMin: number;
  time: string;
  comfort: ComfortIndex;
}

export interface ComfortIndex {
  score: number;
  label: string;
  color: string;
  emoji: string;
}

export interface AffluenceData {
  level: string;
  pct: number;
  color: string;
  emoji: string;
  extra: string;
}

export interface Report {
  id: number;
  type: string;
  label: string;
  emoji: string;
  time: string;
  stopId: string;
}

export interface RouteResult {
  type: 'direct' | 'transfer';
  duration: number;
  distance: number;
  fare: number;
  segments: RouteSegment[];
  transfers: number;
}

export interface RouteSegment {
  line: Line;
  fromStop: Stop;
  toStop: Stop;
  stops: Stop[];
  duration: number;
  fare: number;
}

export interface BusPosition {
  lineId: string;
  lat: number;
  lng: number;
  speed: number;
  occupancy: number;
  driverId?: string;
  timestamp: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface POI {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  emoji: string;
  nearestStop: string;
}
