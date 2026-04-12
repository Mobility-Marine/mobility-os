"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface CalEvent {
  id: string;
  title: string;
  start_time: string;
  event_type?: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

export default function UpcomingEvents() {
  const { companyId } = useTenant();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [companyId]);

  async function load() {
    if (!companyId) return;
    const now = new Date().toISOString();
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from("calendar_events")
      .select("id, title, start_time, event_type")
      .eq("company_id", companyId)
      .gte("start_time", now)
      .lte("start_time", end.toISOString())
      .order("start_time", { ascending: true })
      .limit(5);

    setEvents(data ?? []);
    setLoading(false);
  }

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "18px",
      boxShadow: "var(--shadow-sm)",
      display: "grid",
      gap: "12px",
      height: "100%",
  alignContent: "start",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
          Agenda de hoy
        </div>
        <span style={{
          padding: "2px 8px",
          borderRadius: "var(--radius-full)",
          background: "var(--color-brand-blue-light)",
          color: "var(--color-brand-blue)",
          fontSize: "11px",
          fontWeight: 600,
        }}>
          {events.length} eventos
        </span>
      </div>

      {loading ? null : events.length === 0 ? (
        <div style={{ display: "grid", gap: "8px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 10px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-bg-subtle)",
              border: "1px solid var(--color-border-faint)",
              opacity: 0.4 + i * 0.1,
            }}>
              <div style={{
                width: "3px", height: "32px",
                borderRadius: "var(--radius-full)",
                background: "var(--color-border)",
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, display: "grid", gap: "5px" }}>
                <div style={{
                  height: "10px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--color-border)",
                  width: `${70 - i * 10}%`,
                }} />
                <div style={{
                  height: "8px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--color-border-faint)",
                  width: "40%",
                }} />
              </div>
            </div>
          ))}
          <div style={{ textAlign: "center", fontSize: "11px", color: "var(--color-text-muted)", paddingTop: "4px" }}>
  {t.dashboard.noEvents}
</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {events.map((event) => (
            <div key={event.id} style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 10px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-bg-subtle)",
              border: "1px solid var(--color-border-faint)",
            }}>
              <div style={{
                width: "3px",
                height: "32px",
                borderRadius: "var(--radius-full)",
                background: "var(--color-brand-blue)",
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {event.title}
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "2px",
                  color: "var(--color-text-muted)",
                }}>
                  <ClockIcon />
                  <span style={{ fontSize: "11px" }}>{formatTime(event.start_time)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
