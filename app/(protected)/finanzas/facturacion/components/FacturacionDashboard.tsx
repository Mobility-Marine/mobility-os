"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CFDIDocument, FacturacionStats } from "../types/facturacion.types";

type PendingShipment = {
  id:           string;
  reference:    string;
  service_type: string;
  currency:     string;
  total:        number;
  client?:      { name: string } | null;
  quotation?:   { quote_number: string } | null;
};

type PendingOrder = {
  id:           string;
  order_number: string;
  currency:     string;
  total:        number;
  delivery_date?: string | null;
  client?:      { name: string } | null;
  quotation?:   { quote_number: string } | null;
};

type Props = {
  stats:              FacturacionStats;
  cfdis:              CFDIDocument[];
  loading:            boolean;
  pendingShipments:   PendingShipment[];
  pendingOrders?:     PendingOrder[];
  onSelect:           (c: CFDIDocument) => void;
  onEmitir:           () => void;
  onFacturarEmbarque: (s: PendingShipment) => void;
  onFacturarPedido?:  (o: PendingOrder) => void;
};

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function FacturacionDashboard({
  stats: s, cfdis, loading,
  pendingShipments, pendingOrders = [],
  onSelect, onEmitir, onFacturarEmbarque, onFacturarPedido,
}: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const recent      = cfdis.slice(0, 8);
  const ppd_pending = cfdis.filter((c) => c.payment_method === "PPD" && c.status === "valid" && c.type === "I");
  const total_ppd   = ppd_pending.reduce((sum, c) => sum + c.total, 0);

  // Banderas y colores por moneda — para los KPIs multi-moneda
  const FLAGS: Record<string, string> = { MXN: "🇲🇽", USD: "🇺🇸", EUR: "🇪🇺", CAD: "🇨🇦", GBP: "🇬🇧" };
  const monedas = Object.entries(s.por_moneda ?? {}).sort(([a],[b]) => a.localeCompare(b));

  const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
    I: { color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
    E: { color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
    P: { color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)"    },
    T: { color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)"  },
    N: { color: "#7c3aed",                   bg: "#ede9fe"                 },
  };
  const TYPE_LABELS: Record<string, { es: string; en: string }> = {
    I: { es: "Factura",   en: "Invoice"  },
    E: { es: "N.Crédito", en: "Credit"   },
    P: { es: "Pago",      en: "Payment"  },
    T: { es: "Traslado",  en: "Transfer" },
    N: { es: "Nómina",    en: "Payroll"  },
  };

  const SVC_ICONS: Record<string, string> = {
    terrestre_mx: "🚛", terrestre_usa: "🚛", maritimo: "🚢", aereo: "✈️",
    multimodal: "🔄", almacenaje: "🏭", aduanal: "📋", consultoria: "💼",
    seguro: "🛡️", otro: "📦",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* KPIs por moneda — un bloque por cada divisa con CFDIs */}
      {monedas.length === 0 ? (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "30px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
          {es ? "Aún no se han emitido CFDIs este período" : "No CFDIs issued this period"}
        </div>
      ) : (
        monedas.map(([cur, m]) => (
          <div key={cur} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {/* Encabezado de moneda */}
            <div style={{ padding: "8px 18px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px" }}>{FLAGS[cur] ?? "💱"}</span>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-text-primary)" }}>{cur}</span>
              <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                · {m.count_emitidas} {es ? "documentos activos" : "active documents"}
              </span>
            </div>

            {/* 4 tarjetas dentro del bloque de la moneda */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
              {[
                {
                  label: es ? "Facturado este mes" : "Invoiced this month",
                  value: `${cur} $${fmt(m.facturado_mes)}`,
                  sub:   `${m.count_mes} ${es ? "documentos" : "documents"}`,
                  color: "var(--color-brand-blue)", bg: "var(--color-info-bg)",
                  icon:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
                },
                {
                  label: es ? "Por cobrar (PPD)" : "Receivable (PPD)",
                  value: `${cur} $${fmt(m.total_pendiente_ppd)}`,
                  sub:   `${m.count_pendiente_ppd} ${es ? "facturas pendientes" : "pending invoices"}`,
                  color: m.total_pendiente_ppd > 0 ? "var(--color-warning-text)" : "var(--color-text-muted)",
                  bg:    m.total_pendiente_ppd > 0 ? "var(--color-warning-bg)"   : "var(--color-bg-subtle)",
                  icon:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                },
                {
                  label: es ? "Canceladas" : "Cancelled",
                  value: String(m.count_canceladas),
                  sub:   es ? "histórico total" : "total history",
                  color: m.count_canceladas > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)",
                  bg:    m.count_canceladas > 0 ? "var(--color-danger-bg)"   : "var(--color-bg-subtle)",
                  icon:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
                },
                {
                  label: es ? "Total emitidas" : "Total issued",
                  value: String(m.count_emitidas),
                  sub:   es ? "todos los CFDIs" : "all CFDIs",
                  color: "var(--color-text-primary)", bg: "var(--color-bg-subtle)",
                  icon:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
                },
              ].map((c, i) => (
                <div key={c.label} style={{ padding: "16px 18px", borderRight: i < 3 ? "1px solid var(--color-border-faint)" : "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</div>
                    <div style={{ width: "26px", height: "26px", borderRadius: "var(--radius-md)", background: c.bg, color: c.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.icon}</div>
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{c.value}</div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{c.sub}</div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* ── PEDIDOS PENDIENTES DE FACTURAR ── */}
      {pendingOrders.length > 0 && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(59,130,246,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>📦</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-brand-blue)" }}>
                  {pendingOrders.length} {es ? "pedido(s) entregados pendientes de facturar" : "delivered order(s) pending invoicing"}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "1px" }}>
                  {es ? "Haz clic en Facturar para generar el CFDI precargado con los productos del pedido" : "Click Invoice to generate pre-filled CFDI with order products"}
                </div>
              </div>
            </div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>
              ${fmt(pendingOrders.reduce((sum, o) => sum + (o.total ?? 0), 0))}
            </div>
          </div>
          {pendingOrders.map((o, i) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 18px", borderBottom: i < pendingOrders.length - 1 ? "1px solid var(--color-border-faint)" : "none" }}>
              <span style={{ fontSize: "18px", flexShrink: 0 }}>🛍️</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-text-primary)", fontFamily: "monospace" }}>{o.order_number}</span>
                  {o.quotation?.quote_number && (
                    <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>← {o.quotation.quote_number}</span>
                  )}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "1px" }}>
                  {o.client?.name ?? "—"}
                  {o.delivery_date && ` · Entregado: ${new Date(o.delivery_date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}`}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                  {o.currency} ${fmt(o.total ?? 0)}
                </div>
              </div>
              <button
                onClick={() => onFacturarPedido?.(o)}
                style={{ height: "30px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                ⚡ {es ? "Facturar" : "Invoice"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── SERVICIOS PENDIENTES DE FACTURAR ── */}
      {pendingShipments.length > 0 && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(245,158,11,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>⚡</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-warning-text)" }}>
                  {pendingShipments.length} {es ? "servicio(s) completados pendientes de facturar" : "completed service(s) pending invoicing"}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "1px" }}>
                  {es ? "Haz clic en Facturar para generar el CFDI precargado" : "Click Invoice to generate pre-filled CFDI"}
                </div>
              </div>
            </div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "var(--color-warning-text)", fontVariantNumeric: "tabular-nums" }}>
              ${fmt(pendingShipments.reduce((sum, sh) => sum + sh.total, 0))}
            </div>
          </div>
          {pendingShipments.map((sh, i) => (
            <div key={sh.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 18px", borderBottom: i < pendingShipments.length - 1 ? "1px solid var(--color-border-faint)" : "none" }}>
              <span style={{ fontSize: "18px", flexShrink: 0 }}>{SVC_ICONS[sh.service_type] ?? "📦"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-text-primary)", fontFamily: "monospace" }}>{sh.reference}</span>
                  {sh.quotation?.quote_number && (
                    <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>← {sh.quotation.quote_number}</span>
                  )}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "1px" }}>
                  {sh.client?.name ?? "—"} · {sh.service_type.replace(/_/g, " ")}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                  {sh.currency} ${fmt(sh.total)}
                </div>
              </div>
              <button
                onClick={() => onFacturarEmbarque(sh)}
                style={{ height: "30px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                ⚡ {es ? "Facturar" : "Invoice"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Alerta PPD */}
      {ppd_pending.length > 0 && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning-text)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-warning-text)" }}>
              {ppd_pending.length} {es ? "factura(s) PPD pendientes de complemento de pago" : "PPD invoice(s) pending payment complement"}
              {" — "}<strong>${fmt(total_ppd)}</strong> {es ? "por cobrar" : "receivable"}
            </div>
          </div>
          <button onClick={onEmitir} style={{ height: "30px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            {es ? "Emitir REP" : "Issue REP"}
          </button>
        </div>
      )}

      {/* Últimos CFDIs + Acciones rápidas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px" }}>
        {/* Recientes */}
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {es ? "CFDIs recientes" : "Recent CFDIs"}
            </div>
          </div>
          {loading ? (
            <div style={{ padding: "30px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>{es ? "Cargando…" : "Loading…"}</div>
          ) : recent.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📄</div>
              <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{es ? "Aún no has emitido ningún CFDI" : "No CFDIs issued yet"}</div>
            </div>
          ) : (
            recent.map((cfdi, i) => {
              const tc = TYPE_COLORS[cfdi.type] ?? TYPE_COLORS.I;
              const tl = TYPE_LABELS[cfdi.type] ?? TYPE_LABELS.I;
              return (
                <div key={cfdi.id} onClick={() => onSelect(cfdi)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 18px", borderBottom: i < recent.length - 1 ? "1px solid var(--color-border-faint)" : "none", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: tc.bg, color: tc.color, flexShrink: 0 }}>
                    {es ? tl.es : tl.en}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cfdi.receiver_name}</div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "1px" }}>
                      {cfdi.serie ?? ""}{cfdi.folio ?? "—"} · {new Date(cfdi.cfdi_date).toLocaleDateString(es ? "es-MX" : "en-US", { month: "short", day: "2-digit" })}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: cfdi.status === "cancelled" ? "var(--color-text-muted)" : "var(--color-text-primary)", fontVariantNumeric: "tabular-nums", textDecoration: cfdi.status === "cancelled" ? "line-through" : "none" }}>
                      ${fmt(cfdi.total)}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{cfdi.currency}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Acciones rápidas */}
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>
            {es ? "Acciones rápidas" : "Quick actions"}
          </div>
          {[
            { labelEs: "Emitir nueva factura",      labelEn: "Issue new invoice",   color: "var(--color-brand-blue)"   },
            { labelEs: "Complemento de pago (REP)", labelEn: "Payment complement",  color: "var(--color-success-text)" },
            { labelEs: "Nota de crédito",           labelEn: "Credit note",         color: "var(--color-warning-text)" },
          ].map((a) => (
            <button key={a.labelEs} onClick={onEmitir}
              style={{ height: "38px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-second)", fontSize: "12px", fontWeight: 600, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "8px" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.color = a.color; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-faint)"; e.currentTarget.style.color = "var(--color-text-second)"; }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {es ? a.labelEs : a.labelEn}
            </button>
          ))}
          <div style={{ borderTop: "1px solid var(--color-border-faint)", paddingTop: "10px", marginTop: "4px" }}>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {es ? "Este mes por moneda" : "This month by currency"}
            </div>
            {monedas.length === 0 ? (
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                {es ? "Sin actividad" : "No activity"}
              </div>
            ) : (
              monedas.map(([cur, m]) => (
                <div key={cur} style={{ marginBottom: "10px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "3px" }}>
                    {FLAGS[cur] ?? "💱"} {cur}
                  </div>
                  {[
                    { l: es ? "Facturas"   : "Invoices",   v: String(m.count_mes) },
                    { l: es ? "Facturado"  : "Billed",     v: `${cur} $${fmt(m.facturado_mes)}` },
                    { l: es ? "Por cobrar" : "Receivable", v: `${cur} $${fmt(m.total_pendiente_ppd)}` },
                  ].map((r) => (
                    <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px", paddingLeft: "8px" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
                      <span style={{ fontWeight: 600, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
