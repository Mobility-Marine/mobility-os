"use client";

import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth }   from "@/lib/auth/AuthProvider";
import { supabase }  from "@/lib/supabaseClient";
import type { Product, ProductFilters } from "../types/products.types";
import { DEFAULT_PRODUCT_FILTERS } from "../types/products.types";
import {
  fetchProducts, fetchCategories, filterProducts, computeKPIs,
  createProduct, updateProduct, deleteProduct, toggleProductStatus,
  bulkImportProducts, exportProductsCSV, type ProductKPIs,
} from "./products.service";
import type { CreateProductPayload } from "../types/products.types";

export function useProductsController() {
  const { companyId } = useTenant();
  const { user }      = useAuth();

  const [products,    setProducts]    = useState<Product[]>([]);
  const [categories,  setCategories]  = useState<string[]>([]);
  const [selected,    setSelected]    = useState<Product | null>(null);
  const [kpis,        setKpis]        = useState<ProductKPIs | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [filters,     setFilters]     = useState<ProductFilters>(DEFAULT_PRODUCT_FILTERS);

  const load = useCallback(async () => {
    if (!companyId) return;
    const [prods, cats] = await Promise.all([
      fetchProducts(companyId),
      fetchCategories(companyId),
    ]);
    setProducts(prods);
    setCategories(cats);
    setKpis(computeKPIs(prods));
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const ch = supabase
      .channel(`products-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `company_id=eq.${companyId}` },
        () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [companyId, load]);

  // Sync selected after reload
  useEffect(() => {
    if (!selected) return;
    const updated = products.find((p) => p.id === selected.id);
    if (updated) setSelected(updated);
  }, [products]);

  const filtered = filterProducts(products, filters);

  async function handleCreate(payload: CreateProductPayload): Promise<Product | undefined> {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      const p = await createProduct(companyId, user.id, payload);
      await load();
      setSelected(p);
      return p;
    } finally { setSaving(false); }
  }

  async function handleUpdate(id: string, updates: Partial<Product>) {
    if (!companyId) return;
    setSaving(true);
    try {
      await updateProduct(companyId, id, updates);
      await load();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!companyId) return;
    await deleteProduct(companyId, id);
    if (selected?.id === id) setSelected(null);
    await load();
  }

  async function handleToggle(id: string, isActive: boolean) {
    if (!companyId) return;
    await toggleProductStatus(companyId, id, isActive);
    await load();
  }

  async function handleBulkImport(rows: any[]): Promise<{ inserted: number; updated: number; errors: string[] }> {
    if (!companyId || !user) return { inserted: 0, updated: 0, errors: [] };
    setSaving(true);
    try {
      const result = await bulkImportProducts(companyId, user.id, rows);
      await load();
      return result;
    } finally { setSaving(false); }
  }

  function handleExport() {
    exportProductsCSV(filtered.length > 0 ? filtered : products);
  }

  return {
    products, filtered, categories, selected, setSelected,
    kpis, loading, saving,
    filters, setFilters,
    handleCreate, handleUpdate, handleDelete, handleToggle,
    handleBulkImport, handleExport,
    reload: load,
  };
}
