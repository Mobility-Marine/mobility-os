"use client";
import type { TransportUnit, UnitFilters, UnitStatus } from "../types/transport.types";
import { UNIT_STATUS_CONFIG, UNIT_TYPE_LABELS, getUnitAlerts } from "../types/transport.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  units:       TransportUnit[];
  selected:    TransportUnit | null;
  setSelected: (u: TransportUnit) => void;
  filters:     UnitFilters;
  setFilters:  (f: UnitFilters) => void;
  onNew:       () => void;
};

const STATUS_DOT: Record<UnitStatus, string> = {
  active:      "var(--color-success-text)",
  maintenance: "#d97706",
  inactive:    "var(--color-text-muted)",
};

// Icono de camión según tipo
function UnitIcon({ type }: { type: string }) {
  const isRefrig = type === "caja_refrigerada";
  const isTank   = type === "pipa";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      {isTank
        ? <><ellipse cx="12" cy="10" rx="9" ry="5"/><line x1="3" y1="10" x2="3" y2="16"/><line x1="21" y1="10" x2="21" y2="16"/><path d="M3 16c0 2.8 4 5 9 5s9-2.2 9-5"/></>
        : <><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h5l3 5v5h-8V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>
      }
    </svg>
  );
}

export default function TransportSidebar({ units, selected, setSelected, filters, setFilters, onNew }: Props) {
  const { t, lang } = useTranslation();
  const tl          = (t.logistics as any) ?? {};
  const locale      = lang === "en" ? "en-US" : "es-MX";

  function getTypeLabel(type: string): string {
    const key = UNIT_TYPE_LABELS[type as keyof typeof UNIT_TYPE_LABELS];
    if (!key) return type;
    return tl[key.replace("logistics.", "")] ?? type;
  }

  function getStatusLabel(status: UnitStatus): string {
    const cfg = UNIT_STATUS_CONFIG[status];
    return tl[cfg.labelKey.replace("logistics.", "")] ?? status;
  }

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", height: "100%", minHeight: 0, overflow: "hidden" }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{tl.transport ?? "Transporte"}</span>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>{units.length}</span>
        </div>

        <button onClick={onNew} style={{ width: "100%", height: "34px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {tl.newUnit ?? "Nueva unidad"}
        </button>

        <div style={{ position: "relative", marginBottom: "8px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input placeholder={tl.searchUnit ?? "Buscar…"} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} style={{ width: "100%", height: "32px", paddingLeft: "28px", paddingRight: "8px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: "3px" }}>
          {([
            { v: "all",         l: "Todos" },
            { v: "active",      l: tl.unitActive      ?? "Activas"    },
            { v: "maintenance", l: tl.unitMaintenance ?? "Mant."      },
          ] as { v: UnitStatus | "all"; l: string }[]).map((f) => (
            <button key={f.v} onClick={() => setFilters({ ...filters, status: f.v })} style={{
              flex: 1, height: "22px", borderRadius: "var(--radius-full)", cursor: "pointer",
              fontSize: "10px", fontWeight: filters.status === f.v ? 700 : 500,
              background: filters.status === f.v ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
              border: `1px solid ${filters.status === f.v ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
              color: filters.status === f.v ? "#fff" : "var(--color-text-muted)",
            }}>{f.l}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "grid", gap: "5px", alignContent: "start" }}>
        {units.length === 0 ? (
          <div style={{ padding: "28px 12px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>{tl.noUnits ?? "Sin unidades"}</div>
        ) : units.map((u) => {
          const isSelected = selected?.id === u.id;
          const stCfg      = UNIT_STATUS_CONFIG[u.status];
          const alerts     = getUnitAlerts(u);

          return (
            <div key={u.id} onClick={() => setSelected(u)} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: isSelected ? "var(--color-bg-active)" : "var(--color-bg-subtle)", border: isSelected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border-faint)", cursor: "pointer", display: "grid", gap: "4px", transition: "var(--transition-fast)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>
                  <UnitIcon type={u.unit_type} />
                </span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: STATUS_DOT[u.status], flexShrink: 0 }} />
              </div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                {getTypeLabel(u.unit_type)}
                {u.plates && ` · ${u.plates}`}
              </div>
              {u.brand && (
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {u.brand}{u.model ? ` ${u.model}` : ""}{u.year ? ` ${u.year}` : ""}
                </div>
              )}
              {alerts.length > 0 && (
                <div style={{ display: "flex", gap: "3px" }}>
                  {alerts.map((a) => (
                    <span key={a.field} style={{ fontSize: "9px", fontWeight: 700, padding: "1px 4px", borderRadius: "3px", background: a.severity === "expired" ? "var(--color-danger-bg)" : "var(--color-warning-bg)", color: a.severity === "expired" ? "var(--color-danger-text)" : "var(--color-warning-text)", border: `1px solid ${a.severity === "expired" ? "var(--color-danger-border)" : "var(--color-warning-border)"}` }}>
                      {a.severity === "expired" ? "VCE" : "VCE~"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
