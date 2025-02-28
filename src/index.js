import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'; // Import the global styles
import App from './App'; // Import the App component
import { AuthProvider } from './context/AuthContext'; // Import the AuthProvider from your context

ReactDOM.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
