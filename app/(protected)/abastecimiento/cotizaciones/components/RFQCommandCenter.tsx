"use client";
import type { RFQ } from "../types/rfq.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = { rfqs: RFQ[] };

export default function RFQCommandCenter({ rfqs }: Props) {
  const { t } = useTranslation();
  const tp    = (t.procurement as any) ?? {};

  const total     = rfqs.length;
  const pending   = rfqs.filter((r) => ["draft","sent"].includes(r.status)).length;
  const responses = rfqs.filter((r) => r.status === "responses_received").length;
  const awarded   = rfqs.filter((r) => r.status === "awarded").length;

  const cards = [
    { label: tp.rfqs             ?? "Total RFQs",         value: total,     sub: "Solicitudes de cotización",   color: "var(--color-brand-blue)",   bar: 1 },
    { label: tp.rfqSent          ?? "En proceso",         value: pending,   sub: "Borrador o enviadas",          color: "#d97706",                   bar: total > 0 ? pending/total : 0 },
    { label: tp.rfqResponsesIn   ?? "Con respuestas",     value: responses, sub: "Listas para comparar",         color: "#7c3aed",                   bar: total > 0 ? responses/total : 0 },
    { label: tp.rfqAwarded       ?? "Adjudicadas",        value: awarded,   sub: "Proveedor seleccionado",        color: "var(--color-success-text)", bar: total > 0 ? awarded/total : 0 },
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
