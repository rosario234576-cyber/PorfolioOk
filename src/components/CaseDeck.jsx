import { useEffect, useRef } from 'react'
import './CaseDeck.css'

/*
  Apertura de cada marca, armada como una presentación (la usan todas las
  páginas de Proyectos, así se sienten parte de lo mismo): láminas que quedan
  fijas arriba y se apilan una sobre otra al scrollear (la de abajo se achica
  y oscurece un poco cuando la tapa la siguiente).
    1. Divisoria: "<categoría> —— 01" sobre el color de la marca.
    2. La marca / una pieza a pantalla completa.
    3. (opcional) Ficha: frase, datos y entregables.
  El color sale de --accent del contenedor.

  Props:
    index      posición (01, 02…)
    id         id del h2 con el nombre (para aria-labelledby)
    name       nombre de la marca
    category   texto chico arriba a la derecha ("Branding", "Redes sociales"…)
    kicker     [palabra liviana, palabra fuerte] del título grande
    meta       texto abajo a la derecha (año, cantidad de piezas…)
    hero       { src, bg, blur }: imagen de la lámina 2. blur = fondo con la
               misma imagen desenfocada (para piezas verticales)
    onOpenHero clic en la lámina 2
    info       { tagline, facts: [{ label, value }], chips } o null
*/
const pad = (n) => String(n).padStart(2, '0')

export default function CaseDeck({ index, id, name, category, kicker, meta, hero, onOpenHero, info }) {
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
    <div ref={ref} className={`case-deck${info ? '' : ' is-short'}`}>
      {/* 1 · Divisoria */}
      <section className="case-deck__slide case-deck__slide--divider" style={{ '--i': 0 }}>
        <div className="case-deck__inner">
          <div className="case-deck__top">
            <span>Inkk Studio — Portfolio</span>
            <span>{category}</span>
          </div>
          <div className="case-deck__divider">
            <p className="case-deck__kicker">
              <span className="case-deck__light">{kicker[0]}</span> {kicker[1]}
            </p>
            <span className="case-deck__rule" aria-hidden="true" />
            <span className="case-deck__bignum">{pad(index + 1)}</span>
          </div>
          <div className="case-deck__bottom">
            <h2 id={id} className="case-deck__brand">
              {name}
            </h2>
            <span>{meta}</span>
          </div>
        </div>
      </section>

      {/* 2 · La marca / pieza destacada */}
      <section
        className={`case-deck__slide case-deck__slide--hero${hero.blur ? ' has-blur' : ''}${hero.cover ? ' is-cover' : ''}`}
        style={{ '--i': 1, '--hero-bg': hero.bg || '#111' }}
      >
        {hero.blur && <img className="case-deck__hero-bg" src={hero.src} alt="" aria-hidden="true" loading="lazy" decoding="async" />}
        <button type="button" className="case-deck__hero" onClick={onOpenHero} aria-label={`Ver en grande: ${name}`}>
          <img src={hero.src} alt={`${name}: pieza destacada`} loading="lazy" decoding="async" />
        </button>
      </section>

      {/* 3 · Ficha (opcional) */}
      {info && (
        <section className="case-deck__slide case-deck__slide--info" style={{ '--i': 2 }}>
          <div className="case-deck__inner">
            <div className="case-deck__top">
              <span>{name}</span>
              <span>
                {pad(index + 1)} / {category}
              </span>
            </div>
            <p className="case-deck__tagline">{info.tagline}</p>
            <dl className="case-deck__facts">
              {info.facts.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
            {info.chips?.length > 0 && (
              <ul className="case-deck__chips">
                {info.chips.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
