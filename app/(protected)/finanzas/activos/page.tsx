"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import { useActivosController } from "./services/activos.controller";
import ActivosDashboard  from "./components/ActivosDashboard";
import ActivosDepreciacion from "./components/ActivosDepreciacion";
import ActivosBajas      from "./components/ActivosBajas";
import ActivosNuevoDrawer from "./components/ActivosNuevoDrawer";

type Tab = "dashboard" | "catalogo" | "depreciacion" | "bajas";

export default function ActivosPage() {
  const { lang, t }   = useTranslation();
  const { companyId } = useTenant();
  const es  = lang !== "en";
  const ac  = (t as any).activos ?? {};

  const [userId,   setUserId]   = useState("");
  const [tab,      setTab]      = useState<Tab>("dashboard");
  const [newOpen,  setNewOpen]  = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  const ctrl = useActivosController(companyId ?? "", userId);
  useEffect(() => { if (companyId && userId) ctrl.load(); }, [companyId, userId]);

  const TABS: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "dashboard",    label: ac.tabDashboard    ?? "Dashboard",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
    { key: "catalogo",     label: ac.tabCatalogo     ?? "Catálogo",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/></svg> },
    { key: "depreciacion", label: ac.tabDepreciacion ?? "Depreciación",
      badge: ctrl.pending.length,
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg> },
    { key: "bajas",        label: ac.tabBajas        ?? "Bajas",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> },
  ];

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
            🏛️ {ac.title ?? "Activos Fijos"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {ac.subtitle ?? "Catálogo, depreciación automática, bajas y valor libro."}
          </p>
        </div>
        <button onClick={() => setNewOpen(true)}
          style={{ height: "36px", padding: "0 18px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {ac.nuevoActivo ?? "+ Nuevo activo"}
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
        <ActivosDashboard
          stats={ctrl.stats}
          assets={ctrl.assets}
          loading={ctrl.loading}
          period={ctrl.period}
          pendingCount={ctrl.pending.length}
          saving={ctrl.saving}
          onNew={() => setNewOpen(true)}
          onSelectAsset={(a) => { ctrl.setSelected(a); setTab("catalogo"); }}
          onPostDepreciation={ctrl.handlePostPeriod}
        />
      )}

      {tab === "catalogo" && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 120px 100px 90px 90px 80px", padding: "8px 18px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <span>Activo</span>
            <span style={{ textAlign: "center" }}>Tipo</span>
            <span>{es ? "Adquisición" : "Acquired"}</span>
            <span style={{ textAlign: "right" }}>Costo</span>
            <span style={{ textAlign: "right" }}>Dep. acum.</span>
            <span style={{ textAlign: "right" }}>Valor libro</span>
            <span style={{ textAlign: "right" }}>Dep/mes</span>
            <span style={{ textAlign: "center" }}>Estado</span>
          </div>
          {ctrl.loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
              {es ? "Cargando…" : "Loading…"}
            </div>
          ) : ctrl.assets.length === 0 ? (
            <div style={{ padding: "50px", textAlign: "center" }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>🏛️</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-muted)" }}>{ac.sinActivos}</div>
              <button onClick={() => setNewOpen(true)} style={{ marginTop: "14px", height: "36px", padding: "0 20px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                {ac.nuevoActivo ?? "+ Nuevo activo"}
              </button>
            </div>
          ) : ctrl.assets.map((a, i) => {
            const { ASSET_TYPE_CONFIG: ATC, ASSET_STATUS_CONFIG: ASC } = require("./types/activos.types");
            const cfg = ATC[a.asset_type];
            const sc  = ASC[a.status];
            const pct = a.acquisition_cost > 0 ? (a.accumulated_depreciation / a.acquisition_cost) * 100 : 0;
            return (
              <div key={a.id}
                style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 120px 100px 90px 90px 80px", padding: "11px 18px", borderBottom: i < ctrl.assets.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{a.name}</div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                    {a.serial_number ? `SN: ${a.serial_number}` : ""}{a.location ? ` · ${a.location}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "center", fontSize: "16px" }}>{cfg.icon}</div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  {new Date(a.acquisition_date).toLocaleDateString("es-MX")}
                </div>
                <div style={{ textAlign: "right", fontSize: "11px", fontVariantNumeric: "tabular-nums" }}>
                  {a.currency} ${Number(a.acquisition_cost).toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "10px", color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
                    ${Number(a.accumulated_depreciation).toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>{pct.toFixed(1)}%</div>
                </div>
                <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>
                  ${Number(a.book_value).toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                </div>
                <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-warning-text)", fontVariantNumeric: "tabular-nums" }}>
                  ${Number(a.monthly_depreciation).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: sc.bg, color: sc.color }}>
                    {sc.labelEs}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "depreciacion" && (
        <ActivosDepreciacion
          pending={ctrl.pending}
          posted={ctrl.posted}
          assets={ctrl.assets}
          period={ctrl.period}
          saving={ctrl.saving}
          onPost={ctrl.handlePostPeriod}
          onSelectAsset={(a) => { ctrl.setSelected(a); setTab("catalogo"); }}
        />
      )}

      {tab === "bajas" && (
        <ActivosBajas
          disposals={ctrl.disposals}
          assets={ctrl.assets}
          saving={ctrl.saving}
          onDispose={ctrl.handleDispose}
        />
      )}

      <ActivosNuevoDrawer
        open={newOpen}
        saving={ctrl.saving}
        onClose={() => setNewOpen(false)}
        onCreate={async (payload) => { await ctrl.handleCreate(payload); setNewOpen(false); }}
      />
    </div>
  );
}
