"use client";
import type { Requisition } from "../types/requisition.types";
import { useTranslation }   from "@/lib/i18n/useTranslation";

type Props = { requisitions: Requisition[] };

export default function RequisitionCommandCenter({ requisitions }: Props) {
  const { t } = useTranslation();
  const tp    = (t.procurement as any) ?? {};

  const total    = requisitions.length;
  const pending  = requisitions.filter((r) => r.status === "pending_approval").length;
  const approved = requisitions.filter((r) => r.status === "approved").length;
  const urgent   = requisitions.filter((r) => r.priority === "urgent").length;

  const cards = [
    { label: tp.totalRequisitions ?? "Total", value: total,    sub: "Todas las requisiciones",         color: "var(--color-brand-blue)",   bar: 1 },
    { label: tp.pendingApproval   ?? "Pend. aprobación", value: pending,  sub: "Esperan autorización", color: "#d97706",                   bar: total > 0 ? pending/total : 0 },
    { label: tp.approvedReqs      ?? "Aprobadas",        value: approved, sub: "Listas para cotizar",  color: "var(--color-success-text)", bar: total > 0 ? approved/total : 0 },
    { label: tp.urgentReqs        ?? "Urgentes",         value: urgent,   sub: "Requieren atención",   color: urgent > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)", bar: total > 0 ? urgent/total : 0 },
  ];

  return (
    <>
      {cards.map((c) => (
        <div key={c.label} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: c.color, lineHeight: 1.1 }}>{c.value}</div>
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
