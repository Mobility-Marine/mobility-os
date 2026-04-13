import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Quotation, CompanySettings } from "../../types/quotations.types";

const DARK   = "#1a1a2e";
const CORP   = "#16213e";
const ACCENT = "#0f3460";
const SILVER = "#e8e8e8";
const MID    = "#666666";
const WHITE  = "#ffffff";
const BORDER = "#cccccc";
const ROW_ALT= "#f5f5f5";

const s = StyleSheet.create({
  page:     { backgroundColor: WHITE, fontSize: 9, color: DARK },
  border:   { borderWidth: 1, borderColor: BORDER, margin: 20, flex: 1 },
  header:   { backgroundColor: CORP, padding: "20 24", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  body:     { padding: "16 24" },
  divider:  { backgroundColor: ACCENT, height: 2, marginHorizontal: 24, marginVertical: 0 },
  infoBar:  { backgroundColor: SILVER, padding: "10 24", flexDirection: "row", justifyContent: "space-between" },
  section:  { marginBottom: 16 },
  sTitle:   { fontSize: 9, fontWeight: "bold", color: CORP, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 3 },
  row2:     { flexDirection: "row", gap: 16 },
  col:      { flex: 1 },
  lbl:      { fontSize: 8, color: MID },
  val:      { fontSize: 9, color: DARK, fontWeight: "bold" },
  tHead:    { flexDirection: "row", backgroundColor: ACCENT, padding: "6 8" },
  tHTxt:    { color: WHITE, fontSize: 8, fontWeight: "bold", textTransform: "uppercase" },
  tRow:     { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, padding: "6 8" },
  tRowAlt:  { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, padding: "6 8", backgroundColor: ROW_ALT },
  cell:     { fontSize: 8.5 },
  totBox:   { alignSelf: "flex-end", minWidth: 210, marginTop: 10, borderWidth: 1, borderColor: BORDER },
  totRow:   { flexDirection: "row", justifyContent: "space-between", padding: "5 10", borderBottomWidth: 1, borderBottomColor: BORDER },
  totGrand: { flexDirection: "row", justifyContent: "space-between", padding: "8 10", backgroundColor: CORP },
  totLbl:   { fontSize: 8.5, color: MID },
  totVal:   { fontSize: 8.5, color: DARK },
  totGLbl:  { fontSize: 11, color: WHITE, fontWeight: "bold" },
  totGVal:  { fontSize: 11, color: WHITE, fontWeight: "bold" },
  footer:   { borderTopWidth: 1, borderTopColor: BORDER, padding: "8 24", marginTop: 4 },
  fTxt:     { fontSize: 7.5, color: MID, textAlign: "center" },
  numBox:   { position: "absolute", top: 16, right: 24, alignItems: "flex-end" },
  numLbl:   { fontSize: 7.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 },
  numVal:   { fontSize: 18, color: WHITE, fontWeight: "bold" },
});

type Props = { quotation: Quotation; settings?: CompanySettings | null };

export default function TemplateCorporativaProductos({ quotation, settings }: Props) {
  const items      = quotation.items ?? [];
  const clientName = quotation.client?.name ?? quotation.client_name ?? "—";
  const issuerName = settings?.fiscal_name ?? "Mobility OS";
  const locale     = "es-MX";
  const fmt = (n: number) => n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* HEADER */}
        <View style={s.header}>
          <View>
            {settings?.logo_url
              ? <Image src={settings.logo_url} style={{ width: 100, height: 35, objectFit: "contain" }} />
              : <Text style={{ fontSize: 16, fontWeight: "bold", color: WHITE }}>{issuerName}</Text>
            }
            <Text style={{ color: "#94a3b8", fontSize: 7.5, marginTop: 4 }}>
              {[settings?.fiscal_address, settings?.fiscal_city, settings?.fiscal_country].filter(Boolean).join(", ")}
            </Text>
          </View>
          <View style={s.numBox}>
            <Text style={s.numLbl}>No. Cotización</Text>
            <Text style={s.numVal}>{quotation.quote_number}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 7.5, textAlign: "right", marginTop: 3 }}>Corporativa · Productos</Text>
          </View>
        </View>
        <View style={s.divider} />

        {/* INFO BAR */}
        <View style={s.infoBar}>
          {[
            { l: "Fecha emisión", v: new Date(quotation.created_at).toLocaleDateString(locale) },
            { l: "Válida hasta",  v: quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString(locale) : "—" },
            { l: "Moneda",        v: quotation.currency },
            { l: "RFC Emisor",    v: settings?.fiscal_rfc ?? "—" },
          ].map((r) => (
            <View key={r.l}>
              <Text style={[s.lbl, { fontSize: 7, textTransform: "uppercase" }]}>{r.l}</Text>
              <Text style={[s.val, { fontSize: 9 }]}>{r.v}</Text>
            </View>
          ))}
        </View>

        {/* BODY */}
        <View style={s.body}>

          {/* CLIENT */}
          <View style={s.section}>
            <Text style={s.sTitle}>Datos del cliente</Text>
            <View style={s.row2}>
              <View style={s.col}>
                <Text style={s.lbl}>Razón social / Nombre</Text>
                <Text style={[s.val, { fontSize: 11 }]}>{clientName}</Text>
              </View>
              <View style={s.col}>
                {quotation.client_rfc   && <><Text style={s.lbl}>RFC</Text><Text style={s.val}>{quotation.client_rfc}</Text></>}
                {quotation.client_email && <><Text style={[s.lbl, { marginTop: 4 }]}>Email</Text><Text style={s.val}>{quotation.client_email}</Text></>}
              </View>
            </View>
          </View>

          {/* TABLE */}
          <View style={s.section}>
            <Text style={s.sTitle}>Relación de productos</Text>
            <View style={s.tHead}>
              <Text style={[s.tHTxt, { width: "8%" }]}>SKU</Text>
              <Text style={[s.tHTxt, { width: "37%" }]}>Descripción del producto</Text>
              <Text style={[s.tHTxt, { width: "10%", textAlign: "right" }]}>Cant.</Text>
              <Text style={[s.tHTxt, { width: "8%",  textAlign: "center" }]}>Unid.</Text>
              <Text style={[s.tHTxt, { width: "15%", textAlign: "right" }]}>P. Unitario</Text>
              <Text style={[s.tHTxt, { width: "8%",  textAlign: "center" }]}>Dto.</Text>
              <Text style={[s.tHTxt, { width: "14%", textAlign: "right" }]}>Importe</Text>
            </View>
            {items.map((item, i) => (
              <View key={item.id} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                <Text style={[s.cell, { width: "8%", color: MID }]}>{item.sku ?? "—"}</Text>
                <View style={{ width: "37%" }}>
                  <Text style={[s.cell, { fontWeight: "bold" }]}>{item.description}</Text>
                  {item.details && <Text style={[s.cell, { color: MID, fontSize: 7.5 }]}>{item.details}</Text>}
                </View>
                <Text style={[s.cell, { width: "10%", textAlign: "right" }]}>{item.quantity}</Text>
                <Text style={[s.cell, { width: "8%",  textAlign: "center", color: MID }]}>{item.unit}</Text>
                <Text style={[s.cell, { width: "15%", textAlign: "right" }]}>${fmt(item.unit_price)}</Text>
                <Text style={[s.cell, { width: "8%",  textAlign: "center" }]}>{item.discount_pct > 0 ? `${item.discount_pct}%` : "—"}</Text>
                <Text style={[s.cell, { width: "14%", textAlign: "right", fontWeight: "bold" }]}>${fmt(item.subtotal)}</Text>
              </View>
            ))}
          </View>

          {/* TOTALS */}
          <View style={s.totBox}>
            {[
              { l: "Subtotal",              v: `${quotation.currency} $${fmt(quotation.subtotal)}` },
              ...(quotation.discount_amount > 0 ? [{ l: "Descuento global", v: `- ${quotation.currency} $${fmt(quotation.discount_amount)}` }] : []),
              { l: `IVA ${quotation.tax_rate}%`, v: `${quotation.currency} $${fmt(quotation.tax_amount)}` },
            ].map((r) => (
              <View key={r.l} style={s.totRow}>
                <Text style={s.totLbl}>{r.l}</Text>
                <Text style={s.totVal}>{r.v}</Text>
              </View>
            ))}
            <View style={s.totGrand}>
              <Text style={s.totGLbl}>TOTAL A PAGAR</Text>
              <Text style={s.totGVal}>{quotation.currency} ${fmt(quotation.total)}</Text>
            </View>
          </View>

          {/* TERMS */}
          {quotation.terms && (
            <View style={[s.section, { marginTop: 16 }]}>
              <Text style={s.sTitle}>Términos y condiciones</Text>
              <Text style={{ fontSize: 7.5, color: MID, lineHeight: 1.6 }}>{quotation.terms}</Text>
            </View>
          )}
        </View>

        <View style={s.footer}>
          <Text style={s.fTxt}>{issuerName} · {settings?.fiscal_address ?? ""} · {settings?.fiscal_rfc ?? ""}</Text>
          {settings?.quote_footer && <Text style={[s.fTxt, { marginTop: 3 }]}>{settings.quote_footer}</Text>}
        </View>
      </Page>
    </Document>
  );
}
