import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'
import { CATEGORIES } from './projects/categories.js'

// Páginas que se prerenderizan: portada + una por categoría de Proyectos
export const ROUTES = [
  { path: '/' },
  ...CATEGORIES.map((c) => ({ path: c.href, title: c.title, lead: c.lead })),
]

// Solo se usa en el build para prerenderizar el HTML (SEO / GEO)
export function render(path = '/') {
  return renderToString(
    <StrictMode>
      <App path={path} />
    </StrictMode>
  )
}
