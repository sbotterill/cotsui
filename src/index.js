import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const initialMode = localStorage.getItem('theme') || 'dark'
document.documentElement.classList.add(initialMode);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);
