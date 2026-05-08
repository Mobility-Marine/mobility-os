"use client";
import React from "react";

// ═══════════════════════════════════════════════════════════════════
// ICONS — SET CENTRALIZADO PARA COMPONENTES SHARED
// Patrón: SVG line-style profesional (Lucide-grade), 24x24 viewBox,
// stroke-based con currentColor. Importar desde aquí en todos los
// componentes /shared/ del sistema.
// ═══════════════════════════════════════════════════════════════════

type IconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
};

const base = (size = 16, strokeWidth = 1.75): React.SVGAttributes<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export const IconSearch = ({ size, strokeWidth, ...rest }: IconProps) => (
  <svg {...base(size, strokeWidth)} {...rest}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const IconX = ({ size, strokeWidth, ...rest }: IconProps) => (
  <svg {...base(size, strokeWidth)} {...rest}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const IconFilter = ({ size, strokeWidth, ...rest }: IconProps) => (
  <svg {...base(size, strokeWidth)} {...rest}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

export const IconSliders = ({ size, strokeWidth, ...rest }: IconProps) => (
  <svg {...base(size, strokeWidth)} {...rest}>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

export const IconChevronDown = ({ size, strokeWidth, ...rest }: IconProps) => (
  <svg {...base(size, strokeWidth)} {...rest}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const IconChevronUp = ({ size, strokeWidth, ...rest }: IconProps) => (
  <svg {...base(size, strokeWidth)} {...rest}>
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

export const IconChevronRight = ({ size, strokeWidth, ...rest }: IconProps) => (
  <svg {...base(size, strokeWidth)} {...rest}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const IconChevronLeft = ({ size, strokeWidth, ...rest }: IconProps) => (
  <svg {...base(size, strokeWidth)} {...rest}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const IconCalendar = ({ size, strokeWidth, ...rest }: IconProps) => (
  <svg {...base(size, strokeWidth)} {...rest}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const IconDollar = ({ size, strokeWidth, ...rest }: IconProps) => (
  <svg {...base(size, strokeWidth)} {...rest}>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

export const IconInbox = ({ size, strokeWidth, ...rest }: IconProps) => (
  <svg {...base(size, strokeWidth)} {...rest}>
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

export const IconPlus = ({ size, strokeWidth, ...rest }: IconProps) => (
  <svg {...base(size, strokeWidth)} {...rest}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const IconRefresh = ({ size, strokeWidth, ...rest }: IconProps) => (
  <svg {...base(size, strokeWidth)} {...rest}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

export const IconCheck = ({ size, strokeWidth, ...rest }: IconProps) => (
  <svg {...base(size, strokeWidth)} {...rest}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const IconAlertCircle = ({ size, strokeWidth, ...rest }: IconProps) => (
  <svg {...base(size, strokeWidth)} {...rest}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export const IconInfo = ({ size, strokeWidth, ...rest }: IconProps) => (
  <svg {...base(size, strokeWidth)} {...rest}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);