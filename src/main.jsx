// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Importe BrowserRouter
import App from './App';
import './index.css'; // Seus estilos globais e Tailwind

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* Envolva o App com BrowserRouter aqui */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);