# CV a Medida

Subís tu CV y el link de una oferta laboral: la app lee el puesto, adapta tu CV con IA (Gemini de Google, gratis con límites; Claude opcional) y te entrega un **PDF en formato Harvard**, listo para enviar.

## Primera vez (2 minutos)

1. Creá una clave gratis de Gemini en https://aistudio.google.com/apikey
2. En esta carpeta, copiá `.env.example` como `.env` y pegá tu clave en `GEMINI_API_KEY=`
3. Hacé doble clic en **`Iniciar.bat`**. Se abre http://localhost:3000

## Uso

1. **Tu CV**: arrastralo (PDF, DOCX o TXT). Queda guardado en el navegador para la próxima vez.
2. **Link de la oferta**: pegalo. Si el sitio pide iniciar sesión (por ejemplo, LinkedIn), pegá el texto de la oferta en el recuadro.
3. **Adaptar mi CV**: en 30–90 segundos ves la vista previa, el % de compatibilidad, las palabras clave cubiertas y las faltantes.
4. Podés **editar cualquier texto** haciendo clic en la vista previa.
5. **Descargar PDF**: formato Harvard en Times New Roman. Si es posible, la app achica la letra para que entre en una página.

## Qué hace la IA (y qué no)

- Reescribe y reordena tus logros con el vocabulario de la oferta, prioriza lo relevante y arma un perfil específico para el puesto.
- **No inventa** experiencia, títulos, cifras ni herramientas. Lo que la oferta pide y tu CV no muestra aparece en «Requisitos que tu CV no muestra», con consejos.

## Publicarla en internet (privada, con clave)

Esta carpeta vive dentro del repositorio del portfolio. Empieza con «_», así GitHub Pages no la publica como parte de la web.

1. En https://render.com → **New → Web Service** → conectá el repositorio `PorfolioOk`.
2. Configurá:
   - **Root Directory:** `_cv-app`
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
   - **Instance type:** Free
3. En **Environment** agregá:
   - `GEMINI_API_KEY` = tu clave de Gemini
   - `ACCESS_CODE` = la clave para entrar a la app (elegí una larga)
4. Opcional: en *Settings → Custom Domain* agregá `cv.inkkstudio.art` y creá el registro CNAME que te indique Render en tu proveedor de dominio.

Nunca subas el archivo `.env` (ya está excluido en `.gitignore`). Con `ACCESS_CODE` definida la app pide la clave al entrar: la sesión dura 30 días y se bloquea tras 8 intentos fallidos en 15 minutos.

## Técnico

- Node.js 22.9+ · Express · `@google/genai` (Gemini, `gemini-3.6-flash` con respaldo `gemini-3.5-flash-lite`, salida JSON con esquema) · `@anthropic-ai/sdk` opcional · PDFKit.
- `lib/job.js` lee la oferta (incluye datos JobPosting de LinkedIn, Indeed, Greenhouse, Lever, etc.).
- `lib/ai.js` contiene las instrucciones de adaptación; `lib/pdf.js` arma el diseño Harvard.
- Costo: gratis dentro del límite diario de Gemini. En el plan gratuito, Google puede usar el contenido enviado para mejorar sus productos.
