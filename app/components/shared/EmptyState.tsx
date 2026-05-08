"use client";

import React from "react";
import { IconInbox } from "./Icons";

// ═══════════════════════════════════════════════════════════════════
// EMPTY STATE — Estado vacío estandarizado nivel ERP
//
// Patrón Notion/Linear: ilustración + título + descripción + acción
// principal. Reutilizable en sidebars, tablas, drawers, modales.
//
// Uso típico:
//   <EmptyState
//     icon={<IconInbox size={32} />}
//     title="Sin cotizaciones"
//     description="Aún no hay cotizaciones en este filtro"
//     action={{ label: "Crear cotización", onClick: () => setShowCreate(true) }}
//   />
// ═══════════════════════════════════════════════════════════════════

type Props = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  size?: "sm" | "md";
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  size = "md",
}: Props) {
  const padding = size === "sm" ? "20px 12px" : "32px 16px";
  const titleSize = size === "sm" ? "12px" : "14px";
  const descSize = size === "sm" ? "10px" : "12px";

  return (
    <div
      style={{
        padding,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "8px",
      }}
    >
      {icon && (
        <div
          style={{
            color: "var(--color-text-muted)",
            opacity: 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon ?? <IconInbox size={32} />}
        </div>
      )}
      <div
        style={{
          fontSize: titleSize,
          fontWeight: 700,
          color: "var(--color-text-primary)",
        }}
      >
        {title}
      </div>
      {description && (
        <div
          style={{
            fontSize: descSize,
            color: "var(--color-text-muted)",
            lineHeight: 1.5,
            maxWidth: "280px",
          }}
        >
          {description}
        </div>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: "8px",
            height: "30px",
            padding: "0 14px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-brand-blue)",
            border: "1px solid var(--color-brand-blue)",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "var(--transition-fast)",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}