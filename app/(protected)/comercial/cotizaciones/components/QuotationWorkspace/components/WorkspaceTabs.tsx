"use client";

import React from "react";
import { IconFileText, IconBoxes, IconHash, IconDownload } from "../../Icons";

// ═══════════════════════════════════════════════════════════════════
// WORKSPACE TABS — Navegación entre vistas del workspace
//
// 4 tabs ERP-grade:
//   1. Detalle      — Info cliente · vigencia · audit trail breve
//   2. Conceptos    — Parent + lines completos (vista enriquecida)
//   3. Totales      — Breakdown moneda · IVA · tipo cambio
//   4. PDF / Envío  — Preview + plantilla + opciones de envío
//
// Cada tab muestra contador opcional (ej: Conceptos · 5).
// ═══════════════════════════════════════════════════════════════════

export type WorkspaceTab = "detalle" | "conceptos" | "totales" | "pdf";

type TabConfig = {
  id: WorkspaceTab;
  label: string;
  icon: React.ReactNode;
  count?: number;
};

type Props = {
  active: WorkspaceTab;
  onChange: (tab: WorkspaceTab) => void;
  conceptsCount?: number;
  itemsCount?: number;
  isServices: boolean;
};

export default function WorkspaceTabs({
  active,
  onChange,
  conceptsCount = 0,
  itemsCount = 0,
  isServices,
}: Props) {
  const tabs: TabConfig[] = [
    {
      id: "detalle",
      label: "Detalle",
      icon: <IconFileText size={13} />,
    },
    {
      id: "conceptos",
      label: isServices ? "Conceptos" : "Productos",
      icon: <IconBoxes size={13} />,
      count: isServices ? conceptsCount : itemsCount,
    },
    {
      id: "totales",
      label: "Totales",
      icon: <IconHash size={13} />,
    },
    {
      id: "pdf",
      label: "PDF / Envío",
      icon: <IconDownload size={13} />,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: "0",
        borderBottom: "1px solid var(--color-border-faint)",
        background: "var(--color-bg-base)",
        padding: "0 14px",
        flexShrink: 0,
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: "10px 14px",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${isActive ? "var(--color-brand-blue)" : "transparent"}`,
              color: isActive ? "var(--color-brand-blue)" : "var(--color-text-muted)",
              fontSize: "12px",
              fontWeight: isActive ? 800 : 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "-1px",
              transition: "var(--transition-fast)",
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: "var(--radius-full)",
                  background: isActive ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
                  color: isActive ? "#fff" : "var(--color-text-muted)",
                  lineHeight: 1.4,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}