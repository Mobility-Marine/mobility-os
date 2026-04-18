import React from "react";

export const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};
export const SELECT: React.CSSProperties = { ...INPUT, cursor: "pointer" };
export const TEXTAREA: React.CSSProperties = {
  ...INPUT, height: "auto", padding: "8px 12px", resize: "vertical" as const,
};

export function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {children}{required && <span style={{ color: "var(--color-danger-text)", marginLeft: "3px" }}>*</span>}
    </div>
  );
}

export function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {children}
      {hint && <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "3px" }}>{hint}</div>}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", paddingBottom: "6px", borderBottom: "1px solid var(--color-border-faint)", marginTop: "4px" }}>
      {children}
    </div>
  );
}

export function InfoBox({ children, type = "info" }: {
  children: React.ReactNode;
  type?: "info" | "warning" | "success";
}) {
  const colors = {
    info:    { bg: "var(--color-info-bg)",    border: "var(--color-info-border)",    text: "var(--color-info-text)"    },
    warning: { bg: "var(--color-warning-bg)", border: "var(--color-warning-border)", text: "var(--color-warning-text)" },
    success: { bg: "var(--color-success-bg)", border: "var(--color-success-border)", text: "var(--color-success-text)" },
  };
  const c = colors[type];
  return (
    <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: c.bg, border: `1px solid ${c.border}`, fontSize: "12px", color: c.text, lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

export function Grid2({ children, gap = "10px" }: { children: React.ReactNode; gap?: string }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap }}>{children}</div>;
}

export function Grid3({ children, gap = "10px" }: { children: React.ReactNode; gap?: string }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap }}>{children}</div>;
}
