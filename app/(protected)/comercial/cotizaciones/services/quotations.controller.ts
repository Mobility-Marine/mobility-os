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
  fetchQuotations,
  fetchQuotation,
  createQuotation as createSvc,
  updateQuotation,
  updateQuotationStatus,
  addItem,
  updateItem,
  deleteItem,
  addService,
  updateService,
  deleteService,
  fetchCompanySettings,
  acceptQuotation as acceptSvc,
  deleteQuotation as deleteSvc,
  createBillingConcept,
  deleteBillingConcept,
  recalcBillingConceptTotal,
  duplicateQuotation as duplicateSvc,
  updateQuotationFull as updateFullSvc,
  fetchQuotationAuditNames,
} from "./quotations.service";
import type { CreateBillingConceptPayload } from "../types/quotations.types";

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

async function removeQuotation(id: string) {
  if (!companyId) return;
  setSaving(true);
  try {
    await deleteSvc(companyId, id);
    if (selected?.id === id) setSelected(null);
    await load();
  } finally { setSaving(false); }
}
  
  async function createQuotation(
    payload:          CreateQuotationPayload,
    items?:           Omit<CreateItemPayload,    "quotation_id">[],
    services?:        Omit<CreateServicePayload, "quotation_id">[],
    billingConcepts?: {
      tempId:      string;
      product_id?: string;
      description: string;
      currency:    string;
      lines:       Omit<CreateServicePayload, "quotation_id">[];
    }[],
  ): Promise<Quotation | undefined> {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      // 1. Crear la cotización base
      const q = await createSvc(companyId, user.id, payload);

      // 2. Agregar items de productos
      if (items?.length) {
        for (const item of items) {
          await addItem(companyId, { ...item, quotation_id: q.id });
        }
      }

      // 3. Agregar conceptos de facturación + líneas de detalle
      if (billingConcepts?.length) {
        for (let ci = 0; ci < billingConcepts.length; ci++) {
          const concept = billingConcepts[ci];
          // Crear el concepto
          const created = await createBillingConcept(companyId, {
            quotation_id: q.id,
            sort_order:   ci,
            product_id:   concept.product_id,
            description:  concept.description,
            currency:     concept.currency,
          });
          // Crear las líneas de detalle vinculadas al concepto
          for (let li = 0; li < concept.lines.length; li++) {
            await addService(companyId, {
              ...concept.lines[li],
              quotation_id:       q.id,
              sort_order:         li,
              billing_concept_id: created.id,
            });
          }
          // Recalcular total del concepto
          await recalcBillingConceptTotal(companyId, created.id, q.id);
        }
      } else if (services?.length) {
        // Flujo legacy sin conceptos (por si acaso)
        for (let i = 0; i < services.length; i++) {
          await addService(companyId, { ...services[i], quotation_id: q.id, sort_order: i });
        }
      }

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

    async function acceptQuotation(quotation: Quotation, deliveryInfo?: any) {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      const result = await acceptSvc(companyId, quotation, user.id, deliveryInfo);
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

  // ── DUPLICAR (folio nuevo + clonado completo) ─────────────
  // Patrón SAP: clonar preservando original. La duplicada es
  // independiente y puede editarse libremente.
  async function duplicateQuotation(sourceId: string): Promise<Quotation | undefined> {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      const newQuot = await duplicateSvc(companyId, sourceId, user.id);
      await load();
      // Auto-seleccionar la nueva cotización para edición inmediata
      const fresh = await fetchQuotation(companyId, newQuot.id);
      if (fresh) setSelected(fresh);
      return fresh ?? newQuot;
    } finally {
      setSaving(false);
    }
  }

  // ── EDICIÓN COMPLETA (replace-all) ────────────────────────
  // Solo permitido si la cotización NO está aceptada.
  // Reemplaza items, billing_concepts y lines completos.
  async function updateQuotationFull(
    id: string,
    payload: CreateQuotationPayload,
    items?: Omit<CreateItemPayload, "quotation_id">[],
    billingConcepts?: {
      tempId?: string;
      product_id?: string;
      description: string;
      currency: string;
      lines: Omit<CreateServicePayload, "quotation_id">[];
    }[],
  ): Promise<void> {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      await updateFullSvc(companyId, user.id, id, payload, items, billingConcepts);
      await loadDetail(id);
      await load();
    } finally {
      setSaving(false);
    }
  }

  // ── AUDIT TRAIL — fetch user names ────────────────────────
  async function loadAuditNames(quotation: Quotation) {
    return await fetchQuotationAuditNames(quotation);
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
    // Billing concepts
    createBillingConcept: (p: CreateBillingConceptPayload) =>
      createBillingConcept(companyId ?? "", p),
    deleteBillingConcept: (id: string, quotationId: string) =>
      deleteBillingConcept(companyId ?? "", id, quotationId),

    // Duplicar + edición completa (replace-all)
    duplicateQuotation,
    updateQuotationFull,

    // Audit trail
    loadAuditNames,

    // Utils
    reload: load,
    reloadDetail: loadDetail,
    removeQuotation,
  };
}
