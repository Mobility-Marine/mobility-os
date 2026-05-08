"use client";

import React from "react";

// ═══════════════════════════════════════════════════════════════════
// FILTER PILLS — Filtros horizontales nivel ERP
//
// Modo "single": comportamiento radio (un solo valor activo)
// Modo "multi":  comportamiento checkbox (varios valores activos)
//
// Uso típico:
//   <FilterPills
//     mode="single"
//     options={[
//       { value: "all", label: "Todas" },
//       { value: "products", label: "Productos" },
//       { value: "services", label: "Servicios" },
//     ]}
//     value={filterType}
//     onChange={setFilterType}
//   />
// ═══════════════════════════════════════════════════════════════════

type Option = {
  value: string;
  label: string;
  count?: number; // Badge opcional con cantidad
};

type SingleProps = {
  mode: "single";
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md";
  shape?: "rect" | "round";
};

type MultiProps = {
  mode: "multi";
  options: Option[];
  value: string[];
  onChange: (values: string[]) => void;
  size?: "sm" | "md";
  shape?: "rect" | "round";
};

type Props = SingleProps | MultiProps;

export default function FilterPills(props: Props) {
  const { options, size = "md", shape = "rect" } = props;
  const isActive = (val: string) =>
    props.mode === "single" ? props.value === val : props.value.includes(val);

  const handleClick = (val: string) => {
    if (props.mode === "single") {
      props.onChange(val);
    } else {
      const next = props.value.includes(val)
        ? props.value.filter((v) => v !== val)
        : [...props.value, val];
      props.onChange(next);
    }
  };

  const height = size === "sm" ? "22px" : "26px";
  const padding = size === "sm" ? "0 8px" : "0 10px";
  const fontSize = size === "sm" ? "9px" : "10px";
  const radius = shape === "round" ? "var(--radius-full)" : "var(--radius-sm)";

  return (
    <div
      style={{
        display: "flex",
        gap: "3px",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {options.map((opt) => {
        const active = isActive(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => handleClick(opt.value)}
            style={{
              height,
              padding,
              borderRadius: radius,
              background: active ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
              border: `1px solid ${active ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
              color: active ? "#fff" : "var(--color-text-muted)",
              fontSize,
              fontWeight: active ? 700 : 600,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              transition: "var(--transition-fast)",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              whiteSpace: "nowrap",
            }}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  padding: "1px 5px",
                  borderRadius: "var(--radius-full)",
                  background: active ? "rgba(255,255,255,0.25)" : "var(--color-border-faint)",
                  color: active ? "#fff" : "var(--color-text-muted)",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1.3,
                }}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}