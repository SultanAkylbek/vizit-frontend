import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { PlacePageRoute } from './pages/PlacePageRoute'
import ChatPage from './pages/ChatPage'
import VendorPage from './pages/VendorPage'
import AuthPage from './pages/AuthPage'
import BusinessesPage from './pages/BusinessesPage'
import CategoryPage from './pages/CategoryPage'
import CityPage from './pages/CityPage'
import DistrictPage from './pages/DistrictPage'
import CityCategoryPage from './pages/CityCategoryPage'
import { AuthProvider } from './auth/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <HelmetProvider>
        <BrowserRouter>
          <Routes>
            {/* Public place page — no auth, for crawlers */}
            <Route path="/place/:slug" element={<PlacePageRoute />} />
            
            {/* SEO catalog pages */}
            <Route path="/businesses" element={<BusinessesPage />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/city/:city" element={<CityPage />} />
            <Route path="/district/:district" element={<DistrictPage />} />
            <Route path="/:city/:category" element={<CityCategoryPage />} />
            
            {/* Other pages */}
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/vendor" element={<VendorPage />} />
            <Route path="/login" element={<AuthPage />} />
            
            {/* Everything else — your current app unchanged */}
            <Route path="*" element={<App />} />
          </Routes>
        </BrowserRouter>
      </HelmetProvider>
    </AuthProvider>
  </StrictMode>,
)
