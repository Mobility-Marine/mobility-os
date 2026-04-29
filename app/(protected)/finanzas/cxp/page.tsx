"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import { useCxPController } from "./services/cxp.controller";
import type { AccountPayable, SupplierAPSummary } from "./types/cxp.types";
import CxPDashboard  from "./components/CxPDashboard";
import CxPCartera    from "./components/CxPCartera";
import CxPPendientes from "./components/CxPPendientes";
import CxPPagoDrawer from "./components/CxPPagoDrawer";
import CxPNewDrawer  from "./components/CxPNewDrawer";
import CxPProveedorView from "./components/CxPProveedorView";

type Tab = "dashboard" | "cartera" | "proveedores" | "pendientes";

export default function CxPPage() {
  const { lang, t }   = useTranslation();
  const { companyId } = useTenant();
  const es  = lang !== "en";
  const cxp = (t as any).cxp ?? {};

  const [userId,      setUserId]      = useState("");
  const [tab,         setTab]         = useState<Tab>("dashboard");
  const [pagoAP,      setPagoAP]      = useState<AccountPayable | null>(null);
  const [pagoOpen,    setPagoOpen]    = useState(false);
  const [newOpen,     setNewOpen]     = useState(false);
  const [preloadShip, setPreloadShip] = useState<any | null>(null);
  const [preloadPO,   setPreloadPO]   = useState<any | null>(null);
  const [preselected, setPreselected] = useState<SupplierAPSummary | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  const ctrl = useCxPController(companyId ?? "", userId);

  useEffect(() => { if (companyId) ctrl.load(); }, [companyId]);

  function openPayment(ap: AccountPayable) { setPagoAP(ap); setPagoOpen(true); }

    async function handleAttach(ap: AccountPayable, file: File, type: "pdf" | "xml") {
    const ext  = type === "pdf" ? "pdf" : "xml";
    const path = `${companyId}/cxp/${ap.id}-${type}.${ext}`;
    const { error } = await supabase.storage
      .from("financial-documents")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) return;
    const { data } = supabase.storage.from("financial-documents").getPublicUrl(path);
    const url = data?.publicUrl;
    if (!url) return;
    await supabase.from("accounts_payable")
      .update({ [type === "pdf" ? "pdf_url" : "xml_url"]: url, updated_at: new Date().toISOString() })
      .eq("id", ap.id).eq("company_id", companyId!);
    ctrl.load();
  }

  function openFromShipment(sh: any) {
    setPreloadShip(sh); setPreloadPO(null); setNewOpen(true);
  }

  function openFromPO(po: any) {
    setPreloadPO(po); setPreloadShip(null); setNewOpen(true);
  }

  const TABS: { key: Tab; labelEs: string; labelEn: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "dashboard",    labelEs: cxp.tabDashboard  ?? "Dashboard",        labelEn: "Dashboard",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
    { key: "cartera",      labelEs: cxp.tabCartera    ?? "Cartera",           labelEn: "Portfolio",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/></svg> },
    { key: "proveedores",  labelEs: cxp.tabProveedores?? "Por proveedor",     labelEn: "By supplier",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { key: "pendientes",   labelEs: cxp.tabPendientes ?? "Pendientes",        labelEn: "Pending",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
      badge: ctrl.pendingShipments.length + ctrl.pendingPOs.length },
  ];

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
            {cxp.title ?? "Cuentas por Pagar"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {cxp.subtitle ?? "Control de pagos a proveedores y obligaciones pendientes."}
          </p>
        </div>
        <button onClick={() => { setPreloadShip(null); setPreloadPO(null); setNewOpen(true); }}
          style={{ height: "36px", padding: "0 18px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {cxp.newPayable ?? "Nueva cuenta por pagar"}
        </button>
      </div>

      {ctrl.error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
          {ctrl.error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--color-border-faint)" }}>
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md) var(--radius-md) 0 0", background: tab === tb.key ? "var(--color-bg-base)" : "transparent", border: tab === tb.key ? "1px solid var(--color-border-faint)" : "none", borderBottom: tab === tb.key ? "1px solid var(--color-bg-base)" : "none", color: tab === tb.key ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: tab === tb.key ? 700 : 400, cursor: "pointer", marginBottom: tab === tb.key ? "-1px" : "0", display: "flex", alignItems: "center", gap: "6px" }}>
            {tb.icon}
            {es ? tb.labelEs : tb.labelEn}
            {(tb.badge ?? 0) > 0 && (
              <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: "var(--color-warning-text)", color: "#fff", minWidth: "16px", textAlign: "center" }}>
                {tb.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === "dashboard" && (
        <CxPDashboard
          stats={ctrl.stats}
          suppliers={ctrl.supplierSummaries}
          loading={ctrl.loading}
          onSupplierSelect={(s) => { setPreselected(s); setTab("proveedores"); }}
          onNewPayable={() => setNewOpen(true)}
        />
      )}
      {tab === "cartera" && (
                <CxPCartera
          items={ctrl.items}
          loading={ctrl.loading}
          filters={ctrl.filters}
          onFilter={ctrl.handleFilter}
          onSelect={ctrl.handleSelect}
          onPay={openPayment}
          onAttach={handleAttach}
        />
      )}
      {tab === "proveedores" && (
        <CxPProveedorView
          suppliers={ctrl.allProviders}
          preselected={preselected}
          onPay={openPayment}
          onNew={() => { setPreloadShip(null); setPreloadPO(null); setNewOpen(true); }}
        />
      )}
      {tab === "pendientes" && (
        <CxPPendientes
          pendingShipments={ctrl.pendingShipments}
          pendingPOs={ctrl.pendingPOs}
          onRegisterFromShipment={openFromShipment}
          onRegisterFromPO={openFromPO}
        />
      )}

      {/* Drawers */}
      <CxPPagoDrawer
        open={pagoOpen}
        ap={pagoAP}
        saving={ctrl.saving}
        onClose={() => { setPagoOpen(false); setPagoAP(null); }}
        onCreate={ctrl.handleRegisterPayment}
      />
      <CxPNewDrawer
        open={newOpen}
        saving={ctrl.saving}
        preloadFromShipment={preloadShip}
        preloadFromPO={preloadPO}
        onClose={() => { setNewOpen(false); setPreloadShip(null); setPreloadPO(null); }}
        onCreate={async (payload) => { await ctrl.handleCreate(payload); setNewOpen(false); }}
      />
    </div>
  );
}
