"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type {
  CFDIDocument,
  FacturacionStats,
  DashboardFilters,
  ActiveTypeFilter,
  ActiveStatusFilter,
  PeriodFilter,
  CurrencyFilter,
} from "../types/facturacion.types";
import { countActiveFilters, DEFAULT_DASHBOARD_FILTERS } from "../types/facturacion.types";
import DateRangePicker from "@/app/components/DateRangePicker";

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
  onEditProforma?:    (c: CFDIDocument) => void;
  onEmitir:           () => void;
  onFacturarEmbarque: (s: PendingShipment) => void;
  onFacturarPedido?:  (o: PendingOrder) => void;
  /** Filtros multi-dimensionales del Dashboard. Si no se pasa, usa defaults internos. */
  filters?:           DashboardFilters;
  onChangeFilters?:   (f: DashboardFilters) => void;
};

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Helper: traducir PeriodFilter a rango de fechas ──────────────────
function getDateRangeForPeriod(
  period: PeriodFilter,
  customStart?: string,
  customEnd?: string,
): { from: Date | null; to: Date | null } {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay   = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (period) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "week": {
      // Lunes de esta semana - domingo
      const day = now.getDay(); // 0 = Dom, 1 = Lun
      const diffToMon = day === 0 ? -6 : 1 - day;
      const mon = new Date(now); mon.setDate(now.getDate() + diffToMon);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { from: startOfDay(mon), to: endOfDay(sun) };
    }
    case "month":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
        to:   new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3);
      return {
        from: new Date(now.getFullYear(), q * 3, 1, 0, 0, 0, 0),
        to:   new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999),
      };
    }
    case "year":
      return {
        from: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
        to:   new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
      };
    case "custom":
      return {
        from: customStart ? startOfDay(new Date(customStart + "T00:00:00")) : null,
        to:   customEnd   ? endOfDay(new Date(customEnd   + "T00:00:00")) : null,
      };
    case "all":
    default:
      return { from: null, to: null };
  }
}

// ── Helper: clasificar un CFDI según los 4 filtros + búsqueda ────────
function matchesAllFilters(cfdi: CFDIDocument, filters: DashboardFilters): boolean {
  // ── 1. Filtro por TIPO ────────────────────────────────────────────
  if (filters.type !== "all") {
    const hasCCP = !!cfdi.has_carta_porte;
    if (filters.type === "factura"      && !(cfdi.type === "I" && !hasCCP)) return false;
    if (filters.type === "carta_porte"  && !hasCCP) return false;
    if (filters.type === "traslado"     && !(cfdi.type === "T" && !hasCCP)) return false;
    if (filters.type === "nota_credito" && cfdi.type !== "E") return false;
    if (filters.type === "complemento"  && cfdi.type !== "P") return false;
    if (filters.type === "nomina"       && cfdi.type !== "N") return false;
  }

  // ── 2. Filtro por ESTADO ──────────────────────────────────────────
  if (filters.status !== "all") {
    if (filters.status === "valid"     && cfdi.status !== "valid") return false;
    if (filters.status === "proforma"  && cfdi.status !== "proforma") return false;
    if (filters.status === "cancelled" && cfdi.status !== "cancelled" && cfdi.status !== "cancellation_requested") return false;
    if (filters.status === "ppd_pending") {
      if (cfdi.status !== "valid") return false;
      if (cfdi.payment_method !== "PPD") return false;
      if (cfdi.type !== "I") return false;
    }
  }

  // ── 3. Filtro por PERÍODO ─────────────────────────────────────────
  if (filters.period !== "all") {
    const { from, to } = getDateRangeForPeriod(filters.period, filters.customStart, filters.customEnd);
    if (from || to) {
      const cfdiDate = new Date(cfdi.cfdi_date);
      if (from && cfdiDate < from) return false;
      if (to   && cfdiDate > to)   return false;
    }
  }

  // ── 4. Filtro por MONEDA ──────────────────────────────────────────
  if (filters.currency !== "all" && cfdi.currency !== filters.currency) return false;

  // ── 5. BÚSQUEDA libre (folio, cliente, RFC, notas) ────────────────
  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    const haystack = [
      cfdi.serie ?? "",
      cfdi.folio ?? "",
      cfdi.uuid ?? "",
      cfdi.receiver_name ?? "",
      cfdi.receiver_rfc  ?? "",
      cfdi.notes ?? "",
    ].join(" ").toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  return true;
}

export default function FacturacionDashboard({
  stats: s, cfdis, loading,
  pendingShipments, pendingOrders = [],
  onSelect, onEditProforma,
  onEmitir, onFacturarEmbarque, onFacturarPedido,
  filters = DEFAULT_DASHBOARD_FILTERS,
  onChangeFilters,
}: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  // ── Estado local: modal del DateRangePicker ──
  const [dateRangePickerOpen, setDateRangePickerOpen] = useState(false);

  // ── Aplicar TODOS los filtros ──
  const filtered = useMemo(() => cfdis.filter(c => matchesAllFilters(c, filters)), [cfdis, filters]);
  const recent   = filtered.slice(0, 50);

  // ── Helper: actualizar un sub-filtro ──
  const setF = (patch: Partial<DashboardFilters>) => {
    if (!onChangeFilters) return;
    onChangeFilters({ ...filters, ...patch });
  };

  // ── Conteos para los chips de TIPO (siempre cuentan sobre el universo total) ──
  const typeCounts = useMemo(() => ({
    all:          cfdis.length,
    factura:      cfdis.filter(c => c.type === "I" && !c.has_carta_porte && c.status !== "proforma" && c.status !== "cancelled").length,
    carta_porte:  cfdis.filter(c => !!c.has_carta_porte).length,
    traslado:     cfdis.filter(c => c.type === "T" && !c.has_carta_porte).length,
    nota_credito: cfdis.filter(c => c.type === "E" && c.status === "valid").length,
    complemento:  cfdis.filter(c => c.type === "P" && c.status === "valid").length,
    nomina:       cfdis.filter(c => c.type === "N" && c.status === "valid").length,
  }), [cfdis]);

  const statusCounts = useMemo(() => ({
    all:         cfdis.length,
    valid:       cfdis.filter(c => c.status === "valid").length,
    proforma:    cfdis.filter(c => c.status === "proforma").length,
    ppd_pending: cfdis.filter(c => c.payment_method === "PPD" && c.status === "valid" && c.type === "I").length,
    cancelled:   cfdis.filter(c => c.status === "cancelled" || c.status === "cancellation_requested").length,
  }), [cfdis]);

  // ── Monedas disponibles dinámicamente ──
  const availableCurrencies = useMemo(() => {
    const set = new Set<string>();
    cfdis.forEach(c => { if (c.currency) set.add(c.currency); });
    return Array.from(set).sort();
  }, [cfdis]);

  // ── Alerta PPD ──
  const ppd_pending = cfdis.filter(c => c.payment_method === "PPD" && c.status === "valid" && c.type === "I");
  const total_ppd   = ppd_pending.reduce((sum, c) => sum + c.total, 0);

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

  // ── Definición de los 4 grupos de chips ──
  const TYPE_CHIPS: { key: ActiveTypeFilter; labelEs: string; labelEn: string; color: string; bg: string }[] = [
    { key: "all",          labelEs: "Todos",         labelEn: "All",          color: "var(--color-text-primary)", bg: "var(--color-bg-subtle)" },
    { key: "factura",      labelEs: "Facturas",      labelEn: "Invoices",     color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
    { key: "carta_porte",  labelEs: "Carta Porte",   labelEn: "Bill of Lading", color: "var(--color-brand-orange)", bg: "var(--color-brand-orange-light)" },
    { key: "traslado",     labelEs: "Traslados",     labelEn: "Transfers",    color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)" },
    { key: "nota_credito", labelEs: "N. Crédito",    labelEn: "Credit notes", color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
    { key: "complemento",  labelEs: "Complementos",  labelEn: "Payments",     color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)" },
    { key: "nomina",       labelEs: "Nómina",        labelEn: "Payroll",      color: "#7c3aed",                   bg: "#ede9fe" },
  ];

  const STATUS_CHIPS: { key: ActiveStatusFilter; labelEs: string; labelEn: string; color: string; bg: string }[] = [
    { key: "all",         labelEs: "Todos",        labelEn: "All",          color: "var(--color-text-primary)", bg: "var(--color-bg-subtle)" },
    { key: "valid",       labelEs: "Vigentes",     labelEn: "Active",       color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
    { key: "proforma",    labelEs: "Borradores",   labelEn: "Drafts",       color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)" },
    { key: "ppd_pending", labelEs: "PPD por cobrar", labelEn: "PPD pending", color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
    { key: "cancelled",   labelEs: "Canceladas",   labelEn: "Cancelled",    color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)" },
  ];

  const PERIOD_CHIPS: { key: PeriodFilter; labelEs: string; labelEn: string }[] = [
    { key: "all",     labelEs: "Todo",       labelEn: "All time" },
    { key: "today",   labelEs: "Hoy",        labelEn: "Today" },
    { key: "week",    labelEs: "Semana",     labelEn: "Week" },
    { key: "month",   labelEs: "Mes",        labelEn: "Month" },
    { key: "quarter", labelEs: "Trimestre",  labelEn: "Quarter" },
    { key: "year",    labelEs: "Año",        labelEn: "Year" },
    { key: "custom",  labelEs: "Personalizado…", labelEn: "Custom…" },
  ];

  // Click handler: si es proforma → onEditProforma, si no → onSelect
  function handleRowClick(cfdi: CFDIDocument) {
    if (cfdi.status === "proforma" && onEditProforma) {
      onEditProforma(cfdi);
    } else {
      onSelect(cfdi);
    }
  }

  // Activo si filters !== defaults
  const activeFilterCount = countActiveFilters(filters);

  // Etiqueta legible del rango personalizado
  const customRangeLabel = filters.period === "custom" && filters.customStart && filters.customEnd
    ? `${filters.customStart} → ${filters.customEnd}`
    : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* KPIs por moneda */}
      {monedas.length === 0 ? (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "30px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
          {es ? "Aún no se han emitido CFDIs este período" : "No CFDIs issued this period"}
        </div>
      ) : (
        monedas.map(([cur, m]) => (
          <div key={cur} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <div style={{ padding: "8px 18px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px" }}>{FLAGS[cur] ?? "💱"}</span>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-text-primary)" }}>{cur}</span>
              <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>· {m.count_emitidas} {es ? "documentos activos" : "active documents"}</span>
            </div>
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

      {/* PEDIDOS PENDIENTES DE FACTURAR */}
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
              <button onClick={() => onFacturarPedido?.(o)}
                style={{ height: "30px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                ⚡ {es ? "Facturar" : "Invoice"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* SERVICIOS PENDIENTES DE FACTURAR */}
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
              <button onClick={() => onFacturarEmbarque(sh)}
                style={{ height: "30px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
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

      {/* ════════════════════════════════════════════════════════════════
          LISTA PRINCIPAL CON FILTROS GOD: 4 GRUPOS + BÚSQUEDA
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px" }}>
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>

          {/* Header con título + búsqueda + indicador filtros */}
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", flexShrink: 0 }}>
                {es ? "Documentos fiscales" : "Tax documents"}
                <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: 500, color: "var(--color-text-muted)" }}>
                  · {filtered.length} {es ? "resultado(s)" : "result(s)"}
                </span>
              </div>

              {/* Búsqueda + Limpiar filtros */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, justifyContent: "flex-end" }}>
                <div style={{ position: "relative", maxWidth: "320px", width: "100%" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"
                    style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={e => setF({ search: e.target.value })}
                    placeholder={es ? "Buscar por folio, cliente, RFC…" : "Search by folio, client, RFC…"}
                    style={{
                      width: "100%", height: "30px", padding: "0 10px 0 30px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border-faint)",
                      background: "var(--color-bg-subtle)",
                      color: "var(--color-text-primary)",
                      fontSize: "12px", outline: "none",
                    }}
                  />
                  {filters.search && (
                    <button onClick={() => setF({ search: "" })} aria-label="clear search"
                      style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", border: "none", background: "transparent", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <button onClick={() => onChangeFilters?.(DEFAULT_DASHBOARD_FILTERS)}
                    style={{ height: "30px", padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-danger-border)", background: "var(--color-danger-bg)", color: "var(--color-danger-text)", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    {es ? `Limpiar ${activeFilterCount}` : `Clear ${activeFilterCount}`}
                  </button>
                )}
              </div>
            </div>

            {/* 4 DROPDOWNS DE FILTRO en una sola fila — limpio y compacto */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {/* TIPO */}
              <FilterDropdown
                labelEs="Tipo" labelEn="Type" es={es}
                currentLabel={(() => {
                  const c = TYPE_CHIPS.find(x => x.key === filters.type);
                  return c ? (es ? c.labelEs : c.labelEn) : (es ? "Todos" : "All");
                })()}
                isActive={filters.type !== "all"}
                activeColor={TYPE_CHIPS.find(x => x.key === filters.type)?.color}
                activeBg={TYPE_CHIPS.find(x => x.key === filters.type)?.bg}
                options={TYPE_CHIPS.map(c => ({
                  value: c.key,
                  label: es ? c.labelEs : c.labelEn,
                  color: c.color,
                  bg: c.bg,
                  count: (typeCounts as any)[c.key],
                }))}
                onChange={(v) => setF({ type: v as ActiveTypeFilter })}
              />

              {/* ESTADO */}
              <FilterDropdown
                labelEs="Estado" labelEn="Status" es={es}
                currentLabel={(() => {
                  const c = STATUS_CHIPS.find(x => x.key === filters.status);
                  return c ? (es ? c.labelEs : c.labelEn) : (es ? "Todos" : "All");
                })()}
                isActive={filters.status !== "all"}
                activeColor={STATUS_CHIPS.find(x => x.key === filters.status)?.color}
                activeBg={STATUS_CHIPS.find(x => x.key === filters.status)?.bg}
                options={STATUS_CHIPS.map(c => ({
                  value: c.key,
                  label: es ? c.labelEs : c.labelEn,
                  color: c.color,
                  bg: c.bg,
                  count: (statusCounts as any)[c.key],
                }))}
                onChange={(v) => setF({ status: v as ActiveStatusFilter })}
              />

              {/* PERÍODO */}
              <FilterDropdown
                labelEs="Período" labelEn="Period" es={es}
                currentLabel={
                  filters.period === "custom" && customRangeLabel
                    ? customRangeLabel
                    : (() => {
                        const c = PERIOD_CHIPS.find(x => x.key === filters.period);
                        return c ? (es ? c.labelEs : c.labelEn) : (es ? "Todo" : "All time");
                      })()
                }
                isActive={filters.period !== "all"}
                activeColor="var(--color-brand-blue)"
                activeBg="var(--color-info-bg)"
                options={PERIOD_CHIPS.map(c => ({
                  value: c.key,
                  label: es ? c.labelEs : c.labelEn,
                }))}
                onChange={(v) => {
                  if (v === "custom") {
                    setDateRangePickerOpen(true);
                  } else {
                    setF({ period: v as PeriodFilter, customStart: undefined, customEnd: undefined });
                  }
                }}
              />

              {/* MONEDA (solo si hay más de 1) */}
              {availableCurrencies.length > 1 && (
                <FilterDropdown
                  labelEs="Moneda" labelEn="Currency" es={es}
                  currentLabel={
                    filters.currency === "all"
                      ? (es ? "Todas" : "All")
                      : `${FLAGS[filters.currency] ?? "💱"} ${filters.currency}`
                  }
                  isActive={filters.currency !== "all"}
                  activeColor="var(--color-text-primary)"
                  activeBg="var(--color-bg-subtle)"
                  options={[
                    { value: "all", label: es ? "Todas" : "All" },
                    ...availableCurrencies.map(cur => ({
                      value: cur,
                      label: `${FLAGS[cur] ?? "💱"} ${cur}`,
                    })),
                  ]}
                  onChange={(v) => setF({ currency: v as CurrencyFilter })}
                />
              )}
            </div>

          {/* Lista filtrada */}
          {loading ? (
            <div style={{ padding: "30px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
              {es ? "Cargando…" : "Loading…"}
            </div>
          ) : recent.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📄</div>
              <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                {activeFilterCount === 0
                  ? (es ? "Aún no has emitido ningún CFDI" : "No CFDIs issued yet")
                  : (es ? "Sin resultados con estos filtros" : "No results with these filters")}
              </div>
              {activeFilterCount > 0 && (
                <button onClick={() => onChangeFilters?.(DEFAULT_DASHBOARD_FILTERS)}
                  style={{ marginTop: "12px", height: "28px", padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", background: "var(--color-bg-base)", color: "var(--color-brand-blue)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                  {es ? "Limpiar filtros" : "Clear filters"}
                </button>
              )}
            </div>
          ) : (
            recent.map((cfdi, i) => {
              const tc        = TYPE_COLORS[cfdi.type] ?? TYPE_COLORS.I;
              const tl        = TYPE_LABELS[cfdi.type] ?? TYPE_LABELS.I;
              const isProf    = cfdi.status === "proforma";
              const isCancel  = cfdi.status === "cancelled" || cfdi.status === "cancellation_requested";
              const hasCCP    = !!cfdi.has_carta_porte;

              return (
                <div key={cfdi.id} onClick={() => handleRowClick(cfdi)}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 18px", borderBottom: i < recent.length - 1 ? "1px solid var(--color-border-faint)" : "none", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>

                  {/* Badge de estado */}
                  {isProf ? (
                    <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 7px", borderRadius: "var(--radius-full)", background: "var(--color-info-bg)", color: "var(--color-brand-blue)", border: "1px solid var(--color-info-border)", flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                      📝 {es ? "Proforma" : "Proforma"}
                    </span>
                  ) : isCancel ? (
                    <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 7px", borderRadius: "var(--radius-full)", background: "var(--color-danger-bg)", color: "var(--color-danger-text)", border: "1px solid var(--color-danger-border)", flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                      ❌ {es ? "Cancelado" : "Cancelled"}
                    </span>
                  ) : (
                    <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: tc.bg, color: tc.color, flexShrink: 0 }}>
                      ✓ {es ? tl.es : tl.en}
                    </span>
                  )}

                  {/* Sub-tag tipo (no factura I) */}
                  {!isProf && !isCancel && cfdi.type !== "I" && (
                    <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-sm)", background: tc.bg, color: tc.color, flexShrink: 0 }}>
                      {es ? tl.es : tl.en}
                    </span>
                  )}

                  {/* Sub-tipo cuando es proforma */}
                  {isProf && cfdi.type !== "I" && (
                    <span style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", flexShrink: 0 }}>
                      ({es ? tl.es : tl.en})
                    </span>
                  )}

                  {/* Badge Carta Porte */}
                  {hasCCP && (
                    <span title="Carta Porte 3.1"
                      style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-sm)", background: "var(--color-brand-orange-light)", color: "var(--color-brand-orange)", flexShrink: 0, display: "flex", alignItems: "center", gap: "3px" }}>
                      🚛 CCP
                    </span>
                  )}

                  {/* Badge PPD pendiente */}
                  {!isProf && !isCancel && cfdi.payment_method === "PPD" && cfdi.type === "I" && (
                    <span title={es ? "PPD por cobrar" : "PPD pending"}
                      style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-sm)", background: "var(--color-warning-bg)", color: "var(--color-warning-text)", flexShrink: 0 }}>
                      PPD
                    </span>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cfdi.receiver_name ?? (es ? "(Sin cliente todavía)" : "(No client yet)")}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "1px" }}>
                      {isProf
                        ? (es ? "Borrador editable" : "Editable draft")
                        : `${cfdi.serie ?? ""}${cfdi.folio ?? "—"}`}
                      {" · "}
                      {new Date(cfdi.cfdi_date).toLocaleDateString(es ? "es-MX" : "en-US", { month: "short", day: "2-digit" })}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      color: isCancel ? "var(--color-text-muted)" : (isProf ? "var(--color-brand-blue)" : "var(--color-text-primary)"),
                      fontVariantNumeric: "tabular-nums",
                      textDecoration: isCancel ? "line-through" : "none",
                    }}>
                      ${fmt(cfdi.total)}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{cfdi.currency}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Acciones rápidas (sidebar) */}
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

      {/* Modal: DateRangePicker para rango personalizado */}
      <DateRangePicker
        isOpen={dateRangePickerOpen}
        onClose={() => setDateRangePickerOpen(false)}
        onApply={range => {
          setF({ period: "custom", customStart: range.start, customEnd: range.end });
        }}
        initialStart={filters.customStart}
        initialEnd={filters.customEnd}
      />

    </div>
  );
}

// ── Sub-componente UI: FilterDropdown nivel GOD ─────────────────────────

function FilterDropdown({
  labelEs, labelEn, es,
  currentLabel,
  isActive, activeColor, activeBg,
  options,
  onChange,
}: {
  labelEs: string;
  labelEn: string;
  es: boolean;
  currentLabel: string;
  isActive: boolean;
  activeColor?: string;
  activeBg?: string;
  options: { value: string; label: string; color?: string; bg?: string; count?: number }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al click fuera del dropdown
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const triggerLabel = `${es ? labelEs : labelEn}: ${currentLabel}`;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          height: "32px",
          padding: "0 12px",
          borderRadius: "var(--radius-md)",
          background: isActive ? (activeBg ?? "var(--color-info-bg)") : "var(--color-bg-subtle)",
          border: `1px solid ${isActive ? (activeColor ?? "var(--color-brand-blue)") : "var(--color-border-faint)"}`,
          color: isActive ? (activeColor ?? "var(--color-brand-blue)") : "var(--color-text-primary)",
          fontSize: "11px",
          fontWeight: isActive ? 700 : 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          whiteSpace: "nowrap",
          transition: "all 0.15s",
        }}>
        <span>{triggerLabel}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          minWidth: "220px",
          maxHeight: "340px",
          overflowY: "auto",
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lg)",
          zIndex: 100,
          padding: "4px",
        }}>
          {options.map(opt => (
            <button key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                background: "transparent",
                border: "none",
                color: opt.color ?? "var(--color-text-primary)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = opt.bg ?? "var(--color-bg-subtle)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              <span>{opt.label}</span>
              {typeof opt.count === "number" && opt.count > 0 && (
                <span style={{
                  background: "var(--color-bg-subtle)",
                  color: "var(--color-text-muted)",
                  fontSize: "9px",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: "var(--radius-full)",
                  minWidth: "18px",
                  textAlign: "center",
                  flexShrink: 0,
                }}>{opt.count}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
