import { Document, Page, View, Text } from "@react-pdf/renderer";
import type { Quotation, CompanySettings } from "../../types/quotations.types";
import type { PDFLang } from "./shared/pdfTranslations";
import { tx } from "./shared/pdfTranslations";
import { getBrandColors, PDFHeader, PDFFooter, PDFClientBlock, PDFSectionTitle, PDFTermsPage } from "./shared/PDFShared";

type Props = { quotation: Quotation; settings?: CompanySettings | null };

const FOOTER_HEIGHT = 56;
// Espacio reservado en cada página para el header fijo + margen de respiración.
// Se aplica como paddingTop en la Page para que funcione en TODAS las páginas
// (primera y subsecuentes generadas por desbordamiento).
const HEADER_SPACE  = 190;

const SUBTYPE_TITLES: Record<string, { es: string; en: string }> = {
  terrestre_ltl:    { es: "Cotización Terrestre LTL",        en: "LTL Trucking Quotation"       },
  terrestre_ftl:    { es: "Cotización Terrestre FTL",        en: "FTL Trucking Quotation"       },
  maritimo_fcl:     { es: "Cotización Marítima FCL",         en: "FCL Ocean Freight Quotation"  },
  maritimo_lcl:     { es: "Cotización Marítima LCL",         en: "LCL Ocean Freight Quotation"  },
  aereo_carga:      { es: "Cotización Aérea",                en: "Air Freight Quotation"        },
  aereo_courier:    { es: "Cotización Courier",              en: "Courier Quotation"            },
  impo_integral:    { es: "Cotización Importación Integral", en: "Import Quotation"             },
  expo_integral:    { es: "Cotización Exportación Integral", en: "Export Quotation"             },
  comercializadora: { es: "Cotización Comercializadora",     en: "Trading Quotation"            },
  op_completa:      { es: "Cotización Operación Completa",   en: "Full Operation Quotation"     },
  consultoria:      { es: "Cotización de Consultoría",       en: "Consulting Quotation"         },
};

export default function TemplateServicios({ quotation, settings }: Props) {
  const lang   = (quotation.language ?? "es") as PDFLang;
  const c      = getBrandColors(settings);
  const locale = lang === "en" ? "en-US" : "es-MX";
  const fmt    = (n: number) => Number(n ?? 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const gi       = (quotation as any).general_info ?? {};
  const subtype  = (quotation as any).service_subtype ?? "";
  const concepts = (quotation as any).billing_concepts ?? [];

  const subtitle   = SUBTYPE_TITLES[subtype]?.[lang] ?? tx(lang, "serviceQuote");
  const termsText  = (quotation.terms && quotation.terms.trim())
    ? quotation.terms
    : ((settings as any)?.quote_terms_services ?? null);

  // Calcular totales por moneda desde todas las líneas
  const byCurrency: Record<string, { subtotal: number; tax: number; total: number }> = {};
  for (const concept of concepts) {
    for (const line of (concept.lines ?? [])) {
      const cur   = line.currency ?? concept.currency ?? quotation.currency ?? "MXN";
      const price = Number(line.price ?? 0);
      const rate  = line.tax_rate;
      const tax   = (rate === null || rate === undefined || rate === -1 || rate === 0) ? 0 : price * (rate / 100);
      if (!byCurrency[cur]) byCurrency[cur] = { subtotal: 0, tax: 0, total: 0 };
      byCurrency[cur].subtotal += price;
      byCurrency[cur].tax      += tax;
      byCurrency[cur].total    += price + tax;
    }
  }
  const currencies = Object.keys(byCurrency);

  return (
    <Document>
      {/* ═══ PÁGINA(S) PRINCIPAL(ES) ═══ */}
      {/* paddingTop reserva espacio para el header en TODAS las páginas (primera y las
          generadas automáticamente cuando el contenido se desborda). El header fijo se
          dibuja encima de ese espacio reservado gracias a position:absolute. */}
      <Page
        size="LETTER"
        style={{
          backgroundColor: c.WHITE,
          fontSize: 9,
          color: c.TEXT_DARK,
          paddingTop: HEADER_SPACE,
          paddingBottom: FOOTER_HEIGHT + 10,
        }}
      >
        {/* HEADER — fijo y absoluto; se repite en cada página sin ocupar flujo */}
        <View fixed style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
          <PDFHeader quotation={quotation} settings={settings} lang={lang} subtitle={subtitle} />
        </View>

        {/* CONTENIDO */}
        <View style={{ paddingLeft: 36, paddingRight: 36 }}>

          {/* CLIENTE */}
          <PDFClientBlock quotation={quotation} lang={lang} settings={settings} />

          {/* INFO GENERAL DEL SUBTIPO */}
          {subtype && Object.keys(gi).length > 0 && (
            <GeneralInfoBlock gi={gi} subtype={subtype} lang={lang} c={c} fmt={fmt} />
          )}

          {/* SERVICIOS */}
          <PDFSectionTitle title={tx(lang, "services")} c={c} />

          {concepts.map((concept: any, ci: number) => {
            const lines        = concept.lines ?? [];
            const conceptTotal = lines.reduce((s: number, l: any) => s + Number(l.price ?? 0), 0);
            return (
              <View key={ci} style={{ marginBottom: 10 }} wrap={false}>
                {/* Título del concepto agrupador */}
                <View style={{ backgroundColor: c.BRAND_COLOR + "20", borderRadius: 3, padding: "5 10", marginBottom: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 9.5, fontWeight: "bold", color: c.BRAND_COLOR }}>{concept.description}</Text>
                  <Text style={{ fontSize: 9, color: c.BRAND_COLOR, fontWeight: "bold" }}>
                    {concept.currency} ${conceptTotal.toLocaleString(locale, { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                {/* Líneas de detalle */}
                {lines.map((line: any, li: number) => {
                  const taxRate  = line.tax_rate;
                  const isExento = taxRate === -1;
                  const isTasa0  = taxRate === 0;
                  const taxLabel = isExento ? tx(lang, "exempt") : isTasa0 ? tx(lang, "zeroRate") : `${tx(lang, "tax")} ${taxRate ?? 16}%`;
                  const lineCur  = line.currency ?? concept.currency ?? quotation.currency;
                  return (
                    <View key={li} style={{ backgroundColor: c.LIGHT, borderLeftWidth: 3, borderLeftColor: c.BRAND_COLOR, padding: "6 10 6 14", marginBottom: 3, borderRadius: 3 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <View style={{ flexDirection: "row", gap: 4, marginBottom: 2 }}>
                            <View style={{ backgroundColor: c.BRAND_COLOR + "30", borderRadius: 2, padding: "1 4" }}>
                              <Text style={{ fontSize: 6, color: c.BRAND_COLOR, fontWeight: "bold", textTransform: "uppercase" }}>{line.service_type}</Text>
                            </View>
                            <View style={{ backgroundColor: isExento ? "#e2e8f0" : isTasa0 ? "#dcfce7" : "#fef9c3", borderRadius: 2, padding: "1 4" }}>
                              <Text style={{ fontSize: 6, color: isExento ? c.TEXT_MUTED : isTasa0 ? "#166534" : "#854d0e", fontWeight: "bold" }}>{taxLabel}</Text>
                            </View>
                            {line.unit_label && (
                              <View style={{ backgroundColor: c.BRAND_COLOR + "15", borderRadius: 2, padding: "1 4" }}>
                                <Text style={{ fontSize: 6, color: c.BRAND_COLOR }}>{line.unit_label}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ fontSize: 8.5, color: c.TEXT_DARK, fontWeight: "bold", marginBottom: 1 }}>{line.description}</Text>
                          {line.notes && <Text style={{ fontSize: 7, color: c.TEXT_MUTED, fontStyle: "italic" }}>{line.notes}</Text>}
                        </View>
                        <Text style={{ fontSize: 9.5, fontWeight: "bold", color: c.TEXT_DARK, minWidth: 80, textAlign: "right" }}>
                          {lineCur} ${Number(line.price ?? 0).toLocaleString(locale, { minimumFractionDigits: 2 })}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}

          {/* TOTALES POR MONEDA — wrap={false} asegura que no se parta y se mueva entero a la siguiente página si no cabe */}
          <View wrap={false} style={{ alignSelf: "flex-end", marginTop: 12, minWidth: 260 }}>
            <View style={{ backgroundColor: c.BRAND_COLOR, borderRadius: 6, padding: "14 18" }}>
              {currencies.map((cur, i) => {
                const ct = byCurrency[cur];
                return (
                  <View key={cur}>
                    {currencies.length > 1 && (
                      <Text style={{ fontSize: 8, color: c.ACCENT, fontWeight: "bold", textTransform: "uppercase", marginBottom: 5 }}>{cur}</Text>
                    )}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ fontSize: 8, color: c.BRAND_MUTED }}>{tx(lang, "subtotal")}</Text>
                      <Text style={{ fontSize: 8, color: c.BRAND_TEXT }}>{cur} ${fmt(ct.subtotal)}</Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ fontSize: 8, color: c.BRAND_MUTED }}>{tx(lang, "tax")}</Text>
                      <Text style={{ fontSize: 8, color: c.BRAND_TEXT }}>{cur} ${fmt(ct.tax)}</Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: c.BORDER_COLOR, paddingTop: 5, marginTop: 2 }}>
                      <Text style={{ fontSize: 11, color: c.ACCENT, fontWeight: "bold" }}>
                        {tx(lang, "total")}{currencies.length > 1 ? ` ${cur}` : ""}
                      </Text>
                      <Text style={{ fontSize: 11, color: c.ACCENT, fontWeight: "bold" }}>{cur} ${fmt(ct.total)}</Text>
                    </View>
                    {i < currencies.length - 1 && (
                      <View style={{ borderTopWidth: 1, borderTopColor: c.BORDER_COLOR, marginTop: 10, marginBottom: 10 }} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* NOTAS */}
          {quotation.notes && (
            <View style={{ marginTop: 14 }} wrap={false}>
              <PDFSectionTitle title={tx(lang, "notes")} c={c} />
              <View style={{ backgroundColor: "#f1f5f9", borderRadius: 4, padding: "10 14", borderLeftWidth: 3, borderLeftColor: c.BRAND_COLOR }}>
                <Text style={{ fontSize: 8, color: c.TEXT_MEDIUM, lineHeight: 1.7 }}>{quotation.notes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* FOOTER — fijo */}
        <View fixed style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
          <PDFFooter settings={settings} lang={lang} />
        </View>
      </Page>

      {/* ═══ PÁGINA TÉRMINOS ═══ */}
      {/* Esta página NO tiene header, así que NO lleva HEADER_SPACE.
          El PDFTermsPage ya maneja su propio paddingTop interno. */}
      {termsText ? (
        <Page size="LETTER" style={{ backgroundColor: c.WHITE, fontSize: 9, color: c.TEXT_DARK, paddingBottom: FOOTER_HEIGHT + 10 }}>
          <PDFTermsPage quotation={quotation} lang={lang} settings={settings} />
          <View fixed style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
            <PDFFooter settings={settings} lang={lang} />
          </View>
        </Page>
      ) : null}
    </Document>
  );
}

// ── Info General por subtipo ──────────────────────────────────
function GeneralInfoBlock({ gi, subtype, lang, c, fmt }: any) {
  const isTerrestre      = subtype.startsWith("terrestre");
  const isMaritimo       = subtype.startsWith("maritimo");
  const isAereo          = subtype.startsWith("aereo");
  const isImpo           = subtype === "impo_integral";
  const isExpo           = subtype === "expo_integral";
  const isOpCompleta     = subtype === "op_completa";
  const isComercializadora = subtype === "comercializadora";
  const isConsultoria    = subtype === "consultoria";

  // Recálculo de impuestos impo (desde los valores guardados en general_info)
  function calcImpuestos(g: any) {
    const valorFacturaMXN  = Number(g.valor_comercial || 0) * Number(g.tipo_cambio || 1);
    const fleteflete       = Number(g.flete_origen || g.costo_flete_mxn || 0);
    const seguro           = Number(g.seguro || 0);
    const otros            = Number(g.otros_incrementables || 0);
    const valorAduana      = valorFacturaMXN + fleteflete + seguro + otros;
    const igi              = valorAduana * (Number(g.arancel_pct || 0) / 100);
    const dta              = valorAduana > 0 ? Math.min(Math.max(valorAduana * 0.00176, 890), 1008) : 0;
    const prevalidacion    = Number(g.prevalidacion || 0);
    const ivaPreval        = prevalidacion * 0.16;
    const ivaImpo          = (valorAduana + igi + dta + prevalidacion) * 0.16;
    const totalImpuestos   = igi + dta + prevalidacion + ivaPreval + ivaImpo;
    return { valorAduana, igi, dta, prevalidacion, ivaPreval, ivaImpo, totalImpuestos };
  }

  const volLTL = (gi.largo_cm && gi.ancho_cm && gi.alto_cm)
    ? ((Number(gi.largo_cm) * Number(gi.ancho_cm) * Number(gi.alto_cm)) / 1_000_000) : null;
  const volTotalLTL = volLTL && gi.piezas && Number(gi.piezas) > 1 ? volLTL * Number(gi.piezas) : volLTL;

  const cardAccentStyle: any = { backgroundColor: c.LIGHT, borderWidth: 1, borderColor: c.ACCENT + "60", borderRadius: 5 };
  const cardBrandStyle: any  = { backgroundColor: c.LIGHT, borderWidth: 1, borderColor: c.BRAND_COLOR + "30", borderRadius: 5 };
  const rowStyle: any        = { flexDirection: "row", padding: "9 14", gap: 14, alignItems: "flex-start" };
  const labelStyle: any      = { fontSize: 7, color: c.TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 };
  const valueStyle: any      = { fontSize: 9, color: c.TEXT_DARK, fontWeight: "bold" };
  const dividerBrand: any    = { height: 1, backgroundColor: c.BRAND_COLOR + "20" };
  const dividerAccent: any   = { height: 1, backgroundColor: c.ACCENT + "40" };

  const F = ({ label, value, flex = 1, width, accent }: any) => (
    <View style={width ? { width } : { flex }}>
      <Text style={labelStyle}>{label}</Text>
      <Text style={accent ? { ...valueStyle, color: c.BRAND_COLOR } : valueStyle}>{value}</Text>
    </View>
  );

  // ── Helper: bloque de impuestos ────────────────────────────
  const TaxBlock = ({ g }: { g: any }) => {
    const { valorAduana, igi, dta, prevalidacion, ivaPreval, ivaImpo, totalImpuestos } = calcImpuestos(g);
    if (valorAduana <= 0) return null;
    return (
      <View wrap={false} style={{ marginTop: 6 }}>
        <PDFSectionTitle title={lang === "en" ? "Import Taxes (Estimated)" : "Impuestos de Importación (Estimado)"} c={c} />
        <View style={{ borderRadius: 4, overflow: "hidden", borderWidth: 1, borderColor: c.BRAND_COLOR + "30" }}>
          {[
            { label: "Valor en Aduana",     value: `MXN $${fmt(valorAduana)}` },
            { label: `IGI / Arancel ${g.arancel_pct || 0}%`, value: `MXN $${fmt(igi)}` },
            { label: "DTA (0.176% mín $890)", value: `MXN $${fmt(dta)}` },
            { label: "Prevalidación",       value: `MXN $${fmt(prevalidacion)}` },
            { label: "IVA Prevalidación",   value: `MXN $${fmt(ivaPreval)}` },
            { label: "IVA Importación 16%", value: `MXN $${fmt(ivaImpo)}` },
          ].map((row, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", padding: "5 10", borderBottomWidth: 1, borderBottomColor: c.BRAND_COLOR + "15" }}>
              <Text style={{ fontSize: 7.5, color: c.TEXT_MUTED }}>{row.label}</Text>
              <Text style={{ fontSize: 7.5, color: c.TEXT_DARK, fontWeight: "bold" }}>{row.value}</Text>
            </View>
          ))}
          <View style={{ flexDirection: "row", justifyContent: "space-between", padding: "7 10", backgroundColor: c.BRAND_COLOR + "15" }}>
            <Text style={{ fontSize: 9, color: c.BRAND_COLOR, fontWeight: "bold" }}>TOTAL IMPUESTOS</Text>
            <Text style={{ fontSize: 9, color: c.BRAND_COLOR, fontWeight: "bold" }}>MXN ${fmt(totalImpuestos)}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 6.5, color: c.TEXT_MUTED, marginTop: 3, fontStyle: "italic" }}>
          * Cálculo estimado. Los impuestos finales los determina el SAT al momento del cruce.
        </Text>
      </View>
    );
  };

  return (
    <View style={{ marginBottom: 12 }}>

      {/* ═══ TERRESTRE ═══ */}
      {isTerrestre && gi.rutas?.length > 0 && (
        <View wrap={false}>
          <PDFSectionTitle title={subtype === "terrestre_ltl" ? (lang === "en" ? "Routes — LTL" : "Rutas — LTL") : (lang === "en" ? "Routes — FTL" : "Rutas — FTL")} c={c} />
          <View style={cardAccentStyle}>
            {gi.rutas.map((r: any, i: number) => (
              <View key={i}>
                {i > 0 && <View style={dividerAccent} />}
                <View style={rowStyle}>
                  <F label={tx(lang, "origin")}      value={r.origen}   />
                  <F label={tx(lang, "destination")} value={r.destino}  />
                  {r.incoterm ? <F label={tx(lang, "incoterm")} value={r.incoterm} width={70} /> : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      {isTerrestre && (gi.mercancia || gi.peso_kg || gi.tipo_unidad) && (
        <View wrap={false}>
          <PDFSectionTitle title={lang === "en" ? "Cargo Details" : "Detalles de la Carga"} c={c} />
          <View style={cardBrandStyle}>
            <View style={rowStyle}>
              {gi.mercancia    ? <F label={tx(lang, "cargo")}    value={gi.mercancia} flex={2} /> : null}
              {gi.peso_kg      ? <F label={tx(lang, "weight")}   value={`${Number(gi.peso_kg).toLocaleString()} kg`} /> : null}
              {gi.tipo_unidad  ? <F label={tx(lang, "unitType")} value={`${gi.tipo_unidad}${gi.cantidad_unidades && Number(gi.cantidad_unidades) > 1 ? ` × ${gi.cantidad_unidades}` : ""}`} /> : null}
            </View>
            {subtype === "terrestre_ltl" && (gi.largo_cm || gi.ancho_cm || volLTL) && (
              <>
                <View style={dividerBrand} />
                <View style={rowStyle}>
                  {gi.largo_cm ? <F label={lang === "en" ? "Length" : "Largo"} value={`${gi.largo_cm} cm`} /> : null}
                  {gi.ancho_cm ? <F label={lang === "en" ? "Width"  : "Ancho"} value={`${gi.ancho_cm} cm`} /> : null}
                  {gi.alto_cm  ? <F label={lang === "en" ? "Height" : "Alto"}  value={`${gi.alto_cm} cm`}  /> : null}
                  {gi.piezas   ? <F label={tx(lang, "pieces")} value={gi.piezas} /> : null}
                  {volLTL      ? <F label={tx(lang, "volume")} value={`${volLTL.toFixed(3)} m³${volTotalLTL && Number(gi.piezas) > 1 ? ` × ${gi.piezas} = ${volTotalLTL.toFixed(3)} m³` : ""}`} flex={2} accent /> : null}
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* ═══ MARÍTIMO ═══ */}
      {isMaritimo && (gi.puerto_origen || gi.puerto_destino) && (
        <View wrap={false}>
          <PDFSectionTitle title={lang === "en" ? "Ports" : "Puertos"} c={c} />
          <View style={cardAccentStyle}>
            <View style={rowStyle}>
              {gi.puerto_origen  ? <F label={tx(lang, "originPort")} value={gi.puerto_origen}  /> : null}
              {gi.puerto_destino ? <F label={tx(lang, "destPort")}   value={gi.puerto_destino} /> : null}
              {gi.incoterm       ? <F label={tx(lang, "incoterm")}   value={gi.incoterm} width={70} /> : null}
            </View>
          </View>
        </View>
      )}
      {isMaritimo && (gi.mercancia || gi.peso_kg || gi.contenedores?.length) && (
        <View wrap={false}>
          <PDFSectionTitle title={lang === "en" ? "Cargo Details" : "Detalles de la Carga"} c={c} />
          <View style={cardBrandStyle}>
            {(gi.mercancia || gi.peso_kg) && (
              <View style={rowStyle}>
                {gi.mercancia ? <F label={tx(lang, "cargo")}  value={gi.mercancia} flex={2} /> : null}
                {gi.peso_kg   ? <F label={tx(lang, "weight")} value={`${Number(gi.peso_kg).toLocaleString()} kg`} /> : null}
              </View>
            )}
            {subtype === "maritimo_fcl" && gi.contenedores?.length > 0 && (
              <>
                <View style={dividerBrand} />
                <View style={{ padding: "9 14" }}>
                  <Text style={labelStyle}>{tx(lang, "containers")}</Text>
                  <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                    {gi.contenedores.map((ct: any, i: number) => (
                      <View key={i} style={{ backgroundColor: c.BRAND_COLOR, borderRadius: 3, padding: "3 8" }}>
                        <Text style={{ fontSize: 8, color: c.BRAND_TEXT, fontWeight: "bold" }}>{ct.cantidad} × {ct.tipo}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
            {subtype === "maritimo_lcl" && gi.bultos?.length > 0 && (
              <>
                <View style={dividerBrand} />
                <View style={rowStyle}>
                  <F label="CBM Total" value={`${gi.bultos.reduce((s: number, b: any) => s + (Number(b.largo_cm) * Number(b.ancho_cm) * Number(b.alto_cm) / 1_000_000) * Number(b.cantidad || 1), 0).toFixed(3)} m³`} accent />
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* ═══ AÉREO ═══ */}
      {isAereo && (gi.aeropuerto_origen || gi.aeropuerto_destino) && (
        <View wrap={false}>
          <PDFSectionTitle title={lang === "en" ? "Airports" : "Aeropuertos"} c={c} />
          <View style={cardAccentStyle}>
            <View style={rowStyle}>
              {gi.aeropuerto_origen  ? <F label={tx(lang, "originAirport")} value={gi.aeropuerto_origen}  /> : null}
              {gi.aeropuerto_destino ? <F label={tx(lang, "destAirport")}   value={gi.aeropuerto_destino} /> : null}
              {gi.incoterm           ? <F label={tx(lang, "incoterm")}      value={gi.incoterm} width={70} /> : null}
            </View>
          </View>
        </View>
      )}
      {isAereo && (gi.mercancia || gi.carrier || gi.bultos?.length > 0) && (
        <View wrap={false}>
          <PDFSectionTitle title={lang === "en" ? "Cargo Details" : "Detalles de la Carga"} c={c} />
          <View style={cardBrandStyle}>
            <View style={rowStyle}>
              {gi.mercancia        ? <F label={tx(lang, "cargo")}            value={gi.mercancia} flex={2} /> : null}
              {gi.carrier          ? <F label={tx(lang, "carrier")}          value={gi.carrier} /> : null}
            </View>
            {gi.bultos?.length > 0 && (() => {
              const divisor = subtype === "aereo_courier" ? 5000 : 6000;
              const pesoReal = gi.bultos.reduce((s: number, b: any) => s + Number(b.peso_kg) * Number(b.cantidad || 1), 0);
              const pesoDim  = gi.bultos.reduce((s: number, b: any) => s + (Number(b.largo_cm) * Number(b.ancho_cm) * Number(b.alto_cm) / divisor) * Number(b.cantidad || 1), 0);
              const cobrable = Math.max(pesoReal, pesoDim);
              return cobrable > 0 ? (
                <>
                  <View style={dividerBrand} />
                  <View style={rowStyle}>
                    <F label={tx(lang, "realWeight")}       value={`${pesoReal.toFixed(2)} kg`} />
                    <F label={tx(lang, "dimWeight")}        value={`${pesoDim.toFixed(2)} kg`} />
                    <F label={tx(lang, "chargeableWeight")} value={`${cobrable.toFixed(2)} kg`} accent />
                  </View>
                </>
              ) : null;
            })()}
          </View>
        </View>
      )}

      {/* ═══ IMPORTACIÓN INTEGRAL ═══ */}
      {isImpo && (
        <>
          {(gi.fraccion_arancelaria || gi.descripcion_mercancia || gi.aduana_nombre || gi.pais_origen) && (
            <View wrap={false}>
              <PDFSectionTitle title={tx(lang, "customs")} c={c} />
              <View style={cardAccentStyle}>
                <View style={rowStyle}>
                  {gi.aduana_nombre        ? <F label={tx(lang, "customsOffice")} value={`${gi.aduana_nombre}${gi.clave_aduana ? ` (${gi.clave_aduana})` : ""}`} flex={2} /> : null}
                  {gi.fraccion_arancelaria ? <F label={tx(lang, "tariffCode")}    value={gi.fraccion_arancelaria} /> : null}
                </View>
                {(gi.descripcion_mercancia || gi.pais_origen || gi.incoterm) && (
                  <>
                    <View style={dividerAccent} />
                    <View style={rowStyle}>
                      {gi.descripcion_mercancia ? <F label={tx(lang, "mercDesc")}      value={gi.descripcion_mercancia} flex={2} /> : null}
                      {gi.pais_origen           ? <F label={tx(lang, "countryOrigin")} value={gi.pais_origen} /> : null}
                      {gi.incoterm              ? <F label={tx(lang, "incoterm")}      value={gi.incoterm} width={60} /> : null}
                    </View>
                  </>
                )}
              </View>
            </View>
          )}
          <TaxBlock g={gi} />
        </>
      )}

      {/* ═══ EXPORTACIÓN INTEGRAL ═══ */}
      {isExpo && (gi.fraccion_arancelaria || gi.descripcion_mercancia || gi.aduana_nombre) && (
        <View wrap={false}>
          <PDFSectionTitle title={lang === "en" ? "Export Customs" : "Despacho Aduanal Exportación"} c={c} />
          <View style={cardAccentStyle}>
            <View style={rowStyle}>
              {gi.aduana_nombre        ? <F label={tx(lang, "customsOffice")} value={`${gi.aduana_nombre}${gi.clave_aduana ? ` (${gi.clave_aduana})` : ""}`} flex={2} /> : null}
              {gi.fraccion_arancelaria ? <F label={tx(lang, "tariffCode")}    value={gi.fraccion_arancelaria} /> : null}
            </View>
            {(gi.descripcion_mercancia || gi.pais_destino || gi.incoterm) && (
              <>
                <View style={dividerAccent} />
                <View style={rowStyle}>
                  {gi.descripcion_mercancia ? <F label={tx(lang, "mercDesc")}      value={gi.descripcion_mercancia} flex={2} /> : null}
                  {gi.pais_destino          ? <F label={lang === "en" ? "Dest. Country" : "País de Destino"} value={gi.pais_destino} /> : null}
                  {gi.incoterm              ? <F label={tx(lang, "incoterm")}      value={gi.incoterm} width={60} /> : null}
                </View>
              </>
            )}
          </View>
          {gi.requiere_cert_origen && (
            <View style={{ marginTop: 6, padding: "6 10", backgroundColor: c.BRAND_COLOR + "10", borderRadius: 4, borderLeftWidth: 2, borderLeftColor: c.BRAND_COLOR }}>
              <Text style={{ fontSize: 7.5, color: c.BRAND_COLOR, fontWeight: "bold" }}>
                ✓ {lang === "en" ? "Certificate of Origin required" : "Requiere certificado de origen"}{gi.tipo_cert_origen ? ` — ${gi.tipo_cert_origen}` : ""}
              </Text>
            </View>
          )}
          {gi.requiere_permiso_expo && (
            <View style={{ marginTop: 4, padding: "6 10", backgroundColor: c.ACCENT + "15", borderRadius: 4, borderLeftWidth: 2, borderLeftColor: c.ACCENT }}>
              <Text style={{ fontSize: 7.5, color: c.ACCENT, fontWeight: "bold" }}>
                ⚠ {lang === "en" ? "Export permit required" : "Requiere permiso previo de exportación"}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ═══ OP COMPLETA ═══ */}
      {isOpCompleta && (
        <>
          {/* Sección Flete según tipo_transporte */}
          {gi.tipo_transporte && (
            <View wrap={false}>
              <PDFSectionTitle title={lang === "en" ? `Freight — ${gi.tipo_transporte.toUpperCase()}` : `Flete — ${gi.tipo_transporte.toUpperCase()}`} c={c} />
              <View style={cardAccentStyle}>
                {/* Marítimo */}
                {(gi.tipo_transporte === "fcl" || gi.tipo_transporte === "lcl") && (
                  <View style={rowStyle}>
                    {gi.puerto_origen  ? <F label={tx(lang, "originPort")} value={gi.puerto_origen}  /> : null}
                    {gi.puerto_destino ? <F label={tx(lang, "destPort")}   value={gi.puerto_destino} /> : null}
                    {gi.incoterm       ? <F label={tx(lang, "incoterm")}   value={gi.incoterm} width={70} /> : null}
                  </View>
                )}
                {/* FCL: contenedores */}
                {gi.tipo_transporte === "fcl" && gi.contenedores?.length > 0 && (
                  <View style={{ padding: "6 14" }}>
                    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                      {gi.contenedores.map((ct: any, i: number) => (
                        <View key={i} style={{ backgroundColor: c.BRAND_COLOR, borderRadius: 3, padding: "3 8" }}>
                          <Text style={{ fontSize: 8, color: c.BRAND_TEXT, fontWeight: "bold" }}>{ct.cantidad} × {ct.tipo}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {/* Terrestre */}
                {(gi.tipo_transporte === "ltl" || gi.tipo_transporte === "ftl") && gi.rutas?.length > 0 && (
                  gi.rutas.map((r: any, i: number) => (
                    <View key={i}>
                      {i > 0 && <View style={dividerAccent} />}
                      <View style={rowStyle}>
                        <F label={tx(lang, "origin")}      value={r.origen}  />
                        <F label={tx(lang, "destination")} value={r.destino} />
                        {r.incoterm ? <F label={tx(lang, "incoterm")} value={r.incoterm} width={70} /> : null}
                      </View>
                    </View>
                  ))
                )}
                {gi.tipo_transporte === "ftl" && gi.tipo_unidad && (
                  <View style={rowStyle}>
                    <F label={tx(lang, "unitType")} value={`${gi.tipo_unidad}${gi.cantidad_unidades && Number(gi.cantidad_unidades) > 1 ? ` × ${gi.cantidad_unidades}` : ""}`} />
                  </View>
                )}
                {/* Aéreo */}
                {(gi.tipo_transporte === "aereo_carga" || gi.tipo_transporte === "courier") && (
                  <View style={rowStyle}>
                    {gi.aeropuerto_origen  ? <F label={tx(lang, "originAirport")} value={gi.aeropuerto_origen}  /> : null}
                    {gi.aeropuerto_destino ? <F label={tx(lang, "destAirport")}   value={gi.aeropuerto_destino} /> : null}
                    {gi.carrier            ? <F label={tx(lang, "carrier")}       value={gi.carrier} /> : null}
                  </View>
                )}
                {/* Mercancía */}
                {gi.mercancia && (
                  <>
                    <View style={dividerAccent} />
                    <View style={rowStyle}>
                      <F label={tx(lang, "cargo")}  value={gi.mercancia} flex={2} />
                      {gi.peso_kg ? <F label={tx(lang, "weight")} value={`${Number(gi.peso_kg).toLocaleString()} kg`} /> : null}
                    </View>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Sección Aduanal */}
          {(gi.fraccion_arancelaria || gi.descripcion_mercancia || gi.aduana) && (
            <View wrap={false}>
              <PDFSectionTitle title={lang === "en" ? `Customs — ${gi.modalidad === "expo" ? "Export" : "Import"}` : `Despacho Aduanal — ${gi.modalidad === "expo" ? "Exportación" : "Importación"}`} c={c} />
              <View style={cardAccentStyle}>
                <View style={rowStyle}>
                  {gi.aduana             ? <F label={tx(lang, "customsOffice")} value={`${gi.aduana}${gi.clave_aduana ? ` (${gi.clave_aduana})` : ""}`} flex={2} /> : null}
                  {gi.fraccion_arancelaria ? <F label={tx(lang, "tariffCode")} value={gi.fraccion_arancelaria} /> : null}
                </View>
                {(gi.descripcion_mercancia || gi.pais) && (
                  <>
                    <View style={dividerAccent} />
                    <View style={rowStyle}>
                      {gi.descripcion_mercancia ? <F label={tx(lang, "mercDesc")}      value={gi.descripcion_mercancia} flex={2} /> : null}
                      {gi.pais                  ? <F label={gi.modalidad === "expo" ? (lang === "en" ? "Dest. Country" : "País Destino") : tx(lang, "countryOrigin")} value={gi.pais} /> : null}
                    </View>
                  </>
                )}
              </View>
            </View>
          )}
          {/* Impuestos si es importación */}
          {gi.modalidad !== "expo" && <TaxBlock g={gi} />}
          {gi.modalidad === "expo" && gi.requiere_cert_origen && (
            <View style={{ marginTop: 6, padding: "6 10", backgroundColor: c.BRAND_COLOR + "10", borderRadius: 4, borderLeftWidth: 2, borderLeftColor: c.BRAND_COLOR }}>
              <Text style={{ fontSize: 7.5, color: c.BRAND_COLOR, fontWeight: "bold" }}>
                ✓ {lang === "en" ? "Certificate of Origin" : "Certificado de Origen"}{gi.tipo_cert_origen ? ` — ${gi.tipo_cert_origen}` : ""}
              </Text>
            </View>
          )}
        </>
      )}

      {/* ═══ COMERCIALIZADORA ═══ */}
      {isComercializadora && gi.skus?.length > 0 && (
        <>
          <View wrap={false}>
            <PDFSectionTitle title={lang === "en" ? "Products" : "Productos"} c={c} />
            <View style={cardBrandStyle}>
              {gi.skus.map((sku: any, i: number) => (
                <View key={i}>
                  {i > 0 && <View style={dividerBrand} />}
                  <View style={rowStyle}>
                    <F label={lang === "en" ? "Product" : "Producto"} value={sku.descripcion} flex={2} />
                    <F label={lang === "en" ? "Qty" : "Cantidad"} value={`${sku.cantidad} ${sku.unidad}`} />
                    {sku.fraccion ? <F label={tx(lang, "tariffCode")} value={sku.fraccion} width={80} /> : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
          {(gi.pais_origen || gi.incoterm) && (
            <View wrap={false}>
              <View style={cardAccentStyle}>
                <View style={rowStyle}>
                  {gi.pais_origen ? <F label={tx(lang, "countryOrigin")} value={gi.pais_origen} /> : null}
                  {gi.incoterm    ? <F label={tx(lang, "incoterm")}      value={gi.incoterm} width={70} /> : null}
                  {gi.destino_entrega ? <F label={lang === "en" ? "Delivery Destination" : "Destino de entrega"} value={gi.destino_entrega} flex={2} /> : null}
                </View>
              </View>
            </View>
          )}
        </>
      )}

      {/* ═══ CONSULTORÍA ═══ */}
      {isConsultoria && gi.descripcion_general && (
        <View wrap={false}>
          <PDFSectionTitle title={lang === "en" ? "Service Description" : "Descripción del Servicio"} c={c} />
          <View style={cardBrandStyle}>
            <View style={{ padding: "10 14" }}>
              <Text style={{ fontSize: 9, color: c.TEXT_DARK, fontWeight: "bold", marginBottom: 4 }}>{gi.descripcion_general}</Text>
              {gi.alcance ? <Text style={{ fontSize: 8, color: c.TEXT_MEDIUM, lineHeight: 1.6 }}>{gi.alcance}</Text> : null}
            </View>
            {(gi.duracion_estimada || gi.modalidad || gi.lugar) && (
              <>
                <View style={dividerBrand} />
                <View style={rowStyle}>
                  {gi.duracion_estimada ? <F label={lang === "en" ? "Duration" : "Duración"} value={`${gi.duracion_estimada} ${gi.unidad_duracion || ""}`} /> : null}
                  {gi.modalidad         ? <F label={lang === "en" ? "Modality" : "Modalidad"} value={gi.modalidad.charAt(0).toUpperCase() + gi.modalidad.slice(1)} /> : null}
                  {gi.lugar             ? <F label={lang === "en" ? "Location" : "Lugar"} value={gi.lugar} flex={2} /> : null}
                </View>
              </>
            )}
            {gi.entregables?.filter((e: any) => e.descripcion).length > 0 && (
              <>
                <View style={dividerBrand} />
                <View style={{ padding: "8 14" }}>
                  <Text style={{ ...labelStyle, marginBottom: 6 }}>{lang === "en" ? "Deliverables" : "Entregables"}</Text>
                  {gi.entregables.filter((e: any) => e.descripcion).map((e: any, i: number) => (
                    <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                      <Text style={{ fontSize: 8, color: c.TEXT_DARK }}>• {e.descripcion}</Text>
                      {e.plazo ? <Text style={{ fontSize: 7.5, color: c.TEXT_MUTED }}>{e.plazo}</Text> : null}
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
