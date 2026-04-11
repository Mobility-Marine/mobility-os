// ================================================================
// MOBILITY OS — THEME PROVIDER
// Genera las CSS variables que usan todos los componentes.
// Importar en el layout raíz una sola vez.
// ================================================================

export const cssVariablesLight = `
  :root {
    /* Brand */
    --color-brand-blue:        #274B97;
    --color-brand-blue-light:  #EEF2FB;
    --color-brand-blue-hover:  #1E3A78;
    --color-brand-orange:      #E44E36;
    --color-brand-orange-light:#FDF0EE;
    --color-brand-orange-hover:#C13A24;

    /* Surfaces */
    --color-bg-page:    #F8F9FB;
    --color-bg-base:    #FFFFFF;
    --color-bg-subtle:  #F1F4F9;
    --color-bg-hover:   #E8EDF5;
    --color-bg-active:  #DDE5F2;

    /* Borders */
    --color-border-faint:  #E8EDF5;
    --color-border:        #D4DCE9;
    --color-border-strong: #A8BBE3;

    /* Text */
    --color-text-primary:  #0F1923;
    --color-text-second:   #3D4F63;
    --color-text-muted:    #6B7F96;
    --color-text-disabled: #A8B8C8;

    /* Sidebar */
    --color-sidebar-bg:          #FFFFFF;
    --color-sidebar-border:      #E8EDF5;
    --color-sidebar-active-bg:   #EEF2FB;
    --color-sidebar-text:        #3D4F63;
    --color-sidebar-active-text: #274B97;

    /* Semantic */
    --color-success-bg:    #F0FDF4;
    --color-success-border:#86EFAC;
    --color-success-text:  #15803D;
    --color-warning-bg:    #FFFBEB;
    --color-warning-border:#FCD34D;
    --color-warning-text:  #B45309;
    --color-danger-bg:     #FFF1F2;
    --color-danger-border: #FDA4AF;
    --color-danger-text:   #BE123C;
    --color-info-bg:       #EFF6FF;
    --color-info-border:   #93C5FD;
    --color-info-text:     #1D4ED8;

    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(15,25,35,0.06);
    --shadow-md: 0 2px 8px rgba(15,25,35,0.08), 0 1px 2px rgba(15,25,35,0.04);
    --shadow-lg: 0 4px 16px rgba(15,25,35,0.10), 0 2px 4px rgba(15,25,35,0.06);
    --shadow-xl: 0 8px 32px rgba(15,25,35,0.12), 0 2px 8px rgba(15,25,35,0.08);
    --shadow-brand-blue:   0 2px 12px rgba(39,75,151,0.28);
    --shadow-brand-orange: 0 2px 12px rgba(228,78,54,0.28);

    /* Layout */
    --radius-sm:   6px;
    --radius-md:   8px;
    --radius-lg:   12px;
    --radius-xl:   16px;
    --radius-2xl:  20px;
    --radius-full: 9999px;

    --sidebar-width: 260px;
    --header-height: 60px;

    /* Transitions */
    --transition-fast:   all 0.12s ease;
    --transition-normal: all 0.18s ease;
    --transition-slow:   all 0.28s ease;
  }
`;

export const cssVariablesDark = `
  [data-theme="dark"] {
    --color-bg-page:    #0B0F14;
    --color-bg-base:    #111720;
    --color-bg-subtle:  #161D28;
    --color-bg-hover:   #1C2535;
    --color-bg-active:  #1E2D47;

    --color-border-faint:  #1C2535;
    --color-border:        #243044;
    --color-border-strong: #2E3F5C;

    --color-text-primary:  #F0F4F8;
    --color-text-second:   #B8C8D9;
    --color-text-muted:    #6B7F96;
    --color-text-disabled: #3D4F63;

    --color-sidebar-bg:          #0D1219;
    --color-sidebar-border:      #1C2535;
    --color-sidebar-active-bg:   #1A2640;
    --color-sidebar-text:        #B8C8D9;
    --color-sidebar-active-text: #7AA3E8;

    --color-success-bg:    #052E16;
    --color-success-border:#166534;
    --color-success-text:  #4ADE80;
    --color-warning-bg:    #1C1500;
    --color-warning-border:#854D0E;
    --color-warning-text:  #FACC15;
    --color-danger-bg:     #1F0008;
    --color-danger-border: #9F1239;
    --color-danger-text:   #FB7185;
    --color-info-bg:       #0A1628;
    --color-info-border:   #1E40AF;
    --color-info-text:     #60A5FA;

    --shadow-sm: 0 1px 2px rgba(0,0,0,0.20);
    --shadow-md: 0 2px 8px rgba(0,0,0,0.28);
    --shadow-lg: 0 4px 16px rgba(0,0,0,0.36);
    --shadow-xl: 0 8px 32px rgba(0,0,0,0.44);
  }
`;

// Applica el tema al <html> tag
export function applyTheme(theme: 'light' | 'dark') {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mos-theme', theme);
  }
}

// Lee el tema guardado o detecta preferencia del sistema
export function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('mos-theme') as 'light' | 'dark' | null;
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
