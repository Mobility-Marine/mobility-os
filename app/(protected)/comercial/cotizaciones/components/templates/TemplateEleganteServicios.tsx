import {
  Document, Page, Text, View, StyleSheet, Image,
} from "@react-pdf/renderer";
import type { Quotation, CompanySettings, QuotationBillingConcept } from "../../types/quotations.types";
import { SERVICE_TYPE_CONFIG } from "../../types/quotations.types";

type Props = { quotation: Quotation; settings?: CompanySettings | null };

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 0.5;
}

export default function TemplateEleganteServicios({ quotation, settings }: Props) {
  const billingConcepts = (quotation.billing_concepts ?? []) as QuotationBillingConcept[];
  const services        = quotation.services ?? [];

  // ── Colores de marca ──────────────────────────────────────
  const HEADER_BG   = (settings as any)?.brand_color_dark ?? "#0a1628";
  const BRAND_COLOR = (settings as any)?.brand_color       ?? "#1d4ed8";
  const ACCENT      = (settings as any)?.brand_accent       ?? "#c9a227";

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

  // ── Datos del emisor ──────────────────────────────────────
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

  const termsText = (quotation.terms && quotation.terms.trim())
    ? quotation.terms
    : ((settings as any)?.quote_terms_services ?? null);

  // ── Datos del cliente ─────────────────────────────────────
  const clientName    = quotation.client?.name  ?? quotation.client_name  ?? "—";
  const clientRfc     = quotation.client?.rfc   ?? quotation.client_rfc   ?? "";
  const clientEmail   = quotation.client?.email ?? quotation.client_email ?? "";
  const clientContact = (quotation as any)?.client_contact_name ?? null;

  const locale = "es-MX";
  const fmt    = (n: number) => Number(n ?? 0).toLocaleString(locale, {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });

  const footerText = issuerName
    + (issuerLocation ? ("  ·  " + issuerLocation)  : "")
    + (issuerRfc      ? ("  ·  RFC: " + issuerRfc)  : "")
    + (issuerPhone    ? ("  ·  " + issuerPhone)      : "");

  const s = StyleSheet.create({
    page:         { backgroundColor: WHITE, fontSize: 9, color: TEXT_DARK, display: "flex", flexDirection: "column" },
    header:       { backgroundColor: HEADER_BG, padding: "24 36", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 },
    accentLine:   { backgroundColor: ACCENT, height: 3, flexShrink: 0 },
    logoBox:      { width: 110, height: 44, objectFit: "contain" },
    body:         { flex: 1, paddingTop: 20, paddingBottom: 16, paddingLeft: 36, paddingRight: 36 },
    section:      { marginBottom: 16 },
    sectionTitle: { fontSize: 8, fontWeight: "bold", color: ACCENT, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 7, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: BRAND_COLOR },
    row2:         { flexDirection: "row", gap: 16 },
    col:          { flex: 1 },
    label:        { fontSize: 7.5, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
    value:        { fontSize: 9.5, color: TEXT_DARK, fontWeight: "bold" },
    valueSmall:   { fontSize: 8.5, color: TEXT_MEDIUM },
    muted:        { fontSize: 8, color: TEXT_MUTED },
    // ── Concepto de facturación (bloque principal) ──
    conceptBlock: { marginBottom: 12, borderRadius: 4, overflow: "hidden" },
    conceptHeader:{ backgroundColor: BRAND_COLOR, padding: "8 14", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    conceptName:  { fontSize: 10, fontWeight: "bold", color: BRAND_TEXT, flex: 1 },
    conceptTotal: { fontSize: 12, fontWeight: "bold", color: ACCENT },
    // ── Líneas de detalle ──
    linesContainer:{ backgroundColor: LIGHT, paddingLeft: 14, paddingRight: 14, paddingTop: 6, paddingBottom: 6 },
    lineRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 5, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
    lineBadge:    { backgroundColor: BRAND_COLOR + "30", borderRadius: 2, padding: "2 5", marginRight: 6, alignSelf: "flex-start" },
    lineBadgeTxt: { fontSize: 6.5, color: BRAND_COLOR, fontWeight: "bold", textTransform: "uppercase" },
    lineDesc:     { fontSize: 8.5, color: TEXT_DARK, fontWeight: "bold", flex: 1 },
    lineMeta:     { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 3 },
    lineMetaItem: { flexDirection: "row", gap: 3 },
    lineMetaLbl:  { fontSize: 7, color: TEXT_MUTED },
    lineMetaVal:  { fontSize: 7, color: TEXT_MEDIUM, fontWeight: "bold" },
    lineNotes:    { fontSize: 7, color: TEXT_MUTED, marginTop: 3, fontStyle: "italic" },
    linePrice:    { fontSize: 9, fontWeight: "bold", color: TEXT_DARK, textAlign: "right", minWidth: 70 },
    lineCurrency: { fontSize: 7, color: TEXT_MUTED, textAlign: "right" },
    // Totales
    totalBox:     { backgroundColor: BRAND_COLOR, borderRadius: 6, padding: "14 18", marginTop: 8, alignSelf: "flex-end", minWidth: 240 },
    totalRow:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    totalLabel:   { fontSize: 8.5, color: BRAND_MUTED },
    totalValue:   { fontSize: 8.5, color: BRAND_TEXT },
    grandLabel:   { fontSize: 13, color: ACCENT, fontWeight: "bold" },
    grandValue:   { fontSize: 13, color: ACCENT, fontWeight: "bold" },
    // Footer
    footer:       { backgroundColor: BRAND_COLOR, padding: "12 36", flexShrink: 0 },
    footerMain:   { color: BRAND_TEXT, fontSize: 8, textAlign: "center", marginBottom: 3 },
    footerPowered:{ color: BRAND_MUTED, fontSize: 7, textAlign: "center" },
    footerDivider:{ height: 1, backgroundColor: BORDER_COLOR, marginBottom: 8 },
    // Términos
    termsBody:    { flex: 1, paddingTop: 24, paddingBottom: 16, paddingLeft: 36, paddingRight: 36 },
    termsTitle:   { fontSize: 11, fontWeight: "bold", color: ACCENT, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12, paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: BRAND_COLOR },
    termsText:    { fontSize: 8, color: TEXT_MEDIUM, lineHeight: 1.8 },
  });

  const PageHeader = () => (
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
            Cotización de Servicios
          </Text>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: HEADER_TEXT, letterSpacing: 1 }}>
            {quotation.quote_number}
          </Text>
          {quotation.valid_until ? (
            <View style={{ backgroundColor: BRAND_COLOR, borderRadius: 4, padding: "4 10", alignItems: "flex-end" }}>
              <Text style={{ color: BRAND_MUTED, fontSize: 7 }}>Válida hasta</Text>
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

  const PageFooter = () => (
    <View style={s.footer}>
      <View style={s.footerDivider} />
      <Text style={s.footerMain}>{footerText}</Text>
      {quoteFooter ? <Text style={[s.footerMain, { marginTop: 3 }]}>{quoteFooter}</Text> : null}
      <Text style={[s.footerPowered, { marginTop: 5 }]}>Powered by Mobility OS</Text>
    </View>
  );

  // ── Determinar qué renderizar: conceptos agrupados o líneas legacy ──
  const hasConceptos = billingConcepts.length > 0;

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <PageHeader />
        <View style={s.body}>
          {/* CLIENTE + DATOS */}
          <View style={[s.section, s.row2]}>
            <View style={s.col}>
              <Text style={s.sectionTitle}>Cliente</Text>
              <Text style={s.value}>{clientName}</Text>
              {clientRfc    ? <Text style={[s.muted, { marginTop: 3 }]}>{"RFC: " + clientRfc}</Text> : null}
              {clientEmail  ? <Text style={s.muted}>{clientEmail}</Text> : null}
              {clientContact ? (
                <View style={{ marginTop: 6, flexDirection: "row", gap: 3 }}>
                  <Text style={[s.muted, { fontWeight: "bold" }]}>Atención a:</Text>
                  <Text style={s.muted}>{clientContact}</Text>
                </View>
              ) : null}
            </View>
            <View style={s.col}>
              <Text style={s.sectionTitle}>Datos de la cotización</Text>
              <View style={{ gap: 5 }}>
                {[
                  { l: "Fecha de emisión", v: new Date(quotation.created_at).toLocaleDateString(locale) },
                  { l: "Moneda base",      v: quotation.currency },
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

          {/* SERVICIOS — con conceptos agrupados o legacy */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Servicios incluidos</Text>

            {hasConceptos ? (
              // ── NUEVO: Conceptos agrupados con líneas de detalle ──
              billingConcepts.map((concept) => {
                const lines       = concept.lines ?? [];
                const conceptTotal = lines.reduce((sum, l) => sum + (l.price ?? 0), 0);
                const displayTotal = concept.total > 0 ? concept.total : conceptTotal;
                return (
                  <View key={concept.id} style={s.conceptBlock}>
                    {/* Header del concepto */}
                    <View style={s.conceptHeader}>
                      <Text style={s.conceptName}>{concept.description}</Text>
                      <Text style={s.conceptTotal}>
                        {concept.currency} ${fmt(displayTotal)}
                      </Text>
                    </View>
                    {/* Líneas de detalle */}
                    {lines.length > 0 && (
                      <View style={s.linesContainer}>
                        {lines.map((line, li) => {
                          const isLast = li === lines.length - 1;
                          return (
                            <View key={line.id ?? li} style={[s.lineRow, isLast ? { borderBottomWidth: 0 } : {}]}>
                              <View style={{ flex: 1, paddingRight: 10 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                                  <View style={s.lineBadge}>
                                    <Text style={s.lineBadgeTxt}>{line.service_type}</Text>
                                  </View>
                                  <Text style={s.lineDesc}>{line.description}</Text>
                                </View>
                                <View style={s.lineMeta}>
                                  {line.origin      ? <View style={s.lineMetaItem}><Text style={s.lineMetaLbl}>De: </Text><Text style={s.lineMetaVal}>{line.origin}</Text></View>       : null}
                                  {line.destination ? <View style={s.lineMetaItem}><Text style={s.lineMetaLbl}>A: </Text><Text style={s.lineMetaVal}>{line.destination}</Text></View>   : null}
                                  {line.incoterm    ? <View style={s.lineMetaItem}><Text style={s.lineMetaLbl}>Incoterm: </Text><Text style={s.lineMetaVal}>{line.incoterm}</Text></View> : null}
                                  {line.transit_time ? <View style={s.lineMetaItem}><Text style={s.lineMetaLbl}>Tránsito: </Text><Text style={s.lineMetaVal}>{line.transit_time}</Text></View> : null}
                                </View>
                                {line.notes ? <Text style={s.lineNotes}>{line.notes}</Text> : null}
                              </View>
                              <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
                                <Text style={s.linePrice}>${fmt(line.price ?? 0)}</Text>
                                <Text style={s.lineCurrency}>{line.currency ?? concept.currency}</Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              // ── LEGACY: Líneas sueltas (cotizaciones antiguas) ──
              services.map((svc) => (
                <View key={svc.id} style={{ backgroundColor: LIGHT, borderLeftWidth: 3, borderLeftColor: BRAND_COLOR, padding: "12 16", marginBottom: 8, borderRadius: 3 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <View style={{ backgroundColor: BRAND_COLOR, borderRadius: 3, padding: "3 8" }}>
                      <Text style={{ color: BRAND_TEXT, fontSize: 7.5, fontWeight: "bold", textTransform: "uppercase" }}>{svc.service_type}</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: ACCENT, fontWeight: "bold" }}>
                      {(svc.currency ?? quotation.currency) + " $" + fmt(svc.price)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 9.5, color: TEXT_DARK, fontWeight: "bold", marginBottom: 6 }}>{svc.description}</Text>
                  <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
                    {svc.origin      ? <View style={{ flexDirection: "row", gap: 4 }}><Text style={{ fontSize: 7.5, color: TEXT_MUTED }}>De:</Text><Text style={{ fontSize: 7.5, color: TEXT_DARK, fontWeight: "bold" }}>{svc.origin}</Text></View>      : null}
                    {svc.destination ? <View style={{ flexDirection: "row", gap: 4 }}><Text style={{ fontSize: 7.5, color: TEXT_MUTED }}>A:</Text><Text style={{ fontSize: 7.5, color: TEXT_DARK, fontWeight: "bold" }}>{svc.destination}</Text></View>  : null}
                    {svc.incoterm    ? <View style={{ flexDirection: "row", gap: 4 }}><Text style={{ fontSize: 7.5, color: TEXT_MUTED }}>Incoterm:</Text><Text style={{ fontSize: 7.5, color: TEXT_DARK, fontWeight: "bold" }}>{svc.incoterm}</Text></View> : null}
                    {svc.transit_time ? <View style={{ flexDirection: "row", gap: 4 }}><Text style={{ fontSize: 7.5, color: TEXT_MUTED }}>Tránsito:</Text><Text style={{ fontSize: 7.5, color: TEXT_DARK, fontWeight: "bold" }}>{svc.transit_time}</Text></View> : null}
                  </View>
                  {svc.notes ? <Text style={{ fontSize: 7.5, color: TEXT_MUTED, marginTop: 6, fontStyle: "italic" }}>{svc.notes}</Text> : null}
                </View>
              ))
            )}
          </View>

          {/* TOTALES */}
          <View style={s.totalBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>{quotation.currency + " $" + fmt(quotation.subtotal)}</Text>
            </View>
            {(quotation.discount_amount ?? 0) > 0 ? (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Descuento</Text>
                <Text style={[s.totalValue, { color: ACCENT }]}>{"- " + quotation.currency + " $" + fmt(quotation.discount_amount)}</Text>
              </View>
            ) : null}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>{"IVA " + String(quotation.tax_rate ?? 16) + "%"}</Text>
              <Text style={s.totalValue}>{quotation.currency + " $" + fmt(quotation.tax_amount)}</Text>
            </View>
            <View style={[s.totalRow, { borderTopWidth: 1, borderTopColor: BORDER_COLOR, paddingTop: 7, marginTop: 4 }]}>
              <Text style={s.grandLabel}>TOTAL</Text>
              <Text style={s.grandValue}>{quotation.currency + " $" + fmt(quotation.total)}</Text>
            </View>
          </View>

          {/* NOTAS */}
          {quotation.notes ? (
            <View style={[s.section, { marginTop: 16 }]}>
              <Text style={s.sectionTitle}>Notas</Text>
              <View style={{ backgroundColor: "#f1f5f9", borderRadius: 4, padding: "12 16", marginTop: 4, borderLeftWidth: 3, borderLeftColor: BRAND_COLOR }}>
                <Text style={{ fontSize: 8, color: TEXT_MEDIUM, lineHeight: 1.7 }}>{quotation.notes}</Text>
              </View>
            </View>
          ) : null}
        </View>
        <PageFooter />
      </Page>

      {/* PÁGINA TÉRMINOS */}
      {termsText ? (
        <Page size="LETTER" style={s.page}>
          <View style={s.termsBody}>
            <Text style={s.termsTitle}>Términos y condiciones</Text>
            <Text style={s.termsText}>{termsText}</Text>
          </View>
          <PageFooter />
        </Page>
      ) : null}
    </Document>
  );
}
