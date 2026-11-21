import { useEffect, useRef, useState } from 'react'
import { CATEGORIES } from '../projects/categories.js'
import { VIDEO_BRANDS, VIDEO_COUNT, VIDEO_HERO } from '../projects/videos.js'
import { brandColor } from '../projects/brandColors.js'
import CaseDeck from './CaseDeck.jsx'
import { KICKERS, slugify } from './ProjectPage.jsx'
import './ProjectPage.css'
import './BrandingPage.css'
import './VideoPage.css'

/*
  Página de Edición de video (/proyectos/video/).
  Arriba: abanico de celulares con reels que se abre al entrar y se mueve
  con el scroll. Abajo: los videos por marca, en celulares que se reproducen
  solos (sin sonido) solo mientras están en pantalla. Un clic abre el video
  en grande, con sonido y controles.
*/
const pad = (n) => String(n).padStart(2, '0')

// Reproduce el video solo mientras se ve (ahorra datos y batería)
function useAutoplayInView(ref) {
  useEffect(() => {
    const v = ref.current
    if (!v || !('IntersectionObserver' in window)) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.35 }
    )
    io.observe(v)
    return () => io.disconnect()
  }, [ref])
}

function Phone({ src, onOpen, label, className = '', style }) {
  const ref = useRef(null)
  useAutoplayInView(ref)
  return (
    <button type="button" className={`vphone ${className}`} style={style} onClick={onOpen} aria-label={`Ver con sonido: ${label}`}>
      <span className="vphone__screen">
        {/* poster: primer cuadro (mismo nombre .jpg), así nunca se ve en negro mientras carga */}
        <video ref={ref} src={src} poster={src.replace(/\.mp4$/, '.jpg')} muted loop playsInline preload="none" />
        <span className="vphone__play" aria-hidden="true">
          ▶
        </span>
      </span>
    </button>
  )
}

function VideoViewer({ item, onClose, onNav }) {
  const closeRef = useRef(null)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNav(1)
      if (e.key === 'ArrowLeft') onNav(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onNav])

  return (
    <div className="viewer vviewer" role="dialog" aria-modal="true" aria-label={item.label} onClick={onClose}>
      <video key={item.src} className="vviewer__video" src={item.src} controls autoPlay playsInline onClick={(e) => e.stopPropagation()} />
      <p className="viewer__caption" onClick={(e) => e.stopPropagation()}>
        {item.label}
      </p>
      <button ref={closeRef} type="button" className="viewer__close" onClick={onClose} aria-label="Cerrar">
        ✕
      </button>
      <button
        type="button"
        className="viewer__nav viewer__nav--prev"
        onClick={(e) => {
          e.stopPropagation()
          onNav(-1)
        }}
        aria-label="Anterior"
      >
        ←
      </button>
      <button
        type="button"
        className="viewer__nav viewer__nav--next"
        onClick={(e) => {
          e.stopPropagation()
          onNav(1)
        }}
        aria-label="Siguiente"
      >
        →
      </button>
    </div>
  )
}

export default function VideoPage({ category }) {
  const rootRef = useRef(null)
  const fanRef = useRef(null)
  const [open, setOpen] = useState(-1)

  // Todos los videos en orden, para recorrerlos en el visor
  const all = VIDEO_BRANDS.flatMap((b) => b.videos.map((src, i) => ({ src, label: `${b.name} · ${i + 1} / ${b.videos.length}` })))
  const openSrc = (src) => setOpen(all.findIndex((v) => v.src === src))

  // Aparición al entrar en pantalla + abanico que se abre y se mueve con el scroll
  useEffect(() => {
    const root = rootRef.current
    const els = root.querySelectorAll('[data-reveal]')
    let io
    if (!('IntersectionObserver' in window)) els.forEach((el) => el.classList.add('is-in'))
    else {
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('is-in')
              io.unobserve(e.target)
            }
          }),
        { rootMargin: '0px 0px -8% 0px' }
      )
      els.forEach((el) => io.observe(el))
    }
    const fan = fanRef.current
    requestAnimationFrame(() => fan.classList.add('is-open'))
    let raf = 0
    const update = () => {
      raf = 0
      const r = fan.getBoundingClientRect()
      const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight))
      fan.style.setProperty('--scroll', p.toFixed(3))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      io?.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const nav = (d) => setOpen((i) => (i + d + all.length) % all.length)

  return (
    <section ref={rootRef} className="project-page video-page" aria-labelledby="project-title">
      <header className="project-page__head">
        <nav className="project-page__crumbs" aria-label="Ruta">
          <a href="/#inicio">Inicio</a>
          <span aria-hidden="true">/</span>
          <span>Proyectos</span>
        </nav>
        <p className="video-page__rec" aria-hidden="true">
          <span /> REC
        </p>
        <h1 id="project-title" className="project-page__title video-page__title">
          {category.title.split(' ').map((w, i) => (
            <span key={i} style={{ '--i': i }}>
              {w}{' '}
            </span>
          ))}
        </h1>
        <p className="project-page__lead">{category.lead}</p>
        <p className="project-page__count">
          {VIDEO_COUNT} videos · {VIDEO_BRANDS.length - 1} marcas · editado con CapCut Pro
        </p>

        <ul className="project-page__tabs">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <a
                href={c.href}
                className={c.slug === category.slug ? 'is-current' : undefined}
                aria-current={c.slug === category.slug ? 'page' : undefined}
              >
                {c.title}
              </a>
            </li>
          ))}
        </ul>

        {/* Índice de marcas (igual que en Branding) */}
        <ol className="brand-index">
          {VIDEO_BRANDS.map((b, i) => (
            <li key={b.name}>
              <a href={`#${slugify(b.name)}`} style={{ '--accent': brandColor(b.name) }}>
                <span className="brand-index__num">{pad(i + 1)}</span>
                <span className="brand-index__name">{b.name}</span>
                <span className="brand-index__sector">
                  {b.country} · {b.videos.length} {b.videos.length === 1 ? 'video' : 'videos'}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </header>

      {/* Abanico de celulares */}
      <div ref={fanRef} className="video-fan">
        {VIDEO_HERO.map((src, i) => (
          <Phone
            key={src}
            src={src}
            label={all.find((v) => v.src === src)?.label || 'Video'}
            onOpen={() => openSrc(src)}
            className="video-fan__phone"
            style={{ '--k': i - (VIDEO_HERO.length - 1) / 2 }}
          />
        ))}
      </div>

      {/* Cinta de formatos */}
      <div className="video-tape" aria-hidden="true">
        <div className="video-tape__track">
          {[0, 1].map((c) => (
            <span key={c}>Reels ✦ Ads verticales ✦ Contenido social ✦ Motion ✦ Subtítulos ✦ Gaming ✦ Producto ✦ Marca ✦&nbsp;</span>
          ))}
        </div>
      </div>

      {/* Por marca: misma apertura que Branding y el resto de Proyectos */}
      {VIDEO_BRANDS.map((b, bi) => (
        <article
          key={b.name}
          id={slugify(b.name)}
          className="brand-case video-group"
          style={{ '--accent': brandColor(b.name) }}
          aria-labelledby={`${slugify(b.name)}-name`}
        >
          <CaseDeck
            index={bi}
            id={`${slugify(b.name)}-name`}
            name={b.name}
            category={category.title}
            kicker={KICKERS.video}
            meta={`${b.country} · ${b.videos.length} ${b.videos.length === 1 ? 'video' : 'videos'}`}
            hero={{ src: b.videos[0].replace(/\.mp4$/, '.jpg'), blur: true }}
            onOpenHero={() => openSrc(b.videos[0])}
          />
          <h3 className="brand-case__label" data-reveal>
            Videos <span>{b.videos.length}</span>
          </h3>
          <ul className="video-grid">
            {b.videos.map((src, i) => (
              <li key={src} data-reveal style={{ '--d': `${i * 80}ms` }}>
                <Phone src={src} label={`${b.name} · ${i + 1}`} onOpen={() => openSrc(src)} />
              </li>
            ))}
          </ul>
        </article>
      ))}

      {open >= 0 && <VideoViewer item={all[open]} onClose={() => setOpen(-1)} onNav={nav} />}
    </section>
  )
}
