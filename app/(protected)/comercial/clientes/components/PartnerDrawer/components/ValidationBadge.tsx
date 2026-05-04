// ════════════════════════════════════════════════════════════════════════
// ValidationBadge — Indicador visual del estado de validación de un tab
// ════════════════════════════════════════════════════════════════════════
// Muestra un pequeño punto/icono al lado del nombre del tab para indicar:
//   - ✓ verde   → tab válido y completo
//   - ✗ rojo    → tab inválido (errores en campos required)
//   - •         → tab opcional sin completar (gris)
//   - vacío     → tab sin información de estado
// ════════════════════════════════════════════════════════════════════════
"use client";

import type { TabValidationState } from "../types";

export type ValidationBadgeProps = {
  state:    TabValidationState;
  required: boolean;
  size?:    "sm" | "md";
};

export function ValidationBadge({ state, required, size = "sm" }: ValidationBadgeProps) {
  const dim = size === "sm" ? 14 : 18;

  // Tab inválido (solo aplica si es required)
  if (required && !state.isValid) {
    return (
      <span
        title={state.errorMessage ?? "Campos obligatorios incompletos"}
        style={{
          display:        "inline-flex",
          alignItems:     "center",
          justifyContent: "center",
          width:          dim,
          height:         dim,
          borderRadius:   "50%",
          background:     "var(--color-danger-bg, rgba(239, 68, 68, 0.15))",
          color:          "var(--color-danger-text)",
          fontSize:       size === "sm" ? "9px" : "11px",
          fontWeight:     700,
          lineHeight:     1,
          flexShrink:     0,
        }}
      >
        !
      </span>
    );
  }

  // Tab válido y completo
  if (state.isValid && state.isComplete) {
    return (
      <span
        title="Completado"
        style={{
          display:        "inline-flex",
          alignItems:     "center",
          justifyContent: "center",
          width:          dim,
          height:         dim,
          borderRadius:   "50%",
          background:     "var(--color-success-bg, rgba(34, 197, 94, 0.15))",
          color:          "var(--color-success-text)",
          fontSize:       size === "sm" ? "9px" : "11px",
          fontWeight:     700,
          lineHeight:     1,
          flexShrink:     0,
        }}
      >
        ✓
      </span>
    );
  }

  // Tab opcional sin completar (no es error, solo informativo)
  return (
    <span
      title="Opcional — sin completar"
      style={{
        display:        "inline-block",
        width:          6,
        height:         6,
        borderRadius:   "50%",
        background:     "var(--color-text-muted)",
        opacity:        0.4,
        flexShrink:     0,
      }}
    />
  );
}