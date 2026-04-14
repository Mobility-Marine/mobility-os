import { useState, useCallback } from "react";
import type {
  PurchaseOrder, Supplier, POStats,
  POFilters, CreatePOPayload, CreatePOItemPayload, UpdatePOPayload,
} from "../types/ordenes-compra.types";
import {
  fetchPOs, fetchPO, fetchSuppliers, createPO,
  updatePO, approvePO, sendPO, cancelPO, fetchPOStats,
} from "./ordenes-compra.service";

export function usePOController(companyId: string, userId: string) {
  const [orders,   setOrders]   = useState<PurchaseOrder[]>([]);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [suppliers,setSuppliers]= useState<Supplier[]>([]);
  const [stats,    setStats]    = useState<POStats>({ total: 0, draft: 0, pending_approval: 0, approved: 0, sent: 0, partial: 0, complete: 0, total_value: 0, pending_value: 0 });
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async (filters: POFilters) => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try {
      const [orders, suppliers, stats] = await Promise.all([
        fetchPOs(companyId, filters),
        fetchSuppliers(companyId),
        fetchPOStats(companyId),
      ]);
      setOrders(orders);
      setSuppliers(suppliers);
      setStats(stats);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyId]);

  const loadDetail = useCallback(async (id: string) => {
    const po = await fetchPO(id);
    setSelected(po);
    return po;
  }, []);

  const handleCreate = useCallback(async (
    payload: CreatePOPayload,
    items: CreatePOItemPayload[],
    filters: POFilters
  ) => {
    setSaving(true); setError(null);
    try {
      const po = await createPO(companyId, userId, payload, items);
      await load(filters);
      setSelected(await fetchPO(po.id));
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load]);

  const handleUpdate = useCallback(async (id: string, payload: UpdatePOPayload, filters: POFilters) => {
    setSaving(true); setError(null);
    try {
      await updatePO(id, payload);
      await loadDetail(id);
      await load(filters);
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [load, loadDetail]);

  const handleApprove = useCallback(async (id: string, filters: POFilters) => {
    setSaving(true); setError(null);
    try {
      await approvePO(id, userId);
      await loadDetail(id);
      await load(filters);
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [userId, load, loadDetail]);

  const handleSend = useCallback(async (id: string, filters: POFilters) => {
    setSaving(true); setError(null);
    try {
      await sendPO(id);
      await loadDetail(id);
      await load(filters);
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [load, loadDetail]);

  const handleCancel = useCallback(async (id: string, reason: string, filters: POFilters) => {
    setSaving(true); setError(null);
    try {
      await cancelPO(id, reason, userId);
      await loadDetail(id);
      await load(filters);
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [userId, load, loadDetail]);

  return {
    orders, selected, suppliers, stats, loading, saving, error,
    setSelected, load, loadDetail,
    handleCreate, handleUpdate, handleApprove, handleSend, handleCancel,
  };
}
