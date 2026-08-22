import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { SolicitudesProvider } from './context/SolicitudesContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SolicitudesProvider>
        <App />
      </SolicitudesProvider>
    </BrowserRouter>
  </StrictMode>,
)
