import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES } from '../projects/categories.js'
import { BRANDS } from '../projects/branding.js'
import { Viewer } from './ProjectPage.jsx'
import BeforeAfter from './BeforeAfter.jsx'
import CaseDeck from './CaseDeck.jsx'
import StickerBoard from './StickerBoard.jsx'
import './ProjectPage.css'
import './BrandingPage.css'

/*
  Página de Branding (/proyectos/branding/). A diferencia de las otras
  categorías, cada marca se cuenta como un caso: concepto, símbolos, paleta,
  tipografía, proceso (del boceto a la marca), versiones del logo, páginas del
  manual y aplicaciones. Las imágenes se abren en grande con el visor.
  Los datos están en src/projects/branding.js.
*/
const pad = (n) => String(n).padStart(2, '0')

export default function BrandingPage({ category }) {
  const rootRef = useRef(null)
  // Visor: lista de imágenes del caso abierto y cuál se ve
  const [viewer, setViewer] = useState(null)

  // Aparición suave al entrar en pantalla (mismo criterio que las otras páginas)
  useEffect(() => {
    const els = rootRef.current.querySelectorAll('[data-reveal]')
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
  }, [])

  return (
    <section ref={rootRef} className="project-page branding-page" aria-labelledby="project-title">
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
          {BRANDS.length} marcas · del boceto al manual
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

        {/* Índice de casos */}
        <ol className="brand-index">
          {BRANDS.map((b, i) => (
            <li key={b.slug}>
              <a href={`#${b.slug}`} style={{ '--accent': b.accent }}>
                <span className="brand-index__num">{pad(i + 1)}</span>
                <span className="brand-index__name">{b.name}</span>
                <span className="brand-index__sector">{b.sector}</span>
              </a>
            </li>
          ))}
        </ol>
      </header>

      {BRANDS.map((b, i) => (
        <BrandCase key={b.slug} brand={b} index={i} onOpen={setViewer} />
      ))}

      {viewer && (
        <Viewer
          items={viewer.items}
          index={viewer.index}
          onChange={(index) => setViewer((v) => ({ ...v, index: typeof index === 'function' ? index(v.index) : index }))}
          onClose={() => setViewer(null)}
        />
      )}
    </section>
  )
}

function BrandCase({ brand: b, index, onOpen }) {
  // Todas las imágenes del caso en orden, para recorrerlas en el visor
  const gallery = useMemo(() => {
    const list = [{ full: b.cover, brand: `${b.name} · Manual` }]
    if (b.process?.before) list.push({ full: b.process.before.src, brand: `${b.name} · ${b.process.before.label}` })
    b.process?.sketches.forEach((s) => list.push({ full: s.src, brand: `${b.name} · ${s.label}` }))
    if (b.process) list.push({ full: b.process.final.src, brand: `${b.name} · ${b.process.final.label}` })
    b.logos.forEach((l) => list.push({ full: l.src, brand: `${b.name} · ${l.label}` }))
    b.manual.filter((src) => src !== b.cover).forEach((src) => list.push({ full: src, brand: `${b.name} · Manual` }))
    b.applications?.forEach((g) =>
      g.items.forEach((it) => list.push({ full: it.src, brand: `${b.name} · ${it.label || g.title}` }))
    )
    return list
  }, [b])
  const open = (src) => onOpen({ items: gallery, index: Math.max(0, gallery.findIndex((g) => g.full === src)) })

  return (
    <article id={b.slug} className="brand-case" style={{ '--accent': b.accent }} aria-labelledby={`${b.slug}-name`}>
      {/* Apertura tipo presentación: divisoria, marca y ficha, apiladas al scrollear */}
      <CaseDeck
        index={index}
        id={`${b.slug}-name`}
        name={b.name}
        category="Branding"
        kicker={['Identidad', 'visual']}
        meta={b.year}
        hero={b.hero}
        onOpenHero={() => open(b.cover)}
        info={{
          tagline: b.tagline,
          facts: [
            { label: 'Proyecto', value: 'Identidad visual' },
            { label: 'Cliente', value: b.name },
            { label: 'Rubro', value: b.sector },
            { label: 'Año', value: b.year },
          ],
          chips: b.deliverables,
        }}
      />

      {/* Stickers animados en los bordes (`stickers: true` en branding.js) */}
      {b.stickers && <StickerBoard />}

      {/* Concepto y símbolos */}
      <div className="brand-case__concept">
        <div data-reveal>
          <h3 className="brand-case__label">Concepto</h3>
          {b.concept.map((p) => (
            <p key={p} className="brand-case__text">
              {p}
            </p>
          ))}
        </div>
        <ul className="brand-case__symbols">
          {b.symbols.map((s, j) => (
            <li key={s.title} data-reveal style={{ '--d': `${j * 80}ms` }}>
              <span className="brand-case__symbol-num">{pad(j + 1)}</span>
              <strong>{s.title}</strong>
              <span>{s.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Proceso: del boceto a la marca final */}
      {b.process && (
        <div className="brand-case__block">
          <h3 className="brand-case__label" data-reveal>
            {b.process.before ? 'Rediseño · del logo anterior a la marca nueva' : 'Proceso · del boceto a la marca'}
          </h3>
          {/* Comparador: arrastrar la barra para ver el logo anterior y el nuevo */}
          {b.process.before && (
            <div className="brand-compare" data-reveal>
              <BeforeAfter
                before={b.process.before.src}
                after={b.process.final.src}
                beforeLabel="Antes"
                afterLabel="Ahora"
                alt={`Logo de ${b.name}`}
              />
              <p className="brand-compare__hint">Arrastrá la barra para comparar el logo anterior con el nuevo.</p>
            </div>
          )}
          <ol className="brand-process" style={{ '--n': b.process.sketches.length + (b.process.before ? 1 : 0) }}>
            {/* Punto de partida: el logo que la marca usaba antes */}
            {b.process.before && (
              <li className="brand-process__before" data-reveal>
                <button type="button" className="brand-process__img" onClick={() => open(b.process.before.src)}>
                  <img src={b.process.before.src} alt={`${b.name}: ${b.process.before.label}`} loading="lazy" decoding="async" />
                </button>
                <span className="brand-process__step">Antes · {b.process.before.label}</span>
              </li>
            )}
            {b.process.sketches.map((s, j) => (
              <li key={s.src} data-reveal style={{ '--d': `${(j + 1) * 90}ms` }}>
                <button type="button" className="brand-process__img" onClick={() => open(s.src)}>
                  <img src={s.src} alt={`${b.name}: ${s.label}`} loading="lazy" decoding="async" />
                </button>
                <span className="brand-process__step">
                  Boceto {pad(j + 1)} · {s.label}
                </span>
              </li>
            ))}
            <li className="brand-process__final" data-reveal style={{ '--d': `${(b.process.sketches.length + 1) * 90}ms` }}>
              <button type="button" className="brand-process__img" onClick={() => open(b.process.final.src)}>
                <img src={b.process.final.src} alt={`${b.name}: ${b.process.final.label}`} loading="lazy" decoding="async" />
              </button>
              <span className="brand-process__step">✓ {b.process.final.label}</span>
            </li>
          </ol>
        </div>
      )}

      {/* Sistema: paleta y tipografía */}
      <div className="brand-case__system">
        <div data-reveal>
          <h3 className="brand-case__label">Paleta</h3>
          <ul className="brand-palette">
            {b.palette.map((c) => (
              <li key={c.hex} style={{ '--c': c.hex }}>
                <span className="brand-palette__chip" />
                <span className="brand-palette__name">{c.name}</span>
                <span className="brand-palette__hex">{c.hex}</span>
              </li>
            ))}
          </ul>
        </div>
        <div data-reveal>
          <h3 className="brand-case__label">Tipografía</h3>
          <ul className="brand-fonts">
            {b.fonts.map((f) => (
              <li key={f.name}>
                <span className="brand-fonts__aa" aria-hidden="true">
                  Aa
                </span>
                <span>
                  <strong>{f.name}</strong>
                  <span>{f.role}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Versiones del logo */}
      <div className="brand-case__block">
        <h3 className="brand-case__label" data-reveal>
          Versiones del logo
        </h3>
        <ul className="brand-logos">
          {b.logos.map((l, j) => (
            <li key={l.src} data-reveal style={{ '--d': `${(j % 4) * 70}ms` }}>
              <button type="button" onClick={() => open(l.src)} aria-label={`Ver en grande: ${l.label}`}>
                <img src={l.src} alt="" width="800" height="800" loading="lazy" decoding="async" />
              </button>
              <span>{l.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Aplicaciones reales (fotos de piezas producidas, historias, etc.) */}
      {b.applications?.map((g) => (
        <div key={g.title} className="brand-case__block">
          <h3 className="brand-case__label" data-reveal>
            {g.heading || `Aplicaciones · ${g.title}`}
          </h3>
          <ul className="brand-apps" style={{ '--cols': g.cols, '--ratio': g.ratio }}>
            {g.items.map((it, j) => (
              <li key={it.src} data-reveal style={{ '--d': `${j * 60}ms` }}>
                <button type="button" onClick={() => open(it.src)} aria-label={`Ver en grande: ${it.label || `${g.title} ${j + 1}`}`}>
                  <img src={it.src} alt={it.label ? `${b.name}: ${it.label}` : ''} loading="lazy" decoding="async" />
                </button>
                {it.label && <span>{it.label}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Páginas del manual: tira horizontal */}
      <div className="brand-case__block">
        <h3 className="brand-case__label" data-reveal>
          Manual de marca <span>{b.manual.length} páginas</span>
        </h3>
        <ul className="brand-manual" data-reveal>
          {b.manual.map((src, j) => (
            <li key={src}>
              <button type="button" onClick={() => open(src)} aria-label={`Ver página ${j + 1} del manual`}>
                <img src={src} alt="" width="1400" height="990" loading="lazy" decoding="async" />
              </button>
            </li>
          ))}
        </ul>
      </div>

    </article>
  )
}
