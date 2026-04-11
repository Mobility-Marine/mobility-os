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

  const isEmpty = !loading && events.length === 0;

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "18px",
      boxShadow: "var(--shadow-sm)",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      height: "100%",
    }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
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

      {/* CONTENIDO */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {loading ? (
          <div style={{ display: "grid", gap: "12px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)", flexShrink: 0 }} />
                <div style={{ flex: 1, display: "grid", gap: "4px" }}>
                  <div style={{ height: 10, background: "var(--color-bg-subtle)", borderRadius: 4, width: "70%" }} />
                  <div style={{ height: 8, background: "var(--color-bg-subtle)", borderRadius: 4, width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            {/* ESTADO VACÍO CON CONTENIDO ÚTIL */}
            <div style={{ display: "grid", gap: "6px" }}>
              {[
                { label: "Prospectos", hint: "Se registrará cuando crees o actualices prospectos", color: "var(--color-brand-blue)", bg: "var(--color-brand-blue-light)" },
                { label: "Cotizaciones", hint: "Aparecerá cuando generes o modifiques cotizaciones", color: "var(--color-info-text)", bg: "var(--color-info-bg)" },
                { label: "Embarques", hint: "Se mostrará con movimientos logísticos activos", color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
                { label: "Facturas", hint: "Registrará emisiones y pagos de facturas", color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
              ].map((item) => (
                <div key={item.label} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "8px 10px", borderRadius: "var(--radius-md)",
                  background: item.bg, border: `1px solid ${item.color}20`,
                }}>
                  <div style={{
                    width: "24px", height: "24px", borderRadius: "var(--radius-sm)",
                    background: item.color + "20", display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: item.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: item.color }}>{item.label}</div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "1px", lineHeight: 1.3 }}>{item.hint}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              textAlign: "center", fontSize: "11px",
              color: "var(--color-text-muted)", paddingTop: "12px",
              borderTop: "1px solid var(--color-border-faint)", marginTop: "10px",
            }}>
              La actividad aparecerá aquí en tiempo real
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ di
