// ════════════════════════════════════════════════════════════════════════
// TabsNav — Barra horizontal de tabs del wizard PartnerDrawer
// ════════════════════════════════════════════════════════════════════════
// Muestra los tabs visibles según los roles del partner.
// Cada tab incluye:
//   - Ícono emoji
//   - Label (string en español, definido en types.ts)
//   - Badge de validación (✓ / ! / •)
// El tab activo se destaca con borde inferior y color brand.
// Scroll horizontal automático si hay muchos tabs visibles.
// ════════════════════════════════════════════════════════════════════════
"use client";

import type { CSSProperties } from "react";
import type { PartnerTab, TabConfig, TabValidationState } from "../types";
import { ValidationBadge } from "./ValidationBadge";

// ── Props ─────────────────────────────────────────────────────────────
export type TabsNavProps = {
  tabs:          TabConfig[];
  activeTab:     PartnerTab;
  onTabClick:    (tab: PartnerTab) => void;
  validation:    Record<PartnerTab, TabValidationState>;
};

// ── Estilos base ──────────────────────────────────────────────────────
const NAV_STYLE: CSSProperties = {
  display:       "flex",
  alignItems:    "stretch",
  gap:           "2px",
  borderBottom:  "1px solid var(--color-border)",
  background:    "var(--color-bg-elevated)",
  padding:       "0 12px",
  overflowX:     "auto",
  overflowY:     "hidden",
  flexShrink:    0,
};

const TAB_BASE: CSSProperties = {
  display:       "inline-flex",
  alignItems:    "center",
  gap:           "8px",
  padding:       "10px 14px",
  fontSize:      "12px",
  fontWeight:    600,
  color:         "var(--color-text-muted)",
  background:    "transparent",
  border:        "none",
  borderBottom:  "2px solid transparent",
  cursor:        "pointer",
  whiteSpace:    "nowrap",
  outline:       "none",
  marginBottom:  "-1px",
  transition:    "color 0.15s, border-color 0.15s",
};

const TAB_ACTIVE: CSSProperties = {
  ...TAB_BASE,
  color:         "var(--color-brand-blue, #3b82f6)",
  borderBottom:  "2px solid var(--color-brand-blue, #3b82f6)",
};

// ── Componente ────────────────────────────────────────────────────────
export function TabsNav({ tabs, activeTab, onTabClick, validation }: TabsNavProps) {
  return (
    <nav style={NAV_STYLE} role="tablist" aria-label="Partner wizard tabs">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const state    = validation[tab.id];
        const style    = isActive ? TAB_ACTIVE : TAB_BASE;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`partner-tab-panel-${tab.id}`}
            onClick={() => onTabClick(tab.id)}
            style={style}
          >
            <span style={{ fontSize: "14px", lineHeight: 1 }}>{tab.icon}</span>
            <span>{tab.label}</span>
            <ValidationBadge state={state} required={tab.required} />
          </button>
        );
      })}
    </nav>
  );
}