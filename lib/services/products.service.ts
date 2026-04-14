import { supabase } from "@/lib/supabaseClient";

export type CatalogProduct = {
  id:          string;
  sku:         string | null;
  name:        string;
  description: string | null;
  category:    string | null;
  unit:        string;
  cost:        number;
  unit_price:  number;
  tax_rate:    number;
  stock_min:   number;
};

export async function fetchProductCatalog(companyId: string): Promise<CatalogProduct[]> {
  const { data } = await supabase
    .from("products")
    .select("id, sku, name, description, category, unit, cost, unit_price, tax_rate, stock_min")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("name");
  return (data ?? []) as CatalogProduct[];
}
