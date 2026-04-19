"use client";
import type { Quotation } from "../types/quotations.types";
import { STATUS_CONFIG } from "../types/quotations.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = { quotation: Quotation | null };

// Totales por moneda desde billing_concepts
function getTotalsByCurrency(quotation: Quotation): Record<string, { subtotal: number; tax: number; total: number }> {
  const concepts = (quotation as any).billing_concepts ?? [];
  const byCurrency: Record<string, { subtotal: number; tax: number; total: number }> = {};

  if (concepts.length > 0) {
    for (const concept of concepts) {
      for (const line of (concept.lines ?? [])) {
        const cur   = line.currency ?? concept.currency ?? quotation.currency ?? "MXN";
        const price = Number(line.price ?? 0);
        const rate  = line.tax_rate;
        const tax   = (rate === null || rate === undefined || rate === -1 || rate === 0) ? 0 : price * (rate / 100);
        if (!byCurrency[cur]) byCurrency[cur] = { subtotal: 0, tax: 0, total: 0 };
        byCurrency[cur].subtotal += price;
        byCurrency[cur].tax      += tax;
        byCurrency[cur].total    += price + tax;
      }
    }
    return byCurrency;
  }

  // Fallback cotizaciones sin billing_concepts
  const cur = quotation.currency ?? "MXN";
  return { [cur]: { subtotal: quotation.subtotal ?? 0, tax: quotation.tax_amount ?? 0, total: quotation.total ?? 0 } };
}

// Desglose de conceptos con sus líneas
function getConceptSummary(quotation: Quotation): { description: string; byCurrency: Record<string, number> }[] {
  const concepts = (quotation as any).billing_concepts ?? [];
  return concepts.map((concept: any) => {
    const byCurrency: Record<string, number> = {};
    for (const line of (concept.lines ?? [])) {
      const cur = line.currency ?? concept.currency ?? "MXN";
      byCurrency[cur] = (byCurrency[cur] ?? 0) + Number(line.price ?? 0);
    }
    return { description: concept.description, byCurrency };
  });
}

export default function QuotationCopilot({ quotation }: Props) {
  const { t, lang } = useTranslation();
  const locale = lang === "en" ? "en-US" : "es-MX";

  if (!quotation) {
    return (
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Copilot</div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          {(t.quot as any)?.copilotEmpty ?? "Selecciona una cotización para ver análisis e inteligencia."}
        </div>
      </div>
    );
  }

  const cfg         = STATUS_CONFIG[quotation.status] ?? STATUS_CONFIG.draft;
  const statusLabel = (t.quot as any)?.[cfg.labelKey.replace("quot.", "")] ?? quotation.status;
  const isServices  = quotation.type === "services";
  const items       = quotation.items    ?? [];
  const services    = quotation.services ?? [];
  const subtype     = (quotation as any).service_subtype as string | undefined;

  // Totales multi-moneda
  const totalsByCurrency = getTotalsByCurrency(quotation);
  const currencyEntries  = Object.entries(totalsByCurrency).filter(([, v]) => v.total > 0);
  const conceptSummary   = getConceptSummary(quotation);

  // Monedas presentes
  const currencies     = currencyEntries.map(([cur]) => cur);
  const hasMixedCurrencies = currencies.length > 1;

  // Análisis
  const daysToExpiry   = quotation.valid_until
    ? Math.ceil((new Date(quotation.valid_until).getTime() - Date.now()) / 86400000)
    : null;
  const isExpiringSoon = daysToExpiry !== null && daysToExpiry <= 3 && daysToExpiry >= 0;
  const isExpired      = daysToExpiry !== null && daysToExpiry < 0;

  const hasData = isServices
    ? (conceptSummary.length > 0 || services.length > 0)
    : items.length > 0;

  const suggestions: { level: "info" | "warning" | "success" | "danger"; text: string }[] = [];

  if (quotation.status === "draft" && hasData)
    suggestions.push({ level: "info", text: "Cotización lista para enviar al cliente." });
  if (quotation.status === "sent" && !quotation.viewed_at)
    suggestions.push({ level: "warning", text: "El cliente aún no ha visto la cotización." });
  if (quotation.status === "viewed")
    suggestions.push({ level: "success", text: "El cliente revisó la cotización — momento ideal para dar seguimiento." });
  if (isExpiringSoon)
    suggestions.push({ level: "warning", text: `Vence en ${daysToExpiry} día${daysToExpiry === 1 ? "" : "s"}. Considera renovar si no hay respuesta.` });
  if (isExpired && quotation.status !== "accepted" && quotation.status !== "rejected")
    suggestions.push({ level: "danger", text: "Esta cotización ha expirado. Actualiza la fecha de vigencia." });
  if (hasMixedCurrencies)
    suggestions.push({ level: "warning", text: `Cotización multi-moneda: ${currencies.join(" + ")}. Los totales se muestran separados por moneda.` });
  if (!quotation.client_email && !quotation.client?.email && !quotation.contact_email)
    suggestions.push({ level: "warning", text: "Sin email del cliente — no se puede enviar por correo." });
  if (quotation.status === "accepted")
    suggestions.push({ level: "success", text: isServices ? "¡Aceptada! El embarque fue creado en Logística." : "¡Aceptada! El pedido fue creado en Comercial." });
  if (quotation.status === "rejected")
    suggestions.push({ level: "danger", text: "Rechazada. Considera revisar precios o condiciones y generar una nueva versión." });
  if (isServices && !subtype)
    suggestions.push({ level: "info", text: "Cotización de servicios sin subtipo definido." });

  const LEVEL_STYLES = {
    info:    { bg: "var(--color-info-bg)",    border: "var(--color-info-border)",    color: "var(--color-info-text)"    },
    warning: { bg: "var(--color-warning-bg)", border: "var(--color-warning-border)", color: "var(--color-warning-text)" },
    success: { bg: "var(--color-success-bg)", border: "var(--color-success-border)", color: "var(--color-success-text)" },
    danger:  { bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)",  color: "var(--color-danger-text)"  },
  };

  const fmtCur = (val: number, cur: string) => {
    const prefix = cur === "MXN" ? "$" : `${cur} $`;
    return `${prefix}${val.toLocaleString(locale, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", height: "100%", minHeight: 0, overflowY: "auto" }}>

      {/* TÍTULO */}
      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Copilot — {quotation.quote_number}
      </div>

      {/* STATUS */}
      <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: cfg.bg, border: `1px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>Estado</span>
        <span style={{ fontSize: "13px", fontWeight: 800, color: cfg.color }}>{statusLabel}</span>
      </div>

      {/* KPIs — multi-moneda */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "3px" }}>
            {isServices ? "Conceptos" : "Productos"}
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-brand-blue)" }}>
            {isServices ? (conceptSummary.length || services.length) : items.length}
          </div>
          {subtype && (
            <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-info-text)", marginTop: "3px" }}>
              {subtype.replace(/_/g, " ").toUpperCase()}
            </div>
          )}
        </div>
        <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "3px" }}>Total</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
            {currencyEntries.length > 0 ? currencyEntries.map(([cur, vals]) => (
              <div key={cur} style={{ fontSize: currencyEntries.length > 1 ? "11px" : "14px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                {fmtCur(vals.total, cur)}
              </div>
            )) : (
              <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-success-text)" }}>$0</div>
            )}
          </div>
        </div>
      </div>

      {/* VIGENCIA */}
      {daysToExpiry !== null && (
        <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: isExpired ? "var(--color-danger-bg)" : isExpiringSoon ? "var(--color-warning-bg)" : "var(--color-bg-subtle)", border: `1px solid ${isExpired ? "var(--color-danger-border)" : isExpiringSoon ? "var(--color-warning-border)" : "var(--color-border-faint)"}`, display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
          <span style={{ color: "var(--color-text-muted)" }}>Vigencia</span>
          <span style={{ fontWeight: 700, color: isExpired ? "var(--color-danger-text)" : isExpiringSoon ? "var(--color-warning-text)" : "var(--color-text-primary)" }}>
            {isExpired ? "Expirada" : `${daysToExpiry} día${daysToExpiry === 1 ? "" : "s"}`}
          </span>
        </div>
      )}

      {/* DESGLOSE POR MONEDA — cuando hay más de una */}
      {hasMixedCurrencies && (
        <div style={{ display: "grid", gap: "4px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Totales por moneda</div>
          {currencyEntries.map(([cur, vals]) => (
            <div key={cur} style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                <span style={{ fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>{cur}</span>
                <span style={{ fontWeight: 800, color: "var(--color-success-text)" }}>{fmtCur(vals.total, cur)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--color-text-muted)" }}>
                <span>Subtotal {fmtCur(vals.subtotal, cur)}</span>
                <span>IVA {fmtCur(vals.tax, cur)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DESGLOSE CONCEPTOS */}
      {isServices && conceptSummary.length > 0 && (
        <div style={{ display: "grid", gap: "5px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Conceptos de facturación
          </div>
          {conceptSummary.map((concept, i) => (
            <div key={i} style={{ padding: "7px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-second)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {concept.description}
                </span>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1px", flexShrink: 0 }}>
                  {Object.entries(concept.byCurrency).map(([cur, val]) => (
                    <span key={cur} style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                      {fmtCur(val, cur)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUGERENCIAS */}
      {suggestions.length > 0 && (
        <div style={{ display: "grid", gap: "6px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Análisis</div>
          {suggestions.map((s, i) => {
            const style = LEVEL_STYLES[s.level];
            return (
              <div key={i} style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)", background: style.bg, border: `1px solid ${style.border}`, fontSize: "11px", color: style.color, lineHeight: 1.5 }}>
                {s.text}
              </div>
            );
          })}
        </div>
      )}

      {/* FLUJO */}
      <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "11px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
        <div style={{ fontWeight: 700, color: "var(--color-text-second)", marginBottom: "4px" }}>Flujo de conversión</div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span>Cotización</span>
          <span>→</span>
          <span style={{ fontWeight: 700, color: isServices ? "var(--color-info-text)" : "var(--color-success-text)" }}>
            {isServices ? "Embarque" : "Pedido"}
          </span>
          {(quotation.shipment_id || quotation.order_id) && (
            <>
              <span>→</span>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-success-text)" }}>✓ Creado</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
