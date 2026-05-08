"use client";

import React, { useState } from "react";
import type { QuotationBillingConcept } from "../../../types/quotations.types";
import LineRow from "./LineRow";
import { IconChevronDown, IconChevronUp } from "@/app/components/shared/Icons";

// ═══════════════════════════════════════════════════════════════════
// CONCEPT CARD — Concepto de facturación parent + sus lines children
//
// Patrón SAP "Item parent/child":
//   El CFDI agrupa todo en UN concepto (lo que ve el cliente en su factura)
//   Internamente se desglosa en N detalles (lo que el equipo cotiza línea a línea)
//
// Card colapsable. Por defecto expandido. Header con métricas resumen,
// body con lista de LineRow para cada línea de detalle.
// ═══════════════════════════════════════════════════════════════════

type ConceptWithLines = QuotationBillingConcept & {
  lines?: any[];
};

type Props = {
  concept: ConceptWithLines;
  index: number;
  defaultExpanded?: boolean;
};

export default function ConceptCard({ concept, index, defaultExpanded = true }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const lines = concept.lines ?? [];
  const currency = concept.currency ?? "MXN";
  const symbol = currency === "USD" ? "USD $" : currency === "EUR" ? "€" : "$";

  // Cálculos del concepto
  const subtotal = lines.reduce((s: number, l: any) => s + Number(l.price ?? 0), 0);
  const tax = lines.reduce((s: number, l: any) => {
    const rate = l.tax_rate;
    if (rate === null || rate === undefined || rate === -1 || rate === 0) return s;
    return s + Number(l.price ?? 0) * (Number(rate) / 100);
  }, 0);
  const total = subtotal + tax;

  const fmt = (n: number) =>
    n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      style={{
        background: "var(--color-bg-base)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      {/* HEADER del concepto */}
      <button
        onClick={() => setExpanded((p) => !p)}
        style={{
          width: "100%",
          padding: "12px 14px",
          background: expanded ? "var(--color-bg-subtle)" : "transparent",
          border: "none",
          borderBottom: expanded ? "1px solid var(--color-border-faint)" : "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          transition: "var(--transition-fast)",
        }}
      >
        {/* Número de concepto */}
        <span
          style={{
            flexShrink: 0,
            width: "26px",
            height: "26px",
            borderRadius: "var(--radius-full)",
            background: "var(--color-info-bg)",
            border: "1px solid var(--color-info-border)",
            color: "var(--color-info-text)",
            fontSize: "11px",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {index + 1}
        </span>

        {/* Identificación del concepto */}
        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
          <div
            style={{
              fontSize: "9px",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "2px",
            }}
          >
            Concepto CFDI
          </div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {concept.description}
          </div>
          <div
            style={{
              marginTop: "4px",
              fontSize: "10px",
              color: "var(--color-text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontWeight: 700 }}>
              {lines.length} línea{lines.length !== 1 ? "s" : ""} de detalle
            </span>
            <span
              style={{
                padding: "1px 6px",
                borderRadius: "var(--radius-full)",
                background: "var(--color-bg-base)",
                border: "1px solid var(--color-border-faint)",
                color: "var(--color-text-second)",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.3px",
              }}
            >
              {currency}
            </span>
          </div>
        </div>

        {/* Total del concepto */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontSize: "9px",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "2px",
            }}
          >
            Total
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "var(--color-success-text)",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.1,
            }}
          >
            {symbol}
            {fmt(total)}
          </div>
          <div
            style={{
              fontSize: "9px",
              color: "var(--color-text-muted)",
              marginTop: "2px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Sub {symbol}
            {fmt(subtotal)} · IVA {symbol}
            {fmt(tax)}
          </div>
        </div>

        {/* Toggle expand/collapse */}
        <span
          style={{
            flexShrink: 0,
            width: "24px",
            height: "24px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-bg-base)",
            border: "1px solid var(--color-border-faint)",
            color: "var(--color-text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "var(--transition-fast)",
          }}
        >
          {expanded ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
        </span>
      </button>

      {/* BODY — líneas de detalle */}
      {expanded && (
        <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {lines.length === 0 ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "var(--color-text-muted)",
                fontSize: "11px",
              }}
            >
              Sin líneas de detalle
            </div>
          ) : (
            lines.map((line: any, idx: number) => (
              <LineRow key={line.id ?? idx} line={line} index={idx} />
            ))
          )}
        </div>
      )}
    </div>
  );
}