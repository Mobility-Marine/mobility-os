import { Document, Page, View, Text } from "@react-pdf/renderer";
import type { Quotation, CompanySettings } from "../../types/quotations.types";
import type { PDFLang } from "./shared/pdfTranslations";
import { tx } from "./shared/pdfTranslations";
import {
  getBrandColors, PDFHeader, PDFFooter,
  PDFClientBlock, PDFTotalsBlock, PDFInfoRow,
  PDFSectionTitle, PDFTermsPage,
} from "./shared/PDFShared";

type Props = { quotation: Quotation; settings?: CompanySettings | null };

export default function TemplateServicios({ quotation, settings }: Props) {
  const lang   = (quotation.language ?? "es") as PDFLang;
  const c      = getBrandColors(settings);
  const locale = lang === "en" ? "en-US" : "es-MX";
  const fmt    = (n: number) => Number(n ?? 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const gi        = (quotation as any).general_info ?? {};
  const subtype   = (quotation as any).service_subtype ?? "";
  const concepts  = quotation.billing_concepts ?? [];
  const allLines  = concepts.flatMap((c: any) =>
    (c.lines ?? []).map((l: any) => ({ ...l, currency: l.currency ?? c.currency }))
  );

  // Título según subtipo
  const SUBTYPE_TITLES: Record<string, { es: string; en: string }> = {
    terrestre_ltl:    { es: "Cotización de Flete Terrestre LTL",        en: "LTL Trucking Quotation"           },
    terrestre_ftl:    { es: "Cotización de Flete Terrestre FTL",        en: "FTL Trucking Quotation"           },
    maritimo_fcl:     { es: "Cotización de Flete Marítimo FCL",         en: "FCL Ocean Freight Quotation"      },
    maritimo_lcl:     { es: "Cotización de Flete Marítimo LCL",         en: "LCL Ocean Freight Quotation"      },
    aereo_carga:      { es: "Cotización de Flete Aéreo",                en: "Air Freight Quotation"            },
    aereo_courier:    { es: "Cotización Courier / Paquetería",          en: "Courier / Express Quotation"      },
    impo_integral:    { es: "Cotización de Importación Integral",       en: "Import Customs Quotation"         },
    expo_integral:    { es: "Cotización de Exportación Integral",       en: "Export Customs Quotation"         },
    comercializadora: { es: "Cotización Comercializadora",              en: "Trading Company Quotation"        },
    op_completa:      { es: "Cotización de Operación Completa",         en: "Full Operation Quotation"         },
    consultoria:      { es: "Cotización de Consultoría",                en: "Consulting Services Quotation"    },
  };
  const subtitle = SUBTYPE_TITLES[subtype]?.[lang] ?? tx(lang, "serviceQuote");

  return (
    <Document>
      <Page size="LETTER" style={{ backgroundColor: c.WHITE, fontSize: 9, color: c.TEXT_DARK, display: "flex", flexDirection: "column" }}>
        <PDFHeader quotation={quotation} settings={settings} lang={lang} subtitle={subtitle} />

        <View style={{ flex: 1, paddingTop: 20, paddingBottom: 16, paddingLeft: 36, paddingRight: 36 }}>
          {/* CLIENTE */}
          <PDFClientBlock quotation={quotation} lang={lang} settings={settings} />

          {/* INFO GENERAL DEL SUBTIPO */}
          {subtype && Object.keys(gi).length > 0 && (
            <GeneralInfoSection gi={gi} subtype={subtype} lang={lang} c={c} fmt={fmt} />
          )}

          {/* SERVICIOS — líneas flat */}
          <PDFSectionTitle title={tx(lang, "services")} c={c} />
          {allLines.map((line: any, i: number) => {
            const taxRate  = line.tax_rate;
            const isExento = taxRate === -1;
            const isTasa0  = taxRate === 0;
            const taxLabel = isExento ? tx(lang, "exempt") : isTasa0 ? tx(lang, "zeroRate") : `${tx(lang, "tax")} ${taxRate ?? 16}%`;
            return (
              <View key={i} style={{ backgroundColor: c.LIGHT, borderLeftWidth: 3, borderLeftColor: c.BRAND_COLOR, padding: "10 14", marginBottom: 6, borderRadius: 3 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <View style={{ flexDirection: "row", gap: 6, marginBottom: 3 }}>
                      <View style={{ backgroundColor: c.BRAND_COLOR + "30", borderRadius: 2, padding: "2 5" }}>
                        <Text style={{ fontSize: 6.5, color: c.BRAND_COLOR, fontWeight: "bold", textTransform: "uppercase" }}>{line.service_type}</Text>
                      </View>
                      <View style={{ backgroundColor: isExento ? "#e2e8f0" : isTasa0 ? "#dcfce7" : "#fef9c3", borderRadius: 2, padding: "2 5" }}>
                        <Text style={{ fontSize: 6.5, color: isExento ? c.TEXT_MUTED : isTasa0 ? "#166534" : "#854d0e", fontWeight: "bold" }}>{taxLabel}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 9.5, color: c.TEXT_DARK, fontWeight: "bold", marginBottom: 3 }}>{line.description}</Text>
                    {line.notes && <Text style={{ fontSize: 7, color: c.TEXT_MUTED, fontStyle: "italic" }}>{line.notes}</Text>}
                  </View>
                  <View style={{ alignItems: "flex-end", flexShrink: 0, minWidth: 80 }}>
                    <Text style={{ fontSize: 11, fontWeight: "bold", color: c.TEXT_DARK }}>{(line.currency ?? quotation.currency)} ${fmt(Number(line.price ?? 0))}</Text>
                  </View>
                </View>
              </View>
            );
          })}

          {/* TOTALES */}
          <PDFTotalsBlock quotation={quotation} lang={lang} settings={settings} allLines={allLines} />

          {/* NOTAS */}
          {quotation.notes && (
            <View style={{ marginTop: 16 }}>
              <PDFSectionTitle title={tx(lang, "notes")} c={c} />
              <View style={{ backgroundColor: "#f1f5f9", borderRadius: 4, padding: "12 16", borderLeftWidth: 3, borderLeftColor: c.BRAND_COLOR }}>
                <Text style={{ fontSize: 8, color: c.TEXT_MEDIUM, lineHeight: 1.7 }}>{quotation.notes}</Text>
              </View>
            </View>
          )}
        </View>

        <PDFFooter settings={settings} lang={lang} />
      </Page>

      {/* TÉRMINOS */}
      {(() => {
        const termsText = (quotation.terms && quotation.terms.trim())
          ? quotation.terms
          : ((settings as any)?.quote_terms_services ?? null);
        if (!termsText) return null;
        return (
          <Page size="LETTER" style={{ backgroundColor: c.WHITE, fontSize: 9, color: c.TEXT_DARK, display: "flex", flexDirection: "column" }}>
            <PDFTermsPage quotation={quotation} lang={lang} settings={settings} />
            <PDFFooter settings={settings} lang={lang} />
          </Page>
        );
      })()}
    </Document>
  );
}

// ── Sección de info general según subtipo ─────────────────────
function GeneralInfoSection({ gi, subtype, lang, c, fmt }: any) {
  const isTerrestre  = subtype.startsWith("terrestre");
  const isMaritimo   = subtype.startsWith("maritimo");
  const isAereo      = subtype.startsWith("aereo");
  const isAduanal    = subtype === "impo_integral" || subtype === "expo_integral";
    const isOpCompleta = subtype === "op_completa";

  return (
    <View style={{ marginBottom: 14 }}>
      {/* TERRESTRE */}
      {isTerrestre && gi.rutas?.length > 0 && (
        <>
          <PDFSectionTitle title={tx(lang, "routes")} c={c} />
          {gi.rutas.map((r: any, i: number) => (
            <View key={i} style={{ flexDirection: "row", gap: 16, padding: "6 10", backgroundColor: c.LIGHT, borderRadius: 3, marginBottom: 4 }}>
              <Text style={{ fontSize: 8, color: c.TEXT_DARK, flex: 1 }}><Text style={{ fontWeight: "bold" }}>{tx(lang, "origin")}:</Text> {r.origen}</Text>
              <Text style={{ fontSize: 8, color: c.TEXT_DARK, flex: 1 }}><Text style={{ fontWeight: "bold" }}>{tx(lang, "destination")}:</Text> {r.destino}</Text>
              {r.incoterm && <Text style={{ fontSize: 8, color: c.TEXT_MUTED }}>{r.incoterm}</Text>}
            </View>
          ))}
          <View style={{ flexDirection: "row", gap: 20, marginTop: 4 }}>
            {gi.mercancia && <PDFInfoRow label={tx(lang, "cargo")} value={gi.mercancia} c={c} />}
            {gi.peso_kg   && <PDFInfoRow label={tx(lang, "weight")} value={`${gi.peso_kg.toLocaleString()} kg`} c={c} />}
            {gi.tipo_unidad && <PDFInfoRow label={tx(lang, "unitType")} value={`${gi.tipo_unidad}${gi.cantidad_unidades ? ` × ${gi.cantidad_unidades}` : ""}`} c={c} />}
          </View>
        </>
      )}

      {/* MARÍTIMO */}
      {isMaritimo && (
        <>
          <PDFSectionTitle title={subtype === "maritimo_fcl" ? tx(lang, "containers") : "LCL"} c={c} />
          <View style={{ flexDirection: "row", gap: 20, flexWrap: "wrap" }}>
            {gi.puerto_origen  && <PDFInfoRow label={tx(lang, "originPort")}  value={gi.puerto_origen}  c={c} />}
            {gi.puerto_destino && <PDFInfoRow label={tx(lang, "destPort")}    value={gi.puerto_destino} c={c} />}
            {gi.incoterm       && <PDFInfoRow label={tx(lang, "incoterm")}    value={gi.incoterm}       c={c} />}
            {gi.mercancia      && <PDFInfoRow label={tx(lang, "cargo")}       value={gi.mercancia}      c={c} />}
            {gi.peso_kg        && <PDFInfoRow label={tx(lang, "weight")}      value={`${gi.peso_kg.toLocaleString()} kg`} c={c} />}
          </View>
          {subtype === "maritimo_fcl" && gi.contenedores?.length > 0 && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              {gi.contenedores.map((ct: any, i: number) => (
                <View key={i} style={{ backgroundColor: c.BRAND_COLOR, borderRadius: 4, padding: "4 10" }}>
                  <Text style={{ fontSize: 8, color: c.BRAND_TEXT, fontWeight: "bold" }}>{ct.cantidad} × {ct.tipo}</Text>
                </View>
              ))}
            </View>
          )}
          {subtype === "maritimo_lcl" && gi.bultos?.length > 0 && (
            <View style={{ marginTop: 6 }}>
              <PDFInfoRow label={tx(lang, "cbm")} value={`${gi.bultos.reduce((s: number, b: any) => s + (b.largo_cm * b.ancho_cm * b.alto_cm / 1_000_000) * b.cantidad, 0).toFixed(3)} m³`} c={c} />
            </View>
          )}
        </>
      )}

      {/* AÉREO */}
      {isAereo && (
        <>
          <PDFSectionTitle title={subtype === "aereo_carga" ? tx(lang, "services") : "Courier"} c={c} />
          <View style={{ flexDirection: "row", gap: 20, flexWrap: "wrap" }}>
            {gi.aeropuerto_origen  && <PDFInfoRow label={tx(lang, "originAirport")}    value={gi.aeropuerto_origen}  c={c} />}
            {gi.aeropuerto_destino && <PDFInfoRow label={tx(lang, "destAirport")}      value={gi.aeropuerto_destino} c={c} />}
            {gi.mercancia          && <PDFInfoRow label={tx(lang, "cargo")}            value={gi.mercancia}          c={c} />}
            {gi.incoterm           && <PDFInfoRow label={tx(lang, "incoterm")}         value={gi.incoterm}           c={c} />}
            {gi.carrier            && <PDFInfoRow label={tx(lang, "carrier")}          value={gi.carrier}            c={c} />}
            {gi.peso_cobrable_kg   && <PDFInfoRow label={tx(lang, "chargeableWeight")} value={`${gi.peso_cobrable_kg.toFixed(2)} kg`} c={c} />}
          </View>
        </>
      )}

      {/* ADUANAL */}
      {isAduanal && (
        <>
          <PDFSectionTitle title={tx(lang, "customs")} c={c} />
          <View style={{ flexDirection: "row", gap: 20, flexWrap: "wrap" }}>
            {gi.aduana_nombre       && <PDFInfoRow label={tx(lang, "customsOffice")} value={`${gi.aduana_nombre} (${gi.aduana_clave_sat})`} c={c} />}
            {gi.fraccion_arancelaria && <PDFInfoRow label={tx(lang, "tariffCode")}   value={gi.fraccion_arancelaria} c={c} />}
            {gi.descripcion_mercancia && <PDFInfoRow label={tx(lang, "mercDesc")}    value={gi.descripcion_mercancia} c={c} />}
            {gi.incoterm             && <PDFInfoRow label={tx(lang, "incoterm")}     value={gi.incoterm}             c={c} />}
            {gi.pais_origen_destino  && <PDFInfoRow label={tx(lang, "countryOrigin")} value={gi.pais_origen_destino} c={c} />}
          </View>
        </>
      )}
    </View>
  );
}
