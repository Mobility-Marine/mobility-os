import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { CompanySettings } from "../../../types/quotations.types";
import type { PDFLang } from "./pdfTranslations";
import { tx } from "./pdfTranslations";

export function isLightColor(hex: string): boolean {
  const h = (hex ?? "#000000").replace("#", "").padEnd(6, "0");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 0.5;
}

export function getBrandColors(settings?: CompanySettings | null) {
  const HEADER_BG    = (settings as any)?.brand_color_dark ?? "#0a1628";
  const BRAND_COLOR  = (settings as any)?.brand_color       ?? "#1d4ed8";
  const ACCENT       = (settings as any)?.brand_accent       ?? "#c9a227";
  const headerLight  = isLightColor(HEADER_BG);
  const brandLight   = isLightColor(BRAND_COLOR);
  return {
    HEADER_BG,
    BRAND_COLOR,
    ACCENT,
    HEADER_TEXT:       headerLight ? "#1a2332" : "#ffffff",
    HEADER_TEXT_SUB:   headerLight ? "#334155" : "#e2e8f0",
    HEADER_TEXT_MUTED: headerLight ? "#64748b" : "#cbd5e1",
    BRAND_TEXT:        brandLight  ? "#1a2332" : "#ffffff",
    BRAND_MUTED:       brandLight  ? "#475569" : "#cbd5e1",
    BORDER_COLOR:      brandLight  ? "#94a3b8" : "#1e3a5f",
    WHITE:  "#ffffff",
    LIGHT:  "#f8fafc",
    TEXT_DARK:   "#1a2332",
    TEXT_MEDIUM: "#334155",
    TEXT_MUTED:  "#64748b",
  };
}

export function PDFHeader({
  quotation, settings, lang, subtitle,
}: {
  quotation: any;
  settings?: CompanySettings | null;
  lang: PDFLang;
  subtitle?: string;
}) {
  const c        = getBrandColors(settings);
  const logoUrl  = settings?.logo_url        ?? "";
  const issuerName = settings?.fiscal_name   ?? "Mi Empresa";
  const issuerRfc  = settings?.fiscal_rfc    ?? "";
  const issuerState   = settings?.fiscal_state   ?? "";
  const issuerCountry = settings?.fiscal_country ?? "";
  const issuerAddress = settings?.fiscal_address ?? "";
  const issuerPhone   = (settings as any)?.fiscal_phone   ?? "";
  const issuerEmail   = (settings as any)?.fiscal_email   ?? "";
  const issuerWebsite = (settings as any)?.fiscal_website ?? "";
  const issuerLocation = (issuerState && issuerCountry)
    ? `${issuerState}, ${issuerCountry}`
    : issuerState || issuerCountry || issuerAddress;

  return (
    <>
      <View style={{ backgroundColor: c.HEADER_BG, padding: "24 36", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flexDirection: "column", gap: 3 }}>
          {logoUrl
            ? <Image src={logoUrl} style={{ width: 110, height: 44, objectFit: "contain" }} />
            : <Text style={{ fontSize: 20, fontWeight: "bold", color: c.HEADER_TEXT }}>{issuerName}</Text>
          }
          <Text style={{ fontSize: 12, fontWeight: "bold", color: c.ACCENT, marginTop: logoUrl ? 4 : 2 }}>{issuerName}</Text>
          {issuerRfc      && <Text style={{ color: c.HEADER_TEXT_SUB,   fontSize: 7.5 }}>RFC: {issuerRfc}</Text>}
          {issuerLocation && <Text style={{ color: c.HEADER_TEXT_MUTED, fontSize: 7.5 }}>{issuerLocation}</Text>}
          {issuerPhone    && <Text style={{ color: c.HEADER_TEXT_MUTED, fontSize: 7.5 }}>Tel: {issuerPhone}</Text>}
          {issuerEmail    && <Text style={{ color: c.HEADER_TEXT_MUTED, fontSize: 7.5 }}>{issuerEmail}</Text>}
          {issuerWebsite  && <Text style={{ color: c.HEADER_TEXT_MUTED, fontSize: 7.5 }}>{issuerWebsite}</Text>}
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={{ fontSize: 8, color: c.ACCENT, textTransform: "uppercase", letterSpacing: 2 }}>
            {subtitle ?? tx(lang, "quotation")}
          </Text>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: c.HEADER_TEXT, letterSpacing: 1 }}>
            {quotation.quote_number}
          </Text>
          {quotation.valid_until && (
            <View style={{ backgroundColor: c.BRAND_COLOR, borderRadius: 4, padding: "4 10", alignItems: "flex-end" }}>
              <Text style={{ color: c.BRAND_MUTED, fontSize: 7 }}>{tx(lang, "validUntil")}</Text>
              <Text style={{ color: c.BRAND_TEXT, fontSize: 8, fontWeight: "bold" }}>
                {new Date(quotation.valid_until).toLocaleDateString(lang === "en" ? "en-US" : "es-MX")}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={{ backgroundColor: c.ACCENT, height: 3 }} />
    </>
  );
}

export function PDFFooter({
  settings, lang,
}: {
  settings?: CompanySettings | null;
  lang: PDFLang;
}) {
  const c          = getBrandColors(settings);
  const issuerName = settings?.fiscal_name ?? "Mi Empresa";
  const issuerRfc  = settings?.fiscal_rfc  ?? "";
  const issuerState   = settings?.fiscal_state   ?? "";
  const issuerCountry = settings?.fiscal_country ?? "";
  const issuerPhone   = (settings as any)?.fiscal_phone ?? "";
  const quoteFooter   = (settings as any)?.quote_footer ?? "";
  const issuerLocation = (issuerState && issuerCountry)
    ? `${issuerState}, ${issuerCountry}`
    : issuerState || issuerCountry;
  const footerText = [
    issuerName,
    issuerLocation  && `  ·  ${issuerLocation}`,
    issuerRfc       && `  ·  RFC: ${issuerRfc}`,
    issuerPhone     && `  ·  ${issuerPhone}`,
  ].filter(Boolean).join("");

  return (
    <View style={{ backgroundColor: c.BRAND_COLOR, padding: "12 36", flexShrink: 0 }}>
      <View style={{ height: 1, backgroundColor: c.BORDER_COLOR, marginBottom: 8 }} />
      <Text style={{ color: c.BRAND_TEXT, fontSize: 8, textAlign: "center", marginBottom: 3 }}>{footerText}</Text>
      {quoteFooter && <Text style={{ color: c.BRAND_TEXT, fontSize: 8, textAlign: "center", marginBottom: 3 }}>{quoteFooter}</Text>}
      <Text style={{ color: c.BRAND_MUTED, fontSize: 7, textAlign: "center", marginTop: 5 }}>{tx(lang, "poweredBy")}</Text>
    </View>
  );
}

export function PDFClientBlock({
  quotation, lang, settings,
}: {
  quotation: any;
  lang: PDFLang;
  settings?: CompanySettings | null;
}) {
  const c           = getBrandColors(settings);
  const clientName  = quotation.client?.name  ?? quotation.client_name  ?? "—";
  const clientRfc   = quotation.client?.rfc   ?? quotation.client_rfc   ?? "";
  const clientEmail = quotation.client?.email ?? quotation.client_email ?? "";
  const contactName = quotation.contact_name  ?? quotation.client_contact_name ?? null;
  const locale      = lang === "en" ? "en-US" : "es-MX";

  return (
    <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 8, fontWeight: "bold", color: c.ACCENT, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 7, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: c.BRAND_COLOR }}>
          {tx(lang, "client")}
        </Text>
        <Text style={{ fontSize: 9.5, fontWeight: "bold", color: c.TEXT_DARK }}>{clientName}</Text>
        {clientRfc   && <Text style={{ fontSize: 8, color: c.TEXT_MUTED, marginTop: 3 }}>{tx(lang, "taxId")}: {clientRfc}</Text>}
        {clientEmail && <Text style={{ fontSize: 8, color: c.TEXT_MUTED }}>{clientEmail}</Text>}
        {contactName && (
          <View style={{ marginTop: 6, flexDirection: "row", gap: 3 }}>
            <Text style={{ fontSize: 8, color: c.TEXT_MUTED, fontWeight: "bold" }}>{tx(lang, "attention")}:</Text>
            <Text style={{ fontSize: 8, color: c.TEXT_MUTED }}>{contactName}</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 8, fontWeight: "bold", color: c.ACCENT, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 7, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: c.BRAND_COLOR }}>
          {tx(lang, "quoteData")}
        </Text>
        <View style={{ gap: 5 }}>
          {[
            { l: tx(lang, "issueDate"), v: new Date(quotation.created_at).toLocaleDateString(locale) },
            { l: tx(lang, "baseCurrency"), v: quotation.currency },
            ...(quotation.incoterm    ? [{ l: tx(lang, "incoterm"),    v: quotation.incoterm    }] : []),
            ...(quotation.origin      ? [{ l: tx(lang, "origin"),      v: quotation.origin      }] : []),
            ...(quotation.destination ? [{ l: tx(lang, "destination"), v: quotation.destination }] : []),
          ].map((r) => (
            <View key={r.l} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 7.5, color: c.TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.5 }}>{r.l}</Text>
              <Text style={{ fontSize: 8.5, color: c.TEXT_MEDIUM }}>{r.v}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export function PDFTotalsBlock({
  quotation, lang, settings, allLines,
}: {
  quotation: any;
  lang: PDFLang;
  settings?: CompanySettings | null;
  allLines: any[];
}) {
  const c      = getBrandColors(settings);
  const locale = lang === "en" ? "en-US" : "es-MX";
  const fmt    = (n: number) => Number(n ?? 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Agrupar por moneda
  const byCurrency: Record<string, { subtotal: number; tax: number; total: number }> = {};
  for (const line of allLines) {
    const cur    = line.currency ?? quotation.currency ?? "MXN";
    const price  = Number(line.price ?? 0);
    const rate   = line.tax_rate;
    const taxAmt = (rate === -1 || rate === 0) ? 0 : price * ((rate ?? 16) / 100);
    if (!byCurrency[cur]) byCurrency[cur] = { subtotal: 0, tax: 0, total: 0 };
    byCurrency[cur].subtotal += price;
    byCurrency[cur].tax      += taxAmt;
    byCurrency[cur].total    += price + taxAmt;
  }

  const currencies  = Object.keys(byCurrency);
  const multiCurr   = currencies.length > 1;

  return (
    <View style={{ alignSelf: "flex-end", gap: 8, marginTop: 8 }}>
      {currencies.map((cur) => {
        const ct = byCurrency[cur];
        return (
          <View key={cur} style={{ backgroundColor: c.BRAND_COLOR, borderRadius: 6, padding: "14 18", minWidth: 220 }}>
            {multiCurr && (
              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 }}>
                <Text style={{ fontSize: 9, color: c.ACCENT, fontWeight: "bold" }}>{cur}</Text>
              </View>
            )}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
              <Text style={{ fontSize: 8.5, color: c.BRAND_MUTED }}>{tx(lang, "subtotal")}</Text>
              <Text style={{ fontSize: 8.5, color: c.BRAND_TEXT }}>{cur} ${fmt(ct.subtotal)}</Text>
            </View>
            {(quotation.discount_amount ?? 0) > 0 && cur === (quotation.currency ?? "MXN") && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
                <Text style={{ fontSize: 8.5, color: c.BRAND_MUTED }}>{tx(lang, "discount")}</Text>
                <Text style={{ fontSize: 8.5, color: c.ACCENT }}>- {cur} ${fmt(quotation.discount_amount ?? 0)}</Text>
              </View>
            )}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
              <Text style={{ fontSize: 8.5, color: c.BRAND_MUTED }}>{tx(lang, "tax")}</Text>
              <Text style={{ fontSize: 8.5, color: c.BRAND_TEXT }}>{cur} ${fmt(ct.tax)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: c.BORDER_COLOR, paddingTop: 7, marginTop: 4 }}>
              <Text style={{ fontSize: 13, color: c.ACCENT, fontWeight: "bold" }}>{tx(lang, "total")}</Text>
              <Text style={{ fontSize: 13, color: c.ACCENT, fontWeight: "bold" }}>{cur} ${fmt(ct.total)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function PDFNotesAndTerms({
  quotation, lang, settings,
}: {
  quotation: any;
  lang: PDFLang;
  settings?: CompanySettings | null;
}) {
  const c          = getBrandColors(settings);
  const termsText  = (quotation.terms && quotation.terms.trim())
    ? quotation.terms
    : ((settings as any)?.quote_terms_services ?? null);

  return (
    <>
      {quotation.notes && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 8, fontWeight: "bold", color: c.ACCENT, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 7, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: c.BRAND_COLOR }}>
            {tx(lang, "notes")}
          </Text>
          <View style={{ backgroundColor: "#f1f5f9", borderRadius: 4, padding: "12 16", borderLeftWidth: 3, borderLeftColor: c.BRAND_COLOR }}>
            <Text style={{ fontSize: 8, color: c.TEXT_MEDIUM, lineHeight: 1.7 }}>{quotation.notes}</Text>
          </View>
        </View>
      )}
      {termsText && { termsText }}
    </>
  );
}

export function PDFTermsPage({
  quotation, lang, settings,
}: {
  quotation: any;
  lang: PDFLang;
  settings?: CompanySettings | null;
}) {
  const c         = getBrandColors(settings);
  const termsText = (quotation.terms && quotation.terms.trim())
    ? quotation.terms
    : ((settings as any)?.quote_terms_services ?? null);
  if (!termsText) return null;
  return (
    <View style={{ flex: 1, paddingTop: 24, paddingBottom: 16, paddingLeft: 36, paddingRight: 36 }}>
      <Text style={{ fontSize: 11, fontWeight: "bold", color: c.ACCENT, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12, paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: c.BRAND_COLOR }}>
        {tx(lang, "terms")}
      </Text>
      <Text style={{ fontSize: 8, color: c.TEXT_MEDIUM, lineHeight: 1.8 }}>{termsText}</Text>
    </View>
  );
}

export function PDFInfoRow({ label, value, c }: { label: string; value: string; c: any }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
      <Text style={{ fontSize: 7.5, color: c.TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ fontSize: 8.5, color: c.TEXT_DARK, fontWeight: "bold" }}>{value}</Text>
    </View>
  );
}

export function PDFSectionTitle({ title, c }: { title: string; c: any }) {
  return (
    <Text style={{ fontSize: 8, fontWeight: "bold", color: c.ACCENT, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 7, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: c.BRAND_COLOR, marginTop: 12 }}>
      {title}
    </Text>
  );
}
