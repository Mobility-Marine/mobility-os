"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";

interface TimelineEvent {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
}

function getEventColor(type: string): string {
  if (type?.includes("prospect"))  return "var(--color-brand-blue)";
  if (type?.includes("quotation")) return "var(--color-info-text)";
  if (type?.includes("invoice"))   return "var(--color-success-text)";
  if (type?.includes("shipment"))  return "var(--color-warning-text)";
  if (type?.includes("alert"))     return "var(--color-danger-text)";
  return "var(--color-text-muted)";
}

function getEventBg(type: string): string {
  if (type?.includes("prospect"))  return "var(--color-brand-blue-light)";
  if (type?.includes("quotation")) return "var(--color-info-bg)";
  if (type?.includes("invoice"))   return "var(--color-success-bg)";
  if (type?.includes("shipment"))  return "var(--color-warning-bg)";
  if (type?.includes("alert"))     return "var(--color-danger-bg)";
  return "var(--color-bg-subtle)";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "ahora";
  if (diff < 60) return `hace ${diff}m`;
  if (diff < 1440) return `hace ${Math.floor(diff / 60)}h`;
  return `hace ${Math.floor(diff / 1440)}d`;
}

const PLACEHOLDER_EVENTS = [
  { id: "p1", event_type: "prospect", description: "Sin actividad reciente registrada", created_at: new Date().toISOString() },
  { id: "p2", event_type: "quotation", description: "Los eventos aparecerán aquí en tiempo real", created_at: new Date(Date.now() - 300000).toISOString() },
  { id: "p3", event_type: "invoice", description: "Conecta módulos para ver actividad", created_at: new Date(Date.now() - 600000).toISOString() },
];

export default function ActivityFeed() {
  const { companyId } = useTenant();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const channel = supabase
      .channel(`timeline-${companyId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "entity_timeline_events",
        filter: `company_id=eq.${companyId}`,
      }, () => void load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId]);

  async function load() {
    if (!companyId) return;
    const { data } = await supabase
      .from("entity_timeline_events")
      .select("id, event_type, description, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(6);
    setEvents(data ?? []);
    setLoading(false);
  }

  const displayEvents = events.length > 0 ? events : PLACEHOLDER_EVENTS;
  const isEmpty = events.length === 0;

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "18px",
      boxShadow: "var(--shadow-sm)",
      display: "grid",
      gap: "14px",
      height: "100%",
      alignContent: "start",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
          Actividad reciente
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: "5px",
          padding: "2px 8px", borderRadius: "var(--radius-full)",
          background: isEmpty ? "var(--color-bg-subtle)" : "var(--color-success-bg)",
          border: `1px solid ${isEmpty ? "var(--color-border-faint)" : "var(--color-success-border)"}`,
        }}>
          <div style={{
            width: "5px", height: "5px", borderRadius: "50%",
            background: isEmpty ? "var(--color-text-muted)" : "var(--color-success-text)",
          }} />
          <span style={{
            fontSize: "10px", fontWeight: 600,
            color: isEmpty ? "var(--color-text-muted)" : "var(--color-success-text)",
          }}>
            {isEmpty ? "En espera" : "En vivo"}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gap: "2px" }}>
        {displayEvents.map((event, i) => (
          <div
            key={event.id}
            style={{
              display: "flex",
              gap: "10px",
              padding: "8px 0",
              borderBottom: i < displayEvents.length - 1 ? "1px solid var(--color-border-faint)" : "none",
              opacity: isEmpty ? 0.5 : 1,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0", flexShrink: 0 }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "var(--radius-sm)",
                background: getEventBg(event.event_type),
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <div style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: getEventColor(event.event_type),
                }} />
              </div>
              {i < displayEvents.length - 1 && (
                <div style={{ width: "1px", flex: 1, minHeight: "8px", background: "var(--color-border-faint)", margin: "3px 0" }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: "4px" }}>
              <div style={{
                fontSize: "12px", fontWeight: 500,
                color: "var(--color-text-primary)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                lineHeight: 1.4,
              }}>
                {event.description || event.event_type}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                <span style={{
                  fontSize: "10px", fontWeight: 600,
                  color: getEventColor(event.event_type),
                  textTransform: "capitalize",
                }}>
                  {event.event_type?.replace(/_/g, " ") || "evento"}
                </span>
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>·</span>
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                  {timeAgo(event.created_at)}
                </span>
              </div>
            </div>
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)", flexShrink: 0, paddingTop: "4px" }}>
              {formatTime(event.created_at)}
            </div>
          </div>
        ))}
      </div>

      {!isEmpty && (
        <div style={{
          textAlign: "center",
          fontSize: "11px",
          color: "var(--color-brand-blue)",
          cursor: "pointer",
          fontWeight: 500,
          borderTop: "1px solid var(--color-border-faint)",
          paddingTop: "10px",
        }}>
          Ver historial completo
        </div>
      )}
    </div>
  );
}
