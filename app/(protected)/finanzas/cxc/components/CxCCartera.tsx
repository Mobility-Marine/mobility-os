"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { AccountReceivable, ARFilters } from "../types/cxc.types";
import { AR_STATUS_CONFIG, AR_COLLECTION_CONFIG, AR_AGING_CONFIG } from "../types/cxc.types";

type Props = {
  items:    AccountReceivable[];
  loading:  boolean;
  filters:  ARFilters;
  onFilter: (p: Partial<ARFilters>) => void;
  onSelect: (ar: AccountReceivable) => void;
  onUpdateCollectionStatus: (id: string, cs: string) => void;
};

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const INPUT: React.CSSProperties = { height: "32px", padding: "0 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none" };

export default function CxCCartera({ items, loading, filters, onFilter, onSelect, onUpdateCollectionStatus }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";
  const [editingCS, setEditingCS] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* Filtros */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 160px 160px 130px 130px", gap: "8px", padding: "14px 16px", background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)" }}>
        <input
          value={filters.search}
          onChange={e => onFilter({ search: e.target.value })}
          placeholder={es ? "Buscar cliente, RFC, folio…" : "Search client, RFC, folio…"}
          style={{ ...INPUT, height: "36px", fontSize: "13px" }}
        />
        <select value={filters.status} onChange={e => onFilter({ status: e.target.value as any })} style={{ ...INPUT, cursor: "pointer" }}>
          <option value="all">{es ? "Todos los estados" : "All statuses"}</option>
          {(["pending","partial","paid","disputed","bad_debt"] as const).map(s => (
            <option key={s} value={s}>{es ? AR_STATUS_CONFIG[s].labelEs : AR_STATUS_CONFIG[s].labelEn}</option>
          ))}
        </select>
        <select value={filters.aging} onChange={e => onFilter({ aging: e.target.value as any })} style={{ ...INPUT, cursor: "pointer" }}>
          <option value="all">{es ? "Toda antigüedad" : "All aging"}</option>
          {(["0-30","31-60","61-90","+90"] as const).map(b => (
            <option key={b} value={b}>{es ? AR_AGING_CONFIG[b].labelEs : AR_AGING_CONFIG[b].labelEn}</option>
          ))}
        </select>
        <select value={filters.collection} onChange={e => onFilter({ collection: e.target.value as any })} style={{ ...INPUT, cursor: "pointer" }}>
          <option value="all">{es ? "Toda gestión" : "All collection"}</option>
          {(["not_started","contacted","promised","escalated"] as const).map(c => (
            <option key={c} value={c}>{es ? AR_COLLECTION_CONFIG[c].labelEs : AR_COLLECTION_CONFIG[c].labelEn}</option>
          ))}
        </select>
        <input type="date" value={filters.from} onChange={e => onFilter({ from: e.target.value })} style={INPUT} title={es ? "Desde" : "From"} />
        <input type="date" value={filters.to} onChange={e => onFilter({ to: e.target.value })} style={INPUT} title={es ? "Hasta" : "To"} />
      </div>

      {/* Conteo */}
      <div style={{ fontSize: "12px", color: "var(--color-text-muted)", paddingLeft: "4px" }}>
        {items.length} {es ? "cuentas" : "accounts"} · {es ? "total: " : "total: "}
        <strong style={{ color: "var(--color-text-primary)" }}>
          ${fmt(items.reduce((s, i) => s + i.balance, 0))}
        </strong>
      </div>

      {/* Tabla */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 110px 110px 110px 110px 80px 160px 50px", padding: "9px 16px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          <span>{es ? "Folio" : "Folio"}</span>
          <span>{es ? "Cliente" : "Client"}</span>
          <span style={{ textAlign: "center" }}>{es ? "Fecha" : "Date"}</span>
          <span style={{ textAlign: "right" }}>{es ? "Total" : "Total"}</span>
          <span style={{ textAlign: "right" }}>{es ? "Pagado" : "Paid"}</span>
          <span style={{ textAlign: "right" }}>{es ? "Saldo" : "Balance"}</span>
          <span style={{ textAlign: "center" }}>{es ? "Días" : "Days"}</span>
          <span style={{ textAlign: "center" }}>{es ? "Gestión cobranza" : "Collection"}</span>
          <span />
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
            {es ? "Cargando…" : "Loading…"}
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📋</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {es ? "Sin cuentas por cobrar" : "No accounts receivable"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              {es ? "Emite facturas PPD en el módulo de Facturación para verlas aquí automáticamente." : "Issue PPD invoices in the Billing module to see them here automatically."}
            </div>
          </div>
        ) : items.map((ar, i) => {
          const sc  = AR_STATUS_CONFIG[ar.status];
          const ac  = AR_AGING_CONFIG[ar.aging_bucket ?? "0-30"];
          const days = ar.days_overdue ?? 0;
          const pct  = ar.total > 0 ? (ar.paid_amount / ar.total) * 100 : 0;

          return (
            <div key={ar.id}
              style={{ display: "grid", gridTemplateColumns: "120px 1fr 110px 110px 110px 110px 80px 160px 50px", padding: "11px 16px", borderBottom: i < items.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center", transition: "background 0.1s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>

              {/* Folio */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-brand-blue)", fontFamily: "monospace" }}>
                  {ar.document_number || "—"}
                </div>
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: sc.bg, color: sc.color }}>
                  {es ? sc.labelEs : sc.labelEn}
                </span>
              </div>

              {/* Cliente */}
              <div style={{ cursor: "pointer" }} onClick={() => onSelect(ar)}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ar.client_name}
                </div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                  {ar.client_rfc || "—"}
                </div>
              </div>

              {/* Fecha */}
              <div style={{ textAlign: "center", fontSize: "11px", color: "var(--color-text-muted)" }}>
                {new Date(ar.document_date).toLocaleDateString(es ? "es-MX" : "en-US", { month: "short", day: "2-digit", year: "2-digit" })}
              </div>

              {/* Total */}
              <div style={{ textAlign: "right", fontSize: "12px", fontVariantNumeric: "tabular-nums", color: "var(--color-text-second)" }}>
                ${fmt(ar.total)}
              </div>

              {/* Pagado + barra progreso */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", fontVariantNumeric: "tabular-nums", color: "var(--color-success-text)" }}>
                  ${fmt(ar.paid_amount)}
                </div>
                <div style={{ height: "3px", borderRadius: "2px", background: "var(--color-border-faint)", marginTop: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "var(--color-success-text)", borderRadius: "2px" }} />
                </div>
              </div>

              {/* Saldo */}
              <div style={{ textAlign: "right", fontSize: "13px", fontWeight: 800, fontVariantNumeric: "tabular-nums", color: ar.balance > 0 ? "var(--color-warning-text)" : "var(--color-success-text)" }}>
                ${fmt(ar.balance)}
              </div>

              {/* Días */}
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: ac.bg, color: ac.color }}>
                  {days}d
                </span>
              </div>

              {/* Gestión cobranza inline */}
              <div onClick={(e) => e.stopPropagation()}>
                {editingCS === ar.id ? (
                  <select
                    autoFocus
                    defaultValue={ar.collection_status}
                    onChange={(e) => { onUpdateCollectionStatus(ar.id, e.target.value); setEditingCS(null); }}
                    onBlur={() => setEditingCS(null)}
                    style={{ ...INPUT, width: "100%", height: "28px", fontSize: "11px", cursor: "pointer" }}>
                    {(["not_started","contacted","promised","escalated"] as const).map(cs => (
                      <option key={cs} value={cs}>{es ? AR_COLLECTION_CONFIG[cs].labelEs : AR_COLLECTION_CONFIG[cs].labelEn}</option>
                    ))}
                  </select>
                ) : (
                  <button onClick={() => setEditingCS(ar.id)}
                    style={{ height: "24px", padding: "0 8px", borderRadius: "var(--radius-full)", background: AR_COLLECTION_CONFIG[ar.collection_status].bg, border: "none", color: AR_COLLECTION_CONFIG[ar.collection_status].color, fontSize: "10px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                    {es ? AR_COLLECTION_CONFIG[ar.collection_status].labelEs : AR_COLLECTION_CONFIG[ar.collection_status].labelEn}
                  </button>
                )}
              </div>

              {/* Acción ver */}
              <div style={{ textAlign: "center" }}>
                <button onClick={() => onSelect(ar)} title={es ? "Ver detalle" : "View detail"}
                  style={{ width: "28px", height: "28px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
