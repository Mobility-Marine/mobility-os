"use client";
import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth }   from "@/lib/auth/AuthProvider";
import { supabase }  from "@/lib/supabaseClient";
import type {
  TrackingShipment, TrackingEvent, NotificationQueueItem, TrackingFilters,
} from "../types/tracking.types";
import { DEFAULT_TRACKING_FILTERS } from "../types/tracking.types";
import {
  fetchTrackingShipments, fetchEvents, fetchNotifications,
  fetchPendingNotifications, createEvent, createNotification,
  updateNotification, markNotifReady, sendNotification,
  cancelNotification, deleteEvent, filterTrackingShipments,
} from "./tracking.service";

export function useTrackingController() {
  const { companyId } = useTenant();
  const { user }      = useAuth();

  const [shipments,     setShipments]     = useState<TrackingShipment[]>([]);
  const [selected,      setSelected]      = useState<TrackingShipment | null>(null);
  const [events,        setEvents]        = useState<TrackingEvent[]>([]);
  const [notifications, setNotifications] = useState<NotificationQueueItem[]>([]);
  const [pendingGlobal, setPendingGlobal] = useState<NotificationQueueItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [filters,       setFilters]       = useState<TrackingFilters>(DEFAULT_TRACKING_FILTERS);

  const loadShipments = useCallback(async () => {
    if (!companyId) return;
    const [ships, pending] = await Promise.all([
      fetchTrackingShipments(companyId),
      fetchPendingNotifications(companyId),
    ]);
    setShipments(ships);
    setPendingGlobal(pending);
    setLoading(false);
  }, [companyId]);

  const loadDetail = useCallback(async (shipmentId: string) => {
    if (!companyId) return;
    const [evs, notifs] = await Promise.all([
      fetchEvents(companyId, shipmentId),
      fetchNotifications(companyId, shipmentId),
    ]);
    setEvents(evs);
    setNotifications(notifs);
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void loadShipments();
    const ch = supabase
      .channel(`tracking-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "shipment_tracking_events",    filter: `company_id=eq.${companyId}` }, () => void loadShipments())
      .on("postgres_changes", { event: "*", schema: "public", table: "shipment_notification_queue", filter: `company_id=eq.${companyId}` }, () => void loadShipments())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [companyId, loadShipments]);

  useEffect(() => {
    if (selected && companyId) void loadDetail(selected.id);
  }, [selected, companyId]);

  const filteredShipments = filterTrackingShipments(shipments, filters.search);

  async function handleSelectShipment(s: TrackingShipment) {
    setSelected(s);
    if (companyId) await loadDetail(s.id);
  }

  async function handleCreateEvent(payload: Parameters<typeof createEvent>[3]) {
    if (!companyId || !user || !selected) return;
    setSaving(true);
    try {
      const ev = await createEvent(companyId, user.id, selected.id, payload);
      await loadDetail(selected.id);
      await loadShipments();
      return ev;
    } finally { setSaving(false); }
  }

  async function handleDeleteEvent(id: string) {
    if (!companyId) return;
    await deleteEvent(companyId, id);
    if (selected) await loadDetail(selected.id);
    await loadShipments();
  }

  async function handleCreateNotification(payload: Partial<NotificationQueueItem>) {
    if (!companyId || !user || !selected) return;
    setSaving(true);
    try {
      await createNotification(companyId, user.id, payload);
      await loadDetail(selected.id);
      await loadShipments();
    } finally { setSaving(false); }
  }

  async function handleUpdateNotification(id: string, updates: Partial<NotificationQueueItem>) {
    if (!companyId) return;
    await updateNotification(companyId, id, updates);
    if (selected) await loadDetail(selected.id);
    await loadShipments();
  }

  async function handleMarkReady(id: string) {
    if (!companyId) return;
    await markNotifReady(companyId, id);
    if (selected) await loadDetail(selected.id);
    await loadShipments();
  }

  async function handleSendNotification(id: string) {
    if (!companyId) return;
    setSaving(true);
    try {
      await sendNotification(companyId, id);
      if (selected) await loadDetail(selected.id);
      await loadShipments();
    } finally { setSaving(false); }
  }

  async function handleCancelNotification(id: string) {
    if (!companyId) return;
    await cancelNotification(companyId, id);
    if (selected) await loadDetail(selected.id);
    await loadShipments();
  }

  return {
    shipments, filteredShipments, selected,
    events, notifications, pendingGlobal,
    loading, saving,
    filters, setFilters,
    handleSelectShipment,
    handleCreateEvent,
    handleDeleteEvent,
    handleCreateNotification,
    handleUpdateNotification,
    handleMarkReady,
    handleSendNotification,
    handleCancelNotification,
    reload: loadShipments,
  };
}
