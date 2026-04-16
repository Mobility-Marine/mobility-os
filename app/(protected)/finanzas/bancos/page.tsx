"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import { useBancosController } from "./services/bancos.controller";
import BancosDashboard         from "./components/BancosDashboard";
import BancosMovimientos       from "./components/BancosMovimientos";
import BancosNuevaCuentaDrawer from "./components/BancosNuevaCuentaDrawer";
import BancosMovimientoDrawer  from "./components/BancosMovimientoDrawer";

type Tab = "dashboard" | "cuentas" | "movimientos" | "conciliacion";

export default function BancosPage() {
  const { lang, t }   = useTranslation();
  const { companyId } = useTenant();
  const es  = lang !== "en";
  const bnk = (t as any).bancos ?? {};

  const [userId,       setUserId]       = useState("");
  const [tab,          setTab]          = useState<Tab>("dashboard");
  const [cuentaOpen,   setCuentaOpen]   = useState(false);
  const [movOpen,      setMovOpen]      = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  const ctrl = useBancosController(companyId ?? "", userId);
  useEffect(() => { if (companyId) ctrl.load(); }, [companyId]);

  const TABS: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "dashboard",     label: bnk.tabDashboard    ?? "Dashboard",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
    { key: "movimientos",   label: bnk.tabMovimientos  ?? "Movimientos",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/></svg> },
    { key: "conciliacion",  label: bnk.tabConciliacion ?? "Conciliación",
      badge: ctrl.stats.unreconciled,
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  ];

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
            🏦 {bnk.title ?? "Bancos y Tesorería"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {bnk.subtitle ?? "Control de cuentas bancarias, movimientos y conciliación."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setMovOpen(true)}
            style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            {bnk.addTransaction ?? "+ Movimiento manual"}
          </button>
          <button onClick={() => setCuentaOpen(true)}
            style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
            {bnk.addAccount ?? "+ Nueva cuenta"}
          </button>
        </div>
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
            {tb.label}
            {(tb.badge ?? 0) > 0 && (
              <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: "var(--color-warning-text)", color: "#fff" }}>
                {tb.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === "dashboard" && (
        <BancosDashboard
          accounts={ctrl.accounts}
          stats={ctrl.stats}
          transactions={ctrl.transactions}
          loading={ctrl.loading}
          onSelectAccount={(a) => { ctrl.setSelectedAccount(a); setTab("movimientos"); ctrl.handleFilter({ account_id: a.id }); }}
          onAddAccount={() => setCuentaOpen(true)}
          onAddTransaction={() => setMovOpen(true)}
        />
      )}

      {tab === "movimientos" && (
        <BancosMovimientos
          transactions={ctrl.transactions}
          accounts={ctrl.accounts}
          loading={ctrl.loading}
          filters={ctrl.filters}
          onFilter={ctrl.handleFilter}
          onReconcile={ctrl.handleReconcile}
          onUnreconcile={ctrl.handleUnreconcile}
          onDelete={ctrl.handleDeleteTransaction}
          onAdd={() => setMovOpen(true)}
        />
      )}

      {tab === "conciliacion" && (
        <BancosMovimientos
          transactions={ctrl.transactions.filter(tx => !tx.reconciled)}
          accounts={ctrl.accounts}
          loading={ctrl.loading}
          filters={{ ...ctrl.filters, reconciled: "no" }}
          onFilter={ctrl.handleFilter}
          onReconcile={ctrl.handleReconcile}
          onUnreconcile={ctrl.handleUnreconcile}
          onDelete={ctrl.handleDeleteTransaction}
          onAdd={() => setMovOpen(true)}
        />
      )}

      {/* Drawers */}
      <BancosNuevaCuentaDrawer
        open={cuentaOpen}
        saving={ctrl.saving}
        onClose={() => setCuentaOpen(false)}
        onCreate={async (payload) => { await ctrl.handleCreateAccount(payload); setCuentaOpen(false); }}
      />
      <BancosMovimientoDrawer
        open={movOpen}
        saving={ctrl.saving}
        accounts={ctrl.accounts}
        onClose={() => setMovOpen(false)}
        onCreate={async (payload) => { await ctrl.handleCreateTransaction(payload); setMovOpen(false); }}
      />
    </div>
  );
}
