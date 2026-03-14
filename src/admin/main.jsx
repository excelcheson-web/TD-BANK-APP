import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../style.css'
import AdminApp from './App.jsx'

createRoot(document.getElementById('admin-root')).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
)
