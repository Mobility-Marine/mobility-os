"use client";
import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth }   from "@/lib/auth/AuthProvider";
import { supabase }  from "@/lib/supabaseClient";
import type { Requisition, RequisitionItem, RequisitionFilters, RequisitionStatus } from "../types/requisition.types";
import { DEFAULT_REQUISITION_FILTERS } from "../types/requisition.types";
import {
  fetchRequisitions, fetchRequisition, createRequisition,
  updateRequisition, updateRequisitionStatus, deleteRequisition,
  upsertRequisitionItem, deleteRequisitionItem, filterRequisitions,
} from "./requisition.service";

export function useRequisitionController() {
  const { companyId } = useTenant();
  const { user }      = useAuth();

  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [selected,     setSelected]     = useState<Requisition | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [filters,      setFilters]      = useState<RequisitionFilters>(DEFAULT_REQUISITION_FILTERS);

  const load = useCallback(async () => {
    if (!companyId) return;
    const data = await fetchRequisitions(companyId);
    setRequisitions(data);
    setLoading(false);
  }, [companyId]);

  const loadSelected = useCallback(async (id: string) => {
    if (!companyId) return;
    const r = await fetchRequisition(companyId, id);
    if (r) setSelected(r);
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const ch = supabase
      .channel(`requisitions-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "procurement_requisitions",      filter: `company_id=eq.${companyId}` }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "procurement_requisition_items", filter: `company_id=eq.${companyId}` }, () => { if (selected) void loadSelected(selected.id); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [companyId, load]);

  const filtered = filterRequisitions(requisitions, filters);

  async function handleCreate(payload: Partial<Requisition>): Promise<Requisition | undefined> {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      const r = await createRequisition(companyId, user.id, payload);
      await load();
      const full = await fetchRequisition(companyId, r.id);
      if (full) setSelected(full);
      return full ?? r;
    } finally { setSaving(false); }
  }

  async function handleUpdate(id: string, updates: Partial<Requisition>) {
    if (!companyId) return;
    setSaving(true);
    try {
      await updateRequisition(companyId, id, updates);
      await load();
      await loadSelected(id);
    } finally { setSaving(false); }
  }

  async function handleStatusChange(
    id: string, status: RequisitionStatus,
    extra?: { rejection_reason?: string }
  ) {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      await updateRequisitionStatus(companyId, id, status, {
        approved_by:      status === "approved" ? user.id : undefined,
        rejected_by:      status === "rejected" ? user.id : undefined,
        rejection_reason: extra?.rejection_reason,
      });
      await load();
      await loadSelected(id);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!companyId) return;
    await deleteRequisition(companyId, id);
    if (selected?.id === id) setSelected(null);
    await load();
  }

  async function handleUpsertItem(requisitionId: string, item: Partial<RequisitionItem>) {
    if (!companyId) return;
    await upsertRequisitionItem(companyId, requisitionId, item);
    await loadSelected(requisitionId);
  }

  async function handleDeleteItem(itemId: string) {
    if (!companyId) return;
    await deleteRequisitionItem(companyId, itemId);
    if (selected) await loadSelected(selected.id);
  }

  async function handleSelect(r: Requisition) {
    setSelected(r);
    await loadSelected(r.id);
  }

  return {
    requisitions, filtered, selected,
    loading, saving, filters, setFilters,
    handleCreate, handleUpdate, handleStatusChange,
    handleDelete, handleUpsertItem, handleDeleteItem,
    handleSelect, reload: load,
  };
}
