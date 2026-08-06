import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'

// Capacitor 原生壳里用本地服务器托管，BrowserRouter 的 history 路由会匹配不到导致白屏，
// 改用 HashRouter；网页版继续用 BrowserRouter（保持干净的 URL，不影响 Vercel 部署）。
const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </StrictMode>,
)
