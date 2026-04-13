"use client";
import type { Supplier, SupplierFilters } from "../types/supplier.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { scoreColor }     from "../services/supplier.service";

type Props = {
  suppliers:   Supplier[];
  selected:    Supplier | null;
  onSelect:    (s: Supplier) => void;
  filters:     SupplierFilters;
  setFilters:  (f: SupplierFilters) => void;
  onNew:       () => void;
};

export default function SupplierSidebar({ suppliers, selected, onSelect, filters, setFilters, onNew }: Props) {
  const { t } = useTranslation();
  const tp    = (t.procurement as any) ?? {};

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", height: "100%", minHeight: 0, overflow: "hidden" }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{tp.suppliers ?? "Proveedores"}</span>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>{suppliers.length}</span>
        </div>

        <button onClick={onNew} style={{ width: "100%", height: "34px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {tp.newSupplier ?? "Nuevo proveedor"}
        </button>

        <div style={{ position: "relative", marginBottom: "8px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input placeholder={tp.searchSupplier ?? "Buscar proveedor…"} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} style={{ width: "100%", height: "32px", paddingLeft: "28px", paddingRight: "8px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: "3px" }}>
          {([
            { v: "all",      l: "Todos"  },
            { v: "active",   l: tp.supplierActive   ?? "Activos"   },
            { v: "inactive", l: tp.supplierInactive ?? "Inactivos" },
          ] as { v: SupplierFilters["status"]; l: string }[]).map((f) => (
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
        {suppliers.length === 0 ? (
          <div style={{ padding: "28px 12px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>{tp.noSuppliers ?? "Sin proveedores"}</div>
        ) : suppliers.map((s) => {
          const isSelected = selected?.id === s.id;
          return (
            <div key={s.id} onClick={() => onSelect(s)} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: isSelected ? "var(--color-bg-active)" : "var(--color-bg-subtle)", border: isSelected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border-faint)", cursor: "pointer", display: "grid", gap: "3px", transition: "var(--transition-fast)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: s.is_active ? "var(--color-success-text)" : "var(--color-text-muted)", flexShrink: 0 }} />
              </div>
              {s.rfc && (
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{s.rfc}</div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                  {s.city ?? s.email ?? "—"}
                </span>
                {s.avg_score != null && (
                  <span style={{ fontSize: "10px", fontWeight: 700, color: scoreColor(s.avg_score) }}>★ {s.avg_score}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
