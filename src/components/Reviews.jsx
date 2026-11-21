import { LINKEDIN_URL, REVIEWS } from '../projects/reviews.js'
import './Reviews.css'

/*
  Reseñas: recomendaciones de LinkedIn en una cinta de tarjetas que se
  desplaza sola (loop infinito). Con el mouse encima se frena. Las tarjetas se
  duplican para que el loop no tenga corte; la copia es aria-hidden.
  Datos en src/projects/reviews.js.
*/
const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

function Card({ r }) {
  return (
    <figure className="review">
      <span className="review__source">
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path
            fill="currentColor"
            d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"
          />
        </svg>
        Recomendación en LinkedIn
      </span>
      <blockquote className="review__text">“{r.text}”</blockquote>
      <figcaption className="review__who">
        <span className="review__avatar" style={{ '--c': r.color }} aria-hidden="true">
          {initials(r.name)}
        </span>
        <span>
          <strong>{r.name}</strong>
          <span>{r.role}</span>
          <span className="review__relation">{r.relation}</span>
        </span>
      </figcaption>
    </figure>
  )
}

export default function Reviews() {
  return (
    <section id="resenas" className="reviews" aria-labelledby="reviews-title">
      <header className="reviews__head">
        <div>
          <p className="reviews__eyebrow">Reseñas</p>
          <h2 id="reviews-title" className="reviews__title">
            Lo que dicen
            <br />
            <span>quienes trabajaron conmigo.</span>
          </h2>
        </div>
        <a className="reviews__more" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
          Ver todas en LinkedIn <span aria-hidden="true">↗</span>
        </a>
      </header>

      <div className="reviews__row" style={{ '--speed': `${REVIEWS.length * 14}s` }}>
        <div className="reviews__track">
          {[0, 1].map((copy) => (
            <ul key={copy} className="reviews__set" aria-hidden={copy === 1 || undefined}>
              {REVIEWS.map((r) => (
                <li key={r.name}>
                  <Card r={r} />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  )
}
