"use client";
import type { ForeignTradeOperation, FTFilters, TradeStatus, OperationType } from "../types/foreign-trade.types";
import { TRADE_STATUS_CONFIG } from "../types/foreign-trade.types";
import { useTranslation }      from "@/lib/i18n/useTranslation";
import { fmtCurrency }         from "../services/foreign-trade.service";

type Props = {
  ops:         ForeignTradeOperation[];
  selected:    ForeignTradeOperation | null;
  setSelected: (o: ForeignTradeOperation) => void;
  filters:     FTFilters;
  setFilters:  (f: FTFilters) => void;
  onNew:       () => void;
};

const TYPE_COLORS = { import: "#2563eb", export: "#7c3aed" };

export default function FTSidebar({ ops, selected, setSelected, filters, setFilters, onNew }: Props) {
  const { t, lang } = useTranslation();
  const tl          = (t.logistics as any) ?? {};
  const locale      = lang === "en" ? "en-US" : "es-MX";

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", height: "100%", minHeight: 0, overflow: "hidden" }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{tl.foreignTrade ?? "Comercio Ext."}</span>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>{ops.length}</span>
        </div>

        <button onClick={onNew} style={{ width: "100%", height: "34px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {tl.newOperation ?? "Nueva operación"}
        </button>

        <div style={{ position: "relative", marginBottom: "8px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input placeholder={tl.searchOperation ?? "Buscar…"} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} style={{ width: "100%", height: "32px", paddingLeft: "28px", paddingRight: "8px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: "3px" }}>
          {([
            { v: "all",    l: "Todos"  },
            { v: "import", l: tl.opTypeImport ?? "Imp."  },
            { v: "export", l: tl.opTypeExport ?? "Exp."  },
          ] as { v: OperationType | "all"; l: string }[]).map((f) => (
            <button key={f.v} onClick={() => setFilters({ ...filters, operation_type: f.v })} style={{
              flex: 1, height: "22px", borderRadius: "var(--radius-full)", cursor: "pointer", fontSize: "10px", fontWeight: filters.operation_type === f.v ? 700 : 500,
              background: filters.operation_type === f.v ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
              border: `1px solid ${filters.operation_type === f.v ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
              color: filters.operation_type === f.v ? "#fff" : "var(--color-text-muted)",
            }}>{f.l}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "grid", gap: "5px", alignContent: "start" }}>
        {ops.length === 0 ? (
          <div style={{ padding: "28px 12px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>{tl.noOperations ?? "Sin operaciones"}</div>
        ) : ops.map((o) => {
          const isSelected = selected?.id === o.id;
          const stCfg      = TRADE_STATUS_CONFIG[o.status];
          const STATUS_LABEL_MAP: Record<string,string> = { open: tl.statusOpen ?? "Abierta", in_process: tl.statusInProcess ?? "En proceso", at_customs: tl.statusAtCustoms ?? "En aduana", released: tl.statusReleased ?? "Liberada", closed: tl.statusClosed ?? "Cerrada", cancelled: tl.ftStatusCancelled ?? "Cancelada" };
const stLabel = STATUS_LABEL_MAP[o.status] ?? o.status;

          return (
            <div key={o.id} onClick={() => setSelected(o)} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: isSelected ? "var(--color-bg-active)" : "var(--color-bg-subtle)", border: isSelected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border-faint)", cursor: "pointer", display: "grid", gap: "4px", transition: "var(--transition-fast)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "9px", fontWeight: 800, padding: "1px 6px", borderRadius: "var(--radius-full)", background: o.operation_type === "import" ? "#dbeafe" : "#ede9fe", color: TYPE_COLORS[o.operation_type], border: `1px solid ${o.operation_type === "import" ? "#93c5fd" : "#c4b5fd"}` }}>
                  {o.operation_type === "import" ? "IMP" : "EXP"}
                </span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: stCfg.bg, color: stCfg.color, border: `1px solid ${stCfg.border}` }}>{stLabel}</span>
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "monospace" }}>
                {o.pedimento_number ?? o.invoice_number ?? o.id.slice(0, 8).toUpperCase()}
              </div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {o.shipment?.client?.name ?? o.client?.name ?? "—"}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                  {new Date(o.created_at).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                </span>
                {(o.alert_inspection || o.alert_embargo) && (
                  <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--color-danger-text)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", padding: "0 4px", borderRadius: "3px" }}>ALERTA</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
