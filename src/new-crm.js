import React from 'react';
import ReactDOM from 'react-dom/client';
import NewCRMApp from './NewCRMApp';

console.log('New CRM app starting...');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<NewCRMApp />);

console.log('New CRM app rendered');