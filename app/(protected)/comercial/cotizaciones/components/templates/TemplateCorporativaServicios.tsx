import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Quotation, CompanySettings } from "../../types/quotations.types";

const CORP   = "#16213e";
const ACCENT = "#0f3460";
const SEA    = "#1a6b8a";
const WHITE  = "#ffffff";
const MID    = "#666666";
const LIGHT  = "#f0f4f8";
const BORDER = "#cccccc";

const s = StyleSheet.create({
  page:    { backgroundColor: WHITE, fontSize: 9, color: CORP },
  header:  { backgroundColor: CORP, padding: "20 28", flexDirection: "row", justifyContent: "space-between" },
  divider: { height: 3, backgroundColor: SEA },
  infoBar: { backgroundColor: LIGHT, padding: "8 28", flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: BORDER },
  body:    { padding: "16 28" },
  section: { marginBottom: 16 },
  sTitle:  { fontSize: 9, fontWeight: "bold", color: CORP, textTransform: "uppercase", letterSpacing: 1, marginBottom: 7, borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 3 },
  row2:    { flexDirection: "row", gap: 16 },
  col:     { flex: 1 },
  lbl:     { fontSize: 7.5, color: MID, textTransform: "uppercase" },
  val:     { fontSize: 9, color: CORP, fontWeight: "bold" },
  svcRow:  { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, padding: "8 10", alignItems: "flex-start" },
  svcAlt:  { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, padding: "8 10", alignItems: "flex-start", backgroundColor: LIGHT },
  tHead:   { flexDirection: "row", backgroundColor: ACCENT, padding: "6 10" },
  tHTxt:   { color: WHITE, fontSize: 8, fontWeight: "bold", textTransform: "uppercase" },
  cell:    { fontSize: 8.5 },
  totBox:  { alignSelf: "flex-end", minWidth: 220, borderWidth: 1, borderColor: BORDER, marginTop: 10 },
  totRow:  { flexDirection: "row", justifyContent: "space-between", padding: "5 10", borderBottomWidth: 1, borderBottomColor: BORDER },
  totLbl:  { fontSize: 8.5, color: MID },
  totVal:  { fontSize: 8.5, color: CORP },
  totFin:  { flexDirection: "row", justifyContent: "space-between", padding: "8 10", backgroundColor: CORP },
  tfLbl:   { fontSize: 11, color: WHITE, fontWeight: "bold" },
  tfVal:   { fontSize: 11, color: WHITE, fontWeight: "bold" },
  footer:  { borderTopWidth: 1, borderTopColor: BORDER, padding: "8 28", marginTop: 4 },
  fTxt:    { fontSize: 7.5, color: MID, textAlign: "center" },
});

type Props = { quotation: Quotation; settings?: CompanySettings | null };

export default function TemplateCorporativaServicios({ quotation, settings }: Props) {
  const services   = quotation.services ?? [];
  const clientName = quotation.client?.name ?? quotation.client_name ?? "—";
  const issuerName = settings?.fiscal_name ?? "Mobility OS";
  const locale     = "es-MX";
  const fmt = (n: number, curr?: string) =>
    `${curr ?? quotation.currency} $${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        <View style={s.header}>
          <View>
            {settings?.logo_url
              ? <Image src={settings.logo_url} style={{ width: 100, height: 35, objectFit: "contain" }} />
              : <Text style={{ fontSize: 16, fontWeight: "bold", color: WHITE }}>{issuerName}</Text>
            }
            <Text style={{ color: "#94a3b8", fontSize: 7.5, marginTop: 4 }}>
              {[settings?.fiscal_address, settings?.fiscal_city].filter(Boolean).join(", ")}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 8, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Cotización de Servicios</Text>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: WHITE }}>{quotation.quote_number}</Text>
            <Text style={{ fontSize: 7.5, color: "#94a3b8", marginTop: 3 }}>Corporativa · {new Date(quotation.created_at).toLocaleDateString(locale)}</Text>
          </View>
        </View>
        <View style={s.divider} />

        <View style={s.infoBar}>
          {[
            { l: "Emisión",   v: new Date(quotation.created_at).toLocaleDateString(locale) },
            { l: "Vigencia",  v: quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString(locale) : "—" },
            { l: "Origen",    v: quotation.origin      ?? "—" },
            { l: "Destino",   v: quotation.destination ?? "—" },
            { l: "Incoterm",  v: quotation.incoterm    ?? "—" },
          ].map((r) => (
            <View key={r.l}>
              <Text style={[s.lbl, { fontSize: 7 }]}>{r.l}</Text>
              <Text style={[s.val, { fontSize: 8.5 }]}>{r.v}</Text>
            </View>
          ))}
        </View>

        <View style={s.body}>

          {/* CLIENT */}
          <View style={s.section}>
            <Text style={s.sTitle}>Datos del cliente</Text>
            <View style={s.row2}>
              <View style={s.col}>
                <Text style={s.lbl}>Razón social</Text>
                <Text style={[s.val, { fontSize: 11 }]}>{clientName}</Text>
              </View>
              <View style={s.col}>
                {quotation.client_rfc   && <><Text style={s.lbl}>RFC</Text><Text style={s.val}>{quotation.client_rfc}</Text></>}
                {quotation.client_email && <><Text style={[s.lbl, { marginTop: 4 }]}>Email</Text><Text style={s.val}>{quotation.client_email}</Text></>}
              </View>
            </View>
          </View>

          {/* SERVICES TABLE */}
          <View style={s.section}>
            <Text style={s.sTitle}>Relación de servicios logísticos</Text>
            <View style={s.tHead}>
              <Text style={[s.tHTxt, { width: "18%" }]}>Tipo</Text>
              <Text style={[s.tHTxt, { width: "28%" }]}>Descripción</Text>
              <Text style={[s.tHTxt, { width: "14%" }]}>Ruta</Text>
              <Text style={[s.tHTxt, { width: "10%" }]}>Incoterm</Text>
              <Text style={[s.tHTxt, { width: "14%" }]}>Tránsito</Text>
              <Text style={[s.tHTxt, { width: "16%", textAlign: "right" }]}>Precio</Text>
            </View>
            {services.map((svc, i) => (
              <View key={svc.id} style={i % 2 === 0 ? s.svcRow : s.svcAlt}>
                <Text style={[s.cell, { width: "18%", fontWeight: "bold", color: SEA }]}>{svc.service_type}</Text>
                <View style={{ width: "28%" }}>
                  <Text style={[s.cell, { fontWeight: "bold" }]}>{svc.description}</Text>
                  {svc.notes && <Text style={[s.cell, { color: MID, fontSize: 7.5 }]}>{svc.notes}</Text>}
                </View>
                <Text style={[s.cell, { width: "14%", color: MID }]}>
                  {svc.origin && svc.destination ? `${svc.origin} → ${svc.destination}` : "—"}
                </Text>
                <Text style={[s.cell, { width: "10%", textAlign: "center" }]}>{svc.incoterm ?? "—"}</Text>
                <Text style={[s.cell, { width: "14%" }]}>{svc.transit_time ?? "—"}</Text>
                <Text style={[s.cell, { width: "16%", textAlign: "right", fontWeight: "bold" }]}>{fmt(svc.price, svc.currency)}</Text>
              </View>
            ))}
          </View>

          {/* TOTALS */}
          <View style={s.totBox}>
            {[
              { l: "Subtotal", v: fmt(quotation.subtotal) },
              ...(quotation.discount_amount > 0 ? [{ l: "Descuento", v: `- ${fmt(quotation.discount_amount)}` }] : []),
              { l: `IVA ${quotation.tax_rate}%`, v: fmt(quotation.tax_amount) },
            ].map((r) => (
              <View key={r.l} style={s.totRow}>
                <Text style={s.totLbl}>{r.l}</Text>
                <Text style={s.totVal}>{r.v}</Text>
              </View>
            ))}
            <View style={s.totFin}>
              <Text style={s.tfLbl}>TOTAL</Text>
              <Text style={s.tfVal}>{fmt(quotation.total)}</Text>
            </View>
          </View>

          {quotation.terms && (
            <View style={{ marginTop: 16 }}>
              <Text style={s.sTitle}>Términos y condiciones</Text>
              <Text style={{ fontSize: 7.5, color: MID, lineHeight: 1.6 }}>{quotation.terms}</Text>
            </View>
          )}
        </View>

        <View style={s.footer}>
          <Text style={s.fTxt}>{issuerName} · {settings?.fiscal_address ?? ""} · {settings?.fiscal_rfc ?? ""}</Text>
          {settings?.quote_footer && <Text style={[s.fTxt, { marginTop: 3 }]}>{settings.quote_footer}</Text>}
        </View>
      </Page>
    </Document>
  );
}
