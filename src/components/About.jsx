import { useEffect, useRef, useState } from 'react'
import BlurText from './BlurText.jsx'
import ProfileCard from './ProfileCard.jsx'
import './About.css'

const TITLE = 'Hola, soy Rosario.'
const TEXT =
  'Soy **diseñadora gráfica** de **Buenos Aires.** Hace **más de 3 años** trabajo con marcas de **Argentina y Chile** en **identidad, redes, impresos, packaging y video.**'

// Programas que uso (íconos en public/media/Programas iconos)
const ICONS = '/media/Programas iconos'
const TOOLS = [
  { name: 'Photoshop', src: `${ICONS}/Iconos1-27.png` },
  { name: 'Illustrator', src: `${ICONS}/Iconos1-28.png` },
  { name: 'InDesign', src: `${ICONS}/Iconos1-29.png` },
  { name: 'After Effects', src: `${ICONS}/after-effects.svg` },
  { name: 'Canva', src: `${ICONS}/Iconos1-33.png` },
  { name: 'CapCut', src: `${ICONS}/Iconos1-32.png` },
  { name: 'Meta Ads', src: `${ICONS}/Iconos1-31.png` },
]
// Giro de cada sticker (grados), alternado para que no queden en fila rígida
const TILT = [-7, 5, -3, 6, -5, 3, -6]

/*
  Sobre mí: continúa la portada sobre el mismo fondo oscuro, sin cortes.
  Al entrar en pantalla el texto aparece con BlurText y los íconos de
  herramientas suben en cascada suave.
*/
export default function About() {
  const sectionRef = useRef(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) {
      setRevealed(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 }
    )
    io.observe(section)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={sectionRef} id="sobre-mi" className="about" aria-label="Sobre mí">
      <div className="about__inner">
          <div className={`about__content${revealed ? ' is-revealed' : ''}`}>
            <div className="about__text">
              <p className="about__eyebrow">sobre mí</p>
              {/* Antes de revelarse el texto está (para buscadores) pero invisible;
                  al revelarse entra con BlurText */}
              {revealed ? (
                <>
                  <BlurText
                    as="h2"
                    text={TITLE}
                    className="about__title"
                    delay={90}
                    stepDuration={0.4}
                    trigger="load"
                  />
                  <BlurText
                    text={TEXT}
                    className="about__body"
                    inline
                    delay={28}
                    stepDuration={0.35}
                    blur={8}
                    distance={20}
                    trigger="load"
                  />
                </>
              ) : (
                <>
                  <h2 className="about__title about__pending">
                    {TITLE}
                  </h2>
                  <p className="about__body about__pending">
                    {TEXT.split('**').map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))}
                  </p>
                </>
              )}

              {/* Herramientas: stickers que se pegan de a uno; al pasar el mouse muestran su nombre */}
              <div className="about__tools">
                <p className="about__tools-label">Herramientas</p>
                <ul className="about__tools-list">
                  {TOOLS.map((tool, i) => (
                    <li
                      key={tool.name}
                      className="about__tool"
                      style={{ '--tilt': `${TILT[i % TILT.length]}deg`, '--i': i }}
                    >
                      <img src={tool.src} alt={tool.name} width="56" height="56" loading="lazy" decoding="async" />
                      <span className="about__tool-name" aria-hidden="true">
                        {tool.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Foto + gatito saludando en la esquina */}
            <div className="about__photo-wrap">
              {/* Foto en ProfileCard: se inclina hacia el mouse, con brillo holográfico (patrón del gatito) */}
              <div className="about__photo">
                <ProfileCard
                  avatarUrl="/media/images/rosario-fernandez@2x.jpg"
                  iconUrl="/media/Recursos/favicon-gato.png"
                  name="Rosario Fernández"
                  title="Diseñadora gráfica"
                  showName={false}
                  handle="inkkstudios_"
                  status="Disponible para proyectos"
                  statusColor="#eb5b30"
                  contactText="Contacto"
                  onContactClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                  theme="dark"
                  backdropColor="#1a1822"
                  radius={18}
                  holo={0.7}
                  glare={0.45}
                  tiltStrength={10}
                  intro={false}
                />
              </div>
              {/* Gatito pintor: cuerpo fijo + brazo aparte que saluda desde el hombro */}
              <div className="about__cat" aria-hidden="true">
                <img src="/media/images/gato-pintor-cuerpo.webp" alt="" width="480" height="525" loading="lazy" decoding="async" />
                <img
                  className="about__cat-arm"
                  src="/media/images/gato-pintor-brazo.webp"
                  alt=""
                  width="480"
                  height="525"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
      </div>
    </section>
  )
}
