import { useEffect, useRef, useState } from 'react'
import { CATEGORIES } from '../projects/categories.js'
import './ServicesAccordion.css'

/*
  Servicios en grilla de recuadros (3 x 2). Cada recuadro muestra un trabajo;
  al pasar el mouse empieza a pasar en loop por los proyectos de ese servicio.
  En celular (sin mouse) pasan solos mientras el recuadro está en pantalla.

  TODO: confirmar qué incluye cada servicio y sumar piezas de Edición de video
  (por ahora usa fotografía de producto).
*/
const O = '/media/obras'
// Página de proyectos a la que lleva cada recuadro (Gestión de redes todavía
// no tiene página propia: va a Redes sociales)
const page = (slug) => CATEGORIES.find((c) => c.slug === slug)?.href || '/#servicios'
const SERVICES = [
  {
    name: 'Branding',
    href: page('branding'),
    includes: ['Logotipo', 'Paleta de color', 'Tipografías', 'Manual de marca'],
    // Manuales de marca: IrazzTech (portada, isotipo, paleta, tipografía, grilla) y Tu Plan Futuro
    images: [
      `${O}/branding/irazztech/01.jpg`,
      `${O}/branding/tu-plan-futuro/logo-04.jpg`,
      `${O}/branding/tu-plan-futuro/logo-06.jpg`,
      `${O}/branding/irazztech/02.jpg`,
      `${O}/branding/irazztech/03.jpg`,
      `${O}/branding/irazztech/04.jpg`,
      `${O}/branding/irazztech/05.jpg`,
    ],
  },
  {
    name: 'Redes sociales',
    href: page('redes-sociales'),
    includes: ['Posteos', 'Historias', 'Carruseles', 'Plantillas'],
    images: [
      `${O}/redes-sociales/electronic-games/01.webp`,
      `${O}/redes-sociales/palanca-store/01.webp`,
      `${O}/redes-sociales/zona-del-verde/01.webp`,
      `${O}/redes-sociales/invesmar/01.webp`,
      `${O}/redes-sociales/irazztech/01.webp`,
    ],
  },
  {
    name: 'Gestión de redes',
    href: page('redes-sociales'),
    includes: ['Calendario', 'Publicación', 'Métricas', 'Meta Ads'],
    images: [
      '/media/Screet de cuenta de redes/CuentasManejadas/ElectronicGames.jpeg',
      '/media/Screet de cuenta de redes/CuentasManejadas/TuplanFuturo.jpeg',
      '/media/Screet de cuenta de redes/CuentasManejadas/Invesmar.jpeg',
      '/media/Screet de cuenta de redes/CuentasManejadas/PiramideDtf.jpeg',
      '/media/Screet de cuenta de redes/CuentasManejadas/Omnitech.jpeg',
    ],
  },
  {
    name: 'Edición de video',
    href: page('video'),
    includes: ['Reels', 'Subtítulos', 'Motion', 'Formato vertical'],
    images: [
      `${O}/fotografia/maximus-gaming/01.webp`,
      `${O}/fotografia/arvel-custom/01.webp`,
      `${O}/fotografia/maximus-gaming/02.webp`,
      `${O}/fotografia/arvel-custom/02.webp`,
    ],
  },
  {
    name: 'Packaging',
    href: page('packaging-carteleria'),
    includes: ['Etiquetas', 'Cajas', 'Stickers', 'Mockups'],
    images: [
      '/media/servicios/packaging.jpg',
      `${O}/packaging-carteleria/limoncello-casero/01.webp`,
      `${O}/packaging-carteleria/bmh-despertador-amanecer/01.webp`,
      `${O}/packaging-carteleria/bmh-despertador-amanecer/02.webp`,
    ],
  },
  {
    name: 'Diseño gráfico',
    href: page('packaging-carteleria'),
    includes: ['Cartelería', 'Roll up', 'Credenciales', 'Banners'],
    images: [
      '/media/servicios/diseno-grafico.jpg',
      `${O}/packaging-carteleria/electronic-games-carteleria/01.webp`,
      `${O}/packaging-carteleria/tu-plan-futuro-impresos/01.webp`,
      `${O}/packaging-carteleria/tu-plan-futuro-impresos/02.webp`,
    ],
  },
]

const pad = (n) => String(n).padStart(2, '0')

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// Cada cuánto cambia de proyecto: con el mouse encima / solo en celular
const HOVER_MS = 650
const AUTO_MS = 1600

function ServiceCard({ service, index, armed }) {
  const { name, includes, images, href } = service
  const [idx, setIdx] = useState(0)
  const [hover, setHover] = useState(false)
  const [autoInView, setAutoInView] = useState(false)
  const ref = useRef(null)

  // Celular / sin mouse: loop automático mientras el recuadro se ve
  useEffect(() => {
    const touch = window.matchMedia?.('(hover: none)').matches
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!touch || reduce || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setAutoInView(e.isIntersecting), { threshold: 0.6 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  const playing = armed && (hover || autoInView)

  useEffect(() => {
    if (!playing || images.length < 2) return
    const ms = hover ? HOVER_MS : AUTO_MS
    const next = () => setIdx((i) => (i + 1) % images.length)
    // Al entrar el mouse cambia rápido la primera vez, para que se note
    const first = setTimeout(next, hover ? 200 : ms)
    const loop = setInterval(next, ms)
    return () => {
      clearTimeout(first)
      clearInterval(loop)
    }
  }, [playing, hover, images.length])

  return (
    <li className="svc-cell">
    <a
      ref={ref}
      href={href}
      className={`svc-card${playing ? ' is-playing' : ''}`}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      aria-label={`${name}: ${includes.join(', ')}. Ver proyectos`}
    >
      <span className="svc-card__media" aria-hidden="true">
        {images.map((src, i) =>
          // Solo la primera carga de entrada; el resto cuando la grilla se acerca
          i === 0 || armed ? (
            <img
              key={src}
              src={encodeURI(src)}
              alt=""
              loading="lazy"
              decoding="async"
              className={i === idx ? 'is-current' : ''}
            />
          ) : null
        )}
      </span>

      {/* Marcas de progreso: cuál proyecto se está viendo */}
      <span className="svc-card__dots" aria-hidden="true">
        {images.map((src, i) => (
          <i key={src} className={i === idx ? 'is-on' : ''} />
        ))}
      </span>

      <span className="svc-card__info" aria-hidden="true">
        <span className="svc-card__num">{pad(index + 1)}</span>
        <span className="svc-card__name">{name}</span>
        <span className="svc-card__includes">
          {includes.map((t, j) => (
            <span key={t} style={{ '--i': j }}>
              {t}
            </span>
          ))}
        </span>
      </span>
    </a>
    </li>
  )
}

export default function ServicesAccordion() {
  const sectionRef = useRef(null)
  const gridRef = useRef(null)
  // Las imágenes extra se cargan recién cuando la grilla se acerca a la pantalla
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    const el = gridRef.current
    if (!('IntersectionObserver' in window)) return setArmed(true)
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setArmed(true)
          io.disconnect()
        }
      },
      { rootMargin: '300px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /*
    Entrada fusionada con Sobre mí: mientras la sección sube, un círculo blanco
    crece desde el centro de la pantalla hasta cubrirla. Al completarse se quita
    el recorte y la sección queda blanca entera.
  */
  useEffect(() => {
    const section = sectionRef.current
    const root = document.documentElement
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    let raf = 0
    let light = false
    const update = () => {
      raf = 0
      const rect = section.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      // La sección empieza `fuse` px antes (se superpone con Sobre mí): se cuenta desde su parte real
      const fuse = -parseFloat(getComputedStyle(section).marginTop) || 0
      const top = rect.top + fuse
      // Empieza cuando la sección asoma por el 85% de la pantalla y termina al llegar arriba
      const p = easeInOut(clamp01((vh * 0.85 - top) / (vh * 0.85)))
      const cy = vh / 2 - rect.top // centro de la pantalla en coordenadas de la sección
      const r = p * (Math.hypot(vw, vh) / 2 + 40)
      section.style.clipPath = p >= 1 ? 'none' : `circle(${r.toFixed(1)}px at 50% ${cy.toFixed(1)}px)`
      // Logo negro solo si quedó sobre lo blanco
      const logo = document.querySelector('.site-nav__logo')?.getBoundingClientRect()
      const lx = logo ? logo.left + logo.width / 2 : 60
      const ly = logo ? logo.top + logo.height / 2 : 40
      const overSection = ly > rect.top && ly < rect.bottom
      const inCircle = p >= 1 || Math.hypot(lx - vw / 2, ly - vh / 2) < r - 20
      const onLight = overSection && inCircle
      if (onLight !== light) {
        light = onLight
        root.classList.toggle('nav-on-light', light)
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
      root.classList.remove('nav-on-light')
    }
  }, [])

  return (
    <section ref={sectionRef} id="servicios" className="services-acc" aria-labelledby="servicios-title">
      {/* Sin título visible: la grilla va sola, centrada en la sección.
          El h2 queda solo para lectores de pantalla y buscadores. */}
      <h2 id="servicios-title" className="visually-hidden">
        Servicios: proyectos realizados
      </h2>

      <ul ref={gridRef} className="svc-grid">
        {SERVICES.map((s, i) => (
          <ServiceCard key={s.name} service={s} index={i} armed={armed} />
        ))}
      </ul>

    </section>
  )
}
