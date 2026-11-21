import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const container = document.getElementById('root')
const app = (
  <StrictMode>
    <App path={window.location.pathname} />
  </StrictMode>
)

// En producción el HTML viene prerenderizado (SEO): se hidrata.
// En desarrollo el contenedor está vacío: render normal.
if (container.firstElementChild) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
