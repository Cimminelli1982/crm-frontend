import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { embedAgGridStyles } from './ag-grid-styles';
import { registerAgGridModules } from './ag-grid-modules';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// Inject AG Grid styles and register modules
embedAgGridStyles();
registerAgGridModules();

// Create a root
const root = createRoot(document.getElementById('root'));

// Render your app
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
