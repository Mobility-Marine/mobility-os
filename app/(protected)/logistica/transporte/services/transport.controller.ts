"use client";
import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth }   from "@/lib/auth/AuthProvider";
import { supabase }  from "@/lib/supabaseClient";
import type { TransportUnit, UnitFilters } from "../types/transport.types";
import { DEFAULT_UNIT_FILTERS }            from "../types/transport.types";
import {
  fetchUnits, fetchUnit, createUnit, updateUnit,
  updateUnitStatus, deleteUnit, filterUnits,
} from "./transport.service";

export function useTransportController() {
  const { companyId } = useTenant();
  const { user }      = useAuth();

  const [units,    setUnits]    = useState<TransportUnit[]>([]);
  const [selected, setSelected] = useState<TransportUnit | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [filters,  setFilters]  = useState<UnitFilters>(DEFAULT_UNIT_FILTERS);

  const load = useCallback(async () => {
    if (!companyId) return;
    const data = await fetchUnits(companyId);
    setUnits(data);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const ch = supabase
      .channel(`transport-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transport_units", filter: `company_id=eq.${companyId}` },
        () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [companyId, load]);

  const filtered = filterUnits(units, filters);

  async function handleCreate(payload: Partial<TransportUnit>): Promise<TransportUnit | undefined> {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      const u = await createUnit(companyId, user.id, payload);
      await load();
      setSelected(u);
      return u;
    } finally { setSaving(false); }
  }

  async function handleUpdate(id: string, updates: Partial<TransportUnit>) {
    if (!companyId) return;
    setSaving(true);
    try {
      await updateUnit(companyId, id, updates);
      await load();
      if (selected?.id === id) {
        const u = await fetchUnit(companyId, id);
        if (u) setSelected(u);
      }
    } finally { setSaving(false); }
  }

  async function handleStatusChange(id: string, status: UnitStatus) {
    if (!companyId) return;
    await updateUnitStatus(companyId, id, status);
    await load();
    if (selected?.id === id) {
      const u = await fetchUnit(companyId, id);
      if (u) setSelected(u);
    }
  }

  async function handleDelete(id: string) {
    if (!companyId) return;
    await deleteUnit(companyId, id);
    if (selected?.id === id) setSelected(null);
    await load();
  }

  return {
    units, filtered, selected, setSelected,
    loading, saving, filters, setFilters,
    handleCreate, handleUpdate, handleStatusChange, handleDelete, reload: load,
  };
}
