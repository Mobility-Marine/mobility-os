"use client";

import React from "react";
import type { Quotation } from "../../../types/quotations.types";
import StatusBadge from "./StatusBadge";
import CurrencyAmount from "./CurrencyAmount";
import { IconCalendar, IconUser, IconBoxes, IconTruck } from "../../Icons";

// ═══════════════════════════════════════════════════════════════════
// WORKSPACE HEADER — Cabecera del workspace nivel ERP
//
// Layout horizontal (estilo Salesforce Lightning):
//   Folio + StatusBadge + Tipo badge   |   Total grande
//   Cliente · RFC · Vigencia           |   Subtotal/IVA
//
// Diseñado para que el usuario tenga TODA la info crítica visible
// al primer vistazo, sin cambiar de tab.
// ═══════════════════════════════════════════════════════════════════

type Props = {
  quotation: Quotation;
};

// Calcula totales por moneda (parent concepts + lines, o items)
function getTotalsByCurrency(q: Quotation): {
  subtotal: Record<string, number>;
  tax: Record<string, number>;
  total: Record<string, number>;
} {
  const subtotal: Record<string, number> = {};
  const tax: Record<string, number> = {};
  const total: Record<string, number> = {};

  const concepts = (q as any).billing_concepts ?? [];
  const items = q.items ?? [];

  if (concepts.length > 0) {
    for (const c of concepts) {
      for (const line of c.lines ?? []) {
        const cur = line.currency ?? c.currency ?? q.currency ?? "MXN";
        const price = Number(line.price ?? 0);
        const rate = line.tax_rate;
        const lineTax =
          rate === null || rate === undefined || rate === -1 || rate === 0
            ? 0
            : price * (rate / 100);
        subtotal[cur] = (subtotal[cur] ?? 0) + price;
        tax[cur] = (tax[cur] ?? 0) + lineTax;
        total[cur] = (total[cur] ?? 0) + price + lineTax;
      }
    }
  } else if (items.length > 0) {
    const cur = q.currency ?? "MXN";
    for (const i of items) {
      const lineSubtotal = Number(i.unit_price ?? 0) * Number(i.quantity ?? 0);
      const discount = (lineSubtotal * Number(i.discount_pct ?? 0)) / 100;
      subtotal[cur] = (subtotal[cur] ?? 0) + (lineSubtotal - discount);
    }
    const rate = Number(q.tax_rate ?? 16);
    tax[cur] = (subtotal[cur] ?? 0) * (rate / 100);
    total[cur] = (subtotal[cur] ?? 0) + (tax[cur] ?? 0);
  } else {
    const cur = q.currency ?? "MXN";
    subtotal[cur] = q.subtotal ?? 0;
    tax[cur] = q.tax_amount ?? 0;
    total[cur] = q.total ?? 0;
  }

  return { subtotal, tax, total };
}

export default function WorkspaceHeader({ quotation }: Props) {
  const { subtotal, tax, total } = getTotalsByCurrency(quotation);
  const isServices = quotation.type === "services";
  const subtype = (quotation as any).service_subtype as string | undefined;
  const clientName = quotation.client?.name ?? quotation.client_name ?? "Sin cliente";
  const clientRfc = quotation.client?.rfc ?? quotation.client_rfc;
  const validUntil = quotation.valid_until;

  // Días hasta vencimiento
  const daysToExpire = validUntil
    ? Math.ceil((new Date(validUntil).getTime() - Date.now()) / 86400000)
    : null;

  const expirationStatus =
    daysToExpire === null
      ? null
      : daysToExpire < 0
        ? { color: "var(--color-danger-text)", label: `Vencida hace ${Math.abs(daysToExpire)}d` }
        : daysToExpire === 0
          ? { color: "var(--color-warning-text)", label: "Vence hoy" }
          : daysToExpire <= 3
            ? { color: "var(--color-warning-text)", label: `Vence en ${daysToExpire}d` }
            : { color: "var(--color-text-muted)", label: `Vigente ${daysToExpire}d` };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "20px",
        padding: "14px 18px",
        background: "var(--color-bg-base)",
        borderBottom: "1px solid var(--color-border-faint)",
        flexWrap: "wrap",
      }}
    >
      {/* COLUMNA IZQUIERDA — Identificación */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0, flex: 1 }}>
        {/* Línea 1 — Folio + Status + Tipo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.3px",
            }}
          >
            {quotation.quote_number}
          </span>
          <StatusBadge status={quotation.status} size="md" />
          <TypeBadge isServices={isServices} subtype={subtype} />
        </div>

        {/* Línea 2 — Cliente + RFC + Vigencia */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            fontSize: "11px",
            color: "var(--color-text-second)",
            flexWrap: "wrap",
          }}
        >
          <InfoChip
            icon={<IconUser size={12} />}
            label={clientName}
            sub={clientRfc ?? undefined}
          />
          {validUntil && (
            <InfoChip
              icon={<IconCalendar size={12} />}
              label={new Date(validUntil).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              sub={expirationStatus?.label}
              subColor={expirationStatus?.color}
            />
          )}
        </div>
      </div>

      {/* COLUMNA DERECHA — Totales */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "4px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: "9px",
            fontWeight: 700,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
          }}
        >
          Total
        </div>
        <CurrencyAmount
          amounts={total}
          size="xl"
          color="var(--color-success-text)"
          align="right"
          showCurrencyLabel={Object.keys(total).length > 1}
        />
        <div
          style={{
            fontSize: "10px",
            color: "var(--color-text-muted)",
            display: "flex",
            gap: "10px",
            marginTop: "2px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            Sub:{" "}
            {Object.entries(subtotal)
              .filter(([, v]) => v > 0)
              .map(
                ([cur, v]) =>
                  `${cur === "MXN" ? "$" : cur + " $"}${v.toLocaleString("es-MX", {
                    maximumFractionDigits: 0,
                  })}`,
              )
              .join(" · ")}
          </span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            IVA:{" "}
            {Object.entries(tax)
              .filter(([, v]) => v > 0)
              .map(
                ([cur, v]) =>
                  `${cur === "MXN" ? "$" : cur + " $"}${v.toLocaleString("es-MX", {
                    maximumFractionDigits: 0,
                  })}`,
              )
              .join(" · ") || "$0"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function TypeBadge({
  isServices,
  subtype,
}: {
  isServices: boolean;
  subtype?: string;
}) {
  return (
    <span
      style={{
        fontSize: "9px",
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: "var(--radius-full)",
        background: isServices ? "var(--color-info-bg)" : "var(--color-success-bg)",
        color: isServices ? "var(--color-info-text)" : "var(--color-success-text)",
        border: `1px solid ${isServices ? "var(--color-info-border)" : "var(--color-success-border)"}`,
        textTransform: "uppercase",
        letterSpacing: "0.3px",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {isServices ? <IconTruck size={10} /> : <IconBoxes size={10} />}
      {isServices && subtype ? subtype.replace(/_/g, " ") : isServices ? "Servicios" : "Productos"}
    </span>
  );
}

function InfoChip({
  icon,
  label,
  sub,
  subColor,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
      <span style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>{icon}</span>
      <span
        style={{
          fontWeight: 600,
          color: "var(--color-text-primary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      {sub && (
        <span style={{ color: subColor ?? "var(--color-text-muted)", fontWeight: 600 }}>
          · {sub}
        </span>
      )}
    </div>
  );
}