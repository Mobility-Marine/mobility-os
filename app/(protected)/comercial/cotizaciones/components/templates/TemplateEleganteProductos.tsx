import {
  Document, Page, Text, View, StyleSheet, Image,
} from "@react-pdf/renderer";
import type { Quotation, CompanySettings } from "../../types/quotations.types";

type Props = { quotation: Quotation; settings?: CompanySettings | null };

export default function TemplateEleganteProductos({ quotation, settings }: Props) {
  const items = quotation.items ?? [];

  // ── Colores de marca — configurables ──────────────────────
  const DARK    = (settings as any)?.brand_color_dark ?? "#0a1628";
  const ACCENT  = (settings as any)?.brand_accent      ?? "#c9a227";
  const BLUE    = (settings as any)?.brand_color        ?? "#1d4ed8";
  const LIGHT   = "#f8fafc";
  const MUTED   = "#94a3b8";
  const WHITE   = "#ffffff";
  const BORDER  = "#1e3a5f";

  // ── Datos del emisor ──────────────────────────────────────
  const issuerName    = settings?.fiscal_name    ?? "Mi Empresa";
  const issuerRfc     = settings?.fiscal_rfc     ?? "";
  const issuerAddress = settings?.fiscal_address ?? "";
  const issuerPhone   = (settings as any)?.fiscal_phone   ?? "";
  const issuerEmail   = (settings as any)?.fiscal_email   ?? "";
  const issuerWebsite = (settings as any)?.fiscal_website ?? "";
  const logoUrl       = settings?.logo_url        ?? "";
  const quoteFooter   = (settings as any)?.quote_footer   ?? "";

  // ── Datos del cliente ─────────────────────────────────────
  const clientName  = quotation.client?.name  ?? quotation.client_name  ?? "—";
  const clientRfc   = quotation.client?.rfc   ?? quotation.client_rfc   ?? "";
  const clientEmail = quotation.client?.email ?? quotation.client_email ?? "";

  const locale = "es-MX";
  const fmt = (n: number) => Number(n ?? 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const s = StyleSheet.create({
    page:         { backgroundColor: WHITE, fontSize: 9, color: DARK },
    header:       { backgroundColor: DARK, padding: "24 36", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    logoBox:      { width: 110, height: 40, objectFit: "contain" },
    accentLine:   { backgroundColor: ACCENT, height: 3 },
    body:         { padding: "20 36" },
    section:      { marginBottom: 16 },
    sectionTitle: { fontSize: 8, fontWeight: "bold", color: ACCENT, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 7, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: BORDER },
    row2:         { flexDirection: "row", gap: 16 },
    col:          { flex: 1 },
    label:        { fontSize: 7.5, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 },
    value:        { fontSize: 9.5, color: DARK, fontWeight: "bold" },
    valueSmall:   { fontSize: 8.5, color: DARK },
    muted:        { fontSize: 8, color: MUTED },
    // Tabla
    tableHead:    { flexDirection: "row", backgroundColor: DARK, padding: "7 10", borderRadius: 3 },
    tableHeadTxt: { color: WHITE, fontSize: 7.5, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 },
    tableRow:     { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "7 10" },
    tableRowAlt:  { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "7 10", backgroundColor: LIGHT },
    cell:         { fontSize: 8.5 },
    // Totales
    totalBox:     { backgroundColor: DARK, borderRadius: 6, padding: "14 18", marginTop: 8, alignSelf: "flex-end", minWidth: 230 },
    totalRow:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    totalLabel:   { fontSize: 8.5, color: MUTED },
    totalValue:   { fontSize: 8.5, color: WHITE },
    grandLabel:   { fontSize: 13, color: ACCENT, fontWeight: "bold" },
    grandValue:   { fontSize: 13, color: ACCENT, fontWeight: "bold" },
    // Vigencia
    validBox:     { backgroundColor: "#1e3a5f", borderRadius: 4, padding: "6 12", flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
    validLabel:   { color: MUTED, fontSize: 8 },
    validValue:   { color: ACCENT, fontSize: 8, fontWeight: "bold" },
    // Notas / Términos
    notesBox:     { backgroundColor: LIGHT, borderRadius: 4, padding: "10 12", marginTop: 4 },
    notesText:    { fontSize: 8, color: "#475569", lineHeight: 1.6 },
    // Footer
    footer:       { backgroundColor: DARK, padding: "12 36", marginTop: "auto" },
    footerMain:   { color: WHITE, fontSize: 8, textAlign: "center", marginBottom: 3 },
    footerPowered:{ color: MUTED, fontSize: 7, textAlign: "center" },
    footerDivider:{ height: 1, backgroundColor: BORDER, marginBottom: 8 },
  });

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          {/* Emisor */}
          <View style={{ flexDirection: "column", gap: 3 }}>
            {logoUrl
              ? <Image src={logoUrl} style={s.logoBox} />
              : <Text style={{ fontSize: 20, fontWeight: "bold", color: WHITE }}>{issuerName}</Text>
            }
            {logoUrl && <Text style={{ fontSize: 12, fontWeight: "bold", color: WHITE, marginTop: 4 }}>{issuerName}</Text>}
            {issuerRfc     && <Text style={{ color: MUTED, fontSize: 7.5 }}>RFC: {issuerRfc}</Text>}
            {issuerAddress && <Text style={{ color: MUTED, fontSize: 7.5 }}>{issuerAddress}</Text>}
            {issuerPhone   && <Text style={{ color: MUTED, fontSize: 7.5 }}>Tel: {issuerPhone}</Text>}
            {issuerEmail   && <Text style={{ color: MUTED, fontSize: 7.5 }}>{issuerEmail}</Text>}
            {issuerWebsite && <Text style={{ color: MUTED, fontSize: 7.5 }}>{issuerWebsite}</Text>}
          </View>

          {/* Número y tipo */}
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Text style={{ fontSize: 8, color: ACCENT, textTransform: "uppercase", letterSpacing: 2 }}>
              {quotation.type === "services" ? "Cotización de Servicios" : "Cotización de Productos"}
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "bold", color: WHITE, letterSpacing: 1 }}>
              {quotation.quote_number}
            </Text>
            {quotation.valid_until && (
              <View style={{ backgroundColor: "#1e3a5f", borderRadius: 4, padding: "4 10", alignItems: "flex-end" }}>
                <Text style={{ color: MUTED, fontSize: 7 }}>Válida hasta</Text>
                <Text style={{ color: ACCENT, fontSize: 8, fontWeight: "bold" }}>
                  {new Date(quotation.valid_until).toLocaleDateString(locale)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.accentLine} />

        {/* ── BODY ── */}
        <View style={s.body}>

          {/* CLIENTE + DATOS DE LA COTIZACIÓN */}
          <View style={[s.section, s.row2]}>
            {/* Cliente */}
            <View style={s.col}>
              <Text style={s.sectionTitle}>Cliente</Text>
              <Text style={s.value}>{clientName}</Text>
              {clientRfc   && <Text style={[s.muted, { marginTop: 3 }]}>RFC: {clientRfc}</Text>}
              {clientEmail && <Text style={s.muted}>{clientEmail}</Text>}
            </View>

            {/* Info cotización */}
            <View style={s.col}>
              <Text style={s.sectionTitle}>Datos de la cotización</Text>
              <View style={{ gap: 5 }}>
                {[
                  { l: "Fecha de emisión", v: new Date(quotation.created_at).toLocaleDateString(locale) },
                  { l: "Moneda",           v: quotation.currency },
                  ...(quotation.incoterm   ? [{ l: "Incoterm",  v: quotation.incoterm   }] : []),
                  ...(quotation.origin     ? [{ l: "Origen",    v: quotation.origin     }] : []),
                  ...(quotation.destination? [{ l: "Destino",   v: quotation.destination}] : []),
                ].map((r) => (
                  <View key={r.l} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={s.label}>{r.l}</Text>
                    <Text style={s.valueSmall}>{r.v}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* TABLA DE PRODUCTOS */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Descripción de productos</Text>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadTxt, { width: "8%" }]}>SKU</Text>
              <Text style={[s.tableHeadTxt, { width: "36%" }]}>Descripción</Text>
              <Text style={[s.tableHeadTxt, { width: "10%", textAlign: "right" }]}>Cant.</Text>
              <Text style={[s.tableHeadTxt, { width: "8%",  textAlign: "center" }]}>U.</Text>
              <Text style={[s.tableHeadTxt, { width: "16%", textAlign: "right" }]}>P. Unit.</Text>
              <Text style={[s.tableHeadTxt, { width: "8%",  textAlign: "center" }]}>Desc.</Text>
              <Text style={[s.tableHeadTxt, { width: "14%", textAlign: "right" }]}>Subtotal</Text>
            </View>
            {items.map((item, i) => (
              <View key={item.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.cell, { width: "8%",  color: MUTED }]}>{item.sku ?? "—"}</Text>
                <View style={{ width: "36%" }}>
                  <Text style={[s.cell, { fontWeight: "bold" }]}>{item.description}</Text>
                  {item.details && <Text style={[s.cell, { color: MUTED, fontSize: 7.5 }]}>{item.details}</Text>}
                </View>
                <Text style={[s.cell, { width: "10%", textAlign: "right" }]}>{item.quantity}</Text>
                <Text style={[s.cell, { width: "8%",  textAlign: "center", color: MUTED }]}>{item.unit}</Text>
                <Text style={[s.cell, { width: "16%", textAlign: "right" }]}>${fmt(item.unit_price)}</Text>
                <Text style={[s.cell, { width: "8%",  textAlign: "center", color: item.discount_pct > 0 ? ACCENT : MUTED }]}>
                  {item.discount_pct > 0 ? `${item.discount_pct}%` : "—"}
                </Text>
                <Text style={[s.cell, { width: "14%", textAlign: "right", fontWeight: "bold" }]}>${fmt(item.subtotal)}</Text>
              </View>
            ))}
          </View>

          {/* TOTALES */}
          <View style={s.totalBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>{quotation.currency} ${fmt(quotation.subtotal)}</Text>
            </View>
            {(quotation.discount_amount ?? 0) > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Descuento</Text>
                <Text style={[s.totalValue, { color: ACCENT }]}>- {quotation.currency} ${fmt(quotation.discount_amount)}</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>IVA {quotation.tax_rate ?? 16}%</Text>
              <Text style={s.totalValue}>{quotation.currency} ${fmt(quotation.tax_amount)}</Text>
            </View>
            <View style={[s.totalRow, { borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 7, marginTop: 4 }]}>
              <Text style={s.grandLabel}>TOTAL</Text>
              <Text style={s.grandValue}>{quotation.currency} ${fmt(quotation.total)}</Text>
            </View>
          </View>

          {/* NOTAS */}
          {quotation.notes && (
            <View style={[s.section, { marginTop: 16 }]}>
              <Text style={s.sectionTitle}>Notas</Text>
              <View style={s.notesBox}>
                <Text style={s.notesText}>{quotation.notes}</Text>
              </View>
            </View>
          )}

          {/* TÉRMINOS Y CONDICIONES */}
          {quotation.terms && (
            <View style={[s.section, { marginTop: 4 }]}>
              <Text style={s.sectionTitle}>Términos y condiciones</Text>
              <View style={s.notesBox}>
                <Text style={s.notesText}>{quotation.terms}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── FOOTER ── */}
        <View style={s.footer}>
          <View style={s.footerDivider} />
          <Text style={s.footerMain}>
            {issuerName}
            {issuerAddress ? `  ·  ${issuerAddress}` : ""}
            {issuerRfc     ? `  ·  RFC: ${issuerRfc}` : ""}
            {issuerPhone   ? `  ·  ${issuerPhone}`    : ""}
          </Text>
          {quoteFooter && (
            <Text style={[s.footerMain, { marginTop: 3 }]}>{quoteFooter}</Text>
          )}
          <Text style={[s.footerPowered, { marginTop: 5 }]}>
            Powered by Mobility OS
          </Text>
        </View>

      </Page>
    </Document>
  );
}
