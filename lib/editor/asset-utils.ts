/**
 * SVG Pattern definitions for texture overlays
 */
export const TEXTURE_PATTERNS = {
  noise: `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E`,
  
  dots: `data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='white'/%3E%3C/svg%3E`,
  
  lines: `data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 8 L8 0' stroke='white' stroke-width='1'/%3E%3C/svg%3E`,
  
  grid: `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0 L0 0 L0 40' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E`,
  
  hexagons: `data:image/svg+xml,%3Csvg width='56' height='100' viewBox='0 0 56 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 66L0 50L0 16L28 0L56 16L56 50L28 66ZM28 100L0 84L0 66L28 50L56 66L56 84L28 100Z' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E`,
  
  grain: `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E`
}

/**
 * Shape path definitions for complex decorative elements
 */
export const SHAPE_PATHS = {
  wavy: "M0 10 Q 20 0 40 10 T 80 10 T 120 10 T 160 10 T 200 10",
  arrowRepeat: "M0 10 L10 10 L10 0 L20 10 L10 20 L10 10 M30 10 L40 10 L40 0 L50 10 L40 20 L40 10 M60 10 L70 10 L70 0 L80 10 L70 20 L70 10",
  cornerL: "M0 20 L0 0 L20 0",
  badge: "M10 0 H90 A10 10 0 0 1 100 10 V30 A10 10 0 0 1 90 40 H10 A10 10 0 0 1 0 30 V10 A10 10 0 0 1 10 0 Z",
  tag: "M0 0 H80 L100 20 L80 40 H0 V0 Z",
  diamond: "M 50 0 L 100 50 L 50 100 L 0 50 Z",
  halfCircle: "M 0 50 A 50 50 0 1 1 100 50 Z",
  doubleLine: "M 0 0 H 1000 M 0 12 H 1000",
  dotGrid: "M 0 0 A 2 2 0 1 1 0.1 0 M 40 0 A 2 2 0 1 1 40.1 0 M 80 0 A 2 2 0 1 1 80.1 0 M 0 40 A 2 2 0 1 1 0.1 40 M 40 40 A 2 2 0 1 1 40.1 40 M 80 40 A 2 2 0 1 1 80.1 40 M 0 80 A 2 2 0 1 1 0.1 80 M 40 80 A 2 2 0 1 1 40.1 80 M 80 80 A 2 2 0 1 1 80.1 80"
}
