import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Order, OrderItem } from "../../types/orders.types";

type Props = { order: Order; settings: any };

const fmt = (n: number, cur = "MXN") =>
  `${cur} $${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function POMobilityOS({ order, settings }: Props) {
  const dark    = settings?.brand_color_dark ?? "#0f172a";
  const mid     = settings?.brand_color      ?? "#1e3a5f";
  const accent  = settings?.brand_accent     ?? "#3b82f6";
  const logoUrl = settings?.logo_url         ?? null;

  const items   = order.items ?? [];
  const client  = order.client;

  const styles = StyleSheet.create({
    page:       { fontFamily: "Helvetica", fontSize: 9, color: "#1e293b", backgroundColor: "#fff", padding: 0 },
    header:     { backgroundColor: dark, paddingHorizontal: 32, paddingTop: 28, paddingBottom: 20 },
    logoRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
    logoBox:    { width: 100, height: 36, justifyContent: "center" },
    logoText:   { color: "#fff", fontSize: 16, fontFamily: "Helvetica-Bold" },
    docTitle:   { color: "#ffffff99", fontSize: 9, marginBottom: 2 },
    docNum:     { color: "#fff", fontSize: 20, fontFamily: "Helvetica-Bold" },
    docDate:    { color: "#ffffff80", fontSize: 8, marginTop: 2 },
    infoRow:    { flexDirection: "row", gap: 12 },
    infoBox:    { flex: 1, backgroundColor: "#ffffff15", borderRadius: 6, padding: 10 },
    infoLabel:  { color: "#ffffff60", fontSize: 7, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
    infoValue:  { color: "#fff", fontSize: 9, fontFamily: "Helvetica-Bold" },
    infoSub:    { color: "#ffffff80", fontSize: 8, marginTop: 1 },
    body:       { paddingHorizontal: 32, paddingTop: 20 },
    sectionTitle:{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
    table:      { borderRadius: 6, overflow: "hidden", borderWidth: 1, borderColor: "#e2e8f0" },
    thead:      { flexDirection: "row", backgroundColor: mid, paddingVertical: 7, paddingHorizontal: 10 },
    th:         { color: "#fff", fontSize: 7, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5 },
    trow:       { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
    trowAlt:    { backgroundColor: "#f8fafc" },
    td:         { fontSize: 8.5, color: "#1e293b" },
    tdMuted:    { fontSize: 7.5, color: "#64748b", marginTop: 1 },
    totalsBox:  { marginTop: 16, alignSelf: "flex-end", width: 240 },
    totRow:     { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, paddingHorizontal: 10 },
    totLabel:   { fontSize: 8.5, color: "#64748b" },
    totValue:   { fontSize: 8.5, color: "#1e293b", fontFamily: "Helvetica-Bold" },
    totalFinal: { flexDirection: "row", justifyContent: "space-between", backgroundColor: accent, borderRadius: 6, paddingVertical: 9, paddingHorizontal: 10, marginTop: 4 },
    totalLabel: { fontSize: 10, color: "#fff", fontFamily: "Helvetica-Bold" },
    totalValue: { fontSize: 12, color: "#fff", fontFamily: "Helvetica-Bold" },
    delivBox:   { marginTop: 16, backgroundColor: "#f8fafc", borderRadius: 6, padding: 12, borderWidth: 1, borderColor: "#e2e8f0" },
    delivRow:   { flexDirection: "row", marginBottom: 4 },
    delivLbl:   { width: 80, fontSize: 7.5, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.3 },
    delivVal:   { flex: 1, fontSize: 8.5, color: "#1e293b", fontFamily: "Helvetica-Bold" },
    footer:     { marginTop: "auto", backgroundColor: dark, paddingHorizontal: 32, paddingVertical: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    footerText: { color: "#ffffff60", fontSize: 7 },
    footerBold: { color: "#fff", fontSize: 8, fontFamily: "Helvetica-Bold" },
    badge:      { backgroundColor: accent, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    badgeText:  { color: "#fff", fontSize: 7, fontFamily: "Helvetica-Bold" },
    statusRow:  { flexDirection: "row", alignItems: "center", gap: 6 },
  });

  const STATUS_LABELS: Record<string, string> = {
    pending: "Pendiente", confirmed: "Confirmado", in_preparation: "En preparación",
    shipped: "Enviado", delivered: "Entregado", cancelled: "Cancelado",
  };

  return (
    <Document title={order.order_number} author="Mobility OS">
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            {logoUrl ? (
              <Image src={logoUrl} style={styles.logoBox} />
            ) : (
              <Text style={styles.logoText}>Mobility OS</Text>
            )}
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.docTitle}>ORDEN DE PEDIDO</Text>
              <Text style={styles.docNum}>{order.order_number}</Text>
              <Text style={styles.docDate}>
                {new Date(order.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}
              </Text>
              <View style={[styles.badge, { marginTop: 6 }]}>
                <Text style={styles.badgeText}>{STATUS_LABELS[order.status] ?? order.status}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            {/* Cliente */}
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Cliente</Text>
              <Text style={styles.infoValue}>{client?.name ?? "—"}</Text>
              {client?.rfc   && <Text style={styles.infoSub}>RFC: {client.rfc}</Text>}
              {client?.email && <Text style={styles.infoSub}>{client.email}</Text>}
            </View>
            {/* Cotización origen */}
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Referencia</Text>
              <Text style={styles.infoValue}>{order.quotation?.quote_number ?? "—"}</Text>
              <Text style={styles.infoSub}>Moneda: {order.currency}</Text>
              {order.delivery_date && (
                <Text style={styles.infoSub}>
                  Entrega: {new Date(order.delivery_date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* BODY */}
        <View style={styles.body}>

          {/* TABLA DE PRODUCTOS */}
          <Text style={styles.sectionTitle}>Productos</Text>
          <View style={styles.table}>
            <View style={styles.thead}>
              <Text style={[styles.th, { width: 55 }]}>SKU</Text>
              <Text style={[styles.th, { flex: 1 }]}>Descripción</Text>
              <Text style={[styles.th, { width: 40, textAlign: "center" }]}>Cant.</Text>
              <Text style={[styles.th, { width: 45, textAlign: "center" }]}>Unidad</Text>
              <Text style={[styles.th, { width: 65, textAlign: "right" }]}>P. Unit.</Text>
              <Text style={[styles.th, { width: 55, textAlign: "center" }]}>Desc.</Text>
              <Text style={[styles.th, { width: 70, textAlign: "right" }]}>Subtotal</Text>
            </View>

            {items.length === 0 ? (
              <View style={styles.trow}>
                <Text style={[styles.td, { flex: 1, color: "#94a3b8", fontStyle: "italic" }]}>Sin productos</Text>
              </View>
            ) : items.map((item, i) => {
              const disc = 1 - (item.discount_pct ?? 0) / 100;
              const sub  = item.quantity * item.unit_price * disc;
              return (
                <View key={item.id} style={[styles.trow, i % 2 === 1 ? styles.trowAlt : {}]}>
                  <Text style={[styles.td, { width: 55, color: "#64748b", fontFamily: "Helvetica-Oblique" }]}>
                    {item.sku ?? "—"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.td}>{item.description}</Text>
                    {item.details && <Text style={styles.tdMuted}>{item.details}</Text>}
                  </View>
                  <Text style={[styles.td, { width: 40, textAlign: "center" }]}>{item.quantity}</Text>
                  <Text style={[styles.td, { width: 45, textAlign: "center", color: "#64748b" }]}>{item.unit}</Text>
                  <Text style={[styles.td, { width: 65, textAlign: "right" }]}>
                    ${Number(item.unit_price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={[styles.td, { width: 55, textAlign: "center", color: item.discount_pct > 0 ? "#10b981" : "#cbd5e1" }]}>
                    {item.discount_pct > 0 ? `-${item.discount_pct}%` : "—"}
                  </Text>
                  <Text style={[styles.td, { width: 70, textAlign: "right", fontFamily: "Helvetica-Bold", color: "#0f172a" }]}>
                    ${sub.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* TOTALES */}
          <View style={styles.totalsBox}>
            <View style={[styles.totRow, { borderTopWidth: 1, borderTopColor: "#e2e8f0" }]}>
              <Text style={styles.totLabel}>Subtotal</Text>
              <Text style={styles.totValue}>{fmt(order.subtotal, order.currency)}</Text>
            </View>
            {order.discount_amount > 0 && (
              <View style={styles.totRow}>
                <Text style={[styles.totLabel, { color: "#f59e0b" }]}>Descuento</Text>
                <Text style={[styles.totValue, { color: "#f59e0b" }]}>- {fmt(order.discount_amount, order.currency)}</Text>
              </View>
            )}
            <View style={styles.totRow}>
              <Text style={styles.totLabel}>IVA {order.tax_rate}%</Text>
              <Text style={styles.totValue}>{fmt(order.tax_amount, order.currency)}</Text>
            </View>
            <View style={styles.totalFinal}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>{fmt(order.total, order.currency)}</Text>
            </View>
          </View>

          {/* DATOS DE ENTREGA */}
          {(order.delivery_date || order.delivery_address || (order as any).delivery_notes) && (
            <View style={styles.delivBox}>
              <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Datos de entrega</Text>
              {order.delivery_date && (
                <View style={styles.delivRow}>
                  <Text style={styles.delivLbl}>Fecha</Text>
                  <Text style={styles.delivVal}>
                    {new Date(order.delivery_date).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}
                  </Text>
                </View>
              )}
              {order.delivery_address && (
                <View style={styles.delivRow}>
                  <Text style={styles.delivLbl}>Dirección</Text>
                  <Text style={styles.delivVal}>
                    {[order.delivery_address, order.delivery_city, order.delivery_state].filter(Boolean).join(", ")}
                  </Text>
                </View>
              )}
              {(order as any).delivery_notes && (
                <View style={styles.delivRow}>
                  <Text style={styles.delivLbl}>Notas</Text>
                  <Text style={[styles.delivVal, { fontFamily: "Helvetica", color: "#64748b" }]}>{(order as any).delivery_notes}</Text>
                </View>
              )}
            </View>
          )}

          {/* NOTAS */}
          {order.notes && (
            <View style={{ marginTop: 12, padding: 10, backgroundColor: "#fffbeb", borderRadius: 6, borderWidth: 1, borderColor: "#fde68a" }}>
              <Text style={[styles.sectionTitle, { color: "#92400e", marginBottom: 4 }]}>Notas</Text>
              <Text style={{ fontSize: 8.5, color: "#78350f", lineHeight: 1.5 }}>{order.notes}</Text>
            </View>
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generado por Mobility OS · {new Date().toLocaleDateString("es-MX")}</Text>
          <Text style={styles.footerBold}>{order.order_number}</Text>
          <Text style={styles.footerText}>www.mobility-os.lat</Text>
        </View>
      </Page>
    </Document>
  );
}
