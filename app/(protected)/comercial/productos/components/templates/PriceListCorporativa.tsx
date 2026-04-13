import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Product } from "../../types/products.types";
import type { PriceListConfig } from "../../services/pricelist.service";

const CORP   = "#16213e";
const ACCENT = "#0f3460";
const WHITE  = "#ffffff";
const MID    = "#666666";
const BORDER = "#cccccc";
const ALT    = "#f5f5f5";

const s = StyleSheet.create({
  page:     { backgroundColor: WHITE, fontSize: 9, color: CORP },
  header:   { backgroundColor: CORP, padding: "20 28", flexDirection: "row", justifyContent: "space-between" },
  divider:  { height: 3, backgroundColor: ACCENT },
  infoBar:  { backgroundColor: ALT, padding: "8 28", flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: BORDER },
  body:     { padding: "14 28" },
  catHeader:{ flexDirection: "row", backgroundColor: ACCENT, padding: "5 8", marginTop: 10 },
  catLabel: { color: WHITE, fontSize: 8.5, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 },
  tHead:    { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, padding: "5 8", backgroundColor: ALT },
  tHeadTxt: { fontSize: 7.5, fontWeight: "bold", color: MID, textTransform: "uppercase" },
  tRow:     { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, padding: "5 8" },
  tRowAlt:  { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, padding: "5 8", backgroundColor: ALT },
  cell:     { fontSize: 8.5 },
  footer:   { borderTopWidth: 1, borderTopColor: BORDER, padding: "8 28" },
  fTxt:     { fontSize: 7.5, color: MID, textAlign: "center" },
});

type Props = { products: Product[]; settings: any; config: PriceListConfig };

export default function PriceListCorporativa({ products, settings, config }: Props) {
  const locale     = "es-MX";
  const fmt = (n: number) => `${config.currency} $${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const issuerName = settings?.fiscal_name ?? "Mobility OS";

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
            <Text style={{ fontSize: 8, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              Lista de precios
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: WHITE }}>{config.title}</Text>
            <Text style={{ fontSize: 7.5, color: "#94a3b8", marginTop: 3 }}>
              {new Date().toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
            </Text>
          </View>
        </View>
        <View style={s.divider} />

        <View style={s.infoBar}>
          {[
            { l: "RFC Emisor",  v: settings?.fiscal_rfc ?? "—" },
            { l: "Ciudad",      v: settings?.fiscal_city ?? "—" },
            { l: "Vigencia",    v: config.validUntil ? new Date(config.validUntil).toLocaleDateString(locale) : "Hasta nuevo aviso" },
            { l: "Moneda",      v: config.currency },
            { l: "Productos",   v: String(products.length) },
          ].map((r) => (
            <View key={r.l}>
              <Text style={{ fontSize: 7, color: MID, textTransform: "uppercase" }}>{r.l}</Text>
              <Text style={{ fontSize: 8.5, fontWeight: "bold", color: CORP }}>{r.v}</Text>
            </View>
          ))}
        </View>

        <View style={s.body}>
          {Object.entries(grouped).map(([cat, items]) => (
            <View key={cat}>
              <View style={s.catHeader}>
                <Text style={s.catLabel}>{cat} ({items.length})</Text>
              </View>
              <View style={s.tHead}>
                {config.showSku   && <Text style={[s.tHeadTxt, { width: "10%" }]}>SKU</Text>}
                <Text style={[s.tHeadTxt, { flex: 1 }]}>Producto / Descripción</Text>
                <Text style={[s.tHeadTxt, { width: "8%",  textAlign: "center" }]}>Unidad</Text>
                {config.showPrices && <Text style={[s.tHeadTxt, { width: "15%", textAlign: "right" }]}>Precio neto</Text>}
                {config.showIva && config.showPrices && <Text style={[s.tHeadTxt, { width: "8%",  textAlign: "center" }]}>IVA</Text>}
                {config.showIva && config.showPrices && <Text style={[s.tHeadTxt, { width: "15%", textAlign: "right" }]}>Total c/IVA</Text>}
              </View>
              {items.map((p) => {
                const isAlt    = rowIndex++ % 2 === 0;
                const priceIva = p.unit_price * (1 + (p.tax_rate ?? 16) / 100);
                return (
                  <View key={p.id} style={isAlt ? s.tRow : s.tRowAlt}>
                    {config.showSku && <Text style={[s.cell, { width: "10%", color: MID }]}>{p.sku}</Text>}
                    <View style={{ flex: 1 }}>
                      <Text style={[s.cell, { fontWeight: "bold" }]}>{p.name}</Text>
                      {p.description && <Text style={[s.cell, { color: MID, fontSize: 7.5 }]}>{p.description}</Text>}
                    </View>
                    <Text style={[s.cell, { width: "8%",  textAlign: "center", color: MID }]}>{p.unit}</Text>
                    {config.showPrices && (
                      <Text style={[s.cell, { width: "15%", textAlign: "right" }]}>{fmt(p.unit_price)}</Text>
                    )}
                    {config.showIva && config.showPrices && (
                      <Text style={[s.cell, { width: "8%",  textAlign: "center", color: MID }]}>{p.tax_rate ?? 16}%</Text>
                    )}
                    {config.showIva && config.showPrices && (
                      <Text style={[s.cell, { width: "15%", textAlign: "right", fontWeight: "bold" }]}>{fmt(priceIva)}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          <Text style={{ fontSize: 7.5, color: MID, marginTop: 14 }}>
            Precios sujetos a cambio sin previo aviso.{config.footerNote ? ` ${config.footerNote}` : ""}
          </Text>
        </View>

        <View style={s.footer}>
          <Text style={s.fTxt}>{issuerName} · {settings?.fiscal_rfc ?? ""} · {settings?.fiscal_address ?? ""}</Text>
          {settings?.quote_footer && <Text style={[s.fTxt, { marginTop: 3 }]}>{settings.quote_footer}</Text>}
        </View>
      </Page>
    </Document>
  );
}
