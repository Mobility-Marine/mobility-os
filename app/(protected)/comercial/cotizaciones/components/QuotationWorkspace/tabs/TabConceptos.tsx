"use client";

import React from "react";
import type { Quotation } from "../../../types/quotations.types";
import ConceptCard from "../shared/ConceptCard";
import EmptyState from "@/app/components/shared/EmptyState";
import { IconBoxes } from "@/app/components/shared/Icons";

// ═══════════════════════════════════════════════════════════════════
// TAB CONCEPTOS — Vista enriquecida de conceptos/productos nivel ERP
//
// Para cotizaciones de SERVICIOS:
//   Renderiza N ConceptCard (parent), cada uno con sus LineRow (children).
//   Patrón SAP "Item parent/child": agrupa por concepto CFDI.
//
// Para cotizaciones de PRODUCTOS:
//   Tabla ERP con # · Descripción · Cant · Unidad · P. Unit · Subtotal.
//   Estilo SAP B1 / Odoo / NetSuite.
// ═══════════════════════════════════════════════════════════════════

type Props = {
  quotation: Quotation;
};

export default function TabConceptos({ quotation }: Props) {
  if (quotation.type === "services") {
    return <ServicesView quotation={quotation} />;
  }
  return <ProductsView quotation={quotation} />;
}

// ═══════════════════════════════════════════════════════════════════
// SERVICES VIEW — Cards de conceptos parent/children
// ═══════════════════════════════════════════════════════════════════

function ServicesView({ quotation }: { quotation: Quotation }) {
  const concepts = (quotation as any).billing_concepts ?? [];

  if (concepts.length === 0) {
    return (
      <EmptyState
        icon={<IconBoxes size={32} />}
        title="Sin conceptos de facturación"
        description="Esta cotización no tiene conceptos cargados. Edita la cotización para agregar conceptos y líneas de detalle."
        size="md"
      />
    );
  }

  // Sumar líneas totales para el header
  const totalLines = concepts.reduce(
    (s: number, c: any) => s + (c.lines?.length ?? 0),
    0,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* HEADER de la sección */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 4px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 800,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.6px",
            }}
          >
            Conceptos de facturación
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: "var(--color-info-bg)",
              color: "var(--color-info-text)",
              border: "1px solid var(--color-info-border)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {concepts.length} {concepts.length === 1 ? "concepto" : "conceptos"}
          </span>
        </div>
        <span
          style={{
            fontSize: "10px",
            color: "var(--color-text-muted)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {totalLines} línea{totalLines !== 1 ? "s" : ""} de detalle
        </span>
      </div>

      {/* INFO de jerarquía (educativa primera vez) */}
      <div
        style={{
          padding: "8px 12px",
          background: "var(--color-info-bg)",
          border: "1px solid var(--color-info-border)",
          borderRadius: "var(--radius-md)",
          fontSize: "10px",
          color: "var(--color-info-text)",
          lineHeight: 1.5,
        }}
      >
        <strong>Patrón ERP SAP/Oracle:</strong> Cada <em>concepto de facturación</em> es lo
        que aparece como una línea en el CFDI. Cada concepto puede contener N{" "}
        <em>líneas de detalle</em> que conforman su composición interna.
      </div>

      {/* CONCEPTOS */}
      {concepts.map((concept: any, index: number) => (
        <ConceptCard
          key={concept.id ?? index}
          concept={concept}
          index={index}
          defaultExpanded={true}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PRODUCTS VIEW — Tabla de items ERP-grade
// ═══════════════════════════════════════════════════════════════════

function ProductsView({ quotation }: { quotation: Quotation }) {
  const items = quotation.items ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<IconBoxes size={32} />}
        title="Sin productos"
        description="Esta cotización no tiene productos cargados. Edita la cotización para agregar productos."
        size="md"
      />
    );
  }

  const currency = quotation.currency ?? "MXN";
  const symbol = currency === "USD" ? "USD $" : currency === "EUR" ? "€" : "$";
  const fmt = (n: number) =>
    n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Cálculos
  const totalSubtotal = items.reduce((s, i: any) => {
    const lineSubtotal = Number(i.unit_price ?? 0) * Number(i.quantity ?? 0);
    const discount = (lineSubtotal * Number(i.discount_pct ?? 0)) / 100;
    return s + (lineSubtotal - discount);
  }, 0);
  const taxRate = Number(quotation.tax_rate ?? 16);
  const totalTax = totalSubtotal * (taxRate / 100);
  const totalGrand = totalSubtotal + totalTax;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 4px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 800,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.6px",
            }}
          >
            Productos
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: "var(--color-success-bg)",
              color: "var(--color-success-text)",
              border: "1px solid var(--color-success-border)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {items.length} {items.length === 1 ? "producto" : "productos"}
          </span>
        </div>
        <span
          style={{
            fontSize: "10px",
            color: "var(--color-text-muted)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          Moneda: <strong style={{ color: "var(--color-text-primary)" }}>{currency}</strong>
        </span>
      </div>

      {/* TABLA */}
      <div
        style={{
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-border-faint)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        {/* Header tabla */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "30px 2fr 70px 70px 100px 100px 110px",
            gap: "8px",
            padding: "10px 12px",
            background: "var(--color-bg-subtle)",
            borderBottom: "1px solid var(--color-border-faint)",
            fontSize: "9px",
            fontWeight: 800,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.4px",
          }}
        >
          <span>#</span>
          <span>Descripción</span>
          <span style={{ textAlign: "right" }}>Cant.</span>
          <span style={{ textAlign: "center" }}>Unidad</span>
          <span style={{ textAlign: "right" }}>P. Unit.</span>
          <span style={{ textAlign: "right" }}>Desc.</span>
          <span style={{ textAlign: "right" }}>Subtotal</span>
        </div>

        {/* Filas */}
        {items.map((item: any, idx) => {
          const lineSubtotal = Number(item.unit_price ?? 0) * Number(item.quantity ?? 0);
          const discount = (lineSubtotal * Number(item.discount_pct ?? 0)) / 100;
          const lineTotal = lineSubtotal - discount;

          return (
            <div
              key={item.id ?? idx}
              style={{
                display: "grid",
                gridTemplateColumns: "30px 2fr 70px 70px 100px 100px 110px",
                gap: "8px",
                padding: "10px 12px",
                fontSize: "11px",
                color: "var(--color-text-primary)",
                borderBottom:
                  idx < items.length - 1
                    ? "1px solid var(--color-border-faint)"
                    : "none",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: "var(--color-text-muted)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {idx + 1}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, lineHeight: 1.4 }}>{item.description}</div>
                {item.sku && (
                  <div
                    style={{
                      fontSize: "9px",
                      color: "var(--color-text-muted)",
                      fontVariantNumeric: "tabular-nums",
                      marginTop: "2px",
                    }}
                  >
                    SKU: {item.sku}
                  </div>
                )}
                {item.details && (
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--color-text-second)",
                      marginTop: "2px",
                      lineHeight: 1.4,
                    }}
                  >
                    {item.details}
                  </div>
                )}
              </div>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {Number(item.quantity ?? 0).toLocaleString("es-MX")}
              </span>
              <span
                style={{
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  fontSize: "10px",
                }}
              >
                {item.unit ?? "—"}
              </span>
              <span
                style={{
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 600,
                }}
              >
                {symbol}
                {fmt(Number(item.unit_price ?? 0))}
              </span>
              <span
                style={{
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                  color: discount > 0 ? "var(--color-warning-text)" : "var(--color-text-muted)",
                  fontWeight: discount > 0 ? 700 : 500,
                }}
              >
                {Number(item.discount_pct ?? 0) > 0
                  ? `${item.discount_pct}%`
                  : "—"}
              </span>
              <span
                style={{
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 800,
                  color: "var(--color-text-primary)",
                }}
              >
                {symbol}
                {fmt(lineTotal)}
              </span>
            </div>
          );
        })}

        {/* Footer totales */}
        <div
          style={{
            padding: "10px 12px",
            background: "var(--color-bg-subtle)",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "30px",
            flexWrap: "wrap",
            fontSize: "11px",
          }}
        >
          <FooterTotal label="Subtotal" value={`${symbol}${fmt(totalSubtotal)}`} />
          <FooterTotal label={`IVA (${taxRate}%)`} value={`${symbol}${fmt(totalTax)}`} />
          <FooterTotal
            label="Total"
            value={`${symbol}${fmt(totalGrand)}`}
            highlight
          />
        </div>
      </div>
    </div>
  );
}

function FooterTotal({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
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
          fontSize: highlight ? "14px" : "12px",
          fontWeight: 800,
          color: highlight ? "var(--color-success-text)" : "var(--color-text-primary)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}