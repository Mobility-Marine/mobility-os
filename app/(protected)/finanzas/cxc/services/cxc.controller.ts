import { useState, useCallback, useEffect } from "react";
import type {
  AccountReceivable, ARPayment, ARActivity,
  ARStats, ClientARSummary, ARFilters,
} from "../types/cxc.types";
import { DEFAULT_AR_FILTERS } from "../types/cxc.types";
import {
  fetchAR, fetchARById, fetchARStats,
  fetchClientARSummaries, fetchClientActivities,
  registerPayment, createARActivity,
  updateARStatus, updateARCollectionStatus,
  createManualAR, syncCFDIsToAR,
} from "./cxc.service";

export function useCxCController(companyId: string, userId: string) {
  const [items,        setItems]        = useState<AccountReceivable[]>([]);
  const [stats,        setStats]        = useState<ARStats>({
    total_balance: 0, total_overdue: 0, collected_month: 0,
    count_pending: 0, count_overdue: 0, dso: 0,
    bucket_0_30: 0, bucket_31_60: 0, bucket_61_90: 0, bucket_90plus: 0,
    count_0_30: 0, count_31_60: 0, count_61_90: 0, count_90plus: 0,
    por_moneda: {},
  });
  const [clientSummaries, setClientSummaries] = useState<ClientARSummary[]>([]);
  const [selected,     setSelected]     = useState<{ ar: AccountReceivable; payments: ARPayment[]; activities: ARActivity[] } | null>(null);
  const [filters,      setFilters]      = useState<ARFilters>(DEFAULT_AR_FILTERS);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [syncing,      setSyncing]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const load = useCallback(async (f?: ARFilters) => {
    if (!companyId) return;
    setLoading(true); setError(null);
    const active = f ?? filters;
    try {
      const [list, st, clients] = await Promise.all([
        fetchAR(companyId, active),
        fetchARStats(companyId),
        fetchClientARSummaries(companyId),
      ]);
      setItems(list);
      setStats(st);
      setClientSummaries(clients);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyId, filters]);

  const handleFilter = useCallback((partial: Partial<ARFilters>) => {
    setFilters(p => {
      const next = { ...p, ...partial };
      load(next);
      return next;
    });
  }, [load]);

  const handleSelect = useCallback(async (ar: AccountReceivable) => {
    setLoading(true);
    try { setSelected(await fetchARById(ar.id)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const handleRegisterPayment = useCallback(async (payload: any) => {
    setSaving(true); setError(null);
    try {
      await registerPayment(companyId, userId, payload);
      await load();
      if (selected?.ar.id === payload.ar_id) {
        setSelected(await fetchARById(payload.ar_id));
      }
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load, selected]);

  const handleCreateActivity = useCallback(async (payload: any) => {
    setSaving(true); setError(null);
    try {
      await createARActivity(companyId, userId, payload);
      await load();
      if (selected && payload.ar_id === selected.ar.id) {
        setSelected(await fetchARById(selected.ar.id));
      }
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load, selected]);

  const handleUpdateStatus = useCallback(async (id: string, status: string) => {
    try {
      await updateARStatus(id, companyId, status);
      setItems(p => p.map(i => i.id === id ? { ...i, status: status as any } : i));
    } catch (e: any) { setError(e.message); }
  }, [companyId]);

  const handleUpdateCollectionStatus = useCallback(async (id: string, cs: string) => {
    try {
      await updateARCollectionStatus(id, companyId, cs);
      setItems(p => p.map(i => i.id === id ? { ...i, collection_status: cs as any } : i));
    } catch (e: any) { setError(e.message); }
  }, [companyId]);

  const handleCreateManual = useCallback(async (payload: any) => {
    setSaving(true); setError(null);
    try {
      await createManualAR(companyId, userId, payload);
      await load();
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load]);

  const handleSync = useCallback(async () => {
    setSyncing(true); setError(null);
    try {
      const n = await syncCFDIsToAR(companyId);
      await load();
      return n;
    } catch (e: any) { setError(e.message); return 0; }
    finally { setSyncing(false); }
  }, [companyId, load]);

  return {
    items, stats, clientSummaries, selected, filters,
    loading, saving, syncing, error,
    setSelected,
    load, handleFilter,
    handleSelect, handleRegisterPayment, handleCreateActivity,
    handleUpdateStatus, handleUpdateCollectionStatus,
    handleCreateManual, handleSync,
  };
}
