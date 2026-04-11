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

function getEventDotColor(type: string): string {
  if (type?.includes("prospect"))  return "var(--color-brand-blue)";
  if (type?.includes("quotation")) return "var(--color-info-text)";
  if (type?.includes("invoice"))   return "var(--color-success-text)";
  if (type?.includes("shipment"))  return "var(--color-warning-text)";
  return "var(--color-text-muted)";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

export default function ActivityFeed() {
  const { companyId } = useTenant();
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (!companyId) return;
    void loadEvents();
  }, [companyId]);

  async function loadEvents() {
    if (!companyId) return;
    const { data } = await supabase
      .from("entity_timeline_events")
      .select("id, event_type, description, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(6);
    if (data) setEvents(data);
  }

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "18px",
      boxShadow: "var(--shadow-sm)",
      display: "grid",
      gap: "14px",
      alignContent: "start",
    }}>
      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        Actividad reciente
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        {events.length === 0 ? (
          <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", padding: "24px 0" }}>
            Sin actividad reciente
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              paddingBottom: "10px",
              borderBottom: "1px solid var(--color-border-faint)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <span style={{
                  width: "7px", height: "7px", borderRadius: "50%",
                  background: getEventDotColor(event.event_type),
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: "13px",
                  color: "var(--color-text-second)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {event.description || event.event_type}
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                {formatTime(event.created_at)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
