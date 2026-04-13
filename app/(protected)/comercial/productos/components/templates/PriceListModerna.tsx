import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Product } from "../../types/products.types";
import type { PriceListConfig } from "../../services/pricelist.service";

const BLUE   = "#2563eb";
const DARK   = "#0f172a";
const MID    = "#475569";
const LIGHT  = "#f1f5f9";
const WHITE  = "#ffffff";
const BORDER = "#e2e8f0";
const GREEN  = "#16a34a";

const s = StyleSheet.create({
  page:     { backgroundColor: WHITE, fontSize: 9, color: DARK },
  topBar:   { backgroundColor: BLUE, height: 5 },
  header:   { padding: "20 40", flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: BORDER },
  body:     { padding: "16 40" },
  docTitle: { fontSize: 20, fontWeight: "bold", color: DARK },
  docSub:   { fontSize: 8.5, color: MID, marginTop: 3 },
  catLabel: { fontSize: 9, fontWeight: "bold", color: BLUE, textTransform: "uppercase", letterSpacing: 1, padding: "8 0 4 0", borderBottomWidth: 2, borderBottomColor: BLUE, marginTop: 12, marginBottom: 0 },
  tHead:    { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, paddingVertical: 5 },
  tHeadTxt: { fontSize: 8, fontWeight: "bold", color: MID, textTransform: "uppercase" },
  tRow:     { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, paddingVertical: 5 },
  tRowAlt:  { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, paddingVertical: 5, backgroundColor: LIGHT },
  cell:     { fontSize: 8.5 },
  footer:   { borderTopWidth: 1, borderTopColor: BORDER, padding: "10 40", flexDirection: "row", justifyContent: "space-between" },
  fTxt:     { fontSize: 7.5, color: MID },
});

type Props = { products: Product[]; settings: any; config: PriceListConfig };

export default function PriceListModerna({ products, settings, config }: Props) {
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
        <View style={s.topBar} />

        <View style={s.header}>
          <View>
            {settings?.logo_url
              ? <Image src={settings.logo_url} style={{ width: 100, height: 35, objectFit: "contain" }} />
              : <Text style={{ fontSize: 18, fontWeight: "bold", color: DARK }}>{issuerName}</Text>
            }
            <Text style={{ fontSize: 7.5, color: MID, marginTop: 3 }}>RFC: {settings?.fiscal_rfc ?? "—"}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.docTitle}>{config.title}</Text>
            <Text style={s.docSub}>{new Date().toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}</Text>
            {config.validUntil && (
              <Text style={[s.docSub, { color: BLUE, marginTop: 3 }]}>
                Vigente hasta: {new Date(config.validUntil).toLocaleDateString(locale)}
              </Text>
            )}
          </View>
        </View>

        <View style={s.body}>
          {Object.entries(grouped).map(([cat, items]) => (
            <View key={cat}>
              <Text style={s.catLabel}>{cat}</Text>
              <View style={s.tHead}>
                {config.showSku   && <Text style={[s.tHeadTxt, { width: "10%" }]}>SKU</Text>}
                <Text style={[s.tHeadTxt, { flex: 1 }]}>Producto</Text>
                <Text style={[s.tHeadTxt, { width: "22%" }]}>Especificaciones</Text>
                <Text style={[s.tHeadTxt, { width: "8%", textAlign: "center" }]}>Unidad</Text>
                {config.showPrices && <Text style={[s.tHeadTxt, { width: "14%", textAlign: "right" }]}>Precio</Text>}
                {config.showIva && config.showPrices && <Text style={[s.tHeadTxt, { width: "16%", textAlign: "right" }]}>c/IVA</Text>}
              </View>
              {items.map((p) => {
                const isAlt   = rowIndex++ % 2 === 0;
                const priceIva = p.unit_price * (1 + (p.tax_rate ?? 16) / 100);
                return (
                  <View key={p.id} style={isAlt ? s.tRow : s.tRowAlt}>
                    {config.showSku && <Text style={[s.cell, { width: "10%", color: MID }]}>{p.sku}</Text>}
                    <Text style={[s.cell, { flex: 1, fontWeight: "bold" }]}>{p.name}</Text>
                    <Text style={[s.cell, { width: "22%", color: MID, fontSize: 8 }]}>{p.description ?? ""}</Text>
                    <Text style={[s.cell, { width: "8%", textAlign: "center", color: MID }]}>{p.unit}</Text>
                    {config.showPrices && (
                      <Text style={[s.cell, { width: "14%", textAlign: "right" }]}>{fmt(p.unit_price)}</Text>
                    )}
                    {config.showIva && config.showPrices && (
                      <Text style={[s.cell, { width: "16%", textAlign: "right", fontWeight: "bold", color: GREEN }]}>
                        {fmt(priceIva)}
                      </Text>
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
          <Text style={s.fTxt}>{issuerName} · {settings?.fiscal_rfc ?? ""}</Text>
          <Text style={s.fTxt}>{settings?.quote_footer ?? ""}</Text>
        </View>
      </Page>
    </Document>
  );
}
