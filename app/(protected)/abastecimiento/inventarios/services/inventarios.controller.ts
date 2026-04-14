import { useState, useCallback } from "react";
import type {
  Warehouse, InventoryItem, InventoryMovement, InventoryCount,
  InventoryStats, InventoryFilters, MovementFilters,
  CreateWarehousePayload, CreateItemPayload, CreateMovementPayload,
} from "../types/inventarios.types";
import {
  fetchWarehouses, createWarehouse, updateWarehouse,
  fetchItems, fetchItem, createItem, updateItem,
  fetchMovements, registerMovement,
  fetchCounts, fetchCount, createCount, updateCountItem, completeCount,
  fetchInventoryStats,
} from "./inventarios.service";

export function useInventarioController(companyId: string, userId: string) {
  const [warehouses,  setWarehouses]  = useState<Warehouse[]>([]);
  const [items,       setItems]       = useState<InventoryItem[]>([]);
  const [selectedItem,setSelectedItem]= useState<InventoryItem | null>(null);
  const [movements,   setMovements]   = useState<InventoryMovement[]>([]);
  const [counts,      setCounts]      = useState<InventoryCount[]>([]);
  const [selectedCount,setSelectedCount] = useState<InventoryCount | null>(null);
  const [stats,       setStats]       = useState<InventoryStats>({ total_items: 0, total_value: 0, below_min: 0, at_reorder: 0, zero_stock: 0, warehouses_count: 0 });
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const loadAll = useCallback(async (filters: InventoryFilters) => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try {
      const [wh, itms, st] = await Promise.all([
        fetchWarehouses(companyId),
        fetchItems(companyId, filters),
        fetchInventoryStats(companyId),
      ]);
      setWarehouses(wh);
      setItems(itms);
      setStats(st);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyId]);

  const loadMovements = useCallback(async (filters: MovementFilters) => {
    if (!companyId) return;
    setLoading(true);
    try {
      const mv = await fetchMovements(companyId, filters);
      setMovements(mv);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyId]);

  const loadCounts = useCallback(async () => {
    if (!companyId) return;
    try {
      const c = await fetchCounts(companyId);
      setCounts(c);
    } catch (e: any) { setError(e.message); }
  }, [companyId]);

  const loadCountDetail = useCallback(async (id: string) => {
    const c = await fetchCount(id);
    setSelectedCount(c);
  }, []);

  const handleCreateWarehouse = useCallback(async (payload: CreateWarehousePayload) => {
    setSaving(true); setError(null);
    try {
      const wh = await createWarehouse(companyId, userId, payload);
      setWarehouses((p) => [...p, wh]);
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId]);

  const handleUpdateWarehouse = useCallback(async (id: string, payload: Partial<CreateWarehousePayload>) => {
    setSaving(true); setError(null);
    try {
      await updateWarehouse(id, payload);
      setWarehouses((p) => p.map((w) => w.id === id ? { ...w, ...payload } : w));
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, []);

  const handleCreateItem = useCallback(async (payload: CreateItemPayload, filters: InventoryFilters) => {
    setSaving(true); setError(null);
    try {
      await createItem(companyId, userId, payload);
      await loadAll(filters);
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, loadAll]);

  const handleUpdateItem = useCallback(async (id: string, payload: Partial<CreateItemPayload>, filters: InventoryFilters) => {
    setSaving(true); setError(null);
    try {
      await updateItem(id, payload);
      await loadAll(filters);
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [loadAll]);

  const handleRegisterMovement = useCallback(async (payload: CreateMovementPayload, movFilters: MovementFilters, invFilters: InventoryFilters) => {
    setSaving(true); setError(null);
    try {
      await registerMovement(companyId, userId, payload);
      await Promise.all([loadAll(invFilters), loadMovements(movFilters)]);
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, loadAll, loadMovements]);

  const handleCreateCount = useCallback(async (warehouseId: string, countDate: string, notes?: string) => {
    setSaving(true); setError(null);
    try {
      const c = await createCount(companyId, userId, warehouseId, countDate, notes);
      await loadCounts();
      setSelectedCount(await fetchCount(c.id));
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, loadCounts]);

  const handleUpdateCountItem = useCallback(async (itemId: string, qty: number, notes?: string) => {
    try {
      await updateCountItem(itemId, qty, notes);
      if (selectedCount) await loadCountDetail(selectedCount.id);
    } catch (e: any) { setError(e.message); throw e; }
  }, [selectedCount, loadCountDetail]);

  const handleCompleteCount = useCallback(async (countId: string) => {
    setSaving(true); setError(null);
    try {
      await completeCount(countId, companyId, userId);
      await loadCounts();
      setSelectedCount(null);
    } catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, loadCounts]);

  return {
    warehouses, items, selectedItem, movements, counts, selectedCount, stats,
    loading, saving, error,
    setSelectedItem, setSelectedCount,
    loadAll, loadMovements, loadCounts, loadCountDetail,
    handleCreateWarehouse, handleUpdateWarehouse,
    handleCreateItem, handleUpdateItem,
    handleRegisterMovement,
    handleCreateCount, handleUpdateCountItem, handleCompleteCount,
  };
}
