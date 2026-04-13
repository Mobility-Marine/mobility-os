"use client";
import type { Requisition, RequisitionFilters, RequisitionStatus, RequisitionPriority } from "../types/requisition.types";
import { REQUISITION_STATUS_CONFIG, PRIORITY_CONFIG } from "../types/requisition.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  requisitions: Requisition[];
  selected:     Requisition | null;
  onSelect:     (r: Requisition) => void;
  filters:      RequisitionFilters;
  setFilters:   (f: RequisitionFilters) => void;
  onNew:        () => void;
};

const PRIORITY_DOT: Record<RequisitionPriority, string> = {
  low:    "var(--color-text-muted)",
  normal: "var(--color-brand-blue)",
  high:   "#d97706",
  urgent: "var(--color-danger-text)",
};

export default function RequisitionSidebar({ requisitions, selected, onSelect, filters, setFilters, onNew }: Props) {
  const { t, lang } = useTranslation();
  const tp          = (t.procurement as any) ?? {};
  const locale      = lang === "en" ? "en-US" : "es-MX";

  function getStatusLabel(status: RequisitionStatus): string {
    const cfg = REQUISITION_STATUS_CONFIG[status];
    return tp[cfg.labelKey.replace("procurement.", "")] ?? status;
  }

  function getPriorityLabel(p: RequisitionPriority): string {
    const cfg = PRIORITY_CONFIG[p];
    return tp[cfg.labelKey.replace("procurement.", "")] ?? p;
  }

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", height: "100%", minHeight: 0, overflow: "hidden" }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{tp.requisitions ?? "Requisiciones"}</span>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>{requisitions.length}</span>
        </div>

        <button onClick={onNew} style={{ width: "100%", height: "34px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {tp.newRequisition ?? "Nueva requisición"}
        </button>

        <div style={{ position: "relative", marginBottom: "8px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input placeholder={tp.searchRequisition ?? "Buscar…"} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} style={{ width: "100%", height: "32px", paddingLeft: "28px", paddingRight: "8px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", boxSizing: "border-box" }} />
        </div>

        {/* Filtros de status */}
        <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
          {([
            { v: "all",             l: "Todas" },
            { v: "draft",           l: tp.reqDraft           ?? "Borrador" },
            { v: "pending_approval",l: tp.reqPendingApproval ?? "Pend." },
            { v: "approved",        l: tp.reqApproved        ?? "Aprobada" },
          ] as { v: RequisitionStatus | "all"; l: string }[]).map((f) => (
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
        {requisitions.length === 0 ? (
          <div style={{ padding: "28px 12px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>{tp.noRequisitions ?? "Sin requisiciones"}</div>
        ) : requisitions.map((r) => {
          const isSelected = selected?.id === r.id;
          const stCfg      = REQUISITION_STATUS_CONFIG[r.status];
          const stLabel    = getStatusLabel(r.status);

          return (
            <div key={r.id} onClick={() => onSelect(r)} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: isSelected ? "var(--color-bg-active)" : "var(--color-bg-subtle)", border: isSelected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border-faint)", cursor: "pointer", display: "grid", gap: "3px", transition: "var(--transition-fast)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: PRIORITY_DOT[r.priority], flexShrink: 0 }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", fontFamily: "monospace" }}>{r.requisition_number ?? "—"}</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "3px", background: stCfg.bg, border: `1px solid ${stCfg.border}`, color: stCfg.color }}>{stLabel}</span>
              </div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--color-text-muted)" }}>
                <span>{r.department ?? "—"}</span>
                <span>{r.needed_by ? new Date(r.needed_by).toLocaleDateString(locale, { day: "numeric", month: "short" }) : ""}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
