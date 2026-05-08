export type TrackingEventType =
  | "pickup_confirmed" | "departed_origin" | "in_transit"
  | "customs_entry"   | "customs_release"  | "at_destination"
  | "out_for_delivery"| "delivered"        | "incident" | "note";

export type ExternalSource =
  | "manual" | "fedex" | "ups" | "estafeta" | "dhl"
  | "maersk" | "cma_cgm" | "msc" | "other_carrier";

export type NotifStatus = "draft" | "ready" | "sent" | "cancelled";

// Configuración visual por tipo de evento
export const EVENT_CONFIG: Record<TrackingEventType, {
  labelKey:  string;
  color:     string;
  bg:        string;
  border:    string;
  icon:      "truck" | "plane" | "ship" | "check" | "alert" | "note" | "customs";
  terminal?: boolean; // cierra el timeline
}> = {
  pickup_confirmed:  { labelKey: "logistics.evTypePickupConfirmed", color: "#2563eb",  bg: "#dbeafe",  border: "#93c5fd",  icon: "truck"    },
  departed_origin:   { labelKey: "logistics.evTypeDepartedOrigin",  color: "#7c3aed",  bg: "#ede9fe",  border: "#c4b5fd",  icon: "truck"    },
  in_transit:        { labelKey: "logistics.evTypeInTransit",        color: "#0891b2",  bg: "#cffafe",  border: "#67e8f9",  icon: "truck"    },
  customs_entry:     { labelKey: "logistics.evTypeCustomsEntry",     color: "#d97706",  bg: "#fef3c7",  border: "#fcd34d",  icon: "customs"  },
  customs_release:   { labelKey: "logistics.evTypeCustomsRelease",   color: "#059669",  bg: "#d1fae5",  border: "#6ee7b7",  icon: "customs"  },
  at_destination:    { labelKey: "logistics.evTypeAtDestination",    color: "#0f766e",  bg: "#ccfbf1",  border: "#5eead4",  icon: "check"    },
  out_for_delivery:  { labelKey: "logistics.evTypeOutForDelivery",   color: "#9333ea",  bg: "#f3e8ff",  border: "#d8b4fe",  icon: "truck"    },
  delivered:         { labelKey: "logistics.evTypeDelivered",        color: "#16a34a",  bg: "#dcfce7",  border: "#86efac",  icon: "check",   terminal: true },
  incident:          { labelKey: "logistics.evTypeIncident",         color: "#dc2626",  bg: "#fee2e2",  border: "#fca5a5",  icon: "alert"    },
  note:              { labelKey: "logistics.evTypeNote",             color: "#64748b",  bg: "#f8fafc",  border: "#e2e8f0",  icon: "note"     },
};

export const NOTIF_STATUS_CONFIG: Record<NotifStatus, {
  labelKey: string; color: string; bg: string; border: string;
}> = {
  draft:     { labelKey: "logistics.notifDraft",     color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"  },
  ready:     { labelKey: "logistics.notifReady",     color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)"   },
  sent:      { labelKey: "logistics.notifSent",      color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
  cancelled: { labelKey: "logistics.notifCancelled", color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"  },
};

export type TrackingEvent = {
  id:                   string;
  company_id:           string;
  shipment_id:          string;
  event_type:           TrackingEventType;
  status_date:          string;
  location?:            string | null;
  description?:         string | null;
  latitude?:            number | null;
  longitude?:           number | null;
  external_source:      ExternalSource;
  tracking_ref?:        string | null;
  carrier_raw_data?:    any;
  notified_client:      boolean;
  notification_sent_at?: string | null;
  created_by?:          string | null;
  created_at:           string;
};

export type NotificationQueueItem = {
  id:                 string;
  company_id:         string;
  shipment_id:        string;
  tracking_event_id?: string | null;
  status:             NotifStatus;
  subject:            string;
  body_html:          string;
  recipient_email:    string;
  recipient_name?:    string | null;
  sender_name?:       string | null;
  created_by?:        string | null;
  created_at:         string;
  sent_at?:           string | null;
};

// Shipment enriquecido para el sidebar de tracking
export type TrackingShipment = {
  id:           string;
  reference:    string;
  service_type: string;
  origin?:      string | null;
  destination?: string | null;
  status:       string;
  client?:      { name: string } | null;
  lastEvent?:   TrackingEvent | null;
  pendingNotifs: number;
};

export type TrackingFilters = {
  search:    string;
  status:    string;
  view_mode: "active" | "completed" | "all";
};

export const DEFAULT_TRACKING_FILTERS: TrackingFilters = {
  search: "", status: "all", view_mode: "active",
};

// Genera el cuerpo HTML del email de notificación
export function buildNotificationEmail(params: {
  shipmentRef:  string;
  clientName:   string;
  eventType:    TrackingEventType;
  eventLabel:   string;
  statusDate:   string;
  location?:    string | null;
  description?: string | null;
  companyName:  string;
  locale:       string;
}): { subject: string; body_html: string } {
  const { shipmentRef, clientName, eventLabel, statusDate, location, description, companyName, locale } = params;
  const dateStr = new Date(statusDate).toLocaleString(locale === "en" ? "en-US" : "es-MX", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const subject = `Actualización de embarque ${shipmentRef} — ${eventLabel}`;

  const body_html = `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#0a1628;padding:24px 32px;">
      <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${companyName}</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Actualización de embarque</div>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;font-size:14px;color:#64748b;">Estimado/a <strong>${clientName}</strong>,</p>
      <p style="margin:0 0 24px;font-size:14px;color:#475569;">Le informamos que su embarque ha registrado la siguiente novedad:</p>

      <div style="background:#f1f5f9;border-radius:8px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #2563eb;">
        <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Estado</div>
        <div style="font-size:18px;font-weight:800;color:#0f172a;">${eventLabel}</div>
        <div style="font-size:13px;color:#64748b;margin-top:4px;">${dateStr}</div>
        ${location ? `<div style="font-size:13px;color:#475569;margin-top:8px;">📍 ${location}</div>` : ""}
        ${description ? `<div style="font-size:13px;color:#475569;margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0;">${description}</div>` : ""}
      </div>

      <div style="background:#f8fafc;border-radius:6px;padding:12px 16px;margin-bottom:24px;">
        <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Referencia de embarque</div>
        <div style="font-size:16px;font-weight:700;color:#0f172a;font-family:monospace;">${shipmentRef}</div>
      </div>

      <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">Si tiene alguna duda sobre su embarque, no dude en contactarnos.</p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <div style="font-size:11px;color:#94a3b8;text-align:center;">${companyName} · Notificación automática generada por Mobility OS</div>
    </div>
  </div>
</body>
</html>`.trim();

  return { subject, body_html };
}
