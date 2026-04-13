import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ServiceOrder } from "../../types/service-orders.types";

const NAVY = "#0a1628"; const GOLD = "#c9a227"; const WHITE = "#ffffff";
const MUTED = "#94a3b8"; const LIGHT = "#f8fafc";

const s = StyleSheet.create({
  page:     { backgroundColor: WHITE, fontSize: 8.5, color: NAVY },
  header:   { backgroundColor: NAVY, padding: "20 32", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goldLine: { backgroundColor: GOLD, height: 3 },
  body:     { padding: "14 32" },
  sTitle:   { fontSize: 8, color: GOLD, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: "#1e3a5f" },
  section:  { marginBottom: 10 },
  row2:     { flexDirection: "row", gap: 14 },
  col:      { flex: 1 },
  lbl:      { fontSize: 7, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 1.5 },
  val:      { fontSize: 8.5, color: NAVY, fontWeight: "bold", marginBottom: 4 },
  tHead:    { flexDirection: "row", backgroundColor: NAVY, padding: "5 7" },
  tHTxt:    { color: WHITE, fontSize: 7.5, fontWeight: "bold", textTransform: "uppercase" },
  tRow:     { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "5 7" },
  tRowAlt:  { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "5 7", backgroundColor: LIGHT },
  cell:     { fontSize: 8 },
  instrBox: { backgroundColor: "#1e3a5f", padding: "8 12", borderRadius: 3, marginTop: 6 },
  footer:   { backgroundColor: NAVY, padding: "10 32" },
  fTxt:     { color: MUTED, fontSize: 7, textAlign: "center" },
  proBox:   { backgroundColor: GOLD, padding: "6 14", alignSelf: "flex-end", borderRadius: 3, marginBottom: 8 },
});

type Props = { order: ServiceOrder; settings: any };

export default function BOLElegante({ order, settings }: Props) {
  const locale = "es-MX";
  const items  = order.items ?? [];
  const issuerName = settings?.fiscal_name ?? "Mobility OS";
  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString(locale) : "—";

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <View>
            {settings?.logo_url
              ? <Image src={settings.logo_url} style={{ width: 100, height: 36, objectFit: "contain" }} />
              : <Text style={{ fontSize: 18, fontWeight: "bold", color: WHITE }}>{issuerName}</Text>
            }
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 9, color: GOLD, textTransform: "uppercase", letterSpacing: 2, marginBottom: 3 }}>BILL OF LADING</Text>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: WHITE }}>
              {order.shipment?.reference ?? order.id.slice(0, 8).toUpperCase()}
            </Text>
            {order.pro_number && (
              <View style={s.proBox}>
                <Text style={{ fontSize: 8, fontWeight: "bold", color: NAVY }}>PRO# {order.pro_number}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={s.goldLine} />

        <View style={s.body}>
          <View style={[s.section, s.row2]}>
            <View style={s.col}>
              <Text style={s.sTitle}>Shipper</Text>
              {[order.shipper_name, order.shipper_address, [order.shipper_city, order.shipper_state].filter(Boolean).join(", "), order.shipper_phone].filter(Boolean).map((v, i) => (
                <Text key={i} style={s.cell}>{v}</Text>
              ))}
            </View>
            <View style={s.col}>
              <Text style={s.sTitle}>Consignee</Text>
              {[order.consignee_name, order.consignee_address, [order.consignee_city, order.consignee_state].filter(Boolean).join(", "), order.consignee_phone].filter(Boolean).map((v, i) => (
                <Text key={i} style={s.cell}>{v}</Text>
              ))}
            </View>
          </View>

          <View style={[s.section, s.row2]}>
            <View style={s.col}>
              <Text style={s.sTitle}>Carrier</Text>
              {[
                { l: "Company",   v: order.carrier_name    },
                { l: "SCAC",      v: order.carrier_scac    },
                { l: "Contact",   v: order.carrier_contact },
                { l: "Phone",     v: order.carrier_phone   },
                { l: "Driver",    v: order.driver_name     },
              ].map((r) => r.v ? <View key={r.l}><Text style={s.lbl}>{r.l}</Text><Text style={s.val}>{r.v}</Text></View> : null)}
            </View>
            <View style={s.col}>
              <Text style={s.sTitle}>Shipment Details</Text>
              {[
                { l: "Pickup Date",    v: fmtDate(order.pickup_date)    },
                { l: "Pickup Address", v: order.pickup_address          },
                { l: "Delivery Date",  v: fmtDate(order.delivery_date)  },
                { l: "Delivery Address",v: order.delivery_address       },
                { l: "Reference",      v: order.reference_number        },
              ].map((r) => r.v ? <View key={r.l}><Text style={s.lbl}>{r.l}</Text><Text style={s.val}>{r.v}</Text></View> : null)}
            </View>
          </View>

          {items.length > 0 && (
            <View style={s.section}>
              <Text style={s.sTitle}>Commodity / Freight Description</Text>
              <View style={s.tHead}>
                <Text style={[s.tHTxt, { flex: 1 }]}>Description</Text>
                <Text style={[s.tHTxt, { width: "10%", textAlign: "right" }]}>Pieces</Text>
                <Text style={[s.tHTxt, { width: "10%", textAlign: "center" }]}>Unit</Text>
                <Text style={[s.tHTxt, { width: "11%", textAlign: "right" }]}>Wt (lbs)</Text>
                <Text style={[s.tHTxt, { width: "11%", textAlign: "right" }]}>Wt (kg)</Text>
                <Text style={[s.tHTxt, { width: "13%", textAlign: "right" }]}>Value</Text>
              </View>
              {items.map((item, i) => (
                <View key={item.id} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                  <Text style={[s.cell, { flex: 1, fontWeight: "bold" }]}>{item.description}</Text>
                  <Text style={[s.cell, { width: "10%", textAlign: "right" }]}>{item.quantity}</Text>
                  <Text style={[s.cell, { width: "10%", textAlign: "center", color: MUTED }]}>{item.unit}</Text>
                  <Text style={[s.cell, { width: "11%", textAlign: "right" }]}>{item.weight_lbs || "—"}</Text>
                  <Text style={[s.cell, { width: "11%", textAlign: "right" }]}>{item.weight_kg || "—"}</Text>
                  <Text style={[s.cell, { width: "13%", textAlign: "right" }]}>{item.commercial_value > 0 ? `${item.currency} ${item.commercial_value}` : "—"}</Text>
                </View>
              ))}
            </View>
          )}

          {order.special_instructions && (
            <View style={s.instrBox}>
              <Text style={{ fontSize: 7.5, fontWeight: "bold", color: GOLD, marginBottom: 3 }}>SPECIAL INSTRUCTIONS</Text>
              <Text style={{ fontSize: 8, color: WHITE, lineHeight: 1.5 }}>{order.special_instructions}</Text>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 24, marginTop: 16 }}>
            {["Shipper Signature", "Carrier Signature", "Consignee Signature"].map((label) => (
              <View key={label} style={{ flex: 1, borderTopWidth: 1, borderTopColor: MUTED, paddingTop: 5 }}>
                <Text style={{ fontSize: 7, color: MUTED, textAlign: "center" }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={s.footer}>
          <Text style={s.fTxt}>{issuerName} · {settings?.fiscal_rfc ?? ""} · {settings?.fiscal_address ?? ""}</Text>
        </View>
      </Page>
    </Document>
  );
}
