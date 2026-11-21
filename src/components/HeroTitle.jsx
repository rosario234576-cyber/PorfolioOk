import { useEffect, useRef } from 'react'
// Bricolage Grotesque variable (peso + tamaño óptico): ExtraBold en tamaño display
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import './HeroTitle.css'

const LINES = ['Portfolio', 'Creativo']

// Letras con curva sobre las que se dibuja un círculo guía: [renglón, índice]
const CIRCLES = [
  [0, 1], // pOrtfolio
  [0, 8], // portfoliO
  [1, 0], // Creativo
  [1, 7], // creativO
]
// Letras con asta vertical: guía en el centro del asta (la I de cada renglón)
const STEMS = [
  [0, 7],
  [1, 5],
]

// Coreografía (ms). Total ≈ 1,6 s (antes 2,45 s: se aceleró la entrada)
const T = {
  appear: 100, // el cursor aparece
  click: 130, // clic breve
  clickDur: 130,
  dragStart: 250,
  dragEnd: 800, // suelta abajo a la derecha
  releaseDur: 160,
  fill1: 850, // PORTFOLIO se rellena
  fill2: 950, // CREATIVO se rellena
  fillDur: 300,
  fadeStart: 1300, // guías, marco y cursor se desvanecen
  end: 1600,
}

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2)
const lerp = (a, b, t) => a + (b - a) * t
const phase = (t, start, dur) => clamp01((t - start) / dur)

const SVG_NS = 'http://www.w3.org/2000/svg'
// Borde derecho del gatito respecto del centro de su O (em): 0.44 de medio ancho + 0.06 de separación
const CAT_RIGHT = 0.5

/**
 * Mide el título final (renglones, línea base, altura de mayúsculas y la
 * tinta de cada letra) en coordenadas relativas al contenedor.
 */
function measureTitle(wrap, deco) {
  const wr = wrap.getBoundingClientRect()
  const lines = [...deco.querySelectorAll('.hero-title__line')]
  const cs = getComputedStyle(lines[0])
  const fs = parseFloat(cs.fontSize)

  // Se mide a 200px (el canvas usa así el corte display opsz 96, igual que el H1)
  // y se escala al tamaño real: la tinta escala lineal con el tamaño.
  const REF = 200
  const k = fs / REF
  const ctx = document.createElement('canvas').getContext('2d')
  ctx.font = `${cs.fontWeight} ${REF}px ${cs.fontFamily}`
  const capH = ctx.measureText('H').actualBoundingBoxAscent * k

  const range = document.createRange()
  const rows = lines.map((line) => {
    const text = line.firstChild
    const baseline = line.querySelector('.hero-title__probe').getBoundingClientRect().bottom - wr.top
    const top = line.getBoundingClientRect().top - wr.top
    const chars = [...text.textContent].map((raw, i) => {
      range.setStart(text, i)
      range.setEnd(text, i + 1)
      const origin = range.getBoundingClientRect().left - wr.left
      const m = ctx.measureText(raw.toUpperCase())
      return {
        left: origin - m.actualBoundingBoxLeft * k,
        right: origin + m.actualBoundingBoxRight * k,
        top: baseline - m.actualBoundingBoxAscent * k,
        bottom: baseline + m.actualBoundingBoxDescent * k,
      }
    })
    return {
      top,
      baseline,
      capline: baseline - capH,
      left: chars[0].left,
      right: chars[chars.length - 1].right,
      chars,
    }
  })

  const padX = fs * 0.12
  const padY = fs * 0.12
  const left = Math.min(...rows.map((r) => r.left)) - padX
  let right = Math.max(...rows.map((r) => r.right)) + padX
  // El gatito de la última O sobresale: el marco también lo envuelve
  // (centro de la O + CAT_RIGHT em, ver .hero-title__cat en HeroTitle.css)
  const o = wrap.querySelector('.hero-title__h1 .hero-title__o')
  if (o) {
    const r = o.getBoundingClientRect()
    right = Math.max(right, r.left + r.width / 2 - wr.left + fs * CAT_RIGHT + padX * 0.5)
  }
  const top = rows[0].capline - padY
  const bottom = rows[rows.length - 1].baseline + padY

  return {
    fs,
    w: wr.width,
    h: wr.height,
    rows,
    frame: { x: left, y: top, w: right - left, h: bottom - top },
  }
}

/** Dibuja la grilla construida para la tipografía. */
function drawGuides(svg, g) {
  svg.replaceChildren()
  const { frame: f, rows } = g
  const add = (tag, attrs) => {
    const el = document.createElementNS(SVG_NS, tag)
    for (const k in attrs) el.setAttribute(k, attrs[k])
    svg.appendChild(el)
    return el
  }
  const hLine = (y) => add('line', { x1: f.x, x2: f.x + f.w, y1: y, y2: y })
  const vLine = (x) => add('line', { x1: x, x2: x, y1: f.y, y2: f.y + f.h })

  rows.forEach((r) => {
    hLine(r.capline)
    hLine(r.baseline)
    vLine(r.left)
    vLine(r.right)
  })
  STEMS.forEach(([ri, ci]) => {
    const c = rows[ri].chars[ci]
    vLine((c.left + c.right) / 2)
  })
  vLine(f.x + f.w / 2).setAttribute('class', 'is-axis')

  CIRCLES.forEach(([ri, ci]) => {
    const c = rows[ri].chars[ci]
    const r = (c.bottom - c.top) / 2
    const cy = (c.top + c.bottom) / 2
    // O: centrada en su tinta. C: el círculo sigue la curva izquierda.
    const cx = ci === 0 ? c.left + r : (c.left + c.right) / 2
    add('circle', { cx, cy, r })
    const s = g.fs * 0.03
    add('line', { x1: cx - s, x2: cx + s, y1: cy, y2: cy, class: 'is-mark' })
    add('line', { x1: cx, x2: cx, y1: cy - s, y2: cy + s, class: 'is-mark' })
  })
}

// onDone: se llama una vez cuando el título queda en su estado final
// animate = false: el título se muestra directo en su estado final (sin secuencia de entrada)
export default function HeroTitle({ start = false, onDone, animate = true }) {
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const rootRef = useRef(null)
  const h1Ref = useRef(null)
  const decoRef = useRef(null)
  const maskRef = useRef(null)
  const guidesRef = useRef(null)
  const frameRef = useRef(null)
  const anchorRef = useRef(null)
  const ringRef = useRef(null)
  const handlesRef = useRef(null)
  const cursorRef = useRef(null)
  const fxRef = useRef(null)
  const playedRef = useRef(false)

  // Marca el estado inicial: con JS, el título espera oculto a que arranque la secuencia
  useEffect(() => {
    const root = rootRef.current
    if (!animate) {
      onDoneRef.current?.()
      return
    }
    if (!root.dataset.state) root.dataset.state = 'pending'
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      root.dataset.state = 'done'
      onDoneRef.current?.()
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!animate || !start || playedRef.current || root.dataset.state === 'done') return

    let raf = 0
    let timer = 0
    let io = null
    let ro = null
    let g = null
    let t0 = 0
    let cancelled = false
    const lines = [...h1Ref.current.querySelectorAll('.hero-title__line')]

    const remeasure = () => {
      g = measureTitle(root, decoRef.current)
      drawGuides(guidesRef.current, g)
    }

    const setClip = (el, x0, y0, x1, y1) => {
      el.style.clipPath = `polygon(${x0}px ${y0}px, ${x1}px ${y0}px, ${x1}px ${y1}px, ${x0}px ${y1}px)`
    }

    const render = (t) => {
      const { frame: f, rows, fs } = g

      // 1. Aparición y clic
      const a = phase(t, 0, T.appear)
      const click = phase(t, T.click, T.clickDur)
      const press = click > 0 && click < 1 ? Math.sin(Math.PI * click) : 0

      // 2. Arrastre: un único progreso para cursor, esquina y máscara
      const p = easeInOutCubic(phase(t, T.dragStart, T.dragEnd - T.dragStart))
      const cx = f.x + f.w * p
      const cy = f.y + f.h * p

      // 4. Soltar
      const rel = phase(t, T.dragEnd, T.releaseDur)
      const relPress = rel > 0 && rel < 1 ? Math.sin(Math.PI * rel) : 0

      const scale = (0.6 + 0.4 * easeOutBack(a)) * (1 - 0.16 * press) * (1 - 0.1 * relPress)
      const cur = cursorRef.current
      cur.style.opacity = a
      cur.style.transform = `translate(${cx}px, ${cy}px) scale(${scale})`

      // Punto de anclaje y onda del clic
      const anchorOn = t >= T.click + T.clickDur * 0.5
      anchorRef.current.setAttribute('cx', f.x)
      anchorRef.current.setAttribute('cy', f.y)
      anchorRef.current.style.opacity = anchorOn && rel < 1 ? 1 : 0
      const ring = phase(t, T.click + 40, 420)
      ringRef.current.setAttribute('cx', f.x)
      ringRef.current.setAttribute('cy', f.y)
      ringRef.current.setAttribute('r', 4 + fs * 0.12 * easeOutCubic(ring))
      ringRef.current.style.opacity = ring > 0 && ring < 1 ? 1 - ring : 0

      // Marco punteado: esquina superior izquierda fija, inferior derecha en la punta del cursor
      const fr = frameRef.current
      fr.setAttribute('x', f.x)
      fr.setAttribute('y', f.y)
      fr.setAttribute('width', Math.max(0, cx - f.x))
      fr.setAttribute('height', Math.max(0, cy - f.y))
      fr.style.opacity = p > 0 ? 1 : 0

      // 3. Máscara: revela guías y contornos que el recuadro alcanza
      setClip(maskRef.current, f.x, f.y, cx, cy)

      // Tiradores
      const hs = handlesRef.current.children
      const hp = easeOutBack(rel)
      const pts = [
        [0, 0], [0.5, 0], [1, 0],
        [0, 0.5], [1, 0.5],
        [0, 1], [0.5, 1], [1, 1],
      ]
      const size = Math.max(0, Math.max(6, Math.min(10, fs * 0.07)) * hp)
      for (let i = 0; i < hs.length; i++) {
        const hx = f.x + f.w * pts[i][0]
        const hy = f.y + f.h * pts[i][1]
        hs[i].setAttribute('x', hx - size / 2)
        hs[i].setAttribute('y', hy - size / 2)
        hs[i].setAttribute('width', size)
        hs[i].setAttribute('height', size)
        hs[i].style.opacity = rel > 0 ? 1 : 0
      }

      // Relleno de arriba abajo: PORTFOLIO y enseguida CREATIVO
      ;[T.fill1, T.fill2].forEach((fillStart, i) => {
        const k = easeInOutCubic(phase(t, fillStart, T.fillDur))
        const r = rows[i]
        const o = fs * 0.05
        const yEnd = lerp(r.capline - o, r.baseline + o, k) - r.top
        if (k >= 1) {
          lines[i].style.clipPath = 'none'
          // CREATIVO completo: el gatito hace su pop
          if (i === 1) root.classList.add('is-cat-in')
        }
        else setClip(lines[i], -9999, -9999, 99999, yEnd)
      })

      // 5. Desvanecer la construcción
      const fade = easeInOutCubic(phase(t, T.fadeStart, T.end - T.fadeStart))
      fxRef.current.style.opacity = 1 - fade
    }

    const tick = (now) => {
      if (cancelled) return
      const t = now - t0
      render(Math.min(t, T.end))
      if (t < T.end) raf = requestAnimationFrame(tick)
      else finish()
    }

    const finish = () => {
      root.classList.add('is-cat-in')
      onDoneRef.current?.()
      root.dataset.state = 'done'
      lines.forEach((l) => (l.style.clipPath = ''))
      ro?.disconnect()
    }

    const play = () => {
      playedRef.current = true
      remeasure()
      root.dataset.state = 'play'
      // Al cambiar el tamaño se vuelve a medir; el progreso sigue siendo el mismo
      ro = new ResizeObserver(() => {
        if (root.dataset.state !== 'play') return
        remeasure()
        render(Math.min(performance.now() - t0, T.end))
      })
      ro.observe(root)
      t0 = performance.now()
      raf = requestAnimationFrame(tick)
    }

    // Arranca cuando la fuente está lista y el hero se ve (una sola vez)
    const fontReady = document.fonts?.load
      ? document.fonts.load(`800 120px "Bricolage Grotesque Variable"`).catch(() => {})
      : Promise.resolve()

    fontReady.then(() => {
      if (cancelled) return
      io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return
          io.disconnect()
          timer = setTimeout(play, 80)
        },
        { threshold: 0.4 }
      )
      io.observe(root)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      io?.disconnect()
      ro?.disconnect()
      if (root.dataset.state === 'play') {
        // Interrumpido (p. ej. desmontaje): dejar el título final
        playedRef.current = false
        finish()
      }
    }
  }, [start, animate])

  return (
    <div
      ref={rootRef}
      className={animate ? 'hero-title' : 'hero-title is-cat-in is-static'}
      data-state={animate ? undefined : 'done'}
    >
      {/* Un renglón por span; el espacio intermedio evita que se lea "PortfolioCreativo" */}
      <h1 ref={h1Ref} id="hero-title" className="hero-title__type hero-title__h1">
        <span className="hero-title__line">{LINES[0]}</span>{' '}
        <span className="hero-title__line">
          {LINES[1].slice(0, -1)}
          {/* La última O sigue siendo texto (se lee "Creativo"); encima va la carita del gato */}
          <span className="hero-title__o">
            {LINES[1].slice(-1)}
            <img
              className="hero-title__cat"
              src="/media/Recursos/favicon-gato.png"
              alt=""
              aria-hidden="true"
              draggable="false"
            />
          </span>
        </span>
      </h1>

      {/* Capa de construcción: puramente decorativa */}
      <div ref={fxRef} className="hero-title__fx" aria-hidden="true">
        <div ref={maskRef} className="hero-title__mask">
          <svg ref={guidesRef} className="hero-title__guides" />
          <div ref={decoRef} className="hero-title__type hero-title__outline">
            {LINES.map((text) => (
              <span key={text} className="hero-title__line">
                {text}
                <i className="hero-title__probe" />
              </span>
            ))}
          </div>
        </div>

        <svg className="hero-title__frame">
          <rect ref={frameRef} className="hero-title__box" />
          <circle ref={ringRef} className="hero-title__ring" />
          <circle ref={anchorRef} className="hero-title__anchor" r="3.5" />
          <g ref={handlesRef}>
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} className="hero-title__handle" />
            ))}
          </g>
        </svg>

        <div ref={cursorRef} className="hero-title__cursor">
          <svg viewBox="0 0 24 24" width="26" height="26">
            <path d="M3 2.5 L3 19.5 L7.6 15.4 L10.6 22 L13.7 20.6 L10.8 14.2 L17 14.2 Z" />
          </svg>
        </div>
      </div>
    </div>
  )
}
