import { useEffect, useRef } from 'react'
import { CATEGORIES } from '../projects/categories.js'
import './ProjectsMenu.css'

/*
  Panel del menú hamburguesa de Proyectos: lista las páginas por categoría.
  Se cierra con Esc, clic afuera o al elegir una.
*/
export default function ProjectsMenu({ open, onClose, current }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target)) return
      if (e.target.closest?.('[data-projects-toggle]')) return
      onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    panelRef.current?.querySelector('a')?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open, onClose])

  return (
    <div
      ref={panelRef}
      id="projects-menu"
      className={`projects-menu${open ? ' is-open' : ''}`}
      aria-hidden={!open}
      inert={!open}
    >
      <p className="projects-menu__label">Proyectos</p>
      <ul className="projects-menu__list">
        {CATEGORIES.map((c, i) => (
          <li key={c.slug} style={{ '--i': i }}>
            <a
              href={c.href}
              className={`projects-menu__item${c.slug === current ? ' is-current' : ''}`}
              aria-current={c.slug === current ? 'page' : undefined}
              onClick={onClose}
            >
              <span className="projects-menu__thumb">
                {c.cover && <img src={c.cover} alt="" width="120" height="120" loading="lazy" decoding="async" />}
              </span>
              <span className="projects-menu__text">
                <span className="projects-menu__title">{c.title}</span>
                <span className="projects-menu__count">
                  {c.slug === 'web' ? `${c.count} sitios` : c.slug === 'branding' ? `${c.count} marcas` : c.slug === 'video' ? `${c.count} videos` : `${c.count} piezas`}
                </span>
              </span>
              <span className="projects-menu__go" aria-hidden="true">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
