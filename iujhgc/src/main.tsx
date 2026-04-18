import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ReportPage from './pages/ReportPage.tsx'
import ReportPdfPage from './pages/ReportPdfPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/report/pdf" element={<ReportPdfPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
