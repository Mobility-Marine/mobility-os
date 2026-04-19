"use client";
import type { Quotation, QuotationStatus, QuotationType } from "../types/quotations.types";
import { STATUS_CONFIG } from "../types/quotations.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  quotations:     Quotation[];
  selected:       Quotation | null;
  setSelected:    (q: Quotation) => void;
  search:         string;
  setSearch:      (v: string) => void;
  onNew:          () => void;
  filterType:     QuotationType | "all";
  setFilterType:  (v: QuotationType | "all") => void;
  filterStatus:   QuotationStatus | "all";
  setFilterStatus:(v: QuotationStatus | "all") => void;
};

// Obtener totales por moneda desde billing_concepts o fallback a q.total
function getQuotationTotals(q: Quotation): Record<string, number> {
  const concepts = (q as any).billing_concepts ?? [];
  if (concepts.length > 0) {
    const totals: Record<string, number> = {};
    for (const concept of concepts) {
      for (const line of (concept.lines ?? [])) {
        const cur   = line.currency ?? concept.currency ?? q.currency ?? "MXN";
        const price = Number(line.price ?? 0);
        const rate  = line.tax_rate;
        const tax   = (rate === null || rate === undefined || rate === -1 || rate === 0) ? 0 : price * (rate / 100);
        totals[cur] = (totals[cur] ?? 0) + price + tax;
      }
    }
    return totals;
  }
  // Fallback: cotizaciones sin billing_concepts
  return { [q.currency ?? "MXN"]: q.total ?? 0 };
}

export default function QuotationsSidebar({
  quotations, selected, setSelected, search, setSearch,
  onNew, filterType, setFilterType, filterStatus, setFilterStatus,
}: Props) {
  const { t, lang } = useTranslation();
  const locale = lang === "en" ? "en-US" : "es-MX";

  const TYPE_FILTERS = [
    { value: "all",      label: (t.quot as any)?.filterAll      ?? "Todas"     },
    { value: "products", label: (t.quot as any)?.filterProducts ?? "Productos" },
    { value: "services", label: (t.quot as any)?.filterServices ?? "Servicios" },
  ];

  const STATUS_FILTERS: { value: QuotationStatus | "all"; label: string }[] = [
    { value: "all",      label: (t.quot as any)?.filterAll      ?? "Todas"    },
    { value: "draft",    label: (t.quot as any)?.statusDraft    ?? "Borrador" },
    { value: "sent",     label: (t.quot as any)?.statusSent     ?? "Enviada"  },
    { value: "accepted", label: (t.quot as any)?.statusAccepted ?? "Aceptada" },
    { value: "rejected", label: (t.quot as any)?.statusRejected ?? "Rechazada"},
    { value: "expired",  label: (t.quot as any)?.statusExpired  ?? "Expirada" },
  ];

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "14px",
      display: "flex", flexDirection: "column", gap: "10px",
      height: "100%", minHeight: 0, overflow: "hidden",
    }}>

      {/* HEADER */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
            {(t.quot as any)?.title ?? "Cotizaciones"}
          </span>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>
            {quotations.length}
          </span>
        </div>

        <button onClick={onNew} style={{
          width: "100%", height: "36px", borderRadius: "var(--radius-md)",
          background: "var(--color-brand-blue)", color: "#fff", border: "none",
          fontSize: "13px", fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          marginBottom: "10px",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {(t.quot as any)?.newQuotation ?? "Nueva cotización"}
        </button>

        {/* SEARCH */}
        <div style={{ position: "relative", marginBottom: "8px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            placeholder={(t.quot as any)?.search ?? "Buscar cotización…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", height: "32px", paddingLeft: "30px", paddingRight: "10px",
              borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
              background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
              fontSize: "12px", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* FILTRO TIPO */}
        <div style={{ display: "flex", gap: "3px", marginBottom: "5px" }}>
          {TYPE_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilterType(f.value as any)} style={{
              flex: 1, height: "24px", borderRadius: "var(--radius-sm)",
              background: filterType === f.value ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
              border: `1px solid ${filterType === f.value ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
              color: filterType === f.value ? "#fff" : "var(--color-text-muted)",
              fontSize: "10px", fontWeight: filterType === f.value ? 700 : 500,
              cursor: "pointer",
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* FILTRO STATUS */}
        <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilterStatus(f.value as any)} style={{
              height: "22px", padding: "0 7px", borderRadius: "var(--radius-full)",
              background: filterStatus === f.value ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
              border: `1px solid ${filterStatus === f.value ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
              color: filterStatus === f.value ? "#fff" : "var(--color-text-muted)",
              fontSize: "9px", fontWeight: filterStatus === f.value ? 700 : 500,
              cursor: "pointer",
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* LIST */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "grid", gap: "5px", alignContent: "start" }}>
        {quotations.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
            {(t.quot as any)?.noQuotations ?? "Sin cotizaciones"}
          </div>
        ) : quotations.map((q) => {
          const isSelected = selected?.id === q.id;
          const cfg        = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.draft;
          const statusLabel = (t.quot as any)?.[cfg.labelKey.replace("quot.", "")] ?? q.status;
          const clientName  = q.client?.name ?? q.client_name ?? "—";
          const isServices  = q.type === "services";
          const subtype     = (q as any).service_subtype as string | undefined;

          // Totales por moneda
          const totals  = getQuotationTotals(q);
          const entries = Object.entries(totals).filter(([, v]) => v > 0);

          return (
            <div
              key={q.id}
              onClick={() => setSelected(q)}
              style={{
                padding: "10px 12px", borderRadius: "var(--radius-md)",
                background: isSelected ? "var(--color-bg-active)" : "var(--color-bg-subtle)",
                border: isSelected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border-faint)",
                cursor: "pointer", display: "grid", gap: "4px",
                transition: "var(--transition-fast)",
              }}
            >
              {/* ROW 1 — número, cliente, status */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{
                  width: "22px", height: "22px", borderRadius: "var(--radius-sm)", flexShrink: 0,
                  background: isServices ? "var(--color-info-bg)" : "var(--color-success-bg)",
                  border: isServices ? "1px solid var(--color-info-border)" : "1px solid var(--color-success-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isServices ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-info-text)" strokeWidth="2">
                      <rect x="1" y="3" width="15" height="13"/>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                      <circle cx="5.5" cy="18.5" r="2.5"/>
                      <circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-text)" strokeWidth="2">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {q.quote_number}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {clientName}
                  </div>
                </div>
                <span style={{
                  fontSize: "9px", fontWeight: 700, padding: "2px 5px",
                  borderRadius: "var(--radius-full)", background: cfg.bg,
                  color: cfg.color, border: `1px solid ${cfg.border}`,
                  flexShrink: 0, textTransform: "uppercase",
                }}>
                  {statusLabel}
                </span>
              </div>

              {/* ROW 2 — subtipo badge si es servicio */}
              {isServices && subtype && (
                <div style={{ paddingLeft: "28px" }}>
                  <span style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-info-text)", background: "var(--color-info-bg)", padding: "1px 5px", borderRadius: "var(--radius-full)", border: "1px solid var(--color-info-border)" }}>
                    {subtype.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
              )}

              {/* ROW 3 — fecha + totales por moneda */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "10px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>
                  {new Date(q.created_at).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                  {q.valid_until && ` · ${new Date(q.valid_until).toLocaleDateString(locale, { day: "numeric", month: "short" })}`}
                </span>

                {/* Totales — una línea por moneda */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1px" }}>
                  {entries.length > 0 ? entries.map(([cur, val]) => (
                    <span key={cur} style={{ fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums", fontSize: "10px" }}>
                      {cur !== "MXN" && <span style={{ fontSize: "9px", opacity: 0.7, marginRight: "2px" }}>{cur}</span>}
                      ${val.toLocaleString(locale, { maximumFractionDigits: 0 })}
                    </span>
                  )) : (
                    <span style={{ color: "var(--color-text-muted)" }}>—</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
