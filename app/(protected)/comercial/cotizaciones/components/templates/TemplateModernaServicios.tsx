import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Quotation, CompanySettings } from "../../types/quotations.types";

const BLUE   = "#2563eb";
const CYAN   = "#0891b2";
const DARK   = "#0f172a";
const MID    = "#475569";
const LIGHT  = "#f0f9ff";
const WHITE  = "#ffffff";
const BORDER = "#e2e8f0";

const s = StyleSheet.create({
  page:     { backgroundColor: WHITE, fontSize: 9, color: DARK },
  topBar:   { height: 4, flexDirection: "row" },
  topBlue:  { flex: 2, backgroundColor: BLUE },
  topCyan:  { flex: 1, backgroundColor: CYAN },
  header:   { padding: "22 40", flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: BORDER },
  body:     { padding: "18 40", flex: 1 },
  section:  { marginBottom: 18 },
  sTitle:   { fontSize: 8, color: CYAN, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 },
  row2:     { flexDirection: "row", gap: 20 },
  col:      { flex: 1 },
  card:     { backgroundColor: LIGHT, borderRadius: 6, padding: "12 14", marginBottom: 8, borderWidth: 1, borderColor: "#bae6fd" },
  cardTop:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  typePill: { backgroundColor: CYAN, borderRadius: 20, padding: "2 10" },
  typeTxt:  { color: WHITE, fontSize: 7.5, fontWeight: "bold" },
  price:    { fontSize: 15, fontWeight: "bold", color: BLUE },
  metaRow:  { flexDirection: "row", gap: 14, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", gap: 3 },
  metaLbl:  { fontSize: 7.5, color: MID },
  metaVal:  { fontSize: 7.5, color: DARK, fontWeight: "bold" },
  totals:   { alignSelf: "flex-end", minWidth: 210, marginTop: 10 },
  tLine:    { flexDirection: "row", justifyContent: "space-between", padding: "4 0", borderBottomWidth: 1, borderBottomColor: BORDER },
  tLbl:     { fontSize: 8.5, color: MID },
  tVal:     { fontSize: 8.5, color: DARK },
  totalFin: { backgroundColor: BLUE, borderRadius: 6, padding: "10 14", flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  tfLbl:    { fontSize: 12, color: WHITE, fontWeight: "bold" },
  tfVal:    { fontSize: 12, color: WHITE, fontWeight: "bold" },
  footer:   { borderTopWidth: 2, borderTopColor: CYAN, padding: "10 40", flexDirection: "row", justifyContent: "space-between" },
  fTxt:     { fontSize: 7.5, color: MID },
});

type Props = { quotation: Quotation; settings?: CompanySettings | null };

export default function TemplateModernaServicios({ quotation, settings }: Props) {
  const services   = quotation.services ?? [];
  const clientName = quotation.client?.name ?? quotation.client_name ?? "—";
  const issuerName = settings?.fiscal_name ?? "Mobility OS";
  const locale     = "es-MX";
  const fmt = (n: number, curr?: string) =>
    `${curr ?? quotation.currency} $${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.topBar}>
          <View style={s.topBlue} />
          <View style={s.topCyan} />
        </View>

        <View style={s.header}>
          <View>
            {settings?.logo_url
              ? <Image src={settings.logo_url} style={{ width: 100, height: 35, objectFit: "contain" }} />
              : <Text style={{ fontSize: 18, fontWeight: "bold", color: DARK }}>{issuerName}</Text>
            }
            <Text style={{ fontSize: 7.5, color: MID, marginTop: 3 }}>RFC: {settings?.fiscal_rfc ?? "—"}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 8, color: CYAN, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Cotización Logística</Text>
            <Text style={{ fontSize: 22, fontWeight: "bold", color: DARK }}>{quotation.quote_number}</Text>
            <Text style={{ fontSize: 8, color: MID, marginTop: 3 }}>{new Date(quotation.created_at).toLocaleDateString(locale)}</Text>
          </View>
        </View>

        <View style={s.body}>

          {/* CLIENT */}
          <View style={[s.section, s.row2]}>
            <View style={s.col}>
              <Text style={s.sTitle}>Cliente</Text>
              <Text style={{ fontSize: 12, fontWeight: "bold", color: DARK, marginBottom: 3 }}>{clientName}</Text>
              {quotation.client_rfc   && <Text style={{ fontSize: 8, color: MID }}>RFC: {quotation.client_rfc}</Text>}
              {quotation.client_email && <Text style={{ fontSize: 8, color: MID }}>{quotation.client_email}</Text>}
            </View>
            <View style={s.col}>
              <Text style={s.sTitle}>Ruta general</Text>
              {[
                { l: "Origen",   v: quotation.origin      ?? "—" },
                { l: "Destino",  v: quotation.destination ?? "—" },
                { l: "Incoterm", v: quotation.incoterm    ?? "—" },
                { l: "Vigencia", v: quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString(locale) : "—" },
              ].map((r) => (
                <View key={r.l} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                  <Text style={{ fontSize: 7.5, color: MID }}>{r.l}</Text>
                  <Text style={{ fontSize: 7.5, color: DARK, fontWeight: "bold" }}>{r.v}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* SERVICES */}
          <View style={s.section}>
            <Text style={s.sTitle}>Servicios cotizados</Text>
            {services.map((svc) => (
              <View key={svc.id} style={s.card}>
                <View style={s.cardTop}>
                  <View style={s.typePill}><Text style={s.typeTxt}>{svc.service_type.toUpperCase()}</Text></View>
                  <Text style={s.price}>{fmt(svc.price, svc.currency)}</Text>
                </View>
                <Text style={{ fontSize: 9.5, fontWeight: "bold", color: DARK, marginBottom: 5 }}>{svc.description}</Text>
                <View style={s.metaRow}>
                  {svc.origin       && <View style={s.metaItem}><Text style={s.metaLbl}>Origen:</Text><Text style={s.metaVal}>{svc.origin}</Text></View>}
                  {svc.destination  && <View style={s.metaItem}><Text style={s.metaLbl}>Destino:</Text><Text style={s.metaVal}>{svc.destination}</Text></View>}
                  {svc.incoterm     && <View style={s.metaItem}><Text style={s.metaLbl}>Incoterm:</Text><Text style={s.metaVal}>{svc.incoterm}</Text></View>}
                  {svc.transit_time && <View style={s.metaItem}><Text style={s.metaLbl}>Tránsito:</Text><Text style={s.metaVal}>{svc.transit_time}</Text></View>}
                </View>
                {svc.notes && <Text style={{ fontSize: 7.5, color: MID, marginTop: 5, fontStyle: "italic" }}>{svc.notes}</Text>}
              </View>
            ))}
          </View>

          {/* TOTALS */}
          <View style={s.totals}>
            {[
              { l: "Subtotal",              v: fmt(quotation.subtotal) },
              ...(quotation.discount_amount > 0 ? [{ l: "Descuento", v: `- ${fmt(quotation.discount_amount)}` }] : []),
              { l: `IVA ${quotation.tax_rate}%`, v: fmt(quotation.tax_amount) },
            ].map((r) => (
              <View key={r.l} style={s.tLine}>
                <Text style={s.tLbl}>{r.l}</Text>
                <Text style={s.tVal}>{r.v}</Text>
              </View>
            ))}
            <View style={s.totalFin}>
              <Text style={s.tfLbl}>TOTAL</Text>
              <Text style={s.tfVal}>{fmt(quotation.total)}</Text>
            </View>
          </View>

          {quotation.terms && (
            <View style={{ marginTop: 16 }}>
              <Text style={s.sTitle}>Términos y condiciones</Text>
              <Text style={{ fontSize: 7.5, color: MID, lineHeight: 1.5 }}>{quotation.terms}</Text>
            </View>
          )}
        </View>

        <View style={s.footer}>
          <Text style={s.fTxt}>{issuerName} · {settings?.fiscal_rfc ?? ""}</Text>
          <Text style={s.fTxt}>{settings?.quote_footer ?? ""}</Text>
          <Text style={s.fTxt}>{quotation.quote_number}</Text>
        </View>
      </Page>
    </Document>
  );
}
