// ════════════════════════════════════════════════════════════════════════
// WizardFooter — Pie del wizard PartnerDrawer
// ════════════════════════════════════════════════════════════════════════
// Contiene:
//   - Indicador de progreso (paso N de M)
//   - Mensaje de error global (si existe)
//   - Botón Anterior (deshabilitado en el primer tab)
//   - Botón Siguiente (deshabilitado en el último tab)
//   - Botón Guardar (deshabilitado si !canSave o saving)
//   - Botón Cancelar
// ════════════════════════════════════════════════════════════════════════
"use client";

import type { CSSProperties } from "react";
import type { PartnerTab, TabConfig } from "../types";

// ── Props ─────────────────────────────────────────────────────────────
export type WizardFooterProps = {
  visibleTabs:     TabConfig[];
  activeTab:       PartnerTab;
  canSave:         boolean;
  saving:          boolean;
  isEditMode:      boolean;
  errorMessage?:   string | null;
  onPrevious:      () => void;
  onNext:          () => void;
  onSave:          () => void;
  onCancel:        () => void;
};

// ── Estilos base ──────────────────────────────────────────────────────
const FOOTER_STYLE: CSSProperties = {
  display:        "flex",
  alignItems:     "center",
  justifyContent: "space-between",
  gap:            "12px",
  padding:        "12px 20px",
  borderTop:      "1px solid var(--color-border)",
  background:     "var(--color-bg-elevated)",
  flexShrink:     0,
};

const PROGRESS_STYLE: CSSProperties = {
  fontSize:    "11px",
  color:       "var(--color-text-muted)",
  fontWeight:  600,
  letterSpacing: "0.4px",
  textTransform: "uppercase",
};

const ACTIONS_STYLE: CSSProperties = {
  display:    "flex",
  alignItems: "center",
  gap:        "8px",
};

const BUTTON_BASE: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  justifyContent: "center",
  height:         "34px",
  padding:        "0 14px",
  borderRadius:   "var(--radius-md)",
  fontSize:       "13px",
  fontWeight:     600,
  cursor:         "pointer",
  border:         "1px solid var(--color-border)",
  background:     "var(--color-bg-subtle)",
  color:          "var(--color-text-primary)",
  outline:        "none",
  transition:     "background 0.15s, border-color 0.15s, opacity 0.15s",
};

const BUTTON_PRIMARY: CSSProperties = {
  ...BUTTON_BASE,
  background:  "var(--color-brand-blue, #3b82f6)",
  borderColor: "var(--color-brand-blue, #3b82f6)",
  color:       "#fff",
};

const BUTTON_GHOST: CSSProperties = {
  ...BUTTON_BASE,
  background:  "transparent",
  borderColor: "transparent",
  color:       "var(--color-text-muted)",
};

const ERROR_STYLE: CSSProperties = {
  fontSize:    "12px",
  color:       "var(--color-danger-text)",
  fontWeight:  500,
  flex:        1,
  textAlign:   "center",
  paddingLeft: "16px",
  paddingRight: "16px",
};

// ── Componente ────────────────────────────────────────────────────────
export function WizardFooter({
  visibleTabs,
  activeTab,
  canSave,
  saving,
  isEditMode,
  errorMessage,
  onPrevious,
  onNext,
  onSave,
  onCancel,
}: WizardFooterProps) {
  const idx        = visibleTabs.findIndex((tab) => tab.id === activeTab);
  const total      = visibleTabs.length;
  const isFirst    = idx <= 0;
  const isLast     = idx >= total - 1;
  const stepNumber = idx >= 0 ? idx + 1 : 1;

  return (
    <div style={FOOTER_STYLE}>
      {/* Progreso */}
      <div style={PROGRESS_STYLE}>
        Paso {stepNumber} / {total}
      </div>

      {/* Mensaje de error global */}
      {errorMessage && <div style={ERROR_STYLE}>⚠️ {errorMessage}</div>}

      {/* Acciones */}
      <div style={ACTIONS_STYLE}>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          style={{ ...BUTTON_GHOST, opacity: saving ? 0.5 : 1 }}
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={onPrevious}
          disabled={isFirst || saving}
          style={{ ...BUTTON_BASE, opacity: isFirst || saving ? 0.5 : 1 }}
        >
          ← Anterior
        </button>

        {!isLast && (
          <button
            type="button"
            onClick={onNext}
            disabled={saving}
            style={{ ...BUTTON_BASE, opacity: saving ? 0.5 : 1 }}
          >
            Siguiente →
          </button>
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={!canSave || saving}
          style={{
            ...BUTTON_PRIMARY,
            opacity: !canSave || saving ? 0.6 : 1,
            cursor:  !canSave || saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Guardando..." : isEditMode ? "Guardar cambios" : "Crear partner"}
        </button>
      </div>
    </div>
  );
}