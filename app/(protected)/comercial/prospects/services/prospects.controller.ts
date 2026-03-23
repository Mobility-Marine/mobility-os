"use client";

// ============================================================
// 👤 PROSPECTS CONTROLLER — Enterprise Architecture
// Integrado a Customer Master + Timeline Global
// ============================================================

import { useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";

import type { Prospect } from "../types/prospects.types";

import { convertProspectToCustomer } from "./prospect-conversion.service";

import {
  fetchProspects,
  createProspect as createProspectService,
  updateProspect as updateProspectService,
  archiveProspect as archiveProspectService,
} from "./prospects.service";

export function useProspectsController() {

  const { companyId } = useTenant();

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // LOAD PROSPECTS
  // ==========================================================

  useEffect(() => {
    if (!companyId) return;

    fetchProspects(companyId).then((data) => {
      setProspects(data);
      setLoading(false);
    });

    const channel = supabase
      .channel("prospects-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prospects",
          filter: `company_id=eq.${companyId}`,
        },
        () => fetchProspects(companyId).then(setProspects)
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };

  }, [companyId]);

  // ==========================================================
  // ACTIONS
  // ==========================================================

  async function createProspect(payload: {
    name?: string;
    company_name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) {
    if (!companyId) return;

    const prospect = await createProspectService(companyId, payload);

    const data = await fetchProspects(companyId);
    setProspects(data);

    return prospect;
  }

  async function updateProspect(id: string, payload: Partial<Prospect>) {
    if (!companyId) return;

    await updateProspectService(id, payload);

    const data = await fetchProspects(companyId);
    setProspects(data);
  }

  async function archiveProspect(id: string) {
    if (!companyId) return;

    await archiveProspectService(id);

    const data = await fetchProspects(companyId);
    setProspects(data);
  }

async function convertProspect(prospectId: string) {
  if (!companyId) return;

  const result = await convertProspectToCustomer(
    companyId,
    prospectId,
    {}
  );

  const data = await fetchProspects(companyId);
  setProspects(data);

  return result;
}
  
  return {
    loading,
    prospects,
    selected,
    setSelected,

    createProspect,
    updateProspect,
    archiveProspect,
    convertProspect,
  };
}


