# Graph Report - PorfolioOk  (2026-11-11)

## Corpus Check
- 26 files · ~50,305 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 37 file(s) not represented in the graph (top: .css 12, .heif 10, .woff2 6)

## Summary
- 232 nodes · 390 edges · 20 communities (10 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `28ef7060`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.js
- service-page.js
- package.json
- gemini.js
- pdf.js
- server.js
- preview-server.cjs
- CV a Medida
- script.js
- trabajos-gallery.js
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `renderDetail()` - 12 edges
2. `renderCards()` - 11 edges
3. `el()` - 10 edges
4. `fitOnePage()` - 9 edges
5. `has()` - 8 edges
6. `renderGaps()` - 8 edges
7. `renderPreview()` - 8 edges
8. `isAuthed()` - 7 edges
9. `login()` - 7 edges
10. `generateDocx()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `adaptCvGemini()` --calls--> `userPrompt()`  [EXTRACTED]
  _cv-app/lib/gemini.js → _cv-app/lib/ai.js
- `generateDocx()` --calls--> `designOf()`  [EXTRACTED]
  _cv-app/lib/docx.js → _cv-app/lib/pdf.js
- `generateDocx()` --calls--> `fitOnePage()`  [EXTRACTED]
  _cv-app/lib/docx.js → _cv-app/lib/pdf.js
- `exportCv()` --calls--> `generateDocx()`  [EXTRACTED]
  _cv-app/server.js → _cv-app/lib/docx.js
- `exportCv()` --calls--> `fitOnePage()`  [EXTRACTED]
  _cv-app/server.js → _cv-app/lib/pdf.js

## Import Cycles
- None detected.

## Communities (20 total, 10 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.10
Nodes (45): addFiles(), answeredGaps(), api(), applyRefine(), chips(), cropSquare(), currentJob(), downloadPdf() (+37 more)

### Community 1 - "service-page.js"
Cohesion: 0.08
Nodes (33): attachDeferredSource(), buildDescription(), buildVideoGallery(), closeLightbox(), galleryVideos, getBlockName(), getCaption(), getClientName() (+25 more)

### Community 2 - "package.json"
Cohesion: 0.08
Nodes (31): author, dependencies, @anthropic-ai/sdk@^1.6.0, cheerio@^1.2.0, docx@^9.15.3, express@^5.3.0, @fontsource/tinos@^5.3.0, @google/genai@^3.0.0 (+23 more)

### Community 3 - "gemini.js"
Cohesion: 0.11
Nodes (25): adaptCv(), adaptCvClaude(), CV_SCHEMA, entry, generalTarget(), getClient(), hasClaude(), hasGemini() (+17 more)

### Community 4 - "pdf.js"
Cohesion: 0.13
Nodes (24): clean(), generateDocx(), MARGIN, nonEmpty(), PAGE, build(), clean(), designOf() (+16 more)

### Community 5 - "server.js"
Cohesion: 0.18
Nodes (15): attempts, authRequired(), isAuthed(), login(), logout(), readCookie(), requireAuth(), safeEqual() (+7 more)

### Community 6 - "preview-server.cjs"
Cohesion: 0.25
Nodes (4): contentTypes, fs, http, path

### Community 7 - "CV a Medida"
Cohesion: 0.29
Nodes (6): CV a Medida, Primera vez (2 minutos), Publicarla en internet (privada, con clave), Qué hace la IA (y qué no), Técnico, Uso

### Community 8 - "script.js"
Cohesion: 0.50
Nodes (3): storiesCarousel, storyNext, storyPrev

### Community 9 - "trabajos-gallery.js"
Cohesion: 0.67
Nodes (3): createTrabajosGallery(), getTrabajosType(), trabajosGalleryData

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `adaptCv()` connect `gemini.js` to `server.js`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09608843537414966 - nodes in this community are weakly interconnected._
- **Why does `pdfkit` connect `package.json` to `pdf.js`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `service-page.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07965860597439545 - nodes in this community are weakly interconnected._
- **Why does `@google/genai` connect `package.json` to `gemini.js`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08064516129032258 - nodes in this community are weakly interconnected._
- **Should `gemini.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11330049261083744 - nodes in this community are weakly interconnected._