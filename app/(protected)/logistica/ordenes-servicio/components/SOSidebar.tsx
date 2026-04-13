"use client";
import type { ServiceOrder, SOFilters, ServiceOrderType, ServiceOrderStatus } from "../types/service-orders.types";
import { SO_TYPE_CONFIG, SO_STATUS_CONFIG } from "../types/service-orders.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  orders:      ServiceOrder[];
  selected:    ServiceOrder | null;
  setSelected: (o: ServiceOrder) => void;
  filters:     SOFilters;
  setFilters:  (f: SOFilters) => void;
  onNew:       () => void;
};

export default function SOSidebar({ orders, selected, setSelected, filters, setFilters, onNew }: Props) {
  const { t, lang } = useTranslation();
  const tl          = (t.logistics as any) ?? {};
  const locale      = lang === "en" ? "en-US" : "es-MX";

  function getTypeLabel(type: ServiceOrderType) {
    const k = `type${type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`;
    return tl[k] ?? type;
  }

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", height: "100%", minHeight: 0, overflow: "hidden" }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{tl.serviceOrders ?? "Órdenes"}</span>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>{orders.length}</span>
        </div>

        <button onClick={onNew} style={{ width: "100%", height: "34px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {tl.newServiceOrder ?? "Nueva orden"}
        </button>

        <div style={{ position: "relative", marginBottom: "8px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input placeholder={tl.searchServiceOrder ?? "Buscar…"} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} style={{ width: "100%", height: "32px", paddingLeft: "28px", paddingRight: "8px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
          {([
            { value: "all",          label: "Todos"    },
            { value: "ccp_carta",    label: "CCP"      },
            { value: "bol_usa",      label: "BOL USA"  },
            { value: "carta_aduanal",label: "Aduanal"  },
          ] as { value: ServiceOrderType | "all"; label: string }[]).map((f) => (
            <button key={f.value} onClick={() => setFilters({ ...filters, type: f.value })} style={{
              height: "22px", padding: "0 7px", borderRadius: "var(--radius-full)", cursor: "pointer",
              background: filters.type === f.value ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
              border: `1px solid ${filters.type === f.value ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
              color: filters.type === f.value ? "#fff" : "var(--color-text-muted)",
              fontSize: "10px", fontWeight: filters.type === f.value ? 700 : 500,
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "grid", gap: "5px", alignContent: "start" }}>
        {orders.length === 0 ? (
          <div style={{ padding: "28px 12px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>{tl.noServiceOrders ?? "Sin órdenes"}</div>
        ) : orders.map((o) => {
          const isSelected = selected?.id === o.id;
          const typeCfg    = SO_TYPE_CONFIG[o.order_type];
          const stCfg      = SO_STATUS_CONFIG[o.status];
          const typeLabel  = getTypeLabel(o.order_type);
          const stLabel    = tl[`status${o.status.charAt(0).toUpperCase()}${o.status.slice(1)}SO`] ?? o.status;

          return (
            <div key={o.id} onClick={() => setSelected(o)} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: isSelected ? "var(--color-bg-active)" : "var(--color-bg-subtle)", border: isSelected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border-faint)", cursor: "pointer", display: "grid", gap: "4px", transition: "var(--transition-fast)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: typeCfg.bg, color: typeCfg.color, border: `1px solid ${typeCfg.border}`, flexShrink: 0 }}>{typeLabel}</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: stCfg.bg, color: stCfg.color, border: `1px solid ${stCfg.border}`, flexShrink: 0 }}>{stLabel}</span>
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "monospace" }}>
                {o.shipment?.reference ?? o.id.slice(0, 8).toUpperCase()}
              </div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {o.carrier_name ?? o.consignee_name ?? "—"}
              </div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                {new Date(o.created_at).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
