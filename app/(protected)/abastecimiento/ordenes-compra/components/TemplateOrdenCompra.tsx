import {
  Document, Page, Text, View, StyleSheet, Image,
} from "@react-pdf/renderer";
import type { PurchaseOrder } from "../types/ordenes-compra.types";

type Props = { order: PurchaseOrder; settings?: any };

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 0.5;
}

export default function TemplateOrdenCompra({ order, settings }: Props) {
  const items = order.items ?? [];

  const HEADER_BG   = settings?.brand_color_dark ?? "#0a1628";
  const BRAND_COLOR = settings?.brand_color       ?? "#1d4ed8";
  const ACCENT      = settings?.brand_accent       ?? "#c9a227";

  const headerIsLight     = isLightColor(HEADER_BG);
  const HEADER_TEXT       = headerIsLight ? "#1a2332" : "#ffffff";
  const HEADER_TEXT_SUB   = headerIsLight ? "#334155" : "#e2e8f0";
  const HEADER_TEXT_MUTED = headerIsLight ? "#64748b" : "#cbd5e1";

  const brandIsLight = isLightColor(BRAND_COLOR);
  const BRAND_TEXT   = brandIsLight ? "#1a2332" : "#ffffff";
  const BRAND_MUTED  = brandIsLight ? "#475569" : "#cbd5e1";
  const BORDER_COLOR = brandIsLight ? "#94a3b8" : "#1e3a5f";

  const WHITE       = "#ffffff";
  const LIGHT       = "#f8fafc";
  const TEXT_DARK   = "#1a2332";
  const TEXT_MEDIUM = "#334155";
  const TEXT_MUTED  = "#64748b";

  const issuerName    = settings?.fiscal_name    ?? "Mi Empresa";
  const issuerRfc     = settings?.fiscal_rfc     ?? "";
  const issuerState   = settings?.fiscal_state   ?? "";
  const issuerCountry = settings?.fiscal_country ?? "";
  const issuerAddress = settings?.fiscal_address ?? "";
  const issuerPhone   = settings?.fiscal_phone   ?? "";
  const issuerEmail   = settings?.fiscal_email   ?? "";
  const issuerWebsite = settings?.fiscal_website ?? "";
  const logoUrl       = settings?.logo_url        ?? "";

  const issuerLocation = (issuerState && issuerCountry)
    ? (issuerState + ", " + issuerCountry)
    : (issuerState || issuerCountry || issuerAddress);

  const supplierName = order.supplier?.name   ?? "—";
  const supplierRfc  = order.supplier?.tax_id ?? "";
  const supplierCity = order.supplier?.city   ?? "";

  const locale = "es-MX";
  const fmt = (n: number) => Number(n ?? 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const footerText = issuerName
    + (issuerLocation ? ("  \u00B7  " + issuerLocation) : "")
    + (issuerRfc      ? ("  \u00B7  RFC: " + issuerRfc) : "")
    + (issuerPhone    ? ("  \u00B7  " + issuerPhone)    : "");

  const s = StyleSheet.create({
    page:         { backgroundColor: WHITE, fontSize: 9, color: TEXT_DARK, display: "flex", flexDirection: "column" },
    header:       { backgroundColor: HEADER_BG, padding: "24 36", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 },
    accentLine:   { backgroundColor: ACCENT, height: 3, flexShrink: 0 },
    logoBox:      { width: 110, height: 44, objectFit: "contain" },
    // body usa flex: 1 y flexDirection: column para que las firmas queden al fondo con marginTop: "auto"
    body:         { flex: 1, paddingTop: 20, paddingBottom: 20, paddingLeft: 36, paddingRight: 36, display: "flex", flexDirection: "column" },
    section:      { marginBottom: 16 },
    sectionTitle: { fontSize: 8, fontWeight: "bold", color: ACCENT, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 7, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: BRAND_COLOR },
    row2:         { flexDirection: "row", gap: 16 },
    col:          { flex: 1 },
    label:        { fontSize: 7.5, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.5 },
    value:        { fontSize: 9.5, color: TEXT_DARK, fontWeight: "bold" },
    valueSmall:   { fontSize: 8.5, color: TEXT_MEDIUM },
    muted:        { fontSize: 8, color: TEXT_MUTED },
    // fila de datos de la orden: label a la izq, valor flex:1 para que envuelva
    dataRow:      { flexDirection: "row", gap: 6, marginBottom: 5 },
    dataLabel:    { fontSize: 7.5, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.5, width: 62, flexShrink: 0 },
    dataValue:    { fontSize: 8.5, color: TEXT_MEDIUM, flex: 1 },
    tableHead:    { flexDirection: "row", backgroundColor: BRAND_COLOR, padding: "7 10", borderRadius: 3 },
    tableHeadTxt: { color: BRAND_TEXT, fontSize: 7.5, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 },
    tableRow:     { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "7 10" },
    tableRowAlt:  { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "7 10", backgroundColor: LIGHT },
    cell:         { fontSize: 8.5, color: TEXT_MEDIUM },
    cellBold:     { fontSize: 8.5, color: TEXT_DARK, fontWeight: "bold" },
    totalBox:     { backgroundColor: BRAND_COLOR, borderRadius: 6, padding: "14 18", marginTop: 8, alignSelf: "flex-end", minWidth: 240 },
    totalRow:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    totalLabel:   { fontSize: 8.5, color: BRAND_MUTED },
    totalValue:   { fontSize: 8.5, color: BRAND_TEXT },
    grandLabel:   { fontSize: 13, color: ACCENT, fontWeight: "bold" },
    grandValue:   { fontSize: 13, color: ACCENT, fontWeight: "bold" },
    notesBox:     { backgroundColor: "#f1f5f9", borderRadius: 4, padding: "12 16", marginTop: 4, borderLeftWidth: 3, borderLeftColor: BRAND_COLOR },
    notesText:    { fontSize: 8, color: TEXT_MEDIUM, lineHeight: 1.7 },
    // Firmas: marginTop: "auto" las empuja al fondo del body
    signaturesRow:{ marginTop: "auto", paddingTop: 28, flexDirection: "row", gap: 30 },
    footer:       { backgroundColor: BRAND_COLOR, padding: "12 36", flexShrink: 0 },
    footerMain:   { color: BRAND_TEXT, fontSize: 8, textAlign: "center", marginBottom: 3 },
    footerPowered:{ color: BRAND_MUTED, fontSize: 7, textAlign: "center" },
    footerDivider:{ height: 1, backgroundColor: BORDER_COLOR, marginBottom: 8 },
  });

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* HEADER */}
        <View style={s.header}>
          <View style={{ flexDirection: "column", gap: 3 }}>
            {logoUrl
              ? <Image src={logoUrl} style={s.logoBox} />
              : <Text style={{ fontSize: 20, fontWeight: "bold", color: HEADER_TEXT }}>{issuerName}</Text>
            }
            <Text style={{ fontSize: 12, fontWeight: "bold", color: ACCENT, marginTop: logoUrl ? 4 : 2 }}>{issuerName}</Text>
            {issuerRfc      ? <Text style={{ color: HEADER_TEXT_SUB,   fontSize: 7.5 }}>{"RFC: " + issuerRfc}</Text>      : null}
            {issuerLocation ? <Text style={{ color: HEADER_TEXT_MUTED, fontSize: 7.5 }}>{issuerLocation}</Text>           : null}
            {issuerPhone    ? <Text style={{ color: HEADER_TEXT_MUTED, fontSize: 7.5 }}>{"Tel: " + issuerPhone}</Text>    : null}
            {issuerEmail    ? <Text style={{ color: HEADER_TEXT_MUTED, fontSize: 7.5 }}>{issuerEmail}</Text>              : null}
            {issuerWebsite  ? <Text style={{ color: HEADER_TEXT_MUTED, fontSize: 7.5 }}>{issuerWebsite}</Text>            : null}
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Text style={{ fontSize: 8, color: ACCENT, textTransform: "uppercase", letterSpacing: 2 }}>
              {"Orden de Compra"}
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "bold", color: HEADER_TEXT, letterSpacing: 1 }}>
              {order.po_number}
            </Text>
            {order.expected_date ? (
              <View style={{ backgroundColor: BRAND_COLOR, borderRadius: 4, padding: "4 10", alignItems: "flex-end" }}>
                <Text style={{ color: BRAND_MUTED, fontSize: 7 }}>{"Entrega esperada"}</Text>
                <Text style={{ color: BRAND_TEXT, fontSize: 8, fontWeight: "bold" }}>
                  {new Date(order.expected_date).toLocaleDateString(locale)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={s.accentLine} />

        {/* BODY — flex column, firmas van al fondo con marginTop: auto */}
        <View style={s.body}>

          {/* PROVEEDOR + DATOS OC */}
          <View style={[s.section, s.row2]}>
            <View style={s.col}>
              <Text style={s.sectionTitle}>{"Proveedor"}</Text>
              <Text style={s.value}>{supplierName}</Text>
              {supplierRfc  ? <Text style={[s.muted, { marginTop: 3 }]}>{"RFC: " + supplierRfc}</Text> : null}
              {supplierCity ? <Text style={s.muted}>{supplierCity}</Text>                               : null}
            </View>

            <View style={s.col}>
              <Text style={s.sectionTitle}>{"Datos de la orden"}</Text>
              {/* Usando dataRow/dataLabel/dataValue para que el texto de dirección envuelva */}
              {[
                { l: "Fecha",      v: order.order_date ? new Date(order.order_date).toLocaleDateString(locale) : "—" },
                { l: "Moneda",     v: order.currency ?? "MXN" },
                ...(order.payment_terms  ? [{ l: "Pago",       v: order.payment_terms  }] : []),
                ...(order.delivery_terms ? [{ l: "Incoterm",   v: order.delivery_terms }] : []),
                ...(order.ship_to_address? [{ l: "Entregar en",v: order.ship_to_address}] : []),
              ].map((r, i) => (
                <View key={i} style={s.dataRow}>
                  <Text style={s.dataLabel}>{r.l}</Text>
                  <Text style={s.dataValue}>{r.v}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* TABLA ÍTEMS */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>{"Descripción de artículos"}</Text>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadTxt, { width: "40%" }]}>{"Descripción"}</Text>
              <Text style={[s.tableHeadTxt, { width: "12%", textAlign: "right" }]}>{"Cant."}</Text>
              <Text style={[s.tableHeadTxt, { width: "8%",  textAlign: "center" }]}>{"U."}</Text>
              <Text style={[s.tableHeadTxt, { width: "16%", textAlign: "right" }]}>{"P. Unit."}</Text>
              <Text style={[s.tableHeadTxt, { width: "8%",  textAlign: "center" }]}>{"Desc."}</Text>
              <Text style={[s.tableHeadTxt, { width: "16%", textAlign: "right" }]}>{"Subtotal"}</Text>
            </View>
            {items.map((item, i) => (
              <View key={item.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.cellBold, { width: "40%" }]}>{item.description}</Text>
                <Text style={[s.cell, { width: "12%", textAlign: "right" }]}>{String(item.quantity)}</Text>
                <Text style={[s.cell, { width: "8%",  textAlign: "center" }]}>{item.unit}</Text>
                <Text style={[s.cell, { width: "16%", textAlign: "right" }]}>{"$" + fmt(item.unit_price)}</Text>
                <Text style={[s.cell, { width: "8%",  textAlign: "center", color: (item.discount_pct ?? 0) > 0 ? ACCENT : TEXT_MUTED }]}>
                  {(item.discount_pct ?? 0) > 0 ? (String(item.discount_pct) + "%") : "—"}
                </Text>
                <Text style={[s.cellBold, { width: "16%", textAlign: "right" }]}>{"$" + fmt(item.subtotal)}</Text>
              </View>
            ))}
          </View>

          {/* TOTALES */}
          <View style={s.totalBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>{"Subtotal"}</Text>
              <Text style={s.totalValue}>{order.currency + " $" + fmt(order.subtotal)}</Text>
            </View>
            {(order.discount_amount ?? 0) > 0 ? (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>{"Descuento"}</Text>
                <Text style={[s.totalValue, { color: ACCENT }]}>{"- " + order.currency + " $" + fmt(order.discount_amount ?? 0)}</Text>
              </View>
            ) : null}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>{"IVA " + String(order.tax_rate ?? 16) + "%"}</Text>
              <Text style={s.totalValue}>{order.currency + " $" + fmt(order.tax_amount)}</Text>
            </View>
            <View style={[s.totalRow, { borderTopWidth: 1, borderTopColor: BORDER_COLOR, paddingTop: 7, marginTop: 4 }]}>
              <Text style={s.grandLabel}>{"TOTAL"}</Text>
              <Text style={s.grandValue}>{order.currency + " $" + fmt(order.total)}</Text>
            </View>
          </View>

          {/* NOTAS */}
          {order.notes ? (
            <View style={[s.section, { marginTop: 14 }]}>
              <Text style={s.sectionTitle}>{"Notas"}</Text>
              <View style={s.notesBox}>
                <Text style={s.notesText}>{order.notes}</Text>
              </View>
            </View>
          ) : null}

          {/* FIRMAS — marginTop: "auto" las empuja al fondo de la página */}
          <View style={s.signaturesRow}>
            {["Elaboró", "Autorizó", "Recibió"].map((label) => (
              <View key={label} style={{ flex: 1, alignItems: "center" }}>
                <View style={{ height: 1, backgroundColor: TEXT_MUTED, width: "100%", marginBottom: 5 }} />
                <Text style={{ fontSize: 8, color: TEXT_MUTED }}>{label}</Text>
              </View>
            ))}
          </View>

        </View>

        {/* FOOTER */}
        <View style={s.footer}>
          <View style={s.footerDivider} />
          <Text style={s.footerMain}>{footerText}</Text>
          <Text style={[s.footerPowered, { marginTop: 5 }]}>{"Powered by Mobility OS"}</Text>
        </View>

      </Page>
    </Document>
  );
}
