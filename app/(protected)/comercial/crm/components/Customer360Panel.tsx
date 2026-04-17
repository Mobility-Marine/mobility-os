"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CrmAccount } from "../types/crm.types";

type Props = { account: CrmAccount | null };

type Invoice   = { id: string; serie?: string; folio?: string; total: number; currency: string; status: string; cfdi_date: string };
type Shipment  = { id: string; reference: string; service_type: string; status: string; total: number; currency: string };
type Quotation = { id: string; quote_number: string; type: string; status: string; total: number; currency: string };

export default function Customer360Panel({ account }: Props) {
  const { companyId }   = useTenant();
  const { t, lang }     = useTranslation();
  const locale          = lang === "en" ? "en-US" : "es-MX";
  const [tab, setTab]   = useState<"invoices" | "shipments" | "quotations">("invoices");
  const [loading, setLoading]       = useState(false);
  const [invoices,    setInvoices]    = useState<Invoice[]>([]);
  const [shipments,   setShipments]   = useState<Shipment[]>([]);
  const [quotations,  setQuotations]  = useState<Quotation[]>([]);
  const [totalRevenue,  setTotalRevenue]  = useState(0);
  const [openBalance,   setOpenBalance]   = useState(0);
  const [totalShipments,setTotalShipments]= useState(0);
  const [totalQuotes,   setTotalQuotes]   = useState(0);

  useEffect(() => {
    if (!account || !companyId) {
      setInvoices([]); setShipments([]); setQuotations([]);
      setTotalRevenue(0); setOpenBalance(0);
      return;
    }
    const clientId = account.client_id;
    if (!clientId) return;
    setLoading(true);
    Promise.all([
      supabase.from("cfdi_documents")
        .select("id, serie, folio, total, currency, status, cfdi_date")
        .eq("company_id", companyId)
        .eq("related_client_id", clientId)
        .eq("type", "I")
        .order("cfdi_date", { ascending: false })
        .limit(10),
      supabase.from("accounts_receivable")
        .select("balance")
        .eq("company_id", companyId)
        .eq("client_id", clientId)
        .in("status", ["pending", "partial"]),
      supabase.from("shipments")
        .select("id, reference, service_type, status, total, currency")
        .eq("company_id", companyId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("quotations")
        .select("id, quote_number, type, status, total, currency")
        .eq("company_id", companyId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]).then(([inv, cxc, shi, quot]) => {
      const invData  = (inv.data  ?? []) as Invoice[];
      const shiData  = (shi.data  ?? []) as Shipment[];
      const quotData = (quot.data ?? []) as Quotation[];
      setInvoices(invData);
      setShipments(shiData);
      setQuotations(quotData);
      setTotalRevenue(invData.filter(i => i.status === "valid").reduce((s, i) => s + parseFloat(String(i.total)), 0));
      setOpenBalance((cxc.data ?? []).reduce((s, r: any) => s + parseFloat(r.balance), 0));
      setTotalShipments(shiData.length);
      setTotalQuotes(quotData.length);
    }).finally(() => setLoading(false));
  }, [account?.id, companyId]);

  const STATUS_COLOR: Record<string, string> = {
    valid:     "var(--color-success-text)",
    cancelled: "var(--color-danger-text)",
    draft:     "var(--color-text-muted)",
    sent:      "var(--color-brand-blue)",
    accepted:  "var(--color-success-text)",
    rejected:  "var(--color-danger-text)",
    delivered: "var(--color-success-text)",
    invoiced:  "#a78bfa",
    pending:   "var(--color-warning-text)",
  };

  const fmt = (n: number) => n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "18px",
      display: "flex", flexDirection: "column", gap: "14px",
      height: "100%", minHeight: 0,
    }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-blue)" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            Customer 360{account ? ` — ${account.name}` : ""}
          </span>
        </div>
        {!account && (
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            Selecciona una cuenta para ver el historial completo
          </span>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", flexShrink: 0 }}>
        {[
          { label: "Ingresos totales",  value: account ? `$${fmt(totalRevenue)}`        : "—", color: "var(--color-success-text)" },
          { label: "Saldo pendiente",   value: account ? `$${fmt(openBalance)}`          : "—", color: openBalance > 0 ? "var(--color-warning-text)" : "var(--color-success-text)" },
          { label: "Embarques",         value: account ? String(totalShipments)           : "—", color: "var(--color-info-text)"    },
          { label: "Cotizaciones",      value: account ? String(totalQuotes)              : "—", color: "var(--color-brand-blue)"   },
        ].map((s) => (
          <div key={s.label} style={{
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
            borderRadius: "var(--radius-md)", padding: "12px",
          }}>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>{s.label}</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        {[
          { key: "invoices",   label: "Facturas",     count: invoices.length    },
          { key: "shipments",  label: "Embarques",    count: shipments.length   },
          { key: "quotations", label: "Cotizaciones", count: quotations.length  },
        ].map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key as any)} style={{
            height: "34px", padding: "0 14px", border: "none", background: "transparent",
            borderBottom: tab === tb.key ? "2px solid var(--color-brand-blue)" : "2px solid transparent",
            color: tab === tb.key ? "var(--color-brand-blue)" : "var(--color-text-muted)",
            fontSize: "12px", fontWeight: tab === tb.key ? 700 : 400,
            cursor: "pointer", display: "flex", alignItems: "center", gap: "5px",
          }}>
            {tb.label}
            {tb.count > 0 && (
              <span style={{ fontSize: "10px", padding: "1px 5px", borderRadius: "var(--radius-full)", background: "var(--color-brand-blue)20", color: "var(--color-brand-blue)", fontWeight: 700 }}>
                {tb.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {!account ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
            Sin cuenta seleccionada
          </div>
        ) : loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>Cargando…</div>
        ) : (
          <div style={{ display: "grid", gap: "6px" }}>
            {/* FACTURAS */}
            {tab === "invoices" && (invoices.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>Sin facturas emitidas</div>
            ) : invoices.map((inv) => (
              <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                    {inv.serie ?? ""}{inv.folio ?? "—"}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                    {new Date(inv.cfdi_date).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                    {inv.currency} ${fmt(parseFloat(String(inv.total)))}
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: STATUS_COLOR[inv.status] ?? "var(--color-text-muted)", textTransform: "capitalize" }}>
                    {inv.status}
                  </div>
                </div>
              </div>
            )))}

            {/* EMBARQUES */}
            {tab === "shipments" && (shipments.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>Sin embarques registrados</div>
            ) : shipments.map((sh) => (
              <div key={sh.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "monospace" }}>{sh.reference}</div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                    {sh.service_type.replace(/_/g, " ")}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-info-text)", fontVariantNumeric: "tabular-nums" }}>
                    {sh.currency} ${fmt(parseFloat(String(sh.total)))}
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: STATUS_COLOR[sh.status] ?? "var(--color-text-muted)", textTransform: "capitalize" }}>
                    {sh.status}
                  </div>
                </div>
              </div>
            )))}

            {/* COTIZACIONES */}
            {tab === "quotations" && (quotations.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>Sin cotizaciones</div>
            ) : quotations.map((q) => (
              <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "monospace" }}>{q.quote_number}</div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                    {q.type}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>
                    {q.currency} ${fmt(parseFloat(String(q.total)))}
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: STATUS_COLOR[q.status] ?? "var(--color-text-muted)", textTransform: "capitalize" }}>
                    {q.status}
                  </div>
                </div>
              </div>
            )))}
          </div>
        )}
      </div>
    </div>
  );
}
