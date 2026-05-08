"use client";

import React from "react";
import type { Quotation } from "../../../types/quotations.types";

// ═══════════════════════════════════════════════════════════════════
// TAB TOTALES — Breakdown completo nivel ERP
//
// Secciones (estilo SAP B1 / Oracle EBS):
//   1. Resumen consolidado por moneda (subtotal · IVA · retenciones · total)
//   2. Desglose por concepto / por producto
//   3. Distribución de IVA por tasa (16% · 0% · exento · retenciones)
//   4. Aviso de multi-moneda si aplica
// ═══════════════════════════════════════════════════════════════════

type Props = {
  quotation: Quotation;
};

type CurrencyBreakdown = {
  subtotal: number;
  iva16: number;
  iva0: number;
  exento: number;
  ivaRetenido: number;
  isrRetenido: number;
  total: number;
};

function buildBreakdown(quotation: Quotation): Record<string, CurrencyBreakdown> {
  const result: Record<string, CurrencyBreakdown> = {};
  const ensure = (cur: string): CurrencyBreakdown => {
    if (!result[cur]) {
      result[cur] = {
        subtotal: 0,
        iva16: 0,
        iva0: 0,
        exento: 0,
        ivaRetenido: 0,
        isrRetenido: 0,
        total: 0,
      };
    }
    return result[cur];
  };

  const concepts = (quotation as any).billing_concepts ?? [];
  const items = quotation.items ?? [];

  if (concepts.length > 0) {
    for (const c of concepts) {
      for (const line of c.lines ?? []) {
        const cur = line.currency ?? c.currency ?? quotation.currency ?? "MXN";
        const bd = ensure(cur);
        const price = Number(line.price ?? 0);
        const rate = line.tax_rate;
        bd.subtotal += price;

        // Clasificar por tasa (convención Mobility OS):
        //   16   → IVA 16%
        //   0    → IVA 0%
        //   -1   → Exento
        //   -16  → IVA retenido (negativo = retención)
        //   -10  → ISR retenido
        if (rate === null || rate === undefined || rate === -1) {
          bd.exento += price;
        } else if (rate === 0) {
          bd.iva0 += price;
        } else if (rate < 0) {
          // Retención: el "rate" es negativo, calculamos sobre price
          const retention = price * (Math.abs(rate) / 100);
          if (Math.abs(rate) >= 15) {
            bd.ivaRetenido -= retention;
          } else {
            bd.isrRetenido -= retention;
          }
          bd.subtotal -= price; // Las retenciones no suman al subtotal positivo
        } else {
          bd.iva16 += price * (rate / 100);
        }
        bd.total += price + (rate && rate > 0 ? price * (rate / 100) : 0);
      }
    }
  } else if (items.length > 0) {
    const cur = quotation.currency ?? "MXN";
    const bd = ensure(cur);
    let subtotal = 0;
    for (const i of items) {
      const lineSubtotal = Number(i.unit_price ?? 0) * Number(i.quantity ?? 0);
      const discount = (lineSubtotal * Number(i.discount_pct ?? 0)) / 100;
      subtotal += lineSubtotal - discount;
    }
    const rate = Number(quotation.tax_rate ?? 16);
    bd.subtotal = subtotal;
    bd.iva16 = subtotal * (rate / 100);
    bd.total = subtotal + bd.iva16;
  } else {
    const cur = quotation.currency ?? "MXN";
    const bd = ensure(cur);
    bd.subtotal = quotation.subtotal ?? 0;
    bd.iva16 = quotation.tax_amount ?? 0;
    bd.total = quotation.total ?? 0;
  }

  return result;
}

export default function TabTotales({ quotation }: Props) {
  const breakdown = buildBreakdown(quotation);
  const currencies = Object.keys(breakdown);
  const isMultiCurrency = currencies.length > 1;
  const concepts = (quotation as any).billing_concepts ?? [];
  const items = quotation.items ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* SECCIÓN 1 — Resumen consolidado por moneda */}
      <Section title="Resumen consolidado">
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {currencies.map((cur) => (
            <CurrencyTotalCard key={cur} currency={cur} breakdown={breakdown[cur]} />
          ))}
        </div>
      </Section>

      {/* SECCIÓN 2 — Aviso multi-moneda */}
      {isMultiCurrency && (
        <div
          style={{
            padding: "10px 12px",
            background: "var(--color-warning-bg)",
            border: "1px solid var(--color-warning-border)",
            borderRadius: "var(--radius-md)",
            fontSize: "11px",
            color: "var(--color-warning-text)",
            lineHeight: 1.5,
          }}
        >
          <strong>Cotización multi-moneda:</strong> Esta cotización contiene importes
          en {currencies.join(" y ")}. Patrón ERP estándar: las monedas{" "}
          <strong>nunca se suman entre sí</strong>. Cada moneda factura por separado.
          Al timbrar, se generan facturas independientes por moneda.
        </div>
      )}

      {/* SECCIÓN 3 — Desglose por concepto/producto */}
      {concepts.length > 0 && (
        <Section title={`Desglose por concepto (${concepts.length})`}>
          <ConceptBreakdownTable concepts={concepts} />
        </Section>
      )}

      {items.length > 0 && (
        <Section title={`Desglose por producto (${items.length})`}>
          <ItemBreakdownTable items={items} taxRate={Number(quotation.tax_rate ?? 16)} currency={quotation.currency ?? "MXN"} />
        </Section>
      )}

      {/* SECCIÓN 4 — Distribución de IVA por tasa */}
      <Section title="Distribución de IVA por tasa">
        <TaxDistributionTable breakdown={breakdown} />
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SECTION wrapper
// ═══════════════════════════════════════════════════════════════════

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 800,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.6px",
          marginBottom: "8px",
          paddingLeft: "4px",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CURRENCY TOTAL CARD — Card por moneda con todos los rubros
// ═══════════════════════════════════════════════════════════════════

function CurrencyTotalCard({
  currency,
  breakdown,
}: {
  currency: string;
  breakdown: CurrencyBreakdown;
}) {
  const symbol = currency === "USD" ? "USD $" : currency === "EUR" ? "€" : "$";
  const fmt = (n: number) =>
    n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtNeg = (n: number) =>
    n < 0
      ? `-${symbol}${fmt(Math.abs(n))}`
      : `${symbol}${fmt(n)}`;

  return (
    <div
      style={{
        background: "var(--color-bg-base)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      {/* HEADER moneda */}
      <div
        style={{
          padding: "10px 14px",
          background: "var(--color-bg-subtle)",
          borderBottom: "1px solid var(--color-border-faint)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 800,
            color: "var(--color-text-primary)",
            letterSpacing: "0.4px",
          }}
        >
          {currency}
        </span>
        <span
          style={{
            fontSize: "10px",
            color: "var(--color-text-muted)",
            fontWeight: 600,
          }}
        >
          Distribución completa
        </span>
      </div>

      {/* CUERPO con rubros */}
      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
        <Row label="Subtotal" value={`${symbol}${fmt(breakdown.subtotal)}`} />
        {breakdown.iva16 > 0 && (
          <Row label="IVA traslado" value={`${symbol}${fmt(breakdown.iva16)}`} />
        )}
        {breakdown.iva0 > 0 && (
          <Row
            label="Operaciones IVA 0%"
            value={`${symbol}${fmt(breakdown.iva0)}`}
            sub="Sin impuesto"
          />
        )}
        {breakdown.exento > 0 && (
          <Row
            label="Operaciones exentas"
            value={`${symbol}${fmt(breakdown.exento)}`}
            sub="Sin impuesto"
          />
        )}
        {breakdown.ivaRetenido < 0 && (
          <Row
            label="IVA retenido"
            value={fmtNeg(breakdown.ivaRetenido)}
            color="var(--color-danger-text)"
          />
        )}
        {breakdown.isrRetenido < 0 && (
          <Row
            label="ISR retenido"
            value={fmtNeg(breakdown.isrRetenido)}
            color="var(--color-danger-text)"
          />
        )}

        {/* TOTAL destacado */}
        <div
          style={{
            marginTop: "6px",
            paddingTop: "8px",
            borderTop: "2px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Total {currency}
          </span>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "var(--color-success-text)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {symbol}
            {fmt(breakdown.total)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <span
          style={{
            fontSize: "11px",
            color: color ?? "var(--color-text-second)",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        {sub && (
          <span
            style={{
              fontSize: "9px",
              color: "var(--color-text-muted)",
              marginLeft: "6px",
              fontStyle: "italic",
            }}
          >
            {sub}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: "12px",
          color: color ?? "var(--color-text-primary)",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CONCEPT BREAKDOWN TABLE
// ═══════════════════════════════════════════════════════════════════

function ConceptBreakdownTable({ concepts }: { concepts: any[] }) {
  return (
    <div
      style={{
        background: "var(--color-bg-base)",
        border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "30px 2fr 60px 110px 110px 110px",
          gap: "8px",
          padding: "8px 12px",
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
        <span>Concepto</span>
        <span style={{ textAlign: "center" }}>Moneda</span>
        <span style={{ textAlign: "right" }}>Subtotal</span>
        <span style={{ textAlign: "right" }}>IVA</span>
        <span style={{ textAlign: "right" }}>Total</span>
      </div>
      {concepts.map((c, idx) => {
        const lines = c.lines ?? [];
        const cur = c.currency ?? "MXN";
        const symbol = cur === "USD" ? "USD $" : cur === "EUR" ? "€" : "$";
        const subtotal = lines.reduce((s: number, l: any) => s + Number(l.price ?? 0), 0);
        const tax = lines.reduce((s: number, l: any) => {
          const rate = l.tax_rate;
          if (rate === null || rate === undefined || rate === -1 || rate <= 0) return s;
          return s + Number(l.price ?? 0) * (Number(rate) / 100);
        }, 0);
        const total = subtotal + tax;
        const fmt = (n: number) =>
          n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        return (
          <div
            key={c.id ?? idx}
            style={{
              display: "grid",
              gridTemplateColumns: "30px 2fr 60px 110px 110px 110px",
              gap: "8px",
              padding: "8px 12px",
              fontSize: "11px",
              borderBottom:
                idx < concepts.length - 1
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
            <span
              style={{
                fontWeight: 700,
                color: "var(--color-text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {c.description}
            </span>
            <span
              style={{
                textAlign: "center",
                fontSize: "9px",
                fontWeight: 700,
                color: "var(--color-text-second)",
                padding: "2px 6px",
                background: "var(--color-bg-subtle)",
                borderRadius: "var(--radius-full)",
              }}
            >
              {cur}
            </span>
            <span
              style={{
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
                fontWeight: 600,
              }}
            >
              {symbol}
              {fmt(subtotal)}
            </span>
            <span
              style={{
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
                fontWeight: 600,
                color: "var(--color-text-second)",
              }}
            >
              {symbol}
              {fmt(tax)}
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
              {fmt(total)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ITEM BREAKDOWN TABLE — Para cotizaciones de productos
// ═══════════════════════════════════════════════════════════════════

function ItemBreakdownTable({
  items,
  taxRate,
  currency,
}: {
  items: any[];
  taxRate: number;
  currency: string;
}) {
  const symbol = currency === "USD" ? "USD $" : currency === "EUR" ? "€" : "$";
  const fmt = (n: number) =>
    n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      style={{
        background: "var(--color-bg-base)",
        border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "30px 2fr 100px 110px",
          gap: "8px",
          padding: "8px 12px",
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
        <span>Producto</span>
        <span style={{ textAlign: "right" }}>Subtotal</span>
        <span style={{ textAlign: "right" }}>Total c/IVA</span>
      </div>
      {items.map((item, idx) => {
        const lineSubtotal = Number(item.unit_price ?? 0) * Number(item.quantity ?? 0);
        const discount = (lineSubtotal * Number(item.discount_pct ?? 0)) / 100;
        const subtotal = lineSubtotal - discount;
        const total = subtotal * (1 + taxRate / 100);

        return (
          <div
            key={item.id ?? idx}
            style={{
              display: "grid",
              gridTemplateColumns: "30px 2fr 100px 110px",
              gap: "8px",
              padding: "8px 12px",
              fontSize: "11px",
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
            <span
              style={{
                fontWeight: 700,
                color: "var(--color-text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.description}
            </span>
            <span
              style={{
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
                fontWeight: 600,
              }}
            >
              {symbol}
              {fmt(subtotal)}
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
              {fmt(total)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAX DISTRIBUTION TABLE — Distribución de IVA por tasa
// ═══════════════════════════════════════════════════════════════════

function TaxDistributionTable({ breakdown }: { breakdown: Record<string, CurrencyBreakdown> }) {
  const rows: Array<{
    rate: string;
    label: string;
    base: Record<string, number>;
    tax: Record<string, number>;
    color?: string;
  }> = [];

  for (const cur of Object.keys(breakdown)) {
    const bd = breakdown[cur];
    if (bd.iva16 > 0) {
      const baseExisting = rows.find((r) => r.rate === "16");
      if (baseExisting) {
        baseExisting.base[cur] = bd.subtotal - bd.iva0 - bd.exento;
        baseExisting.tax[cur] = bd.iva16;
      } else {
        rows.push({
          rate: "16",
          label: "IVA 16%",
          base: { [cur]: bd.subtotal - bd.iva0 - bd.exento },
          tax: { [cur]: bd.iva16 },
        });
      }
    }
    if (bd.iva0 > 0) {
      const r = rows.find((r) => r.rate === "0");
      if (r) {
        r.base[cur] = bd.iva0;
        r.tax[cur] = 0;
      } else {
        rows.push({ rate: "0", label: "IVA 0%", base: { [cur]: bd.iva0 }, tax: { [cur]: 0 } });
      }
    }
    if (bd.exento > 0) {
      const r = rows.find((r) => r.rate === "exento");
      if (r) {
        r.base[cur] = bd.exento;
      } else {
        rows.push({ rate: "exento", label: "Exento", base: { [cur]: bd.exento }, tax: {} });
      }
    }
    if (bd.ivaRetenido < 0) {
      rows.push({
        rate: "ret-iva",
        label: "IVA retenido",
        base: { [cur]: bd.ivaRetenido / -0.16 },
        tax: { [cur]: bd.ivaRetenido },
        color: "var(--color-danger-text)",
      });
    }
    if (bd.isrRetenido < 0) {
      rows.push({
        rate: "ret-isr",
        label: "ISR retenido",
        base: { [cur]: bd.isrRetenido / -0.10 },
        tax: { [cur]: bd.isrRetenido },
        color: "var(--color-danger-text)",
      });
    }
  }

  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: "16px",
          textAlign: "center",
          color: "var(--color-text-muted)",
          fontSize: "11px",
          background: "var(--color-bg-subtle)",
          borderRadius: "var(--radius-md)",
        }}
      >
        Sin tasas de IVA aplicables
      </div>
    );
  }

  const fmt = (n: number, cur: string) => {
    const symbol = cur === "USD" ? "USD $" : cur === "EUR" ? "€" : "$";
    return `${symbol}${Math.abs(n).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div
      style={{
        background: "var(--color-bg-base)",
        border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
          padding: "8px 12px",
          background: "var(--color-bg-subtle)",
          borderBottom: "1px solid var(--color-border-faint)",
          fontSize: "9px",
          fontWeight: 800,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.4px",
        }}
      >
        <span>Tasa / concepto fiscal</span>
        <span style={{ textAlign: "right" }}>Base imponible</span>
        <span style={{ textAlign: "right" }}>Impuesto</span>
      </div>
      {rows.map((r, idx) => (
        <div
          key={idx}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "8px",
            padding: "8px 12px",
            fontSize: "11px",
            borderBottom: idx < rows.length - 1 ? "1px solid var(--color-border-faint)" : "none",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontWeight: 700,
              color: r.color ?? "var(--color-text-primary)",
            }}
          >
            {r.label}
          </span>
          <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
            {Object.entries(r.base).map(([cur, val]) => (
              <div key={cur}>{fmt(val, cur)}{Object.keys(r.base).length > 1 ? ` ${cur}` : ""}</div>
            ))}
          </div>
          <div
            style={{
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 700,
              color: r.color ?? "var(--color-text-primary)",
            }}
          >
            {Object.entries(r.tax).length > 0
              ? Object.entries(r.tax).map(([cur, val]) => (
                  <div key={cur}>
                    {val < 0 ? "-" : ""}
                    {fmt(val, cur)}
                    {Object.keys(r.tax).length > 1 ? ` ${cur}` : ""}
                  </div>
                ))
              : "—"}
          </div>
        </div>
      ))}
    </div>
  );
}