import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES } from '../projects/categories.js'
import './ProjectPage.css'

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
      </header>

      {category.slug === 'web' ? (
        <div className="project-page__sites">
          {category.groups.map((site) => (
            <article key={site.brand} className="site-card" data-reveal>
              <h2 className="project-page__brand">{site.brand}</h2>
              <div className="site-card__devices">
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
        category.groups.map((g) => (
          <div key={g.brand} className="project-page__group">
            <div className="project-page__group-head" data-reveal>
              <h2 className="project-page__brand">{g.brand}</h2>
              <span className="project-page__group-count">{g.items.length}</span>
            </div>
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
          </div>
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
