// ════════════════════════════════════════════════════════════════════════
// PartnerActivityPanel — Timeline de actividad del partner
// ════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabaseClient";

export type TimelineEvent = {
  id:              string;
  occurred_at:     string;
  title:           string | null;
  description:     string | null;
  event_type:      string | null;
  event_category:  string | null;
  event_priority:  string | null;
  module_key:      string | null;
  actor_user_id:   string | null;
};

export type PartnerActivityPanelProps = {
  partnerId:  string;
  companyId:  string;
};

const CONTAINER: CSSProperties = {
  display:        "flex",
  flexDirection:  "column",
  gap:            "10px",
};

const EVENT_ITEM: CSSProperties = {
  display:        "flex",
  gap:            "12px",
  padding:        "12px 14px",
  borderRadius:   "var(--radius-md)",
  border:         "1px solid var(--color-border)",
  background:     "var(--color-bg-subtle)",
};

const TIMELINE_DOT: CSSProperties = {
  width:          "10px",
  height:         "10px",
  borderRadius:   "50%",
  background:     "var(--color-brand-blue, #3b82f6)",
  flexShrink:     0,
  marginTop:      "4px",
};

const EVENT_BODY: CSSProperties = {
  flex:           1,
  display:        "flex",
  flexDirection:  "column",
  gap:            "3px",
  minWidth:       0,
};

const EVENT_HEADER: CSSProperties = {
  display:        "flex",
  alignItems:     "center",
  justifyContent: "space-between",
  gap:            "8px",
  flexWrap:       "wrap",
};

const EVENT_TITLE: CSSProperties = {
  fontSize:       "13px",
  fontWeight:     600,
  color:          "var(--color-text-primary)",
};

const EVENT_DATE: CSSProperties = {
  fontSize:       "11px",
  color:          "var(--color-text-muted)",
  fontVariantNumeric: "tabular-nums",
  whiteSpace:     "nowrap",
};

const EVENT_DESC: CSSProperties = {
  fontSize:       "12px",
  color:          "var(--color-text-muted)",
  lineHeight:     1.5,
};

const EVENT_BADGES: CSSProperties = {
  display:        "flex",
  gap:            "6px",
  flexWrap:       "wrap",
  marginTop:      "4px",
};

const BADGE: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  padding:        "1px 7px",
  borderRadius:   "var(--radius-sm, 4px)",
  fontSize:       "10px",
  fontWeight:     600,
  letterSpacing:  "0.3px",
  textTransform:  "uppercase",
  background:     "rgba(148, 163, 184, 0.15)",
  color:          "var(--color-text-muted)",
};

const EMPTY: CSSProperties = {
  padding:        "30px 20px",
  textAlign:      "center",
  fontSize:       "12px",
  color:          "var(--color-text-muted)",
  border:         "1px dashed var(--color-border)",
  borderRadius:   "var(--radius-md)",
};

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now  = Date.now();
  const diff = now - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes === 0 ? "ahora mismo" : `hace ${minutes} min`;
    }
    return `hace ${hours} h`;
  }
  if (days < 7)  return `hace ${days} día${days > 1 ? "s" : ""}`;
  if (days < 30) return `hace ${Math.floor(days / 7)} sem.`;
  if (days < 365) return `hace ${Math.floor(days / 30)} meses`;
  return date.toLocaleDateString("es-MX", { dateStyle: "medium" });
}

function dotColorFor(priority: string | null, category: string | null): string {
  if (priority === "high" || priority === "critical") return "var(--color-danger-text, #ef4444)";
  if (priority === "medium")                          return "var(--color-warning-text, #f59e0b)";
  if (category === "commercial")                      return "var(--color-brand-blue, #3b82f6)";
  if (category === "logistics")                       return "var(--color-success-text, #22c55e)";
  if (category === "finance")                         return "#a855f7";
  return "var(--color-text-muted, #94a3b8)";
}

export default function PartnerActivityPanel({
  partnerId,
  companyId,
}: PartnerActivityPanelProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!partnerId || !companyId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchEvents = async () => {
      try {
        const { data, error: qErr } = await supabase
          .from("entity_timeline_events")
          .select(
            "id, occurred_at, title, description, event_type, event_category, event_priority, module_key, actor_user_id"
          )
          .eq("company_id", companyId)
          .or(`entity_id.eq.${partnerId},related_client_id.eq.${partnerId}`)
          .order("occurred_at", { ascending: false })
          .limit(50);

        if (qErr) throw new Error(qErr.message);
        if (!cancelled) setEvents((data ?? []) as TimelineEvent[]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchEvents();
    return () => {
      cancelled = true;
    };
  }, [partnerId, companyId]);

  if (loading) {
    return <div style={EMPTY}>⏳ Cargando timeline de actividad...</div>;
  }

  if (error) {
    return (
      <div style={{ ...EMPTY, color: "var(--color-danger-text)" }}>
        ⚠️ {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={EMPTY}>
        📭 Sin eventos registrados para este partner.
        <br />
        <span style={{ fontSize: "11px", opacity: 0.7 }}>
          Los eventos aparecen cuando se realizan operaciones (cotizaciones,
          pedidos, embarques, facturas, cambios de estado, etc.)
        </span>
      </div>
    );
  }

  return (
    <div style={CONTAINER}>
      {events.map((ev) => (
        <div key={ev.id} style={EVENT_ITEM}>
          <div
            style={{
              ...TIMELINE_DOT,
              background: dotColorFor(ev.event_priority, ev.event_category),
            }}
          />
          <div style={EVENT_BODY}>
            <div style={EVENT_HEADER}>
              <div style={EVENT_TITLE}>
                {ev.title || ev.event_type || "Evento"}
              </div>
              <div style={EVENT_DATE} title={new Date(ev.occurred_at).toLocaleString("es-MX")}>
                {formatRelative(ev.occurred_at)}
              </div>
            </div>
            {ev.description && <div style={EVENT_DESC}>{ev.description}</div>}
            <div style={EVENT_BADGES}>
              {ev.module_key && (
                <span style={BADGE}>{ev.module_key}</span>
              )}
              {ev.event_category && (
                <span style={BADGE}>{ev.event_category}</span>
              )}
              {ev.event_priority && ev.event_priority !== "low" && (
                <span
                  style={{
                    ...BADGE,
                    color: dotColorFor(ev.event_priority, ev.event_category),
                    background: "transparent",
                    border: `1px solid ${dotColorFor(ev.event_priority, ev.event_category)}`,
                  }}
                >
                  {ev.event_priority}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}