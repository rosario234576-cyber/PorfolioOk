import { useEffect, useRef, useState } from 'react'
import './HeroCursors.css'

/*
  Punteros estilo "colaboración en vivo" alrededor del título, cada uno con un
  servicio. at = punto que señala, como fracción de la caja del texto del título
  (x desde la izquierda, y desde arriba); quedan un poco por fuera del texto.
  side: 'right' = etiqueta a la derecha de la flecha; 'left' = a la izquierda.
  Bien dispersos alrededor. En mobile (m) se reparten arriba y abajo del título.
*/
const CURSORS = [
  { label: 'Branding', color: '#e8677a', at: [-0.2, -0.14], side: 'left', m: { at: [0.04, -1.35], side: 'right' } },
  { label: 'Redes sociales', color: '#eb5b30', at: [-0.13, 0.64], side: 'left', m: { at: [0.06, 1.25], side: 'right' } },
  { label: 'Edición de video', color: '#d9a441', at: [-0.04, 1.12], side: 'left', m: { at: [0.38, 1.78], side: 'right' } },
  { label: 'Packaging', color: '#4fa39a', at: [1.16, -0.06], side: 'right', m: { at: [0.96, -0.95], side: 'left' } },
  { label: 'Gestión de redes', color: '#8b7cf6', at: [1.12, 0.98], side: 'right', m: { at: [0.96, 1.55], side: 'left' } },
]

// Ancho aproximado de la etiqueta (para darla vuelta si no entra en pantalla)
const labelWidth = (text) => text.length * 7.2 + 34

// Caja del texto del título (unión de la tinta de cada renglón), relativa al hero
function measureTitle(layer) {
  const hero = layer.parentElement
  const h1 = hero?.querySelector('.hero-title__h1')
  if (!h1) return null
  const base = layer.getBoundingClientRect()
  const range = document.createRange()
  const r = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity }
  h1.querySelectorAll('.hero-title__line').forEach((line) => {
    range.selectNodeContents(line)
    const b = range.getBoundingClientRect()
    r.left = Math.min(r.left, b.left)
    r.right = Math.max(r.right, b.right)
    r.top = Math.min(r.top, b.top)
    r.bottom = Math.max(r.bottom, b.bottom)
  })
  return {
    x: r.left - base.left,
    y: r.top - base.top,
    w: r.right - r.left,
    h: r.bottom - r.top,
    mobile: base.width < 700,
    layerW: base.width,
  }
}

// show: aparecen cuando terminó la animación del título
export default function HeroCursors({ show = false }) {
  const layerRef = useRef(null)
  const [box, setBox] = useState(null)

  // Medir el título al aparecer y cada vez que cambia el tamaño
  useEffect(() => {
    if (!show) return
    const layer = layerRef.current
    const update = () => setBox(measureTitle(layer))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(layer)
    return () => ro.disconnect()
  }, [show])

  // Posición final de cada puntero (fija)
  const list = box
    ? CURSORS.filter((c) => !box.mobile || c.m).map((c) => {
        const spec = box.mobile ? c.m : c
        const x = box.x + box.w * spec.at[0]
        const y = box.y + box.h * spec.at[1]
        let side = spec.side
        const need = labelWidth(c.label) + 16
        if (side === 'right' && x + need > box.layerW) side = 'left'
        else if (side === 'left' && x - need < 0) side = 'right'
        return { ...c, x, y, side }
      })
    : []

  return (
    <div ref={layerRef} className="hero-cursors" aria-hidden="true">
      {list.map((c, i) => (
        <div
          key={c.label}
          className={`hero-cursor hero-cursor--${c.side}`}
          style={{
            left: `${c.x}px`,
            top: `${c.y}px`,
            '--cursor-color': c.color,
            '--cursor-delay': `${150 + i * 160}ms`,
          }}
        >
          <div className="hero-cursor__body">
            <svg className="hero-cursor__arrow" viewBox="0 0 16 16" width="16" height="16">
              <path d="M1.5 1.5 L14 6.2 L8.2 8.2 L6.2 14 Z" />
            </svg>
            <span className="hero-cursor__label">{c.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
