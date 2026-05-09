"use client";

import React, { useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CFDIDocument } from "../types/facturacion.types";
import type { CFDIFilters } from "../services/facturacion.controller";
import VirtualTable, {
  type Column,
} from "@/app/components/shared/VirtualTable";

// ═══════════════════════════════════════════════════════════════════
// FACTURACION LIST — Lista de CFDIs virtualizada
// Patrón ERP: VirtualTable con columnas configurables
// ═══════════════════════════════════════════════════════════════════

type Props = {
  cfdis:    CFDIDocument[];
  loading:  boolean;
  filters:  CFDIFilters;
  onFilter: (f: Partial<CFDIFilters>) => void;
  onSelect: (c: CFDIDocument) => void;
  onXML:    (c: CFDIDocument) => void;
  onPDF:    (c: CFDIDocument) => void;
};

const fmt = (n: number) =>
  Number(n).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const TYPE_LABELS: Record<
  string,
  { es: string; en: string; color: string; bg: string }
> = {
  I: { es: "Ingreso",   en: "Income",   color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
  E: { es: "Egreso",    en: "Credit",   color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
  P: { es: "Pago",      en: "Payment",  color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)"    },
  T: { es: "Traslado",  en: "Transfer", color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)"  },
  N: { es: "Nómina",    en: "Payroll",  color: "#7c3aed",                   bg: "#ede9fe"                 },
};

const STATUS_COLORS: Record<
  string,
  { color: string; bg: string; border: string; es: string; en: string }
> = {
  valid: {
    color:  "var(--color-success-text)",
    bg:     "var(--color-success-bg)",
    border: "var(--color-success-border)",
    es:     "Vigente",
    en:     "Valid",
  },
  cancelled: {
    color:  "var(--color-danger-text)",
    bg:     "var(--color-danger-bg)",
    border: "var(--color-danger-border)",
    es:     "Cancelada",
    en:     "Cancelled",
  },
  cancellation_requested: {
    color:  "var(--color-warning-text)",
    bg:     "var(--color-warning-bg)",
    border: "var(--color-warning-border)",
    es:     "Cancelación pendiente",
    en:     "Cancel. pending",
  },
};

export default function FacturacionList({
  cfdis,
  loading,
  filters,
  onFilter,
  onSelect,
  onXML,
  onPDF,
}: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const INPUT: React.CSSProperties = {
    height:       "34px",
    padding:      "0 10px",
    borderRadius: "var(--radius-md)",
    border:       "1px solid var(--color-border)",
    background:   "var(--color-bg-subtle)",
    color:        "var(--color-text-primary)",
    fontSize:     "12px",
    outline:      "none",
  };

  // ── Columnas data-driven ──────────────────────────────────────────
  const columns: Column<CFDIDocument>[] = useMemo(
    () => [
      {
        key:    "type",
        header: es ? "Tipo" : "Type",
        width:  "90px",
        render: (cfdi) => {
          const tl = TYPE_LABELS[cfdi.type] ?? TYPE_LABELS.I;
          return (
            <span
              style={{
                fontSize:     "10px",
                fontWeight:   700,
                padding:      "3px 7px",
                borderRadius: "var(--radius-full)",
                background:   tl.bg,
                color:        tl.color,
                display:      "inline-block",
              }}
            >
              {es ? tl.es : tl.en}
            </span>
          );
        },
      },
      {
        key:    "folio",
        header: "Folio",
        width:  "100px",
        render: (cfdi) => (
          <div
            style={{
              fontSize:   "12px",
              fontWeight: 700,
              color:      "var(--color-text-primary)",
              fontFamily: "ui-monospace, monospace",
              overflow:   "hidden",
              textOverflow:"ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {cfdi.serie ?? ""}
            {cfdi.folio ?? "—"}
          </div>
        ),
      },
      {
        key:    "receiver",
        header: es ? "Receptor" : "Receiver",
        width:  "1fr",
        render: (cfdi) => (
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div
              style={{
                fontSize:     "12px",
                fontWeight:   600,
                color:        "var(--color-text-primary)",
                overflow:     "hidden",
                textOverflow: "ellipsis",
                whiteSpace:   "nowrap",
              }}
            >
              {cfdi.receiver_name}
            </div>
            <div
              style={{
                fontSize:   "10px",
                color:      "var(--color-text-muted)",
                fontFamily: "ui-monospace, monospace",
                overflow:   "hidden",
                textOverflow:"ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {cfdi.receiver_rfc}
            </div>
          </div>
        ),
      },
      {
        key:    "date",
        header: es ? "Fecha" : "Date",
        width:  "140px",
        render: (cfdi) => (
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            {new Date(cfdi.cfdi_date).toLocaleDateString(es ? "es-MX" : "en-US", {
              year:  "numeric",
              month: "short",
              day:   "2-digit",
            })}
          </div>
        ),
      },
      {
        key:    "method",
        header: es ? "Método" : "Method",
        width:  "80px",
        align:  "center",
        render: (cfdi) => (
          <span
            style={{
              fontSize:     "10px",
              fontWeight:   700,
              padding:      "2px 6px",
              borderRadius: "var(--radius-full)",
              background:   cfdi.payment_method === "PPD"
                ? "var(--color-warning-bg)"
                : "var(--color-bg-subtle)",
              color:        cfdi.payment_method === "PPD"
                ? "var(--color-warning-text)"
                : "var(--color-text-muted)",
              border:       "1px solid transparent",
            }}
          >
            {cfdi.payment_method}
          </span>
        ),
      },
      {
        key:    "total",
        header: "Total",
        width:  "130px",
        align:  "right",
        render: (cfdi) => (
          <div
            style={{
              fontSize:           "13px",
              fontWeight:         800,
              color:              "var(--color-text-primary)",
              fontVariantNumeric: "tabular-nums",
              whiteSpace:         "nowrap",
              overflow:           "hidden",
              textOverflow:       "ellipsis",
            }}
          >
            {cfdi.currency} ${fmt(cfdi.total)}
          </div>
        ),
      },
      {
        key:    "status",
        header: es ? "Estado" : "Status",
        width:  "120px",
        align:  "center",
        render: (cfdi) => {
          const sc = STATUS_COLORS[cfdi.status] ?? STATUS_COLORS.valid;
          return (
            <span
              style={{
                fontSize:     "9px",
                fontWeight:   700,
                padding:      "3px 7px",
                borderRadius: "var(--radius-full)",
                background:   sc.bg,
                color:        sc.color,
                border:       `1px solid ${sc.border}`,
                display:      "inline-block",
                whiteSpace:   "nowrap",
                overflow:     "hidden",
                textOverflow: "ellipsis",
                maxWidth:     "100%",
              }}
            >
              {es ? sc.es : sc.en}
            </span>
          );
        },
      },
      {
        key:    "actions",
        header: es ? "Acciones" : "Actions",
        width:  "80px",
        align:  "center",
        render: (cfdi) => (
          <div
            style={{ display: "flex", gap: "4px", justifyContent: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              title="XML"
              onClick={() => onXML(cfdi)}
              style={iconBtnStyle}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>
            <button
              title="PDF"
              onClick={() => onPDF(cfdi)}
              style={iconBtnStyle}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
        ),
      },
    ],
    [es, onXML, onPDF],
  );

  // ── Total para footer ─────────────────────────────────────────────
  const totalIngresos = cfdis
    .filter((c) => c.status === "valid" && c.type === "I")
    .reduce((s, c) => s + c.total, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%", minHeight: 0 }}>
      {/* TOOLBAR */}
      <div
        style={{
          display:    "flex",
          gap:        "8px",
          flexWrap:   "wrap",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <svg
            style={{
              position:   "absolute",
              left:       "8px",
              top:        "50%",
              transform:  "translateY(-50%)",
              color:      "var(--color-text-muted)",
            }}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={filters.search}
            onChange={(e) => onFilter({ search: e.target.value })}
            placeholder={es ? "RFC, nombre, UUID, folio…" : "RFC, name, UUID, folio…"}
            style={{
              ...INPUT,
              paddingLeft: "26px",
              width:       "100%",
              boxSizing:   "border-box",
            }}
          />
        </div>
        <select
          value={filters.type}
          onChange={(e) => onFilter({ type: e.target.value })}
          style={INPUT}
        >
          <option value="">{es ? "Todos los tipos" : "All types"}</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {es ? v.es : v.en}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => onFilter({ status: e.target.value })}
          style={INPUT}
        >
          <option value="">{es ? "Todos los estados" : "All statuses"}</option>
          {Object.entries(STATUS_COLORS).map(([k, v]) => (
            <option key={k} value={k}>
              {es ? v.es : v.en}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => onFilter({ from: e.target.value })}
          style={INPUT}
          title={es ? "Desde" : "From"}
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => onFilter({ to: e.target.value })}
          style={INPUT}
          title={es ? "Hasta" : "To"}
        />
      </div>

      {/* TABLA VIRTUALIZADA */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <VirtualTable<CFDIDocument>
          items={cfdis}
          columns={columns}
          loading={loading}
          loadingText={es ? "Cargando…" : "Loading…"}
          rowHeight={64}
          onRowClick={onSelect}
          getRowId={(c) => c.id}
          emptyState={{
            icon:  <div style={{ fontSize: "36px", opacity: 0.5 }}>📄</div>,
            title: es ? "Sin CFDIs emitidos" : "No CFDIs issued",
            description: es
              ? "Emite tu primera factura con el botón «Nueva Factura»."
              : "Issue your first invoice with the «New Invoice» button.",
          }}
          footer={
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>
                {cfdis.length} {es ? "documentos" : "documents"}
              </span>
              <span>
                {es ? "Total ingresos vigentes:" : "Total valid income:"} ${fmt(totalIngresos)}
              </span>
            </div>
          }
        />
      </div>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width:        "26px",
  height:       "26px",
  borderRadius: "var(--radius-sm)",
  background:   "var(--color-bg-subtle)",
  border:       "1px solid var(--color-border-faint)",
  cursor:       "pointer",
  display:      "flex",
  alignItems:   "center",
  justifyContent: "center",
  color:        "var(--color-text-muted)",
};