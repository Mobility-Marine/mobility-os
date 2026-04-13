import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Order } from "../../types/orders.types";
import { ORDER_STATUS_CONFIG } from "../../types/orders.types";

const NAVY  = "#0a1628";
const GOLD  = "#c9a227";
const BLUE  = "#1d4ed8";
const LIGHT = "#f8fafc";
const MUTED = "#94a3b8";
const WHITE = "#ffffff";

const s = StyleSheet.create({
  page:      { backgroundColor: WHITE, fontSize: 9, color: NAVY },
  header:    { backgroundColor: NAVY, padding: "28 36", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goldLine:  { backgroundColor: GOLD, height: 3 },
  body:      { padding: "20 36" },
  section:   { marginBottom: 16 },
  sTitle:    { fontSize: 9, color: GOLD, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: "#1e3a5f" },
  row2:      { flexDirection: "row", gap: 20 },
  col:       { flex: 1 },
  lbl:       { fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  val:       { fontSize: 9.5, color: NAVY, fontWeight: "bold" },
  tHead:     { flexDirection: "row", backgroundColor: NAVY, padding: "6 8", borderRadius: 2 },
  tHTxt:     { color: WHITE, fontSize: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 },
  tRow:      { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "6 8" },
  tRowAlt:   { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "6 8", backgroundColor: LIGHT },
  cell:      { fontSize: 9 },
  totalBox:  { backgroundColor: NAVY, borderRadius: 4, padding: "12 16", marginTop: 8, alignSelf: "flex-end", minWidth: 220 },
  tRow2:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  tLbl:      { fontSize: 8.5, color: MUTED },
  tVal:      { fontSize: 8.5, color: WHITE },
  gLbl:      { fontSize: 13, color: GOLD, fontWeight: "bold" },
  gVal:      { fontSize: 13, color: GOLD, fontWeight: "bold" },
  footer:    { backgroundColor: NAVY, padding: "12 36" },
  fTxt:      { color: MUTED, fontSize: 8, textAlign: "center" },
  statusBadge: { backgroundColor: "#1e3a5f", borderRadius: 3, padding: "3 10", alignSelf: "flex-start" },
});

type Props = { order: Order; settings: any };

export default function POElegante({ order, settings }: Props) {
  const locale     = "es-MX";
  const fmt        = (n: number) => `${order.currency} $${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const items      = order.items ?? [];
  const issuerName = settings?.fiscal_name ?? "Mobility OS";
  const clientName = order.client?.name ?? "—";
  const statusCfg  = ORDER_STATUS_CONFIG[order.status];

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* HEADER */}
        <View style={s.header}>
          <View>
            {settings?.logo_url
              ? <Image src={settings.logo_url} style={{ width: 110, height: 40, objectFit: "contain" }} />
              : <Text style={{ fontSize: 20, fontWeight: "bold", color: WHITE }}>{issuerName}</Text>
            }
            {settings?.fiscal_rfc && <Text style={{ color: MUTED, fontSize: 8, marginTop: 4 }}>RFC: {settings.fiscal_rfc}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 9, color: GOLD, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>
              Orden de Compra
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "bold", color: WHITE, letterSpacing: 1 }}>
              {order.order_number}
            </Text>
            <View style={s.statusBadge}>
              <Text style={{ color: GOLD, fontSize: 8, fontWeight: "bold", textTransform: "uppercase" }}>
                {order.status.replace("_", " ")}
              </Text>
            </View>
          </View>
        </View>
        <View style={s.goldLine} />

        {/* BODY */}
        <View style={s.body}>

          {/* INFO */}
          <View style={[s.section, s.row2]}>
            <View style={s.col}>
              <Text style={s.sTitle}>Datos del pedido</Text>
              {[
                { l: "Número de pedido",  v: order.order_number },
                { l: "Fecha de emisión",  v: new Date(order.created_at).toLocaleDateString(locale) },
                { l: "Cotización origen", v: order.quotation?.quote_number ?? "—" },
                { l: "Moneda",            v: order.currency },
                { l: "Prioridad",         v: order.priority },
              ].map((r) => (
                <View key={r.l} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={s.lbl}>{r.l}</Text>
                  <Text style={s.cell}>{r.v}</Text>
                </View>
              ))}
            </View>
            <View style={s.col}>
              <Text style={s.sTitle}>Cliente</Text>
              <Text style={[s.val, { fontSize: 12, marginBottom: 6 }]}>{clientName}</Text>
              {order.client?.rfc   && <Text style={s.lbl}>RFC: {order.client.rfc}</Text>}
              {order.client?.email && <Text style={s.lbl}>{order.client.email}</Text>}

              {order.delivery_date && (
                <View style={{ marginTop: 10 }}>
                  <Text style={s.sTitle}>Fecha de entrega</Text>
                  <Text style={[s.val, { color: GOLD }]}>
                    {new Date(order.delivery_date).toLocaleDateString(locale)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* DIRECCIÓN DE ENTREGA */}
          {(order.delivery_address || order.delivery_city) && (
            <View style={s.section}>
              <Text style={s.sTitle}>Dirección de entrega</Text>
              <Text style={s.cell}>
                {[order.delivery_address, order.delivery_city, order.delivery_state, order.delivery_country]
                  .filter(Boolean).join(", ")}
              </Text>
            </View>
          )}

          {/* ITEMS */}
          <View style={s.section}>
            <Text style={s.sTitle}>Productos ordenados</Text>
            <View style={s.tHead}>
              <Text style={[s.tHTxt, { width: "10%" }]}>SKU</Text>
              <Text style={[s.tHTxt, { flex: 1 }]}>Descripción</Text>
              <Text style={[s.tHTxt, { width: "10%", textAlign: "right" }]}>Cant.</Text>
              <Text style={[s.tHTxt, { width: "8%",  textAlign: "center" }]}>Unidad</Text>
              <Text style={[s.tHTxt, { width: "16%", textAlign: "right" }]}>P. Unit.</Text>
              <Text style={[s.tHTxt, { width: "8%",  textAlign: "center" }]}>Desc.</Text>
              <Text style={[s.tHTxt, { width: "14%", textAlign: "right" }]}>Subtotal</Text>
            </View>
            {items.map((item, i) => (
              <View key={item.id} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                <Text style={[s.cell, { width: "10%", color: MUTED }]}>{item.sku ?? "—"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cell, { fontWeight: "bold" }]}>{item.description}</Text>
                  {item.details && <Text style={[s.cell, { color: MUTED, fontSize: 7.5 }]}>{item.details}</Text>}
                </View>
                <Text style={[s.cell, { width: "10%", textAlign: "right" }]}>{item.quantity}</Text>
                <Text style={[s.cell, { width: "8%",  textAlign: "center", color: MUTED }]}>{item.unit}</Text>
                <Text style={[s.cell, { width: "16%", textAlign: "right" }]}>${item.unit_price.toLocaleString(locale, { minimumFractionDigits: 2 })}</Text>
                <Text style={[s.cell, { width: "8%",  textAlign: "center" }]}>{item.discount_pct > 0 ? `${item.discount_pct}%` : "—"}</Text>
                <Text style={[s.cell, { width: "14%", textAlign: "right", fontWeight: "bold" }]}>${item.subtotal.toLocaleString(locale, { minimumFractionDigits: 2 })}</Text>
              </View>
            ))}
          </View>

          {/* TOTALS */}
          <View style={s.totalBox}>
            <View style={s.tRow2}><Text style={s.tLbl}>Subtotal</Text><Text style={s.tVal}>{fmt(order.subtotal)}</Text></View>
            {order.discount_amount > 0 && (
              <View style={s.tRow2}><Text style={s.tLbl}>Descuento</Text><Text style={[s.tVal, { color: GOLD }]}>- {fmt(order.discount_amount)}</Text></View>
            )}
            <View style={s.tRow2}><Text style={s.tLbl}>IVA {order.tax_rate}%</Text><Text style={s.tVal}>{fmt(order.tax_amount)}</Text></View>
            <View style={[s.tRow2, { borderTopWidth: 1, borderTopColor: "#1e3a5f", paddingTop: 5, marginTop: 3 }]}>
              <Text style={s.gLbl}>TOTAL</Text>
              <Text style={s.gVal}>{fmt(order.total)}</Text>
            </View>
          </View>

          {/* NOTAS */}
          {order.notes && (
            <View style={{ marginTop: 16 }}>
              <Text style={s.sTitle}>Notas</Text>
              <Text style={{ fontSize: 8.5, color: MUTED, lineHeight: 1.5 }}>{order.notes}</Text>
            </View>
          )}

          {/* FIRMA */}
          <View style={{ marginTop: 28, flexDirection: "row", gap: 40 }}>
            <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: MUTED, paddingTop: 6 }}>
              <Text style={[s.lbl, { textAlign: "center" }]}>Autorizado por</Text>
              <Text style={[s.cell, { textAlign: "center", marginTop: 2 }]}>{issuerName}</Text>
            </View>
            <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: MUTED, paddingTop: 6 }}>
              <Text style={[s.lbl, { textAlign: "center" }]}>Recibido por</Text>
              <Text style={[s.cell, { textAlign: "center", marginTop: 2 }]}>{clientName}</Text>
            </View>
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.fTxt}>{issuerName} · {settings?.fiscal_rfc ?? ""} · {settings?.fiscal_address ?? ""}</Text>
          {settings?.quote_footer && <Text style={[s.fTxt, { marginTop: 3 }]}>{settings.quote_footer}</Text>}
        </View>
      </Page>
    </Document>
  );
}
