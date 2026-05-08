"use client";
import type { TrackingShipment, TrackingFilters } from "../types/tracking.types";
import { EVENT_CONFIG }    from "../types/tracking.types";
import { useTranslation }  from "@/lib/i18n/useTranslation";

type Props = {
  shipments:   TrackingShipment[];
  selected:    TrackingShipment | null;
  onSelect:    (s: TrackingShipment) => void;
  filters:     TrackingFilters;
  setFilters:  (f: TrackingFilters) => void;
};

const SERVICE_COLORS: Record<string, string> = {
  terrestre_mx:  "#2563eb",
  terrestre_usa: "#7c3aed",
  maritimo:      "#0891b2",
  aereo:         "#059669",
  multimodal:    "#d97706",
  default:       "#64748b",
};

export default function TrackingSidebar({ shipments, selected, onSelect, filters, setFilters }: Props) {
  const { t, lang } = useTranslation();
  const tl          = (t.logistics as any) ?? {};
  const locale      = lang === "en" ? "en-US" : "es-MX";

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", height: "100%", minHeight: 0, overflow: "hidden" }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{tl.tracking ?? "Tracking"}</span>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>{shipments.length}</span>
        </div>

        <div style={{ position: "relative", marginBottom: "8px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            placeholder={tl.searchTracking ?? "Buscar embarque…"}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: "100%", height: "32px", paddingLeft: "28px", paddingRight: "8px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* VIEW MODE PILLS — Active / Completed / All */}
        <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
          {([
            { v: "active",    l: tl.trackingViewActive    ?? "Activos"     },
            { v: "completed", l: tl.trackingViewCompleted ?? "Completados" },
            { v: "all",       l: tl.trackingViewAll       ?? "Todos"       },
          ] as { v: "active" | "completed" | "all"; l: string }[]).map((f) => (
            <button
              key={f.v}
              onClick={() => setFilters({ ...filters, view_mode: f.v })}
              style={{
                height: "22px",
                padding: "0 9px",
                borderRadius: "var(--radius-full)",
                cursor: "pointer",
                fontSize: "10px",
                fontWeight: filters.view_mode === f.v ? 700 : 500,
                background:  filters.view_mode === f.v ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
                border:     `1px solid ${filters.view_mode === f.v ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
                color:       filters.view_mode === f.v ? "#fff" : "var(--color-text-muted)",
                transition: "var(--transition-fast)",
              }}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "grid", gap: "5px", alignContent: "start" }}>
        {shipments.length === 0 ? (
          <div style={{ padding: "28px 12px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>{tl.noTracking ?? "Sin embarques activos"}</div>
        ) : shipments.map((s) => {
          const isSelected  = selected?.id === s.id;
          const lastEv      = s.lastEvent;
          const evCfg       = lastEv ? EVENT_CONFIG[lastEv.event_type] : null;
          const svcColor    = SERVICE_COLORS[s.service_type] ?? SERVICE_COLORS.default;

          return (
            <div key={s.id} onClick={() => onSelect(s)} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: isSelected ? "var(--color-bg-active)" : "var(--color-bg-subtle)", border: isSelected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border-faint)", cursor: "pointer", display: "grid", gap: "4px", transition: "var(--transition-fast)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: svcColor, fontFamily: "monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.reference}</span>
                {s.pendingNotifs > 0 && (
                  <span style={{ fontSize: "9px", fontWeight: 800, padding: "1px 5px", borderRadius: "var(--radius-full)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", color: "var(--color-warning-text)", flexShrink: 0 }}>{s.pendingNotifs}</span>
                )}
              </div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.client?.name ?? "—"}
              </div>
              {s.origin && s.destination && (
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.origin} → {s.destination}
                </div>
              )}
              {lastEv && evCfg ? (
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: evCfg.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "10px", fontWeight: 600, color: evCfg.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tl[evCfg.labelKey.replace("logistics.", "")] ?? lastEv.event_type}
                  </span>
                  {lastEv.location && (
                    <span style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>· {lastEv.location}</span>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Sin eventos aún</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
