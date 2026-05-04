import { supabase } from "@/lib/supabaseClient";
import type {
  Supplier, SupplierEvaluation, SupplierContract,
  SupplierContractItem, SupplierFilters,
} from "../types/supplier.types";

// ── SUPPLIERS (tabla suppliers) ───────────────────────────────

/**
 * Obtiene la lista de proveedores de compras (business_partners con is_supplier=true).
 * Excluye proveedores logísticos puros (que se manejan en el módulo Logística).
 * Multi-tenant safe.
 */
export async function fetchSuppliers(companyId: string): Promise<Supplier[]> {
  const { data } = await supabase
    .from("business_partners")
    .select("id, company_id, name, contact, email, phone, address, city, state, country, website, tax_id:rfc, currency, payment_terms, credit_days, is_active, rating, notes, created_at, updated_at")
    .eq("company_id", companyId)
    .eq("is_supplier", true)
    .eq("is_active", true)
    .order("name");
  return (data ?? []) as Supplier[];
}

/**
 * Obtiene un proveedor específico por ID. Verifica que sea proveedor de compras.
 */
export async function fetchSupplier(companyId: string, id: string): Promise<Supplier | null> {
  const { data } = await supabase
    .from("business_partners")
    .select("*, tax_id:rfc")
    .eq("company_id", companyId)
    .eq("id", id)
    .eq("is_supplier", true)
    .single();
  return data as Supplier | null;
}

/**
 * Crea un proveedor de compras en business_partners.
 * Marca explícitamente: is_supplier=true, is_customer=false, is_logistics_provider=false.
 * Mapea tax_id (legacy) → rfc (columna real).
 */
export async function createSupplier(
  companyId: string,
  payload: Partial<Supplier>
): Promise<Supplier> {
  const { id: _id, company_id: _cid, avg_score: _s, tax_id, type: _t, ...safe } = payload as any;
  // Mapear tax_id (legacy) → rfc si vino en el payload
  if (tax_id !== undefined) safe.rfc = tax_id;
  const { data, error } = await supabase
    .from("business_partners")
    .insert({
      ...safe,
      company_id:            companyId,
      is_customer:           false,
      is_supplier:           true,
      is_logistics_provider: false,
    })
    .select("*, tax_id:rfc")
    .single();
  if (error) throw new Error(error.message);
  return data as Supplier;
}

/**
 * Actualiza un proveedor en business_partners.
 * Verifica que sea proveedor de compras (no permite editar clientes puros por error).
 * Mapea tax_id (legacy) → rfc.
 */
export async function updateSupplier(
  companyId: string,
  id: string,
  updates: Partial<Supplier>
): Promise<void> {
  const { id: _id, company_id: _cid, avg_score: _s, tax_id, type: _t, ...safe } = updates as any;
  if (tax_id !== undefined) safe.rfc = tax_id;
  const { error } = await supabase
    .from("business_partners")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId)
    .eq("is_supplier", true);
  if (error) throw new Error(error.message);
}

export function filterSuppliers(suppliers: Supplier[], f: SupplierFilters): Supplier[] {
  const q = f.search.trim().toLowerCase();
  return suppliers.filter((s) => {
    if (q && !s.name.toLowerCase().includes(q) &&
        !s.tax_id?.toLowerCase().includes(q) &&
        !s.city?.toLowerCase().includes(q) &&
        !s.email?.toLowerCase().includes(q)) return false;
    if (f.status !== "all") {
      if (f.status === "active"   && !s.is_active) return false;
      if (f.status === "inactive" &&  s.is_active) return false;
    }
    return true;
  });
}

// ── EVALUACIONES ──────────────────────────────────────────────

export async function fetchEvaluations(companyId: string, supplierId: string): Promise<SupplierEvaluation[]> {
  const { data } = await supabase
    .from("procurement_supplier_evaluations")
    .select("*")
    .eq("company_id", companyId)
    .eq("supplier_id", supplierId)
    .order("evaluated_month", { ascending: false });
  return (data ?? []) as SupplierEvaluation[];
}

export async function createEvaluation(
  companyId: string,
  userId: string,
  supplierId: string,
  payload: Partial<SupplierEvaluation>
): Promise<SupplierEvaluation> {
  const { id: _id, company_id: _cid, score_total: _st, created_at: _ca, ...safe } = payload as any;
  const { data, error } = await supabase
    .from("procurement_supplier_evaluations")
    .insert({ ...safe, company_id: companyId, supplier_id: supplierId, evaluated_by: userId })
    .select("*").single();
  if (error) throw error;
  return data as SupplierEvaluation;
}

export async function deleteEvaluation(companyId: string, id: string): Promise<void> {
  await supabase
    .from("procurement_supplier_evaluations")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);
}

// ── CONTRATOS MARCO ───────────────────────────────────────────

export async function fetchContracts(companyId: string, supplierId: string): Promise<SupplierContract[]> {
  const { data: contracts } = await supabase
    .from("procurement_contracts")
    .select("*")
    .eq("company_id", companyId)
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false });
  if (!contracts?.length) return [];
  const ids = contracts.map((c: any) => c.id);
  const { data: items } = await supabase
    .from("procurement_contract_items")
    .select("*, product:products(name, sku)")
    .in("contract_id", ids)
    .eq("company_id", companyId);
  return contracts.map((c: any) => ({
    ...c,
    items: (items ?? []).filter((i: any) => i.contract_id === c.id),
  })) as SupplierContract[];
}

export async function createContract(
  companyId: string,
  userId: string,
  supplierId: string,
  payload: Partial<SupplierContract>
): Promise<SupplierContract> {
  const { items, id: _id, company_id: _cid, created_at: _ca, ...safe } = payload as any;
  const { data, error } = await supabase
    .from("procurement_contracts")
    .insert({ ...safe, company_id: companyId, supplier_id: supplierId, created_by: userId })
    .select("*").single();
  if (error) throw error;
  return { ...data, items: [] } as SupplierContract;
}

export async function updateContract(
  companyId: string,
  id: string,
  updates: Partial<SupplierContract>
): Promise<void> {
  const { items, id: _id, company_id: _cid, created_at: _ca, ...safe } = updates as any;
  await supabase
    .from("procurement_contracts")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId);
}

export async function upsertContractItem(
  companyId: string,
  contractId: string,
  item: Partial<SupplierContractItem>
): Promise<void> {
  if (item.id) {
    const { id, company_id: _cid, contract_id: _coid, created_at: _ca, product: _p, ...safe } = item as any;
    await supabase.from("procurement_contract_items").update(safe).eq("id", id).eq("company_id", companyId);
  } else {
    const { product: _p, ...safe } = item as any;
    await supabase.from("procurement_contract_items").insert({ ...safe, company_id: companyId, contract_id: contractId });
  }
}

export async function deleteContractItem(companyId: string, id: string): Promise<void> {
  await supabase.from("procurement_contract_items").delete().eq("id", id).eq("company_id", companyId);
}

// ── HELPERS ───────────────────────────────────────────────────

export function calcAvgScore(evals: SupplierEvaluation[]): number | null {
  if (!evals.length) return null;
  const sum = evals.reduce((s, e) => s + (e.score_total ?? ((e.score_delivery + e.score_quality + e.score_price + e.score_service) / 4)), 0);
  return Math.round((sum / evals.length) * 10) / 10;
}

export function scoreColor(score: number | null): string {
  if (!score) return "var(--color-text-muted)";
  if (score >= 4) return "var(--color-success-text)";
  if (score >= 3) return "#d97706";
  return "var(--color-danger-text)";
}

export function renderStars(score: number, maxScore = 5): string {
  return "★".repeat(score) + "☆".repeat(maxScore - score);
}
