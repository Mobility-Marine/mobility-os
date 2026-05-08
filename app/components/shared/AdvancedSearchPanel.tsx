"use client";

import React, { useState } from "react";
import { IconSliders, IconChevronDown, IconChevronUp, IconX } from "./Icons";

// ═══════════════════════════════════════════════════════════════════
// ADVANCED SEARCH PANEL — Filtros avanzados expandibles nivel ERP
//
// Inspirado en Salesforce Reports / NetSuite Saved Searches.
// Soporta: date range, amount range (con monedas), selects custom,
// y "Filtros activos" pills para clear-all.
//
// Uso típico:
//   <AdvancedSearchPanel
//     filters={advancedFilters}
//     onChange={setAdvancedFilters}
//     config={{
//       dateRange: { label: "Fechas", from: "Desde", to: "Hasta" },
//       amountRange: { label: "Monto", currencies: ["MXN", "USD"] },
//       selects: [
//         { key: "subtype", label: "Subtipo", options: [...] },
//       ],
//     }}
//   />
// ═══════════════════════════════════════════════════════════════════

export type AdvancedFilters = {
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: string;
  amountTo?: string;
  amountCurrency?: string;
  selects?: Record<string, string>;
};

export type AdvancedSearchConfig = {
  dateRange?: { label?: string; from?: string; to?: string };
  amountRange?: { label?: string; currencies?: string[] };
  selects?: Array<{
    key: string;
    label: string;
    options: Array<{ value: string; label: string }>;
  }>;
};

type Props = {
  filters: AdvancedFilters;
  onChange: (filters: AdvancedFilters) => void;
  config: AdvancedSearchConfig;
  defaultOpen?: boolean;
};

export default function AdvancedSearchPanel({
  filters,
  onChange,
  config,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  // Cuenta cuántos filtros están activos (para badge)
  const activeCount =
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.amountFrom ? 1 : 0) +
    (filters.amountTo ? 1 : 0) +
    Object.values(filters.selects ?? {}).filter(Boolean).length;

  const update = (patch: Partial<AdvancedFilters>) => onChange({ ...filters, ...patch });
  const updateSelect = (key: string, value: string) =>
    onChange({ ...filters, selects: { ...(filters.selects ?? {}), [key]: value } });

  const clearAll = () =>
    onChange({
      dateFrom: undefined,
      dateTo: undefined,
      amountFrom: undefined,
      amountTo: undefined,
      amountCurrency: undefined,
      selects: {},
    });

  return (
    <div
      style={{
        background: "var(--color-bg-subtle)",
        border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      {/* HEADER del panel — toggle */}
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          width: "100%",
          height: "32px",
          padding: "0 10px",
          background: "transparent",
          border: "none",
          color: "var(--color-text-second)",
          fontSize: "11px",
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "6px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <IconSliders size={12} />
          <span>Filtros avanzados</span>
          {activeCount > 0 && (
            <span
              style={{
                fontSize: "9px",
                fontWeight: 800,
                padding: "1px 6px",
                borderRadius: "var(--radius-full)",
                background: "var(--color-brand-blue)",
                color: "#fff",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {activeCount}
            </span>
          )}
        </div>
        {open ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
      </button>

      {/* PANEL expandible */}
      {open && (
        <div
          style={{
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            borderTop: "1px solid var(--color-border-faint)",
          }}
        >
          {/* DATE RANGE */}
          {config.dateRange && (
            <FilterGroup label={config.dateRange.label ?? "Rango de fechas"}>
              <div style={{ display: "flex", gap: "6px" }}>
                <DateInput
                  placeholder={config.dateRange.from ?? "Desde"}
                  value={filters.dateFrom ?? ""}
                  onChange={(v) => update({ dateFrom: v || undefined })}
                />
                <DateInput
                  placeholder={config.dateRange.to ?? "Hasta"}
                  value={filters.dateTo ?? ""}
                  onChange={(v) => update({ dateTo: v || undefined })}
                />
              </div>
            </FilterGroup>
          )}

          {/* AMOUNT RANGE */}
          {config.amountRange && (
            <FilterGroup label={config.amountRange.label ?? "Rango de monto"}>
              <div style={{ display: "flex", gap: "6px" }}>
                <NumberInput
                  placeholder="Min"
                  value={filters.amountFrom ?? ""}
                  onChange={(v) => update({ amountFrom: v || undefined })}
                />
                <NumberInput
                  placeholder="Max"
                  value={filters.amountTo ?? ""}
                  onChange={(v) => update({ amountTo: v || undefined })}
                />
                {config.amountRange.currencies && config.amountRange.currencies.length > 1 && (
                  <SelectInput
                    value={filters.amountCurrency ?? ""}
                    onChange={(v) => update({ amountCurrency: v || undefined })}
                    options={[
                      { value: "", label: "Todas" },
                      ...config.amountRange.currencies.map((c) => ({ value: c, label: c })),
                    ]}
                  />
                )}
              </div>
            </FilterGroup>
          )}

          {/* SELECTS custom */}
          {config.selects?.map((sel) => (
            <FilterGroup key={sel.key} label={sel.label}>
              <SelectInput
                value={(filters.selects ?? {})[sel.key] ?? ""}
                onChange={(v) => updateSelect(sel.key, v)}
                options={[{ value: "", label: "Todos" }, ...sel.options]}
              />
            </FilterGroup>
          ))}

          {/* CLEAR ALL */}
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              style={{
                marginTop: "4px",
                height: "26px",
                padding: "0 10px",
                borderRadius: "var(--radius-md)",
                background: "transparent",
                border: "1px solid var(--color-danger-border)",
                color: "var(--color-danger-text)",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
              }}
            >
              <IconX size={10} strokeWidth={2.5} />
              Limpiar filtros ({activeCount})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS — inputs estandarizados
// ═══════════════════════════════════════════════════════════════════

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  height: "28px",
  padding: "0 8px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-base)",
  color: "var(--color-text-primary)",
  fontSize: "11px",
  outline: "none",
  boxSizing: "border-box",
};

function DateInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="date"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    />
  );
}

function NumberInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="number"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, cursor: "pointer", minWidth: "80px" }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}