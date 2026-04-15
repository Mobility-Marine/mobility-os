"use client";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import type { AccountReceivable, ARActivity, ClientARSummary } from "../types/cxc.types";
import { AR_STATUS_CONFIG, AR_AGING_CONFIG, AR_ACTIVITY_CONFIG } from "../types/cxc.types";
import { fetchAR, fetchClientActivities } from "../services/cxc.service";

type Props = {
  clients:   ClientARSummary[];
  onPay:     (ar: AccountReceivable) => void;
  onActivity:(ar?: AccountReceivable) => void;
};

type ClientTab = "overview" | "invoices" | "payments" | "activities";

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function CxCClienteView({ clients, onPay, onActivity }: Props) {
  const { lang } = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [selectedClient, setSelectedClient] = useState<ClientARSummary | null>(null);
  const [clientAR,       setClientAR]        = useState<AccountReceivable[]>([]);
  const [activities,     setActivities]      = useState<ARActivity[]>([]);
  const [clientTab,      setClientTab]       = useState<ClientTab>("overview");
  const [loadingClient,  setLoadingClient]   = useState(false);
  const [search,         setSearch]          = useState("");

  const loadClient = useCallback(async (c: ClientARSummary) => {
    if (!companyId) return;
    setLoadingClient(true);
    setClientTab("overview");
    try {
      const [ar, acts] = await Promise.all([
        fetchAR(companyId, { search: c.client_name, status: "all", aging: "all", collection: "all", currency: "", from: "", to: "" }),
        fetchClientActivities(companyId, c.client_id ?? undefined),
      ]);
      setClientAR(ar.filter(r => r.client_rfc === c.client_rfc || r.client_name === c.client_name));
      setActivities(acts);
    } finally { setLoadingClient(false); }
  }, [companyId]);

  useEffect(() => {
    if (selectedClient) loadClient(selectedClient);
  }, [selectedClient]);

  const filtered = clients.filter(c =>
    c.client_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.client_rfc ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const RISK_COLORS = {
    LOW:      { color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
    MEDIUM:   { color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
    HIGH:     { color: "#f97316",                   bg: "#fff7ed"                 },
    CRITICAL: { color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)"  },
  };

  const totalPaid    = clientAR.reduce((s, ar) => s + ar.paid_amount, 0);
  const totalBalance = clientAR.reduce((s, ar) => s + ar.balance, 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "16px", height: "calc(100vh - 220px)" }}>

      {/* ── Lista de clientes ── */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--color-border-faint)" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={es ? "Buscar cliente…" : "Search client…"}
            style={{ width: "100%", height: "34px", padding: "0 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.map((c, i) => {
            const rc = RISK_COLORS[c.risk];
            const isActive = selectedClient?.client_name === c.client_name && selectedClient?.client_rfc === c.client_rfc;
            return (
              <div key={`${c.client_name}-${i}`} onClick={() => setSelectedClient(c)}
                style={{ padding: "11px 14px", borderBottom: "1px solid var(--color-border-faint)", cursor: "pointer", background: isActive ? "var(--color-info-bg)" : "transparent", borderLeft: isActive ? "3px solid var(--color-brand-blue)" : "3px solid transparent", transition: "all 0.1s" }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.client_name}
                  </div>
                  <span style={{ fontSize: "8px", fontWeight: 700, padding: "2px 5px", borderRadius: "var(--radius-full)", background: rc.bg, color: rc.color, flexShrink: 0, marginLeft: "4px" }}>
                    {c.risk}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{c.client_rfc || "—"}</div>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-warning-text)", fontVariantNumeric: "tabular-nums" }}>
                    ${Number(c.balance).toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                  </div>
                </div>
                {c.overdue > 0 && (
                  <div style={{ fontSize: "9px", color: "var(--color-danger-text)", fontWeight: 600, marginTop: "2px" }}>
                    {es ? "Vencido:" : "Overdue:"} ${Number(c.overdue).toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: "30px", textAlign: "center", fontSize: "12px", color: "var(--color-text-muted)" }}>
              {es ? "Sin clientes con saldo" : "No clients with balance"}
            </div>
          )}
        </div>
      </div>

      {/* ── Workspace del cliente ── */}
      {!selectedClient ? (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-muted)" }}>
            {es ? "Selecciona un cliente para ver su estado de cuenta" : "Select a client to view their account statement"}
          </div>
        </div>
      ) : (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>

          {/* Client Header */}
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>{selectedClient.client_name}</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", fontFamily: "monospace", marginTop: "2px" }}>{selectedClient.client_rfc || "Sin RFC"}</div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => onActivity(undefined)}
                  style={{ height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                  {es ? "+ Actividad" : "+ Activity"}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginTop: "14px" }}>
              {[
                { l: es ? "Total facturado" : "Total invoiced", v: `$${fmt(selectedClient.total)}`,   color: "var(--color-text-primary)" },
                { l: es ? "Saldo pendiente" : "Outstanding",    v: `$${fmt(totalBalance)}`,            color: "var(--color-warning-text)" },
                { l: es ? "Total cobrado"   : "Collected",      v: `$${fmt(totalPaid)}`,               color: "var(--color-success-text)" },
                { l: es ? "Documentos"      : "Documents",      v: String(clientAR.length),            color: "var(--color-text-second)"  },
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
            {(["overview","invoices","payments","activities"] as ClientTab[]).map(t => (
              <button key={t} onClick={() => setClientTab(t)}
                style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md) var(--radius-md) 0 0", background: clientTab === t ? "var(--color-bg-base)" : "transparent", border: clientTab === t ? "1px solid var(--color-border-faint)" : "none", borderBottom: clientTab === t ? "1px solid var(--color-bg-base)" : "none", color: clientTab === t ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: clientTab === t ? 700 : 400, cursor: "pointer", marginBottom: clientTab === t ? "-1px" : "0" }}>
                {t === "overview"    ? (es ? "Resumen"      : "Overview")    :
                 t === "invoices"    ? (es ? "Facturas"     : "Invoices")    :
                 t === "payments"    ? (es ? "Pagos"        : "Payments")    :
                                       (es ? "Actividades"  : "Activities")  }
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {loadingClient ? (
              <div style={{ textAlign: "center", padding: "30px", color: "var(--color-text-muted)", fontSize: "13px" }}>
                {es ? "Cargando…" : "Loading…"}
              </div>
            ) : clientTab === "invoices" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {clientAR.map(ar => {
                  const sc = AR_STATUS_CONFIG[ar.status];
                  const ac = AR_AGING_CONFIG[ar.aging_bucket ?? "0-30"];
                  return (
                    <div key={ar.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
                      <div style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700, color: "var(--color-brand-blue)", width: "90px" }}>{ar.document_number || "—"}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                          {new Date(ar.document_date).toLocaleDateString(es ? "es-MX" : "en-US")}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-warning-text)", fontVariantNumeric: "tabular-nums" }}>${fmt(ar.balance)}</div>
                        <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{es ? "saldo" : "balance"}</div>
                      </div>
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: ac.bg, color: ac.color }}>
                        {ar.days_overdue}d
                      </span>
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: sc.bg, color: sc.color }}>
                        {es ? sc.labelEs : sc.labelEn}
                      </span>
                      {ar.balance > 0 && (
                        <button onClick={() => onPay(ar)}
                          style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>
                          {es ? "Pagar" : "Pay"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : clientTab === "activities" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {activities.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px", color: "var(--color-text-muted)", fontSize: "13px" }}>
                    {es ? "Sin actividades registradas" : "No activities logged"}
                  </div>
                ) : activities.map(act => {
                  const ac = AR_ACTIVITY_CONFIG[act.type] ?? AR_ACTIVITY_CONFIG.note;
                  return (
                    <div key={act.id} style={{ display: "flex", gap: "12px", padding: "10px 14px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ac.color} strokeWidth="2">
                          <path d={ac.icon} />
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{act.title}</div>
                        {act.description && <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>{act.description}</div>}
                        {act.outcome && <div style={{ fontSize: "10px", color: "var(--color-text-second)", marginTop: "3px", fontStyle: "italic" }}>{es ? "Resultado:" : "Outcome:"} {act.outcome}</div>}
                        {act.next_action_date && (
                          <div style={{ fontSize: "10px", color: "var(--color-warning-text)", marginTop: "3px", fontWeight: 600 }}>
                            {es ? "Próxima acción:" : "Next action:"} {new Date(act.next_action_date).toLocaleDateString(es ? "es-MX" : "en-US")} — {act.next_action}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textAlign: "right", flexShrink: 0 }}>
                        {new Date(act.created_at).toLocaleDateString(es ? "es-MX" : "en-US", { month: "short", day: "2-digit" })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : clientTab === "overview" ? (
              <div style={{ display: "grid", gap: "16px" }}>
                {/* Payment progress */}
                <div style={{ padding: "16px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "10px" }}>
                    {es ? "Progreso de cobro" : "Collection progress"}
                  </div>
                  <div style={{ height: "12px", borderRadius: "6px", background: "var(--color-border-faint)", overflow: "hidden", marginBottom: "6px" }}>
                    <div style={{ height: "100%", width: `${selectedClient.total > 0 ? (totalPaid / selectedClient.total) * 100 : 0}%`, background: "var(--color-success-text)", borderRadius: "6px", transition: "width 0.5s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                    <span style={{ color: "var(--color-success-text)", fontWeight: 600 }}>
                      ${fmt(totalPaid)} {es ? "cobrado" : "collected"}
                    </span>
                    <span style={{ color: "var(--color-warning-text)", fontWeight: 600 }}>
                      ${fmt(totalBalance)} {es ? "pendiente" : "pending"}
                    </span>
                  </div>
                </div>
                {/* Aging detail */}
                <div style={{ padding: "16px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "10px" }}>
                    {es ? "Distribución por antigüedad" : "Aging distribution"}
                  </div>
                  {(["0-30","31-60","61-90","+90"] as const).map(bucket => {
                    const bucketAR = clientAR.filter(ar => ar.aging_bucket === bucket);
                    const bucketAmt = bucketAR.reduce((s, ar) => s + ar.balance, 0);
                    if (bucketAmt === 0) return null;
                    const cfg = AR_AGING_CONFIG[bucket];
                    return (
                      <div key={bucket} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--color-border-faint)" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: cfg.color }}>
                          {es ? cfg.labelEs : cfg.labelEn}
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: cfg.color, fontVariantNumeric: "tabular-nums" }}>
                          ${fmt(bucketAmt)} ({bucketAR.length})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px", color: "var(--color-text-muted)", fontSize: "13px" }}>
                {es ? "Sin pagos registrados" : "No payments registered"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
