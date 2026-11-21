import { useEffect, useRef } from 'react'
import './ProjectsStack.css'

/*
  Proyectos como láminas que caen sobre una mesa.
  - Al llegar desde "Sobre mí", el fondo blanco sube con el scroll (borde curvo).
  - Cada proyecto es una lámina fija (sticky): entra levemente girada y se
    endereza al apoyarse; la de abajo se achica y se sombrea.
  - Ficha a la izquierda, collage de tres piezas a la derecha (en celular, arriba/abajo).

  Imágenes optimizadas en public/media/proyectos/<slug>/ (1 = principal, 2 y 3 = detalles).
  TODO: revisar categorías y elegir las piezas definitivas de cada proyecto.
*/
const PROJECTS = [
  { slug: 'electronic-games', name: 'Electronic Games', category: 'Contenido para redes', tags: ['Redes sociales', 'Diseño gráfico'] },
  { slug: 'maximus-gaming', name: 'Maximus Gaming', category: 'Fotografía de producto', tags: ['Fotografía', 'Edición'] },
  { slug: 'zona-del-verde', name: 'Zona del Verde', category: 'Contenido para redes', tags: ['Redes sociales', 'Diseño gráfico'] },
  { slug: 'arvel-custom', name: 'Arvel Custom', category: 'Fotografía de producto', tags: ['Fotografía', 'Edición'] },
  { slug: 'vitae-charm', name: 'Vitae Charm', category: 'Contenido para redes', tags: ['Redes sociales', 'Diseño gráfico'] },
]

const N = PROJECTS.length
const pad = (n) => String(n).padStart(2, '0')
const img = (slug, n) => `/media/proyectos/${slug}/${n}.jpg`
const clamp01 = (v) => Math.min(1, Math.max(0, v))
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export default function ProjectsStack() {
  const sectionRef = useRef(null)
  const archRef = useRef(null)
  const cardRefs = useRef([])

  useEffect(() => {
    const section = sectionRef.current
    const arch = archRef.current
    const cards = cardRefs.current
    const root = document.documentElement
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let light = false

    const update = () => {
      raf = 0
      const vh = window.innerHeight
      const rect = section.getBoundingClientRect()

      // Blanco que sube con el scroll, con el borde superior curvo
      const white = clamp01((1 - rect.top / vh) / 0.95)
      const archH = vh * 0.3
      arch.style.height = `${(vh + archH).toFixed(0)}px`
      arch.style.borderRadius = `50% 50% 0 0 / ${archH.toFixed(0)}px ${archH.toFixed(0)}px 0 0`
      arch.style.transform = `translate3d(0, ${(vh - white * (vh + archH)).toFixed(1)}px, 0)`
      const onLight = white > 0.97
      if (onLight !== light) {
        light = onLight
        root.classList.toggle('nav-on-light', light)
      }

      if (reduce) return

      // Láminas: cuánto entró cada una y cuántas tiene encima
      const boxes = cards.map((c) => c.getBoundingClientRect())
      const stick = cards.map((c) => parseFloat(getComputedStyle(c).top) || 0)
      const landed = boxes.map((b, i) => clamp01(1 - (b.top - stick[i]) / (vh * 0.6)))

      cards.forEach((card, i) => {
        const inner = card.firstElementChild
        // Encima: suma de lo que entraron las siguientes
        let above = 0
        for (let j = i + 1; j < N; j++) above += landed[j]
        const drop = easeInOut(landed[i])
        const tilt = (i % 2 ? 1 : -1) * 3.5 * (1 - drop)
        const lift = (1 - drop) * 40
        const scale = 1 - Math.min(above, 3) * 0.045
        inner.style.transform = `translate3d(0, ${lift.toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg) scale(${scale.toFixed(4)})`
        inner.style.setProperty('--dim', Math.min(above * 0.14, 0.36).toFixed(3))
      })
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
    <section ref={sectionRef} id="proyectos" className="stack-section" aria-labelledby="proyectos-title">
      {/* Capa fija detrás del contenido: blanco que sube con el scroll */}
      <div ref={archRef} className="stack-arch" aria-hidden="true" />

      <header className="stack-head">
        <p className="stack-head__eyebrow">Proyectos</p>
        <h2 id="proyectos-title" className="stack-head__title">
          Trabajos seleccionados
        </h2>
      </header>

      <div className="stack-list">
        {PROJECTS.map((p, i) => (
          <article
            key={p.slug}
            ref={(el) => (cardRefs.current[i] = el)}
            className="stack-card"
            style={{ '--i': i }}
            aria-label={p.name}
          >
            <div className="stack-card__inner">
              <div className="stack-card__info">
                <span className="stack-card__num">
                  {pad(i + 1)}
                  <small> / {pad(N)}</small>
                </span>
                <div>
                  <p className="stack-card__cat">{p.category}</p>
                  <h3 className="stack-card__title">{p.name}</h3>
                  <ul className="stack-card__tags">
                    {p.tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="stack-card__media">
                <img
                  className="stack-card__main"
                  src={img(p.slug, 1)}
                  alt={`${p.name} — ${p.category}`}
                  loading="lazy"
                  decoding="async"
                />
                <img className="stack-card__detail" src={img(p.slug, 2)} alt="" loading="lazy" decoding="async" />
                <img className="stack-card__detail" src={img(p.slug, 3)} alt="" loading="lazy" decoding="async" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
