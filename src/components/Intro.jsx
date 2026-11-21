import { useEffect, useState } from 'react'
import './Intro.css'

// Duración total en ms antes de que la intro empiece a salir
const HOLD = 2300
// Duración de la salida (debe coincidir con .intro--leaving en Intro.css)
const EXIT = 800

export default function Intro({ onDone, onLeave }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const hold = reduce ? 900 : HOLD

    document.body.style.overflow = 'hidden'
    const leave = () => {
      setLeaving(true)
      onLeave?.()
    }
    const t1 = setTimeout(leave, hold)
    const t2 = setTimeout(() => onDone?.(), hold + EXIT)

    // Click o tecla = saltar intro
    const skip = () => {
      clearTimeout(t1)
      clearTimeout(t2)
      leave()
      setTimeout(() => onDone?.(), EXIT)
    }
    window.addEventListener('pointerdown', skip, { once: true })
    window.addEventListener('keydown', skip, { once: true })

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('pointerdown', skip)
      window.removeEventListener('keydown', skip)
      document.body.style.overflow = ''
    }
  }, [onDone, onLeave])

  return (
    <div className={`intro${leaving ? ' intro--leaving' : ''}`} role="presentation">
      <div className="intro__content">
        <div className="intro__logo">
          <div className="intro__word-mask">
            <img
              className="intro__word"
              src="/media/images/inkkstudio-wordmark-white.png"
              alt="Inkkstudio"
              draggable="false"
            />
          </div>
          <img
            className="intro__cat"
            src="/media/icons/inkkstudio-cat.png"
            alt=""
            draggable="false"
          />
        </div>
      </div>
    </div>
  )
}
