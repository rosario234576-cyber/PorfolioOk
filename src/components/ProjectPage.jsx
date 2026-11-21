import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES } from '../projects/categories.js'
import { brandColor } from '../projects/brandColors.js'
import CaseDeck from './CaseDeck.jsx'
import './ProjectPage.css'
import './BrandingPage.css'

// Título grande de la divisoria de cada marca, según la categoría
export const KICKERS = {
  'redes-sociales': ['Redes', 'sociales'],
  fotografia: ['Fotografía', 'de producto'],
  'packaging-carteleria': ['Packaging', 'y cartelería'],
  web: ['Diseño', 'web'],
  video: ['Edición', 'de video'],
}

// "Tu Plan Futuro · Impresos" → "tu-plan-futuro-impresos" (anclas del índice)
export const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/*
  Página de una categoría de Proyectos (/proyectos/<slug>/).
  Arriba: título, bajada y acceso a las otras categorías.
  Abajo: los trabajos agrupados por marca en una grilla tipo mosaico; al tocar una
  pieza se abre en grande (visor con flechas y Esc). Web muestra cada sitio en
  escritorio y celular.
*/
export default function ProjectPage({ category }) {
  const rootRef = useRef(null)

  // Todas las piezas en orden, para recorrerlas con el visor
  const flat = useMemo(
    () =>
      category.slug === 'web'
        ? []
        : category.groups.flatMap((g) => g.items.map((it) => ({ ...it, brand: g.brand }))),
    [category]
  )
  const [open, setOpen] = useState(-1)

  // Las piezas aparecen suave al entrar en pantalla
  useEffect(() => {
    const root = rootRef.current
    const els = root.querySelectorAll('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
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
    return () => io.disconnect()
  }, [category])

  let index = -1

  return (
    <section ref={rootRef} className="project-page" aria-labelledby="project-title">
      <header className="project-page__head">
        <nav className="project-page__crumbs" aria-label="Ruta">
          <a href="/#inicio">Inicio</a>
          <span aria-hidden="true">/</span>
          <span>Proyectos</span>
        </nav>
        <h1 id="project-title" className="project-page__title">
          {category.title}
        </h1>
        <p className="project-page__lead">{category.lead}</p>
        <p className="project-page__count">
          {category.slug === 'web'
            ? `${category.count} sitios`
            : `${category.count} piezas · ${category.groups.length} ${category.groups.length === 1 ? 'marca' : 'marcas'}`}
        </p>

        {/* Otras categorías */}
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
          {category.groups.map((g, i) => (
            <li key={g.brand}>
              <a href={`#${slugify(g.brand)}`} style={{ '--accent': brandColor(g.brand) }}>
                <span className="brand-index__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="brand-index__name">{g.brand}</span>
                <span className="brand-index__sector">
                  {category.slug === 'web' ? 'Sitio web' : `${g.items.length} ${g.items.length === 1 ? 'pieza' : 'piezas'}`}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </header>

      {category.slug === 'web' ? (
        <div className="project-page__sites">
          {category.groups.map((site, si) => (
            <article
              key={site.brand}
              id={slugify(site.brand)}
              className="brand-case site-case"
              style={{ '--accent': brandColor(site.brand) }}
              aria-labelledby={`${slugify(site.brand)}-name`}
            >
              {/* Apertura igual a Branding: divisoria + sitio a pantalla completa */}
              <CaseDeck
                index={si}
                id={`${slugify(site.brand)}-name`}
                name={site.brand}
                category={category.title}
                kicker={KICKERS[category.slug]}
                meta="Escritorio y celular"
                hero={{ src: site.desktop.src, bg: '#111', cover: true }}
                onOpenHero={() => {}}
              />
              <h3 className="brand-case__label">El sitio</h3>
              <div className="site-card__devices" data-reveal>
                {/* Escritorio: la captura completa baja sola al pasar el mouse */}
                <div className="site-card__browser">
                  <span className="site-card__bar" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <div className="site-card__viewport">
                    <img
                      src={site.desktop.src}
                      alt={`Sitio web de ${site.brand} en escritorio`}
                      width={site.desktop.w}
                      height={site.desktop.h}
                      loading="lazy"
                      decoding="async"
                      style={{ '--scroll': `${Math.max(0, 1 - 1 / (site.desktop.h / site.desktop.w / 0.625))}` }}
                    />
                  </div>
                </div>
                {/* Celular */}
                <div className="site-card__phone">
                  <div className="site-card__phone-screen">
                    <img
                      src={site.mobile.src}
                      alt={`Sitio web de ${site.brand} en celular`}
                      width={site.mobile.w}
                      height={site.mobile.h}
                      loading="lazy"
                      decoding="async"
                      style={{ '--scroll': `${Math.max(0, 1 - 1 / (site.mobile.h / site.mobile.w / 2.05))}` }}
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        category.groups.map((g, gi) => (
          <article
            key={g.brand}
            id={slugify(g.brand)}
            className="brand-case project-page__group"
            style={{ '--accent': brandColor(g.brand) }}
            aria-labelledby={`${slugify(g.brand)}-name`}
          >
            {/* Apertura igual a Branding: divisoria + pieza destacada */}
            <CaseDeck
              index={gi}
              id={`${slugify(g.brand)}-name`}
              name={g.brand}
              category={category.title}
              kicker={KICKERS[category.slug]}
              meta={`${g.items.length} ${g.items.length === 1 ? 'pieza' : 'piezas'}`}
              hero={{ src: g.items[0].full || g.items[0].src, blur: true }}
              onOpenHero={() => setOpen(flat.findIndex((f) => f.src === g.items[0].src))}
            />
            <h3 className="brand-case__label" data-reveal>
              Piezas <span>{g.items.length}</span>
            </h3>
            <ul className="project-page__grid">
              {g.items.map((it) => {
                index += 1
                const i = index
                return (
                  <li key={it.src} data-reveal>
                    <button
                      type="button"
                      className="project-page__piece"
                      onClick={() => setOpen(i)}
                      aria-label={`Ver en grande: ${g.brand}, pieza ${i + 1}`}
                    >
                      <img src={it.src} alt="" width={it.w} height={it.h} loading="lazy" decoding="async" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </article>
        ))
      )}

      {open >= 0 && <Viewer items={flat} index={open} onChange={setOpen} onClose={() => setOpen(-1)} />}
    </section>
  )
}

// Visor a pantalla completa: flechas, Esc y clic afuera para cerrar
// (también lo usa la página de Branding)
export function Viewer({ items, index, onChange, onClose }) {
  const item = items[index]
  const go = useCallback((d) => onChange((index + d + items.length) % items.length), [index, items.length, onChange])
  const closeRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [go, onClose])

  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label={`${item.brand}, pieza ${index + 1} de ${items.length}`} onClick={onClose}>
      <img
        key={item.full}
        className="viewer__img"
        src={item.full}
        alt={`${item.brand}, pieza ${index + 1}`}
        onClick={(e) => e.stopPropagation()}
      />
      <p className="viewer__caption" onClick={(e) => e.stopPropagation()}>
        {item.brand} · {index + 1} / {items.length}
      </p>
      <button ref={closeRef} type="button" className="viewer__close" onClick={onClose} aria-label="Cerrar">
        ✕
      </button>
      <button
        type="button"
        className="viewer__nav viewer__nav--prev"
        onClick={(e) => {
          e.stopPropagation()
          go(-1)
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
          go(1)
        }}
        aria-label="Siguiente"
      >
        →
      </button>
    </div>
  )
}
