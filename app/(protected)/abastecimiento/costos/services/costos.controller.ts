import { useState, useCallback } from "react";
import type { CostItem, PriceHistory, SupplierComparison, CostStats, ImportRow, CostFilters } from "../types/costos.types";
import {
  fetchCostItems, fetchPriceHistory, fetchSupplierComparison,
  fetchCostStats, insertManualPrice, resolveImportRows, applyImport,
} from "./costos.service";

export function useCostosController(companyId: string, userId: string) {
  const [items,          setItems]          = useState<CostItem[]>([]);
  const [history,        setHistory]        = useState<PriceHistory[]>([]);
  const [suppliers,      setSuppliers]      = useState<SupplierComparison[]>([]);
  const [stats,          setStats]          = useState<CostStats>({ total_items: 0, total_stock_value: 0, avg_margin: 0, negative_margin: 0, low_margin: 0, no_price: 0 });
  const [selectedItem,   setSelectedItem]   = useState<CostItem | null>(null);
  const [importRows,     setImportRows]     = useState<ImportRow[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try {
      const [items, stats] = await Promise.all([fetchCostItems(companyId), fetchCostStats(companyId)]);
      setItems(items);
      setStats(stats);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyId]);

  const loadHistory = useCallback(async (itemId: string) => {
    setLoading(true);
    try {
      const [hist, sup] = await Promise.all([
        fetchPriceHistory(companyId, itemId),
        fetchSupplierComparison(companyId, itemId),
      ]);
      setHistory(hist);
      setSuppliers(sup);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyId]);

  const handleSelectItem = useCallback((item: CostItem | null) => {
    setSelectedItem(item);
    if (item) loadHistory(item.item_id);
    else { setHistory([]); setSuppliers([]); }
  }, [loadHistory]);

  const handleAddManualPrice = useCallback(async (
    itemId: string, supplierId: string | null, price: number, currency: string, notes?: string
  ) => {
    setSaving(true); setError(null);
    try {
      await insertManualPrice(companyId, userId, itemId, supplierId, price, currency, notes);
      await loadHistory(itemId);
      await load();
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load, loadHistory]);

  const handleResolveImport = useCallback(async (rows: ImportRow[]) => {
    setSaving(true); setError(null);
    try {
      const resolved = await resolveImportRows(companyId, rows);
      setImportRows(resolved);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }, [companyId]);

  const handleApplyImport = useCallback(async () => {
    setSaving(true); setError(null);
    try {
      const result = await applyImport(companyId, userId, importRows);
      setImportRows([]);
      await load();
      return result;
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, importRows, load]);

  return {
    items, history, suppliers, stats, selectedItem, importRows,
    loading, saving, error,
    load, loadHistory, handleSelectItem,
    handleAddManualPrice, handleResolveImport, handleApplyImport,
    setImportRows,
  };
}
