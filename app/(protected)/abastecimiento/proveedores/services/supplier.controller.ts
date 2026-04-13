"use client";
import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth }   from "@/lib/auth/AuthProvider";
import { supabase }  from "@/lib/supabaseClient";
import type { Supplier, SupplierEvaluation, SupplierContract, SupplierFilters } from "../types/supplier.types";
import { DEFAULT_SUPPLIER_FILTERS } from "../types/supplier.types";
import {
  fetchSuppliers, fetchSupplier, fetchEvaluations, fetchContracts,
  createEvaluation, deleteEvaluation, createContract, updateContract,
  updateSupplier, filterSuppliers, upsertContractItem, deleteContractItem,
  calcAvgScore,
} from "./supplier.service";

export function useSupplierController() {
  const { companyId } = useTenant();
  const { user }      = useAuth();

  const [suppliers,     setSuppliers]     = useState<Supplier[]>([]);
  const [selected,      setSelected]      = useState<Supplier | null>(null);
  const [evaluations,   setEvaluations]   = useState<SupplierEvaluation[]>([]);
  const [contracts,     setContracts]     = useState<SupplierContract[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [filters,       setFilters]       = useState<SupplierFilters>(DEFAULT_SUPPLIER_FILTERS);

  const loadSuppliers = useCallback(async () => {
    if (!companyId) return;
    const data = await fetchSuppliers(companyId);
    setSuppliers(data);
    setLoading(false);
  }, [companyId]);

  const loadDetail = useCallback(async (supplierId: string) => {
    if (!companyId) return;
    const [evs, cts] = await Promise.all([
      fetchEvaluations(companyId, supplierId),
      fetchContracts(companyId, supplierId),
    ]);
    setEvaluations(evs);
    setContracts(cts);
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void loadSuppliers();
    const ch = supabase
      .channel(`suppliers-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "clients", filter: `company_id=eq.${companyId}` }, () => void loadSuppliers())
      .on("postgres_changes", { event: "*", schema: "public", table: "procurement_supplier_evaluations", filter: `company_id=eq.${companyId}` }, () => { if (selected) void loadDetail(selected.id); })
      .on("postgres_changes", { event: "*", schema: "public", table: "procurement_contracts", filter: `company_id=eq.${companyId}` }, () => { if (selected) void loadDetail(selected.id); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [companyId, loadSuppliers]);

  useEffect(() => {
    if (selected && companyId) void loadDetail(selected.id);
  }, [selected?.id]);

  const filtered = filterSuppliers(suppliers, filters);

  // Enriquecer con avg_score
  const enriched = filtered.map((s) => ({
    ...s,
    avg_score: s.id === selected?.id ? calcAvgScore(evaluations) : null,
  }));

  async function handleSelectSupplier(s: Supplier) {
    setSelected(s);
    if (companyId) await loadDetail(s.id);
  }

  async function handleUpdateSupplier(id: string, updates: Partial<Supplier>) {
    if (!companyId) return;
    setSaving(true);
    try {
      await updateSupplier(companyId, id, updates);
      await loadSuppliers();
      const u = await fetchSupplier(companyId, id);
      if (u) setSelected(u);
    } finally { setSaving(false); }
  }

  async function handleCreateEvaluation(payload: Partial<SupplierEvaluation>) {
    if (!companyId || !user || !selected) return;
    setSaving(true);
    try {
      await createEvaluation(companyId, user.id, selected.id, payload);
      await loadDetail(selected.id);
    } finally { setSaving(false); }
  }

  async function handleDeleteEvaluation(id: string) {
    if (!companyId) return;
    await deleteEvaluation(companyId, id);
    if (selected) await loadDetail(selected.id);
  }

  async function handleCreateContract(payload: Partial<SupplierContract>) {
    if (!companyId || !user || !selected) return;
    setSaving(true);
    try {
      const c = await createContract(companyId, user.id, selected.id, payload);
      await loadDetail(selected.id);
      return c;
    } finally { setSaving(false); }
  }

  async function handleUpdateContract(id: string, updates: Partial<SupplierContract>) {
    if (!companyId) return;
    setSaving(true);
    try {
      await updateContract(companyId, id, updates);
      if (selected) await loadDetail(selected.id);
    } finally { setSaving(false); }
  }

  async function handleUpsertContractItem(contractId: string, item: any) {
    if (!companyId) return;
    await upsertContractItem(companyId, contractId, item);
    if (selected) await loadDetail(selected.id);
  }

  async function handleDeleteContractItem(id: string) {
    if (!companyId) return;
    await deleteContractItem(companyId, id);
    if (selected) await loadDetail(selected.id);
  }

  return {
    suppliers: enriched, filtered: enriched, selected, evaluations, contracts,
    loading, saving, filters, setFilters,
    handleSelectSupplier, handleUpdateSupplier,
    handleCreateEvaluation, handleDeleteEvaluation,
    handleCreateContract, handleUpdateContract,
    handleUpsertContractItem, handleDeleteContractItem,
    reload: loadSuppliers,
  };
}
