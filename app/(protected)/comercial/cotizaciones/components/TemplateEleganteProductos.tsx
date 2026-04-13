import {
  Document, Page, Text, View, StyleSheet, Image, Font,
} from "@react-pdf/renderer";
import type { Quotation, CompanySettings } from "../../types/quotations.types";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8LYgWxBOQPaFEg.woff2" },
  ],
});

const NAVY   = "#0a1628";
const BLUE   = "#1d4ed8";
const GOLD   = "#c9a227";
const LIGHT  = "#f8fafc";
const MUTED  = "#94a3b8";
const WHITE  = "#ffffff";
const BORDER = "#1e3a5f";

const s = StyleSheet.create({
  page:        { backgroundColor: WHITE, fontFamily: "Helvetica", fontSize: 9, color: NAVY },
  header:      { backgroundColor: NAVY, padding: "28 36", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft:  { flexDirection: "column", gap: 4 },
  logoBox:     { width: 110, height: 40, objectFit: "contain" },
  quoteNum:    { fontSize: 22, fontWeight: "bold", color: WHITE, letterSpacing: 1 },
  quoteLabel:  { fontSize: 9, color: GOLD, textTransform: "uppercase", letterSpacing: 2, marginBottom: 3 },
  goldLine:    { backgroundColor: GOLD, height: 3, marginHorizontal: 0 },
  body:        { padding: "22 36" },
  section:     { marginBottom: 18 },
  sectionTitle:{ fontSize: 9, fontWeight: "bold", color: GOLD, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: BORDER },
  row2:        { flexDirection: "row", gap: 16 },
  col:         { flex: 1 },
  label:       { fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  value:       { fontSize: 9.5, color: NAVY, fontWeight: "bold" },
  tableHead:   { flexDirection: "row", backgroundColor: NAVY, padding: "7 10", borderRadius: 3 },
  tableHeadTxt:{ color: WHITE, fontSize: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow:    { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "7 10" },
  tableRowAlt: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "7 10", backgroundColor: LIGHT },
  cell:        { fontSize: 9 },
  totalBox:    { backgroundColor: NAVY, borderRadius: 6, padding: "14 18", marginTop: 8, alignSelf: "flex-end", minWidth: 220 },
  totalRow:    { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalLabel:  { fontSize: 8.5, color: MUTED },
  totalValue:  { fontSize: 8.5, color: WHITE },
  grandLabel:  { fontSize: 13, color: GOLD, fontWeight: "bold" },
  grandValue:  { fontSize: 13, color: GOLD, fontWeight: "bold" },
  footer:      { backgroundColor: NAVY, padding: "14 36", marginTop: "auto" },
  footerTxt:   { color: MUTED, fontSize: 8, textAlign: "center" },
  badge:       { backgroundColor: GOLD, borderRadius: 3, padding: "3 8", alignSelf: "flex-start" },
  badgeTxt:    { color: NAVY, fontSize: 8, fontWeight: "bold" },
  validBox:    { backgroundColor: "#1e3a5f", borderRadius: 4, padding: "6 12", flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  validLabel:  { color: MUTED, fontSize: 8 },
  validValue:  { color: GOLD, fontSize: 8, fontWeight: "bold" },
});

type Props = {
  quotation: Quotation;
  settings?: CompanySettings | null;
};

export default function TemplateEleganteProductos({ quotation, settings }: Props) {
  const items = quotation.items ?? [];
  const clientName = quotation.client?.name ?? quotation.client_name ?? "—";
  const issuerName = settings?.fiscal_name ?? "Mobility OS";
  const issuerRfc  = settings?.fiscal_rfc  ?? "";
  const locale     = "es-MX";

  const fmt = (n: number) => n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* HEADER */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            {settings?.logo_url
              ? <Image src={settings.logo_url} style={s.logoBox} />
              : <Text style={{ fontSize: 20, fontWeight: "bold", color: WHITE }}>{issuerName}</Text>
            }
            {issuerRfc ? <Text style={{ color: MUTED, fontSize: 8, marginTop: 4 }}>RFC: {issuerRfc}</Text> : null}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.quoteLabel}>Cotización de Productos</Text>
            <Text style={s.quoteNum}>{quotation.quote_number}</Text>
            <View style={s.badge}><Text style={s.badgeTxt}>ELEGANTE</Text></View>
          </View>
        </View>
        <View style={s.goldLine} />

        {/* BODY */}
        <View style={s.body}>

          {/* CLIENT + INFO */}
          <View style={[s.section, s.row2]}>
            <View style={s.col}>
              <Text style={s.sectionTitle}>Cliente</Text>
              <Text style={s.value}>{clientName}</Text>
              {quotation.client_rfc    && <Text style={[s.label, { marginTop: 4 }]}>RFC: {quotation.client_rfc}</Text>}
              {quotation.client_email  && <Text style={s.label}>{quotation.client_email}</Text>}
            </View>
            <View style={s.col}>
              <Text style={s.sectionTitle}>Datos de la cotización</Text>
              <View style={{ gap: 4 }}>
                {[
                  { l: "Fecha de emisión",  v: new Date(quotation.created_at).toLocaleDateString(locale) },
                  { l: "Moneda",            v: quotation.currency },
                  { l: "Plantilla",         v: "Elegante" },
                ].map((r) => (
                  <View key={r.l} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={s.label}>{r.l}</Text>
                    <Text style={s.cell}>{r.v}</Text>
                  </View>
                ))}
              </View>
              {quotation.valid_until && (
                <View style={s.validBox}>
                  <Text style={s.validLabel}>Válida hasta</Text>
                  <Text style={s.validValue}>{new Date(quotation.valid_until).toLocaleDateString(locale)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ITEMS TABLE */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Descripción de productos</Text>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadTxt, { width: "8%" }]}>SKU</Text>
              <Text style={[s.tableHeadTxt, { width: "36%" }]}>Descripción</Text>
              <Text style={[s.tableHeadTxt, { width: "10%", textAlign: "right" }]}>Cant.</Text>
              <Text style={[s.tableHeadTxt, { width: "8%", textAlign: "center" }]}>U.</Text>
              <Text style={[s.tableHeadTxt, { width: "16%", textAlign: "right" }]}>P. Unit.</Text>
              <Text style={[s.tableHeadTxt, { width: "8%", textAlign: "center" }]}>Desc.</Text>
              <Text style={[s.tableHeadTxt, { width: "14%", textAlign: "right" }]}>Subtotal</Text>
            </View>
            {items.map((item, i) => (
              <View key={item.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.cell, { width: "8%", color: MUTED }]}>{item.sku ?? "—"}</Text>
                <View style={{ width: "36%" }}>
                  <Text style={[s.cell, { fontWeight: "bold" }]}>{item.description}</Text>
                  {item.details && <Text style={[s.cell, { color: MUTED, fontSize: 8 }]}>{item.details}</Text>}
                </View>
                <Text style={[s.cell, { width: "10%", textAlign: "right" }]}>{item.quantity}</Text>
                <Text style={[s.cell, { width: "8%", textAlign: "center", color: MUTED }]}>{item.unit}</Text>
                <Text style={[s.cell, { width: "16%", textAlign: "right" }]}>${fmt(item.unit_price)}</Text>
                <Text style={[s.cell, { width: "8%", textAlign: "center", color: item.discount_pct > 0 ? GOLD : MUTED }]}>
                  {item.discount_pct > 0 ? `${item.discount_pct}%` : "—"}
                </Text>
                <Text style={[s.cell, { width: "14%", textAlign: "right", fontWeight: "bold" }]}>${fmt(item.subtotal)}</Text>
              </View>
            ))}
          </View>

          {/* TOTALS */}
          <View style={s.totalBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>{quotation.currency} ${fmt(quotation.subtotal)}</Text>
            </View>
            {quotation.discount_amount > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Descuento</Text>
                <Text style={[s.totalValue, { color: GOLD }]}>- {quotation.currency} ${fmt(quotation.discount_amount)}</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>IVA {quotation.tax_rate}%</Text>
              <Text style={s.totalValue}>{quotation.currency} ${fmt(quotation.tax_amount)}</Text>
            </View>
            <View style={[s.totalRow, { borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 6, marginTop: 4 }]}>
              <Text style={s.grandLabel}>TOTAL</Text>
              <Text style={s.grandValue}>{quotation.currency} ${fmt(quotation.total)}</Text>
            </View>
          </View>

          {/* NOTES + TERMS */}
          {(quotation.notes || quotation.terms) && (
            <View style={[s.section, s.row2, { marginTop: 16 }]}>
              {quotation.notes && (
                <View style={s.col}>
                  <Text style={s.sectionTitle}>Notas</Text>
                  <Text style={[s.cell, { color: MUTED, lineHeight: 1.5 }]}>{quotation.notes}</Text>
                </View>
              )}
              {quotation.terms && (
                <View style={s.col}>
                  <Text style={s.sectionTitle}>Términos y condiciones</Text>
                  <Text style={[s.cell, { color: MUTED, lineHeight: 1.5, fontSize: 8 }]}>{quotation.terms}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* FOOTER */}
        <View style={s.footer}>
          <Text style={s.footerTxt}>{issuerName} · {settings?.fiscal_address ?? ""} · {settings?.fiscal_rfc ?? ""}</Text>
          {settings?.quote_footer && <Text style={[s.footerTxt, { marginTop: 4 }]}>{settings.quote_footer}</Text>}
        </View>
      </Page>
    </Document>
  );
}
