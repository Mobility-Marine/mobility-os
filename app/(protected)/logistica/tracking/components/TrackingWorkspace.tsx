"use client";
import { useState } from "react";
import type {
  TrackingShipment, TrackingEvent, NotificationQueueItem,
  TrackingEventType, ExternalSource,
} from "../types/tracking.types";
import { EVENT_CONFIG, NOTIF_STATUS_CONFIG, buildNotificationEmail } from "../types/tracking.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant }      from "@/lib/tenant/TenantProvider";

type Tab = "timeline" | "notifications";

type Props = {
  shipment:              TrackingShipment | null;
  events:                TrackingEvent[];
  notifications:         NotificationQueueItem[];
  saving:                boolean;
  companySettings?:      any;
  onCreateEvent:         (p: any) => Promise<TrackingEvent | undefined>;
  onDeleteEvent:         (id: string) => Promise<void>;
  onCreateNotification:  (p: any) => Promise<void>;
  onUpdateNotification:  (id: string, updates: any) => Promise<void>;
  onMarkReady:           (id: string) => Promise<void>;
  onSend:                (id: string) => Promise<void>;
  onCancel:              (id: string) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

// Icono por tipo de evento
function EventIcon({ type }: { type: TrackingEventType }) {
  const icons: Record<string, React.ReactNode> = {
    truck: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h5l3 5v5h-8V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    alert: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    note:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    customs: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  };
  const cfg = EVENT_CONFIG[type];
  return <span style={{ color: cfg.color }}>{icons[cfg.icon] ?? icons.truck}</span>;
}

export default function TrackingWorkspace({
  shipment, events, notifications, saving, companySettings,
  onCreateEvent, onDeleteEvent, onCreateNotification,
  onUpdateNotification, onMarkReady, onSend, onCancel,
}: Props) {
  const { t, lang } = useTranslation();
  const { companyId } = useTenant();
  const tl    = (t.logistics as any) ?? {};
  const locale = lang === "en" ? "en-US" : "es-MX";

  const [tab,          setTab]          = useState<Tab>("timeline");
  const [addingEvent,  setAddingEvent]  = useState(false);
  const [eventType,    setEventType]    = useState<TrackingEventType>("in_transit");
  const [eventDate,    setEventDate]    = useState(() => new Date().toISOString().slice(0, 16));
  const [eventLoc,     setEventLoc]     = useState("");
  const [eventDesc,    setEventDesc]    = useState("");
  const [eventSrc,     setEventSrc]     = useState<ExternalSource>("manual");
  const [eventRef,     setEventRef]     = useState("");
  const [generateNotif,setGenerateNotif]= useState(false);
  const [notifEmail,   setNotifEmail]   = useState("");
  const [notifName,    setNotifName]    = useState("");

  const [editingNotif, setEditingNotif] = useState<string | null>(null);
  const [editSubject,  setEditSubject]  = useState("");
  const [editBody,     setEditBody]     = useState("");
  const [previewNotif, setPreviewNotif] = useState<NotificationQueueItem | null>(null);

  const EVENT_TYPES = Object.keys(EVENT_CONFIG) as TrackingEventType[];
  const pendingNotifs = notifications.filter((n) => n.status === "draft" || n.status === "ready");

  if (!shipment) return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", height: "100%" }}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>{tl.trackingWorkspaceEmpty ?? "Selecciona un embarque"}</div>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>{tl.trackingWorkspaceEmptyDesc ?? "Aquí verás el timeline de eventos."}</div>
    </div>
  );

  async function handleSaveEvent() {
    if (!eventDate) return;
    const ev = await onCreateEvent({
      event_type:      eventType,
      status_date:     new Date(eventDate).toISOString(),
      location:        eventLoc   || undefined,
      description:     eventDesc  || undefined,
      external_source: eventSrc,
      tracking_ref:    eventRef   || undefined,
    });

    if (generateNotif && notifEmail.trim() && ev) {
      const label    = tl[EVENT_CONFIG[eventType].labelKey.replace("logistics.", "")] ?? eventType;
      const { subject, body_html } = buildNotificationEmail({
        shipmentRef:  shipment.reference,
        clientName:   notifName || shipment.client?.name || "Cliente",
        eventType,
        eventLabel:   label,
        statusDate:   ev.status_date,
        location:     eventLoc  || null,
        description:  eventDesc || null,
        companyName:  companySettings?.fiscal_name ?? "Mobility OS",
        locale,
      });
      await onCreateNotification({
        shipment_id:       shipment.id,
        tracking_event_id: ev.id,
        subject,
        body_html,
        recipient_email:   notifEmail.trim(),
        recipient_name:    notifName || shipment.client?.name || undefined,
        sender_name:       companySettings?.fiscal_name ?? undefined,
      });
    }

    setAddingEvent(false);
    resetEventForm();
  }

  function resetEventForm() {
    setEventType("in_transit"); setEventDate(new Date().toISOString().slice(0,16));
    setEventLoc(""); setEventDesc(""); setEventSrc("manual"); setEventRef("");
    setGenerateNotif(false); setNotifEmail(""); setNotifName("");
  }

  function startEditNotif(n: NotificationQueueItem) {
    setEditingNotif(n.id);
    setEditSubject(n.subject);
    setEditBody(n.body_html);
  }

  async function saveEditNotif() {
    if (!editingNotif) return;
    await onUpdateNotification(editingNotif, { subject: editSubject, body_html: editBody });
    setEditingNotif(null);
  }

  const TABS = [
    { key: "timeline" as Tab,       label: `${tl.tabTimeline3 ?? "Timeline"} (${events.length})` },
    { key: "notifications" as Tab,  label: `${tl.tabNotifications ?? "Notificaciones"} ${pendingNotifs.length > 0 ? `(${pendingNotifs.length})` : ""}` },
  ];

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>

      {/* HEADER */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-text-primary)", fontFamily: "monospace" }}>{shipment.reference}</span>
          {shipment.client?.name && (
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>· {shipment.client.name}</span>
          )}
          {pendingNotifs.length > 0 && (
            <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", color: "var(--color-warning-text)" }}>
              {pendingNotifs.length} {tl.pendingNotifications ?? "notif. pendientes"}
            </span>
          )}
        </div>
        {(shipment.origin || shipment.destination) && (
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            {shipment.origin}{shipment.origin && shipment.destination ? " → " : ""}{shipment.destination}
          </div>
        )}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{ height: "36px", padding: "0 14px", border: "none", background: "transparent", borderBottom: tab === tb.key ? "2px solid var(--color-brand-blue)" : "2px solid transparent", color: tab === tb.key ? "var(--color-brand-blue)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: tab === tb.key ? 700 : 400, cursor: "pointer" }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>

        {/* ── TIMELINE ── */}
        {tab === "timeline" && (
          <div style={{ display: "grid", gap: "12px" }}>
            {/* Botón agregar evento */}
            {!addingEvent ? (
              <button onClick={() => setAddingEvent(true)} style={{ height: "34px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                {tl.addEvent ?? "Agregar evento"}
              </button>
            ) : (
              /* ── FORM NUEVO EVENTO ── */
              <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", display: "grid", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>

                  {/* Tipo */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.eventType ?? "Tipo de evento"} *</div>
                    <select value={eventType} onChange={(e) => setEventType(e.target.value as TrackingEventType)} style={{ ...INPUT, cursor: "pointer" }}>
                      {EVENT_TYPES.map((k) => (
                        <option key={k} value={k}>{tl[EVENT_CONFIG[k].labelKey.replace("logistics.","")] ?? k}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fecha */}
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.eventDate ?? "Fecha"} *</div>
                    <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} style={INPUT} />
                  </div>

                  {/* Ubicación */}
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.eventLocation ?? "Ubicación"}</div>
                    <input value={eventLoc} onChange={(e) => setEventLoc(e.target.value)} placeholder="Ciudad, puerto, aduana…" style={INPUT} />
                  </div>

                  {/* Descripción */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.eventDescription ?? "Descripción"}</div>
                    <textarea rows={2} value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} placeholder="Novedad, observación, detalle del evento…" style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical", lineHeight: 1.5 }} />
                  </div>

                  {/* Fuente */}
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.eventSource ?? "Fuente"}</div>
                    <select value={eventSrc} onChange={(e) => setEventSrc(e.target.value as ExternalSource)} style={{ ...INPUT, cursor: "pointer" }}>
                      {(["manual","fedex","ups","estafeta","dhl","maersk","cma_cgm","msc","other_carrier"] as ExternalSource[]).map((s) => (
                        <option key={s} value={s}>{tl[`source${s.charAt(0).toUpperCase()}${s.slice(1).replace(/_([a-z])/g, (_:string,l:string)=>l.toUpperCase())}`] ?? s}</option>
                      ))}
                    </select>
                  </div>

                  {/* No. rastreo externo */}
                  {eventSrc !== "manual" && (
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.trackingRef ?? "No. Rastreo"}</div>
                      <input value={eventRef} onChange={(e) => setEventRef(e.target.value)} style={INPUT} />
                    </div>
                  )}
                </div>

                {/* Notificar al cliente */}
                <div style={{ borderTop: "1px solid var(--color-border-faint)", paddingTop: "10px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: generateNotif ? "10px" : 0 }}>
                    <input type="checkbox" checked={generateNotif} onChange={(e) => setGenerateNotif(e.target.checked)} style={{ width: "15px", height: "15px", cursor: "pointer" }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{tl.generateNotif ?? "Generar notificación al cliente"}</span>
                  </label>

                  {generateNotif && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px", padding: "10px", background: "var(--color-info-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-info-border)" }}>
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-brand-blue)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.notifRecipientEmail ?? "Email"} *</div>
                        <input value={notifEmail} onChange={(e) => setNotifEmail(e.target.value)} placeholder="cliente@empresa.com" style={{ ...INPUT, background: "#fff" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-brand-blue)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.notifRecipientName ?? "Nombre"}</div>
                        <input value={notifName} onChange={(e) => setNotifName(e.target.value)} placeholder={shipment.client?.name ?? "Nombre del contacto"} style={{ ...INPUT, background: "#fff" }} />
                      </div>
                      <div style={{ gridColumn: "1 / -1", fontSize: "11px", color: "var(--color-brand-blue)", lineHeight: 1.5 }}>
                        El email quedará en <strong>Borrador</strong> — podrás editarlo y confirmarlo antes de enviar.
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleSaveEvent} disabled={saving || !eventDate} style={{ height: "32px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    {saving ? t.general.loading : t.general.save}
                  </button>
                  <button onClick={() => { setAddingEvent(false); resetEventForm(); }} style={{ height: "32px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
                    {t.general.cancel}
                  </button>
                </div>
              </div>
            )}

            {/* ── LISTA DE EVENTOS (TIMELINE) ── */}
            {events.length === 0 ? (
              <div style={{ padding: "28px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                {tl.noEvents ?? "Sin eventos registrados"}
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                {/* Línea vertical del timeline */}
                <div style={{ position: "absolute", left: "14px", top: "20px", bottom: "20px", width: "2px", background: "var(--color-border-faint)", zIndex: 0 }} />

                <div style={{ display: "grid", gap: "8px" }}>
                  {events.map((ev, idx) => {
                    const cfg    = EVENT_CONFIG[ev.event_type];
                    const label  = tl[cfg.labelKey.replace("logistics.", "")] ?? ev.event_type;
                    const srcKey = `source${ev.external_source.charAt(0).toUpperCase()}${ev.external_source.slice(1).replace(/_([a-z])/g, (_:string,l:string)=>l.toUpperCase())}`;
                    const srcLabel = tl[srcKey] ?? ev.external_source;

                    return (
                      <div key={ev.id} style={{ display: "flex", gap: "12px", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
                        {/* Dot en el timeline */}
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: cfg.bg, border: `2px solid ${cfg.color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "4px" }}>
                          <EventIcon type={ev.event_type} />
                        </div>

                        {/* Contenido */}
                        <div style={{ flex: 1, padding: "10px 12px", borderRadius: "var(--radius-md)", background: idx === 0 ? cfg.bg : "var(--color-bg-subtle)", border: `1px solid ${idx === 0 ? cfg.border : "var(--color-border-faint)"}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: cfg.color }}>{label}</span>
                            {ev.notified_client && (
                              <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)" }}>Notificado</span>
                            )}
                            {ev.external_source !== "manual" && (
                              <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "var(--radius-full)", background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>{srcLabel}</span>
                            )}
                            <div style={{ flex: 1 }} />
                            <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                              {new Date(ev.status_date).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <button onClick={() => onDeleteEvent(ev.id)} style={{ width: "18px", height: "18px", borderRadius: "var(--radius-sm)", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", opacity: 0.5 }}>
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                          {ev.location && (
                            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "2px" }}>📍 {ev.location}</div>
                          )}
                          {ev.description && (
                            <div style={{ fontSize: "11px", color: "var(--color-text-primary)", lineHeight: 1.5 }}>{ev.description}</div>
                          )}
                          {ev.tracking_ref && (
                            <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px", fontFamily: "monospace" }}>Ref: {ev.tracking_ref}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── NOTIFICACIONES ── */}
        {tab === "notifications" && (
          <div style={{ display: "grid", gap: "12px" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "28px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                {tl.noNotifications ?? "Sin notificaciones en cola"}
              </div>
            ) : notifications.map((n) => {
              const stCfg     = NOTIF_STATUS_CONFIG[n.status];
              const stLabel   = tl[stCfg.labelKey.replace("logistics.", "")] ?? n.status;
              const isEditing = editingNotif === n.id;

              return (
                <div key={n.id} style={{ borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: `1px solid ${stCfg.border}`, overflow: "hidden" }}>
                  {/* Header notificación */}
                  <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px", background: stCfg.bg, borderBottom: `1px solid ${stCfg.border}` }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: stCfg.bg, border: `1px solid ${stCfg.border}`, color: stCfg.color }}>{stLabel}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.subject}</span>
                    <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{n.recipient_email}</span>
                  </div>

                  {/* Acciones por estado */}
                  {n.status !== "sent" && n.status !== "cancelled" && !isEditing && (
                    <div style={{ padding: "8px 14px", display: "flex", gap: "6px", flexWrap: "wrap", borderBottom: "1px solid var(--color-border-faint)" }}>
                      {n.status === "draft" && (
                        <>
                          <button onClick={() => startEditNotif(n)} style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            {tl.editNotif ?? "Editar"}
                          </button>
                          <button onClick={() => setPreviewNotif(previewNotif?.id === n.id ? null : n)} style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", cursor: "pointer" }}>
                            {previewNotif?.id === n.id ? "Ocultar" : tl.previewEmail ?? "Vista previa"}
                          </button>
                          <button onClick={() => onMarkReady(n.id)} style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", color: "var(--color-brand-blue)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                            {tl.markReady ?? "Marcar lista"}
                          </button>
                        </>
                      )}
                      {n.status === "ready" && (
                        <>
                          <button onClick={() => setPreviewNotif(previewNotif?.id === n.id ? null : n)} style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", cursor: "pointer" }}>
                            {previewNotif?.id === n.id ? "Ocultar" : tl.previewEmail ?? "Vista previa"}
                          </button>
                          <button onClick={() => onSend(n.id)} disabled={saving} style={{ height: "26px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                            {saving ? t.general.loading : (tl.sendNow ?? "Confirmar y enviar")}
                          </button>
                        </>
                      )}
                      <button onClick={() => onCancel(n.id)} style={{ height: "26px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", cursor: "pointer" }}>
                        {tl.cancelNotif ?? "Cancelar"}
                      </button>
                    </div>
                  )}

                  {/* Editor inline */}
                  {isEditing && (
                    <div style={{ padding: "12px 14px", display: "grid", gap: "8px", borderBottom: "1px solid var(--color-border-faint)" }}>
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.notifSubject ?? "Asunto"}</div>
                        <input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} style={INPUT} />
                      </div>
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.notifRecipientEmail ?? "Email destinatario"}</div>
                        <input value={n.recipient_email} readOnly style={{ ...INPUT, opacity: 0.6 }} />
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={saveEditNotif} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                          {t.general.save}
                        </button>
                        <button onClick={() => setEditingNotif(null)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                          {t.general.cancel}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sent info */}
                  {n.status === "sent" && n.sent_at && (
                    <div style={{ padding: "8px 14px" }}>
                      <span style={{ fontSize: "11px", color: "var(--color-success-text)" }}>
                        {tl.notifSentAt ?? "Enviada el"}: {new Date(n.sent_at).toLocaleString(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  )}

                  {/* Preview */}
                  {previewNotif?.id === n.id && (
                    <div style={{ padding: "12px 14px", borderTop: "1px solid var(--color-border-faint)" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>{tl.previewEmail ?? "Vista previa"}</div>
                      <div
                        style={{ border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", overflow: "hidden", maxHeight: "300px", overflowY: "auto" }}
                        dangerouslySetInnerHTML={{ __html: n.body_html }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
