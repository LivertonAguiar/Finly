// One-time localStorage migration: plannerfin_* → finly_*, planner-dark → finly-dark
(function migrateLocalStorageKeys() {
  if (localStorage.getItem('finly_ls_migrated')) return;
  const keyMap: Record<string, string> = {
    'plannerfin_theme_preset': 'finly_theme_preset',
    'plannerfin_accent_color': 'finly_accent_color',
    'plannerfin_card_radius': 'finly_card_radius',
    'plannerfin_sidebar_custom_order_v1': 'finly_sidebar_custom_order_v1',
    'plannerfin_dash_widgets': 'finly_dash_widgets',
    'plannerfin_dashboard_cards_v5': 'finly_dashboard_cards_v5',
    'plannerfin_dashboard_cards_order_v2': 'finly_dashboard_cards_order_v2',
    'plannerfin_dashboard_cards_order_v1': 'finly_dashboard_cards_order_v1',
  };
  const themeRenames: Record<string, string> = {
    'planner-dark': 'finly-dark',
    'plannerfin-dark': 'finly-deep-dark',
  };
  for (const [oldKey, newKey] of Object.entries(keyMap)) {
    const val = localStorage.getItem(oldKey);
    if (val !== null && localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, val);
      localStorage.removeItem(oldKey);
    }
  }
  const themeVal = localStorage.getItem('finly_theme_preset');
  if (themeVal && themeRenames[themeVal]) {
    localStorage.setItem('finly_theme_preset', themeRenames[themeVal]);
  }
  localStorage.setItem('finly_ls_migrated', '1');
})();

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