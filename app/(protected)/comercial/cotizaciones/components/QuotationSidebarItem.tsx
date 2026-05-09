"use client";

import React, { memo } from "react";
import type { Quotation } from "../types/quotations.types";
import StatusBadge from "./QuotationWorkspace/components/StatusBadge";
import { IconBoxes, IconTruck } from "./Icons";
import { computeTotalsByCurrency } from "../utils/computeTotalsByCurrency";

// ═══════════════════════════════════════════════════════════════════
// QUOTATION SIDEBAR ITEM — Card compacto del sidebar
//
// Layout 3 filas (~80 px de altura):
//   Fila 1: icono · folio + cliente · status badge
//   Fila 2: subtipo (solo services) — opcional
//   Fila 3: fecha range · totales por moneda
//
// MEMO: este componente se memoriza para que React no re-renderice
// cards en el viewport cuando otras cards entran/salen del viewport
// durante el scroll virtualizado.
//
// Totales: usa el helper centralizado `computeTotalsByCurrency` para
// consistencia con KPIs y filtros.
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
        padding: "9px 11px",
        borderRadius: "var(--radius-md)",
        background: isSelected
          ? "var(--color-bg-active)"
          : "var(--color-bg-subtle)",
        border: isSelected
          ? "1px solid var(--color-brand-blue)"
          : "1px solid var(--color-border-faint)",
        display: "grid",
        gap: "4px",
        transition: "var(--transition-fast)",
        height: "calc(100% - 5px)",
        boxSizing: "border-box",
      }}
    >
      {/* ROW 1 — icono + folio/cliente + status */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "var(--radius-sm)",
            flexShrink: 0,
            background: isServices
              ? "var(--color-info-bg)"
              : "var(--color-success-bg)",
            border: isServices
              ? "1px solid var(--color-info-border)"
              : "1px solid var(--color-success-border)",
            color: isServices
              ? "var(--color-info-text)"
              : "var(--color-success-text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isServices ? <IconTruck size={12} /> : <IconBoxes size={12} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {quotation.quote_number}
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "var(--color-text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {clientName}
          </div>
        </div>
        {/* flexShrink: 0 garantiza que el badge NUNCA se achique ni se
            empuje por nombres largos de cliente (bug ellipsis ERP). */}
        <div style={{ flexShrink: 0 }}>
          <StatusBadge status={quotation.status} size="sm" />
        </div>
      </div>

      {/* ROW 2 — subtipo (solo services) */}
      {isServices && subtype && (
        <div style={{ paddingLeft: "32px" }}>
          <span
            style={{
              fontSize: "8px",
              fontWeight: 700,
              color: "var(--color-info-text)",
              background: "var(--color-info-bg)",
              padding: "1px 6px",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--color-info-border)",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            {subtype.replace(/_/g, " ")}
          </span>
        </div>
      )}

      {/* ROW 3 — fechas + totales por moneda */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontSize: "10px",
          paddingLeft: "32px",
        }}
      >
        <span style={{ color: "var(--color-text-muted)" }}>
          {new Date(quotation.created_at).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
          })}
          {quotation.valid_until &&
            ` → ${new Date(quotation.valid_until).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "short",
            })}`}
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "1px",
          }}
        >
          {totalEntries.length > 0 ? (
            totalEntries.map(([cur, val]) => (
              <span
                key={cur}
                style={{
                  fontWeight: 700,
                  color: "var(--color-success-text)",
                  fontVariantNumeric: "tabular-nums",
                  fontSize: "10px",
                }}
              >
                {cur !== "MXN" && (
                  <span
                    style={{
                      fontSize: "9px",
                      opacity: 0.7,
                      marginRight: "2px",
                    }}
                  >
                    {cur}
                  </span>
                )}
                $
                {val.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
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

// Memo: solo re-renderiza cuando cambia la cotización o su estado de selección
export default memo(QuotationSidebarItem, (prev, next) => {
  return (
    prev.quotation.id === next.quotation.id &&
    prev.quotation.updated_at === next.quotation.updated_at &&
    prev.quotation.status === next.quotation.status &&
    prev.isSelected === next.isSelected
  );
});