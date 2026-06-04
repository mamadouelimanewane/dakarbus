import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { OperatorId, Stop, BusPosition, Lang } from '@/types';

// ── Mobility Slice ─────────────────────────────────────────────
interface MobilityState {
  activeTab: 'plan' | 'lines' | 'stops' | 'alerts';
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
    darkMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
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

// ── Store ─────────────────────────────────────────────────────
export const store = configureStore({
  reducer: {
    mobility: mobilitySlice.reducer,
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
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
