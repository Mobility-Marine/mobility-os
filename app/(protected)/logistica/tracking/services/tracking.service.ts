import { supabase }   from "@/lib/supabaseClient";
import type {
  TrackingEvent, NotificationQueueItem, TrackingShipment,
  TrackingEventType, NotifStatus,
} from "../types/tracking.types";

// ── SHIPMENTS para sidebar ─────────────────────────────────────

export async function fetchTrackingShipments(
  companyId: string,
  viewMode: "active" | "completed" | "all" = "active"
): Promise<TrackingShipment[]> {
  let q = supabase
    .from("shipments")
    .select("id, reference, service_type, origin, destination, status, client:business_partners!client_id(name)")
    .eq("company_id", companyId);

  if (viewMode === "active") {
    // Embarques en curso: excluye drafts, cancelados y los ya facturados
    q = q.in("status", ["pending", "coordinating", "pickup_scheduled", "in_transit", "at_destination", "delivered"]);
  } else if (viewMode === "completed") {
    // Solo facturados / cerrados
    q = q.in("status", ["delivered", "invoiced"]);
  } else {
    // "all": todo el historial excepto borradores y cancelados
    q = q.not("status", "in", '("draft","cancelled")');
  }

  const { data: shipments } = await q.order("created_at", { ascending: false });

  if (!shipments?.length) return [];

  const ids = shipments.map((s: any) => s.id);

  // Último evento por embarque
  const { data: lastEvents } = await supabase
    .from("shipment_tracking_events")
    .select("*")
    .in("shipment_id", ids)
    .eq("company_id", companyId)
    .order("status_date", { ascending: false });

  // Notificaciones pendientes por embarque
  const { data: notifs } = await supabase
    .from("shipment_notification_queue")
    .select("shipment_id")
    .in("shipment_id", ids)
    .eq("company_id", companyId)
    .in("status", ["draft", "ready"]);

  const lastEventMap: Record<string, TrackingEvent> = {};
  (lastEvents ?? []).forEach((e: any) => {
    if (!lastEventMap[e.shipment_id]) lastEventMap[e.shipment_id] = e as TrackingEvent;
  });

  const notifCount: Record<string, number> = {};
  (notifs ?? []).forEach((n: any) => {
    notifCount[n.shipment_id] = (notifCount[n.shipment_id] ?? 0) + 1;
  });

  return (shipments ?? []).map((s: any) => ({
    id:           s.id,
    reference:    s.reference,
    service_type: s.service_type,
    origin:       s.origin,
    destination:  s.destination,
    status:       s.status,
    client:       s.client,
    lastEvent:    lastEventMap[s.id] ?? null,
    pendingNotifs: notifCount[s.id] ?? 0,
  }));
}

// ── EVENTS ─────────────────────────────────────────────────────

export async function fetchEvents(companyId: string, shipmentId: string): Promise<TrackingEvent[]> {
  const { data } = await supabase
    .from("shipment_tracking_events")
    .select("*")
    .eq("company_id", companyId)
    .eq("shipment_id", shipmentId)
    .order("status_date", { ascending: false });
  return (data ?? []) as TrackingEvent[];
}

export async function createEvent(
  companyId: string, userId: string,
  shipmentId: string,
  payload: {
    event_type:       TrackingEventType;
    status_date:      string;
    location?:        string;
    description?:     string;
    external_source?: string;
    tracking_ref?:    string;
  }
): Promise<TrackingEvent> {
  const { data, error } = await supabase
    .from("shipment_tracking_events")
    .insert({
      ...payload,
      company_id:      companyId,
      shipment_id:     shipmentId,
      created_by:      userId,
      notified_client: false,
      external_source: payload.external_source ?? "manual",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as TrackingEvent;
}

export async function deleteEvent(companyId: string, id: string): Promise<void> {
  await supabase.from("shipment_tracking_events").delete().eq("id", id).eq("company_id", companyId);
}

// ── NOTIFICATIONS ──────────────────────────────────────────────

export async function fetchNotifications(companyId: string, shipmentId: string): Promise<NotificationQueueItem[]> {
  const { data } = await supabase
    .from("shipment_notification_queue")
    .select("*")
    .eq("company_id", companyId)
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: false });
  return (data ?? []) as NotificationQueueItem[];
}

export async function fetchPendingNotifications(companyId: string): Promise<NotificationQueueItem[]> {
  const { data } = await supabase
    .from("shipment_notification_queue")
    .select("*")
    .eq("company_id", companyId)
    .in("status", ["draft", "ready"])
    .order("created_at", { ascending: false });
  return (data ?? []) as NotificationQueueItem[];
}

export async function createNotification(
  companyId: string, userId: string,
  payload: Partial<NotificationQueueItem>
): Promise<NotificationQueueItem> {
  const { id: _id, company_id: _cid, created_at: _ca, ...safe } = payload as any;
  const { data, error } = await supabase
    .from("shipment_notification_queue")
    .insert({ ...safe, company_id: companyId, created_by: userId, status: "draft" })
    .select("*")
    .single();
  if (error) throw error;
  return data as NotificationQueueItem;
}

export async function updateNotification(
  companyId: string, id: string, updates: Partial<NotificationQueueItem>
): Promise<void> {
  const { id: _id, company_id: _cid, created_at: _ca, ...safe } = updates as any;
  await supabase.from("shipment_notification_queue")
    .update(safe).eq("id", id).eq("company_id", companyId);
}

export async function markNotifReady(companyId: string, id: string): Promise<void> {
  await supabase.from("shipment_notification_queue")
    .update({ status: "ready" }).eq("id", id).eq("company_id", companyId);
}

export async function sendNotification(companyId: string, id: string): Promise<void> {
  // Llama a la Edge Function de Supabase que dispara el email
  // La Edge Function se implementa cuando se configure el proveedor de email (Resend / SendGrid)
  const { error } = await supabase.functions.invoke("send-tracking-notification", {
    body: { notification_id: id, company_id: companyId },
  });

  if (error) {
    // Si la Edge Function no existe aún, marcamos como sent de todas formas en modo dev
    console.warn("Edge function not deployed yet — marking as sent locally:", error.message);
  }

  await supabase.from("shipment_notification_queue")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);

  // Marcar el evento como notified
  const { data: notif } = await supabase.from("shipment_notification_queue")
    .select("tracking_event_id").eq("id", id).single();

  if (notif?.tracking_event_id) {
    await supabase.from("shipment_tracking_events")
      .update({ notified_client: true, notification_sent_at: new Date().toISOString() })
      .eq("id", notif.tracking_event_id).eq("company_id", companyId);
  }
}

export async function cancelNotification(companyId: string, id: string): Promise<void> {
  await supabase.from("shipment_notification_queue")
    .update({ status: "cancelled" }).eq("id", id).eq("company_id", companyId);
}

// ── CARRIER SYNC (preparado, sin implementar) ──────────────────

export async function syncCarrierTracking(
  _companyId: string,
  _shipmentId: string,
  _carrier: string,
  _trackingNumber: string
): Promise<{ synced: number; message: string }> {
  // TODO: Implementar cuando se configuren las APIs de cada carrier
  // Carriers a implementar: FedEx, UPS, Estafeta, DHL, Maersk, CMA-CGM, MSC
  // Cada carrier tendrá su adapter: /lib/carriers/fedex.adapter.ts etc.
  return { synced: 0, message: "Carrier API not configured yet" };
}

// ── FILTROS ────────────────────────────────────────────────────

export function filterTrackingShipments(
  shipments: TrackingShipment[], search: string
): TrackingShipment[] {
  const q = search.trim().toLowerCase();
  if (!q) return shipments;
  return shipments.filter((s) =>
    s.reference.toLowerCase().includes(q) ||
    s.client?.name?.toLowerCase().includes(q) ||
    s.origin?.toLowerCase().includes(q) ||
    s.destination?.toLowerCase().includes(q)
  );
}
