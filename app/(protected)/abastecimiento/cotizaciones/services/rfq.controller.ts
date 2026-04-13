"use client";
import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth }   from "@/lib/auth/AuthProvider";
import { supabase }  from "@/lib/supabaseClient";
import type { RFQ, RFQItem, RFQFilters, RFQStatus } from "../types/rfq.types";
import { DEFAULT_RFQ_FILTERS } from "../types/rfq.types";
import {
  fetchRFQs, fetchRFQ, createRFQ, updateRFQ, updateRFQStatus,
  deleteRFQ, upsertRFQItem, deleteRFQItem, addSupplierToRFQ,
  removeSupplierFromRFQ, upsertResponseItem, awardRFQ, filterRFQs,
} from "./rfq.service";

export function useRFQController() {
  const { companyId } = useTenant();
  const { user }      = useAuth();

  const [rfqs,     setRfqs]     = useState<RFQ[]>([]);
  const [selected, setSelected] = useState<RFQ | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [filters,  setFilters]  = useState<RFQFilters>(DEFAULT_RFQ_FILTERS);

  const load = useCallback(async () => {
    if (!companyId) return;
    const data = await fetchRFQs(companyId);
    setRfqs(data);
    setLoading(false);
  }, [companyId]);

  const loadSelected = useCallback(async (id: string) => {
    if (!companyId) return;
    const r = await fetchRFQ(companyId, id);
    if (r) setSelected(r);
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const ch = supabase
      .channel(`rfqs-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "procurement_rfqs",              filter: `company_id=eq.${companyId}` }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "procurement_rfq_items",         filter: `company_id=eq.${companyId}` }, () => { if (selected) void loadSelected(selected.id); })
      .on("postgres_changes", { event: "*", schema: "public", table: "procurement_rfq_responses",     filter: `company_id=eq.${companyId}` }, () => { if (selected) void loadSelected(selected.id); })
      .on("postgres_changes", { event: "*", schema: "public", table: "procurement_rfq_response_items",filter: `company_id=eq.${companyId}` }, () => { if (selected) void loadSelected(selected.id); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [companyId, load]);

  const filtered = filterRFQs(rfqs, filters);

  async function handleCreate(payload: Partial<RFQ>): Promise<RFQ | undefined> {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      const r = await createRFQ(companyId, user.id, payload);
      await load();
      await loadSelected(r.id);
      return r;
    } finally { setSaving(false); }
  }

  async function handleUpdate(id: string, updates: Partial<RFQ>) {
    if (!companyId) return;
    setSaving(true);
    try {
      await updateRFQ(companyId, id, updates);
      await load();
      await loadSelected(id);
    } finally { setSaving(false); }
  }

  async function handleStatusChange(id: string, status: RFQStatus) {
    if (!companyId) return;
    await updateRFQStatus(companyId, id, status);
    await load();
    await loadSelected(id);
  }

  async function handleDelete(id: string) {
    if (!companyId) return;
    await deleteRFQ(companyId, id);
    if (selected?.id === id) setSelected(null);
    await load();
  }

  async function handleUpsertItem(rfqId: string, item: Partial<RFQItem>) {
    if (!companyId) return;
    await upsertRFQItem(companyId, rfqId, item);
    await loadSelected(rfqId);
  }

  async function handleDeleteItem(rfqId: string, itemId: string) {
    if (!companyId) return;
    await deleteRFQItem(companyId, itemId);
    await loadSelected(rfqId);
  }

  async function handleAddSupplier(rfqId: string, supplierId: string) {
    if (!companyId) return;
    await addSupplierToRFQ(companyId, rfqId, supplierId);
    await loadSelected(rfqId);
  }

  async function handleRemoveSupplier(rfqId: string, responseId: string) {
    if (!companyId) return;
    await removeSupplierFromRFQ(companyId, responseId);
    await loadSelected(rfqId);
  }

  async function handleUpsertResponseItem(
    rfqId: string, responseId: string, rfqItemId: string,
    unitPrice: number, currency: string, notes?: string
  ) {
    if (!companyId) return;
    setSaving(true);
    try {
      await upsertResponseItem(companyId, responseId, rfqItemId, unitPrice, currency, notes);
      await loadSelected(rfqId);
    } finally { setSaving(false); }
  }

  async function handleAward(rfqId: string, supplierId: string) {
    if (!companyId) return;
    setSaving(true);
    try {
      await awardRFQ(companyId, rfqId, supplierId);
      await load();
      await loadSelected(rfqId);
    } finally { setSaving(false); }
  }

  async function handleSelect(r: RFQ) {
    setSelected(r);
    await loadSelected(r.id);
  }

  return {
    rfqs, filtered, selected,
    loading, saving, filters, setFilters,
    handleCreate, handleUpdate, handleStatusChange,
    handleDelete, handleUpsertItem, handleDeleteItem,
    handleAddSupplier, handleRemoveSupplier,
    handleUpsertResponseItem, handleAward,
    handleSelect, reload: load,
  };
}
