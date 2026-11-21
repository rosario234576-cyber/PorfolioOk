import { useCallback, useEffect, useState } from 'react'
import GooeyNav from './components/GooeyNav.jsx'
import SpecularButton from './components/SpecularButton.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import ServicesAccordion from './components/ServicesAccordion.jsx'
import Connect from './components/Connect.jsx'
import Footer from './components/Footer.jsx'
import Reviews from './components/Reviews.jsx'
import ScrollStatement from './components/ScrollStatement.jsx'
import BusinessCard from './components/BusinessCard.jsx'
import ProjectPage from './components/ProjectPage.jsx'
import BrandingPage from './components/BrandingPage.jsx'
import VideoPage from './components/VideoPage.jsx'
import ProjectsMenu from './components/ProjectsMenu.jsx'
import MobileMenu from './components/MobileMenu.jsx'
import { categoryFromPath } from './projects/categories.js'

/*
  path: ruta actual. "/" es la portada; "/proyectos/<categoría>/" es la página
  de esa categoría. (En el navegador lo pasa main.jsx; en el build, el prerender.)
*/
export default function App({ path = '/' }) {
  const category = categoryFromPath(path)
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  // Ítem activo del menú: en la portada sigue a la sección que está en pantalla
  // (Inicio / Sobre mí / Servicios); en las páginas de proyectos queda en Proyectos.
  const [navIndex, setNavIndex] = useState(category ? 3 : 0)
  useEffect(() => {
    if (category) return setNavIndex(3)
    const ids = ['inicio', 'sobre-mi', 'servicios']
    let raf = 0
    const update = () => {
      raf = 0
      // La sección activa es la última cuyo comienzo ya pasó el 40% de la pantalla
      const line = window.innerHeight * 0.4
      let idx = 0
      ids.forEach((id, i) => {
        const el = document.getElementById(id)
        if (!el) return
        // Servicios empieza antes (se superpone con Sobre mí): se cuenta desde su parte real
        const fuse = -parseFloat(getComputedStyle(el).marginTop) || 0
        if (el.getBoundingClientRect().top + fuse <= line) idx = i
      })
      setNavIndex(idx)
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
  }, [category])

  // Los anclajes llevan "/" para funcionar también desde las páginas de proyectos
  const navItems = [
    { label: 'Inicio', href: '/#inicio' },
    { label: 'Sobre mí', href: '/#sobre-mi' },
    { label: 'Servicios', href: '/#servicios' },
    {
      label: 'Proyectos',
      // Hamburguesa: abre el panel con las páginas de cada categoría
      icon: (
        <span className={`nav-burger${menuOpen ? ' is-open' : ''}`} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      ),
      onClick: () => setMenuOpen((o) => !o),
      attrs: { 'aria-expanded': menuOpen, 'aria-controls': 'projects-menu', 'data-projects-toggle': '' },
    },
  ]

  return (
    <>
      <header className="site-nav">
        <a className="site-nav__logo" href="/#inicio" aria-label="Inkk Studio — Inicio">
          <img className="site-nav__logo-light" src="/media/images/inkkstudio-logo-nav.png" alt="Inkk Studio" />
          {/* Versión con letras negras para fondo claro */}
          <img className="site-nav__logo-dark" src="/media/images/inkkstudio-logo-nav-dark.png" alt="" aria-hidden="true" />
        </a>

        <GooeyNav items={navItems} color="#cc4224" initialActiveIndex={category ? 3 : 0} activeIndex={navIndex} />

        <div className="site-nav__cta">
          <SpecularButton
            size="sm"
            radius={999}
            tint="#cc4224"
            tintOpacity={0.9}
            textColor="#ffffff"
            lineColor="#ffd9cc"
            baseColor="#ff8a66"
            className="site-nav__contact"
            onClick={() => {
              window.location.hash = '#contacto'
            }}
          >
            Contacto
          </SpecularButton>
        </div>

        {/* Celular: botón de menú a pantalla completa (reemplaza píldora y Contacto) */}
        <MobileMenu current={category?.slug} />
      </header>

      <ProjectsMenu open={menuOpen} onClose={closeMenu} current={category?.slug} />

      <main className="page">
        {category?.slug === 'branding' ? (
          <BrandingPage category={category} />
        ) : category?.slug === 'video' ? (
          <VideoPage category={category} />
        ) : category ? (
          <ProjectPage key={category.slug} category={category} />
        ) : (
          <>
            <Hero />
            <ScrollStatement />
            <About />
            <ServicesAccordion />
            <Reviews />
            <BusinessCard />
          </>
        )}
        <Connect />
      </main>

      {/* Pie de página: igual en todas las páginas */}
      <Footer />
    </>
  )
}
