"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { AccountPayable, APFilters } from "../types/cxp.types";
import { AP_STATUS_CONFIG, AP_AGING_CONFIG, AP_SUPPLIER_TYPE_CONFIG, DEFAULT_AP_FILTERS } from "../types/cxp.types";

type Props = {
  items:    AccountPayable[];
  loading:  boolean;
  filters:  APFilters;
  onFilter: (f: Partial<APFilters>) => void;
  onSelect: (ap: AccountPayable) => void;
  onPay:    (ap: AccountPayable) => void;
};

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const SELECT: React.CSSProperties = { height: "32px", padding: "0 8px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", cursor: "pointer" };

export default function CxPCartera({ items, loading, filters, onFilter, onSelect, onPay }: Props) {
  const { lang, t } = useTranslation();
  const es  = lang !== "en";
  const cxp = (t as any).cxp ?? {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Filtros */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={filters.search}
          onChange={e => onFilter({ search: e.target.value })}
          placeholder={es ? "Buscar proveedor, folio…" : "Search supplier, folio…"}
          style={{ height: "32px", padding: "0 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", width: "200px" }}
        />
        <select value={filters.supplier_type} onChange={e => onFilter({ supplier_type: e.target.value as any })} style={SELECT}>
          <option value="all">{es ? "Todos los tipos" : "All types"}</option>
          <option value="procurement">📦 {es ? "Abastecimiento" : "Procurement"}</option>
          <option value="logistics">🚛 {es ? "Logística" : "Logistics"}</option>
          <option value="operating">🏢 {es ? "Operativo" : "Operating"}</option>
        </select>
        <select value={filters.status} onChange={e => onFilter({ status: e.target.value as any })} style={SELECT}>
          <option value="all">{es ? "Todos los estados" : "All statuses"}</option>
          <option value="pending">{es ? "Pendiente" : "Pending"}</option>
          <option value="partial">{es ? "Parcial" : "Partial"}</option>
          <option value="paid">{es ? "Pagado" : "Paid"}</option>
          <option value="disputed">{es ? "En disputa" : "Disputed"}</option>
        </select>
        <select value={filters.aging} onChange={e => onFilter({ aging: e.target.value as any })} style={SELECT}>
          <option value="all">{es ? "Toda antigüedad" : "All aging"}</option>
          <option value="0-30">0-30 días</option>
          <option value="31-60">31-60 días</option>
          <option value="61-90">61-90 días</option>
          <option value="+90">+90 días</option>
        </select>
        {(filters.search || filters.status !== "all" || filters.supplier_type !== "all" || filters.aging !== "all") && (
          <button onClick={() => onFilter(DEFAULT_AP_FILTERS)} style={{ height: "32px", padding: "0 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
            ✕ {es ? "Limpiar" : "Clear"}
          </button>
        )}
        <div style={{ marginLeft: "auto", fontSize: "12px", color: "var(--color-text-muted)" }}>
          {items.length} {es ? "resultados" : "results"}
        </div>
      </div>

      {/* Header tabla */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 120px 100px 90px 80px 80px", padding: "8px 16px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          <span>Proveedor</span>
          <span style={{ textAlign: "center" }}>Tipo</span>
          <span>{es ? "Documento" : "Document"}</span>
          <span style={{ textAlign: "right" }}>Total</span>
          <span style={{ textAlign: "right" }}>Saldo</span>
          <span style={{ textAlign: "center" }}>Vence</span>
          <span style={{ textAlign: "center" }}>Estado</span>
          <span style={{ textAlign: "center" }}>Acción</span>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
            {es ? "Cargando…" : "Loading…"}
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
            <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{cxp.noPayables ?? "Sin cuentas por pagar"}</div>
          </div>
        ) : items.map((ap, i) => {
          const sc   = AP_STATUS_CONFIG[ap.status];
          const tc   = AP_SUPPLIER_TYPE_CONFIG[ap.supplier_type];
          const ac   = AP_AGING_CONFIG[ap.aging_bucket ?? "0-30"];
          const days = ap.days_due ?? 0;
          return (
            <div key={ap.id}
              style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 120px 100px 90px 80px 80px", padding: "10px 16px", borderBottom: i < items.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center", cursor: "pointer" }}
              onClick={() => onSelect(ap)}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{ap.supplier_name}</div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "1px" }}>
                  {ap.document_number ?? "—"}{ap.po ? ` · ${ap.po.po_number}` : ""}{ap.shipment ? ` · ${ap.shipment.reference}` : ""}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 5px", borderRadius: "var(--radius-full)", background: `${tc.color}20`, color: tc.color }}>
                  {tc.icon}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                {new Date(ap.document_date).toLocaleDateString(es ? "es-MX" : "en-US", { month: "short", day: "2-digit" })}
              </div>
              <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {ap.currency} ${fmt(ap.total)}
              </div>
              <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 800, color: ap.balance > 0 ? "var(--color-danger-text)" : "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                ${fmt(ap.balance)}
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: ac.bg, color: ac.color }}>
                  {ap.due_date ? `${days}d` : "—"}
                </span>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: sc.bg, color: sc.color }}>
                  {sc.labelEs}
                </span>
              </div>
              <div style={{ textAlign: "center" }}>
                {ap.balance > 0 && ap.status !== "cancelled" && (
                  <button onClick={e => { e.stopPropagation(); onPay(ap); }}
                    style={{ height: "24px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>
                    {es ? "Pagar" : "Pay"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
