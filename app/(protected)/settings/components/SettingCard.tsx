"use client";

// ════════════════════════════════════════════════════════════════════════
// SETTINGCARD — Card reutilizable para el grid de configuración
// ════════════════════════════════════════════════════════════════════════
// Patrón ERP-grade: cada herramienta de configuración aparece como una
// card compacta dentro de su categoría. La card muestra un icono, título,
// descripción corta y un preview opcional (ej. el formato actual del folio).
//
// Click en cualquier parte de la card → invoca onClick para abrir el drawer
// con la configuración detallada. Soporta estados disabled (próximamente)
// para placeholders de funcionalidades pendientes.
// ════════════════════════════════════════════════════════════════════════

import type { CSSProperties, ReactNode } from "react";

export type SettingCardProps = {
  /** Icono del header (emoji o componente) */
  icon: ReactNode;
  /** Título corto de la herramienta. Ej: "Cotizaciones" */
  title: string;
  /** Descripción de una línea sobre lo que se configura */
  description: string;
  /** Valor preview opcional. Ej: "COT-2026-0008" */
  preview?: ReactNode;
  /** Etiqueta encima del preview. Ej: "FORMATO ACTUAL" */
  previewLabel?: string;
  /** Callback al hacer click en la card */
  onClick?: () => void;
  /** Si true, la card aparece atenuada con badge "Próximamente" */
  comingSoon?: boolean;
  /** Si true, aplica estilos de sección activa (drawer abierto) */
  active?: boolean;
};

export default function SettingCard({
  icon,
  title,
  description,
  preview,
  previewLabel = "VALOR ACTUAL",
  onClick,
  comingSoon = false,
  active = false,
}: SettingCardProps) {
  const cardStyle: CSSProperties = {
    position:        "relative",
    display:         "flex",
    flexDirection:   "column",
    gap:             "12px",
    padding:         "20px",
    borderRadius:    "14px",
    border:          active
      ? "1.5px solid var(--accent, #2563eb)"
      : "1px solid var(--border-subtle, rgba(148,163,184,0.15))",
    background:      active
      ? "var(--surface-active, rgba(37,99,235,0.06))"
      : "var(--surface, var(--bg-elevated, #ffffff))",
    cursor:          comingSoon ? "default" : "pointer",
    transition:      "all 160ms ease",
    opacity:         comingSoon ? 0.65 : 1,
    minHeight:       "150px",
    boxShadow:       active
      ? "0 4px 12px rgba(37,99,235,0.10)"
      : "0 1px 3px rgba(15,23,42,0.04)",
  };

  const handleClick = () => {
    if (comingSoon) return;
    onClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (comingSoon) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={comingSoon ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={cardStyle}
      onMouseEnter={(e) => {
        if (comingSoon) return;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(15,23,42,0.10)";
      }}
      onMouseLeave={(e) => {
        if (comingSoon) return;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = active
          ? "0 4px 12px rgba(37,99,235,0.10)"
          : "0 1px 3px rgba(15,23,42,0.04)";
      }}
    >
      {/* Badge "Próximamente" */}
      {comingSoon && (
        <span
          style={{
            position:     "absolute",
            top:          "12px",
            right:        "12px",
            padding:      "3px 9px",
            borderRadius: "999px",
            background:   "rgba(245,158,11,0.12)",
            color:        "#b45309",
            fontSize:     "10px",
            fontWeight:   600,
            letterSpacing:"0.04em",
            textTransform:"uppercase",
          }}
        >
          Próximamente
        </span>
      )}

      {/* Header: icono + título */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width:           "36px",
            height:          "36px",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            borderRadius:    "10px",
            background:      "var(--surface-soft, rgba(148,163,184,0.10))",
            fontSize:        "18px",
            flexShrink:      0,
          }}
        >
          {icon}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div
            style={{
              fontSize:    "15px",
              fontWeight:  600,
              color:       "var(--fg, #0f172a)",
              lineHeight:  1.2,
            }}
          >
            {title}
          </div>
        </div>
      </div>

      {/* Descripción */}
      <p
        style={{
          margin:     0,
          fontSize:   "13px",
          color:      "var(--fg-muted, #64748b)",
          lineHeight: 1.4,
          flex:       1,
        }}
      >
        {description}
      </p>

      {/* Preview opcional */}
      {preview !== undefined && (
        <div
          style={{
            paddingTop:   "10px",
            borderTop:    "1px dashed var(--border-subtle, rgba(148,163,184,0.20))",
          }}
        >
          <div
            style={{
              fontSize:      "10px",
              fontWeight:    600,
              letterSpacing: "0.06em",
              color:         "var(--fg-faint, #94a3b8)",
              textTransform: "uppercase",
              marginBottom:  "4px",
            }}
          >
            {previewLabel}
          </div>
          <div
            style={{
              fontSize:    "13px",
              fontFamily:  "ui-monospace, 'SF Mono', Menlo, monospace",
              color:       "var(--fg, #0f172a)",
              fontWeight:  500,
            }}
          >
            {preview}
          </div>
        </div>
      )}
    </div>
  );
}