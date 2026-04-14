"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { Reception, ReceptionFilters, ReceptionStatus, QCStatus } from "../types/recepciones.types";
import { RECEPTION_STATUS_CONFIG, QC_STATUS_CONFIG } from "../types/recepciones.types";

type Props = {
  receptions: Reception[];
  loading:    boolean;
  filters:    ReceptionFilters;
  onFilter:   (f: Partial<ReceptionFilters>) => void;
  onSelect:   (r: Reception) => void;
  onNew:      () => void;
};

const STATUS_OPTIONS: (ReceptionStatus | "all")[] = ["all", "draft", "in_progress", "complete", "partial", "rejected", "cancelled"];
const QC_OPTIONS: (QCStatus | "all")[]            = ["all", "pending", "approved", "partial", "rejected", "quarantine"];

export default function RecepcionesList({ receptions, loading, filters, onFilter, onSelect, onNew }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const statusLabel = (s: ReceptionStatus) =>
    es ? RECEPTION_STATUS_CONFIG[s].labelEs : RECEPTION_STATUS_CONFIG[s].labelEn;
  const qcLabel = (q: QCStatus) =>
    es ? QC_STATUS_CONFIG[q].labelEs : QC_STATUS_CONFIG[q].labelEn;

  const INPUT: React.CSSProperties = {
    height: "34px", padding: "0 10px", borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
    color: "var(--color-text-primary)", fontSize: "12px", outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* TOOLBAR */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        {/* Búsqueda */}
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <svg style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={filters.search}
            onChange={(e) => onFilter({ search: e.target.value })}
            placeholder={es ? "Buscar por número, factura…" : "Search by number, invoice…"}
            style={{ ...INPUT, width: "100%", paddingLeft: "28px", boxSizing: "border-box" }}
          />
        </div>

        {/* Status filter */}
        <select value={filters.status} onChange={(e) => onFilter({ status: e.target.value as any })} style={INPUT}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? (es ? "Todos los estados" : "All statuses") : statusLabel(s as ReceptionStatus)}
            </option>
          ))}
        </select>

        {/* QC filter */}
        <select value={filters.qc} onChange={(e) => onFilter({ qc: e.target.value as any })} style={INPUT}>
          {QC_OPTIONS.map((q) => (
            <option key={q} value={q}>
              {q === "all" ? (es ? "Todos los QC" : "All QC") : qcLabel(q as QCStatus)}
            </option>
          ))}
        </select>

        {/* Nueva recepción */}
        <button onClick={onNew} style={{
          height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)",
          background: "var(--color-brand-blue)", color: "#fff", border: "none",
          fontSize: "12px", fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", gap: "6px",
          whiteSpace: "nowrap",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {es ? "Nueva recepción" : "New reception"}
        </button>
      </div>

      {/* TABLE */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        {/* Head */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "160px 1fr 1fr 110px 110px 120px 100px",
          padding: "10px 16px",
          background: "var(--color-bg-subtle)",
          borderBottom: "1px solid var(--color-border-faint)",
          fontSize: "10px", fontWeight: 700,
          color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px",
        }}>
          <span>{es ? "Número" : "Number"}</span>
          <span>{es ? "Proveedor" : "Supplier"}</span>
          <span>{es ? "Orden de Compra" : "Purchase Order"}</span>
          <span>{es ? "Recibido" : "Received"}</span>
          <span>{es ? "Estado" : "Status"}</span>
          <span>QC</span>
          <span>{es ? "Diferencias" : "Discrepancies"}</span>
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
            {es ? "Cargando…" : "Loading…"}
          </div>
        ) : receptions.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📦</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {es ? "Sin recepciones" : "No receptions"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              {es ? "Crea una nueva recepción desde una OC aprobada" : "Create a new reception from an approved PO"}
            </div>
          </div>
        ) : (
          receptions.map((r, i) => {
            const sc  = RECEPTION_STATUS_CONFIG[r.status];
            const qcc = QC_STATUS_CONFIG[r.qc_status];
            return (
              <div
                key={r.id}
                onClick={() => onSelect(r)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr 1fr 110px 110px 120px 100px",
                  padding: "12px 16px",
                  borderBottom: i < receptions.length - 1 ? "1px solid var(--color-border-faint)" : "none",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Número */}
                <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>
                  {r.reception_number}
                </div>
                {/* Proveedor */}
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {r.supplier?.name ?? "—"}
                  </div>
                  {r.supplier_invoice && (
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                      {es ? "Fact:" : "Inv:"} {r.supplier_invoice}
                    </div>
                  )}
                </div>
                {/* OC */}
                <div style={{ fontSize: "12px", color: "var(--color-text-second)" }}>
                  {r.purchase_order?.po_number ?? "—"}
                </div>
                {/* Fecha */}
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  {r.received_date ? new Date(r.received_date).toLocaleDateString(es ? "es-MX" : "en-US") : "—"}
                </div>
                {/* Status */}
                <div>
                  <span style={{
                    fontSize: "10px", fontWeight: 700, padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`,
                  }}>
                    {es ? sc.labelEs : sc.labelEn}
                  </span>
                </div>
                {/* QC */}
                <div>
                  <span style={{
                    fontSize: "10px", fontWeight: 700, padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    color: qcc.color, background: qcc.bg, border: `1px solid ${qcc.border}`,
                  }}>
                    {es ? qcc.labelEs : qcc.labelEn}
                  </span>
                </div>
                {/* Diferencias */}
                <div>
                  {r.has_discrepancies ? (
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", color: "var(--color-danger-text)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)" }}>
                      {es ? "Con dif." : "Has diff."}
                    </span>
                  ) : (
                    <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>—</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Contador */}
      {receptions.length > 0 && (
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", textAlign: "right" }}>
          {receptions.length} {es ? "recepciones" : "receptions"}
        </div>
      )}
    </div>
  );
}
