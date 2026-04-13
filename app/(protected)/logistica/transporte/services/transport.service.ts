import { supabase }   from "@/lib/supabaseClient";
import type { TransportUnit, UnitFilters, UnitStatus } from "../types/transport.types";

export async function fetchUnits(companyId: string): Promise<TransportUnit[]> {
  const { data } = await supabase
    .from("transport_units")
    .select("*")
    .eq("company_id", companyId)
    .order("name");
  return (data ?? []) as TransportUnit[];
}

export async function fetchUnit(companyId: string, id: string): Promise<TransportUnit | null> {
  const { data } = await supabase
    .from("transport_units")
    .select("*")
    .eq("company_id", companyId).eq("id", id).single();
  return data as TransportUnit | null;
}

export async function createUnit(
  companyId: string, userId: string, payload: Partial<TransportUnit>
): Promise<TransportUnit> {
  const { id: _id, company_id: _cid, created_at: _ca, ...safe } = payload as any;
  const { data, error } = await supabase
    .from("transport_units")
    .insert({ ...safe, company_id: companyId, created_by: userId, status: "active" })
    .select("*").single();
  if (error) throw error;
  return data as TransportUnit;
}

export async function updateUnit(
  companyId: string, id: string, updates: Partial<TransportUnit>
): Promise<void> {
  const { id: _id, company_id: _cid, created_at: _ca, ...safe } = updates as any;
  await supabase.from("transport_units")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

export async function updateUnitStatus(companyId: string, id: string, status: UnitStatus): Promise<void> {
  await supabase.from("transport_units")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

export async function deleteUnit(companyId: string, id: string): Promise<void> {
  await supabase.from("transport_units").delete().eq("id", id).eq("company_id", companyId);
}

export function filterUnits(units: TransportUnit[], f: UnitFilters): TransportUnit[] {
  const q = f.search.trim().toLowerCase();
  return units.filter((u) => {
    if (q &&
      !u.name.toLowerCase().includes(q) &&
      !u.plates?.toLowerCase().includes(q) &&
      !u.brand?.toLowerCase().includes(q) &&
      !u.model?.toLowerCase().includes(q) &&
      !u.assigned_driver?.toLowerCase().includes(q)
    ) return false;
    if (f.status !== "all" && u.status    !== f.status) return false;
    if (f.type   !== "all" && u.unit_type !== f.type)   return false;
    return true;
  });
}
