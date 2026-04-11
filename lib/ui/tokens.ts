// ================================================================
// MOBILITY OS — DESIGN SYSTEM TOKENS
// Fuente única de verdad para colores, tipografía, spacing y sombras.
// Todos los componentes importan desde aquí. Nunca hardcodear valores.
// ================================================================

// ----------------------------------------------------------------
// PALETA MOBILITY MARINE
// ----------------------------------------------------------------
export const brand = {
  blue: {
    50:  '#EEF2FB',
    100: '#D5DFEF', // hover suave
    200: '#A8BBE3',
    400: '#6A8DC8',
    600: '#274B97', // PRIMARY — azul principal
    700: '#1E3A78',
    800: '#152960',
    900: '#0C1A40',
  },
  orange: {
    50:  '#FDF0EE',
    100: '#F9D5CF',
    200: '#F4A99E',
    400: '#EC6F5E',
    600: '#E44E36', // ACCENT — naranja de acción
    700: '#C13A24',
    800: '#9A2C1A',
    900: '#6B1C0E',
  },
} as const;

// ----------------------------------------------------------------
// COLORES SEMÁNTICOS
// ----------------------------------------------------------------
export const semantic = {
  success: {
    bg:     '#F0FDF4',
    border: '#86EFAC',
    text:   '#15803D',
    dark:   { bg: '#052E16', border: '#166534', text: '#4ADE80' },
  },
  warning: {
    bg:     '#FFFBEB',
    border: '#FCD34D',
    text:   '#B45309',
    dark:   { bg: '#1C1500', border: '#854D0E', text: '#FACC15' },
  },
  danger: {
    bg:     '#FFF1F2',
    border: '#FDA4AF',
    text:   '#BE123C',
    dark:   { bg: '#1F0008', border: '#9F1239', text: '#FB7185' },
  },
  info: {
    bg:     '#EFF6FF',
    border: '#93C5FD',
    text:   '#1D4ED8',
    dark:   { bg: '#0A1628', border: '#1E40AF', text: '#60A5FA' },
  },
} as const;

// ----------------------------------------------------------------
// COLORES DE SUPERFICIE — LIGHT MODE
// ----------------------------------------------------------------
export const surfaceLight = {
  // Fondos
  bgPage:       '#F8F9FB',   // fondo de página
  bgBase:       '#FFFFFF',   // cards, paneles
  bgSubtle:     '#F1F4F9',   // filas alternas, inputs
  bgHover:      '#E8EDF5',   // hover de fila/item
  bgActive:     '#DDE5F2',   // item seleccionado

  // Bordes
  borderFaint:  '#E8EDF5',   // separadores muy sutiles
  border:       '#D4DCE9',   // bordes estándar
  borderStrong: '#A8BBE3',   // bordes con énfasis

  // Texto
  textPrimary:  '#0F1923',   // títulos principales
  textSecond:   '#3D4F63',   // texto de cuerpo
  textMuted:    '#6B7F96',   // subtítulos, placeholders
  textDisabled: '#A8B8C8',   // deshabilitado

  // Sidebar
  sidebarBg:    '#FFFFFF',
  sidebarBorder:'#E8EDF5',
  sidebarActive:'#EEF2FB',
  sidebarText:  '#3D4F63',
  sidebarActiveText: '#274B97',
} as const;

// ----------------------------------------------------------------
// COLORES DE SUPERFICIE — DARK MODE
// ----------------------------------------------------------------
export const surfaceDark = {
  bgPage:       '#0B0F14',
  bgBase:       '#111720',
  bgSubtle:     '#161D28',
  bgHover:      '#1C2535',
  bgActive:     '#1E2D47',

  borderFaint:  '#1C2535',
  border:       '#243044',
  borderStrong: '#2E3F5C',

  textPrimary:  '#F0F4F8',
  textSecond:   '#B8C8D9',
  textMuted:    '#6B7F96',
  textDisabled: '#3D4F63',

  sidebarBg:    '#0D1219',
  sidebarBorder:'#1C2535',
  sidebarActive:'#1A2640',
  sidebarText:  '#B8C8D9',
  sidebarActiveText: '#7AA3E8',
} as const;

// ----------------------------------------------------------------
// TIPOGRAFÍA
// ----------------------------------------------------------------
export const typography = {
  fontSans:  '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
  fontMono:  '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',

  size: {
    xs:   '11px',
    sm:   '12px',
    base: '13px',
    md:   '14px',
    lg:   '16px',
    xl:   '18px',
    '2xl':'22px',
    '3xl':'28px',
    '4xl':'36px',
  },

  weight: {
    regular: 400,
    medium:  500,
    semibold:600,
    bold:    700,
    heavy:   750,
  },

  lineHeight: {
    tight:  1.25,
    normal: 1.5,
    relaxed:1.75,
  },
} as const;

// ----------------------------------------------------------------
// SPACING (múltiplos de 4px)
// ----------------------------------------------------------------
export const spacing = {
  0:   '0px',
  1:   '4px',
  2:   '8px',
  3:   '12px',
  4:   '16px',
  5:   '20px',
  6:   '24px',
  8:   '32px',
  10:  '40px',
  12:  '48px',
  16:  '64px',
  20:  '80px',
} as const;

// ----------------------------------------------------------------
// BORDER RADIUS
// ----------------------------------------------------------------
export const radius = {
  sm:   '6px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  '2xl':'20px',
  full: '9999px',
} as const;

// ----------------------------------------------------------------
// SOMBRAS
// ----------------------------------------------------------------
export const shadow = {
  // Light mode
  sm:  '0 1px 2px rgba(15,25,35,0.06)',
  md:  '0 2px 8px rgba(15,25,35,0.08), 0 1px 2px rgba(15,25,35,0.04)',
  lg:  '0 4px 16px rgba(15,25,35,0.10), 0 2px 4px rgba(15,25,35,0.06)',
  xl:  '0 8px 32px rgba(15,25,35,0.12), 0 2px 8px rgba(15,25,35,0.08)',

  // Sombra de color para botones de acción
  brandBlue:   '0 2px 12px rgba(39,75,151,0.28)',
  brandOrange: '0 2px 12px rgba(228,78,54,0.28)',

  // Dark mode (más sutiles)
  smDark: '0 1px 2px rgba(0,0,0,0.20)',
  mdDark: '0 2px 8px rgba(0,0,0,0.28)',
  lgDark: '0 4px 16px rgba(0,0,0,0.36)',
} as const;

// ----------------------------------------------------------------
// TRANSICIONES
// ----------------------------------------------------------------
export const transition = {
  fast:   'all 0.12s ease',
  normal: 'all 0.18s ease',
  slow:   'all 0.28s ease',
} as const;

// ----------------------------------------------------------------
// Z-INDEX
// ----------------------------------------------------------------
export const zIndex = {
  base:    0,
  raised:  10,
  dropdown:100,
  sticky:  200,
  modal:   300,
  toast:   400,
  tooltip: 500,
} as const;

// ----------------------------------------------------------------
// BREAKPOINTS
// ----------------------------------------------------------------
export const breakpoint = {
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl':'1536px',
} as const;
