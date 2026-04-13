"use client";

import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth }   from "@/lib/auth/AuthProvider";
import { supabase }  from "@/lib/supabaseClient";
import type {
  Quotation, QuotationItem, QuotationService, CompanySettings,
  CreateQuotationPayload, CreateItemPayload, CreateServicePayload,
  QuotationFilters,
} from "../types/quotations.types";
import { DEFAULT_QUOTATION_FILTERS } from "../types/quotations.types";
import {
  fetchQuotations, fetchQuotation,
  createQuotation as createSvc, updateQuotation, updateQuotationStatus,
  addItem, updateItem, deleteItem,
  addService, updateService, deleteService,
  fetchCompanySettings, acceptQuotation as acceptSvc,
} from "./quotations.service";

export function useQuotationsController() {
  const { companyId } = useTenant();
  const { user }      = useAuth();

  const [quotations,    setQuotations]    = useState<Quotation[]>([]);
  const [selected,      setSelected]      = useState<Quotation | null>(null);
  const [settings,      setSettings]      = useState<CompanySettings | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filters,       setFilters]       = useState<QuotationFilters>(DEFAULT_QUOTATION_FILTERS);

  // ── LOAD LIST ─────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!companyId) return;
    const [quots, cfg] = await Promise.all([
      fetchQuotations(companyId),
      fetchCompanySettings(companyId),
    ]);
    setQuotations(quots);
    setSettings(cfg);
    setLoading(false);
  }, [companyId]);

  // ── LOAD DETAIL ───────────────────────────────────────────

  const loadDetail = useCallback(async (id: string) => {
    if (!companyId) return;
    setDetailLoading(true);
    try {
      const q = await fetchQuotation(companyId, id);
      if (q) setSelected(q);
    } finally {
      setDetailLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const ch = supabase
      .channel(`quotations-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "quotations", filter: `company_id=eq.${companyId}` },
        () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [companyId, load]);

  useEffect(() => {
    if (!selected?.id) return;
    void loadDetail(selected.id);
  }, [selected?.id]);

  // ── QUOTATION ACTIONS ─────────────────────────────────────

  async function createQuotation(payload: CreateQuotationPayload): Promise<Quotation | undefined> {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      const q = await createSvc(companyId, user.id, payload);
      await load();
      return q;
    } finally { setSaving(false); }
  }

  async function updateStatus(id: string, status: string) {
    if (!companyId) return;
    setQuotations((prev) => prev.map((q) => q.id === id ? { ...q, status: status as any } : q));
    await updateQuotationStatus(companyId, id, status);
    await load();
    if (selected?.id === id) {
      setSelected((prev) => prev ? { ...prev, status: status as any } : prev);
    }
  }

  async function handleUpdateFields(id: string, updates: Partial<Quotation>) {
    if (!companyId) return;
    setSaving(true);
    try {
      await updateQuotation(companyId, id, updates);
      await load();
      await loadDetail(id);
    } finally { setSaving(false); }
  }

  async function acceptQuotation(quotation: Quotation) {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      const result = await acceptSvc(companyId, quotation, user.id);
      await load();
      if (selected?.id === quotation.id) await loadDetail(quotation.id);
      return result;
    } finally { setSaving(false); }
  }

  // ── ITEM ACTIONS ──────────────────────────────────────────

  async function createItem(payload: CreateItemPayload): Promise<QuotationItem | undefined> {
    if (!companyId) return;
    const item = await addItem(companyId, payload);
    if (selected?.id === payload.quotation_id) await loadDetail(payload.quotation_id);
    await load();
    return item;
  }

  async function handleUpdateItem(
    id: string,
    updates: Partial<QuotationItem>,
    quotationId: string,
  ) {
    if (!companyId) return;
    setSaving(true);
    try {
      await updateItem(companyId, id, { ...updates, quotation_id: quotationId });
      await loadDetail(quotationId);
      await load();
    } finally { setSaving(false); }
  }

  async function removeItem(id: string, quotationId: string) {
    if (!companyId) return;
    await deleteItem(companyId, id, quotationId);
    if (selected?.id === quotationId) await loadDetail(quotationId);
    await load();
  }

  // ── SERVICE ACTIONS ───────────────────────────────────────

  async function createService(payload: CreateServicePayload): Promise<QuotationService | undefined> {
    if (!companyId) return;
    const svc = await addService(companyId, payload);
    if (selected?.id === payload.quotation_id) await loadDetail(payload.quotation_id);
    await load();
    return svc;
  }

  async function handleUpdateService(
    id: string,
    updates: Partial<QuotationService>,
    quotationId: string,
  ) {
    if (!companyId) return;
    setSaving(true);
    try {
      await updateService(companyId, id, { ...updates, quotation_id: quotationId });
      await loadDetail(quotationId);
      await load();
    } finally { setSaving(false); }
  }

  async function removeService(id: string, quotationId: string) {
    if (!companyId) return;
    await deleteService(companyId, id, quotationId);
    if (selected?.id === quotationId) await loadDetail(quotationId);
    await load();
  }

  // ── FILTERED ──────────────────────────────────────────────

  const filtered = quotations.filter((q) => {
    const mq = filters.search.trim().toLowerCase();
    if (mq &&
      !q.quote_number?.toLowerCase().includes(mq) &&
      !q.client_name?.toLowerCase().includes(mq) &&
      !q.client?.name?.toLowerCase().includes(mq)
    ) return false;
    if (filters.type   !== "all" && q.type   !== filters.type)   return false;
    if (filters.status !== "all" && q.status !== filters.status) return false;
    return true;
  });

  return {
    quotations, filtered, selected, setSelected,
    settings, loading, saving, detailLoading,
    filters, setFilters,
    // Quotation
    createQuotation, updateStatus, acceptQuotation,
    updateFields:    handleUpdateFields,
    // Items
    createItem, updateItem: handleUpdateItem, removeItem,
    // Services
    createService, updateService: handleUpdateService, removeService,
    // Utils
    reload:       load,
    reloadDetail: loadDetail,
  };
}
