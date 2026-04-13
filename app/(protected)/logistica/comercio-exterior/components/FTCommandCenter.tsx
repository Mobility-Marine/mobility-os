"use client";
import type { ForeignTradeOperation } from "../types/foreign-trade.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { fmtCurrency }    from "../services/foreign-trade.service";

type Props = { ops: ForeignTradeOperation[] };

export default function FTCommandCenter({ ops }: Props) {
  const { t } = useTranslation();
  const tl    = (t.logistics as any) ?? {};

  const total     = ops.length;
  const inProcess = ops.filter((o) => ["open","in_process","at_customs"].includes(o.status)).length;
  const released  = ops.filter((o) => o.status === "released").length;
  const totalTax  = ops.reduce((sum, o) => sum + (o.total_taxes ?? 0), 0);

  const cards = [
    { label: tl.totalOperations   ?? "Total",        value: total,          sub: `${ops.filter(o=>o.operation_type==="import").length} imp · ${ops.filter(o=>o.operation_type==="export").length} exp`, color: "var(--color-brand-blue)",   bar: 1 },
    { label: tl.openOperations     ?? "En proceso",   value: inProcess,      sub: "Activas en aduana",      color: "#d97706",                   bar: total > 0 ? inProcess/total : 0 },
    { label: tl.releasedOperations ?? "Liberadas",    value: released,       sub: "Completadas",            color: "var(--color-success-text)", bar: total > 0 ? released/total : 0  },
    { label: tl.totalTaxesKPI      ?? "Contribuciones", value: fmtCurrency(totalTax), sub: "USD — suma histórica", color: "var(--color-text-primary)", bar: 0 },
  ];

  return (
    <>
      {cards.map((c) => (
        <div key={c.label} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</div>
          <div style={{ fontSize: typeof c.value === "string" ? "18px" : "26px", fontWeight: 800, color: c.color, lineHeight: 1.1 }}>{c.value}</div>
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
