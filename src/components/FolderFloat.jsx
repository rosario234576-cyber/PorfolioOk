import { useEffect, useId, useRef, useState } from 'react'
import './FolderFloat.css'

/*
  Carpeta cuyas notas salen disparadas a una nube flotante al abrirse
  (hover con mouse, toque o Enter/Espacio con teclado).

  Física con matter-js (se carga recién cuando hace falta):
  - cada nota es un cuerpo unido por un resorte a un punto de anclaje;
  - cerrada, los anclajes están dentro de la carpeta; abierta, en un arco arriba;
  - las notas chocan entre sí, así que se acomodan solas y flotan levemente;
  - el motor solo corre mientras algo se mueve.
*/

let matterPromise = null
const loadMatter = () => (matterPromise ??= import('matter-js').then((m) => m.default ?? m))

// Tamaños: normal (sección) y compacto (flotando en la portada)
const SIZES = {
  md: { noteW: 118, noteH: 40, ry: 120, rxMax: 150, closedY: 26 },
  sm: { noteW: 100, noteH: 32, ry: 92, rxMax: 120, closedY: 18 },
}

export default function FolderFloat({ title, notes, color = '#eb5b30', back = '#cc4224', size = 'md', className = '' }) {
  const { noteW: NOTE_W, noteH: NOTE_H, ry: RY, rxMax: RX_MAX, closedY: CLOSED_Y } = SIZES[size] ?? SIZES.md
  const rootRef = useRef(null)
  const noteRefs = useRef([])
  const simRef = useRef(null)
  const [open, setOpen] = useState(false)
  const openRef = useRef(false)
  const listId = useId()

  // Puntos de anclaje (origen: centro de la boca de la carpeta)
  const anchorsFor = (isOpen, width) => {
    const n = notes.length
    if (!isOpen) {
      return notes.map((_, i) => ({ x: (i - (n - 1) / 2) * 12, y: CLOSED_Y, angle: (i - (n - 1) / 2) * 0.05 }))
    }
    // Arco sobre la carpeta: el ancho se adapta a la celda
    const rx = Math.max(70, Math.min(width / 2 - NOTE_W / 2 - 6, RX_MAX))
    const ry = RY
    return notes.map((_, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1)
      const a = Math.PI * (1.08 - 1.16 * t) // de izquierda a derecha, por arriba
      const lift = i % 2 ? 0 : RY * 0.22 // escalonadas: no quedan en fila
      return {
        x: Math.cos(a) * rx,
        y: -Math.sin(a) * ry - RY * 0.25 - lift,
        angle: (i % 2 ? 1 : -1) * (0.05 + 0.04 * (i % 3)),
      }
    })
  }

  // Coloca las notas en su estado cerrado sin física (primer render y movimiento reducido)
  const placeStatic = (isOpen) => {
    const width = rootRef.current?.offsetWidth || 300
    anchorsFor(isOpen, width).forEach((p, i) => {
      const el = noteRefs.current[i]
      if (el) el.style.transform = `translate(${p.x - NOTE_W / 2}px, ${p.y - NOTE_H / 2}px) rotate(${p.angle}rad)`
    })
  }

  useEffect(() => {
    placeStatic(false)
    return () => simRef.current?.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggle = async (next) => {
    if (openRef.current === next) return
    openRef.current = next
    setOpen(next)

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      placeStatic(next)
      return
    }
    const Matter = await loadMatter()
    if (!simRef.current) simRef.current = createSim(Matter)
    simRef.current.setOpen(openRef.current)
  }

  // Simulación de una carpeta
  const createSim = (Matter) => {
    const { Engine, Bodies, Body, Composite, Constraint } = Matter
    const engine = Engine.create({ gravity: { x: 0, y: 0 } })
    const width = rootRef.current.offsetWidth
    let anchors = anchorsFor(false, width)
    const start = anchors

    const bodies = notes.map((_, i) =>
      Bodies.rectangle(start[i].x, start[i].y, NOTE_W, NOTE_H, {
        frictionAir: 0.07,
        restitution: 0.2,
        chamfer: { radius: 6 },
        angle: start[i].angle,
      })
    )
    const springs = bodies.map((b, i) =>
      Constraint.create({ pointA: { x: start[i].x, y: start[i].y }, bodyB: b, stiffness: 0.012, damping: 0.08, length: 0 })
    )
    Composite.add(engine.world, [...bodies, ...springs])

    let raf = 0
    let calm = 0
    let isOpen = false

    const setCollide = (on) => bodies.forEach((b) => (b.collisionFilter.mask = on ? 0xffffffff : 0))

    const step = (now) => {
      const t = now / 1000
      bodies.forEach((b, i) => {
        // Flotación suave del anclaje mientras está abierta
        const a = anchors[i]
        const bob = isOpen ? Math.sin(t * 1.4 + i * 1.7) * 4 : 0
        springs[i].pointA.x = a.x
        springs[i].pointA.y = a.y + bob
        // Resorte de giro hacia su inclinación
        Body.setAngularVelocity(b, b.angularVelocity * 0.88 + (a.angle - b.angle) * 0.02)
        // Tope de velocidad: salen con fuerza pero sin descontrol
        const v = b.velocity
        const sp = Math.hypot(v.x, v.y)
        if (sp > 18) Body.setVelocity(b, { x: (v.x / sp) * 18, y: (v.y / sp) * 18 })
      })
      Engine.update(engine, 1000 / 60)

      let moving = false
      bodies.forEach((b, i) => {
        const el = noteRefs.current[i]
        if (el) {
          el.style.transform = `translate(${(b.position.x - NOTE_W / 2).toFixed(1)}px, ${(b.position.y - NOTE_H / 2).toFixed(1)}px) rotate(${b.angle.toFixed(3)}rad)`
        }
        if (b.speed > 0.06 || Math.abs(b.angularSpeed) > 0.002) moving = true
      })

      // Cerrada y quieta: el motor se detiene
      calm = moving ? 0 : calm + 1
      if (!isOpen && calm > 20) {
        raf = 0
        return
      }
      raf = requestAnimationFrame(step)
    }

    return {
      setOpen(next) {
        isOpen = next
        anchors = anchorsFor(next, rootRef.current.offsetWidth)
        // Al cerrar no chocan, para que entren juntas en la carpeta
        setCollide(next)
        if (next) {
          // Impulso inicial: saltan hacia arriba desde la carpeta
          bodies.forEach((b, i) => {
            const dx = anchors[i].x - b.position.x
            Body.setVelocity(b, { x: dx * 0.06, y: -10 - (i % 3) * 2 })
            Body.setAngularVelocity(b, (i % 2 ? 1 : -1) * 0.08)
          })
        }
        calm = 0
        if (!raf) raf = requestAnimationFrame(step)
      },
      destroy() {
        cancelAnimationFrame(raf)
        Engine.clear(engine)
      },
    }
  }

  // Mouse: abre al pasar; táctil: abre/cierra al tocar
  const onPointerEnter = (e) => e.pointerType === 'mouse' && toggle(true)
  const onPointerLeave = (e) => e.pointerType === 'mouse' && toggle(false)
  const lastPointer = useRef('')
  const onClick = () => {
    // Con mouse ya se abrió por hover; el clic no la cierra. Toque o teclado: alterna
    if (lastPointer.current === 'mouse') return
    toggle(!openRef.current)
  }

  return (
    <div
      ref={rootRef}
      className={`folder-float folder-float--${size}${open ? ' is-open' : ''} ${className}`.trim()}
      style={{ '--folder': color, '--folder-back': back }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={(e) => (lastPointer.current = e.pointerType)}
      onKeyDown={(e) => {
        lastPointer.current = ''
        if (e.key === 'Escape') toggle(false)
      }}
      onClick={onClick}
    >
      <div className="folder-float__stage">
        <div className="folder-float__back" aria-hidden="true" />
        <ul id={listId} className="folder-float__notes" aria-label={`Incluye: ${title}`}>
          {notes.map((note, i) => (
            <li key={note} ref={(el) => (noteRefs.current[i] = el)} className="folder-float__note">
              {note}
            </li>
          ))}
        </ul>
        <div className="folder-float__front" aria-hidden="true" />
      </div>
      <button
        type="button"
        className="folder-float__label"
        aria-expanded={open}
        aria-controls={listId}
      >
        {title}
      </button>
    </div>
  )
}
