# SunuBus 🚌 — Transport en Commun Dakar

Application web et mobile unifiée pour les transports en commun de Dakar, Sénégal 🇸🇳

## 🚀 Stack Technique
- **Frontend** : React 19 + TypeScript + Vite
- **Styling** : Tailwind CSS v4 (Dark Mode natif)
- **État** : Redux Toolkit
- **Cartographie** : React Leaflet + OSRM (tracés sur routes réelles)
- **Mobile** : Capacitor (Android natif)

## 📋 Fonctionnalités
- 🗺️ **Carte interactive** avec toutes les lignes DDD, AFTU, BRT et TER
- ⏱️ **Temps réel** : positions simulées des bus avec animation sur les tracés
- 🔍 **Planificateur de trajets** avec calcul d'itinéraire et tarifs
- 👤 **Mode Passager** : carte, lignes, arrêts, alertes réseau
- 👨‍✈️ **Mode Chauffeur** : GPS en direct, signalement incidents
- 🛡️ **Mode Admin** : supervision globale du réseau
- 📱 **APK Android** via Capacitor

## 🛠️ Démarrage rapide

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build de production
npm run build

# Sync avec Android
npm run cap:sync

# Ouvrir dans Android Studio
npm run cap:android
```

## 📁 Structure
```
src/
├── components/     # Composants réutilisables (Map, Search, Popups)
├── data/           # Données transport (lignes, arrêts, opérateurs)
├── pages/          # Pages du panneau (Plan, Lignes, Arrêts, Alertes)
├── services/       # Simulation temps réel, future API
├── store/          # Redux Toolkit (slices: mobility, auth, ui)
├── types.ts        # Types TypeScript globaux
├── utils/          # OSRM routing, thème
└── views/
    ├── passenger/  # Interface voyageur
    ├── driver/     # Interface chauffeur
    └── admin/      # Interface administrateur
```

## 🔮 Roadmap
- [ ] Connexion backend WebSocket temps réel
- [ ] Authentification JWT multi-rôles
- [ ] Paiement mobile intégré
- [ ] Notifications push (bus à 5 min)
- [ ] Version iOS

## 📝 Licence
MIT — Mamadou Eliman Ewane
