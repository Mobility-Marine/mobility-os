import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Order } from "../../types/orders.types";

const CORP   = "#16213e";
const ACCENT = "#0f3460";
const WHITE  = "#ffffff";
const MID    = "#666666";
const BORDER = "#cccccc";
const ALT    = "#f5f5f5";

const s = StyleSheet.create({
  page:    { backgroundColor: WHITE, fontSize: 9, color: CORP },
  header:  { backgroundColor: CORP, padding: "20 28", flexDirection: "row", justifyContent: "space-between" },
  divider: { height: 3, backgroundColor: ACCENT },
  infoBar: { backgroundColor: ALT, padding: "8 28", flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: BORDER },
  body:    { padding: "14 28" },
  sTitle:  { fontSize: 9, fontWeight: "bold", color: CORP, textTransform: "uppercase", letterSpacing: 1, marginBottom: 7, borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 3 },
  section: { marginBottom: 14 },
  row2:    { flexDirection: "row", gap: 16 },
  col:     { flex: 1 },
  lbl:     { fontSize: 7.5, color: MID, textTransform: "uppercase" },
  val:     { fontSize: 9, color: CORP, fontWeight: "bold" },
  tHead:   { flexDirection: "row", backgroundColor: ACCENT, padding: "6 8" },
  tHTxt:   { color: WHITE, fontSize: 8, fontWeight: "bold", textTransform: "uppercase" },
  tRow:    { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, padding: "5 8" },
  tRowAlt: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, padding: "5 8", backgroundColor: ALT },
  cell:    { fontSize: 8.5 },
  totBox:  { alignSelf: "flex-end", minWidth: 220, borderWidth: 1, borderColor: BORDER, marginTop: 10 },
  totRow:  { flexDirection: "row", justifyContent: "space-between", padding: "5 10", borderBottomWidth: 1, borderBottomColor: BORDER },
  totFin:  { flexDirection: "row", justifyContent: "space-between", padding: "8 10", backgroundColor: CORP },
  footer:  { borderTopWidth: 1, borderTopColor: BORDER, padding: "8 28" },
  fTxt:    { fontSize: 7.5, color: MID, textAlign: "center" },
});

type Props = { order: Order; settings: any };

export default function POCorporativa({ order, settings }: Props) {
  const locale     = "es-MX";
  const fmt        = (n: number) => `${order.currency} $${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const items      = order.items ?? [];
  const issuerName = settings?.fiscal_name ?? "Mobility OS";
  const clientName = order.client?.name ?? "—";

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <View>
            {settings?.logo_url
              ? <Image src={settings.logo_url} style={{ width: 100, height: 35, objectFit: "contain" }} />
              : <Text style={{ fontSize: 16, fontWeight: "bold", color: WHITE }}>{issuerName}</Text>
            }
            <Text style={{ color: "#94a3b8", fontSize: 7.5, marginTop: 4 }}>
              {[settings?.fiscal_address, settings?.fiscal_city].filter(Boolean).join(", ")}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 8, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              Orden de Compra
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: WHITE }}>{order.order_number}</Text>
            <Text style={{ fontSize: 7.5, color: "#94a3b8", marginTop: 3 }}>
              {new Date(order.created_at).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
            </Text>
          </View>
        </View>
        <View style={s.divider} />

        <View style={s.infoBar}>
          {[
            { l: "No. Pedido",  v: order.order_number },
            { l: "Cotización",  v: order.quotation?.quote_number ?? "—" },
            { l: "Moneda",      v: order.currency },
            { l: "Prioridad",   v: order.priority },
            { l: "Entrega",     v: order.delivery_date ? new Date(order.delivery_date).toLocaleDateString(locale) : "Por definir" },
            { l: "RFC",         v: settings?.fiscal_rfc ?? "—" },
          ].map((r) => (
            <View key={r.l}>
              <Text style={[s.lbl, { fontSize: 7 }]}>{r.l}</Text>
              <Text style={[s.val, { fontSize: 8.5 }]}>{r.v}</Text>
            </View>
          ))}
        </View>

        <View style={s.body}>
          {/* CLIENTES */}
          <View style={[s.section, s.row2]}>
            <View style={s.col}>
              <Text style={s.sTitle}>Emitido por</Text>
              <Text style={[s.val, { fontSize: 11 }]}>{issuerName}</Text>
              {settings?.fiscal_rfc && <Text style={[s.lbl, { marginTop: 3 }]}>RFC: {settings.fiscal_rfc}</Text>}
              {settings?.fiscal_address && <Text style={s.lbl}>{settings.fiscal_address}, {settings.fiscal_city}</Text>}
            </View>
            <View style={s.col}>
              <Text style={s.sTitle}>Cliente</Text>
              <Text style={[s.val, { fontSize: 11 }]}>{clientName}</Text>
              {order.client?.rfc   && <Text style={[s.lbl, { marginTop: 3 }]}>RFC: {order.client.rfc}</Text>}
              {order.client?.email && <Text style={s.lbl}>{order.client.email}</Text>}
            </View>
          </View>

          {/* TABLA */}
          <View style={s.section}>
            <Text style={s.sTitle}>Relación de productos</Text>
            <View style={s.tHead}>
              <Text style={[s.tHTxt, { width: "10%" }]}>SKU</Text>
              <Text style={[s.tHTxt, { flex: 1 }]}>Descripción del producto</Text>
              <Text style={[s.tHTxt, { width: "10%", textAlign: "right" }]}>Cant.</Text>
              <Text style={[s.tHTxt, { width: "8%",  textAlign: "center" }]}>Unid.</Text>
              <Text style={[s.tHTxt, { width: "15%", textAlign: "right" }]}>P. Unitario</Text>
              <Text style={[s.tHTxt, { width: "8%",  textAlign: "center" }]}>Dto.</Text>
              <Text style={[s.tHTxt, { width: "14%", textAlign: "right" }]}>Importe</Text>
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
                <Text style={[s.cell, { width: "15%", textAlign: "right" }]}>${item.unit_price.toLocaleString(locale, { minimumFractionDigits: 2 })}</Text>
                <Text style={[s.cell, { width: "8%",  textAlign: "center" }]}>{item.discount_pct > 0 ? `${item.discount_pct}%` : "—"}</Text>
                <Text style={[s.cell, { width: "14%", textAlign: "right", fontWeight: "bold" }]}>${item.subtotal.toLocaleString(locale, { minimumFractionDigits: 2 })}</Text>
              </View>
            ))}
          </View>

          {/* TOTALS */}
          <View style={s.totBox}>
            {[
              { l: "Subtotal",              v: fmt(order.subtotal) },
              ...(order.discount_amount > 0 ? [{ l: "Descuento", v: `- ${fmt(order.discount_amount)}` }] : []),
              { l: `IVA ${order.tax_rate}%`, v: fmt(order.tax_amount) },
            ].map((r) => (
              <View key={r.l} style={s.totRow}>
                <Text style={{ fontSize: 8.5, color: MID }}>{r.l}</Text>
                <Text style={{ fontSize: 8.5, color: CORP }}>{r.v}</Text>
              </View>
            ))}
            <View style={s.totFin}>
              <Text style={{ fontSize: 11, color: WHITE, fontWeight: "bold" }}>TOTAL A PAGAR</Text>
              <Text style={{ fontSize: 11, color: WHITE, fontWeight: "bold" }}>{fmt(order.total)}</Text>
            </View>
          </View>

          {order.notes && (
            <View style={{ marginTop: 16 }}>
              <Text style={s.sTitle}>Notas y condiciones</Text>
              <Text style={{ fontSize: 7.5, color: MID, lineHeight: 1.6 }}>{order.notes}</Text>
            </View>
          )}

          <View style={{ marginTop: 24, flexDirection: "row", gap: 40 }}>
            {[
              { label: "Autorizado por", name: issuerName },
              { label: "Recibido por",   name: clientName },
            ].map((r) => (
              <View key={r.label} style={{ flex: 1, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 6 }}>
                <Text style={{ fontSize: 7.5, color: MID, textAlign: "center" }}>{r.label}</Text>
                <Text style={{ fontSize: 8.5, color: CORP, textAlign: "center", marginTop: 2 }}>{r.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.fTxt}>{issuerName} · {settings?.fiscal_address ?? ""} · {settings?.fiscal_rfc ?? ""}</Text>
          {settings?.quote_footer && <Text style={[s.fTxt, { marginTop: 3 }]}>{settings.quote_footer}</Text>}
        </View>
      </Page>
    </Document>
  );
}
