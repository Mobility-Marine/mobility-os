import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Product } from "../../types/products.types";
import type { PriceListConfig } from "../../services/pricelist.service";

const NAVY  = "#0a1628";
const BLUE  = "#1d4ed8";
const GOLD  = "#c9a227";
const LIGHT = "#f8fafc";
const MUTED = "#94a3b8";
const WHITE = "#ffffff";

const s = StyleSheet.create({
  page:      { backgroundColor: WHITE, fontSize: 9, color: NAVY },
  header:    { backgroundColor: NAVY, padding: "24 36", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goldLine:  { backgroundColor: GOLD, height: 3 },
  body:      { padding: "18 36" },
  docTitle:  { fontSize: 18, fontWeight: "bold", color: WHITE },
  docSub:    { fontSize: 9, color: MUTED, marginTop: 4 },
  catHeader: { backgroundColor: NAVY, padding: "5 10", marginBottom: 0, marginTop: 12 },
  catLabel:  { fontSize: 9, fontWeight: "bold", color: GOLD, textTransform: "uppercase", letterSpacing: 1 },
  tHead:     { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: GOLD, padding: "5 8", backgroundColor: LIGHT },
  tHeadTxt:  { fontSize: 8, fontWeight: "bold", color: NAVY, textTransform: "uppercase", letterSpacing: 0.5 },
  tRow:      { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "6 8" },
  tRowAlt:   { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: "6 8", backgroundColor: LIGHT },
  cell:      { fontSize: 8.5 },
  footer:    { backgroundColor: NAVY, padding: "10 36", marginTop: "auto" },
  fTxt:      { color: MUTED, fontSize: 7.5, textAlign: "center" },
  validBox:  { backgroundColor: "#1e3a5f", padding: "6 12", flexDirection: "row", justifyContent: "space-between", marginBottom: 8, borderRadius: 3 },
});

type Props = { products: Product[]; settings: any; config: PriceListConfig };

export default function PriceListElegante({ products, settings, config }: Props) {
  const locale = "es-MX";
  const fmt = (n: number) => `${config.currency} $${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const issuerName = settings?.fiscal_name ?? "Mobility OS";

  // Agrupar por categoría
  const grouped: Record<string, Product[]> = {};
  for (const p of products) {
    const cat = p.category ?? "General";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }

  let rowIndex = 0;

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        {/* HEADER */}
        <View style={s.header}>
          <View>
            {settings?.logo_url
              ? <Image src={settings.logo_url} style={{ width: 110, height: 40, objectFit: "contain" }} />
              : <Text style={{ fontSize: 20, fontWeight: "bold", color: WHITE }}>{issuerName}</Text>
            }
            {settings?.fiscal_rfc && <Text style={{ color: MUTED, fontSize: 8, marginTop: 4 }}>RFC: {settings.fiscal_rfc}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.docTitle}>{config.title}</Text>
            <Text style={s.docSub}>
              {new Date().toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
            </Text>
            {config.validUntil && (
              <Text style={[s.docSub, { color: GOLD, marginTop: 4 }]}>
                Vigente hasta: {new Date(config.validUntil).toLocaleDateString(locale)}
              </Text>
            )}
          </View>
        </View>
        <View style={s.goldLine} />

        <View style={s.body}>
          {/* INFO BAR */}
          {config.validUntil && (
            <View style={s.validBox}>
              <Text style={{ color: MUTED, fontSize: 8 }}>Precios vigentes al</Text>
              <Text style={{ color: GOLD, fontSize: 8, fontWeight: "bold" }}>
                {new Date(config.validUntil).toLocaleDateString(locale)}
              </Text>
            </View>
          )}

          {/* TABLE HEADER */}
          <View style={s.tHead}>
            {config.showSku   && <Text style={[s.tHeadTxt, { width: "10%" }]}>SKU</Text>}
            <Text style={[s.tHeadTxt, { flex: 1 }]}>Producto</Text>
            <Text style={[s.tHeadTxt, { width: config.showSku ? "20%" : "25%" }]}>Especificaciones</Text>
            <Text style={[s.tHeadTxt, { width: "8%", textAlign: "center" }]}>Unidad</Text>
            {config.showPrices && <Text style={[s.tHeadTxt, { width: "14%", textAlign: "right" }]}>Precio</Text>}
            {config.showIva    && config.showPrices && <Text style={[s.tHeadTxt, { width: "16%", textAlign: "right" }]}>c/IVA</Text>}
          </View>

          {/* ROWS POR CATEGORÍA */}
          {Object.entries(grouped).map(([cat, items]) => (
            <View key={cat}>
              <View style={s.catHeader}>
                <Text style={s.catLabel}>{cat}</Text>
              </View>
              {items.map((p) => {
                const isAlt   = rowIndex++ % 2 === 0;
                const priceIva = p.unit_price * (1 + (p.tax_rate ?? 16) / 100);
                return (
                  <View key={p.id} style={isAlt ? s.tRow : s.tRowAlt}>
                    {config.showSku && (
                      <Text style={[s.cell, { width: "10%", fontFamily: "Courier", color: MUTED }]}>{p.sku}</Text>
                    )}
                    <Text style={[s.cell, { flex: 1, fontWeight: "bold" }]}>{p.name}</Text>
                    <Text style={[s.cell, { width: config.showSku ? "20%" : "25%", color: MUTED, fontSize: 8 }]}>
                      {p.description ?? ""}
                    </Text>
                    <Text style={[s.cell, { width: "8%", textAlign: "center", color: MUTED }]}>{p.unit}</Text>
                    {config.showPrices && (
                      <Text style={[s.cell, { width: "14%", textAlign: "right" }]}>{fmt(p.unit_price)}</Text>
                    )}
                    {config.showIva && config.showPrices && (
                      <Text style={[s.cell, { width: "16%", textAlign: "right", fontWeight: "bold", color: BLUE }]}>
                        {fmt(priceIva)}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 14, fontStyle: "italic" }}>
            Precios sujetos a cambio sin previo aviso.{config.footerNote ? ` ${config.footerNote}` : ""}
          </Text>
        </View>

        <View style={s.footer}>
          <Text style={s.fTxt}>
            {issuerName}{settings?.fiscal_rfc ? ` · RFC: ${settings.fiscal_rfc}` : ""}
            {settings?.fiscal_city ? ` · ${settings.fiscal_city}` : ""}
          </Text>
          {settings?.quote_footer && <Text style={[s.fTxt, { marginTop: 3 }]}>{settings.quote_footer}</Text>}
        </View>
      </Page>
    </Document>
  );
}
