import { useEffect, useState } from 'react'
import DriftWall from './DriftWall.jsx'
import { SOCIAL_POSTS } from './socialPosts.js'
import './Connect.css'

/*
  Seguinos y conectemos: links a redes sobre un muro de posteos que se desplaza
  en perspectiva (DriftWall). A la derecha, un celular muestra la captura del perfil
  de cada red: pasan solas y, al pasar el mouse por una fila, se queda en esa.
*/
// También las usa el pie de página (Footer.jsx)
export const NETWORKS = [
  {
    name: 'Instagram',
    meta: 'Inkkstudios · agencia',
    href: 'https://www.instagram.com/inkkstudios_/',
    screen: '/media/images/captura-instagram.webp',
  },
  {
    name: 'LinkedIn',
    meta: 'Rosario Fernández · personal',
    href: 'https://www.linkedin.com/in/rosariofernandezarg/',
    screen: '/media/images/captura-linkedin.webp',
  },
]

const pad = (n) => String(n).padStart(2, '0')

export default function Connect() {
  // Red que muestra el celular (cambia al pasar el mouse o con foco en cada fila)
  const [active, setActive] = useState(0)
  const [hovering, setHovering] = useState(false)

  // Las capturas pasan solas cada 3,5 s; mientras el mouse está sobre una fila, manda esa
  useEffect(() => {
    if (hovering) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const id = setInterval(() => setActive((a) => (a + 1) % NETWORKS.length), 3500)
    return () => clearInterval(id)
  }, [hovering])

  return (
    <section id="contacto" className="connect" aria-labelledby="connect-title">
      {/* Muro de posteos de fondo */}
      <div className="connect__wall">
        <DriftWall
          items={SOCIAL_POSTS}
          decorative
          columns={9}
          tileWidth={170}
          tileHeight={212}
          gap={16}
          radius={12}
          tilt={18}
          turn={-16}
          depth={140}
          speed={28}
          lift={56}
          dim={0.5}
          fade={0.55}
          overlayColor="#0b0a10"
        />
      </div>

      <div className="connect__inner">
        <div className="connect__text">
        <p className="connect__label">
          <span className="connect__star" aria-hidden="true">
            ✦
          </span>
          Redes
        </p>

        <h2 id="connect-title" className="connect__title">
          Seguinos y
          <br />
          conectemos.
        </h2>
        <p className="connect__lead">Contenido en movimiento y contacto directo, todo a un toque de distancia.</p>

        <ul className="connect__list">
          {NETWORKS.map((n, i) => {
            const content = (
              <>
                <span className="connect__num">{pad(i + 1)}</span>
                <span className="connect__name">{n.name}</span>
                <span className="connect__meta">{n.meta}</span>
                <span className="connect__go" aria-hidden="true">
                  {n.href ? 'Ir ↗' : 'Pronto'}
                </span>
              </>
            )
            return (
              <li key={n.name}>
                {n.href ? (
                  <a
                    className={`connect__row${i === active ? ' is-active' : ''}`}
                    href={n.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerEnter={() => {
                      setHovering(true)
                      setActive(i)
                    }}
                    onPointerLeave={() => setHovering(false)}
                    onFocus={() => {
                      setHovering(true)
                      setActive(i)
                    }}
                    onBlur={() => setHovering(false)}
                  >
                    {content}
                  </a>
                ) : (
                  <div className="connect__row is-disabled">{content}</div>
                )}
              </li>
            )
          })}
        </ul>
        </div>

        {/* Celular con la captura del perfil */}
        <div className="connect__phone" aria-hidden="true">
          <div className="connect__screen">
            {NETWORKS.map((n, i) => (
              <img
                key={n.name}
                className={i === active ? 'is-on' : ''}
                src={n.screen}
                alt=""
                width="600"
                height="1304"
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
