import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { OperatorId, Stop, BusPosition, Lang, Ticket, CrowdsourceReport, Toast, ActiveJourney, JourneyRecord, JourneyStatus } from '@/types';

// ── Mobility Slice ─────────────────────────────────────────────
interface MobilityState {
  activeTab: 'plan' | 'lines' | 'stops' | 'alerts' | 'tickets' | 'profile';
  selectedOperator: OperatorId;
  selectedStop: string | null;
  focusedLine: string | null;
  userLocation: [number, number] | null;
  mapCenter: [number, number];
  mapZoom: number;
  route: { origin: Stop | null; destination: Stop | null };
  busPositions: BusPosition[];
}

const mobilitySlice = createSlice({
  name: 'mobility',
  initialState: {
    activeTab: 'plan',
    selectedOperator: 'all',
    selectedStop: null,
    focusedLine: null,
    userLocation: null,
    mapCenter: [14.7167, -17.4677] as [number, number],
    mapZoom: 12,
    route: { origin: null, destination: null },
    busPositions: [],
  } as MobilityState,
  reducers: {
    setActiveTab: (s, a: PayloadAction<MobilityState['activeTab']>) => { s.activeTab = a.payload; },
    setSelectedOperator: (s, a: PayloadAction<OperatorId>) => { s.selectedOperator = a.payload; },
    setSelectedStop: (s, a: PayloadAction<string | null>) => { s.selectedStop = a.payload; },
    setFocusedLine: (s, a: PayloadAction<string>) => { s.focusedLine = a.payload; },
    clearFocusedLine: (s) => { s.focusedLine = null; },
    setUserLocation: (s, a: PayloadAction<[number, number]>) => { s.userLocation = a.payload; },
    setMapCenter: (s, a: PayloadAction<[number, number]>) => { s.mapCenter = a.payload; },
    setMapZoom: (s, a: PayloadAction<number>) => { s.mapZoom = a.payload; },
    setRouteOrigin: (s, a: PayloadAction<Stop | null>) => { s.route.origin = a.payload; },
    setRouteDestination: (s, a: PayloadAction<Stop | null>) => { s.route.destination = a.payload; },
    clearRoute: (s) => { s.route = { origin: null, destination: null }; },
    setBusPositions: (s, a: PayloadAction<BusPosition[]>) => { s.busPositions = a.payload; },
  },
});

// ── Auth Slice ────────────────────────────────────────────────
import type { UserRole } from '@/types';
interface AuthState {
  role: UserRole;
  name: string;
  lineId: string | null;
  isAuthenticated: boolean;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    role: 'passenger' as UserRole,
    name: 'Voyageur',
    lineId: null,
    isAuthenticated: false,
  } as AuthState,
  reducers: {
    loginPassenger: (s) => {
      s.role = 'passenger'; s.name = 'Voyageur'; s.isAuthenticated = true;
    },
    loginDriver: (s, a: PayloadAction<{ name: string; lineId: string }>) => {
      s.role = 'driver'; s.name = a.payload.name; s.lineId = a.payload.lineId; s.isAuthenticated = true;
    },
    loginAdmin: (s, a: PayloadAction<{ name: string }>) => {
      s.role = 'admin'; s.name = a.payload.name; s.isAuthenticated = true;
    },
    logout: (s) => { s.role = 'passenger'; s.name = 'Voyageur'; s.lineId = null; s.isAuthenticated = false; },
  },
});

// ── UI Slice ──────────────────────────────────────────────────
interface UIState {
  darkMode: boolean;
  lang: Lang;
  sidebarCollapsed: boolean;
  showQR: boolean;
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    darkMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true,
    lang: 'fr' as Lang,
    sidebarCollapsed: false,
    showQR: false,
  } as UIState,
  reducers: {
    toggleDarkMode: (s) => { s.darkMode = !s.darkMode; },
    setLang: (s, a: PayloadAction<Lang>) => { s.lang = a.payload; },
    toggleSidebar: (s) => { s.sidebarCollapsed = !s.sidebarCollapsed; },
    setShowQR: (s, a: PayloadAction<boolean>) => { s.showQR = a.payload; },
  },
});

// ── Ticket Slice ────────────────────────────────────────────────
interface TicketState {
  myTickets: Ticket[];
  reports: CrowdsourceReport[];
  adminRevenue: Record<OperatorId, number>;
}

const ticketSlice = createSlice({
  name: 'tickets',
  initialState: {
    myTickets: [],
    reports: [
      { id: '1', type: 'delay', description: 'Bouchon énorme sur VDN, retard estimé 20 min', location: [14.71, -17.46] as [number, number], timestamp: Date.now() - 1000 * 60 * 15, upvotes: 12 },
      { id: '2', type: 'accident', description: 'Accident au croisement Liberté 6 / VDN', location: [14.73, -17.45] as [number, number], timestamp: Date.now() - 1000 * 60 * 45, upvotes: 5 },
      { id: '3', type: 'crowd', description: 'Arrêt Petersen très chargé, bus pleins', location: [14.678, -17.44] as [number, number], timestamp: Date.now() - 1000 * 60 * 8, upvotes: 23 },
    ] as CrowdsourceReport[],
    adminRevenue: { DDD: 450000, AFTU: 320000, BRT: 890000, TER: 1250000, all: 0 },
  } as TicketState,
  reducers: {
    buyTicket: (s, a: PayloadAction<Omit<Ticket, 'id' | 'purchaseTime' | 'status' | 'qrData'>>) => {
      const id = Math.random().toString(36).substring(2, 11).toUpperCase();
      const ticket: Ticket = {
        ...a.payload,
        id,
        purchaseTime: Date.now(),
        status: 'valid',
        qrData: `TICKET-${id}-${a.payload.operator}-${Date.now()}`,
      };
      s.myTickets.push(ticket);
      s.adminRevenue[a.payload.operator] = (s.adminRevenue[a.payload.operator] || 0) + a.payload.price;
    },
    useTicket: (s, a: PayloadAction<string>) => {
      const t = s.myTickets.find(x => x.id === a.payload);
      if (t) t.status = 'used';
    },
    addReport: (s, a: PayloadAction<CrowdsourceReport>) => {
      s.reports.unshift(a.payload);
    },
    upvoteReport: (s, a: PayloadAction<string>) => {
      const r = s.reports.find(x => x.id === a.payload);
      if (r) r.upvotes += 1;
    },
    acknowledgeReport: (s, a: PayloadAction<string>) => {
      s.reports = s.reports.filter(r => r.id !== a.payload);
    },
  },
});

// ── Toast Slice ───────────────────────────────────────────────
const toastSlice = createSlice({
  name: 'toasts',
  initialState: { items: [] as Toast[] },
  reducers: {
    showToast: (s, a: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = Math.random().toString(36).substring(2, 9);
      s.items.push({ ...a.payload, id });
      if (s.items.length > 3) s.items.shift();
    },
    dismissToast: (s, a: PayloadAction<string>) => {
      s.items = s.items.filter(t => t.id !== a.payload);
    },
  },
});

// ── Favorites Slice ───────────────────────────────────────────────
interface FavState {
  stopIds: string[];
  lineIds: string[];
  recentLines: string[];
  tripCount: number;
  totalFCFA: number;
  co2SavedKg: number;
  favOperator: OperatorId | null;
}

const favSlice = createSlice({
  name: 'favorites',
  initialState: {
    stopIds: [],
    lineIds: [],
    recentLines: [],
    tripCount: 0,
    totalFCFA: 0,
    co2SavedKg: 0,
    favOperator: null,
  } as FavState,
  reducers: {
    toggleFavStop: (s, a: PayloadAction<string>) => {
      const idx = s.stopIds.indexOf(a.payload);
      if (idx >= 0) s.stopIds.splice(idx, 1);
      else s.stopIds.push(a.payload);
    },
    toggleFavLine: (s, a: PayloadAction<string>) => {
      const idx = s.lineIds.indexOf(a.payload);
      if (idx >= 0) s.lineIds.splice(idx, 1);
      else s.lineIds.push(a.payload);
    },
    visitLine: (s, a: PayloadAction<string>) => {
      s.recentLines = [a.payload, ...s.recentLines.filter(id => id !== a.payload)].slice(0, 6);
    },
    recordTrip: (s, a: PayloadAction<{ fare: number; operator: OperatorId }>) => {
      s.tripCount += 1;
      s.totalFCFA += a.payload.fare;
      s.co2SavedKg += 0.12;
      s.favOperator = a.payload.operator;
    },
  },
});

// ── Active Journey Slice ──────────────────────────────────────
const journeySlice = createSlice({
  name: 'journey',
  initialState: {
    active: null as ActiveJourney | null,
    history: [] as JourneyRecord[],
    showEndModal: false,
  },
  reducers: {
    startJourney: (s, a: PayloadAction<ActiveJourney>) => {
      s.active = a.payload;
      s.showEndModal = false;
    },
    updateJourneyStatus: (s, a: PayloadAction<JourneyStatus>) => {
      if (s.active) s.active.status = a.payload;
      if (a.payload === 'arrived') s.showEndModal = true;
    },
    attachTicketToJourney: (s, a: PayloadAction<string>) => {
      if (s.active) s.active.ticketId = a.payload;
    },
    finishJourney: (s) => {
      if (!s.active) return;
      const elapsed = Math.round((Date.now() - s.active.startedAt) / 60000);
      s.history.unshift({
        id: s.active.id,
        originName: s.active.originStop.name,
        destName: s.active.destinationStop.name,
        lineId: s.active.lineId,
        operator: s.active.operator,
        fare: s.active.fare,
        duration: elapsed || s.active.estimatedDuration,
        co2: Math.round((elapsed || s.active.estimatedDuration) * 0.008 * 100) / 100,
        date: Date.now(),
      });
      if (s.history.length > 20) s.history.pop();
      s.active = null;
      s.showEndModal = false;
    },
    cancelJourney: (s) => { s.active = null; s.showEndModal = false; },
    dismissEndModal: (s) => { s.showEndModal = false; },
  },
});

// ── Store ─────────────────────────────────────────────────────
export const store = configureStore({
  reducer: {
    mobility: mobilitySlice.reducer,
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
    tickets: ticketSlice.reducer,
    favorites: favSlice.reducer,
    toasts: toastSlice.reducer,
    journey: journeySlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const {
  setActiveTab, setSelectedOperator, setSelectedStop,
  setFocusedLine, clearFocusedLine, setUserLocation,
  setMapCenter, setMapZoom, setRouteOrigin, setRouteDestination,
  clearRoute, setBusPositions,
} = mobilitySlice.actions;

export const { loginPassenger, loginDriver, loginAdmin, logout } = authSlice.actions;
export const { toggleDarkMode, setLang, toggleSidebar, setShowQR } = uiSlice.actions;
export const { buyTicket, useTicket, addReport, upvoteReport, acknowledgeReport } = ticketSlice.actions;
export const { toggleFavStop, toggleFavLine, recordTrip, visitLine } = favSlice.actions;
export const { showToast, dismissToast } = toastSlice.actions;
export const { startJourney, updateJourneyStatus, attachTicketToJourney, finishJourney, cancelJourney, dismissEndModal } = journeySlice.actions;
