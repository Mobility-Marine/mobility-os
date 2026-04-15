"use client";

import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth }   from "@/lib/auth/AuthProvider";
import { supabase }  from "@/lib/supabaseClient";
import type { Shipment, ShipmentFilters, ShipmentKPIs, ShipmentStatus } from "../types/shipments.types";
import { DEFAULT_SHIPMENT_FILTERS } from "../types/shipments.types";
import {
  fetchShipments, fetchShipment, createShipment, updateShipment,
  updateShipmentStatus, filterShipments, computeShipmentKPIs,
} from "./shipments.service";

export function useShipmentsController() {
  const { companyId } = useTenant();
  const { user }      = useAuth();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selected,  setSelected]  = useState<Shipment | null>(null);
  const [kpis,      setKpis]      = useState<ShipmentKPIs | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [filters,   setFilters]   = useState<ShipmentFilters>(DEFAULT_SHIPMENT_FILTERS);

  const load = useCallback(async () => {
    if (!companyId) return;
    const data = await fetchShipments(companyId);
    setShipments(data);
    setKpis(computeShipmentKPIs(data));
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const ch = supabase
      .channel(`shipments-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "shipments", filter: `company_id=eq.${companyId}` },
        () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [companyId, load]);

  // Sync selected
useEffect(() => {
  if (!selected || !companyId) return;
  const updated = shipments.find((s) => s.id === selected.id);
  if (updated) setSelected(updated);
  else if (shipments.length > 0) setSelected(null); // fue eliminado
}, [shipments]);

  const filtered = filterShipments(shipments, filters);

  async function handleCreate(payload: any): Promise<Shipment | undefined> {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      const s = await createShipment(companyId, user.id, payload);
      await load();
      setSelected(s);
      return s;
    } finally { setSaving(false); }
  }

  async function handleUpdate(id: string, updates: Partial<Shipment>) {
    if (!companyId) return;
    setSaving(true);
    try {
      await updateShipment(companyId, id, updates);
      await load();
      if (selected?.id === id) {
        const updated = await fetchShipment(companyId, id);
        if (updated) setSelected(updated);
      }
    } finally { setSaving(false); }
  }

  async function handleStatusChange(id: string, status: ShipmentStatus) {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      await updateShipmentStatus(companyId, id, status, user.id);
      await load();
      if (selected?.id === id) {
        const updated = await fetchShipment(companyId, id);
        if (updated) setSelected(updated);
      }
    } finally { setSaving(false); }
  }

  async function reloadSelected() {
    if (!selected || !companyId) return;
    const s = await fetchShipment(companyId, selected.id);
    if (s) setSelected(s);
  }

  return {
    shipments, filtered, selected, setSelected,
    kpis, loading, saving,
    filters, setFilters,
    handleCreate, handleUpdate, handleStatusChange,
    reloadSelected, reload: load,
  };
}
