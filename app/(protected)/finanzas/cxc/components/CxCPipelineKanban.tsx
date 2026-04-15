"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { AccountReceivable, ARCollectionStatus } from "../types/cxc.types";
import { AR_COLLECTION_CONFIG, AR_AGING_CONFIG } from "../types/cxc.types";

type Props = {
  items:    AccountReceivable[];
  onSelect: (ar: AccountReceivable) => void;
  onUpdateCollectionStatus: (id: string, cs: string) => void;
};

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });

const COLUMNS: ARCollectionStatus[] = ["not_started", "contacted", "promised", "escalated"];

export default function CxCPipelineKanban({ items, onSelect, onUpdateCollectionStatus }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const active = items.filter(i => i.status !== "paid" && i.status !== "bad_debt");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", alignItems: "start" }}>
      {COLUMNS.map((col) => {
        const colItems = active.filter(i => i.collection_status === col);
        const colTotal = colItems.reduce((s, i) => s + i.balance, 0);
        const cfg = AR_COLLECTION_CONFIG[col];

        return (
          <div key={col} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>

            {/* Column Header */}
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--color-border-faint)", background: cfg.bg }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, color: cfg.color, textTransform: "uppercase", letterSpacing: "1px" }}>
                  {es ? cfg.labelEs : cfg.labelEn}
                </div>
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "rgba(0,0,0,0.1)", color: cfg.color }}>
                  {colItems.length}
                </span>
              </div>
              <div style={{ fontSize: "14px", fontWeight: 900, color: cfg.color, marginTop: "4px", fontVariantNumeric: "tabular-nums" }}>
                ${fmt(colTotal)}
              </div>
            </div>

            {/* Cards */}
            <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "8px", minHeight: "200px", maxHeight: "600px", overflowY: "auto" }}>
              {colItems.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", fontSize: "12px", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                  {es ? "Sin cuentas" : "No accounts"}
                </div>
              ) : colItems.map((ar) => {
                const ac = AR_AGING_CONFIG[ar.aging_bucket ?? "0-30"];
                return (
                  <div key={ar.id} onClick={() => onSelect(ar)}
                    style={{ padding: "12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", cursor: "pointer", transition: "all 0.1s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-brand-blue)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-faint)"; e.currentTarget.style.boxShadow = "none"; }}>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ar.client_name}
                      </div>
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: ac.bg, color: ac.color, flexShrink: 0, marginLeft: "4px" }}>
                        {ar.days_overdue}d
                      </span>
                    </div>

                    <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums", marginBottom: "6px" }}>
                      {ar.currency} ${fmt(ar.balance)}
                    </div>

                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "8px", fontFamily: "monospace" }}>
                      {ar.document_number || "—"}
                    </div>

                    {/* Promise date indicator */}
                    {ar.promise_date && (
                      <div style={{ padding: "3px 7px", borderRadius: "var(--radius-sm)", background: "var(--color-warning-bg)", fontSize: "9px", color: "var(--color-warning-text)", fontWeight: 600 }}>
                        {es ? "Promesa:" : "Promise:"} {new Date(ar.promise_date).toLocaleDateString(es ? "es-MX" : "en-US", { month: "short", day: "2-digit" })}
      	            </div>
                    )}

                    {/* Quick move */}
                    <div style={{ display: "flex", gap: "4px", marginTop: "8px" }} onClick={(e) => e.stopPropagation()}>
                      {COLUMNS.filter(c => c !== col).map(nextCol => {
                        const nc = AR_COLLECTION_CONFIG[nextCol];
                        return (
                          <button key={nextCol} onClick={() => onUpdateCollectionStatus(ar.id, nextCol)}
                            title={es ? `Mover a: ${nc.labelEs}` : `Move to: ${nc.labelEn}`}
                            style={{ flex: 1, height: "20px", borderRadius: "var(--radius-sm)", background: nc.bg, border: "none", color: nc.color, fontSize: "8px", fontWeight: 700, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            → {es ? nc.labelEs.split(" ")[0] : nc.labelEn.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
