import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App';
import './styles/globals.css';

// Replaced react-content with react-dom/client
import { createRoot } from 'react-dom/client';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
}
