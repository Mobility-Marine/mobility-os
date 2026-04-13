"use client";

import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth }   from "@/lib/auth/AuthProvider";
import { supabase }  from "@/lib/supabaseClient";
import type { LogisticsProvider, ProviderFilters, ProviderKPIs } from "../types/providers.types";
import { DEFAULT_PROVIDER_FILTERS } from "../types/providers.types";
import {
  fetchProviders, fetchProvider, createProvider, updateProvider,
  toggleProviderStatus, deleteProvider,
  filterProviders, computeProviderKPIs,
} from "./providers.service";

export function useProvidersController() {
  const { companyId } = useTenant();
  const { user }      = useAuth();

  const [providers, setProviders] = useState<LogisticsProvider[]>([]);
  const [selected,  setSelected]  = useState<LogisticsProvider | null>(null);
  const [kpis,      setKpis]      = useState<ProviderKPIs | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [filters,   setFilters]   = useState<ProviderFilters>(DEFAULT_PROVIDER_FILTERS);

  const load = useCallback(async () => {
    if (!companyId) return;
    const data = await fetchProviders(companyId);
    setProviders(data);
    setKpis(computeProviderKPIs(data));
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const ch = supabase
      .channel(`providers-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "logistics_providers", filter: `company_id=eq.${companyId}` },
        () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [companyId, load]);

  // Sync selected after reload
  useEffect(() => {
    if (!selected || !companyId) return;
    fetchProvider(companyId, selected.id).then((p) => { if (p) setSelected(p); });
  }, [providers]);

  const filtered = filterProviders(providers, filters);

  async function handleCreate(
    data: Omit<LogisticsProvider, "id" | "company_id" | "created_at" | "updated_at" | "created_by" | "documents" | "invoices">
  ): Promise<LogisticsProvider | undefined> {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      const p = await createProvider(companyId, user.id, data);
      await load();
      setSelected(p);
      return p;
    } finally { setSaving(false); }
  }

  async function handleUpdate(id: string, updates: Partial<LogisticsProvider>) {
    if (!companyId) return;
    setSaving(true);
    try {
      await updateProvider(companyId, id, updates);
      await load();
    } finally { setSaving(false); }
  }

  async function handleToggle(id: string, isActive: boolean) {
    if (!companyId) return;
    await toggleProviderStatus(companyId, id, isActive);
    await load();
  }

  async function handleDelete(id: string) {
    if (!companyId) return;
    await deleteProvider(companyId, id);
    if (selected?.id === id) setSelected(null);
    await load();
  }

  async function reloadSelected() {
    if (!selected || !companyId) return;
    const p = await fetchProvider(companyId, selected.id);
    if (p) setSelected(p);
  }

  return {
    providers, filtered, selected, setSelected,
    kpis, loading, saving,
    filters, setFilters,
    handleCreate, handleUpdate, handleToggle, handleDelete,
    reloadSelected, reload: load,
  };
}
