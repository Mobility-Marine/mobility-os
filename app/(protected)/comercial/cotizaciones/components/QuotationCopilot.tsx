"use client";

import type { Quotation } from "../types/quotations.types";
import { STATUS_CONFIG, SERVICE_TYPE_CONFIG } from "../types/quotations.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  quotation: Quotation | null;
};

export default function QuotationCopilot({ quotation }: Props) {
  const { t, lang } = useTranslation();
  const locale = lang === "en" ? "en-US" : "es-MX";

  if (!quotation) {
    return (
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "18px",
        display: "flex", flexDirection: "column", gap: "12px", height: "100%",
      }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Copilot
        </div>
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
  const hasData     = isServices ? services.length > 0 : items.length > 0;

  // ── ANÁLISIS ──────────────────────────────────────────────
  const daysToExpiry = quotation.valid_until
    ? Math.ceil((new Date(quotation.valid_until).getTime() - Date.now()) / 86400000)
    : null;

  const isExpiringSoon = daysToExpiry !== null && daysToExpiry <= 3 && daysToExpiry >= 0;
  const isExpired      = daysToExpiry !== null && daysToExpiry < 0;

  const avgServicePrice = isServices && services.length > 0
    ? services.reduce((s, sv) => s + sv.price, 0) / services.length
    : 0;

  // Detectar servicios con monedas mixtas
  const currencies = isServices ? [...new Set(services.map((sv) => sv.currency))] : [];
  const hasMixedCurrencies = currencies.length > 1;

  // Sugerencias según estado
  const suggestions: { level: "info" | "warning" | "success" | "danger"; text: string }[] = [];

  if (quotation.status === "draft" && hasData) {
    suggestions.push({ level: "info", text: "Cotización lista para enviar al cliente." });
  }
  if (quotation.status === "sent" && !quotation.viewed_at) {
    suggestions.push({ level: "warning", text: "El cliente aún no ha visto la cotización." });
  }
  if (quotation.status === "viewed") {
    suggestions.push({ level: "success", text: "El cliente revisó la cotización — momento ideal para dar seguimiento." });
  }
  if (isExpiringSoon) {
    suggestions.push({ level: "warning", text: `Vence en ${daysToExpiry} día${daysToExpiry === 1 ? "" : "s"}. Considera renovar si no hay respuesta.` });
  }
  if (isExpired && quotation.status !== "accepted" && quotation.status !== "rejected") {
    suggestions.push({ level: "danger", text: "Esta cotización ha expirado. Actualiza la fecha de vigencia." });
  }
  if (hasMixedCurrencies) {
    suggestions.push({ level: "warning", text: `Servicios en monedas mixtas: ${currencies.join(", ")}. Verifica el tipo de cambio al totalizar.` });
  }
  if (!quotation.client_email && !quotation.client?.email) {
    suggestions.push({ level: "warning", text: "Sin email del cliente — no se puede enviar por correo." });
  }
  if (quotation.status === "accepted") {
    suggestions.push({
      level: "success",
      text: isServices
        ? "¡Aceptada! El embarque fue creado en Logística."
        : "¡Aceptada! El pedido fue creado en Comercial.",
    });
  }
  if (quotation.status === "rejected") {
    suggestions.push({ level: "danger", text: "Rechazada. Considera revisar precios o condiciones y generar una nueva versión." });
  }

  const LEVEL_STYLES = {
    info:    { bg: "var(--color-info-bg)",    border: "var(--color-info-border)",    color: "var(--color-info-text)"    },
    warning: { bg: "var(--color-warning-bg)", border: "var(--color-warning-border)", color: "var(--color-warning-text)" },
    success: { bg: "var(--color-success-bg)", border: "var(--color-success-border)", color: "var(--color-success-text)" },
    danger:  { bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)",  color: "var(--color-danger-text)"  },
  };

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "16px",
      display: "flex", flexDirection: "column", gap: "12px",
      height: "100%", minHeight: 0, overflowY: "auto",
    }}>
      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Copilot — {quotation.quote_number}
      </div>

      {/* STATUS BADGE */}
      <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: cfg.bg, border: `1px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>Estado</span>
        <span style={{ fontSize: "13px", fontWeight: 800, color: cfg.color }}>{statusLabel}</span>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "3px" }}>
            {isServices ? "Servicios" : "Productos"}
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-brand-blue)" }}>
            {isServices ? services.length : items.length}
          </div>
        </div>
        <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "3px" }}>Total</div>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
            {quotation.currency} ${Number(quotation.total ?? 0).toLocaleString(locale, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* VIGENCIA */}
      {daysToExpiry !== null && (
        <div style={{
          padding: "8px 12px", borderRadius: "var(--radius-md)",
          background: isExpired ? "var(--color-danger-bg)" : isExpiringSoon ? "var(--color-warning-bg)" : "var(--color-bg-subtle)",
          border: `1px solid ${isExpired ? "var(--color-danger-border)" : isExpiringSoon ? "var(--color-warning-border)" : "var(--color-border-faint)"}`,
          display: "flex", justifyContent: "space-between", fontSize: "12px",
        }}>
          <span style={{ color: "var(--color-text-muted)" }}>Vigencia</span>
          <span style={{ fontWeight: 700, color: isExpired ? "var(--color-danger-text)" : isExpiringSoon ? "var(--color-warning-text)" : "var(--color-text-primary)" }}>
            {isExpired ? "Expirada" : `${daysToExpiry} día${daysToExpiry === 1 ? "" : "s"}`}
          </span>
        </div>
      )}

      {/* SERVICIOS BREAKDOWN */}
      {isServices && services.length > 0 && (
        <div style={{ display: "grid", gap: "5px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Desglose servicios
          </div>
          {services.map((svc, i) => {
            const svcCfg   = SERVICE_TYPE_CONFIG[svc.service_type] ?? SERVICE_TYPE_CONFIG.otro;
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)", fontSize: "11px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: svcCfg.color, flexShrink: 0 }} />
                  <span style={{ color: "var(--color-text-second)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100px" }}>
                    {svc.service_type}
                  </span>
                </div>
                <span style={{ fontWeight: 700, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  {svc.currency} ${Number(svc.price).toLocaleString(locale, { maximumFractionDigits: 0 })}
                </span>
              </div>
            );
          })}
          {avgServicePrice > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)", fontSize: "11px", borderTop: "1px solid var(--color-border-faint)" }}>
              <span style={{ color: "var(--color-text-muted)" }}>Promedio por servicio</span>
              <span style={{ fontWeight: 600, color: "var(--color-text-second)", fontVariantNumeric: "tabular-nums" }}>
                ${avgServicePrice.toLocaleString(locale, { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* SUGERENCIAS */}
      {suggestions.length > 0 && (
        <div style={{ display: "grid", gap: "6px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Análisis
          </div>
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
