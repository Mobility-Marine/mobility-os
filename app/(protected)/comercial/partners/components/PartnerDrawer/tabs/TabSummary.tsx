// ════════════════════════════════════════════════════════════════════════
// TabSummary — Tab 10 del wizard PartnerDrawer (Customer 360)
// ════════════════════════════════════════════════════════════════════════
// Vista consolidada del partner con datos reales de operación:
//
//   - Encabezado: identidad + roles + status + rating
//   - KPIs financieros (cliente):
//     * Total facturado YTD / all-time
//     * Saldo pendiente a cobrar
//     * Documentos vencidos
//     * Ticket promedio
//   - KPIs financieros (proveedor):
//     * Total compras YTD
//     * Saldo pendiente a pagar
//     * Documentos vencidos
//   - Operaciones recientes:
//     * Cotizaciones, Pedidos, Embarques, CFDIs, Órdenes de compra
//     * 5 más recientes de cada uno con folio + monto + status
//
// ARQUITECTURA DEFENSIVA:
//   Cada sección se carga en paralelo. Si una falla (RLS, FK movida,
//   tabla con cambios), muestra placeholder con el motivo, NO rompe
//   el resto del tab.
// ════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Partner } from "../types";
import {
  PartnerSummary,
  RecentOperation,
  computePartnerSummary,
} from "../services/partner-summary.service";
import { SectionTitle } from "../components/Field";

// ── Props ─────────────────────────────────────────────────────────────
export type TabSummaryProps = {
  partner:    Partial<Partner>;
  companyId:  string;
};

// ── Estilos ───────────────────────────────────────────────────────────
const PANEL: CSSProperties = {
  padding:        "16px",
  borderRadius:   "var(--radius-md)",
  border:         "1px solid var(--color-border)",
  background:     "var(--color-bg-subtle)",
  display:        "flex",
  flexDirection:  "column",
  gap:            "12px",
};

const KPI_GRID: CSSProperties = {
  display:             "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap:                 "10px",
};

const KPI_CARD: CSSProperties = {
  padding:        "14px",
  borderRadius:   "var(--radius-md)",
  border:         "1px solid var(--color-border)",
  background:     "var(--color-bg-elevated)",
  display:        "flex",
  flexDirection:  "column",
  gap:            "6px",
};

const KPI_LABEL: CSSProperties = {
  fontSize:       "10px",
  fontWeight:     600,
  letterSpacing:  "0.4px",
  textTransform:  "uppercase",
  color:          "var(--color-text-muted)",
};

const KPI_VALUE: CSSProperties = {
  fontSize:       "20px",
  fontWeight:     700,
  color:          "var(--color-text-primary)",
  lineHeight:     1.1,
  fontVariantNumeric: "tabular-nums",
};

const KPI_HINT: CSSProperties = {
  fontSize:       "10px",
  color:          "var(--color-text-muted)",
};

const SECTION_HEADER: CSSProperties = {
  display:         "flex",
  alignItems:      "center",
  justifyContent:  "space-between",
  fontSize:        "12px",
  fontWeight:      700,
  color:           "var(--color-text-muted)",
  textTransform:   "uppercase",
  letterSpacing:   "0.5px",
  marginBottom:    "4px",
};

const OP_ROW: CSSProperties = {
  display:             "grid",
  gridTemplateColumns: "120px 1fr 100px 110px",
  alignItems:          "center",
  gap:                 "10px",
  padding:             "8px 12px",
  borderRadius:        "var(--radius-sm, 4px)",
  border:              "1px solid var(--color-border)",
  background:          "var(--color-bg-subtle)",
  fontSize:            "12px",
};

const OP_HEADER_ROW: CSSProperties = {
  ...OP_ROW,
  background:    "var(--color-bg-elevated)",
  fontWeight:    700,
  fontSize:      "10px",
  textTransform: "uppercase",
  letterSpacing: "0.4px",
  color:         "var(--color-text-muted)",
};

const BADGE: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  padding:        "2px 8px",
  borderRadius:   "var(--radius-sm, 4px)",
  fontSize:       "10px",
  fontWeight:     700,
  letterSpacing:  "0.3px",
  textTransform:  "uppercase",
};

const ERROR_NOTICE: CSSProperties = {
  padding:       "10px 12px",
  borderRadius:  "var(--radius-md)",
  background:    "rgba(245, 158, 11, 0.08)",
  border:        "1px solid rgba(245, 158, 11, 0.25)",
  color:         "var(--color-warning-text)",
  fontSize:      "11px",
  display:       "flex",
  gap:           "8px",
  alignItems:    "flex-start",
};

const EMPTY_STATE: CSSProperties = {
  padding:       "20px",
  textAlign:     "center",
  border:        "1px dashed var(--color-border)",
  borderRadius:  "var(--radius-md)",
  color:         "var(--color-text-muted)",
  fontSize:      "12px",
};

// ── Helpers ───────────────────────────────────────────────────────────
function formatMoney(amount: number | null | undefined, currency = "MXN"): string {
  if (amount === null || amount === undefined) return "—";
  try {
    return new Intl.NumberFormat("es-MX", {
      style:                 "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-MX", { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

function statusBadgeStyle(status: string | null | undefined): CSSProperties {
  const s = (status ?? "").toLowerCase();
  // Verde: completados / pagados
  if (["paid","completed","approved","accepted","aprobada","pagada","completado","entregado","facturada","emitida"].some((k) => s.includes(k))) {
    return { ...BADGE, color: "var(--color-success-text)", background: "rgba(34, 197, 94, 0.15)" };
  }
  // Rojo: cancelados / rechazados
  if (["cancelled","rejected","canceled","cancelada","rechazada","vencida"].some((k) => s.includes(k))) {
    return { ...BADGE, color: "var(--color-danger-text)", background: "rgba(239, 68, 68, 0.15)" };
  }
  // Amarillo: en proceso / pendiente
  if (["pending","draft","open","sent","borrador","pendiente","proceso","enviada"].some((k) => s.includes(k))) {
    return { ...BADGE, color: "var(--color-warning-text)", background: "rgba(245, 158, 11, 0.15)" };
  }
  // Gris default
  return { ...BADGE, color: "var(--color-text-muted)", background: "rgba(148, 163, 184, 0.15)" };
}

function rolesText(p: Partial<Partner>): string {
  const roles: string[] = [];
  if (p.is_customer)           roles.push("Cliente");
  if (p.is_supplier)           roles.push("Proveedor");
  if (p.is_logistics_provider) roles.push("Logístico");
  return roles.length > 0 ? roles.join(" + ") : "Sin rol";
}

// ── Sub-componente: tabla de operaciones recientes ───────────────────
function RecentOpsTable({
  title,
  emoji,
  ops,
  count,
  emptyMessage,
}: {
  title:        string;
  emoji:        string;
  ops:          RecentOperation[];
  count:        number;
  emptyMessage: string;
}) {
  return (
    <div style={PANEL}>
      <div style={SECTION_HEADER}>
        <span>
          {emoji} {title}
        </span>
        <span style={{ fontWeight: 600, color: "var(--color-text-muted)", textTransform: "none", letterSpacing: "0" }}>
          {count > 0 ? `${count} total · ` : ""}
          mostrando {ops.length}
        </span>
      </div>

      {ops.length === 0 ? (
        <div style={EMPTY_STATE}>{emptyMessage}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={OP_HEADER_ROW}>
            <div>Folio / Ref.</div>
            <div>Estado</div>
            <div>Fecha</div>
            <div style={{ textAlign: "right" }}>Monto</div>
          </div>
          {ops.map((op) => (
            <div key={`${op.type}-${op.id}`} style={OP_ROW}>
              <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontFamily: "monospace" }}>
                {op.reference || "—"}
              </div>
              <div>
                {op.status ? (
                  <span style={statusBadgeStyle(op.status)}>{op.status}</span>
                ) : (
                  <span style={{ color: "var(--color-text-muted)" }}>—</span>
                )}
              </div>
              <div style={{ color: "var(--color-text-muted)" }}>{formatDate(op.date)}</div>
              <div
                style={{
                  textAlign: "right",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatMoney(op.amount, op.currency ?? "MXN")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────
export function TabSummary({ partner, companyId }: TabSummaryProps) {
  const [summary, setSummary] = useState<PartnerSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const partnerId   = partner.id;
  const isCustomer  = Boolean(partner.is_customer);
  const isSupplier  = Boolean(partner.is_supplier);
  const isLogistics = Boolean(partner.is_logistics_provider);

  // ── Cargar summary ────────────────────────────────────────────────
  useEffect(() => {
    if (!partnerId || !companyId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    computePartnerSummary(companyId, partnerId, { isCustomer, isSupplier })
      .then((s) => { if (!cancelled) setSummary(s); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [partnerId, companyId, isCustomer, isSupplier]);

  // ── Modo CREATE ───────────────────────────────────────────────────
  if (!partnerId) {
    return (
      <div style={{ padding: "20px" }}>
        <div style={EMPTY_STATE}>
          📊 <strong>Customer 360 no disponible</strong>
          <br />
          Esta vista consolidada se construye con datos operativos reales del partner.
          Guarda primero el partner para activarla.
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <SectionTitle>Customer 360 · Resumen consolidado</SectionTitle>

      {/* ─── Encabezado con datos del partner ─── */}
      <div style={PANEL}>
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap:                 "16px",
          }}
        >
          <div>
            <div style={KPI_LABEL}>Nombre comercial</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "2px" }}>
              {partner.name || "—"}
            </div>
            {partner.legal_name && partner.legal_name !== partner.name && (
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {partner.legal_name}
              </div>
            )}
          </div>
          <div>
            <div style={KPI_LABEL}>Roles</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginTop: "2px" }}>
              {rolesText(partner)}
            </div>
            {partner.rfc && (
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px", fontFamily: "monospace" }}>
                RFC: {partner.rfc}
              </div>
            )}
          </div>
          <div>
            <div style={KPI_LABEL}>Estado</div>
            <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px" }}>
              {partner.is_active ? (
                <span style={{ color: "var(--color-success-text)" }}>● Activo</span>
              ) : (
                <span style={{ color: "var(--color-text-muted)" }}>○ Inactivo</span>
              )}
            </div>
            {typeof partner.rating === "number" && partner.rating > 0 && (
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                Rating interno: {partner.rating}/5 ⭐
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Loading ─── */}
      {loading && (
        <div style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>
          ⏳ Cargando datos operativos consolidados...
        </div>
      )}

      {/* ─── Error general ─── */}
      {error && (
        <div
          style={{
            padding:      "10px 14px",
            borderRadius: "var(--radius-md)",
            background:   "rgba(239, 68, 68, 0.1)",
            color:        "var(--color-danger-text)",
            fontSize:     "12px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ─── Errores parciales por sección ─── */}
      {summary && Object.keys(summary.errors).length > 0 && (
        <div style={ERROR_NOTICE}>
          <span style={{ fontSize: "14px" }}>⚠️</span>
          <div>
            <strong>Algunas secciones no pudieron cargarse:</strong>
            <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
              {Object.entries(summary.errors).map(([section, msg]) => (
                <li key={section}>
                  <code>{section}</code>: {msg}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: "4px" }}>
              El resto del Customer 360 sigue funcionando normalmente.
            </div>
          </div>
        </div>
      )}

      {/* ─── KPIs Financieros (cliente) ─── */}
      {summary && isCustomer && (
        <>
          <div style={SECTION_HEADER}>
            <span>💰 Finanzas como cliente</span>
          </div>
          <div style={KPI_GRID}>
            <div style={KPI_CARD}>
              <div style={KPI_LABEL}>Facturado YTD</div>
              <div style={KPI_VALUE}>
                {formatMoney(summary.total_invoiced_ytd, summary.invoiced_currency)}
              </div>
              <div style={KPI_HINT}>
                Histórico: {formatMoney(summary.total_invoiced_alltime, summary.invoiced_currency)}
              </div>
            </div>
            <div style={KPI_CARD}>
              <div style={KPI_LABEL}>Saldo a cobrar</div>
              <div
                style={{
                  ...KPI_VALUE,
                  color:
                    (summary.receivable_balance ?? 0) > 0
                      ? "var(--color-warning-text)"
                      : "var(--color-text-primary)",
                }}
              >
                {formatMoney(summary.receivable_balance, summary.receivable_currency)}
              </div>
              {summary.receivable_overdue > 0 && (
                <div style={{ ...KPI_HINT, color: "var(--color-danger-text)", fontWeight: 600 }}>
                  ⏰ {summary.receivable_overdue} vencida(s)
                </div>
              )}
            </div>
            <div style={KPI_CARD}>
              <div style={KPI_LABEL}>Ticket promedio</div>
              <div style={KPI_VALUE}>
                {formatMoney(summary.avg_ticket, summary.invoiced_currency)}
              </div>
              <div style={KPI_HINT}>Por factura emitida</div>
            </div>
            <div style={KPI_CARD}>
              <div style={KPI_LABEL}>CFDIs emitidas</div>
              <div style={KPI_VALUE}>{summary.count_cfdis}</div>
              <div style={KPI_HINT}>Total histórico</div>
            </div>
          </div>
        </>
      )}

      {/* ─── KPIs Financieros (proveedor) ─── */}
      {summary && isSupplier && (
        <>
          <div style={SECTION_HEADER}>
            <span>🛒 Finanzas como proveedor</span>
          </div>
          <div style={KPI_GRID}>
            <div style={KPI_CARD}>
              <div style={KPI_LABEL}>Compras YTD</div>
              <div style={KPI_VALUE}>
                {formatMoney(summary.total_purchases_ytd, summary.payable_currency)}
              </div>
              <div style={KPI_HINT}>Año en curso</div>
            </div>
            <div style={KPI_CARD}>
              <div style={KPI_LABEL}>Saldo a pagar</div>
              <div
                style={{
                  ...KPI_VALUE,
                  color:
                    (summary.payable_balance ?? 0) > 0
                      ? "var(--color-warning-text)"
                      : "var(--color-text-primary)",
                }}
              >
                {formatMoney(summary.payable_balance, summary.payable_currency)}
              </div>
              {summary.payable_overdue > 0 && (
                <div style={{ ...KPI_HINT, color: "var(--color-danger-text)", fontWeight: 600 }}>
                  ⏰ {summary.payable_overdue} vencida(s)
                </div>
              )}
            </div>
            <div style={KPI_CARD}>
              <div style={KPI_LABEL}>Órdenes compra</div>
              <div style={KPI_VALUE}>{summary.count_purchase_orders}</div>
              <div style={KPI_HINT}>Total histórico</div>
            </div>
            <div style={KPI_CARD}>
              <div style={KPI_LABEL}>Estado pago</div>
              <div style={{ ...KPI_VALUE, fontSize: "14px", marginTop: "2px" }}>
                {summary.payable_overdue > 0
                  ? "⚠️ Con vencidas"
                  : (summary.payable_balance ?? 0) > 0
                    ? "📅 Al corriente"
                    : "✅ Sin saldo"}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Conteos generales ─── */}
      {summary && (
        <>
          <div style={SECTION_HEADER}>
            <span>📈 Actividad operativa</span>
          </div>
          <div style={KPI_GRID}>
            {isCustomer && (
              <>
                <div style={KPI_CARD}>
                  <div style={KPI_LABEL}>Cotizaciones</div>
                  <div style={KPI_VALUE}>{summary.count_quotations}</div>
                </div>
                <div style={KPI_CARD}>
                  <div style={KPI_LABEL}>Pedidos</div>
                  <div style={KPI_VALUE}>{summary.count_orders}</div>
                </div>
                <div style={KPI_CARD}>
                  <div style={KPI_LABEL}>Embarques</div>
                  <div style={KPI_VALUE}>{summary.count_shipments}</div>
                </div>
              </>
            )}
            {!isCustomer && isSupplier && (
              <div style={KPI_CARD}>
                <div style={KPI_LABEL}>Órdenes de compra</div>
                <div style={KPI_VALUE}>{summary.count_purchase_orders}</div>
              </div>
            )}
            {isLogistics && (
              <div style={KPI_CARD}>
                <div style={KPI_LABEL}>Tipo</div>
                <div style={{ ...KPI_VALUE, fontSize: "14px", marginTop: "2px" }}>
                  🚚 Proveedor logístico
                </div>
                <div style={KPI_HINT}>
                  {partner.logistics_provider_type ?? "Sin clasificar"}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── Operaciones recientes (cliente) ─── */}
      {summary && isCustomer && (
        <>
          <RecentOpsTable
            title="Cotizaciones recientes"
            emoji="📝"
            ops={summary.recent_quotations}
            count={summary.count_quotations}
            emptyMessage="No hay cotizaciones registradas para este partner."
          />
          <RecentOpsTable
            title="Pedidos recientes"
            emoji="🛒"
            ops={summary.recent_orders}
            count={summary.count_orders}
            emptyMessage="No hay pedidos registrados para este partner."
          />
          <RecentOpsTable
            title="Embarques / Servicios"
            emoji="📦"
            ops={summary.recent_shipments}
            count={summary.count_shipments}
            emptyMessage="No hay embarques registrados para este partner."
          />
          <RecentOpsTable
            title="CFDIs emitidas"
            emoji="🧾"
            ops={summary.recent_cfdis}
            count={summary.count_cfdis}
            emptyMessage="No hay CFDIs emitidas a este partner."
          />
        </>
      )}

      {/* ─── Operaciones recientes (proveedor) ─── */}
      {summary && isSupplier && (
        <RecentOpsTable
          title="Órdenes de compra recientes"
          emoji="🛒"
          ops={summary.recent_purchase_orders}
          count={summary.count_purchase_orders}
          emptyMessage="No hay órdenes de compra registradas para este partner."
        />
      )}
    </div>
  );
}