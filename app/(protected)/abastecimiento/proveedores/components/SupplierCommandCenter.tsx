"use client";
import type { Supplier } from "../types/supplier.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = { suppliers: Supplier[] };

export default function SupplierCommandCenter({ suppliers }: Props) {
  const { t } = useTranslation();
  const tp    = (t.procurement as any) ?? {};

  const total    = suppliers.length;
  const active   = suppliers.filter((s) => s.is_active).length;
  const withScore = suppliers.filter((s) => s.avg_score != null);
  const avgScore = withScore.length
    ? Math.round((withScore.reduce((sum, s) => sum + (s.avg_score ?? 0), 0) / withScore.length) * 10) / 10
    : null;
  const activeContracts = suppliers.reduce((sum, s) => sum + (s.active_contracts ?? 0), 0);

  const cards = [
    { label: tp.totalSuppliers   ?? "Total proveedores", value: total,       sub: "En catálogo",              color: "var(--color-brand-blue)",   bar: 1 },
    { label: tp.activeSuppliers  ?? "Activos",           value: active,      sub: "Aptos para comprar",        color: "var(--color-success-text)", bar: total > 0 ? active/total : 0 },
    { label: tp.avgScore         ?? "Calificación prom", value: avgScore != null ? `${avgScore}/5` : "—", sub: "Promedio general",           color: avgScore != null && avgScore >= 4 ? "var(--color-success-text)" : avgScore != null && avgScore >= 3 ? "#d97706" : "var(--color-text-muted)", bar: avgScore != null ? avgScore/5 : 0 },
    { label: tp.contractsActive  ?? "Contratos vigentes",value: activeContracts, sub: "Contratos marco activos", color: "#7c3aed",                  bar: 0 },
  ];

  return (
    <>
      {cards.map((c) => (
        <div key={c.label} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</div>
          <div style={{ fontSize: typeof c.value === "string" ? "20px" : "26px", fontWeight: 800, color: c.color, lineHeight: 1.1 }}>{c.value}</div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{c.sub}</div>
          {c.bar > 0 && (
            <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
              <div style={{ height: "100%", borderRadius: "var(--radius-full)", background: c.color, width: `${Math.min(c.bar * 100, 100)}%`, transition: "width 0.5s ease" }} />
            </div>
          )}
        </div>
      ))}
    </>
  );
}
