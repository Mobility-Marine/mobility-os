"use client";

import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth }   from "@/lib/auth/AuthProvider";
import { supabase }  from "@/lib/supabaseClient";
import type { Order, OrderFilters, OrderKPIs, OrderStatus } from "../types/orders.types";
import { DEFAULT_ORDER_FILTERS } from "../types/orders.types";
import {
  fetchOrders, fetchOrder, updateOrderStatus, updateOrder,
  filterOrders, computeOrderKPIs,
} from "./orders.service";

export function useOrdersController() {
  const { companyId } = useTenant();
  const { user }      = useAuth();

  const [orders,   setOrders]   = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [kpis,     setKpis]     = useState<OrderKPIs | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [filters,  setFilters]  = useState<OrderFilters>(DEFAULT_ORDER_FILTERS);

  const load = useCallback(async () => {
    if (!companyId) return;
    const orders = await fetchOrders(companyId);
    setOrders(orders);
    setKpis(computeOrderKPIs(orders));
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const ch = supabase
      .channel(`orders-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `company_id=eq.${companyId}` },
        () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [companyId, load]);

  // Sync selected
  useEffect(() => {
    if (!selected || !companyId) return;
    fetchOrder(companyId, selected.id).then((o) => { if (o) setSelected(o); });
  }, [orders]);

  const filtered = filterOrders(orders, filters);

  async function handleStatusChange(id: string, status: OrderStatus) {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      await updateOrderStatus(companyId, id, status, user.id);
      await load();
      if (selected?.id === id) {
        const updated = await fetchOrder(companyId, id);
        if (updated) setSelected(updated);
      }
    } finally { setSaving(false); }
  }

  async function handleUpdate(id: string, updates: Partial<Order>) {
    if (!companyId) return;
    setSaving(true);
    try {
      await updateOrder(companyId, id, updates);
      await load();
      if (selected?.id === id) {
        const updated = await fetchOrder(companyId, id);
        if (updated) setSelected(updated);
      }
    } finally { setSaving(false); }
  }

  return {
    orders, filtered, selected, setSelected,
    kpis, loading, saving,
    filters, setFilters,
    handleStatusChange, handleUpdate,
    reload: load,
  };
}
