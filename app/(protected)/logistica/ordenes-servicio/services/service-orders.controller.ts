"use client";

import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth }   from "@/lib/auth/AuthProvider";
import { supabase }  from "@/lib/supabaseClient";
import type { ServiceOrder, SOFilters } from "../types/service-orders.types";
import { DEFAULT_SO_FILTERS } from "../types/service-orders.types";
import {
  fetchServiceOrders, fetchServiceOrder, createServiceOrder,
  updateServiceOrder, updateSOStatus, deleteServiceOrder,
  filterServiceOrders,
} from "./service-orders.service";

export function useServiceOrdersController() {
  const { companyId } = useTenant();
  const { user }      = useAuth();

  const [orders,   setOrders]   = useState<ServiceOrder[]>([]);
  const [selected, setSelected] = useState<ServiceOrder | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [filters,  setFilters]  = useState<SOFilters>(DEFAULT_SO_FILTERS);

  const load = useCallback(async () => {
    if (!companyId) return;
    const data = await fetchServiceOrders(companyId);
    setOrders(data);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const ch = supabase
      .channel(`service-orders-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "service_orders", filter: `company_id=eq.${companyId}` },
        () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [companyId, load]);

  useEffect(() => {
    if (!selected || !companyId) return;
    fetchServiceOrder(companyId, selected.id).then((o) => { if (o) setSelected(o); });
  }, [orders]);

  const filtered = filterServiceOrders(orders, filters);

  async function handleCreate(data: Partial<ServiceOrder>): Promise<ServiceOrder | undefined> {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      const o = await createServiceOrder(companyId, user.id, data);
      await load();
      setSelected(o);
      return o;
    } finally { setSaving(false); }
  }

  async function handleUpdate(id: string, updates: Partial<ServiceOrder>) {
    if (!companyId) return;
    setSaving(true);
    try {
      await updateServiceOrder(companyId, id, updates);
      await load();
      if (selected?.id === id) {
        const updated = await fetchServiceOrder(companyId, id);
        if (updated) setSelected(updated);
      }
    } finally { setSaving(false); }
  }

  async function handleStatusChange(id: string, status: any) {
    if (!companyId) return;
    await updateSOStatus(companyId, id, status);
    await load();
    if (selected?.id === id) {
      const updated = await fetchServiceOrder(companyId, id);
      if (updated) setSelected(updated);
    }
  }

  async function handleDelete(id: string) {
    if (!companyId) return;
    await deleteServiceOrder(companyId, id);
    if (selected?.id === id) setSelected(null);
    await load();
  }

  async function reloadSelected() {
    if (!selected || !companyId) return;
    const o = await fetchServiceOrder(companyId, selected.id);
    if (o) setSelected(o);
  }

  return {
    orders, filtered, selected, setSelected,
    loading, saving,
    filters, setFilters,
    handleCreate, handleUpdate, handleStatusChange, handleDelete,
    reloadSelected, reload: load,
  };
}
