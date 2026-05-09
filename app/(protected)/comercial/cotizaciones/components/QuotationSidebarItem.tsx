"use client";

import React, { memo } from "react";
import type { Quotation } from "../types/quotations.types";
import StatusBadge from "./QuotationWorkspace/components/StatusBadge";
import { IconBoxes, IconTruck } from "./Icons";
import { computeTotalsByCurrency } from "../utils/computeTotalsByCurrency";

// ═══════════════════════════════════════════════════════════════════
// QUOTATION SIDEBAR ITEM — Card compacto del sidebar (BULLET-PROOF)
//
// REGLAS ANTI-OVERFLOW (críticas para no causar scroll horizontal en
// el sidebar virtualizado):
//   1. Card: width:100%, boxSizing:border-box, overflow:hidden
//   2. Filas flex: minWidth:0 en hijos elásticos (permite ellipsis)
//   3. Texto largo: overflow:hidden + textOverflow:ellipsis +
//      whiteSpace:nowrap
//   4. Elementos fijos (icon, badge, totales): flexShrink:0
//   5. Sin paddingLeft fijo en filas que cargan contenido variable —
//      usa el ancho del flex nativo
//
// Los anchos de USD/MXN largos JAMÁS deben empujar el badge ni
// causar scroll horizontal. Layout testeado en 280–360 px.
// ═══════════════════════════════════════════════════════════════════

type Props = {
  quotation: Quotation;
  isSelected: boolean;
};

function QuotationSidebarItem({ quotation, isSelected }: Props) {
  const isServices = quotation.type === "services";
  const subtype = (quotation as any).service_subtype as string | undefined;
  const clientName =
    (quotation as any).client?.name ?? quotation.client_name ?? "—";
  const totals = computeTotalsByCurrency(quotation);
  const totalEntries = Object.entries(totals).filter(([, v]) => v > 0);

  return (
    <div
      style={{
        // ── ANTI-OVERFLOW core ──
        width:        "100%",
        boxSizing:    "border-box",
        overflow:     "hidden",
        // ── visual ──
        padding:      "8px 11px",
        borderRadius: "var(--radius-md)",
        background:   isSelected
          ? "var(--color-bg-active)"
          : "var(--color-bg-subtle)",
        border:       isSelected
          ? "1px solid var(--color-brand-blue)"
          : "1px solid var(--color-border-faint)",
        display:      "flex",
        flexDirection:"column",
        gap:          "3px",
        transition:   "var(--transition-fast)",
        height:       "calc(100% - 5px)",
      }}
    >
      {/* ROW 1 — icono · folio+cliente · status badge */}
      <div
        style={{
          display:    "flex",
          alignItems: "center",
          gap:        "8px",
          minWidth:   0, // permite que los hijos se truncen
          width:      "100%",
        }}
      >
        {/* Icono fijo */}
        <div
          style={{
            width:        "24px",
            height:       "24px",
            borderRadius: "var(--radius-sm)",
            flexShrink:   0,
            background:   isServices
              ? "var(--color-info-bg)"
              : "var(--color-success-bg)",
            border:       isServices
              ? "1px solid var(--color-info-border)"
              : "1px solid var(--color-success-border)",
            color:        isServices
              ? "var(--color-info-text)"
              : "var(--color-success-text)",
            display:      "flex",
            alignItems:   "center",
            justifyContent:"center",
          }}
        >
          {isServices ? <IconTruck size={12} /> : <IconBoxes size={12} />}
        </div>

        {/* Folio + cliente — flexible con minWidth:0 para ellipsis */}
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <div
            style={{
              fontSize:           "11px",
              fontWeight:         700,
              color:              "var(--color-text-primary)",
              overflow:           "hidden",
              textOverflow:       "ellipsis",
              whiteSpace:         "nowrap",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {quotation.quote_number}
          </div>
          <div
            style={{
              fontSize:     "10px",
              color:        "var(--color-text-muted)",
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
            }}
          >
            {clientName}
          </div>
        </div>

        {/* Status badge — NUNCA se achica ni se empuja */}
        <div style={{ flexShrink: 0 }}>
          <StatusBadge status={quotation.status} size="sm" />
        </div>
      </div>

      {/* ROW 2 — subtipo (solo services) — SIEMPRE visible */}
      {isServices && subtype && (
        <div
          style={{
            paddingLeft:  "32px",
            overflow:     "hidden",
            whiteSpace:   "nowrap",
            textOverflow: "ellipsis",
            flexShrink:   0, // garantiza que NO sea colapsado
          }}
        >
          <span
            style={{
              fontSize:      "8px",
              fontWeight:    700,
              color:         "var(--color-info-text)",
              background:    "var(--color-info-bg)",
              padding:       "1px 6px",
              borderRadius:  "var(--radius-full)",
              border:        "1px solid var(--color-info-border)",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              whiteSpace:    "nowrap",
            }}
          >
            {subtype.replace(/_/g, " ")}
          </span>
        </div>
      )}

      {/* ROW 3 — fecha (truncable) · totales (inline, nowrap) */}
      <div
        style={{
          display:      "flex",
          alignItems:   "center",
          fontSize:     "10px",
          paddingLeft:  "32px",
          gap:          "8px",
          minWidth:     0,
          width:        "100%",
          flexShrink:   0,
        }}
      >
        {/* Fecha — flexible, se trunca si no cabe */}
        <span
          style={{
            flex:         1,
            minWidth:     0,
            overflow:     "hidden",
            textOverflow: "ellipsis",
            whiteSpace:   "nowrap",
            color:        "var(--color-text-muted)",
          }}
        >
          {formatShortDate(quotation.created_at)}
          {quotation.valid_until &&
            ` → ${formatShortDate(quotation.valid_until)}`}
        </span>

        {/* Totales — todas las monedas en UNA línea separadas por gap */}
        <div
          style={{
            display:    "flex",
            flexDirection: "row",
            alignItems: "center",
            gap:        "6px",
            flexShrink: 0,
            maxWidth:   "65%",
            overflow:   "hidden",
          }}
        >
          {totalEntries.length > 0 ? (
            totalEntries.map(([cur, val]) => (
              <span
                key={cur}
                style={{
                  fontWeight:         700,
                  color:              "var(--color-success-text)",
                  fontVariantNumeric: "tabular-nums",
                  fontSize:           "10px",
                  whiteSpace:         "nowrap",
                  flexShrink:         0,
                }}
              >
                {cur !== "MXN" && (
                  <span
                    style={{
                      fontSize:    "9px",
                      opacity:     0.7,
                      marginRight: "3px",
                    }}
                  >
                    {cur}
                  </span>
                )}
                {formatCompactAmount(val)}
              </span>
            ))
          ) : (
            <span style={{ color: "var(--color-text-muted)" }}>—</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS de formato — anti-overflow
// ═══════════════════════════════════════════════════════════════════

// Fecha corta sin "de" (ej: "29 abr" en vez de "29 de abril")
function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-MX", {
      day:   "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

// Monto compacto: $1,234 / $12K / $1.2M / $1.5B según magnitud.
// Evita que totales grandes (ej: $1,234,567) empujen el badge.
function formatCompactAmount(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 10_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
}

// Memo: solo re-renderiza cuando cambia la cotización o su selección
export default memo(QuotationSidebarItem, (prev, next) => {
  return (
    prev.quotation.id === next.quotation.id &&
    prev.quotation.updated_at === next.quotation.updated_at &&
    prev.quotation.status === next.quotation.status &&
    prev.isSelected === next.isSelected
  );
});