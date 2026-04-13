// ============================================================
// PRICELIST SERVICE v1
// Filtra productos por cliente (historial de cotizaciones)
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type { Product } from "../types/products.types";

// Clientes que tienen cotizaciones con productos
export async function fetchClientsWithProductHistory(
  companyId: string
): Promise<{ id: string; name: string; count: number }[]> {
  const { data } = await supabase
    .from("quotations")
    .select("client_id, client_name, clients(name)")
    .eq("company_id", companyId)
    .eq("type", "products")
    .not("client_id", "is", null);

  if (!data?.length) return [];

  const map = new Map<string, { id: string; name: string; count: number }>();
  for (const q of data) {
    const id   = q.client_id!;
    const name = (q.clients as any)?.name ?? q.client_name ?? id.slice(0, 8);
    if (map.has(id)) {
      map.get(id)!.count++;
    } else {
      map.set(id, { id, name, count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// SKUs cotizados a un cliente específico
export async function fetchProductsQuotedToClient(
  companyId: string, clientId: string
): Promise<string[]> {
  const { data: quotations } = await supabase
    .from("quotations")
    .select("id")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .eq("type", "products");

  if (!quotations?.length) return [];

  const quotationIds = quotations.map((q) => q.id);

  const { data: items } = await supabase
    .from("quotation_items")
    .select("product_id")
    .in("quotation_id", quotationIds)
    .not("product_id", "is", null);

  if (!items?.length) return [];

  return [...new Set(items.map((i) => i.product_id).filter(Boolean))];
}

// Generar y descargar PDF de lista de precios
export async function generateAndDownloadPriceList(
  products:   Product[],
  settings:   any,
  config:     PriceListConfig,
): Promise<void> {
  const { pdf }    = await import("@react-pdf/renderer");
  const { createElement } = await import("react");

  let Template: any;
  if (config.template === "moderna") {
    Template = (await import("../components/templates/PriceListModerna")).default;
  } else if (config.template === "corporativa") {
    Template = (await import("../components/templates/PriceListCorporativa")).default;
  } else {
    Template = (await import("../components/templates/PriceListElegante")).default;
  }

  const doc  = createElement(Template, { products, settings, config });
  const blob = await pdf(doc as any).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `lista-precios-${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export type PriceListConfig = {
  title:       string;
  template:    "elegante" | "moderna" | "corporativa";
  currency:    string;
  showSku:     boolean;
  showPrices:  boolean;
  showIva:     boolean;
  validUntil:  string;
  footerNote:  string;
};

export const DEFAULT_PRICELIST_CONFIG: PriceListConfig = {
  title:      "Lista de precios",
  template:   "elegante",
  currency:   "MXN",
  showSku:    true,
  showPrices: true,
  showIva:    true,
  validUntil: "",
  footerNote: "",
};
