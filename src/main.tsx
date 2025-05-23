import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter, UNSAFE_NavigationContext } from 'react-router-dom'

// Configure future flags
UNSAFE_NavigationContext.v7_startTransition = true;
UNSAFE_NavigationContext.v7_relativeSplatPath = true;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);