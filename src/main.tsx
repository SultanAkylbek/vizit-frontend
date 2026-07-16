import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { PlacePageRoute } from './pages/PlacePageRoute'
import ChatPage from './pages/ChatPage'
import VendorPage from './pages/VendorPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Публичная страница заведения — БЕЗ авторизации, для краулеров */}
        <Route path="/place/:slug" element={<PlacePageRoute />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/vendor" element={<VendorPage />} />
        {/* Всё остальное — твоё текущее приложение без изменений */}
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
