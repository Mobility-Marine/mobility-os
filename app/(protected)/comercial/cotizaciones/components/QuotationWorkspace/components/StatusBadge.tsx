"use client";

import React from "react";
import type { QuotationStatus } from "../../../types/quotations.types";

// ═══════════════════════════════════════════════════════════════════
// STATUS BADGE — Badge estandarizado para cotizaciones
// Patrón ERP: colores semánticos consistentes en toda la UI.
// ═══════════════════════════════════════════════════════════════════

const STATUS_COLORS: Record<QuotationStatus, { bg: string; border: string; color: string; label: string }> = {
  draft: {
    bg: "var(--color-warning-bg)",
    border: "var(--color-warning-border)",
    color: "var(--color-warning-text)",
    label: "Borrador",
  },
  sent: {
    bg: "var(--color-info-bg)",
    border: "var(--color-info-border)",
    color: "var(--color-info-text)",
    label: "Enviada",
  },
  viewed: {
    bg: "var(--color-info-bg)",
    border: "var(--color-info-border)",
    color: "var(--color-info-text)",
    label: "Vista",
  },
  accepted: {
    bg: "var(--color-success-bg)",
    border: "var(--color-success-border)",
    color: "var(--color-success-text)",
    label: "Aceptada",
  },
  rejected: {
    bg: "var(--color-danger-bg)",
    border: "var(--color-danger-border)",
    color: "var(--color-danger-text)",
    label: "Rechazada",
  },
  expired: {
    bg: "var(--color-bg-subtle)",
    border: "var(--color-border)",
    color: "var(--color-text-muted)",
    label: "Expirada",
  },
  cancelled: {
    bg: "var(--color-bg-subtle)",
    border: "var(--color-border)",
    color: "var(--color-text-muted)",
    label: "Cancelada",
  },
};

type Props = {
  status: QuotationStatus;
  size?: "sm" | "md" | "lg";
  customLabel?: string;
};

export default function StatusBadge({ status, size = "md", customLabel }: Props) {
  const cfg = STATUS_COLORS[status] ?? STATUS_COLORS.draft;
  const dimensions = {
    sm: { padding: "2px 6px", fontSize: "8px" },
    md: { padding: "3px 8px", fontSize: "9px" },
    lg: { padding: "4px 10px", fontSize: "10px" },
  }[size];

  return (
    <span
      style={{
        ...dimensions,
        borderRadius: "var(--radius-full)",
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.4px",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {customLabel ?? cfg.label}
    </span>
  );
}