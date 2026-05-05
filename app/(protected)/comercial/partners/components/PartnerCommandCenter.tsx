// ════════════════════════════════════════════════════════════════════════
// PartnerCommandCenter — Cabecera ejecutiva del módulo Partners
// ════════════════════════════════════════════════════════════════════════
"use client";

import type { CSSProperties } from "react";
import type { PartnerStats } from "../types/partners.types";

export type PartnerCommandCenterProps = {
  stats:           PartnerStats;
  loading?:        boolean;
  companyName?:    string;
  onNewPartner:    () => void;
  onImportExport:  () => void;
};

const PANEL: CSSProperties = {
  display:        "flex",
  flexDirection:  "column",
  gap:            "16px",
  padding:        "18px 20px",
  borderRadius:   "var(--radius-lg, 12px)",
  border:         "1px solid var(--color-border)",
  background:     "linear-gradient(180deg, var(--color-bg-elevated), var(--color-bg-subtle))",
};

const HEADER_ROW: CSSProperties = {
  display:        "flex",
  alignItems:     "center",
  justifyContent: "space-between",
  gap:            "16px",
  flexWrap:       "wrap",
};

const TITLE_BLOCK: CSSProperties = {
  display:        "flex",
  flexDirection:  "column",
  gap:            "2px",
};

const TITLE: CSSProperties = {
  fontSize:       "22px",
  fontWeight:     700,
  color:          "var(--color-text-primary)",
  letterSpacing:  "-0.3px",
  lineHeight:     1.2,
};

const SUBTITLE: CSSProperties = {
  fontSize:       "12px",
  color:          "var(--color-text-muted)",
};

const COMPANY_BADGE: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            "6px",
  padding:        "4px 10px",
  borderRadius:   "var(--radius-md)",
  background:     "rgba(59, 130, 246, 0.10)",
  color:          "var(--color-brand-blue, #3b82f6)",
  fontSize:       "11px",
  fontWeight:     600,
  marginTop:      "4px",
  width:          "fit-content",
};

const ACTIONS: CSSProperties = {
  display:        "flex",
  gap:            "8px",
};

const BTN_PRIMARY: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            "6px",
  padding:        "8px 16px",
  borderRadius:   "var(--radius-md)",
  background:     "var(--color-brand-blue, #3b82f6)",
  color:          "#fff",
  fontSize:       "13px",
  fontWeight:     600,
  border:         "none",
  cursor:         "pointer",
  outline:        "none",
};

const BTN_SECONDARY: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            "6px",
  padding:        "8px 14px",
  borderRadius:   "var(--radius-md)",
  background:     "var(--color-bg-elevated)",
  color:          "var(--color-text-primary)",
  fontSize:       "13px",
  fontWeight:     600,
  border:         "1px solid var(--color-border)",
  cursor:         "pointer",
  outline:        "none",
};

const KPI_GRID: CSSProperties = {
  display:             "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap:                 "10px",
};

const KPI_CARD: CSSProperties = {
  padding:        "12px 14px",
  borderRadius:   "var(--radius-md)",
  border:         "1px solid var(--color-border)",
  background:     "var(--color-bg-elevated)",
  display:        "flex",
  flexDirection:  "column",
  gap:            "4px",
  minWidth:       0,
};

const KPI_LABEL: CSSProperties = {
  fontSize:       "10px",
  fontWeight:     600,
  letterSpacing:  "0.4px",
  textTransform:  "uppercase",
  color:          "var(--color-text-muted)",
  whiteSpace:     "nowrap",
  overflow:       "hidden",
  textOverflow:   "ellipsis",
};

const KPI_VALUE: CSSProperties = {
  fontSize:       "22px",
  fontWeight:     700,
  color:          "var(--color-text-primary)",
  lineHeight:     1.1,
  fontVariantNumeric: "tabular-nums",
};

const KPI_HINT: CSSProperties = {
  fontSize:       "10px",
  color:          "var(--color-text-muted)",
};

export default function PartnerCommandCenter({
  stats,
  loading,
  companyName,
  onNewPartner,
  onImportExport,
}: PartnerCommandCenterProps) {
  const rfcPct = stats.total > 0
    ? Math.round((stats.with_rfc / stats.total) * 100)
    : 0;

  return (
    <div style={PANEL}>
      <div style={HEADER_ROW}>
        <div style={TITLE_BLOCK}>
          <div style={TITLE}>Business Partners</div>
          <div style={SUBTITLE}>
            Vista unificada de clientes, proveedores y proveedores logísticos.
          </div>
          {companyName && (
            <div style={COMPANY_BADGE}>
              <span>🏢</span>
              <span>{companyName}</span>
            </div>
          )}
        </div>

        <div style={ACTIONS}>
          <button type="button" onClick={onImportExport} style={BTN_SECONDARY}>
            <span>📥</span>
            <span>Importar / Exportar</span>
          </button>
          <button type="button" onClick={onNewPartner} style={BTN_PRIMARY}>
            <span>＋</span>
            <span>Nuevo Partner</span>
          </button>
        </div>
      </div>

      <div style={KPI_GRID}>
        <div style={KPI_CARD}>
          <div style={KPI_LABEL}>Total</div>
          <div style={KPI_VALUE}>{loading ? "…" : stats.total}</div>
          <div style={KPI_HINT}>
            {stats.active} activos · {stats.inactive} inactivos
          </div>
        </div>

        <div style={KPI_CARD}>
          <div style={KPI_LABEL}>🤝 Clientes</div>
          <div style={KPI_VALUE}>{loading ? "…" : stats.customers}</div>
          <div style={KPI_HINT}>
            {stats.total > 0 ? `${Math.round((stats.customers / stats.total) * 100)}% del total` : "—"}
          </div>
        </div>

        <div style={KPI_CARD}>
          <div style={KPI_LABEL}>🏭 Proveedores</div>
          <div style={KPI_VALUE}>{loading ? "…" : stats.suppliers}</div>
          <div style={KPI_HINT}>
            {stats.total > 0 ? `${Math.round((stats.suppliers / stats.total) * 100)}% del total` : "—"}
          </div>
        </div>

        <div style={KPI_CARD}>
          <div style={KPI_LABEL}>🚚 Logísticos</div>
          <div style={KPI_VALUE}>{loading ? "…" : stats.logistics}</div>
          <div style={KPI_HINT}>
            {stats.total > 0 ? `${Math.round((stats.logistics / stats.total) * 100)}% del total` : "—"}
          </div>
        </div>

        <div style={KPI_CARD}>
          <div style={KPI_LABEL}>Multi-rol</div>
          <div style={KPI_VALUE}>{loading ? "…" : stats.dual_roles}</div>
          <div style={KPI_HINT}>2+ roles activos</div>
        </div>

        <div style={KPI_CARD}>
          <div style={KPI_LABEL}>Nuevos 30d</div>
          <div style={KPI_VALUE}>{loading ? "…" : stats.created_last_30_days}</div>
          <div style={KPI_HINT}>últimos 30 días</div>
        </div>

        <div style={KPI_CARD}>
          <div style={KPI_LABEL}>Calidad RFC</div>
          <div
            style={{
              ...KPI_VALUE,
              color:
                rfcPct >= 80
                  ? "var(--color-success-text)"
                  : rfcPct >= 50
                    ? "var(--color-warning-text)"
                    : "var(--color-danger-text)",
            }}
          >
            {loading ? "…" : `${rfcPct}%`}
          </div>
          <div style={KPI_HINT}>{stats.with_rfc} con RFC capturado</div>
        </div>
      </div>
    </div>
  );
}