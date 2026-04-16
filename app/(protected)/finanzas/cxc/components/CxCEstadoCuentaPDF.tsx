import {
  Document, Page, Text, View, StyleSheet, Image,
} from "@react-pdf/renderer";
import type { AccountReceivable, ARPayment } from "../types/cxc.types";
import type { CompanySettings } from "../../../comercial/cotizaciones/types/quotations.types";

type Props = {
  client:    { name: string; rfc?: string | null; email?: string | null };
  records:   AccountReceivable[];
  payments:  ARPayment[];
  settings?: CompanySettings | null;
  generatedAt: string;
};

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 0.5;
}

const fmt = (n: number) =>
  Number(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CxCEstadoCuentaPDF({ client, records, payments, settings, generatedAt }: Props) {
  const HEADER_BG   = (settings as any)?.brand_color_dark ?? "#0a1628";
  const BRAND_COLOR = (settings as any)?.brand_color      ?? "#1d4ed8";
  const ACCENT      = (settings as any)?.brand_accent     ?? "#c9a227";

  const headerIsLight = isLightColor(HEADER_BG);
  const HEADER_TEXT      = headerIsLight ? "#1a2332" : "#ffffff";
  const HEADER_TEXT_SUB  = headerIsLight ? "#334155" : "#e2e8f0";
  const HEADER_TEXT_MUTED= headerIsLight ? "#64748b" : "#cbd5e1";
  const brandIsLight  = isLightColor(BRAND_COLOR);
  const BRAND_TEXT    = brandIsLight ? "#1a2332" : "#ffffff";
  const BRAND_MUTED   = brandIsLight ? "#475569" : "#cbd5e1";
  const BORDER_COLOR  = brandIsLight ? "#94a3b8" : "#1e3a5f";
  const WHITE         = "#ffffff";
  const LIGHT         = "#f8fafc";
  const TEXT_DARK     = "#1a2332";
  const TEXT_MEDIUM   = "#334155";
  const TEXT_MUTED    = "#64748b";

  const issuerName    = settings?.fiscal_name    ?? "Mi Empresa";
  const issuerRfc     = settings?.fiscal_rfc     ?? "";
  const issuerState   = settings?.fiscal_state   ?? "";
  const issuerCountry = settings?.fiscal_country ?? "";
  const issuerAddress = settings?.fiscal_address ?? "";
  const issuerPhone   = (settings as any)?.fiscal_phone   ?? "";
  const issuerEmail   = (settings as any)?.fiscal_email   ?? "";
  const issuerWebsite = (settings as any)?.fiscal_website ?? "";
  const logoUrl       = settings?.logo_url       ?? "";
  const issuerLocation = issuerState && issuerCountry
    ? `${issuerState}, ${issuerCountry}`
    : issuerState || issuerCountry || issuerAddress;

  const footerText = issuerName
    + (issuerLocation ? ` · ${issuerLocation}` : "")
    + (issuerRfc      ? ` · RFC: ${issuerRfc}` : "")
    + (issuerPhone    ? ` · ${issuerPhone}` : "");

  // Totales
  const totalFacturado = records.reduce((s, r) => s + r.total, 0);
  const totalPagado    = records.reduce((s, r) => s + r.paid_amount, 0);
  const totalPendiente = records.reduce((s, r) => s + r.balance, 0);
  const currency       = records[0]?.currency ?? "MXN";

  const AGING_COLORS: Record<string, string> = {
    "0-30":  "#16a34a",
    "31-60": "#d97706",
    "61-90": "#f97316",
    "+90":   "#dc2626",
  };

  const STATUS_LABELS: Record<string, string> = {
    pending:  "Pendiente",
    partial:  "Parcial",
    paid:     "Pagado",
    disputed: "En disputa",
    bad_debt: "Incobrable",
  };

  const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    pending:  { color: "#92400e", bg: "#fef3c7" },
    partial:  { color: "#1e40af", bg: "#dbeafe" },
    paid:     { color: "#14532d", bg: "#dcfce7" },
    disputed: { color: "#6d28d9", bg: "#ede9fe" },
    bad_debt: { color: "#991b1b", bg: "#fee2e2" },
  };

  const s = StyleSheet.create({
    page:         { backgroundColor: WHITE, fontSize: 9, color: TEXT_DARK, display: "flex", flexDirection: "column" },
    header:       { backgroundColor: HEADER_BG, padding: "24 36", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 },
    accentLine:   { backgroundColor: ACCENT, height: 3, flexShrink: 0 },
    logoBox:      { width: 110, height: 44, objectFit: "contain" },
    body:         { flex: 1, paddingTop: 20, paddingBottom: 16, paddingLeft: 36, paddingRight: 36 },
    section:      { marginBottom: 16 },
    sectionTitle: { fontSize: 8, fontWeight: "bold", color: ACCENT, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 7, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: BRAND_COLOR },
    label:        { fontSize: 7.5, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
    value:        { fontSize: 9.5, color: TEXT_DARK, fontWeight: "bold" },
    muted:        { fontSize: 8, color: TEXT_MUTED },
    row2:         { flexDirection: "row", gap: 16 },
    col:          { flex: 1 },
    // Resumen cards
    summaryBox:   { flexDirection: "row", gap: 10, marginBottom: 16 },
    summaryCard:  { flex: 1, backgroundColor: LIGHT, borderRadius: 4, padding: "10 12", borderLeftWidth: 3, borderLeftColor: BRAND_COLOR },
    summaryLabel: { fontSize: 7, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
    summaryValue: { fontSize: 14, fontWeight: "bold", color: TEXT_DARK },
    // Tabla
    tableHeader:  { flexDirection: "row", backgroundColor: BRAND_COLOR, padding: "6 10", borderRadius: "3 3 0 0" },
    tableHeaderTxt:{ fontSize: 7.5, fontWeight: "bold", color: BRAND_TEXT, textTransform: "uppercase", letterSpacing: 0.3 },
    tableRow:     { flexDirection: "row", padding: "8 10", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
    tableRowAlt:  { flexDirection: "row", padding: "8 10", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", backgroundColor: LIGHT },
    cellTxt:      { fontSize: 8.5, color: TEXT_DARK },
    cellMuted:    { fontSize: 7.5, color: TEXT_MUTED },
    badge:        { borderRadius: 3, padding: "2 6", alignSelf: "flex-start" },
    badgeTxt:     { fontSize: 7, fontWeight: "bold" },
    // Totales finales
    totalBox:     { backgroundColor: BRAND_COLOR, borderRadius: 6, padding: "14 18", marginTop: 8, alignSelf: "flex-end", minWidth: 260 },
    totalRow:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    totalLabel:   { fontSize: 8.5, color: BRAND_MUTED },
    totalValue:   { fontSize: 8.5, color: BRAND_TEXT },
    grandLabel:   { fontSize: 13, color: ACCENT, fontWeight: "bold" },
    grandValue:   { fontSize: 13, color: ACCENT, fontWeight: "bold" },
    // Footer
    footer:       { backgroundColor: BRAND_COLOR, padding: "12 36", flexShrink: 0 },
    footerMain:   { color: BRAND_TEXT, fontSize: 8, textAlign: "center", marginBottom: 3 },
    footerPowered:{ color: BRAND_MUTED, fontSize: 7, textAlign: "center" },
    footerDivider:{ height: 1, backgroundColor: BORDER_COLOR, marginBottom: 8 },
  });

  const PageHeader = () => (
    <>
      <View style={s.header}>
        <View style={{ flexDirection: "column", gap: 3 }}>
          {logoUrl
            ? <Image src={logoUrl} style={s.logoBox} />
            : <Text style={{ fontSize: 20, fontWeight: "bold", color: HEADER_TEXT }}>{issuerName}</Text>
          }
          <Text style={{ fontSize: 12, fontWeight: "bold", color: ACCENT, marginTop: logoUrl ? 4 : 2 }}>{issuerName}</Text>
          {issuerRfc     ? <Text style={{ color: HEADER_TEXT_SUB,   fontSize: 7.5 }}>{`RFC: ${issuerRfc}`}</Text>     : null}
          {issuerLocation? <Text style={{ color: HEADER_TEXT_MUTED, fontSize: 7.5 }}>{issuerLocation}</Text>          : null}
          {issuerPhone   ? <Text style={{ color: HEADER_TEXT_MUTED, fontSize: 7.5 }}>{`Tel: ${issuerPhone}`}</Text>   : null}
          {issuerEmail   ? <Text style={{ color: HEADER_TEXT_MUTED, fontSize: 7.5 }}>{issuerEmail}</Text>             : null}
          {issuerWebsite ? <Text style={{ color: HEADER_TEXT_MUTED, fontSize: 7.5 }}>{issuerWebsite}</Text>           : null}
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={{ fontSize: 8, color: ACCENT, textTransform: "uppercase", letterSpacing: 2 }}>Estado de Cuenta</Text>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: HEADER_TEXT, letterSpacing: 1 }}>{client.name}</Text>
          {client.rfc ? <Text style={{ fontSize: 8, color: HEADER_TEXT_SUB, fontFamily: "Courier" }}>{client.rfc}</Text> : null}
          <View style={{ backgroundColor: BRAND_COLOR, borderRadius: 4, padding: "4 10", alignItems: "flex-end" }}>
            <Text style={{ color: BRAND_MUTED, fontSize: 7 }}>Generado el</Text>
            <Text style={{ color: BRAND_TEXT, fontSize: 8, fontWeight: "bold" }}>{generatedAt}</Text>
          </View>
        </View>
      </View>
      <View style={s.accentLine} />
    </>
  );

  const PageFooter = () => (
    <View style={s.footer}>
      <View style={s.footerDivider} />
      <Text style={s.footerMain}>{footerText}</Text>
      <Text style={[s.footerPowered, { marginTop: 5 }]}>Powered by Mobility OS</Text>
    </View>
  );

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <PageHeader />
        <View style={s.body}>

          {/* ── DATOS CLIENTE ── */}
          <View style={[s.section, s.row2]}>
            <View style={s.col}>
              <Text style={s.sectionTitle}>Información del cliente</Text>
              <Text style={s.value}>{client.name}</Text>
              {client.rfc   ? <Text style={[s.muted, { marginTop: 3 }]}>{`RFC: ${client.rfc}`}</Text>   : null}
              {client.email ? <Text style={s.muted}>{client.email}</Text> : null}
            </View>
            <View style={s.col}>
              <Text style={s.sectionTitle}>Período del estado de cuenta</Text>
              {records.length > 0 && (
                <View style={{ gap: 4 }}>
                  {[
                    { l: "Primer documento", v: new Date(records[records.length - 1].document_date).toLocaleDateString("es-MX") },
                    { l: "Último documento",  v: new Date(records[0].document_date).toLocaleDateString("es-MX") },
                    { l: "Moneda",            v: currency },
                    { l: "Total documentos",  v: String(records.length) },
                  ].map(r => (
                    <View key={r.l} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={s.label}>{r.l}</Text>
                      <Text style={{ fontSize: 8.5, color: TEXT_DARK, fontWeight: "bold" }}>{r.v}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* ── RESUMEN ── */}
          <View style={s.summaryBox}>
            {[
              { l: "Total facturado", v: `${currency} $${fmt(totalFacturado)}`, color: TEXT_DARK },
              { l: "Total cobrado",   v: `${currency} $${fmt(totalPagado)}`,    color: "#16a34a" },
              { l: "Saldo pendiente", v: `${currency} $${fmt(totalPendiente)}`, color: totalPendiente > 0 ? "#d97706" : "#16a34a" },
            ].map(c => (
              <View key={c.l} style={[s.summaryCard, { borderLeftColor: c.color === TEXT_DARK ? BRAND_COLOR : c.color }]}>
                <Text style={s.summaryLabel}>{c.l}</Text>
                <Text style={[s.summaryValue, { color: c.color }]}>{c.v}</Text>
              </View>
            ))}
          </View>

          {/* ── TABLA DE DOCUMENTOS ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Detalle de documentos</Text>
            {/* Header */}
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderTxt, { flex: 1.2 }]}>Documento</Text>
              <Text style={[s.tableHeaderTxt, { flex: 1 }]}>Fecha</Text>
              <Text style={[s.tableHeaderTxt, { flex: 1 }]}>Vencimiento</Text>
              <Text style={[s.tableHeaderTxt, { flex: 1, textAlign: "right" }]}>Total</Text>
              <Text style={[s.tableHeaderTxt, { flex: 1, textAlign: "right" }]}>Pagado</Text>
              <Text style={[s.tableHeaderTxt, { flex: 1, textAlign: "right" }]}>Saldo</Text>
              <Text style={[s.tableHeaderTxt, { flex: 0.8, textAlign: "center" }]}>Antigüedad</Text>
              <Text style={[s.tableHeaderTxt, { flex: 0.9, textAlign: "center" }]}>Estado</Text>
            </View>
            {records.map((ar, i) => {
              const days = ar.days_overdue ?? 0;
              const bucket = ar.aging_bucket ?? "0-30";
              const agingColor = AGING_COLORS[bucket] ?? "#64748b";
              const statusLabel = STATUS_LABELS[ar.status] ?? ar.status;
                  const scfg = STATUS_COLORS[ar.status] ?? { color: "#64748b", bg: "#f1f5f9" };
              return (
                <View key={ar.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.cellTxt, { flex: 1.2, fontFamily: "Courier" }]}>{ar.document_number || "—"}</Text>
                  <Text style={[s.cellMuted, { flex: 1 }]}>{new Date(ar.document_date).toLocaleDateString("es-MX")}</Text>
                  <Text style={[s.cellMuted, { flex: 1 }]}>{ar.due_date ? new Date(ar.due_date).toLocaleDateString("es-MX") : "—"}</Text>
                  <Text style={[s.cellTxt, { flex: 1, textAlign: "right", fontWeight: "bold" }]}>${fmt(ar.total)}</Text>
                  <Text style={[s.cellTxt, { flex: 1, textAlign: "right", color: "#16a34a" }]}>${fmt(ar.paid_amount)}</Text>
                  <Text style={[s.cellTxt, { flex: 1, textAlign: "right", fontWeight: "bold", color: ar.balance > 0 ? "#d97706" : "#16a34a" }]}>${fmt(ar.balance)}</Text>
                  <View style={{ flex: 0.8, alignItems: "center" }}>
                    <View style={[s.badge, { backgroundColor: `${agingColor}20` }]}>
                      <Text style={[s.badgeTxt, { color: agingColor }]}>{`${days}d`}</Text>
                    </View>
                  </View>
                  <View style={{ flex: 0.9, alignItems: "center" }}>
                    <View style={[s.badge, { backgroundColor: scfg.bg }]}>
                      <Text style={[s.badgeTxt, { color: scfg.color }]}>{statusLabel}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── HISTORIAL DE PAGOS ── */}
          {payments.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Historial de pagos recibidos</Text>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderTxt, { flex: 1 }]}>Fecha</Text>
                <Text style={[s.tableHeaderTxt, { flex: 1 }]}>Forma de pago</Text>
                <Text style={[s.tableHeaderTxt, { flex: 1.5 }]}>Referencia</Text>
                <Text style={[s.tableHeaderTxt, { flex: 1, textAlign: "right" }]}>Monto</Text>
              </View>
              {payments.map((p, i) => (
                <View key={p.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.cellMuted, { flex: 1 }]}>{new Date(p.payment_date).toLocaleDateString("es-MX")}</Text>
                  <Text style={[s.cellTxt,  { flex: 1 }]}>{p.payment_form ?? "—"}</Text>
                  <Text style={[s.cellMuted, { flex: 1.5, fontFamily: "Courier" }]}>{p.reference ?? "—"}</Text>
                  <Text style={[s.cellTxt,  { flex: 1, textAlign: "right", fontWeight: "bold", color: "#16a34a" }]}>${fmt(p.amount)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── TOTALES FINALES ── */}
          <View style={s.totalBox}>
            {[
              { l: "Total facturado", v: `${currency} $${fmt(totalFacturado)}` },
              { l: "Total cobrado",   v: `${currency} $${fmt(totalPagado)}` },
            ].map(r => (
              <View key={r.l} style={s.totalRow}>
                <Text style={s.totalLabel}>{r.l}</Text>
                <Text style={s.totalValue}>{r.v}</Text>
              </View>
            ))}
            <View style={[s.totalRow, { borderTopWidth: 1, borderTopColor: BORDER_COLOR, paddingTop: 7, marginTop: 4 }]}>
              <Text style={s.grandLabel}>SALDO PENDIENTE</Text>
              <Text style={[s.grandValue, { color: totalPendiente > 0 ? ACCENT : "#4ade80" }]}>
                {`${currency} $${fmt(totalPendiente)}`}
              </Text>
            </View>
          </View>

        </View>
        <PageFooter />
      </Page>
    </Document>
  );
}
