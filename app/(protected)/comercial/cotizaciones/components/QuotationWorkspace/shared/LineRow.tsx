"use client";

import React from "react";
import type { QuotationService } from "../../../types/quotations.types";
import { IconArrowRight } from "../../Icons";

// ═══════════════════════════════════════════════════════════════════
// LINE ROW — Línea de detalle ERP-grade (children de un concepto)
//
// Patrón SAP/Oracle: muestra cantidad · unidad · precio unitario ·
// subtotal · IVA · total línea, con notas expandibles.
//
// Diseño jerárquico: descripción primaria + ruta secundaria + métricas
// numéricas alineadas a la derecha (tabular-nums).
// ═══════════════════════════════════════════════════════════════════

type Props = {
  line: QuotationService;
  index: number;
  showRoute?: boolean; // mostrar origen → destino
};

export default function LineRow({ line, index, showRoute = true }: Props) {
  const currency = line.currency ?? "MXN";
  const symbol = currency === "USD" ? "USD $" : currency === "EUR" ? "€" : "$";

  // Cálculos
  const quantity = Number(line.quantity ?? 1);
  const unitPrice = Number(line.unit_price ?? line.price ?? 0);
  const lineSubtotal = Number(line.price ?? quantity * unitPrice);
  const taxRate = line.tax_rate;
  const tax =
    taxRate === null || taxRate === undefined || taxRate === -1 || taxRate === 0
      ? 0
      : lineSubtotal * (Number(taxRate) / 100);
  const lineTotal = lineSubtotal + tax;

  const fmt = (n: number) =>
    n.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const taxLabel =
    taxRate === null || taxRate === undefined || taxRate === -1
      ? "Exento"
      : Number(taxRate) === 0
        ? "0%"
        : `${taxRate}%`;

  return (
    <div
      style={{
        padding: "10px 12px",
        background: "var(--color-bg-base)",
        border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-md)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {/* HEADER — número + descripción + total línea */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", flex: 1, minWidth: 0 }}>
          <span
            style={{
              flexShrink: 0,
              width: "22px",
              height: "22px",
              borderRadius: "var(--radius-full)",
              background: "var(--color-bg-subtle)",
              border: "1px solid var(--color-border-faint)",
              color: "var(--color-text-muted)",
              fontSize: "10px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {index + 1}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                lineHeight: 1.4,
                wordBreak: "break-word",
              }}
            >
              {line.description}
            </div>
            {showRoute && (line.origin || line.destination) && (
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "10px",
                  color: "var(--color-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexWrap: "wrap",
                }}
              >
                {line.origin && <span style={{ fontWeight: 600 }}>{line.origin}</span>}
                {line.origin && line.destination && (
                  <IconArrowRight size={10} strokeWidth={2.5} />
                )}
                {line.destination && <span style={{ fontWeight: 600 }}>{line.destination}</span>}
                {line.incoterm && (
                  <span
                    style={{
                      padding: "1px 6px",
                      borderRadius: "var(--radius-full)",
                      background: "var(--color-info-bg)",
                      border: "1px solid var(--color-info-border)",
                      color: "var(--color-info-text)",
                      fontSize: "9px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {line.incoterm}
                  </span>
                )}
                {line.transit_time && (
                  <span style={{ color: "var(--color-text-muted)" }}>
                    · {line.transit_time}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TOTAL DE LA LÍNEA */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.1,
            }}
          >
            {symbol}
            {fmt(lineTotal)}
          </div>
          <div
            style={{
              fontSize: "9px",
              color: "var(--color-text-muted)",
              marginTop: "1px",
            }}
          >
            {currency !== "MXN" && currency}
          </div>
        </div>
      </div>

      {/* MÉTRICAS — qty · unit · price · tax */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px 18px",
          padding: "8px 10px",
          background: "var(--color-bg-subtle)",
          borderRadius: "var(--radius-sm)",
          fontSize: "11px",
        }}
      >
        <Metric label="Cantidad" value={`${quantity} ${line.unit_label ?? ""}`.trim()} />
        <Metric label="P. Unitario" value={`${symbol}${fmt(unitPrice)}`} />
        <Metric label="Subtotal" value={`${symbol}${fmt(lineSubtotal)}`} />
        <Metric label="IVA" value={taxLabel} sub={tax > 0 ? `${symbol}${fmt(tax)}` : undefined} />
      </div>

      {/* NOTAS (si las tiene) */}
      {line.notes && (
        <div
          style={{
            padding: "8px 10px",
            background: "var(--color-warning-bg)",
            border: "1px solid var(--color-warning-border)",
            borderRadius: "var(--radius-sm)",
            fontSize: "10px",
            color: "var(--color-warning-text)",
            lineHeight: 1.5,
            display: "flex",
            gap: "8px",
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.4px",
              flexShrink: 0,
            }}
          >
            Notas:
          </span>
          <span style={{ color: "var(--color-text-second)", fontWeight: 500 }}>{line.notes}</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// METRIC — Sub-componente para mostrar métrica label + valor
// ═══════════════════════════════════════════════════════════════════

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
      <span
        style={{
          fontSize: "9px",
          fontWeight: 700,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.4px",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      {sub && (
        <span
          style={{
            fontSize: "9px",
            color: "var(--color-text-muted)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}