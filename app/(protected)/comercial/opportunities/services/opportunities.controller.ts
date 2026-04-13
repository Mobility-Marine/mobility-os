// ============================================================
// OPPORTUNITIES CONTROLLER v1 — GOD LEVEL
// ============================================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import type { Opportunity, OpportunityStage, OpportunityActivity, CreateOpportunityPayload } from "../types/opportunities.types";
import {
  fetchOpportunities, createOpportunity as createSvc,
  updateOpportunity as updateSvc, updateOpportunityStage as stageSvc,
  archiveOpportunity as archiveSvc, fetchOpportunityActivities,
  addOpportunityActivity, toggleOpportunityActivity,
} from "./opportunities.service";
import { buildOpportunityHealth } from "./opportunities.intelligence";

export function useOpportunitiesController() {
  const { companyId } = useTenant();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selected,      setSelected]      = useState<Opportunity | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [activities,    setActivities]    = useState<OpportunityActivity[]>([]);
  const [actLoading,    setActLoading]    = useState(false);

  // ── LOAD ──────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const data = await fetchOpportunities(companyId);
      setOpportunities(data.map((o) => ({ ...o, health: buildOpportunityHealth(o) })));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const channel = supabase
      .channel(`opp-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "opportunities", filter: `company_id=eq.${companyId}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [companyId, load]);

  // ── LOAD ACTIVITIES ───────────────────────────────────────

  useEffect(() => {
    if (!selected || !companyId) { setActivities([]); return; }
    setActLoading(true);
    fetchOpportunityActivities(companyId, selected.id)
      .then(setActivities)
      .finally(() => setActLoading(false));

    const channel = supabase
      .channel(`opp-act-${selected.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "opportunity_activities",
        filter: `opportunity_id=eq.${selected.id}`,
      }, () => fetchOpportunityActivities(companyId, selected.id).then(setActivities))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [selected?.id, companyId]);

  // ── ACTIONS ───────────────────────────────────────────────

  async function createOpportunity(payload: CreateOpportunityPayload) {
    if (!companyId) return;
    setSaving(true);
    try {
      await createSvc(companyId, payload);
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function updateOpportunity(id: string, updates: Partial<Opportunity>) {
    if (!companyId) return;
    // Optimistic
    setOpportunities((prev) => prev.map((o) => o.id === id ? { ...o, ...updates } : o));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, ...updates } : prev);
    try {
      await updateSvc(companyId, id, updates);
      await load();
    } catch (e: any) { setError(e.message); await load(); }
  }

  async function updateStage(id: string, stage: OpportunityStage) {
    if (!companyId) return;
    await stageSvc(companyId, id, stage);
    await load();
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, stage } : prev);
  }

  async function archiveOpportunity(id: string) {
    if (!companyId) return;
    await archiveSvc(companyId, id);
    await load();
    if (selected?.id === id) setSelected(null);
  }

  async function addActivity(description: string, type = "task") {
    if (!companyId || !selected) return;
    const act = await addOpportunityActivity(companyId, selected.id, { description, type });
    setActivities((prev) => [act, ...prev]);
  }

  async function toggleActivity(id: string, completed: boolean) {
    if (!companyId) return;
    await toggleOpportunityActivity(companyId, id, completed);
    setActivities((prev) => prev.map((a) => a.id === id ? { ...a, completed: !completed } : a));
  }

  return {
    opportunities, selected, setSelected,
    loading, saving, error,
    activities, actLoading,
    createOpportunity, updateOpportunity,
    updateStage, archiveOpportunity,
    addActivity, toggleActivity,
    reload: load,
  };
}
