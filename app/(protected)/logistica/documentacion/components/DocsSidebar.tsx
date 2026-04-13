"use client";
import type { ShipmentDocument, DocFilters, DocCategory, DocStatus } from "../types/docs.types";
import { DOC_CATEGORY_CONFIG, DOC_STATUS_CONFIG } from "../types/docs.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  docs:        ShipmentDocument[];
  selected:    ShipmentDocument | null;
  setSelected: (d: ShipmentDocument) => void;
  filters:     DocFilters;
  setFilters:  (f: DocFilters) => void;
  onNew:       () => void;
};

const STATUS_COLORS: Record<DocStatus, string> = {
  pending:   "#94a3b8",
  received:  "#3b82f6",
  validated: "#10b981",
  rejected:  "#ef4444",
};

export default function DocsSidebar({ docs, selected, setSelected, filters, setFilters, onNew }: Props) {
  const { t, lang } = useTranslation();
  const tl          = (t.logistics as any) ?? {};
  const locale      = lang === "en" ? "en-US" : "es-MX";

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", height: "100%", minHeight: 0, overflow: "hidden" }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{tl.documentation ?? "Documentos"}</span>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>{docs.length}</span>
        </div>

        <button onClick={onNew} style={{ width: "100%", height: "34px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {tl.newDocument ?? "Subir documento"}
        </button>

        <div style={{ position: "relative", marginBottom: "8px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input placeholder={tl.searchDocument ?? "Buscar…"} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} style={{ width: "100%", height: "32px", paddingLeft: "28px", paddingRight: "8px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", boxSizing: "border-box" }} />
        </div>

        {/* Status filter chips */}
        <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginBottom: "4px" }}>
          {([
            { v: "all",       l: "Todos"     },
            { v: "pending",   l: tl.statusPending2  ?? "Pendientes" },
            { v: "validated", l: tl.statusValidated ?? "Validados"  },
          ] as { v: DocStatus | "all"; l: string }[]).map((f) => (
            <button key={f.v} onClick={() => setFilters({ ...filters, status: f.v })} style={{
              height: "22px", padding: "0 7px", borderRadius: "var(--radius-full)", cursor: "pointer", fontSize: "10px", fontWeight: filters.status === f.v ? 700 : 500,
              background: filters.status === f.v ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
              border: `1px solid ${filters.status === f.v ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
              color: filters.status === f.v ? "#fff" : "var(--color-text-muted)",
            }}>{f.l}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "grid", gap: "5px", alignContent: "start" }}>
        {docs.length === 0 ? (
          <div style={{ padding: "28px 12px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>{tl.noDocuments2 ?? "Sin documentos"}</div>
        ) : docs.map((d) => {
          const isSelected = selected?.id === d.id;
          const catCfg     = DOC_CATEGORY_CONFIG[d.category];
          const stCfg      = DOC_STATUS_CONFIG[d.status];
          const catLabel   = tl[`cat${d.category.split("_").map((w: string) => w.charAt(0).toUpperCase()+w.slice(1)).join("")}`] ?? d.category;
          const stLabel    = tl[`status${d.status.charAt(0).toUpperCase()}${d.status.slice(1)}${d.status === "pending" ? "2" : d.status === "rejected" ? "2" : ""}`] ?? d.status;

          return (
            <div key={d.id} onClick={() => setSelected(d)} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: isSelected ? "var(--color-bg-active)" : "var(--color-bg-subtle)", border: isSelected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border-faint)", cursor: "pointer", display: "grid", gap: "4px", transition: "var(--transition-fast)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: catCfg.bg, color: catCfg.color, border: `1px solid ${catCfg.border}`, flexShrink: 0, maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{catLabel}</span>
                <div style={{ flex: 1 }} />
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: STATUS_COLORS[d.status], flexShrink: 0 }} />
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {d.shipment?.reference ?? d.client?.name ?? "—"}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                  {new Date(d.created_at).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                </span>
                {d.required && (
                  <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--color-warning-text)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", padding: "0 4px", borderRadius: "3px" }}>REQ</span>
                )}
                {d.expiry_date && new Date(d.expiry_date) <= new Date(Date.now() + 30*24*60*60*1000) && (
                  <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--color-danger-text)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", padding: "0 4px", borderRadius: "3px" }}>VCE</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
