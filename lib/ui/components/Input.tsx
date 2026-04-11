"use client";

import { useState } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export default function Input({
  label,
  error,
  hint,
  fullWidth = true,
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: fullWidth ? "100%" : undefined }}>
      {label && (
        <label
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--color-text-second)",
          }}
        >
          {label}
        </label>
      )}
      <input
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: "36px",
          padding: "0 12px",
          borderRadius: "var(--radius-md)",
          border: error
            ? "1px solid var(--color-danger-border)"
            : focused
            ? "1px solid var(--color-brand-blue)"
            : "1px solid var(--color-border)",
          background: "var(--color-bg-subtle)",
          color: "var(--color-text-primary)",
          fontSize: "13px",
          width: fullWidth ? "100%" : undefined,
          outline: "none",
          transition: "var(--transition-fast)",
          boxShadow: focused ? "0 0 0 3px rgba(39,75,151,0.10)" : "none",
          ...style,
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: "11px", color: "var(--color-danger-text)" }}>
          {error}
        </span>
      )}
      {hint && !error && (
        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          {hint}
        </span>
      )}
    </div>
  );
}
