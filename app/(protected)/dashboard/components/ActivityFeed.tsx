"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useTranslation } from "@/lib/i18n/useTranslation";

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

function formatTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(
    locale === "en" ? "en-US" : "es-MX",
    { hour: "2-digit", minute: "2-digit" }
  );
}

function timeAgo(iso: string, lang: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (lang === "en") {
    if (diff < 1)    return "now";
    if (diff < 60)   return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  }
  if (diff < 1)    return "ahora";
  if (diff < 60)   return `hace ${diff}m`;
  if (diff < 1440) return `hace ${Math.floor(diff / 60)}h`;
  return `hace ${Math.floor(diff / 1440)}d`;
}

export default function ActivityFeed() {
  const { companyId } = useTenant();
  const { t, lang }   = useTranslation();
  const [events, setEvents]   = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const EMPTY_TYPES = [
    { label: t.navItems.prospects,   hint: lang === "en" ? "When you create or update prospects"  : "Cuando crees o actualices prospectos",  color: "var(--color-brand-blue)",   bg: "var(--color-brand-blue-light)" },
    { label: t.navItems.quotations,  hint: lang === "en" ? "When you generate or modify quotations" : "Al generar o modificar cotizaciones", color: "var(--color-info-text)",    bg: "var(--color-info-bg)" },
    { label: t.navItems.shipments,   hint: lang === "en" ? "With active logistics movements"      : "Con movimientos logísticos activos",    color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
    { label: t.navItems.billing,     hint: lang === "en" ? "When issuing or registering payments" : "Al emitir o registrar pagos",           color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
  ];

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

  const isEmpty = !loading && events.length === 0;

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "14px", height: "100%" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
          {t.dashboard.recentActivity}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "2px 8px", borderRadius: "var(--radius-full)", background: isEmpty ? "var(--color-bg-subtle)" : "var(--color-success-bg)", border: `1px solid ${isEmpty ? "var(--color-border-faint)" : "var(--color-success-border)"}` }}>
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: isEmpty ? "var(--color-text-muted)" : "var(--color-success-text)" }} />
          <span style={{ fontSize: "10px", fontWeight: 600, color: isEmpty ? "var(--color-text-muted)" : "var(--color-success-text)" }}>
            {isEmpty ? t.dashboard.waiting : t.dashboard.live}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {loading ? (
          <div style={{ display: "grid", gap: "10px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)", flexShrink: 0 }} />
                <div style={{ flex: 1, display: "grid", gap: "5px" }}>
                  <div style={{ height: 10, background: "var(--color-bg-subtle)", borderRadius: 4, width: "70%" }} />
                  <div style={{ height: 8, background: "var(--color-bg-subtle)", borderRadius: 4, width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
            {EMPTY_TYPES.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "var(--radius-md)", background: item.bg, border: `1px solid ${item.color}20` }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "var(--radius-sm)", background: item.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: item.color }} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: item.color }}>{item.label}</div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "1px", lineHeight: 1.3 }}>{item.hint}</div>
                </div>
              </div>
            ))}
            <div style={{ textAlign: "center", fontSize: "11px", color: "var(--color-text-muted)", paddingTop: "10px", borderTop: "1px solid var(--color-border-faint)", marginTop: "auto" }}>
              {t.dashboard.eventsWillAppear}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ flex: 1 }}>
              {events.map((event, i) => (
                <div key={event.id} style={{ display: "flex", gap: "10px", paddingBottom: i < events.length - 1 ? "10px" : "0" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "var(--radius-sm)", background: getEventBg(event.event_type), display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: getEventColor(event.event_type) }} />
                    </div>
                    {i < events.length - 1 && (
                      <div style={{ width: "1px", flex: 1, minHeight: "10px", background: "var(--color-border-faint)", margin: "3px 0" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingTop: "4px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>
                      {event.description || event.event_type}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 600, color: getEventColor(event.event_type), textTransform: "capitalize" }}>
                        {event.event_type?.replace(/_/g, " ") || "evento"}
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>·</span>
                      <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{timeAgo(event.created_at, lang)}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", flexShrink: 0, paddingTop: "4px" }}>
                    {formatTime(event.created_at, lang)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", fontSize: "11px", color: "var(--color-brand-blue)", cursor: "pointer", fontWeight: 500, borderTop: "1px solid var(--color-border-faint)", paddingTop: "10px", marginTop: "10px" }}>
              {t.dashboard.viewFullHistory}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
