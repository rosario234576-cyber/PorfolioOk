/*
  Color de cada marca (acento de su apertura en las páginas de Proyectos).
  Se busca por el comienzo del nombre ("Tu Plan Futuro · Impresos" usa el de
  "Tu Plan Futuro"). Las que no están usan el naranja de Inkk Studio.
*/
const COLORS = {
  'Tu Plan Futuro': '#1CA2AE',
  IrazzTech: '#E10600',
  Irazztech: '#E10600',
  'Electronic Games': '#d4141c',
  Invesmar: '#24456b',
  'Newsline Report': '#2b2b2f',
  'Palanca Store': '#c9a227',
  'Pirámide DTF': '#6d3fd1',
  'Vitae Charm': '#b07a9a',
  'Zona del Verde': '#4f8a3c',
  'Zona DTF': '#e0631d',
  'Arvel Custom': '#3a6ea5',
  'Maximus Gaming': '#7a2bd6',
  'Grupo Maximus': '#7a2bd6',
  'BMH': '#d98b2b',
  'Limoncello casero': '#c8b318',
  Distribuidora: '#1f7a5c',
  'Nutrition Global': '#3b9a4f',
  'Inkk Studio': '#eb5b30',
}

export const brandColor = (name = '') => {
  const key = Object.keys(COLORS).find((k) => name.startsWith(k))
  return key ? COLORS[key] : '#eb5b30'
}
