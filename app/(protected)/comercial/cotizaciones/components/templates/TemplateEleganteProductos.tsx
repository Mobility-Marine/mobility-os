import {
  Document, Page, Text, View, StyleSheet, Image,
} from "@react-pdf/renderer";
import type { Quotation, CompanySettings } from "../../types/quotations.types";

type Props = { quotation: Quotation; settings?: CompanySettings | null };

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 0.5;
}

export default function TemplateEleganteProductos({ quotation, settings }: Props) {
  const items = quotation.items ?? [];

  const HEADER_BG    = (settings as any)?.brand_color_dark ?? "#0a1628";
  const BRAND_COLOR  = (settings as any)?.brand_color       ?? "#1d4ed8";
  const ACCENT       = (settings as any)?.brand_accent       ?? "#c9a227";

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
  const issuerPhone   = (settings as any)?.fiscal_phone   ?? "";
  const issuerEmail   = (settings as any)?.fiscal_email   ?? "";
  const issuerWebsite = (settings as any)?.fiscal_website ?? "";
  const logoUrl       = settings?.logo_url        ?? "";
  const quoteFooter   = (settings as any)?.quote_footer   ?? "";

  const issuerLocation = (issuerState && issuerCountry)
    ? (issuerState + ", " + issuerCountry)
    : (issuerState || issuerCountry || issuerAddress);

  const termsText = quotation.terms
    ?? (settings as any)?.quote_terms_products
    ?? null;

  const clientName    = quotation.client?.name  ?? quotation.client_name  ?? "—";
  const clientRfc     = quotation.client?.rfc   ?? quotation.client_rfc   ?? "";
  const clientEmail   = quotation.client?.email ?? quotation.client_email ?? "";
  const clientContact = (quotation as any)?.client_contact_name ?? null;

  const locale = "es-MX";
  const fmt = (n: number) => Number(n ?? 0).toLocaleString(locale, {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });

  const footerText = issuerName
    + (issuerLocation ? ("  \u00B7  " + issuerLocation)  : "")
    + (issuerRfc      ? ("  \u00B7  RFC: " + issuerRfc)  : "")
    + (issuerPhone    ? ("  \u00B7  " + issuerPhone)     : "");

  const s = StyleSheet.create({
    page:         { backgroundColor: WHITE, fontSize: 9, color: TEXT_DARK },
    header:       { backgroundColor: HEADER_BG, padding: "24 36", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    logoBox:      { width: 110, height: 44, objectFit: "contain" },
    accentLine:   { backgroundColor: ACCENT, height: 3 },
    body:         { paddingTop: 20, paddingBottom: 20, paddingLeft: 36, paddingRight: 36 },
    section:      { marginBottom: 16 },
    sectionTitle: { fontSize: 8, fontWeight: "bold", color: ACCENT, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 7, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: BRAND_COLOR },
    row2:         { flexDirection: "row", gap: 16 },
    col:          { flex: 1 },
    label:        { fontSize: 7.5, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
    value:        { fontSize: 9.5, color: TEXT_DARK, fontWeight: "bold" },
    valueSmall:   { fontSize: 8.5, color: TEXT_MEDIUM },
    muted:        { fontSize: 8, color: TEXT_MUTED },
    tableHead:    { flexDirection: "row", backgroundColor: BRAND_COLOR, padding: "7 10", borderRadius: 3 },
    tableHeadTxt: { color: BRAND_TEXT, fontSize: 7.5, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 },
    tableRow:     { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "7 10" },
    tableRowAlt:  { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "7 10", backgroundColor: LIGHT },
    cell:         { fontSize: 8.5, color: TEXT_MEDIUM },
    cellBold:     { fontSize: 8.5, color: TEXT_DARK, fontWeight: "bold" },
    totalBox:     { backgroundColor: BRAND_COLOR, borderRadius: 6, padding: "14 18", marginTop: 8, alignSelf: "flex-end", minWidth: 230 },
    totalRow:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    totalLabel:   { fontSize: 8.5, color: BRAND_MUTED },
    totalValue:   { fontSize: 8.5, color: BRAND_TEXT },
    grandLabel:   { fontSize: 13, color: ACCENT, fontWeight: "bold" },
    grandValue:   { fontSize: 13, color: ACCENT, fontWeight: "bold" },
    notesBox:     { backgroundColor: "#f1f5f9", borderRadius: 4, padding: "12 16", marginTop: 4, borderLeftWidth: 3, borderLeftColor: BRAND_COLOR },
    notesText:    { fontSize: 8, color: TEXT_MEDIUM, lineHeight: 1.7 },
    footer:       { backgroundColor: BRAND_COLOR, padding: "12 36" },
    footerMain:   { color: BRAND_TEXT, fontSize: 8, textAlign: "center", marginBottom: 3 },
    footerPowered:{ color: BRAND_MUTED, fontSize: 7, textAlign: "center" },
    footerDivider:{ height: 1, backgroundColor: BORDER_COLOR, marginBottom: 8 },
    // Términos en página dedicada
    termsBody:    { paddingTop: 24, paddingBottom: 20, paddingLeft: 36, paddingRight: 36, flex: 1 },
    termsTitle:   { fontSize: 11, fontWeight: "bold", color: ACCENT, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12, paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: BRAND_COLOR },
    termsText:    { fontSize: 8, color: TEXT_MEDIUM, lineHeight: 1.8 },
  });

  // ── Componente reutilizable: Header ───────────────────────
  const Header = () => (
    <>
      <View style={s.header}>
        <View style={{ flexDirection: "column", gap: 3 }}>
          {logoUrl
            ? <Image src={logoUrl} style={s.logoBox} />
            : <Text style={{ fontSize: 20, fontWeight: "bold", color: HEADER_TEXT }}>{issuerName}</Text>
          }
          <Text style={{ fontSize: 12, fontWeight: "bold", color: ACCENT, marginTop: logoUrl ? 4 : 2 }}>
            {issuerName}
          </Text>
          {issuerRfc      ? <Text style={{ color: HEADER_TEXT_SUB,   fontSize: 7.5 }}>{"RFC: " + issuerRfc}</Text>      : null}
          {issuerLocation ? <Text style={{ color: HEADER_TEXT_MUTED, fontSize: 7.5 }}>{issuerLocation}</Text>           : null}
          {issuerPhone    ? <Text style={{ color: HEADER_TEXT_MUTED, fontSize: 7.5 }}>{"Tel: " + issuerPhone}</Text>    : null}
          {issuerEmail    ? <Text style={{ color: HEADER_TEXT_MUTED, fontSize: 7.5 }}>{issuerEmail}</Text>              : null}
          {issuerWebsite  ? <Text style={{ color: HEADER_TEXT_MUTED, fontSize: 7.5 }}>{issuerWebsite}</Text>            : null}
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={{ fontSize: 8, color: ACCENT, textTransform: "uppercase", letterSpacing: 2 }}>
            {"Cotización de Productos"}
          </Text>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: HEADER_TEXT, letterSpacing: 1 }}>
            {quotation.quote_number}
          </Text>
          {quotation.valid_until ? (
            <View style={{ backgroundColor: BRAND_COLOR, borderRadius: 4, padding: "4 10", alignItems: "flex-end" }}>
              <Text style={{ color: BRAND_MUTED, fontSize: 7 }}>{"Válida hasta"}</Text>
              <Text style={{ color: BRAND_TEXT, fontSize: 8, fontWeight: "bold" }}>
                {new Date(quotation.valid_until).toLocaleDateString(locale)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={s.accentLine} />
    </>
  );

  // ── Componente reutilizable: Footer ───────────────────────
  const Footer = () => (
    <View style={s.footer}>
      <View style={s.footerDivider} />
      <Text style={s.footerMain}>{footerText}</Text>
      {quoteFooter ? <Text style={[s.footerMain, { marginTop: 3 }]}>{quoteFooter}</Text> : null}
      <Text style={[s.footerPowered, { marginTop: 5 }]}>{"Powered by Mobility OS"}</Text>
    </View>
  );

  return (
    <Document>

      {/* ── PÁGINA 1+: Contenido principal ── */}
      <Page size="LETTER" style={s.page}>
        <Header />

        <View style={s.body}>
          {/* CLIENTE + DATOS */}
          <View style={[s.section, s.row2]}>
            <View style={s.col}>
              <Text style={s.sectionTitle}>{"Cliente"}</Text>
              <Text style={s.value}>{clientName}</Text>
              {clientRfc   ? <Text style={[s.muted, { marginTop: 3 }]}>{"RFC: " + clientRfc}</Text> : null}
              {clientEmail ? <Text style={s.muted}>{clientEmail}</Text> : null}
              {clientContact ? (
                <View style={{ marginTop: 6, flexDirection: "row", gap: 3 }}>
                  <Text style={[s.muted, { fontWeight: "bold" }]}>{"Atención a:"}</Text>
                  <Text style={s.muted}>{clientContact}</Text>
                </View>
              ) : null}
            </View>

            <View style={s.col}>
              <Text style={s.sectionTitle}>{"Datos de la cotización"}</Text>
              <View style={{ gap: 5 }}>
                {[
                  { l: "Fecha de emisión", v: new Date(quotation.created_at).toLocaleDateString(locale) },
                  { l: "Moneda",           v: quotation.currency },
                  ...(quotation.incoterm    ? [{ l: "Incoterm",  v: quotation.incoterm    }] : []),
                  ...(quotation.origin      ? [{ l: "Origen",    v: quotation.origin      }] : []),
                  ...(quotation.destination ? [{ l: "Destino",   v: quotation.destination }] : []),
                ].map((r) => (
                  <View key={r.l} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={s.label}>{r.l}</Text>
                    <Text style={s.valueSmall}>{r.v}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* TABLA */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>{"Descripción de productos"}</Text>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadTxt, { width: "8%" }]}>{"SKU"}</Text>
              <Text style={[s.tableHeadTxt, { width: "36%" }]}>{"Descripción"}</Text>
              <Text style={[s.tableHeadTxt, { width: "10%", textAlign: "right" }]}>{"Cant."}</Text>
              <Text style={[s.tableHeadTxt, { width: "8%",  textAlign: "center" }]}>{"U."}</Text>
              <Text style={[s.tableHeadTxt, { width: "16%", textAlign: "right" }]}>{"P. Unit."}</Text>
              <Text style={[s.tableHeadTxt, { width: "8%",  textAlign: "center" }]}>{"Desc."}</Text>
              <Text style={[s.tableHeadTxt, { width: "14%", textAlign: "right" }]}>{"Subtotal"}</Text>
            </View>
            {items.map((item, i) => (
              <View key={item.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.cell, { width: "8%" }]}>{item.sku ?? "—"}</Text>
                <View style={{ width: "36%" }}>
                  <Text style={s.cellBold}>{item.description}</Text>
                  {item.details ? <Text style={[s.cell, { fontSize: 7.5 }]}>{item.details}</Text> : null}
                </View>
                <Text style={[s.cell, { width: "10%", textAlign: "right" }]}>{String(item.quantity)}</Text>
                <Text style={[s.cell, { width: "8%",  textAlign: "center" }]}>{item.unit}</Text>
                <Text style={[s.cell, { width: "16%", textAlign: "right" }]}>{"$" + fmt(item.unit_price)}</Text>
                <Text style={[s.cell, { width: "8%", textAlign: "center", color: item.discount_pct > 0 ? ACCENT : TEXT_MUTED }]}>
                  {item.discount_pct > 0 ? (String(item.discount_pct) + "%") : "—"}
                </Text>
                <Text style={[s.cellBold, { width: "14%", textAlign: "right" }]}>{"$" + fmt(item.subtotal)}</Text>
              </View>
            ))}
          </View>

          {/* TOTALES */}
          <View style={s.totalBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>{"Subtotal"}</Text>
              <Text style={s.totalValue}>{quotation.currency + " $" + fmt(quotation.subtotal)}</Text>
            </View>
            {(quotation.discount_amount ?? 0) > 0 ? (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>{"Descuento"}</Text>
                <Text style={[s.totalValue, { color: ACCENT }]}>{"- " + quotation.currency + " $" + fmt(quotation.discount_amount)}</Text>
              </View>
            ) : null}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>{"IVA " + String(quotation.tax_rate ?? 16) + "%"}</Text>
              <Text style={s.totalValue}>{quotation.currency + " $" + fmt(quotation.tax_amount)}</Text>
            </View>
            <View style={[s.totalRow, { borderTopWidth: 1, borderTopColor: BORDER_COLOR, paddingTop: 7, marginTop: 4 }]}>
              <Text style={s.grandLabel}>{"TOTAL"}</Text>
              <Text style={s.grandValue}>{quotation.currency + " $" + fmt(quotation.total)}</Text>
            </View>
          </View>

          {/* NOTAS */}
          {quotation.notes ? (
            <View style={[s.section, { marginTop: 16 }]}>
              <Text style={s.sectionTitle}>{"Notas"}</Text>
              <View style={s.notesBox}>
                <Text style={s.notesText}>{quotation.notes}</Text>
              </View>
            </View>
          ) : null}
        </View>

        <Footer />
      </Page>

      {/* ── PÁGINA EXCLUSIVA: Términos y condiciones ── */}
      {termsText ? (
        <Page size="LETTER" style={s.page}>
          <Header />

          <View style={s.termsBody}>
            <Text style={s.termsTitle}>{"Términos y condiciones"}</Text>
            <Text style={s.termsText}>{termsText}</Text>
          </View>

          <Footer />
        </Page>
      ) : null}

    </Document>
  );
}
