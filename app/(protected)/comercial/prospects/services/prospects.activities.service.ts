"use client";

import { supabase } from "@/lib/supabaseClient";

export async function getProspectActivities(
  companyId: string,
  prospectId: string
) {
  const { data } = await supabase
    .from("entity_timeline_events")
    .select("*")
    .eq("company_id", companyId)
    .eq("related_prospect_id", prospectId)
    .order("created_at", { ascending: false });

  return data || [];
}
