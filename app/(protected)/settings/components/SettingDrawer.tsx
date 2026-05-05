"use client";

// ════════════════════════════════════════════════════════════════════════
// SETTINGDRAWER — Drawer lateral reutilizable para configuración detallada
// ════════════════════════════════════════════════════════════════════════
// Patrón ERP-grade: cada card de Settings abre este drawer del lado derecho
// con la configuración específica de la herramienta. Mismo patrón visual
// que PartnerDrawer (ya implementado en /comercial/partners) para mantener
// consistencia en toda la plataforma.
//
// Estructura:
//   - Header sticky con título + descripción + botón cerrar
//   - Body scrollable (children)
//   - Footer sticky con botones de acción (cancelar/guardar)
//
// El drawer tiene 3 anchos predefinidos: sm (380px), md (520px), lg (720px).
// La mayoría de cards usan md. Solo casos complejos (CFDI series con múltiples
// columnas) requieren lg.
// ════════════════════════════════════════════════════════════════════════

import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";

export type SettingDrawerSize = "sm" | "md" | "lg";

export type SettingDrawerProps = {
  /** Si true, el drawer está abierto */
  open: boolean;
  /** Callback al cerrar (X, Escape, click en overlay) */
  onClose: () => void;
  /** Título principal del drawer */
  title: string;
  /** Subtítulo / descripción debajo del título */
  description?: string;
  /** Icono decorativo en el header */
  icon?: ReactNode;
  /** Contenido principal del drawer */
  children: ReactNode;
  /** Botones / acciones del footer (opcional) */
  footer?: ReactNode;
  /** Ancho del drawer. Default: "md" */
  size?: SettingDrawerSize;
  /** Si true, mientras se está guardando se atenúa el body */
  saving?: boolean;
};

const SIZE_TO_WIDTH: Record<SettingDrawerSize, string> = {
  sm: "380px",
  md: "560px",
  lg: "780px",
};

export default function SettingDrawer({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size  = "md",
  saving = false,
}: SettingDrawerProps) {
  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  // ── Estilos ──────────────────────────────────────────────────────────

  const overlayStyle: CSSProperties = {
    position:       "fixed",
    inset:          0,
    background:     "rgba(15,23,42,0.45)",
    backdropFilter: "blur(2px)",
    zIndex:         1000,
    animation:      "settingDrawerFadeIn 180ms ease",
  };

  const drawerStyle: CSSProperties = {
    position:        "fixed",
    top:             0,
    right:           0,
    bottom:          0,
    width:           SIZE_TO_WIDTH[size],
    maxWidth:        "100vw",
    background:      "var(--bg-elevated, #ffffff)",
    boxShadow:       "-12px 0 40px rgba(15,23,42,0.18)",
    zIndex:          1001,
    display:         "flex",
    flexDirection:   "column",
    animation:       "settingDrawerSlideIn 220ms cubic-bezier(0.32,0.72,0.20,1)",
  };

  const headerStyle: CSSProperties = {
    display:        "flex",
    alignItems:     "flex-start",
    gap:            "14px",
    padding:        "20px 24px",
    borderBottom:   "1px solid var(--border-subtle, rgba(148,163,184,0.15))",
    flexShrink:     0,
  };

  const bodyStyle: CSSProperties = {
    flex:           1,
    overflowY:      "auto",
    padding:        "24px",
    opacity:        saving ? 0.6 : 1,
    pointerEvents:  saving ? "none" : "auto",
    transition:     "opacity 160ms",
  };

  const footerStyle: CSSProperties = {
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "flex-end",
    gap:             "10px",
    padding:         "16px 24px",
    borderTop:       "1px solid var(--border-subtle, rgba(148,163,184,0.15))",
    background:      "var(--surface-soft, rgba(148,163,184,0.04))",
    flexShrink:      0,
  };

  return (
    <>
      {/* Animaciones inline para no requerir CSS externo */}
      <style>{`
        @keyframes settingDrawerFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes settingDrawerSlideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      {/* Overlay (click para cerrar) */}
      <div style={overlayStyle} onClick={onClose} aria-hidden />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="setting-drawer-title"
        style={drawerStyle}
      >
        {/* Header */}
        <header style={headerStyle}>
          {icon !== undefined && (
            <div
              style={{
                width:          "44px",
                height:         "44px",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                borderRadius:   "12px",
                background:     "var(--surface-soft, rgba(148,163,184,0.10))",
                fontSize:       "22px",
                flexShrink:     0,
              }}
            >
              {icon}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id="setting-drawer-title"
              style={{
                margin:     0,
                fontSize:   "17px",
                fontWeight: 600,
                color:      "var(--fg, #0f172a)",
                lineHeight: 1.3,
              }}
            >
              {title}
            </h2>
            {description && (
              <p
                style={{
                  margin:     "4px 0 0",
                  fontSize:   "13px",
                  color:      "var(--fg-muted, #64748b)",
                  lineHeight: 1.4,
                }}
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar"
            style={{
              border:         "none",
              background:     "transparent",
              cursor:         saving ? "not-allowed" : "pointer",
              padding:        "6px",
              borderRadius:   "8px",
              color:          "var(--fg-muted, #64748b)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              transition:     "background 120ms",
              flexShrink:     0,
            }}
            onMouseEnter={(e) => {
              if (saving) return;
              e.currentTarget.style.background = "var(--surface-hover, rgba(148,163,184,0.10))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6"  y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {/* Body scrollable */}
        <div style={bodyStyle}>{children}</div>

        {/* Footer (opcional) */}
        {footer && <footer style={footerStyle}>{footer}</footer>}
      </aside>
    </>
  );
}