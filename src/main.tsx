import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

document.body.style.backgroundImage = `radial-gradient(ellipse at center, rgba(12, 8, 6, 0.45) 0%, #0c0806 100%), url(${import.meta.env.BASE_URL}assets/cover.jpg)`

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
