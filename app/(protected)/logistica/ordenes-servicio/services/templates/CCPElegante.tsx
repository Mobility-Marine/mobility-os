import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ServiceOrder } from "../../types/service-orders.types";

const NAVY = "#0a1628"; const GOLD = "#c9a227"; const WHITE = "#ffffff";
const MUTED = "#94a3b8"; const LIGHT = "#f8fafc"; const BLUE = "#1d4ed8";

const s = StyleSheet.create({
  page:      { backgroundColor: WHITE, fontSize: 8.5, color: NAVY },
  header:    { backgroundColor: NAVY, padding: "20 32", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goldLine:  { backgroundColor: GOLD, height: 3 },
  body:      { padding: "14 32" },
  section:   { marginBottom: 10 },
  sTitle:    { fontSize: 8, color: GOLD, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: "#1e3a5f" },
  row2:      { flexDirection: "row", gap: 14 },
  col:       { flex: 1 },
  lbl:       { fontSize: 7, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 1.5 },
  val:       { fontSize: 8.5, color: NAVY, fontWeight: "bold", marginBottom: 4 },
  tHead:     { flexDirection: "row", backgroundColor: NAVY, padding: "5 7" },
  tHTxt:     { color: WHITE, fontSize: 7.5, fontWeight: "bold", textTransform: "uppercase" },
  tRow:      { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "5 7" },
  tRowAlt:   { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "5 7", backgroundColor: LIGHT },
  cell:      { fontSize: 8 },
  instrBox:  { backgroundColor: "#1e3a5f", padding: "8 12", borderRadius: 3, marginTop: 6 },
  footer:    { backgroundColor: NAVY, padding: "10 32" },
  fTxt:      { color: MUTED, fontSize: 7, textAlign: "center" },
  firmBox:   { borderTopWidth: 1, borderTopColor: MUTED, paddingTop: 5, flex: 1, marginTop: 20 },
  badge:     { backgroundColor: GOLD, padding: "3 10", alignSelf: "flex-start", borderRadius: 2 },
});

type Props = { order: ServiceOrder; settings: any };

export default function CCPElegante({ order, settings }: Props) {
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
            {settings?.fiscal_rfc && <Text style={{ color: MUTED, fontSize: 7, marginTop: 3 }}>RFC: {settings.fiscal_rfc}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <View style={s.badge}><Text style={{ fontSize: 9, fontWeight: "bold", color: NAVY, textTransform: "uppercase", letterSpacing: 1 }}>CCP + Carta de Instrucciones</Text></View>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: WHITE, marginTop: 5 }}>
              {order.shipment?.reference ?? order.id.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 2 }}>
              {new Date(order.created_at).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
            </Text>
          </View>
        </View>
        <View style={s.goldLine} />

        <View style={s.body}>
          {/* REMITENTE / DESTINATARIO */}
          <View style={[s.section, s.row2]}>
            <View style={s.col}>
              <Text style={s.sTitle}>Remitente (Shipper)</Text>
              {[
                { l: "Nombre",    v: order.shipper_name    },
                { l: "Dirección", v: order.shipper_address },
                { l: "Ciudad",    v: [order.shipper_city, order.shipper_state].filter(Boolean).join(", ") },
                { l: "País",      v: order.shipper_country },
                { l: "Contacto",  v: order.shipper_contact },
                { l: "Teléfono",  v: order.shipper_phone   },
              ].map((r) => r.v ? <View key={r.l}><Text style={s.lbl}>{r.l}</Text><Text style={s.val}>{r.v}</Text></View> : null)}
            </View>
            <View style={s.col}>
              <Text style={s.sTitle}>Destinatario (Consignee)</Text>
              {[
                { l: "Nombre",    v: order.consignee_name    },
                { l: "Dirección", v: order.consignee_address },
                { l: "Ciudad",    v: [order.consignee_city, order.consignee_state].filter(Boolean).join(", ") },
                { l: "País",      v: order.consignee_country },
                { l: "Contacto",  v: order.consignee_contact },
                { l: "Teléfono",  v: order.consignee_phone   },
              ].map((r) => r.v ? <View key={r.l}><Text style={s.lbl}>{r.l}</Text><Text style={s.val}>{r.v}</Text></View> : null)}
            </View>
          </View>

          {/* TRANSPORTISTA + VEHÍCULO */}
          <View style={[s.section, s.row2]}>
            <View style={s.col}>
              <Text style={s.sTitle}>Transportista / Operador</Text>
              {[
                { l: "Empresa",  v: order.carrier_name   },
                { l: "Contacto", v: order.carrier_contact },
                { l: "Teléfono", v: order.carrier_phone   },
                { l: "Operador", v: order.driver_name     },
                { l: "Licencia", v: order.driver_license  },
              ].map((r) => r.v ? <View key={r.l}><Text style={s.lbl}>{r.l}</Text><Text style={s.val}>{r.v}</Text></View> : null)}
            </View>
            <View style={s.col}>
              <Text style={s.sTitle}>Datos del vehículo (CCP)</Text>
              {[
                { l: "Tipo unidad", v: order.vehicle_type   },
                { l: "Placas",      v: order.vehicle_plates },
                { l: "Remolque",    v: order.trailer_plates },
                { l: "Recolección", v: fmtDate(order.pickup_date) },
                { l: "Dirección recolección", v: order.pickup_address },
                { l: "Entrega estimada",      v: fmtDate(order.delivery_date) },
              ].map((r) => r.v ? <View key={r.l}><Text style={s.lbl}>{r.l}</Text><Text style={s.val}>{r.v}</Text></View> : null)}
            </View>
          </View>

          {/* MERCANCÍA */}
          {items.length > 0 && (
            <View style={s.section}>
              <Text style={s.sTitle}>Descripción de la mercancía</Text>
              <View style={s.tHead}>
                <Text style={[s.tHTxt, { flex: 1 }]}>Descripción</Text>
                <Text style={[s.tHTxt, { width: "12%" }]}>Embalaje</Text>
                <Text style={[s.tHTxt, { width: "9%", textAlign: "right" }]}>Cant.</Text>
                <Text style={[s.tHTxt, { width: "8%", textAlign: "center" }]}>Unidad</Text>
                <Text style={[s.tHTxt, { width: "10%", textAlign: "right" }]}>Peso kg</Text>
                <Text style={[s.tHTxt, { width: "12%", textAlign: "right" }]}>Valor</Text>
              </View>
              {items.map((item, i) => (
                <View key={item.id} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cell, { fontWeight: "bold" }]}>{item.description}</Text>
                    {item.sat_product_code && <Text style={[s.cell, { color: MUTED, fontSize: 7 }]}>SAT: {item.sat_product_code}</Text>}
                  </View>
                  <Text style={[s.cell, { width: "12%", color: MUTED }]}>{item.packaging_type ?? "—"}</Text>
                  <Text style={[s.cell, { width: "9%", textAlign: "right" }]}>{item.quantity}</Text>
                  <Text style={[s.cell, { width: "8%", textAlign: "center", color: MUTED }]}>{item.unit}</Text>
                  <Text style={[s.cell, { width: "10%", textAlign: "right" }]}>{item.weight_kg}</Text>
                  <Text style={[s.cell, { width: "12%", textAlign: "right" }]}>
                    {item.commercial_value > 0 ? `${item.currency} ${item.commercial_value}` : "—"}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* INSTRUCCIONES */}
          {order.special_instructions && (
            <View style={s.instrBox}>
              <Text style={{ fontSize: 7.5, fontWeight: "bold", color: GOLD, marginBottom: 3 }}>INSTRUCCIONES ESPECIALES AL TRANSPORTISTA</Text>
              <Text style={{ fontSize: 8, color: WHITE, lineHeight: 1.5 }}>{order.special_instructions}</Text>
            </View>
          )}

          {/* FIRMAS */}
          <View style={{ flexDirection: "row", gap: 30, marginTop: 16 }}>
            {["Autoriza", "Transportista / Operador", "Recibido en destino"].map((label) => (
              <View key={label} style={s.firmBox}>
                <Text style={{ fontSize: 7, color: MUTED, textAlign: "center" }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.fTxt}>{issuerName}{settings?.fiscal_rfc ? ` · RFC: ${settings.fiscal_rfc}` : ""} · {settings?.fiscal_address ?? ""}</Text>
        </View>
      </Page>
    </Document>
  );
}
