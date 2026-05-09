"use client";

import React, { useEffect, useState } from "react";
import { IconX, IconSliders } from "./Icons";

// ═══════════════════════════════════════════════════════════════════
// FILTER DRAWER — Drawer lateral de filtros nivel ERP
//
// Patrón: Linear / Salesforce / NetSuite Saved Searches.
// Reemplaza al viejo `AdvancedSearchPanel` inline expandible. Vive
// como modal lateral con grupos de filtros configurables, footer con
// "Limpiar todo" + "Aplicar", y contador de filtros activos.
//
// API: 100% data-driven — el sidebar consumidor declara grupos vía
// `groups`, este componente los renderiza sin saber de qué módulo
// vienen. Reusable en Cotizaciones, Productos, Pedidos, Embarques,
// CFDIs, Partners, etc.
//
// SOPORTA 4 tipos de grupos:
//   - select        → un solo valor entre N opciones (radio behavior)
//   - multi-select  → varios valores entre N opciones (checkbox)
//   - date-range    → desde / hasta (input type=date)
//   - number-range  → min / max (con moneda opcional)
// ═══════════════════════════════════════════════════════════════════

// ── Tipos de grupos ─────────────────────────────────────────────────

export type FilterOption = { value: string; label: string; count?: number };

export type FilterGroup =
  | {
      id: string;
      label: string;
      type: "select";
      value: string;
      onChange: (v: string) => void;
      options: FilterOption[];
    }
  | {
      id: string;
      label: string;
      type: "multi-select";
      value: string[];
      onChange: (v: string[]) => void;
      options: FilterOption[];
    }
  | {
      id: string;
      label: string;
      type: "date-range";
      from: string | undefined;
      to: string | undefined;
      onChange: (from: string | undefined, to: string | undefined) => void;
      fromLabel?: string;
      toLabel?: string;
    }
  | {
      id: string;
      label: string;
      type: "number-range";
      min: string | undefined;
      max: string | undefined;
      currency?: string | undefined;
      currencies?: string[];
      onChange: (
        min: string | undefined,
        max: string | undefined,
        currency: string | undefined,
      ) => void;
      minLabel?: string;
      maxLabel?: string;
    };

type Props = {
  open: boolean;
  onClose: () => void;
  groups: FilterGroup[];
  activeCount: number;
  onClearAll: () => void;
  title?: string;
};

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export default function FilterDrawer({
  open,
  onClose,
  groups,
  activeCount,
  onClearAll,
  title = "Filtros",
}: Props) {
  // Cierre con Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* OVERLAY */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(2px)",
          zIndex: 1000,
          animation: "filterDrawerFade 160ms ease-out",
        }}
      />

      {/* PANEL */}
      <aside
        role="dialog"
        aria-label={title}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(420px, 92vw)",
          background: "var(--color-bg-base)",
          borderLeft: "1px solid var(--color-border)",
          boxShadow: "-12px 0 32px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          zIndex: 1001,
          animation: "filterDrawerSlide 200ms ease-out",
        }}
      >
        {/* HEADER */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border-faint)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <IconSliders size={16} />
            <h2
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              {title}
            </h2>
            {activeCount > 0 && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "2px 8px",
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
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border-faint)",
              background: "transparent",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconX size={14} />
          </button>
        </header>

        {/* BODY — grupos configurables */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {groups.map((group) => (
            <FilterGroupRenderer key={group.id} group={group} />
          ))}
        </div>

        {/* FOOTER — limpiar + aplicar */}
        <footer
          style={{
            display: "flex",
            gap: "10px",
            padding: "14px 20px",
            borderTop: "1px solid var(--color-border-faint)",
            background: "var(--color-bg-subtle)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClearAll}
            disabled={activeCount === 0}
            style={{
              flex: 1,
              height: "38px",
              padding: "0 14px",
              borderRadius: "var(--radius-md)",
              background: "transparent",
              border: "1px solid var(--color-border)",
              color:
                activeCount === 0
                  ? "var(--color-text-muted)"
                  : "var(--color-danger-text)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: activeCount === 0 ? "not-allowed" : "pointer",
              opacity: activeCount === 0 ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <IconX size={12} />
            Limpiar todo {activeCount > 0 ? `(${activeCount})` : ""}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: "38px",
              padding: "0 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-brand-blue)",
              border: "none",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Aplicar
          </button>
        </footer>
      </aside>

      {/* Animaciones */}
      <style>{`
        @keyframes filterDrawerFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes filterDrawerSlide {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTE — Renderer de un grupo según su tipo
// ═══════════════════════════════════════════════════════════════════
function FilterGroupRenderer({ group }: { group: FilterGroup }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <span
        style={{
          fontSize: "10px",
          fontWeight: 800,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.6px",
        }}
      >
        {group.label}
      </span>

      {group.type === "select" && (
        <SingleSelectGroup
          value={group.value}
          onChange={group.onChange}
          options={group.options}
        />
      )}

      {group.type === "multi-select" && (
        <MultiSelectGroup
          value={group.value}
          onChange={group.onChange}
          options={group.options}
        />
      )}

      {group.type === "date-range" && (
        <DateRangeGroup
          from={group.from}
          to={group.to}
          onChange={group.onChange}
          fromLabel={group.fromLabel}
          toLabel={group.toLabel}
        />
      )}

      {group.type === "number-range" && (
        <NumberRangeGroup
          min={group.min}
          max={group.max}
          currency={group.currency}
          currencies={group.currencies}
          onChange={group.onChange}
          minLabel={group.minLabel}
          maxLabel={group.maxLabel}
        />
      )}
    </div>
  );
}

// ── SUBGRUPO: select (radio behavior, pills) ────────────────────────
function SingleSelectGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={pillStyle(active)}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span style={countStyle(active)}>{opt.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── SUBGRUPO: multi-select (checkbox behavior, pills) ───────────────
function MultiSelectGroup({
  value,
  onChange,
  options,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: FilterOption[];
}) {
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {options.map((opt) => {
        const active = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            style={pillStyle(active)}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span style={countStyle(active)}>{opt.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── SUBGRUPO: date-range (2 inputs) ─────────────────────────────────
function DateRangeGroup({
  from,
  to,
  onChange,
  fromLabel = "Desde",
  toLabel = "Hasta",
}: {
  from: string | undefined;
  to: string | undefined;
  onChange: (from: string | undefined, to: string | undefined) => void;
  fromLabel?: string;
  toLabel?: string;
}) {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <LabeledInput label={fromLabel}>
        <input
          type="date"
          value={from ?? ""}
          onChange={(e) => onChange(e.target.value || undefined, to)}
          style={inputStyle}
        />
      </LabeledInput>
      <LabeledInput label={toLabel}>
        <input
          type="date"
          value={to ?? ""}
          onChange={(e) => onChange(from, e.target.value || undefined)}
          style={inputStyle}
        />
      </LabeledInput>
    </div>
  );
}

// ── SUBGRUPO: number-range (min, max, currency selector) ────────────
function NumberRangeGroup({
  min,
  max,
  currency,
  currencies,
  onChange,
  minLabel = "Min",
  maxLabel = "Max",
}: {
  min: string | undefined;
  max: string | undefined;
  currency: string | undefined;
  currencies?: string[];
  onChange: (
    min: string | undefined,
    max: string | undefined,
    currency: string | undefined,
  ) => void;
  minLabel?: string;
  maxLabel?: string;
}) {
  const showCurrencySelector = !!currencies && currencies.length > 1;
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      <LabeledInput label={minLabel}>
        <input
          type="number"
          value={min ?? ""}
          onChange={(e) => onChange(e.target.value || undefined, max, currency)}
          style={inputStyle}
          placeholder="0"
        />
      </LabeledInput>
      <LabeledInput label={maxLabel}>
        <input
          type="number"
          value={max ?? ""}
          onChange={(e) => onChange(min, e.target.value || undefined, currency)}
          style={inputStyle}
          placeholder="∞"
        />
      </LabeledInput>
      {showCurrencySelector && (
        <LabeledInput label="Moneda">
          <select
            value={currency ?? ""}
            onChange={(e) => onChange(min, max, e.target.value || undefined)}
            style={{ ...inputStyle, cursor: "pointer", minWidth: "80px" }}
          >
            <option value="">Todas</option>
            {currencies!.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </LabeledInput>
      )}
    </div>
  );
}

// ── Wrapper input con label ─────────────────────────────────────────
function LabeledInput({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
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

// ═══════════════════════════════════════════════════════════════════
// ESTILOS COMPARTIDOS
// ═══════════════════════════════════════════════════════════════════

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "34px",
  padding: "0 10px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-base)",
  color: "var(--color-text-primary)",
  fontSize: "12px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

function pillStyle(active: boolean): React.CSSProperties {
  return {
    height: "30px",
    padding: "0 12px",
    borderRadius: "var(--radius-md)",
    background: active ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
    border: `1px solid ${active ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
    color: active ? "#fff" : "var(--color-text-second)",
    fontSize: "11px",
    fontWeight: active ? 700 : 600,
    cursor: "pointer",
    transition: "var(--transition-fast)",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    whiteSpace: "nowrap",
  };
}

function countStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: "9px",
    fontWeight: 700,
    padding: "1px 6px",
    borderRadius: "var(--radius-full)",
    background: active ? "rgba(255,255,255,0.25)" : "var(--color-border-faint)",
    color: active ? "#fff" : "var(--color-text-muted)",
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1.3,
  };
}