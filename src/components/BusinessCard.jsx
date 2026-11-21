import { useEffect, useRef, useState } from 'react'
import './BusinessCard.css'

/*
  Tarjeta de presentación de Inkk Studio (frente y dorso reales).
  - Al scrollear la tarjeta entra girando y se da vuelta sola (frente → dorso).
  - Con el mouse encima se inclina siguiendo el puntero, con un brillo encima.
  - Un clic (o Enter) la da vuelta a mano; desde ahí manda la persona.
*/
const clamp01 = (v) => Math.min(1, Math.max(0, v))

export default function BusinessCard() {
  const sectionRef = useRef(null)
  const cardRef = useRef(null)
  // null = la maneja el scroll; true/false = la dio vuelta la persona
  const [manual, setManual] = useState(null)
  const manualRef = useRef(manual)
  manualRef.current = manual

  // Giro con el scroll: 0° al entrar, 180° (dorso) al llegar al centro
  useEffect(() => {
    const section = sectionRef.current
    const card = cardRef.current
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const update = () => {
      raf = 0
      const r = section.getBoundingClientRect()
      const vh = window.innerHeight
      const p = clamp01((vh * 0.9 - r.top) / (vh * 0.9 + r.height * 0.1))
      const m = manualRef.current
      const flip = m === null ? (reduce ? 0 : clamp01((p - 0.35) / 0.35) * 180) : m ? 180 : 0
      card.style.setProperty('--flip', `${flip.toFixed(1)}deg`)
      // Entrada: sube y se endereza
      const e = reduce ? 1 : clamp01(p / 0.35)
      card.style.setProperty('--enter', e.toFixed(3))
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
  }, [manual])

  // Inclinación con el mouse
  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    const s = cardRef.current.style
    s.setProperty('--rx', `${(-y * 14).toFixed(2)}deg`)
    s.setProperty('--ry', `${(x * 18).toFixed(2)}deg`)
    s.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`)
    s.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`)
  }
  const onLeave = () => {
    const s = cardRef.current.style
    s.setProperty('--rx', '0deg')
    s.setProperty('--ry', '0deg')
  }

  const toggle = () => {
    const showingBack = manual === null ? parseFloat(cardRef.current.style.getPropertyValue('--flip')) > 90 : manual
    setManual(!showingBack)
  }

  return (
    <section ref={sectionRef} className="bizcard" aria-labelledby="bizcard-title">
      <div className="bizcard__text">
        <p className="bizcard__eyebrow">Tarjeta de presentación</p>
        <h2 id="bizcard-title" className="bizcard__title">
          Creatividad + actitud <span>= impacto</span>
        </h2>
        <p className="bizcard__lead">Tocá la tarjeta para darla vuelta.</p>
      </div>

      <div className="bizcard__stage" onPointerMove={onMove} onPointerLeave={onLeave}>
        <button
          ref={cardRef}
          type="button"
          className="bizcard__card"
          onClick={toggle}
          aria-label="Dar vuelta la tarjeta de presentación"
        >
          <span className="bizcard__face bizcard__face--front">
            <img src="/media/tarjeta/tarjeta-frente.jpg" alt="Tarjeta de Inkk Studio: Creatividad + Actitud = Impacto" width="1063" height="591" loading="lazy" decoding="async" />
            <span className="bizcard__shine" aria-hidden="true" />
          </span>
          <span className="bizcard__face bizcard__face--back">
            <img
              src="/media/tarjeta/tarjeta-dorso.jpg"
              alt="Dorso: código QR a mis proyectos, servicios, Instagram @inkkstudios_ e inkkstudio.art"
              width="1063"
              height="591"
              loading="lazy"
              decoding="async"
            />
            <span className="bizcard__shine" aria-hidden="true" />
          </span>
        </button>
        <span className="bizcard__shadow" aria-hidden="true" />
      </div>
    </section>
  )
}
