import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Quotation, CompanySettings } from "../../types/quotations.types";
import { SERVICE_TYPE_CONFIG } from "../../types/quotations.types";

const NAVY  = "#0a1628";
const BLUE  = "#1d4ed8";
const GOLD  = "#c9a227";
const TEAL  = "#0891b2";
const LIGHT = "#f8fafc";
const MUTED = "#94a3b8";
const WHITE = "#ffffff";

const s = StyleSheet.create({
  page:     { backgroundColor: WHITE, fontSize: 9, color: NAVY },
  header:   { backgroundColor: NAVY, padding: "28 36", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goldLine: { backgroundColor: GOLD, height: 3 },
  tealLine: { backgroundColor: TEAL, height: 1.5 },
  body:     { padding: "22 36" },
  section:  { marginBottom: 18 },
  sTitle:   { fontSize: 9, color: GOLD, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: "#1e3a5f" },
  row2:     { flexDirection: "row", gap: 16 },
  col:      { flex: 1 },
  lbl:      { fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  val:      { fontSize: 9.5, color: NAVY, fontWeight: "bold" },
  svcCard:  { backgroundColor: LIGHT, borderLeftWidth: 3, borderLeftColor: TEAL, padding: "10 14", marginBottom: 8, borderRadius: 2 },
  svcHead:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  svcType:  { backgroundColor: NAVY, borderRadius: 2, padding: "2 8" },
  svcTypeTxt:{ color: GOLD, fontSize: 7.5, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 },
  svcPrice: { fontSize: 14, color: GOLD, fontWeight: "bold" },
  svcDesc:  { fontSize: 9, color: NAVY, fontWeight: "bold", marginBottom: 5 },
  svcMeta:  { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  svcMetaItem:{ flexDirection: "row", gap: 4, alignItems: "center" },
  svcMetaLbl: { fontSize: 7.5, color: MUTED },
  svcMetaVal: { fontSize: 7.5, color: NAVY },
  totalBox: { backgroundColor: NAVY, borderRadius: 6, padding: "14 18", marginTop: 8, alignSelf: "flex-end", minWidth: 240 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  tLbl:     { fontSize: 8.5, color: MUTED },
  tVal:     { fontSize: 8.5, color: WHITE },
  grand:    { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#1e3a5f", paddingTop: 6, marginTop: 4 },
  grandLbl: { fontSize: 13, color: GOLD, fontWeight: "bold" },
  grandVal: { fontSize: 13, color: GOLD, fontWeight: "bold" },
  footer:   { backgroundColor: NAVY, padding: "14 36" },
  fTxt:     { color: MUTED, fontSize: 8, textAlign: "center" },
});

type Props = { quotation: Quotation; settings?: CompanySettings | null };

export default function TemplateEleganteServicios({ quotation, settings }: Props) {
  const services   = quotation.services ?? [];
  const clientName = quotation.client?.name ?? quotation.client_name ?? "—";
  const issuerName = settings?.fiscal_name ?? "Mobility OS";
  const locale     = "es-MX";
  const fmt = (n: number, curr?: string) =>
    `${curr ?? quotation.currency} ${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        <View style={s.header}>
          <View>
            {settings?.logo_url
              ? <Image src={settings.logo_url} style={{ width: 110, height: 40, objectFit: "contain" }} />
              : <Text style={{ fontSize: 20, fontWeight: "bold", color: WHITE }}>{issuerName}</Text>
            }
            {settings?.fiscal_rfc && <Text style={{ color: MUTED, fontSize: 8, marginTop: 4 }}>RFC: {settings.fiscal_rfc}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: GOLD, fontSize: 9, textTransform: "uppercase", letterSpacing: 2, marginBottom: 3 }}>Servicios Logísticos</Text>
            <Text style={{ fontSize: 22, fontWeight: "bold", color: WHITE, letterSpacing: 1 }}>{quotation.quote_number}</Text>
            <Text style={{ color: MUTED, fontSize: 8, marginTop: 3 }}>
              {new Date(quotation.created_at).toLocaleDateString(locale)}
            </Text>
          </View>
        </View>
        <View style={s.goldLine} />
        <View style={s.tealLine} />

        <View style={s.body}>

          {/* CLIENT + META */}
          <View style={[s.section, s.row2]}>
            <View style={s.col}>
              <Text style={s.sTitle}>Cliente</Text>
              <Text style={[s.val, { fontSize: 12 }]}>{clientName}</Text>
              {quotation.client_rfc   && <Text style={[s.lbl, { marginTop: 5 }]}>RFC: {quotation.client_rfc}</Text>}
              {quotation.client_email && <Text style={s.lbl}>{quotation.client_email}</Text>}
            </View>
            <View style={s.col}>
              <Text style={s.sTitle}>Detalles</Text>
              {[
                { l: "Origen general",  v: quotation.origin      ?? "—" },
                { l: "Destino general", v: quotation.destination ?? "—" },
                { l: "Incoterm",        v: quotation.incoterm    ?? "—" },
                { l: "Vigencia",        v: quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString(locale) : "—" },
              ].map((r) => (
                <View key={r.l} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                  <Text style={s.lbl}>{r.l}</Text>
                  <Text style={{ fontSize: 8.5, color: NAVY }}>{r.v}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* SERVICES */}
          <View style={s.section}>
            <Text style={s.sTitle}>Servicios incluidos</Text>
            {services.map((svc, i) => (
              <View key={svc.id} style={s.svcCard}>
                <View style={s.svcHead}>
                  <View style={s.svcType}>
                    <Text style={s.svcTypeTxt}>{svc.service_type}</Text>
                  </View>
                  <Text style={s.svcPrice}>{fmt(svc.price, svc.currency)}</Text>
                </View>
                <Text style={s.svcDesc}>{svc.description}</Text>
                <View style={s.svcMeta}>
                  {svc.origin       && <View style={s.svcMetaItem}><Text style={s.svcMetaLbl}>De:</Text><Text style={s.svcMetaVal}>{svc.origin}</Text></View>}
                  {svc.destination  && <View style={s.svcMetaItem}><Text style={s.svcMetaLbl}>A:</Text><Text style={s.svcMetaVal}>{svc.destination}</Text></View>}
                  {svc.incoterm     && <View style={s.svcMetaItem}><Text style={s.svcMetaLbl}>Incoterm:</Text><Text style={s.svcMetaVal}>{svc.incoterm}</Text></View>}
                  {svc.transit_time && <View style={s.svcMetaItem}><Text style={s.svcMetaLbl}>Tránsito:</Text><Text style={s.svcMetaVal}>{svc.transit_time}</Text></View>}
                </View>
                {svc.notes && <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 5, fontStyle: "italic" }}>{svc.notes}</Text>}
              </View>
            ))}
          </View>

          {/* TOTALS */}
          <View style={s.totalBox}>
            <View style={s.totalRow}><Text style={s.tLbl}>Subtotal</Text><Text style={s.tVal}>{fmt(quotation.subtotal)}</Text></View>
            {quotation.discount_amount > 0 && (
              <View style={s.totalRow}><Text style={s.tLbl}>Descuento</Text><Text style={[s.tVal, { color: GOLD }]}>- {fmt(quotation.discount_amount)}</Text></View>
            )}
            <View style={s.totalRow}><Text style={s.tLbl}>IVA {quotation.tax_rate}%</Text><Text style={s.tVal}>{fmt(quotation.tax_amount)}</Text></View>
            <View style={s.grand}>
              <Text style={s.grandLbl}>TOTAL</Text>
              <Text style={s.grandVal}>{fmt(quotation.total)}</Text>
            </View>
          </View>

          {/* TERMS */}
          {quotation.terms && (
            <View style={{ marginTop: 16 }}>
              <Text style={s.sTitle}>Términos y condiciones</Text>
              <Text style={{ fontSize: 7.5, color: MUTED, lineHeight: 1.5 }}>{quotation.terms}</Text>
            </View>
          )}
        </View>

        <View style={s.footer}>
          <Text style={s.fTxt}>{issuerName} · {settings?.fiscal_address ?? ""} · {settings?.fiscal_rfc ?? ""}</Text>
          {settings?.quote_footer && <Text style={[s.fTxt, { marginTop: 4 }]}>{settings.quote_footer}</Text>}
        </View>
      </Page>
    </Document>
  );
}
