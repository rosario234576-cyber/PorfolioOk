import { useEffect, useRef } from 'react'
import './CaseDeck.css'

/*
  Apertura de cada caso de Branding, armada como una presentación:
  tres láminas que quedan fijas arriba y se apilan una sobre otra al scrollear
  (la de abajo se achica y oscurece un poco cuando la tapa la siguiente).
    1. Divisoria: "Identidad visual —— 01" sobre el color de la marca.
    2. La marca a pantalla completa.
    3. Ficha: proyecto, cliente, rubro, año y entregables.
  Inspirado en los portfolios tipo deck (Behance).
*/
const pad = (n) => String(n).padStart(2, '0')

export default function CaseDeck({ brand: b, index, onOpenHero }) {
  const ref = useRef(null)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const slides = [...ref.current.querySelectorAll('.case-deck__slide')]
    let raf = 0
    const update = () => {
      raf = 0
      slides.forEach((s, i) => {
        const next = slides[i + 1]
        if (!next) return
        const a = s.getBoundingClientRect()
        const n = next.getBoundingClientRect()
        // 0 = la siguiente todavía no llega, 1 = la tapa por completo
        const p = Math.min(1, Math.max(0, 1 - (n.top - a.top) / a.height))
        s.style.setProperty('--cover', p.toFixed(3))
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
    }
  }, [])

  return (
    <div ref={ref} className="case-deck">
      {/* 1 · Divisoria */}
      <section className="case-deck__slide case-deck__slide--divider" style={{ '--i': 0 }}>
        <div className="case-deck__inner">
          <div className="case-deck__top">
            <span>Inkk Studio — Portfolio</span>
            <span>Branding</span>
          </div>
          <div className="case-deck__divider">
            <p className="case-deck__kicker">
              <span className="case-deck__light">Identidad</span> visual
            </p>
            <span className="case-deck__rule" aria-hidden="true" />
            <span className="case-deck__bignum">{pad(index + 1)}</span>
          </div>
          <div className="case-deck__bottom">
            <h2 id={`${b.slug}-name`} className="case-deck__brand">
              {b.name}
            </h2>
            <span>{b.year}</span>
          </div>
        </div>
      </section>

      {/* 2 · La marca */}
      <section className="case-deck__slide case-deck__slide--hero" style={{ '--i': 1, '--hero-bg': b.hero.bg }}>
        <button type="button" className="case-deck__hero" onClick={onOpenHero} aria-label={`Ver en grande: logo de ${b.name}`}>
          <img src={b.hero.src} alt={`Logo de ${b.name}`} loading="lazy" decoding="async" />
        </button>
      </section>

      {/* 3 · Ficha del proyecto */}
      <section className="case-deck__slide case-deck__slide--info" style={{ '--i': 2 }}>
        <div className="case-deck__inner">
          <div className="case-deck__top">
            <span>{b.name}</span>
            <span>{pad(index + 1)} / Branding</span>
          </div>
          <p className="case-deck__tagline">{b.tagline}</p>
          <dl className="case-deck__facts">
            <div>
              <dt>Proyecto</dt>
              <dd>Identidad visual</dd>
            </div>
            <div>
              <dt>Cliente</dt>
              <dd>{b.name}</dd>
            </div>
            <div>
              <dt>Rubro</dt>
              <dd>{b.sector}</dd>
            </div>
            <div>
              <dt>Año</dt>
              <dd>{b.year}</dd>
            </div>
          </dl>
          <ul className="case-deck__chips">
            {b.deliverables.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
