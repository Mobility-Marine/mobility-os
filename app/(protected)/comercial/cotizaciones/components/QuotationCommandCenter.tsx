"use client";

import type { Quotation } from "../types/quotations.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = { quotations: Quotation[] };

export default function QuotationCommandCenter({ quotations }: Props) {
  const { t, lang } = useTranslation();
  const locale = lang === "en" ? "en-US" : "es-MX";

  const total    = quotations.length;
  const drafts   = quotations.filter((q) => q.status === "draft").length;
  const sent     = quotations.filter((q) => q.status === "sent" || q.status === "viewed").length;
  const accepted = quotations.filter((q) => q.status === "accepted").length;
  const expired  = quotations.filter((q) => q.status === "expired").length;

  const totalValue    = quotations.reduce((s, q) => s + (q.total ?? 0), 0);
  const acceptedValue = quotations.filter((q) => q.status === "accepted")
    .reduce((s, q) => s + (q.total ?? 0), 0);
  const pendingValue  = quotations.filter((q) => q.status === "sent" || q.status === "viewed")
    .reduce((s, q) => s + (q.total ?? 0), 0);
  const conversionRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  const formatCurrency = (n: number) =>
    `$${n.toLocaleString(locale, { maximumFractionDigits: 0 })}`;

  const cards = [
    {
      label:    (t.quot as any)?.totalQuotations   ?? "Total cotizaciones",
      value:    total,
      sub:      `${drafts} ${(t.quot as any)?.draft ?? "borradores"} · ${sent} ${(t.quot as any)?.pending ?? "enviadas"}`,
      color:    "var(--color-brand-blue)",
      format:   "number",
      bar:      total > 0 ? (sent + accepted) / total : 0,
    },
    {
      label:    (t.quot as any)?.totalValue        ?? "Valor total pipeline",
      value:    formatCurrency(totalValue),
      sub:      `${(t.quot as any)?.pending ?? "Pendiente"}: ${formatCurrency(pendingValue)}`,
      color:    "var(--color-success-text)",
      format:   "text",
      bar:      totalValue > 0 ? acceptedValue / totalValue : 0,
    },
    {
      label:    (t.quot as any)?.acceptedValue     ?? "Valor cerrado",
      value:    formatCurrency(acceptedValue),
      sub:      `${accepted} ${(t.quot as any)?.accepted ?? "aceptadas"}`,
      color:    "#a78bfa",
      format:   "text",
      bar:      total > 0 ? accepted / total : 0,
    },
    {
      label:    (t.quot as any)?.conversionRate    ?? "Tasa de conversión",
      value:    `${conversionRate}%`,
      sub:      `${expired} ${(t.quot as any)?.expired ?? "expiradas"}`,
      color:    conversionRate >= 50 ? "var(--color-success-text)" : conversionRate >= 25 ? "var(--color-warning-text)" : "var(--color-danger-text)",
      format:   "text",
      bar:      conversionRate / 100,
    },
  ];

  return (
    <>
      {cards.map((card) => (
        <div key={card.label} style={{
          background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
          borderRadius: "var(--radius-lg)", padding: "16px 20px",
          display: "flex", flexDirection: "column", gap: "4px",
        }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {card.label}
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: card.color, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
            {card.value}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{card.sub}</div>
          <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
            <div style={{
              height: "100%", borderRadius: "var(--radius-full)", background: card.color,
              width: `${Math.min(card.bar * 100, 100)}%`, transition: "width 0.5s ease",
            }} />
          </div>
        </div>
      ))}
    </>
  );
}
