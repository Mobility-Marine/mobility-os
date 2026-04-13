import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Quotation, CompanySettings } from "../../types/quotations.types";

const BLUE   = "#2563eb";
const DARK   = "#0f172a";
const MID    = "#475569";
const LIGHT  = "#f1f5f9";
const WHITE  = "#ffffff";
const GREEN  = "#16a34a";
const BORDER = "#e2e8f0";

const s = StyleSheet.create({
  page:       { backgroundColor: WHITE, fontSize: 9, color: DARK, padding: 0 },
  topBar:     { backgroundColor: BLUE, height: 5 },
  header:     { padding: "24 40", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 1, borderBottomColor: BORDER },
  body:       { padding: "20 40", flex: 1 },
  section:    { marginBottom: 20 },
  sTitle:     { fontSize: 8, color: BLUE, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 },
  row2:       { flexDirection: "row", gap: 20 },
  col:        { flex: 1 },
  fieldLbl:   { fontSize: 7.5, color: MID, marginBottom: 1.5 },
  fieldVal:   { fontSize: 9.5, color: DARK, fontWeight: "bold" },
  chip:       { backgroundColor: LIGHT, borderRadius: 20, padding: "3 10", alignSelf: "flex-start", borderWidth: 1, borderColor: BORDER },
  chipTxt:    { fontSize: 8, color: MID },
  tHead:      { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: BLUE, paddingBottom: 6, marginBottom: 0 },
  tHeadTxt:   { fontSize: 8, color: BLUE, fontWeight: "bold", textTransform: "uppercase" },
  tRow:       { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, paddingVertical: 6 },
  cell:       { fontSize: 9 },
  totals:     { alignSelf: "flex-end", minWidth: 200, marginTop: 12 },
  tLine:      { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  tLbl:       { fontSize: 8.5, color: MID },
  tVal:       { fontSize: 8.5, color: DARK },
  totalFinal: { backgroundColor: BLUE, borderRadius: 6, padding: "10 14", flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  totalFLbl:  { fontSize: 12, color: WHITE, fontWeight: "bold" },
  totalFVal:  { fontSize: 12, color: WHITE, fontWeight: "bold" },
  footer:     { borderTopWidth: 1, borderTopColor: BORDER, padding: "12 40", flexDirection: "row", justifyContent: "space-between" },
  footerTxt:  { fontSize: 7.5, color: MID },
});

type Props = { quotation: Quotation; settings?: CompanySettings | null };

export default function TemplateModernaProductos({ quotation, settings }: Props) {
  const items      = quotation.items ?? [];
  const clientName = quotation.client?.name ?? quotation.client_name ?? "—";
  const issuerName = settings?.fiscal_name ?? "Mobility OS";
  const locale     = "es-MX";
  const fmt = (n: number) => n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.topBar} />

        {/* HEADER */}
        <View style={s.header}>
          <View>
            {settings?.logo_url
              ? <Image src={settings.logo_url} style={{ width: 100, height: 35, objectFit: "contain" }} />
              : <Text style={{ fontSize: 18, fontWeight: "bold", color: DARK }}>{issuerName}</Text>
            }
            {settings?.fiscal_rfc && <Text style={{ fontSize: 7.5, color: MID, marginTop: 4 }}>RFC: {settings.fiscal_rfc}</Text>}
          </View>
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            <Text style={{ fontSize: 8, color: MID, textTransform: "uppercase", letterSpacing: 1 }}>Cotización de Productos</Text>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: BLUE }}>{quotation.quote_number}</Text>
            <View style={s.chip}>
              <Text style={s.chipTxt}>Moderna · {new Date(quotation.created_at).toLocaleDateString(locale)}</Text>
            </View>
          </View>
        </View>

        {/* BODY */}
        <View style={s.body}>

          {/* CLIENT + META */}
          <View style={[s.section, s.row2]}>
            <View style={s.col}>
              <Text style={s.sTitle}>Para</Text>
              <Text style={[s.fieldVal, { fontSize: 12 }]}>{clientName}</Text>
              {quotation.client_rfc   && <Text style={[s.fieldLbl, { marginTop: 5 }]}>RFC: {quotation.client_rfc}</Text>}
              {quotation.client_email && <Text style={s.fieldLbl}>{quotation.client_email}</Text>}
            </View>
            <View style={[s.col, { gap: 8 }]}>
              {[
                { l: "Moneda",   v: quotation.currency },
                { l: "Vigencia", v: quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString(locale) : "—" },
              ].map((r) => (
                <View key={r.l}>
                  <Text style={s.fieldLbl}>{r.l}</Text>
                  <Text style={s.fieldVal}>{r.v}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* PRODUCTS */}
          <View style={s.section}>
            <Text style={s.sTitle}>Productos</Text>
            <View style={s.tHead}>
              <Text style={[s.tHeadTxt, { width: "8%" }]}>SKU</Text>
              <Text style={[s.tHeadTxt, { width: "37%" }]}>Descripción</Text>
              <Text style={[s.tHeadTxt, { width: "10%", textAlign: "right" }]}>Cant.</Text>
              <Text style={[s.tHeadTxt, { width: "7%", textAlign: "center" }]}>U.</Text>
              <Text style={[s.tHeadTxt, { width: "16%", textAlign: "right" }]}>P. Unit.</Text>
              <Text style={[s.tHeadTxt, { width: "8%", textAlign: "center" }]}>Desc.</Text>
              <Text style={[s.tHeadTxt, { width: "14%", textAlign: "right" }]}>Total</Text>
            </View>
            {items.map((item) => (
              <View key={item.id} style={s.tRow}>
                <Text style={[s.cell, { width: "8%", color: MID }]}>{item.sku ?? "—"}</Text>
                <View style={{ width: "37%" }}>
                  <Text style={[s.cell, { fontWeight: "bold" }]}>{item.description}</Text>
                  {item.details && <Text style={[s.cell, { color: MID, fontSize: 7.5 }]}>{item.details}</Text>}
                </View>
                <Text style={[s.cell, { width: "10%", textAlign: "right" }]}>{item.quantity}</Text>
                <Text style={[s.cell, { width: "7%", textAlign: "center", color: MID }]}>{item.unit}</Text>
                <Text style={[s.cell, { width: "16%", textAlign: "right" }]}>${fmt(item.unit_price)}</Text>
                <Text style={[s.cell, { width: "8%", textAlign: "center", color: item.discount_pct > 0 ? GREEN : MID }]}>
                  {item.discount_pct > 0 ? `${item.discount_pct}%` : "—"}
                </Text>
                <Text style={[s.cell, { width: "14%", textAlign: "right", fontWeight: "bold", color: GREEN }]}>${fmt(item.subtotal)}</Text>
              </View>
            ))}
          </View>

          {/* TOTALS */}
          <View style={s.totals}>
            {[
              { l: "Subtotal",         v: `${quotation.currency} $${fmt(quotation.subtotal)}` },
              ...(quotation.discount_amount > 0 ? [{ l: "Descuento", v: `- ${quotation.currency} $${fmt(quotation.discount_amount)}` }] : []),
              { l: `IVA ${quotation.tax_rate}%`, v: `${quotation.currency} $${fmt(quotation.tax_amount)}` },
            ].map((r) => (
              <View key={r.l} style={s.tLine}>
                <Text style={s.tLbl}>{r.l}</Text>
                <Text style={s.tVal}>{r.v}</Text>
              </View>
            ))}
            <View style={s.totalFinal}>
              <Text style={s.totalFLbl}>TOTAL</Text>
              <Text style={s.totalFVal}>{quotation.currency} ${fmt(quotation.total)}</Text>
            </View>
          </View>

          {/* NOTES */}
          {quotation.notes && (
            <View style={[s.section, { marginTop: 16 }]}>
              <Text style={s.sTitle}>Notas</Text>
              <Text style={{ fontSize: 8.5, color: MID, lineHeight: 1.5 }}>{quotation.notes}</Text>
            </View>
          )}
        </View>

        {/* FOOTER */}
        <View style={s.footer}>
          <Text style={s.footerTxt}>{issuerName} · {settings?.fiscal_rfc ?? ""}</Text>
          <Text style={s.footerTxt}>{settings?.quote_footer ?? "Precios sujetos a cambio sin previo aviso"}</Text>
          <Text style={s.footerTxt}>{quotation.quote_number}</Text>
        </View>
      </Page>
    </Document>
  );
}
