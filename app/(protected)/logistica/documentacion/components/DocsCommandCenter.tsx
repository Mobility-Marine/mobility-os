"use client";
import type { ShipmentDocument } from "../types/docs.types";
import { getExpiringDocs }       from "../services/docs.service";
import { useTranslation }        from "@/lib/i18n/useTranslation";

type Props = { docs: ShipmentDocument[] };

export default function DocsCommandCenter({ docs }: Props) {
  const { t } = useTranslation();
  const tl    = (t.logistics as any) ?? {};

  const total     = docs.length;
  const pending   = docs.filter((d) => d.status === "pending").length;
  const validated = docs.filter((d) => d.status === "validated").length;
  const expiring  = getExpiringDocs(docs, 30).length;

  const cards = [
    { label: tl.totalDocs     ?? "Total", value: total,     sub: `${docs.filter(d=>d.required).length} requeridos`, color: "var(--color-brand-blue)", bar: 1 },
    { label: tl.pendingDocs   ?? "Pendientes", value: pending,   sub: "Requieren acción",      color: "var(--color-text-muted)",   bar: total > 0 ? pending/total : 0 },
    { label: tl.validatedDocs ?? "Validados",  value: validated, sub: "Listos",                color: "var(--color-success-text)", bar: total > 0 ? validated/total : 0 },
    { label: tl.expiringSoonDocs ?? "Por vencer", value: expiring, sub: "Próximos 30 días",    color: "var(--color-warning-text)", bar: total > 0 ? expiring/total : 0 },
  ];

  return (
    <>
      {cards.map((c) => (
        <div key={c.label} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: c.color, lineHeight: 1.1 }}>{c.value}</div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{c.sub}</div>
          <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
            <div style={{ height: "100%", borderRadius: "var(--radius-full)", background: c.color, width: `${Math.min(c.bar * 100, 100)}%`, transition: "width 0.5s ease" }} />
          </div>
        </div>
      ))}
    </>
  );
}
