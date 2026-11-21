import { useEffect, useRef, useState } from 'react'
import { CATEGORIES } from '../projects/categories.js'
import { NETWORKS } from './Connect.jsx'
import './MobileMenu.css'

/*
  Menú de celular: en pantallas angostas reemplaza al menú de píldora y al
  botón de Contacto. Un botón redondo abre una pantalla completa con los
  links grandes (entran en cascada), las categorías de Proyectos en una fila
  que se desliza con el dedo, y Contacto + redes abajo.
  Se cierra con la X, con Esc o al tocar un link.
*/
const LINKS = [
  { label: 'Inicio', href: '/#inicio' },
  { label: 'Sobre mí', href: '/#sobre-mi' },
  { label: 'Servicios', href: '/#servicios' },
  { label: 'Reseñas', href: '/#resenas' },
]

export default function MobileMenu({ current }) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    // Con el menú abierto (fondo oscuro) el logo va siempre en blanco
    document.documentElement.classList.add('mnav-open')
    panelRef.current?.querySelector('a')?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      document.documentElement.classList.remove('mnav-open')
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      <button
        type="button"
        className={`mnav__toggle${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => setOpen((o) => !o)}
      >
        <i />
        <i />
      </button>

      <div
        ref={panelRef}
        id="mobile-menu"
        className={`mnav${open ? ' is-open' : ''}`}
        aria-hidden={!open}
        inert={!open}
      >
        <nav className="mnav__links" aria-label="Menú">
          {LINKS.map((l, i) => (
            <a key={l.label} href={l.href} onClick={close} style={{ '--i': i }}>
              <span className="mnav__num">{String(i + 1).padStart(2, '0')}</span>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="mnav__projects" style={{ '--i': LINKS.length }}>
          <p className="mnav__label">Proyectos</p>
          <ul>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <a href={c.href} onClick={close} className={c.slug === current ? 'is-current' : undefined}>
                  {c.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mnav__bottom" style={{ '--i': LINKS.length + 1 }}>
          <a className="mnav__contact" href="#contacto" onClick={close}>
            Contacto <span aria-hidden="true">↗</span>
          </a>
          <div className="mnav__social">
            {NETWORKS.map((n) => (
              <a key={n.name} href={n.href} target="_blank" rel="noopener noreferrer">
                {n.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
