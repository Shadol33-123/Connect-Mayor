import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AppProviders } from './providers/AppProviders';
import { ErrorBoundary } from './ErrorBoundary';

const container = document.getElementById('root');
if (!container) throw new Error('Root container not found');
createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProviders>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>
);
