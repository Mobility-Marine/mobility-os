import { useState, useCallback } from "react";
import type { Reception, ReceptionFilters, ReceptionItem } from "../types/recepciones.types";
import type { CreateReceptionPayload, UpdateReceptionPayload, UpdateReceptionItemPayload } from "../types/recepciones.types";
import {
  fetchReceptions, fetchReception, createReception,
  updateReception, updateReceptionItem, completeReception,
  fetchReceptionStats,
} from "./recepciones.service";

export function useReceptionsController(companyId: string, userId: string) {
  const [receptions,  setReceptions]  = useState<Reception[]>([]);
  const [selected,    setSelected]    = useState<Reception | null>(null);
  const [stats,       setStats]       = useState({ total: 0, complete: 0, partial: 0, pending: 0, discrepancies: 0 });
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const load = useCallback(async (filters: ReceptionFilters) => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const [list, s] = await Promise.all([
        fetchReceptions(companyId, filters),
        fetchReceptionStats(companyId),
      ]);
      setReceptions(list);
      setStats(s);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyId]);

  const loadDetail = useCallback(async (id: string) => {
    const rec = await fetchReception(id);
    setSelected(rec);
    return rec;
  }, []);

  const handleCreate = useCallback(async (
    payload: CreateReceptionPayload,
    items: Omit<ReceptionItem, "id" | "company_id" | "reception_id" | "created_at">[]
  ) => {
    setSaving(true); setError(null);
    try {
      const rec = await createReception(companyId, userId, payload, items);
      setSelected(rec);
      return rec;
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId]);

  const handleUpdate = useCallback(async (id: string, payload: UpdateReceptionPayload) => {
    setSaving(true); setError(null);
    try {
      await updateReception(id, payload);
      await loadDetail(id);
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [loadDetail]);

  const handleUpdateItem = useCallback(async (itemId: string, payload: UpdateReceptionItemPayload, receptionId: string) => {
    try {
      await updateReceptionItem(itemId, payload);
      await loadDetail(receptionId);
    } catch (e: any) { setError(e.message); throw e; }
  }, [loadDetail]);

  const handleComplete = useCallback(async (id: string) => {
    setSaving(true); setError(null);
    try {
      await completeReception(id);
      await loadDetail(id);
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [loadDetail]);

  return {
    receptions, selected, stats, loading, saving, error,
    load, loadDetail, setSelected,
    handleCreate, handleUpdate, handleUpdateItem, handleComplete,
  };
}
