import Brands from './Brands.jsx'
import HeroTitle from './HeroTitle.jsx'
import ShapeGrid from './ShapeGrid.jsx'
import './Hero.css'

// Portada sin intro: el título arma su animación de entrada al cargar la página.
// La grilla de fondo (con estela naranja al pasar el mouse) es solo de la portada;
// el resto de la página es oscuro liso.
export default function Hero() {
  return (
    <section id="inicio" className="hero" aria-labelledby="hero-title">
      <div className="hero__bg" aria-hidden="true">
        <ShapeGrid
          shape="square"
          cellSize={40}
          direction="diagonal-down"
          speed={0.5}
          lineColor="#2a2734"
          hoverColor="#EB5B30"
          clickCascade={false}
          intro={false}
          backgroundColor="#0b0a10"
        />
      </div>

      <div className="hero__center">
        {/* Rótulo complementario sobre el título */}
        <p className="hero__eyebrow">
          <span className="hero__year">2026</span>
          <span className="hero__tags">Diseño gráfico · Dirección de arte · Contenido digital</span>
        </p>
        {/* Entrada del título: cursor, marco punteado, guías y relleno (una vez al cargar) */}
        <HeroTitle start />
      </div>

      {/* Franja de marcas al pie de la portada */}
      <Brands />
    </section>
  )
}
