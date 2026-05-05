// ════════════════════════════════════════════════════════════════════════
// Field — Componente helper para formularios del PartnerDrawer
// ════════════════════════════════════════════════════════════════════════
// Wrapper estándar de cada campo:
//   - Label en mayúsculas con asterisco si required
//   - Hint opcional debajo del label
//   - Error inline si hay validación fallida
//   - Children (input, select, textarea, lo que sea)
// ════════════════════════════════════════════════════════════════════════
"use client";

import type { CSSProperties, ReactNode } from "react";

// ── Estilos base reutilizables ────────────────────────────────────────
export const FIELD_INPUT: CSSProperties = {
  width:       "100%",
  height:      "36px",
  padding:     "0 12px",
  borderRadius: "var(--radius-md)",
  border:      "1px solid var(--color-border)",
  background:  "var(--color-bg-subtle)",
  color:       "var(--color-text-primary)",
  fontSize:    "13px",
  outline:     "none",
  boxSizing:   "border-box",
};

export const FIELD_SELECT: CSSProperties = {
  ...FIELD_INPUT,
  cursor: "pointer",
};

export const FIELD_TEXTAREA: CSSProperties = {
  ...FIELD_INPUT,
  height:     "auto",
  minHeight:  "72px",
  padding:    "8px 12px",
  resize:     "vertical",
  fontFamily: "inherit",
};

// ── Props ─────────────────────────────────────────────────────────────
export type FieldProps = {
  label:     string;
  required?: boolean;
  hint?:     string;
  error?:    string;
  children:  ReactNode;
  /** Ancho de la columna en grid (1=full, 2=half, 3=third...) */
  span?:     1 | 2 | 3 | 4;
};

// ── Componente ────────────────────────────────────────────────────────
export function Field({ label, required, hint, error, children, span = 1 }: FieldProps) {
  return (
    <div style={{ gridColumn: `span ${span}`, minWidth: 0 }}>
      <div
        style={{
          fontSize:       "11px",
          fontWeight:     600,
          color:          "var(--color-text-muted)",
          marginBottom:   "5px",
          textTransform:  "uppercase",
          letterSpacing:  "0.5px",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--color-danger-text)", marginLeft: "3px" }}>
            *
          </span>
        )}
      </div>

      {children}

      {hint && !error && (
        <div
          style={{
            fontSize:    "11px",
            color:       "var(--color-text-muted)",
            marginTop:   "4px",
            lineHeight:  1.4,
          }}
        >
          {hint}
        </div>
      )}

      {error && (
        <div
          style={{
            fontSize:    "11px",
            color:       "var(--color-danger-text)",
            marginTop:   "4px",
            lineHeight:  1.4,
            fontWeight:  500,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

// ── SectionTitle (helper para encabezados dentro de tabs) ────────────
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        gridColumn:     "1 / -1",
        fontSize:       "12px",
        fontWeight:     700,
        color:          "var(--color-text-primary)",
        textTransform:  "uppercase",
        letterSpacing:  "0.6px",
        marginTop:      "8px",
        marginBottom:   "4px",
        paddingBottom:  "6px",
        borderBottom:   "1px solid var(--color-border)",
      }}
    >
      {children}
    </div>
  );
}

// ── Grid wrapper para campos (12-column responsive) ─────────────────
export function FieldGrid({
  children,
  columns = 4,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 6;
}) {
  return (
    <div
      style={{
        display:             "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap:                 "14px 16px",
      }}
    >
      {children}
    </div>
  );
}
