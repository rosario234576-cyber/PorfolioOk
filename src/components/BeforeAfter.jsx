import { useEffect, useRef, useState } from 'react'
import './BeforeAfter.css'

/*
  Comparador antes / después: las dos imágenes encimadas y una barra que se
  arrastra. A la izquierda de la barra se ve el "antes", a la derecha el
  "después". Usa un <input type="range"> invisible encima: así funciona con
  mouse, dedo y teclado (flechas) sin código extra.
  Al aparecer en pantalla la barra se mueve sola una vez, para que se note
  que se puede arrastrar.
*/
export default function BeforeAfter({ before, after, beforeLabel = 'Antes', afterLabel = 'Ahora', alt = '' }) {
  const [pos, setPos] = useState(50)
  const ref = useRef(null)
  // Si la persona la toca durante la pista, la pista se corta y manda ella
  const touched = useRef(false)

  // Pista: un vaivén suave la primera vez que se ve (si nadie la tocó)
  useEffect(() => {
    const el = ref.current
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) return
    let raf = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        const dur = 1600
        const tick = (now) => {
          if (touched.current) return
          const t = Math.min(1, (now - t0) / dur)
          // 50 → 30 → 70 → 50, con freno al final
          setPos(50 - Math.sin(t * Math.PI * 2) * 20 * (1 - t * 0.35))
          if (t < 1) raf = requestAnimationFrame(tick)
          else setPos(50)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.6 }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={ref} className="before-after" style={{ '--pos': `${pos}%` }}>
      {/* Después (abajo, completo) */}
      <img className="before-after__img" src={after} alt={`${alt} — ${afterLabel}`} loading="lazy" decoding="async" />
      {/* Antes (arriba, recortado hasta la barra) */}
      <img
        className="before-after__img before-after__img--before"
        src={before}
        alt={`${alt} — ${beforeLabel}`}
        loading="lazy"
        decoding="async"
      />

      <span className="before-after__tag before-after__tag--before" aria-hidden="true">
        {beforeLabel}
      </span>
      <span className="before-after__tag before-after__tag--after" aria-hidden="true">
        {afterLabel}
      </span>

      {/* Barra y manija */}
      <span className="before-after__bar" aria-hidden="true">
        <span className="before-after__knob">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>

      <input
        className="before-after__range"
        type="range"
        min="0"
        max="100"
        step="0.1"
        value={pos}
        onChange={(e) => {
          touched.current = true
          setPos(Number(e.target.value))
        }}
        onPointerDown={() => (touched.current = true)}
        onKeyDown={() => (touched.current = true)}
        aria-label={`Comparar ${beforeLabel.toLowerCase()} y ${afterLabel.toLowerCase()}`}
      />
    </div>
  )
}
