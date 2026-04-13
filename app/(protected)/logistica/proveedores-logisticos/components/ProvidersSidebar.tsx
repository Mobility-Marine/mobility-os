"use client";

import type { LogisticsProvider, ProviderFilters, ProviderType } from "../types/providers.types";
import { PROVIDER_TYPE_CONFIG, PROVIDER_TYPES } from "../types/providers.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  providers:   LogisticsProvider[];
  selected:    LogisticsProvider | null;
  setSelected: (p: LogisticsProvider) => void;
  filters:     ProviderFilters;
  setFilters:  (f: ProviderFilters) => void;
  onNew:       () => void;
};

export default function ProvidersSidebar({
  providers, selected, setSelected, filters, setFilters, onNew,
}: Props) {
  const { t } = useTranslation();
  const tl    = (t.logistics as any) ?? {};

  function getTypeLabel(type: ProviderType) {
    const cfg = PROVIDER_TYPE_CONFIG[type];
    return (t as any)?.[cfg.labelKey] ?? tl[`type${type.charAt(0).toUpperCase()}${type.slice(1).replace("_", "")}`] ?? type;
  }

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "14px",
      display: "flex", flexDirection: "column", gap: "10px",
      height: "100%", minHeight: 0, overflow: "hidden",
    }}>

      {/* HEADER */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
            {tl.providers ?? "Proveedores"}
          </span>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>
            {providers.length}
          </span>
        </div>

        <button onClick={onNew} style={{
          width: "100%", height: "34px", borderRadius: "var(--radius-md)",
          background: "var(--color-brand-blue)", color: "#fff", border: "none",
          fontSize: "12px", fontWeight: 700, cursor: "pointer", marginBottom: "10px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {tl.newProvider ?? "Nuevo proveedor"}
        </button>

        {/* SEARCH */}
        <div style={{ position: "relative", marginBottom: "8px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"
            style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            placeholder={tl.searchProvider ?? "Buscar proveedor…"}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{
              width: "100%", height: "32px", paddingLeft: "28px", paddingRight: "8px",
              borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
              background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
              fontSize: "12px", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* FILTROS */}
        <div style={{ display: "grid", gap: "5px" }}>
          {/* Status */}
          <div style={{ display: "flex", gap: "3px" }}>
            {[
              { value: "active",   label: tl.providerActive   ?? "Activos"   },
              { value: "all",      label: tl.allTypes          ?? "Todos"     },
              { value: "inactive", label: tl.providerInactive  ?? "Inactivos" },
            ].map((f) => (
              <button key={f.value} onClick={() => setFilters({ ...filters, status: f.value as any })} style={{
                flex: 1, height: "24px", borderRadius: "var(--radius-sm)",
                background: filters.status === f.value ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
                border: `1px solid ${filters.status === f.value ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
                color: filters.status === f.value ? "#fff" : "var(--color-text-muted)",
                fontSize: "10px", fontWeight: filters.status === f.value ? 700 : 500,
                cursor: "pointer",
              }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Tipo */}
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
            style={{
              height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
              color: "var(--color-text-second)", fontSize: "11px", cursor: "pointer",
            }}
          >
            <option value="all">{tl.allTypes ?? "Todos los tipos"}</option>
            {PROVIDER_TYPES.map((type) => {
              const cfg = PROVIDER_TYPE_CONFIG[type];
              const label = tl[`type${type.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`]
                ?? tl[`type${type.charAt(0).toUpperCase()}${type.slice(1)}`]
                ?? type;
              return <option key={type} value={type}>{label}</option>;
            })}
          </select>
        </div>
      </div>

      {/* LIST */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "grid", gap: "4px", alignContent: "start" }}>
        {providers.length === 0 ? (
          <div style={{ padding: "28px 12px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
            {tl.noProviders ?? "Sin proveedores"}
          </div>
        ) : providers.map((p) => {
          const isSelected = selected?.id === p.id;
          const cfg        = PROVIDER_TYPE_CONFIG[p.provider_type];
          const typeLabel  = tl[`type${p.provider_type.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`]
            ?? tl[`type${p.provider_type.charAt(0).toUpperCase()}${p.provider_type.slice(1)}`]
            ?? p.provider_type;

          return (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              style={{
                padding: "9px 11px", borderRadius: "var(--radius-md)",
                background: isSelected ? "var(--color-bg-active)" : "var(--color-bg-subtle)",
                border: isSelected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border-faint)",
                cursor: "pointer", display: "grid", gap: "4px",
                opacity: p.is_active ? 1 : 0.6,
                transition: "var(--transition-fast)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{
                  width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
                  background: p.is_active ? cfg.color : "var(--color-text-muted)",
                }} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name}
                </span>
                <span style={{
                  fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)",
                  background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}30`,
                  flexShrink: 0,
                }}>
                  {typeLabel}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--color-text-muted)" }}>
                <span>{p.contact_name ?? p.contact_email ?? "—"}</span>
                {p.rating && (
                  <span style={{ color: "var(--color-warning-text)" }}>
                    {"★".repeat(p.rating)}{"☆".repeat(5 - p.rating)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
