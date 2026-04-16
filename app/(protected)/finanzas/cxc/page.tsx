"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import { useCxCController } from "./services/cxc.controller";
import type { AccountReceivable, ClientARSummary } from "./types/cxc.types";

import CxCDashboard       from "./components/CxCDashboard";
import CxCCartera         from "./components/CxCCartera";
import CxCPipelineKanban  from "./components/CxCPipelineKanban";
import CxCClienteView     from "./components/CxCClienteView";
import CxCPagoDrawer      from "./components/CxCPagoDrawer";
import CxCActividadDrawer from "./components/CxCActividadDrawer";

type Tab = "dashboard" | "cartera" | "pipeline" | "clientes";

export default function CxCPage() {
  const { lang } = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [userId, setUserId] = useState("");
  const [tab,    setTab]    = useState<Tab>("dashboard");
  const [pagoAR, setPagoAR] = useState<AccountReceivable | null>(null);
  const [actAR,  setActAR]  = useState<AccountReceivable | null>(null);
  const [pagoOpen,          setPagoOpen]          = useState(false);
  const [actOpen,           setActOpen]            = useState(false);
  const [preselectedClient, setPreselectedClient]  = useState<any | null>(null);
  const [syncMsg,  setSyncMsg]  = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  const ctrl = useCxCController(companyId ?? "", userId);

  useEffect(() => { if (companyId) ctrl.load(); }, [companyId]);

  function openPayment(ar: AccountReceivable) {
    setPagoAR(ar);
    setPagoOpen(true);
  }

  function openActivity(ar?: AccountReceivable) {
    setActAR(ar ?? null);
    setActOpen(true);
  }

  async function handleSync() {
    const n = await ctrl.handleSync();
    if (n > 0) setSyncMsg(es ? `${n} factura(s) PPD sincronizadas a CxC.` : `${n} PPD invoice(s) synced to AR.`);
    else setSyncMsg(es ? "Todo está sincronizado." : "Everything is in sync.");
    setTimeout(() => setSyncMsg(null), 4000);
  }

  const TABS: { key: Tab; labelEs: string; labelEn: string; icon: React.ReactNode }[] = [
    {
      key: "dashboard", labelEs: "Dashboard",    labelEn: "Dashboard",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    },
    {
      key: "cartera",   labelEs: "Cartera",      labelEn: "Portfolio",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    },
    {
      key: "pipeline",  labelEs: "Pipeline",     labelEn: "Pipeline",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="3" width="4" height="12" rx="1"/><rect x="17" y="3" width="4" height="8" rx="1"/></svg>,
    },
    {
      key: "clientes",  labelEs: "Por cliente",  labelEn: "By client",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    },
  ];

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
            {es ? "Cuentas por Cobrar" : "Accounts Receivable"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {es ? "Gestión integral de cobranza, seguimiento y control de cartera." : "Comprehensive collection management, tracking and portfolio control."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {syncMsg && (
            <div style={{ padding: "6px 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", fontSize: "12px", color: "var(--color-success-text)", fontWeight: 600 }}>
              {syncMsg}
            </div>
          )}
          <button onClick={() => { openActivity(); setActOpen(true); }}
            style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            {es ? "+ Actividad" : "+ Activity"}
          </button>
          <button onClick={() => setPagoOpen(true)}
            style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
            {es ? "+ Registrar pago" : "+ Register payment"}
          </button>
        </div>
      </div>

      {ctrl.error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
          {ctrl.error}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--color-border-faint)" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md) var(--radius-md) 0 0", background: tab === t.key ? "var(--color-bg-base)" : "transparent", border: tab === t.key ? "1px solid var(--color-border-faint)" : "none", borderBottom: tab === t.key ? "1px solid var(--color-bg-base)" : "none", color: tab === t.key ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: tab === t.key ? 700 : 400, cursor: "pointer", marginBottom: tab === t.key ? "-1px" : "0", display: "flex", alignItems: "center", gap: "6px" }}>
            {t.icon}
            {es ? t.labelEs : t.labelEn}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      {tab === "dashboard" && (
        <CxCDashboard
          stats={ctrl.stats}
          clients={ctrl.clientSummaries}
          loading={ctrl.loading}
          onClientSelect={(c) => { setPreselectedClient(c); setTab("clientes"); }}
          onNewPayment={() => setPagoOpen(true)}
          onSync={handleSync}
          syncing={ctrl.syncing}
        />
      )}

      {tab === "cartera" && (
        <CxCCartera
          items={ctrl.items}
          loading={ctrl.loading}
          filters={ctrl.filters}
          onFilter={ctrl.handleFilter}
          onSelect={(ar) => { openPayment(ar); }}
          onUpdateCollectionStatus={ctrl.handleUpdateCollectionStatus}
        />
      )}

      {tab === "pipeline" && (
        <CxCPipelineKanban
          items={ctrl.items}
          onSelect={(ar) => { openActivity(ar); }}
          onUpdateCollectionStatus={ctrl.handleUpdateCollectionStatus}
        />
      )}

      {tab === "clientes" && (
        <CxCClienteView
          clients={ctrl.clientSummaries}
          preselectedClient={preselectedClient}
          onPay={openPayment}
          onActivity={openActivity}
        />
      )}
      
      {/* DRAWERS */}
      <CxCPagoDrawer
        open={pagoOpen}
        ar={pagoAR}
        saving={ctrl.saving}
        onClose={() => { setPagoOpen(false); setPagoAR(null); }}
        onCreate={ctrl.handleRegisterPayment}
      />

      <CxCActividadDrawer
        open={actOpen}
        ar={actAR}
        saving={ctrl.saving}
        onClose={() => { setActOpen(false); setActAR(null); }}
        onCreate={ctrl.handleCreateActivity}
      />
    </div>
  );
}
