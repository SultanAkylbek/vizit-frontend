import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { PlacePageRoute } from './pages/PlacePageRoute'
import ChatPage from './pages/ChatPage'
import VendorPage from './pages/VendorPage'
import AuthPage from './pages/AuthPage'
import { AuthProvider } from './auth/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Публичная страница заведения — БЕЗ авторизации, для краулеров */}
          <Route path="/place/:slug" element={<PlacePageRoute />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/vendor" element={<VendorPage />} />
          <Route path="/login" element={<AuthPage />} />
          {/* Всё остальное — твоё текущее приложение без изменений */}
          <Route path="*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
