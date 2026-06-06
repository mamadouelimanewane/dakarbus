import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App';
import './styles/globals.css';
import 'leaflet/dist/leaflet.css';

// Replaced react-content with react-dom/client
import { createRoot } from 'react-dom/client';

// Register PWA service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {/* non-critical */});
  });
}

const root = document.getElementById('root');
if (root) {
  // StrictMode disabled: react-leaflet hooks (useMap) are incompatible with double-mount
  createRoot(root).render(
    <Provider store={store}>
      <App />
    </Provider>
  );
}
