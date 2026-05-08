"use client";

import React from "react";

// ═══════════════════════════════════════════════════════════════════
// CURRENCY AMOUNT — Helper de presentación multi-moneda nivel ERP
//
// Maneja correctamente:
//  - Símbolo de moneda con prefijo correcto
//  - Apilamiento vertical para múltiples monedas
//  - Formato tabular-nums para alineación perfecta
//  - Tamaños configurables
//
// Patrón SAP/Oracle: nunca mezclar monedas en una suma. Apilarlas verticalmente.
// ═══════════════════════════════════════════════════════════════════

type Props = {
  amounts: Record<string, number>;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
  align?: "left" | "right" | "center";
  showCurrencyLabel?: boolean; // muestra "USD"/"MXN" si hay > 1 moneda
  locale?: string;
  decimals?: number;
};

const SIZES = {
  xs: { fontSize: "10px", labelSize: "8px", weight: 700 },
  sm: { fontSize: "12px", labelSize: "9px", weight: 700 },
  md: { fontSize: "14px", labelSize: "10px", weight: 700 },
  lg: { fontSize: "18px", labelSize: "10px", weight: 800 },
  xl: { fontSize: "22px", labelSize: "11px", weight: 800 },
};

export default function CurrencyAmount({
  amounts,
  size = "md",
  color = "var(--color-text-primary)",
  align = "left",
  showCurrencyLabel = true,
  locale = "es-MX",
  decimals = 2,
}: Props) {
  const dim = SIZES[size];
  const entries = Object.entries(amounts).filter(([, v]) => v !== null && v !== undefined);

  if (entries.length === 0) {
    return (
      <span
        style={{
          fontSize: dim.fontSize,
          fontWeight: dim.weight,
          color: "var(--color-text-muted)",
        }}
      >
        $0.00
      </span>
    );
  }

  const formatAmount = (val: number, currency: string): string => {
    const symbol = currency === "USD" ? "USD $" : currency === "EUR" ? "€" : "$";
    return `${symbol}${val.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  const showLabel = showCurrencyLabel && entries.length > 1;
  const justify = align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        alignItems: align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start",
        textAlign: align,
      }}
    >
      {entries.map(([cur, val]) => (
        <div
          key={cur}
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "5px",
            justifyContent: justify,
            lineHeight: 1.1,
          }}
        >
          <span
            style={{
              fontSize: dim.fontSize,
              fontWeight: dim.weight,
              color,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatAmount(val, cur)}
          </span>
          {showLabel && (
            <span
              style={{
                fontSize: dim.labelSize,
                fontWeight: 700,
                color,
                opacity: 0.65,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
            >
              {cur}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}