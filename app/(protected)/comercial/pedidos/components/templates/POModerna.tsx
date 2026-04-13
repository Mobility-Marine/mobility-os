import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Order } from "../../types/orders.types";

const BLUE   = "#2563eb";
const DARK   = "#0f172a";
const MID    = "#475569";
const LIGHT  = "#f1f5f9";
const WHITE  = "#ffffff";
const BORDER = "#e2e8f0";
const GREEN  = "#16a34a";

const s = StyleSheet.create({
  page:    { backgroundColor: WHITE, fontSize: 9, color: DARK },
  topBar:  { backgroundColor: BLUE, height: 5 },
  header:  { padding: "20 40", flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: BORDER },
  body:    { padding: "18 40", flex: 1 },
  sTitle:  { fontSize: 8, color: BLUE, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 },
  row2:    { flexDirection: "row", gap: 20 },
  col:     { flex: 1 },
  lbl:     { fontSize: 7.5, color: MID, marginBottom: 1.5 },
  val:     { fontSize: 9.5, color: DARK, fontWeight: "bold" },
  section: { marginBottom: 18 },
  tHead:   { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: BLUE, paddingBottom: 5 },
  tHTxt:   { fontSize: 8, color: BLUE, fontWeight: "bold", textTransform: "uppercase" },
  tRow:    { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, paddingVertical: 5 },
  tRowAlt: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, paddingVertical: 5, backgroundColor: LIGHT },
  cell:    { fontSize: 9 },
  totals:  { alignSelf: "flex-end", minWidth: 210, marginTop: 12 },
  tLine:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  tLbl:    { fontSize: 8.5, color: MID },
  tVal:    { fontSize: 8.5, color: DARK },
  totalFin:{ backgroundColor: BLUE, borderRadius: 6, padding: "10 14", flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  footer:  { borderTopWidth: 1, borderTopColor: BORDER, padding: "10 40", flexDirection: "row", justifyContent: "space-between" },
  fTxt:    { fontSize: 7.5, color: MID },
});

type Props = { order: Order; settings: any };

export default function POModerna({ order, settings }: Props) {
  const locale     = "es-MX";
  const fmt        = (n: number) => `${order.currency} $${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const items      = order.items ?? [];
  const issuerName = settings?.fiscal_name ?? "Mobility OS";
  const clientName = order.client?.name ?? "—";

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.topBar} />
        <View style={s.header}>
          <View>
            {settings?.logo_url
              ? <Image src={settings.logo_url} style={{ width: 100, height: 35, objectFit: "contain" }} />
              : <Text style={{ fontSize: 18, fontWeight: "bold", color: DARK }}>{issuerName}</Text>
            }
            <Text style={{ fontSize: 7.5, color: MID, marginTop: 3 }}>RFC: {settings?.fiscal_rfc ?? "—"}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 8, color: MID, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              Orden de Compra
            </Text>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: BLUE }}>{order.order_number}</Text>
            <Text style={{ fontSize: 8, color: MID, marginTop: 3 }}>
              {new Date(order.created_at).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
            </Text>
          </View>
        </View>

        <View style={s.body}>
          <View style={[s.section, s.row2]}>
            <View style={s.col}>
              <Text style={s.sTitle}>Para</Text>
              <Text style={{ fontSize: 12, fontWeight: "bold", color: DARK, marginBottom: 3 }}>{clientName}</Text>
              {order.client?.rfc   && <Text style={s.lbl}>RFC: {order.client.rfc}</Text>}
              {order.client?.email && <Text style={s.lbl}>{order.client.email}</Text>}
              {(order.delivery_address || order.delivery_city) && (
                <Text style={[s.lbl, { marginTop: 6 }]}>
                  {[order.delivery_address, order.delivery_city].filter(Boolean).join(", ")}
                </Text>
              )}
            </View>
            <View style={s.col}>
              <Text style={s.sTitle}>Detalles</Text>
              {[
                { l: "Cotización", v: order.quotation?.quote_number ?? "—" },
                { l: "Moneda",     v: order.currency },
                { l: "Prioridad",  v: order.priority },
                { l: "Entrega",    v: order.delivery_date ? new Date(order.delivery_date).toLocaleDateString(locale) : "Por definir" },
              ].map((r) => (
                <View key={r.l} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 7.5, color: MID }}>{r.l}</Text>
                  <Text style={{ fontSize: 8.5, color: DARK, fontWeight: "bold" }}>{r.v}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sTitle}>Productos</Text>
            <View style={s.tHead}>
              <Text style={[s.tHTxt, { width: "10%" }]}>SKU</Text>
              <Text style={[s.tHTxt, { flex: 1 }]}>Descripción</Text>
              <Text style={[s.tHTxt, { width: "10%", textAlign: "right" }]}>Cant.</Text>
              <Text style={[s.tHTxt, { width: "8%",  textAlign: "center" }]}>U.</Text>
              <Text style={[s.tHTxt, { width: "16%", textAlign: "right" }]}>P. Unit.</Text>
              <Text style={[s.tHTxt, { width: "8%",  textAlign: "center" }]}>Desc.</Text>
              <Text style={[s.tHTxt, { width: "14%", textAlign: "right" }]}>Total</Text>
            </View>
            {items.map((item, i) => (
              <View key={item.id} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                <Text style={[s.cell, { width: "10%", color: MID }]}>{item.sku ?? "—"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cell, { fontWeight: "bold" }]}>{item.description}</Text>
                  {item.details && <Text style={[s.cell, { color: MID, fontSize: 7.5 }]}>{item.details}</Text>}
                </View>
                <Text style={[s.cell, { width: "10%", textAlign: "right" }]}>{item.quantity}</Text>
                <Text style={[s.cell, { width: "8%",  textAlign: "center", color: MID }]}>{item.unit}</Text>
                <Text style={[s.cell, { width: "16%", textAlign: "right" }]}>${item.unit_price.toLocaleString(locale, { minimumFractionDigits: 2 })}</Text>
                <Text style={[s.cell, { width: "8%",  textAlign: "center" }]}>{item.discount_pct > 0 ? `${item.discount_pct}%` : "—"}</Text>
                <Text style={[s.cell, { width: "14%", textAlign: "right", fontWeight: "bold", color: GREEN }]}>
                  ${item.subtotal.toLocaleString(locale, { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
          </View>

          <View style={s.totals}>
            {[
              { l: "Subtotal", v: fmt(order.subtotal) },
              ...(order.discount_amount > 0 ? [{ l: "Descuento", v: `- ${fmt(order.discount_amount)}` }] : []),
              { l: `IVA ${order.tax_rate}%`, v: fmt(order.tax_amount) },
            ].map((r) => (
              <View key={r.l} style={s.tLine}>
                <Text style={s.tLbl}>{r.l}</Text>
                <Text style={s.tVal}>{r.v}</Text>
              </View>
            ))}
            <View style={s.totalFin}>
              <Text style={{ fontSize: 12, color: WHITE, fontWeight: "bold" }}>TOTAL</Text>
              <Text style={{ fontSize: 12, color: WHITE, fontWeight: "bold" }}>{fmt(order.total)}</Text>
            </View>
          </View>

          {order.notes && (
            <View style={{ marginTop: 16 }}>
              <Text style={s.sTitle}>Notas</Text>
              <Text style={{ fontSize: 8.5, color: MID, lineHeight: 1.5 }}>{order.notes}</Text>
            </View>
          )}

          <View style={{ marginTop: 24, flexDirection: "row", gap: 30 }}>
            {["Autorizado por", "Recibido por"].map((label) => (
              <View key={label} style={{ flex: 1, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 6 }}>
                <Text style={{ fontSize: 7.5, color: MID, textAlign: "center" }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.fTxt}>{issuerName} · {settings?.fiscal_rfc ?? ""}</Text>
          <Text style={s.fTxt}>{settings?.quote_footer ?? ""}</Text>
          <Text style={s.fTxt}>{order.order_number}</Text>
        </View>
      </Page>
    </Document>
  );
}
