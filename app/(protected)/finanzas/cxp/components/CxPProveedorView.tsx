"use client";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import type { AccountPayable, SupplierAPSummary } from "../types/cxp.types";
import { AP_STATUS_CONFIG, AP_AGING_CONFIG, AP_SUPPLIER_TYPE_CONFIG } from "../types/cxp.types";
import { fetchAP } from "../services/cxp.service";
import { generateEstadoCuentaProveedorPDF } from "../services/cxp.pdf";

type Props = {
  suppliers:          SupplierAPSummary[];
  preselected?:       SupplierAPSummary | null;
  onPay:              (ap: AccountPayable) => void;
  onNew:              () => void;
};

type SupTab = "overview" | "invoices" | "payments";
const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function CxPProveedorView({ suppliers, preselected, onPay, onNew }: Props) {
  const { lang, t }   = useTranslation();
  const { companyId } = useTenant();
  const es  = lang !== "en";
  const cxp = (t as any).cxp ?? {};

  const [selected,       setSelected]       = useState<SupplierAPSummary | null>(null);
  const [supplierAP,     setSupplierAP]     = useState<AccountPayable[]>([]);
  const [payments,       setPayments]       = useState<any[]>([]);
  const [supTab,         setSupTab]         = useState<SupTab>("overview");
  const [loading,        setLoading]        = useState(false);
  const [generatingPDF,  setGeneratingPDF]  = useState(false);
  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState<"all" | "logistics" | "procurement" | "operating">("all");

  const loadSupplier = useCallback(async (s: SupplierAPSummary) => {
    if (!companyId) return;
    setLoading(true); setSupTab("overview");
    try {
      const [ap, pmts] = await Promise.all([
        fetchAP(companyId, { search: s.supplier_name, status: "all", supplier_type: "all", aging: "all", from: "", to: "" }),
        supabase.from("ap_payments").select("*").eq("company_id", companyId)
          .order("payment_date", { ascending: false })
          .then(({ data }) => data ?? []),
      ]);
      const filtered = ap.filter(r =>
        r.supplier_rfc === s.supplier_rfc || r.supplier_name === s.supplier_name
      );
      setSupplierAP(filtered);
      const apIds = new Set(filtered.map(r => r.id));
      setPayments((pmts as any[]).filter(p => apIds.has(p.ap_id)));
    } finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { if (selected) loadSupplier(selected); }, [selected]);

  useEffect(() => {
    if (preselected && suppliers.length > 0) setSelected(preselected);
  }, [preselected, suppliers]);

  async function handleDownloadPDF() {
    if (!selected || supplierAP.length === 0) return;
    setGeneratingPDF(true);
    try {
      const { fetchCompanySettings } = await import("../../../comercial/cotizaciones/services/quotations.service");
      const settings = companyId ? await fetchCompanySettings(companyId) : null;
      await generateEstadoCuentaProveedorPDF(
        { name: selected.supplier_name, rfc: selected.supplier_rfc, type: selected.supplier_type },
        supplierAP.filter(ap => ap.balance > 0),
        payments,
        settings,
      );
    } finally { setGeneratingPDF(false); }
  }

  const filtered = suppliers.filter(s =>
    (typeFilter === "all" || s.supplier_type === typeFilter) &&
    (s.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
     (s.supplier_rfc ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const RISK_COLORS = {
    LOW:      { color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
    MEDIUM:   { color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
    HIGH:     { color: "#f97316",                  bg: "rgba(249,115,22,0.1)"    },
    CRITICAL: { color: "var(--color-danger-text)", bg: "var(--color-danger-bg)"  },
  };

  const totalPagado  = supplierAP.reduce((s, ap) => s + ap.paid_amount, 0);
  const totalPendiente = supplierAP.reduce((s, ap) => s + ap.balance, 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "16px", height: "calc(100vh - 220px)" }}>

      {/* Lista proveedores */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", flexDirection: "column", gap: "6px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={es ? "Buscar proveedor…" : "Search supplier…"}
            style={{ width: "100%", height: "32px", padding: "0 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: "4px" }}>
            {([["all","Todos"],["logistics","🚛"],["procurement","📦"],["operating","🏢"]] as const).map(([val, label]) => (
              <button key={val} onClick={() => setTypeFilter(val)}
                style={{ flex: 1, height: "24px", borderRadius: "var(--radius-sm)", border: `1px solid ${typeFilter === val ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`, background: typeFilter === val ? "var(--color-info-bg)" : "var(--color-bg-subtle)", color: typeFilter === val ? "var(--color-brand-blue)" : "var(--color-text-muted)", fontSize: "10px", fontWeight: typeFilter === val ? 700 : 400, cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textAlign: "right" }}>
            {filtered.length} {es ? "proveedores" : "suppliers"}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.map((s, i) => {
            const rc  = RISK_COLORS[s.risk];
            const tc  = AP_SUPPLIER_TYPE_CONFIG[s.supplier_type];
            const isActive = selected?.supplier_name === s.supplier_name && selected?.supplier_rfc === s.supplier_rfc;
            return (
              <div key={`${s.supplier_name}-${i}`} onClick={() => setSelected(s)}
                style={{ padding: "11px 14px", borderBottom: "1px solid var(--color-border-faint)", cursor: "pointer", background: isActive ? "var(--color-info-bg)" : "transparent", borderLeft: isActive ? "3px solid var(--color-brand-blue)" : "3px solid transparent", transition: "all 0.1s" }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tc.icon} {s.supplier_name}
                  </div>
                  <span style={{ fontSize: "8px", fontWeight: 700, padding: "2px 5px", borderRadius: "var(--radius-full)", background: rc.bg, color: rc.color, flexShrink: 0, marginLeft: "4px" }}>
                    {s.risk}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{s.supplier_rfc || "—"}</div>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
                    ${Number(s.balance).toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                  </div>
                </div>
                {s.overdue > 0 && (
                  <div style={{ fontSize: "9px", color: "var(--color-danger-text)", fontWeight: 600, marginTop: "2px" }}>
                    {es ? "Vencido:" : "Overdue:"} ${Number(s.overdue).toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: "30px", textAlign: "center", fontSize: "12px", color: "var(--color-text-muted)" }}>
              {cxp.noSuppliers ?? "Sin proveedores con saldo"}
            </div>
          )}
        </div>
      </div>

      {/* Workspace del proveedor */}
      {!selected ? (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="1.5"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-muted)" }}>
            {es ? "Selecciona un proveedor para ver su estado de cuenta" : "Select a supplier to view their account statement"}
          </div>
        </div>
      ) : (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>

          {/* Header */}
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>{AP_SUPPLIER_TYPE_CONFIG[selected.supplier_type].icon}</span>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>{selected.supplier_name}</div>
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: `${AP_SUPPLIER_TYPE_CONFIG[selected.supplier_type].color}20`, color: AP_SUPPLIER_TYPE_CONFIG[selected.supplier_type].color }}>
                    {AP_SUPPLIER_TYPE_CONFIG[selected.supplier_type].labelEs}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", fontFamily: "monospace", marginTop: "2px" }}>
                  {selected.supplier_rfc || "Sin RFC"}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleDownloadPDF} disabled={generatingPDF || supplierAP.filter(ap => ap.balance > 0).length === 0}
                  style={{ height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", border: "none", color: "#fff", fontSize: "11px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: supplierAP.filter(ap => ap.balance > 0).length === 0 ? 0.5 : 1 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  {generatingPDF ? "Generando…" : (es ? "Estado de cuenta" : "Statement")}
                </button>
                <button onClick={onNew}
                  style={{ height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                  + {es ? "Nueva factura" : "New invoice"}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginTop: "14px" }}>
              {[
                { l: es ? "Total facturado" : "Total invoiced",  v: `$${fmt(selected.total)}`,     color: "var(--color-text-primary)" },
                { l: es ? "Saldo pendiente" : "Outstanding",     v: `$${fmt(totalPendiente)}`,     color: "var(--color-danger-text)"  },
                { l: es ? "Total pagado"    : "Total paid",      v: `$${fmt(totalPagado)}`,        color: "var(--color-success-text)" },
                { l: es ? "Documentos"      : "Documents",       v: String(supplierAP.length),     color: "var(--color-text-second)"  },
              ].map(s => (
                <div key={s.l} style={{ padding: "8px 10px", background: "var(--color-bg-base)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
                  <div style={{ fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{s.l}</div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "2px", padding: "10px 16px 0", borderBottom: "1px solid var(--color-border-faint)" }}>
            {(["overview","invoices","payments"] as SupTab[]).map(tb => (
              <button key={tb} onClick={() => setSupTab(tb)}
                style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md) var(--radius-md) 0 0", background: supTab === tb ? "var(--color-bg-base)" : "transparent", border: supTab === tb ? "1px solid var(--color-border-faint)" : "none", borderBottom: supTab === tb ? "1px solid var(--color-bg-base)" : "none", color: supTab === tb ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: supTab === tb ? 700 : 400, cursor: "pointer", marginBottom: supTab === tb ? "-1px" : "0" }}>
                {tb === "overview"  ? (es ? "Resumen"   : "Overview") :
                 tb === "invoices"  ? (es ? "Facturas"  : "Invoices") :
                                      (es ? "Pagos"     : "Payments")}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "30px", color: "var(--color-text-muted)", fontSize: "13px" }}>
                {es ? "Cargando…" : "Loading…"}
              </div>
            ) : supTab === "overview" ? (
              <div style={{ display: "grid", gap: "16px" }}>
                {/* Progreso de pago */}
                <div style={{ padding: "16px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "10px" }}>
                    {cxp.collectionProgress ?? "Progreso de pago"}
                  </div>
                  <div style={{ height: "12px", borderRadius: "6px", background: "var(--color-border-faint)", overflow: "hidden", marginBottom: "6px" }}>
                    <div style={{ height: "100%", width: `${selected.total > 0 ? (totalPagado / selected.total) * 100 : 0}%`, background: "var(--color-success-text)", borderRadius: "6px", transition: "width 0.5s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                    <span style={{ color: "var(--color-success-text)", fontWeight: 600 }}>${fmt(totalPagado)} {es ? "pagado" : "paid"}</span>
                    <span style={{ color: "var(--color-danger-text)", fontWeight: 600 }}>${fmt(totalPendiente)} {es ? "pendiente" : "pending"}</span>
                  </div>
                </div>
                {/* Aging */}
                <div style={{ padding: "16px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "10px" }}>
                    {cxp.aging ?? "Distribución por antigüedad"}
                  </div>
                  {(["0-30","31-60","61-90","+90"] as const).map(bucket => {
                    const bucketAP  = supplierAP.filter(ap => ap.aging_bucket === bucket);
                    const bucketAmt = bucketAP.reduce((s, ap) => s + ap.balance, 0);
                    if (bucketAmt === 0) return null;
                    const cfg = AP_AGING_CONFIG[bucket];
                    return (
                      <div key={bucket} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--color-border-faint)" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: cfg.color }}>{cfg.labelEs}</span>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: cfg.color, fontVariantNumeric: "tabular-nums" }}>
                          ${fmt(bucketAmt)} ({bucketAP.length})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : supTab === "invoices" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {supplierAP.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px", color: "var(--color-text-muted)", fontSize: "13px" }}>
                    {es ? "Sin facturas registradas" : "No invoices registered"}
                  </div>
                ) : supplierAP.map(ap => {
                  const sc = AP_STATUS_CONFIG[ap.status];
                  const ac = AP_AGING_CONFIG[ap.aging_bucket ?? "0-30"];
                  return (
                    <div key={ap.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
                      <div style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700, color: "var(--color-brand-blue)", width: "100px" }}>
                        {ap.document_number || "—"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                          {new Date(ap.document_date).toLocaleDateString(es ? "es-MX" : "en-US")}
                          {ap.po ? ` · OC: ${ap.po.po_number}` : ""}
                          {ap.shipment ? ` · ${ap.shipment.reference}` : ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>${fmt(ap.balance)}</div>
                        <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{es ? "saldo" : "balance"}</div>
                      </div>
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: ac.bg, color: ac.color }}>
                        {ap.days_due}d
                      </span>
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: sc.bg, color: sc.color }}>
                        {sc.labelEs}
                      </span>
                      {ap.balance > 0 && (
                        <button onClick={() => onPay(ap)}
                          style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>
                          {es ? "Pagar" : "Pay"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {payments.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px", color: "var(--color-text-muted)", fontSize: "13px" }}>
                    {es ? "Sin pagos registrados" : "No payments registered"}
                  </div>
                ) : payments.map(pmt => (
                  <div key={pmt.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-text)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {es ? "Pago realizado" : "Payment made"}
                        {pmt.reference ? ` — ${pmt.reference}` : ""}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                        {new Date(pmt.payment_date).toLocaleDateString(es ? "es-MX" : "en-US")}
                        {pmt.payment_form ? ` · Forma: ${pmt.payment_form}` : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                      {pmt.currency} ${fmt(pmt.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
