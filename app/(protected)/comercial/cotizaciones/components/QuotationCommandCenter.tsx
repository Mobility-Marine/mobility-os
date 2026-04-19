"use client";
import type { Quotation } from "../types/quotations.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = { quotations: Quotation[] };

// Agrupa totales por moneda desde las líneas de servicios o el total de la cotización
function getTotalsByCurrency(quotations: Quotation[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const q of quotations) {
    // Si tiene billing_concepts con líneas, usar moneda por línea
    const concepts = (q as any).billing_concepts ?? [];
    if (concepts.length > 0) {
      for (const concept of concepts) {
        for (const line of (concept.lines ?? [])) {
          const cur   = line.currency ?? concept.currency ?? q.currency ?? "MXN";
          const price = Number(line.price ?? 0);
          const rate  = line.tax_rate;
          const tax   = (rate === null || rate === undefined || rate === -1 || rate === 0) ? 0 : price * (rate / 100);
          totals[cur] = (totals[cur] ?? 0) + price + tax;
        }
      }
    } else {
      // Fallback: usar total de la cotización con su moneda
      const cur = q.currency ?? "MXN";
      totals[cur] = (totals[cur] ?? 0) + (q.total ?? 0);
    }
  }
  return totals;
}

export default function QuotationCommandCenter({ quotations }: Props) {
  const { t, lang } = useTranslation();
  const locale = lang === "en" ? "en-US" : "es-MX";

  const total    = quotations.length;
  const drafts   = quotations.filter(q => q.status === "draft").length;
  const sent     = quotations.filter(q => q.status === "sent" || q.status === "viewed").length;
  const accepted = quotations.filter(q => q.status === "accepted").length;
  const expired  = quotations.filter(q => q.status === "expired").length;

  const conversionRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  // Totales por moneda — pipeline completo
  const pipelineByCurrency  = getTotalsByCurrency(quotations);
  // Totales por moneda — solo aceptadas
  const acceptedByCurrency  = getTotalsByCurrency(quotations.filter(q => q.status === "accepted"));
  // Totales por moneda — enviadas/vistas
  const pendingByCurrency   = getTotalsByCurrency(quotations.filter(q => q.status === "sent" || q.status === "viewed"));

  const fmt = (n: number, currency: string) => {
    const symbol = currency === "USD" ? "USD $" : currency === "EUR" ? "EUR €" : "$";
    return `${symbol}${n.toLocaleString(locale, { maximumFractionDigits: 0 })}`;
  };

  // Render de totales multi-moneda en una sola línea compacta
  function renderTotals(byCurrency: Record<string, number>, color: string, fontSize = "22px") {
    const entries = Object.entries(byCurrency).filter(([, v]) => v > 0);
    if (entries.length === 0) return <span style={{ fontSize, fontWeight: 800, color }}>$0</span>;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {entries.map(([cur, val]) => (
          <div key={cur} style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{ fontSize, fontWeight: 800, color, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
              {fmt(val, cur)}
            </span>
            {entries.length > 1 && (
              <span style={{ fontSize: "10px", fontWeight: 700, color, opacity: 0.7, textTransform: "uppercase" }}>{cur}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  function renderPendingsSub() {
    const entries = Object.entries(pendingByCurrency).filter(([, v]) => v > 0);
    if (entries.length === 0) return `${(t.quot as any)?.pending ?? "Pendiente"}: $0`;
    return entries.map(([cur, val]) => `${fmt(val, cur)}`).join(" · ");
  }

  function renderAcceptedSub() {
    return `${accepted} ${(t.quot as any)?.accepted ?? "aceptadas"}`;
  }

  return (
    <>
      {/* KPI 1 — Total cotizaciones */}
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: "4px",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {(t.quot as any)?.totalQuotations ?? "Total cotizaciones"}
        </div>
        <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--color-brand-blue)", lineHeight: 1.1 }}>
          {total}
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          {drafts} {(t.quot as any)?.draft ?? "borradores"} · {sent} {(t.quot as any)?.pending ?? "enviadas"}
        </div>
        <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
          <div style={{ height: "100%", borderRadius: "var(--radius-full)", background: "var(--color-brand-blue)", width: `${total > 0 ? Math.min(((sent + accepted) / total) * 100, 100) : 0}%`, transition: "width 0.5s ease" }} />
        </div>
      </div>

      {/* KPI 2 — Pipeline total por moneda */}
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: "4px",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {(t.quot as any)?.totalValue ?? "Valor total pipeline"}
        </div>
        {renderTotals(pipelineByCurrency, "var(--color-success-text)", "22px")}
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          {(t.quot as any)?.pending ?? "Pendiente"}: {renderPendingsSub()}
        </div>
        <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
          <div style={{ height: "100%", borderRadius: "var(--radius-full)", background: "var(--color-success-text)", width: `${total > 0 ? Math.min((accepted / total) * 100, 100) : 0}%`, transition: "width 0.5s ease" }} />
        </div>
      </div>

      {/* KPI 3 — Valor cerrado por moneda */}
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: "4px",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {(t.quot as any)?.acceptedValue ?? "Valor cerrado"}
        </div>
        {renderTotals(acceptedByCurrency, "#a78bfa", "22px")}
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          {renderAcceptedSub()}
        </div>
        <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
          <div style={{ height: "100%", borderRadius: "var(--radius-full)", background: "#a78bfa", width: `${total > 0 ? Math.min((accepted / total) * 100, 100) : 0}%`, transition: "width 0.5s ease" }} />
        </div>
      </div>

      {/* KPI 4 — Tasa de conversión */}
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: "4px",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {(t.quot as any)?.conversionRate ?? "Tasa de conversión"}
        </div>
        <div style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1.1, color: conversionRate >= 50 ? "var(--color-success-text)" : conversionRate >= 25 ? "var(--color-warning-text)" : "var(--color-danger-text)" }}>
          {conversionRate}%
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          {expired} {(t.quot as any)?.expired ?? "expiradas"}
        </div>
        <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
          <div style={{ height: "100%", borderRadius: "var(--radius-full)", background: conversionRate >= 50 ? "var(--color-success-text)" : conversionRate >= 25 ? "var(--color-warning-text)" : "var(--color-danger-text)", width: `${Math.min(conversionRate, 100)}%`, transition: "width 0.5s ease" }} />
        </div>
      </div>
    </>
  );
}
