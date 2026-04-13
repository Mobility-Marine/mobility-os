"use client";

import type { Shipment, ShipmentFilters, ShipmentServiceType, ShipmentStatus } from "../types/shipments.types";
import { SHIPMENT_STATUS_CONFIG, SERVICE_TYPE_CONFIG, SHIPMENT_SERVICE_TYPES } from "../types/shipments.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  shipments:   Shipment[];
  selected:    Shipment | null;
  setSelected: (s: Shipment) => void;
  filters:     ShipmentFilters;
  setFilters:  (f: ShipmentFilters) => void;
  onNew:       () => void;
};

export default function ShipmentsSidebar({ shipments, selected, setSelected, filters, setFilters, onNew }: Props) {
  const { t, lang } = useTranslation();
  const tl          = (t.logistics as any) ?? {};
  const locale      = lang === "en" ? "en-US" : "es-MX";

  const STATUS_FILTERS = [
    { value: "all",       label: "Todos"     },
    { value: "active",    label: "Activos"   },
    { value: "delivered", label: "Entregados"},
  ];

  function getStatusLabel(s: ShipmentStatus): string {
    const key = `status${s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`;
    return tl[key] ?? s;
  }

  function getServiceLabel(s: ShipmentServiceType): string {
    const key = `service${s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`;
    return tl[key] ?? s;
  }

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "14px",
      display: "flex", flexDirection: "column", gap: "10px",
      height: "100%", minHeight: 0, overflow: "hidden",
    }}>

      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
            {tl.shipments ?? "Embarques"}
          </span>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>
            {shipments.length}
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
          {tl.newShipment ?? "Nuevo embarque"}
        </button>

        {/* SEARCH */}
        <div style={{ position: "relative", marginBottom: "8px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"
            style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            placeholder={tl.searchShipment ?? "Buscar…"}
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
          <div style={{ display: "flex", gap: "3px" }}>
            {STATUS_FILTERS.map((f) => (
              <button key={f.value} onClick={() => setFilters({ ...filters, status: f.value as any })} style={{
                flex: 1, height: "24px", borderRadius: "var(--radius-sm)", cursor: "pointer",
                background: filters.status === f.value ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
                border: `1px solid ${filters.status === f.value ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
                color: filters.status === f.value ? "#fff" : "var(--color-text-muted)",
                fontSize: "10px", fontWeight: filters.status === f.value ? 700 : 500,
              }}>
                {f.label}
              </button>
            ))}
          </div>
          <select
            value={filters.service_type}
            onChange={(e) => setFilters({ ...filters, service_type: e.target.value as any })}
            style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "11px", cursor: "pointer" }}
          >
            <option value="all">Todos los tipos</option>
            {SHIPMENT_SERVICE_TYPES.map((type) => (
              <option key={type} value={type}>{getServiceLabel(type)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LIST */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "grid", gap: "5px", alignContent: "start" }}>
        {shipments.length === 0 ? (
          <div style={{ padding: "28px 12px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
            {tl.noShipments ?? "Sin embarques"}
          </div>
        ) : shipments.map((s) => {
          const isSelected = selected?.id === s.id;
          const stCfg      = SHIPMENT_STATUS_CONFIG[s.status];
          const svcCfg     = SERVICE_TYPE_CONFIG[s.service_type];
          const statusLabel = getStatusLabel(s.status);

          return (
            <div
              key={s.id}
              onClick={() => setSelected(s)}
              style={{
                padding: "10px 12px", borderRadius: "var(--radius-md)",
                background: isSelected ? "var(--color-bg-active)" : "var(--color-bg-subtle)",
                border: isSelected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border-faint)",
                cursor: "pointer", display: "grid", gap: "4px",
                transition: "var(--transition-fast)",
              }}
            >
              {/* Row 1 */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 800, color: svcCfg.color, flexShrink: 0 }}>
                  {s.reference}
                </span>
                <div style={{ flex: 1 }} />
                <span style={{
                  fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)",
                  background: stCfg.bg, color: stCfg.color, border: `1px solid ${stCfg.border}`,
                  textTransform: "uppercase", flexShrink: 0,
                }}>
                  {statusLabel}
                </span>
              </div>
              {/* Row 2 */}
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.client?.name ?? "—"}
              </div>
              {/* Row 3 */}
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {[s.origin, s.destination].filter(Boolean).join(" → ") || "Ruta sin definir"}
              </div>
              {/* Row 4 */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>
                  {new Date(s.created_at).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                </span>
                <span style={{ fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                  {s.currency} ${Number(s.total ?? 0).toLocaleString(locale, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
