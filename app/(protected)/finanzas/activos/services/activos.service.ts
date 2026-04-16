import { supabase } from "@/lib/supabaseClient";
import type {
  FixedAsset, DepreciationEntry, AssetDisposal,
  AssetStats, AssetType, DepreciationMethod, DisposalType,
} from "../types/activos.types";
import { SAT_RATES, DEFAULT_LIFE_MONTHS } from "../types/activos.types";

// ── FETCH ASSETS ──────────────────────────────────────────────
export async function fetchAssets(companyId: string): Promise<FixedAsset[]> {
  const { data, error } = await supabase
    .from("fixed_assets")
    .select("*")
    .eq("company_id", companyId)
    .order("acquisition_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as FixedAsset[];
}

// ── CREATE ASSET ──────────────────────────────────────────────
export async function createAsset(
  companyId: string,
  userId: string,
  payload: {
    name:                  string;
    description?:          string;
    asset_type:            AssetType;
    serial_number?:        string;
    location?:             string;
    acquisition_date:      string;
    acquisition_cost:      number;
    salvage_value:         number;
    currency:              string;
    depreciation_method:   DepreciationMethod;
    useful_life_months:    number;
    depreciation_rate_annual?: number;
    related_ap_id?:        string;
    notes?:                string;
  }
): Promise<FixedAsset> {
  const { data, error } = await supabase
    .from("fixed_assets")
    .insert({
      company_id:               companyId,
      name:                     payload.name,
      description:              payload.description          ?? null,
      asset_type:               payload.asset_type,
      serial_number:            payload.serial_number        ?? null,
      location:                 payload.location             ?? null,
      acquisition_date:         payload.acquisition_date,
      acquisition_cost:         payload.acquisition_cost,
      salvage_value:            payload.salvage_value,
      currency:                 payload.currency,
      depreciation_method:      payload.depreciation_method,
      useful_life_months:       payload.useful_life_months,
      depreciation_rate_annual: payload.depreciation_rate_annual ?? SAT_RATES[payload.asset_type],
      book_value:               payload.acquisition_cost,
      accumulated_depreciation: 0,
      monthly_depreciation:     0,
      status:                   "active",
      related_ap_id:            payload.related_ap_id ?? null,
      notes:                    payload.notes          ?? null,
      created_by:               userId,
    })
    .select("*").single();
  if (error) throw new Error(error.message);
  return data as FixedAsset;
}

// ── UPDATE ASSET ──────────────────────────────────────────────
export async function updateAsset(
  companyId: string, id: string, updates: Partial<FixedAsset>
): Promise<void> {
  const { id: _id, company_id: _cid, created_at: _ca, ...safe } = updates as any;
  await supabase.from("fixed_assets")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

// ── FETCH DEPRECIATION SCHEDULE ───────────────────────────────
export async function fetchDepreciationSchedule(
  assetId: string
): Promise<DepreciationEntry[]> {
  const { data } = await supabase
    .from("asset_depreciation_entries")
    .select("*")
    .eq("asset_id", assetId)
    .order("period");
  return (data ?? []) as DepreciationEntry[];
}

// ── FETCH PENDING DEPRECIATION (mes actual) ───────────────────
export async function fetchPendingDepreciation(
  companyId: string, period: string
): Promise<DepreciationEntry[]> {
  const { data } = await supabase
    .from("asset_depreciation_entries")
    .select("*, asset:fixed_assets(name, asset_type)")
    .eq("company_id", companyId)
    .eq("period", period)
    .eq("posted", false)
    .order("period_date");
  return (data ?? []) as DepreciationEntry[];
}

// ── FETCH POSTED DEPRECIATION ─────────────────────────────────
export async function fetchPostedDepreciation(
  companyId: string, period: string
): Promise<DepreciationEntry[]> {
  const { data } = await supabase
    .from("asset_depreciation_entries")
    .select("*, asset:fixed_assets(name, asset_type)")
    .eq("company_id", companyId)
    .eq("period", period)
    .eq("posted", true)
    .order("period_date");
  return (data ?? []) as DepreciationEntry[];
}

// ── POST DEPRECIATION PERIOD ──────────────────────────────────
export async function postDepreciationPeriod(
  companyId: string, period: string
): Promise<number> {
  const { data, error } = await supabase.rpc("post_depreciation_period", {
    p_company_id: companyId,
    p_period:     period,
  });
  if (error) throw new Error(error.message);
  return data as number;
}

// ── DISPOSE ASSET ─────────────────────────────────────────────
export async function disposeAsset(
  companyId: string,
  userId: string,
  payload: {
    asset_id:      string;
    disposal_date: string;
    disposal_type: DisposalType;
    sale_amount:   number;
    book_value:    number;
    notes?:        string;
  }
): Promise<void> {
  const gain_loss = payload.sale_amount - payload.book_value;
  await supabase.from("asset_disposals").insert({
    company_id:             companyId,
    asset_id:               payload.asset_id,
    disposal_date:          payload.disposal_date,
    disposal_type:          payload.disposal_type,
    sale_amount:            payload.sale_amount,
    book_value_at_disposal: payload.book_value,
    gain_loss,
    notes:                  payload.notes ?? null,
    created_by:             userId,
  });
  await supabase.from("fixed_assets").update({
    status:     "disposed",
    updated_at: new Date().toISOString(),
  }).eq("id", payload.asset_id).eq("company_id", companyId);
}

// ── FETCH DISPOSALS ───────────────────────────────────────────
export async function fetchDisposals(companyId: string): Promise<AssetDisposal[]> {
  const { data } = await supabase
    .from("asset_disposals")
    .select("*, asset:fixed_assets(name, asset_type)")
    .eq("company_id", companyId)
    .order("disposal_date", { ascending: false });
  return (data ?? []) as AssetDisposal[];
}

// ── FETCH STATS ───────────────────────────────────────────────
export async function fetchAssetStats(companyId: string): Promise<AssetStats> {
  const { data } = await supabase
    .from("fixed_assets")
    .select("asset_type, acquisition_cost, book_value, accumulated_depreciation, monthly_depreciation, status")
    .eq("company_id", companyId)
    .neq("status", "disposed");

  const records = data ?? [];
  const active  = records.filter(r => r.status === "active");
  const today   = new Date();
  const period  = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const { data: pending } = await supabase
    .from("asset_depreciation_entries")
    .select("depreciation_amount")
    .eq("company_id", companyId)
    .eq("period", period)
    .eq("posted", false);

  const by_type = {} as Record<AssetType, { count: number; book_value: number; cost: number }>;
  for (const r of records) {
    const t = r.asset_type as AssetType;
    if (!by_type[t]) by_type[t] = { count: 0, book_value: 0, cost: 0 };
    by_type[t].count++;
    by_type[t].book_value += r.book_value ?? 0;
    by_type[t].cost       += r.acquisition_cost ?? 0;
  }

  return {
    total_assets:          records.length,
    total_cost:            records.reduce((s, r) => s + (r.acquisition_cost ?? 0), 0),
    total_book_value:      records.reduce((s, r) => s + (r.book_value ?? 0), 0),
    total_accumulated_dep: records.reduce((s, r) => s + (r.accumulated_depreciation ?? 0), 0),
    monthly_dep_pending:   (pending ?? []).reduce((s, p) => s + (p.depreciation_amount ?? 0), 0),
    by_type,
  };
}
