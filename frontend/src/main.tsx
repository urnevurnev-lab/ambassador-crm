import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Временно отключаем импорты Leaflet, если они ломают сборку
import 'leaflet/dist/leaflet.css';
import { fixLeafletIcons } from './utils/fix-map-icon';

fixLeafletIcons();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
