"use client";
import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth }   from "@/lib/auth/AuthProvider";
import { supabase }  from "@/lib/supabaseClient";
import type { ForeignTradeOperation, FTFilters } from "../types/foreign-trade.types";
import { DEFAULT_FT_FILTERS } from "../types/foreign-trade.types";
import {
  fetchOperations, fetchOperation, createOperation,
  updateOperation, updateTradeStatus, deleteOperation, filterOperations,
} from "./foreign-trade.service";

export function useForeignTradeController() {
  const { companyId } = useTenant();
  const { user }      = useAuth();

  const [ops,      setOps]      = useState<ForeignTradeOperation[]>([]);
  const [selected, setSelected] = useState<ForeignTradeOperation | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [filters,  setFilters]  = useState<FTFilters>(DEFAULT_FT_FILTERS);

  const load = useCallback(async () => {
    if (!companyId) return;
    const data = await fetchOperations(companyId);
    setOps(data);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const ch = supabase
      .channel(`ft-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "foreign_trade_operations", filter: `company_id=eq.${companyId}` },
        () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [companyId, load]);

  useEffect(() => {
    if (!selected || !companyId) return;
    fetchOperation(companyId, selected.id).then((o) => { if (o) setSelected(o); });
  }, [ops]);

  const filtered = filterOperations(ops, filters);

  async function handleCreate(data: Partial<ForeignTradeOperation>): Promise<ForeignTradeOperation | undefined> {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      const op = await createOperation(companyId, user.id, data);
      await load();
      setSelected(op);
      return op;
    } finally { setSaving(false); }
  }

  async function handleUpdate(id: string, updates: Partial<ForeignTradeOperation>) {
    if (!companyId) return;
    setSaving(true);
    try {
      await updateOperation(companyId, id, updates);
      await load();
      if (selected?.id === id) {
        const o = await fetchOperation(companyId, id);
        if (o) setSelected(o);
      }
    } finally { setSaving(false); }
  }

  async function handleStatusChange(id: string, status: any) {
    if (!companyId) return;
    await updateTradeStatus(companyId, id, status);
    await load();
    if (selected?.id === id) {
      const o = await fetchOperation(companyId, id);
      if (o) setSelected(o);
    }
  }

  async function handleDelete(id: string) {
    if (!companyId) return;
    await deleteOperation(companyId, id);
    if (selected?.id === id) setSelected(null);
    await load();
  }

  async function reloadSelected() {
    if (!selected || !companyId) return;
    const o = await fetchOperation(companyId, selected.id);
    if (o) setSelected(o);
  }

  return {
    ops, filtered, selected, setSelected,
    loading, saving, filters, setFilters,
    handleCreate, handleUpdate, handleStatusChange, handleDelete, reloadSelected, reload: load,
  };
}
