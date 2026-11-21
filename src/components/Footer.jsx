import { useEffect, useRef } from 'react'
import TextLoop from './TextLoop.jsx'
import { NETWORKS } from './Connect.jsx'
import { CATEGORIES } from '../projects/categories.js'
import './Footer.css'

/*
  Pie de página de todas las páginas (portada y Proyectos):
  texto curvo que fluye (se puede arrastrar), llamado a contacto,
  columnas con navegación, proyectos y redes, y la línea final con
  el logo, el año y "volver arriba".
*/
const SLOGAN = ['Creatividad', 'Actitud', 'Impacto']

const NAV = [
  { label: 'Inicio', href: '/#inicio' },
  { label: 'Sobre mí', href: '/#sobre-mi' },
  { label: 'Servicios', href: '/#servicios' },
  { label: 'Contacto', href: '#contacto' },
]

export default function Footer() {
  const rootRef = useRef(null)

  // Menú: cuando el pie (oscuro) llega arriba, el logo vuelve a la versión blanca
  useEffect(() => {
    const el = rootRef.current
    const html = document.documentElement
    let raf = 0
    let over = false
    const update = () => {
      raf = 0
      const isOver = el.getBoundingClientRect().top < 90
      if (isOver !== over) {
        over = isOver
        html.classList.toggle('nav-over-dark', over)
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      html.classList.remove('nav-over-dark')
    }
  }, [])

  const toTop = () => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <footer ref={rootRef} className="site-footer" aria-label="Pie de página">
      {/* Texto curvo: fluye solo y se puede arrastrar */}
      <div className="site-footer__loop" aria-hidden="true">
        <TextLoop
          className="site-footer__loop-svg"
          text={SLOGAN.join(' ✦ ')}
          separator="✦"
          shape="wave"
          curviness={18}
          speed={60}
          fontSize={40}
          fontWeight={800}
          letterSpacing={0}
          ribbon={false}
          color="#f4f3f7"
          edgeFade={0.6}
          draggable
          pauseOnHover={false}
        />
      </div>

      <div className="site-footer__inner">
        {/* Llamado a contacto */}
        <div className="site-footer__cta">
          <p className="site-footer__eyebrow">¿Tenés un proyecto?</p>
          <p className="site-footer__title">
            Hagamos algo
            <br />
            que <span>deje marca.</span>
          </p>
          <a className="site-footer__button" href="#contacto">
            Hablemos <span aria-hidden="true">↗</span>
          </a>
        </div>

        {/* Columnas */}
        <nav className="site-footer__cols" aria-label="Pie de página">
          <div>
            <p className="site-footer__head">Navegación</p>
            <ul>
              {NAV.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="site-footer__head">Proyectos</p>
            <ul>
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <a href={c.href}>{c.title}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="site-footer__head">Redes</p>
            <ul>
              {NETWORKS.map((n) => (
                <li key={n.name}>
                  <a href={n.href} target="_blank" rel="noopener noreferrer">
                    {n.name} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className="site-footer__bottom">
        <img src="/media/images/inkkstudio-logo-nav.png" alt="Inkk Studio" height="34" loading="lazy" decoding="async" />
        <p>© {new Date().getFullYear()} Inkk Studio · Diseño gráfico, branding y contenido</p>
        <button type="button" className="site-footer__top" onClick={toTop}>
          Volver arriba <span aria-hidden="true">↑</span>
        </button>
      </div>
    </footer>
  )
}
