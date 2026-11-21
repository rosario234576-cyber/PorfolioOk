import { useEffect, useRef } from 'react'
import './StickerBoard.css'

/*
  Stickers de IrazzTech en los bordes del caso: a medida que se baja, cada uno
  entra desde su costado y se "pega" con rebote. Después flotan apenas y se
  mueven a distinta velocidad que la página (parallax). Con el mouse encima se
  levantan y se despega la esquina. Son decorativos (aria-hidden).
  Cada sticker: tipo, costado (l / r), altura (% del caso) y giro.
*/
const S = '/media/obras/branding/irazztech/stickers'

const STICKERS = [
  { type: 'ich', side: 'r', y: 5, r: 10, speed: -0.12 },
  { type: 'pixel', side: 'l', y: 14, r: -12, speed: 0.1 },
  { type: 'round', side: 'r', y: 27, r: 6, speed: 0.14 },
  { type: 'wordmark', side: 'l', y: 39, r: -8, speed: -0.08 },
  { type: 'tag', side: 'r', y: 52, r: 12, speed: -0.1 },
  { type: 'quote', side: 'l', y: 65, r: -5, speed: 0.12 },
  { type: 'pill', side: 'r', y: 79, r: -9, speed: 0.08 },
]

function Face({ type }) {
  switch (type) {
    case 'wordmark':
      return (
        <span className="stk stk--wordmark">
          <img src={`${S}/logo-negro.png`} alt="" draggable="false" />
        </span>
      )
    case 'ich':
      return (
        <span className="stk stk--ich">
          <img src={`${S}/ich-blanco.png`} alt="" draggable="false" />
        </span>
      )
    case 'pixel':
      return (
        <span className="stk stk--pixel">
          <strong>+6000</strong>
          <span>PCs armadas</span>
        </span>
      )
    case 'round':
      return (
        <span className="stk stk--round">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <path id="stk-circle" d="M50 50 m-36 0 a36 36 0 1 1 72 0 a36 36 0 1 1 -72 0" />
            </defs>
            <text className="stk__ring">
              <textPath href="#stk-circle">TESTEADO · ARMADO · ENTREGADO ·</textPath>
            </text>
            <path d="M36 51 L46 61 L66 39" fill="none" stroke="#E10600" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )
    case 'quote':
      return (
        <span className="stk stk--quote">
          La diferencia está en <em>cómo se arma.</em>
        </span>
      )
    case 'pill':
      return <span className="stk stk--pill">Hardware · Cuidado · Precisión</span>
    case 'tag':
      return (
        <span className="stk stk--tag">
          <span className="stk__code">#IRZ-0418</span>
          <span className="stk__bars" aria-hidden="true" />
        </span>
      )
    default:
      return null
  }
}

export default function StickerBoard() {
  const railRef = useRef(null)

  useEffect(() => {
    const rail = railRef.current
    const els = [...rail.querySelectorAll('.sticker')]
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    // Entrada: cada uno se pega cuando asoma en pantalla
    let io
    if (!('IntersectionObserver' in window) || reduce) {
      els.forEach((el) => el.classList.add('is-in'))
    } else {
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('is-in')
              io.unobserve(e.target)
            }
          }),
        { rootMargin: '0px 0px -12% 0px' }
      )
      els.forEach((el) => io.observe(el))
    }
    if (reduce) return () => io?.disconnect()

    // Parallax: se corren según qué tan lejos están del centro de la pantalla
    let raf = 0
    const update = () => {
      raf = 0
      const mid = window.innerHeight / 2
      els.forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.bottom < -200 || r.top > window.innerHeight + 200) return
        const d = r.top + r.height / 2 - mid
        el.style.setProperty('--py', `${(d * Number(el.dataset.speed)).toFixed(1)}px`)
      })
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      io?.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div ref={railRef} className="sticker-rail" aria-hidden="true">
      {STICKERS.map((s, i) => (
        <span
          key={s.type}
          className={`sticker sticker--${s.side}`}
          data-speed={s.speed}
          style={{ top: `${s.y}%`, '--r': `${s.r}deg`, '--i': i }}
        >
          <span className="sticker__slap">
            <span className="sticker__float">
              <span className={`sticker__lift${s.type === 'round' ? '' : ' can-peel'}`}>
                <Face type={s.type} />
                {/* Esquina despegada (dorso del sticker) */}
                {s.type !== 'round' && <span className="sticker__peel" />}
              </span>
            </span>
          </span>
        </span>
      ))}
    </div>
  )
}
