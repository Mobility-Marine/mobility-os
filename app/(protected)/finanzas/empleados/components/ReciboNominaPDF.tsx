import {
  Document, Page, Text, View, StyleSheet, Image,
} from "@react-pdf/renderer";
import type { PayrollEntry, PayrollPeriod, Employee } from "../types/empleados.types";
import { SALARY_TYPE_CONFIG } from "../types/empleados.types";

type Props = {
  entry:    PayrollEntry;
  period:   PayrollPeriod;
  employee: Employee;
  settings?: {
    fiscal_name?:    string | null;
    fiscal_rfc?:     string | null;
    fiscal_address?: string | null;
    fiscal_city?:    string | null;
    fiscal_state?:   string | null;
    fiscal_zip?:     string | null;
    fiscal_phone?:   string | null;
    fiscal_email?:   string | null;
    logo_url?:       string | null;
    brand_color_dark?:string | null;
    brand_color?:    string | null;
    brand_accent?:   string | null;
  } | null;
};

function isLight(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 0.5;
}

const PERIOD_TYPE_LABEL: Record<string, string> = {
  weekly:    "Semanal",
  biweekly:  "Catorcenal",
  bimonthly: "Quincenal",
  monthly:   "Mensual",
};

export default function ReciboNominaPDF({ entry: e, period: p, employee: emp, settings }: Props) {
  const HEADER_BG   = settings?.brand_color_dark ?? "#0a1628";
  const BRAND_COLOR = settings?.brand_color       ?? "#1d4ed8";
  const ACCENT      = settings?.brand_accent       ?? "#c9a227";

  const headerLight = isLight(HEADER_BG);
  const HEADER_TEXT  = headerLight ? "#1a2332" : "#ffffff";
  const HEADER_SUB   = headerLight ? "#334155" : "#e2e8f0";
  const HEADER_MUTED = headerLight ? "#64748b" : "#cbd5e1";

  const brandLight  = isLight(BRAND_COLOR);
  const BRAND_TEXT  = brandLight ? "#1a2332" : "#ffffff";
  const BRAND_MUTED = brandLight ? "#475569" : "#cbd5e1";
  const BORDER      = brandLight ? "#94a3b8" : "#1e3a5f";

  const WHITE       = "#ffffff";
  const LIGHT       = "#f8fafc";
  const TEXT_DARK   = "#1a2332";
  const TEXT_MED    = "#334155";
  const TEXT_MUTED  = "#64748b";

  const issuerName    = settings?.fiscal_name    ?? "Empresa";
  const issuerRfc     = settings?.fiscal_rfc     ?? "";
  const issuerAddress = settings?.fiscal_address ?? "";
  const issuerCity    = settings?.fiscal_city    ?? "";
  const issuerState   = settings?.fiscal_state   ?? "";
  const issuerPhone   = settings?.fiscal_phone   ?? "";
  const issuerEmail   = settings?.fiscal_email   ?? "";
  const logoUrl       = settings?.logo_url        ?? "";
  const issuerLoc     = [issuerCity, issuerState].filter(Boolean).join(", ");

  const locale  = "es-MX";
  const fmt     = (n: number) => Number(n ?? 0).toLocaleString(locale, { minimumFractionDigits: 2 });
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });

  const fullName = `${emp.first_name} ${emp.last_name}${emp.second_last_name ? " " + emp.second_last_name : ""}`;

  const percepciones = [
    { l: "Salario base",            v: e.base_salary },
    { l: "Horas extra",             v: e.overtime_amount,      hide: !e.overtime_amount },
    { l: "Bono",                    v: e.bonus,                hide: !e.bonus },
    { l: "Prima vacacional",        v: e.vacation_premium,     hide: !e.vacation_premium },
    { l: "Aguinaldo",               v: e.christmas_bonus,      hide: !e.christmas_bonus },
    { l: "Vales de despensa",       v: e.food_vouchers,        hide: !e.food_vouchers },
    { l: "Fondo de ahorro (patrón)",v: e.savings_fund_employer,hide: !e.savings_fund_employer },
    { l: "Otras percepciones",      v: e.other_perceptions,    hide: !e.other_perceptions },
  ].filter(r => !r.hide);

  const deducciones = [
    { l: "ISR retenido",            v: e.isr_withheld },
    { l: "IMSS empleado",           v: e.imss_employee },
    { l: "Fondo de ahorro (empleado)", v: e.savings_fund_employee, hide: !e.savings_fund_employee },
    { l: "Préstamos",               v: e.loans_deduction,      hide: !e.loans_deduction },
    { l: "Otras deducciones",       v: e.other_deductions,     hide: !e.other_deductions },
  ].filter(r => !r.hide);

  const costoPatron = e.total_perceptions + e.imss_employer + e.infonavit;

  const s = StyleSheet.create({
    page:         { backgroundColor: WHITE, fontSize: 9, color: TEXT_DARK, display: "flex", flexDirection: "column" },
    header:       { backgroundColor: HEADER_BG, padding: "22 36", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 },
    accentLine:   { backgroundColor: ACCENT, height: 3, flexShrink: 0 },
    logoBox:      { width: 100, height: 40, objectFit: "contain" },
    body:         { flex: 1, paddingTop: 18, paddingBottom: 14, paddingLeft: 36, paddingRight: 36 },
    section:      { marginBottom: 14 },
    sectionTitle: { fontSize: 8, fontWeight: "bold", color: ACCENT, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: BRAND_COLOR },
    row2:         { flexDirection: "row", gap: 14 },
    col:          { flex: 1 },
    label:        { fontSize: 7, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1.5 },
    value:        { fontSize: 9, color: TEXT_DARK, fontWeight: "bold" },
    valueSm:      { fontSize: 8.5, color: TEXT_MED },
    muted:        { fontSize: 7.5, color: TEXT_MUTED },
    // Tabla percepciones / deducciones
    tableHead:    { flexDirection: "row", backgroundColor: BRAND_COLOR, padding: "6 10", borderRadius: 3 },
    tableHeadTxt: { color: BRAND_TEXT, fontSize: 7.5, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 },
    tableRow:     { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "6 10" },
    tableRowAlt:  { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "6 10", backgroundColor: LIGHT },
    tableRowTotal:{ flexDirection: "row", padding: "8 10", backgroundColor: BRAND_COLOR, borderRadius: 3, marginTop: 2 },
    cell:         { fontSize: 8.5, color: TEXT_MED },
    cellBold:     { fontSize: 8.5, color: TEXT_DARK, fontWeight: "bold" },
    totalLabel:   { fontSize: 8.5, color: BRAND_MUTED },
    totalValue:   { fontSize: 8.5, color: BRAND_TEXT, fontWeight: "bold" },
    // Neto destacado
    netoBox:      { backgroundColor: BRAND_COLOR, borderRadius: 6, padding: "14 18", marginTop: 6, alignSelf: "flex-end", minWidth: 220 },
    netoRow:      { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    netoLabel:    { fontSize: 8.5, color: BRAND_MUTED },
    netoValue:    { fontSize: 8.5, color: BRAND_TEXT },
    grandLabel:   { fontSize: 14, color: ACCENT, fontWeight: "bold" },
    grandValue:   { fontSize: 14, color: ACCENT, fontWeight: "bold" },
    // Cuotas patronales (informativo)
    patronBox:    { backgroundColor: "#f1f5f9", borderRadius: 4, padding: "10 14", borderLeftWidth: 3, borderLeftColor: "#94a3b8" },
    patronTitle:  { fontSize: 7.5, fontWeight: "bold", color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
    // Footer
    footer:       { backgroundColor: BRAND_COLOR, padding: "11 36", flexShrink: 0 },
    footerMain:   { color: BRAND_TEXT, fontSize: 7.5, textAlign: "center", marginBottom: 2 },
    footerMuted:  { color: BRAND_MUTED, fontSize: 7, textAlign: "center" },
    footerDivider:{ height: 1, backgroundColor: BORDER, marginBottom: 7 },
    // CFDI
    cfdiBox:      { backgroundColor: "#f0fdf4", borderRadius: 4, padding: "8 12", borderLeftWidth: 3, borderLeftColor: "#22c55e", marginTop: 8 },
    cfdiText:     { fontSize: 7, color: TEXT_MUTED, fontFamily: "Courier" },
  });

  const footerText = issuerName
    + (issuerLoc   ? "  ·  " + issuerLoc   : "")
    + (issuerRfc   ? "  ·  RFC: " + issuerRfc : "")
    + (issuerPhone ? "  ·  " + issuerPhone  : "");

  const PageHeader = () => (
    <>
      <View style={s.header}>
        <View style={{ flexDirection: "column", gap: 3 }}>
          {logoUrl
            ? <Image src={logoUrl} style={s.logoBox} />
            : <Text style={{ fontSize: 17, fontWeight: "bold", color: HEADER_TEXT }}>{issuerName}</Text>
          }
          <Text style={{ fontSize: 11, fontWeight: "bold", color: ACCENT, marginTop: logoUrl ? 3 : 2 }}>{issuerName}</Text>
          {issuerRfc     && <Text style={{ color: HEADER_SUB,   fontSize: 7.5 }}>{"RFC: " + issuerRfc}</Text>}
          {issuerAddress && <Text style={{ color: HEADER_MUTED, fontSize: 7.5 }}>{issuerAddress}</Text>}
          {issuerLoc     && <Text style={{ color: HEADER_MUTED, fontSize: 7.5 }}>{issuerLoc}</Text>}
          {issuerPhone   && <Text style={{ color: HEADER_MUTED, fontSize: 7.5 }}>{"Tel: " + issuerPhone}</Text>}
          {issuerEmail   && <Text style={{ color: HEADER_MUTED, fontSize: 7.5 }}>{issuerEmail}</Text>}
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={{ fontSize: 7.5, color: ACCENT, textTransform: "uppercase", letterSpacing: 2 }}>
            Recibo de Nómina
          </Text>
          <Text style={{ fontSize: 8, color: HEADER_TEXT, fontWeight: "bold" }}>
            {PERIOD_TYPE_LABEL[p.period_type] ?? p.period_type} — P{p.period_number}/{p.year}
          </Text>
          <View style={{ backgroundColor: BRAND_COLOR, borderRadius: 4, padding: "4 10", alignItems: "flex-end" }}>
            <Text style={{ color: BRAND_MUTED, fontSize: 7 }}>Fecha de pago</Text>
            <Text style={{ color: BRAND_TEXT, fontSize: 8, fontWeight: "bold" }}>
              {fmtDate(p.payment_date)}
            </Text>
          </View>
        </View>
      </View>
      <View style={s.accentLine} />
    </>
  );

  const PageFooter = () => (
    <View style={s.footer}>
      <View style={s.footerDivider} />
      <Text style={s.footerMain}>{footerText}</Text>
      <Text style={[s.footerMuted, { marginTop: 4 }]}>
        Este recibo es un comprobante de pago. Conservarlo para efectos legales y fiscales.
      </Text>
      <Text style={[s.footerMuted, { marginTop: 2 }]}>Powered by Mobility OS</Text>
    </View>
  );

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <PageHeader />
        <View style={s.body}>

          {/* DATOS EMPLEADO + PERÍODO */}
          <View style={[s.section, s.row2]}>
            <View style={s.col}>
              <Text style={s.sectionTitle}>Datos del empleado</Text>
              <Text style={s.value}>{fullName}</Text>
              {emp.rfc   && <Text style={[s.muted, { marginTop: 2 }]}>{"RFC: " + emp.rfc}</Text>}
              {emp.curp  && <Text style={s.muted}>{"CURP: " + emp.curp}</Text>}
              {emp.nss   && <Text style={s.muted}>{"NSS: " + emp.nss}</Text>}
              <Text style={[s.muted, { marginTop: 4 }]}>{emp.position}</Text>
              {emp.department && <Text style={s.muted}>{emp.department}</Text>}
              {emp.employee_number && <Text style={s.muted}>{"No. Empleado: " + emp.employee_number}</Text>}
            </View>
            <View style={s.col}>
              <Text style={s.sectionTitle}>Datos del período</Text>
              <View style={{ gap: 5 }}>
                {[
                  { l: "Tipo de nómina",    v: PERIOD_TYPE_LABEL[p.period_type] ?? p.period_type },
                  { l: "Período",           v: `P${p.period_number}/${p.year}` },
                  { l: "Inicio",            v: fmtDate(p.start_date) },
                  { l: "Fin",               v: fmtDate(p.end_date)   },
                  { l: "Fecha de pago",     v: fmtDate(p.payment_date) },
                  { l: "Periodicidad",      v: SALARY_TYPE_CONFIG[emp.salary_type]?.label ?? emp.salary_type },
                ].map(r => (
                  <View key={r.l} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={s.label}>{r.l}</Text>
                    <Text style={s.valueSm}>{r.v}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* PERCEPCIONES + DEDUCCIONES */}
          <View style={[s.section, s.row2]}>

            {/* Percepciones */}
            <View style={s.col}>
              <Text style={s.sectionTitle}>Percepciones</Text>
              <View style={s.tableHead}>
                <Text style={[s.tableHeadTxt, { flex: 1 }]}>Concepto</Text>
                <Text style={[s.tableHeadTxt, { width: 80, textAlign: "right" }]}>Importe</Text>
              </View>
              {percepciones.map((r, i) => (
                <View key={r.l} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.cell, { flex: 1 }]}>{r.l}</Text>
                  <Text style={[s.cell, { width: 80, textAlign: "right" }]}>{"$" + fmt(r.v)}</Text>
                </View>
              ))}
              <View style={s.tableRowTotal}>
                <Text style={[s.totalLabel, { flex: 1, fontWeight: "bold" }]}>Total percepciones</Text>
                <Text style={[s.totalValue, { width: 80, textAlign: "right" }]}>{"$" + fmt(e.total_perceptions)}</Text>
              </View>
            </View>

            {/* Deducciones */}
            <View style={s.col}>
              <Text style={s.sectionTitle}>Deducciones</Text>
              <View style={s.tableHead}>
                <Text style={[s.tableHeadTxt, { flex: 1 }]}>Concepto</Text>
                <Text style={[s.tableHeadTxt, { width: 80, textAlign: "right" }]}>Importe</Text>
              </View>
              {deducciones.map((r, i) => (
                <View key={r.l} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.cell, { flex: 1 }]}>{r.l}</Text>
                  <Text style={[s.cell, { width: 80, textAlign: "right" }]}>{"$" + fmt(r.v)}</Text>
                </View>
              ))}
              <View style={s.tableRowTotal}>
                <Text style={[s.totalLabel, { flex: 1, fontWeight: "bold" }]}>Total deducciones</Text>
                <Text style={[s.totalValue, { width: 80, textAlign: "right" }]}>{"$" + fmt(e.total_deductions)}</Text>
              </View>
            </View>
          </View>

          {/* NETO A PAGAR */}
          <View style={s.netoBox}>
            <View style={s.netoRow}>
              <Text style={s.netoLabel}>Total percepciones</Text>
              <Text style={s.netoValue}>{"MXN $" + fmt(e.total_perceptions)}</Text>
            </View>
            <View style={s.netoRow}>
              <Text style={s.netoLabel}>Total deducciones</Text>
              <Text style={s.netoValue}>{"MXN $" + fmt(e.total_deductions)}</Text>
            </View>
            <View style={[s.netoRow, { borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 6, marginTop: 3 }]}>
              <Text style={s.grandLabel}>NETO A PAGAR</Text>
              <Text style={s.grandValue}>{"MXN $" + fmt(e.net_salary)}</Text>
            </View>
            {emp.bank_clabe && (
              <Text style={[s.netoLabel, { marginTop: 6, fontSize: 7 }]}>
                {"CLABE: " + emp.bank_clabe + (emp.bank_name ? "  (" + emp.bank_name + ")" : "")}
              </Text>
            )}
          </View>

          {/* CUOTAS PATRONALES (informativo) */}
          <View style={[s.patronBox, { marginTop: 14 }]}>
            <Text style={s.patronTitle}>Cuotas patronales (informativo — no afectan el neto del empleado)</Text>
            <View style={{ flexDirection: "row", gap: 30 }}>
              {[
                { l: "IMSS patrón",  v: e.imss_employer },
                { l: "INFONAVIT",    v: e.infonavit     },
                { l: "Costo total empresa", v: costoPatron },
              ].map(r => (
                <View key={r.l}>
                  <Text style={s.label}>{r.l}</Text>
                  <Text style={{ fontSize: 9, fontWeight: "bold", color: TEXT_MED }}>{"$" + fmt(r.v)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* CFDI UUID si timbrado */}
          {e.cfdi_uuid && (
            <View style={s.cfdiBox}>
              <Text style={[s.label, { marginBottom: 3, color: "#16a34a" }]}>CFDI de Nómina timbrado</Text>
              <Text style={s.cfdiText}>{"UUID: " + e.cfdi_uuid}</Text>
            </View>
          )}

          {/* FIRMA */}
          <View style={{ marginTop: 28, flexDirection: "row", justifyContent: "space-between" }}>
            {[
              { l: "Firma del empleado", sub: fullName },
              { l: "Firma del patrón",   sub: issuerName },
            ].map(f => (
              <View key={f.l} style={{ width: 200, alignItems: "center" }}>
                <View style={{ height: 40, borderBottomWidth: 1, borderBottomColor: TEXT_MUTED, width: "100%", marginBottom: 5 }} />
                <Text style={{ fontSize: 8, color: TEXT_MED, fontWeight: "bold" }}>{f.l}</Text>
                <Text style={{ fontSize: 7.5, color: TEXT_MUTED }}>{f.sub}</Text>
              </View>
            ))}
          </View>

        </View>
        <PageFooter />
      </Page>
    </Document>
  );
}
