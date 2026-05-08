"use client";

import React from "react";
import { IconSearch, IconX } from "./Icons";

// ═══════════════════════════════════════════════════════════════════
// SEARCH INPUT — Input de búsqueda nivel ERP
//
// Patrón Linear/Notion: prefix icon + clear button + tooltip de campos
// soportados. Soporta debouncing externo (componente padre maneja).
//
// Uso típico:
//   <SearchInput
//     value={query}
//     onChange={setQuery}
//     placeholder="Buscar..."
//     hint="Folio, cliente, RFC, monto"
//   />
// ═══════════════════════════════════════════════════════════════════

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string; // Tooltip mostrado debajo cuando está vacío
  size?: "sm" | "md";
  autoFocus?: boolean;
  onSubmit?: () => void; // Cuando el usuario presiona Enter
};

export default function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  hint,
  size = "md",
  autoFocus = false,
  onSubmit,
}: Props) {
  const height = size === "sm" ? "28px" : "34px";
  const iconSize = size === "sm" ? 12 : 13;
  const fontSize = size === "sm" ? "11px" : "12px";

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        style={{
          position: "absolute",
          left: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--color-text-muted)",
          display: "flex",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <IconSearch size={iconSize} strokeWidth={2} />
      </div>

      <input
        type="text"
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSubmit) onSubmit();
        }}
        style={{
          width: "100%",
          height,
          paddingLeft: "30px",
          paddingRight: value ? "30px" : "10px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          background: "var(--color-bg-subtle)",
          color: "var(--color-text-primary)",
          fontSize,
          outline: "none",
          boxSizing: "border-box",
          transition: "var(--transition-fast)",
        }}
      />

      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "18px",
            height: "18px",
            borderRadius: "var(--radius-full)",
            background: "var(--color-border)",
            border: "none",
            color: "var(--color-text-second)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          <IconX size={10} strokeWidth={2.5} />
        </button>
      )}

      {hint && !value && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "12px",
            marginTop: "2px",
            fontSize: "9px",
            color: "var(--color-text-muted)",
            opacity: 0.7,
            pointerEvents: "none",
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}