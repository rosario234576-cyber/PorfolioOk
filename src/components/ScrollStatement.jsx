import { useEffect, useRef } from 'react'
import './ScrollStatement.css'

/*
  Frase de presentación entre la portada y Sobre mí: arranca apagada y se
  ilumina palabra por palabra a medida que se scrollea. Las palabras marcadas
  con *asteriscos* quedan en naranja.
  Sin JS (o con movimiento reducido) se ve entera desde el principio.
*/
const TEXT =
  'Cada marca tiene algo para decir. Yo me encargo de que se *vea,* se *entienda* y se *recuerde.*'

const WORDS = TEXT.split(' ').map((w) => ({
  text: w.replace(/\*/g, ''),
  accent: w.startsWith('*'),
}))

const clamp01 = (v) => Math.min(1, Math.max(0, v))

export default function ScrollStatement() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    const words = [...el.querySelectorAll('.statement__word')]
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-static')
      return
    }
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      // Empieza cuando la frase asoma por abajo (85%) y termina cuando su final
      // llega al 45% de la pantalla
      const start = vh * 0.85
      const end = vh * 0.45
      const p = clamp01((start - r.top) / (start - end + r.height))
      const n = words.length
      words.forEach((w, i) => {
        w.style.setProperty('--lit', clamp01(p * n - i).toFixed(3))
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
    <section className="statement" aria-label="Presentación">
      <p ref={ref} className="statement__text">
        {WORDS.map((w, i) => (
          <span key={i} className={`statement__word${w.accent ? ' is-accent' : ''}`}>
            {w.text}{' '}
          </span>
        ))}
      </p>
    </section>
  )
}
