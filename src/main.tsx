import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { themeInitialisieren } from './lib/theme'

themeInitialisieren()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
