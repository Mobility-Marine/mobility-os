import { useState, useCallback, useEffect } from "react";
import type { AccountPayable, APStats, SupplierAPSummary, APFilters } from "../types/cxp.types";
import { DEFAULT_AP_FILTERS } from "../types/cxp.types";
import {
  fetchAP, fetchAPById, fetchAPStats, fetchSupplierAPSummaries,
  fetchPendingFromShipments, fetchPendingFromPOs,
  createAP, registerAPPayment, updateAPStatus,
  fetchAllProvidersForView,
} from "./cxp.service";

export function useCxPController(companyId: string, userId: string) {
  const [items,            setItems]            = useState<AccountPayable[]>([]);
  const [stats,            setStats]            = useState<APStats>({
    total_balance: 0, total_overdue: 0, paid_month: 0,
    count_pending: 0, count_overdue: 0,
    bucket_0_30: 0, bucket_31_60: 0, bucket_61_90: 0, bucket_90plus: 0,
    count_0_30: 0, count_31_60: 0, count_61_90: 0, count_90plus: 0,
    by_type: { procurement: 0, logistics: 0, operating: 0 },
    por_moneda: {},
  });
  const [supplierSummaries,setSupplierSummaries]= useState<SupplierAPSummary[]>([]);
  const [pendingShipments, setPendingShipments] = useState<any[]>([]);
  const [pendingPOs,       setPendingPOs]       = useState<any[]>([]);
  const [selected,         setSelected]         = useState<{ ap: AccountPayable; payments: any[] } | null>(null);
  const [filters,          setFilters]          = useState<APFilters>(DEFAULT_AP_FILTERS);
  const [loading,          setLoading]          = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState<string | null>(null);

  const load = useCallback(async (f?: APFilters) => {
    if (!companyId) return;
    setLoading(true); setError(null);
    const active = f ?? filters;
    try {
      const [list, st, suppliers, ships, pos] = await Promise.all([
        fetchAP(companyId, active),
        fetchAPStats(companyId),
        fetchAllProvidersForView(companyId),   // todos los proveedores, no solo con AP
        fetchPendingFromShipments(companyId),
        fetchPendingFromPOs(companyId),
      ]);
      setItems(list); setStats(st); setSupplierSummaries(suppliers);
      setPendingShipments(ships); setPendingPOs(pos);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyId, filters]);

  const handleFilter = useCallback((partial: Partial<APFilters>) => {
    setFilters(p => { const next = { ...p, ...partial }; load(next); return next; });
  }, [load]);

  const handleSelect = useCallback(async (ap: AccountPayable) => {
    setLoading(true);
    try { setSelected(await fetchAPById(ap.id)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const handleCreate = useCallback(async (payload: any) => {
    setSaving(true); setError(null);
    try { await createAP(companyId, userId, payload); await load(); }
    catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load]);

  const handleRegisterPayment = useCallback(async (payload: any) => {
    setSaving(true); setError(null);
    try {
      await registerAPPayment(companyId, userId, payload);
      await load();
      if (selected?.ap.id === payload.ap_id) setSelected(await fetchAPById(payload.ap_id));
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load, selected]);

  const handleUpdateStatus = useCallback(async (id: string, status: string) => {
    try {
      await updateAPStatus(id, companyId, status);
      setItems(p => p.map(i => i.id === id ? { ...i, status: status as any } : i));
    } catch (e: any) { setError(e.message); }
  }, [companyId]);

  return {
    items, stats, supplierSummaries, pendingShipments, pendingPOs,
    selected, filters, loading, saving, error,
    setSelected, load, handleFilter, handleSelect,
    handleCreate, handleRegisterPayment, handleUpdateStatus,
  };
}
