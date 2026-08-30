import { initThemeEngine } from './utils/themeEngine';
initThemeEngine();
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { autoHealLocalStorage } from './utils/sanitize'

autoHealLocalStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)