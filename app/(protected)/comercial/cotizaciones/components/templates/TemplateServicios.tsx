import { Document, Page, View, Text } from "@react-pdf/renderer";
import type { Quotation, CompanySettings } from "../../types/quotations.types";
import type { PDFLang } from "./shared/pdfTranslations";
import { tx } from "./shared/pdfTranslations";
import { getBrandColors, PDFHeader, PDFFooter, PDFClientBlock, PDFInfoRow, PDFSectionTitle, PDFTermsPage } from "./shared/PDFShared";

type Props = { quotation: Quotation; settings?: CompanySettings | null };

const FOOTER_HEIGHT = 56;

export default function TemplateServicios({ quotation, settings }: Props) {
  const lang    = (quotation.language ?? "es") as PDFLang;
  const c       = getBrandColors(settings);
  const locale  = lang === "en" ? "en-US" : "es-MX";
  const fmt     = (n: number) => Number(n ?? 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const gi       = (quotation as any).general_info ?? {};
  const subtype  = (quotation as any).service_subtype ?? "";
  const concepts = (quotation as any).billing_concepts ?? [];
  const allLines = concepts.flatMap((c: any) =>
    (c.lines ?? []).map((l: any) => ({ ...l, currency: l.currency ?? c.currency }))
  );

  // Totales por moneda calculados desde líneas individuales
  const byCurrency: Record<string, { subtotal: number; tax: number; total: number }> = {};
  for (const line of allLines) {
    const cur   = line.currency ?? quotation.currency ?? "MXN";
    const price = Number(line.price ?? 0);
    const rate  = line.tax_rate;
    const tax   = (rate === null || rate === undefined || rate === -1 || rate === 0) ? 0 : price * (rate / 100);
    if (!byCurrency[cur]) byCurrency[cur] = { subtotal: 0, tax: 0, total: 0 };
    byCurrency[cur].subtotal += price;
    byCurrency[cur].tax      += tax;
    byCurrency[cur].total    += price + tax;
  }

  const SUBTYPE_TITLES: Record<string, { es: string; en: string }> = {
    terrestre_ltl:    { es: "Cotización Terrestre LTL",          en: "LTL Trucking Quotation"        },
    terrestre_ftl:    { es: "Cotización Terrestre FTL",          en: "FTL Trucking Quotation"        },
    maritimo_fcl:     { es: "Cotización Marítima FCL",           en: "FCL Ocean Freight Quotation"   },
    maritimo_lcl:     { es: "Cotización Marítima LCL",           en: "LCL Ocean Freight Quotation"   },
    aereo_carga:      { es: "Cotización Aérea",                  en: "Air Freight Quotation"         },
    aereo_courier:    { es: "Cotización Courier",                en: "Courier Quotation"             },
    impo_integral:    { es: "Cotización Importación Integral",   en: "Import Quotation"              },
    expo_integral:    { es: "Cotización Exportación Integral",   en: "Export Quotation"              },
    comercializadora: { es: "Cotización Comercializadora",       en: "Trading Quotation"             },
    op_completa:      { es: "Cotización Operación Completa",     en: "Full Operation Quotation"      },
    consultoria:      { es: "Cotización de Consultoría",         en: "Consulting Quotation"          },
  };
  const subtitle = SUBTYPE_TITLES[subtype]?.[lang] ?? tx(lang, "serviceQuote");

  const termsText = (quotation.terms && quotation.terms.trim())
    ? quotation.terms
    : ((settings as any)?.quote_terms_services ?? null);

  return (
    <Document>
      <Page
        size="LETTER"
        style={{ backgroundColor: c.WHITE, fontSize: 9, color: c.TEXT_DARK, paddingBottom: FOOTER_HEIGHT + 10 }}
      >
        {/* Header fijo — se repite en cada página */}
        <View fixed>
          <PDFHeader quotation={quotation} settings={settings} lang={lang} subtitle={subtitle} />
        </View>

        {/* Contenido — fluye entre páginas automáticamente */}
        <View style={{ paddingTop: 20, paddingLeft: 36, paddingRight: 36 }}>

          {/* CLIENTE */}
          <PDFClientBlock quotation={quotation} lang={lang} settings={settings} />

          {/* INFO GENERAL DEL SUBTIPO */}
          {subtype && Object.keys(gi).length > 0 && (
            <GeneralInfoBlock gi={gi} subtype={subtype} lang={lang} c={c} fmt={fmt} />
          )}

          {/* SERVICIOS */}
          <PDFSectionTitle title={tx(lang, "services")} c={c} />
          {allLines.map((line: any, i: number) => {
            const taxRate  = line.tax_rate;
            const isExento = taxRate === -1;
            const isTasa0  = taxRate === 0;
            const taxLabel = isExento ? tx(lang, "exempt") : isTasa0 ? tx(lang, "zeroRate") : `${tx(lang, "tax")} ${taxRate ?? 16}%`;
            return (
              <View key={i} style={{ backgroundColor: c.LIGHT, borderLeftWidth: 3, borderLeftColor: c.BRAND_COLOR, padding: "8 12", marginBottom: 5, borderRadius: 3 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: "row", gap: 5, marginBottom: 2 }}>
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
                    <Text style={{ fontSize: 9, color: c.TEXT_DARK, fontWeight: "bold", marginBottom: 2 }}>{line.description}</Text>
                    {line.notes && <Text style={{ fontSize: 7, color: c.TEXT_MUTED, fontStyle: "italic" }}>{line.notes}</Text>}
                  </View>
                  <View style={{ alignItems: "flex-end", flexShrink: 0, minWidth: 80 }}>
                    <Text style={{ fontSize: 10, fontWeight: "bold", color: c.TEXT_DARK }}>{(line.currency ?? quotation.currency)} ${fmt(Number(line.price ?? 0))}</Text>
                  </View>
                </View>
              </View>
            );
          })}

          {/* TOTALES POR MONEDA — un solo bloque */}
          <View style={{ alignSelf: "flex-end", marginTop: 12, minWidth: 260 }}>
            <View style={{ backgroundColor: c.BRAND_COLOR, borderRadius: 6, padding: "14 18" }}>
              {Object.entries(byCurrency).map(([cur, ct], i) => (
                <View key={cur}>
                  {Object.keys(byCurrency).length > 1 && (
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
                    <Text style={{ fontSize: 11, color: c.ACCENT, fontWeight: "bold" }}>TOTAL {Object.keys(byCurrency).length > 1 ? cur : ""}</Text>
                    <Text style={{ fontSize: 11, color: c.ACCENT, fontWeight: "bold" }}>{cur} ${fmt(ct.total)}</Text>
                  </View>
                  {i < Object.keys(byCurrency).length - 1 && (
                    <View style={{ borderTopWidth: 1, borderTopColor: c.BORDER_COLOR, marginTop: 10, marginBottom: 10 }} />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* NOTAS */}
          {quotation.notes && (
            <View style={{ marginTop: 14 }}>
              <PDFSectionTitle title={tx(lang, "notes")} c={c} />
              <View style={{ backgroundColor: "#f1f5f9", borderRadius: 4, padding: "10 14", borderLeftWidth: 3, borderLeftColor: c.BRAND_COLOR }}>
                <Text style={{ fontSize: 8, color: c.TEXT_MEDIUM, lineHeight: 1.7 }}>{quotation.notes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer fijo — se repite en cada página */}
        <View fixed style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
          <PDFFooter settings={settings} lang={lang} />
        </View>
      </Page>

      {/* PÁGINA DE TÉRMINOS */}
      {termsText && (
        <Page size="LETTER" style={{ backgroundColor: c.WHITE, fontSize: 9, color: c.TEXT_DARK, paddingBottom: FOOTER_HEIGHT + 10 }}>
          <View fixed>
            <PDFHeader quotation={quotation} settings={settings} lang={lang} subtitle={subtitle} />
          </View>
          <PDFTermsPage quotation={quotation} lang={lang} settings={settings} />
          <View fixed style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
            <PDFFooter settings={settings} lang={lang} />
          </View>
        </Page>
      )}
    </Document>
  );
}

// ── Info General por subtipo ──────────────────────────────────
function GeneralInfoBlock({ gi, subtype, lang, c, fmt }: any) {
  const isTerrestre = subtype.startsWith("terrestre");
  const isMaritimo  = subtype.startsWith("maritimo");
  const isAereo     = subtype.startsWith("aereo");
  const isAduanal   = subtype === "impo_integral" || subtype === "expo_integral";

  return (
    <View style={{ marginBottom: 12 }}>
      {/* TERRESTRE */}
      {isTerrestre && gi.rutas?.length > 0 && (
        <View>
          <PDFSectionTitle title={tx(lang, "routes")} c={c} />
          {gi.rutas.map((r: any, i: number) => (
            <View key={i} style={{ flexDirection: "row", gap: 12, padding: "5 8", backgroundColor: c.LIGHT, borderRadius: 3, marginBottom: 3 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 7, color: c.TEXT_MUTED, textTransform: "uppercase" }}>{tx(lang, "origin")}</Text>
                <Text style={{ fontSize: 8.5, color: c.TEXT_DARK, fontWeight: "bold" }}>{r.origen}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 7, color: c.TEXT_MUTED, textTransform: "uppercase" }}>{tx(lang, "destination")}</Text>
                <Text style={{ fontSize: 8.5, color: c.TEXT_DARK, fontWeight: "bold" }}>{r.destino}</Text>
              </View>
              {r.incoterm && (
                <View style={{ width: 60 }}>
                  <Text style={{ fontSize: 7, color: c.TEXT_MUTED, textTransform: "uppercase" }}>{tx(lang, "incoterm")}</Text>
                  <Text style={{ fontSize: 8.5, color: c.TEXT_DARK, fontWeight: "bold" }}>{r.incoterm}</Text>
                </View>
              )}
            </View>
          ))}
          <View style={{ flexDirection: "row", gap: 20, marginTop: 4, flexWrap: "wrap" }}>
            {gi.mercancia && (
              <View>
                <Text style={{ fontSize: 7, color: c.TEXT_MUTED, textTransform: "uppercase" }}>{tx(lang, "cargo")}</Text>
                <Text style={{ fontSize: 8, color: c.TEXT_DARK }}>{gi.mercancia}</Text>
              </View>
            )}
            {gi.peso_kg && (
              <View>
                <Text style={{ fontSize: 7, color: c.TEXT_MUTED, textTransform: "uppercase" }}>{tx(lang, "weight")}</Text>
                <Text style={{ fontSize: 8, color: c.TEXT_DARK }}>{Number(gi.peso_kg).toLocaleString()} kg</Text>
              </View>
            )}
            {gi.tipo_unidad && (
              <View>
                <Text style={{ fontSize: 7, color: c.TEXT_MUTED, textTransform: "uppercase" }}>{tx(lang, "unitType")}</Text>
                <Text style={{ fontSize: 8, color: c.TEXT_DARK }}>{gi.tipo_unidad}{gi.cantidad_unidades && gi.cantidad_unidades > 1 ? ` × ${gi.cantidad_unidades}` : ""}</Text>
              </View>
            )}
            {gi.volumen_m3 && (
              <View>
                <Text style={{ fontSize: 7, color: c.TEXT_MUTED, textTransform: "uppercase" }}>{tx(lang, "volume")}</Text>
                <Text style={{ fontSize: 8, color: c.TEXT_DARK }}>{gi.volumen_m3} m³</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* MARÍTIMO */}
      {isMaritimo && (
        <View>
          <PDFSectionTitle title={subtype === "maritimo_fcl" ? `FCL — ${tx(lang, "containers")}` : "LCL"} c={c} />
          <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap", marginBottom: 6 }}>
            {gi.puerto_origen  && <PDFInfoRow label={tx(lang, "originPort")}  value={gi.puerto_origen}  c={c} />}
            {gi.puerto_destino && <PDFInfoRow label={tx(lang, "destPort")}    value={gi.puerto_destino} c={c} />}
            {gi.incoterm       && <PDFInfoRow label={tx(lang, "incoterm")}    value={gi.incoterm}       c={c} />}
            {gi.mercancia      && <PDFInfoRow label={tx(lang, "cargo")}       value={gi.mercancia}      c={c} />}
            {gi.peso_kg        && <PDFInfoRow label={tx(lang, "weight")}      value={`${Number(gi.peso_kg).toLocaleString()} kg`} c={c} />}
          </View>
          {subtype === "maritimo_fcl" && gi.contenedores?.length > 0 && (
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {gi.contenedores.map((ct: any, i: number) => (
                <View key={i} style={{ backgroundColor: c.BRAND_COLOR, borderRadius: 4, padding: "3 8" }}>
                  <Text style={{ fontSize: 8, color: c.BRAND_TEXT, fontWeight: "bold" }}>{ct.cantidad} × {ct.tipo}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* AÉREO */}
      {isAereo && (
        <View>
          <PDFSectionTitle title={subtype === "aereo_carga" ? tx(lang, "services") : "Courier"} c={c} />
          <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
            {gi.aeropuerto_origen  && <PDFInfoRow label={tx(lang, "originAirport")}    value={gi.aeropuerto_origen}  c={c} />}
            {gi.aeropuerto_destino && <PDFInfoRow label={tx(lang, "destAirport")}      value={gi.aeropuerto_destino} c={c} />}
            {gi.mercancia          && <PDFInfoRow label={tx(lang, "cargo")}            value={gi.mercancia}          c={c} />}
            {gi.incoterm           && <PDFInfoRow label={tx(lang, "incoterm")}         value={gi.incoterm}           c={c} />}
            {gi.carrier            && <PDFInfoRow label={tx(lang, "carrier")}          value={gi.carrier}            c={c} />}
            {gi.peso_cobrable_kg   && <PDFInfoRow label={tx(lang, "chargeableWeight")} value={`${Number(gi.peso_cobrable_kg).toFixed(2)} kg`} c={c} />}
          </View>
        </View>
      )}

      {/* ADUANAL */}
      {isAduanal && (
        <View>
          <PDFSectionTitle title={tx(lang, "customs")} c={c} />
          <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
            {gi.aduana_nombre        && <PDFInfoRow label={tx(lang, "customsOffice")} value={`${gi.aduana_nombre} (${gi.aduana_clave_sat})`} c={c} />}
            {gi.fraccion_arancelaria && <PDFInfoRow label={tx(lang, "tariffCode")}    value={gi.fraccion_arancelaria}  c={c} />}
            {gi.descripcion_mercancia && <PDFInfoRow label={tx(lang, "mercDesc")}     value={gi.descripcion_mercancia} c={c} />}
            {gi.incoterm             && <PDFInfoRow label={tx(lang, "incoterm")}      value={gi.incoterm}              c={c} />}
            {gi.pais_origen_destino  && <PDFInfoRow label={tx(lang, "countryOrigin")} value={gi.pais_origen_destino}  c={c} />}
          </View>
        </View>
      )}
    </View>
  );
}
