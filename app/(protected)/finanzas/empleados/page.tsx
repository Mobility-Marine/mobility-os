"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import { useEmpleadosController } from "./services/empleados.controller";
import EmpleadosDashboard   from "./components/EmpleadosDashboard";
import EmpleadosNomina      from "./components/EmpleadosNomina";
import EmpleadosVacaciones  from "./components/EmpleadosVacaciones";
import EmpleadosNuevoDrawer from "./components/EmpleadosNuevoDrawer";
import { EMPLOYEE_STATUS_CONFIG, CONTRACT_TYPE_CONFIG, WORK_TYPE_CONFIG, SALARY_TYPE_CONFIG } from "./types/empleados.types";

type Tab = "dashboard" | "expedientes" | "nomina" | "vacaciones";

export default function EmpleadosPage() {
  const { lang, t }   = useTranslation();
  const { companyId } = useTenant();
  const es  = lang !== "en";
  const em  = (t as any).empleados ?? {};

  const [userId,  setUserId]  = useState("");
  const [tab,     setTab]     = useState<Tab>("dashboard");
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  const ctrl = useEmpleadosController(companyId ?? "", userId);

  useEffect(() => { if (companyId && userId) ctrl.load(); }, [companyId, userId]);

  const TABS: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "dashboard",
      label: em.tabDashboard   ?? "Dashboard",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
    { key: "expedientes",
      label: em.tabExpedientes ?? "Expedientes",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { key: "nomina",
      label: em.tabNomina      ?? "Nómina",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
    { key: "vacaciones",
      label: em.tabVacaciones  ?? "Vacaciones",
      badge: ctrl.timeOff.filter(t => t.status === "pending").length,
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  ];

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
            👥 {em.title ?? "Empleados"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {em.subtitle ?? "Expedientes, nómina, vacaciones y prestaciones del equipo."}
          </p>
        </div>
        <button onClick={() => setNewOpen(true)}
          style={{ height: "36px", padding: "0 18px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {em.nuevoEmpleado ?? "+ Nuevo empleado"}
        </button>
      </div>

      {/* Error */}
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
        <EmpleadosDashboard
          stats={ctrl.stats}
          employees={ctrl.employees}
          periods={ctrl.periods}
          loading={ctrl.loading}
          onNewEmployee={() => setNewOpen(true)}
          onNewPeriod={() => setTab("nomina")}
          onSelectPeriod={(p) => { ctrl.setSelectedPeriod(p); setTab("nomina"); }}
        />
      )}

      {tab === "expedientes" && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 120px 100px 90px", padding: "8px 18px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <span>Empleado</span>
            <span style={{ textAlign: "center" }}>Jornada</span>
            <span>{es ? "Ingreso" : "Start date"}</span>
            <span>Contrato</span>
            <span style={{ textAlign: "right" }}>Salario</span>
            <span style={{ textAlign: "center" }}>Estado</span>
          </div>
          {ctrl.loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
              {es ? "Cargando…" : "Loading…"}
            </div>
          ) : ctrl.employees.length === 0 ? (
            <div style={{ padding: "50px", textAlign: "center" }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>👥</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-muted)" }}>{em.sinEmpleados}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>{em.sinEmpleadosDesc}</div>
              <button onClick={() => setNewOpen(true)}
                style={{ marginTop: "14px", height: "36px", padding: "0 20px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                {em.nuevoEmpleado ?? "+ Nuevo empleado"}
              </button>
            </div>
          ) : ctrl.employees.map((emp, i) => {
            const sc  = EMPLOYEE_STATUS_CONFIG[emp.status];
            const wt  = WORK_TYPE_CONFIG[emp.work_type];
            const ct  = CONTRACT_TYPE_CONFIG[emp.contract_type];
            const st  = SALARY_TYPE_CONFIG[emp.salary_type];
            return (
              <div key={emp.id}
                style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 120px 100px 90px", padding: "11px 18px", borderBottom: i < ctrl.employees.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "var(--color-brand-blue)", flexShrink: 0 }}>
                    {emp.first_name[0]}{emp.last_name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{emp.full_name}</div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                      {emp.position}{emp.department ? ` · ${emp.department}` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "center", fontSize: "13px" }}>{wt.icon}</div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  {new Date(emp.start_date).toLocaleDateString("es-MX")}
                </div>
                <div style={{ fontSize: "10px", color: "var(--color-text-second)" }}>{ct.label}</div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                    ${Number(emp.base_salary).toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>{st.label}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "nomina" && (
        <EmpleadosNomina
          periods={ctrl.periods}
          entries={ctrl.entries}
          employees={ctrl.employees}
          saving={ctrl.saving}
          selectedPeriod={ctrl.selectedPeriod}
          onCreatePeriod={ctrl.handleCreatePeriod}
          onCalculate={async (id) => { await ctrl.handleCalculate(id); await ctrl.loadEntries(id); }}
          onApprove={ctrl.handleApprove}
          onPay={ctrl.handlePay}
          onSelectPeriod={(p) => { ctrl.setSelectedPeriod(p); ctrl.loadEntries(p.id); }}
        />
      )}

      {tab === "vacaciones" && (
        <EmpleadosVacaciones
          timeOff={ctrl.timeOff}
          employees={ctrl.employees}
          saving={ctrl.saving}
          onCreate={ctrl.handleCreateTimeOff}
          onUpdate={ctrl.handleUpdateTimeOff}
        />
      )}

      {/* Drawer nuevo empleado */}
      <EmpleadosNuevoDrawer
        open={newOpen}
        saving={ctrl.saving}
        onClose={() => setNewOpen(false)}
        onCreate={async (payload) => { await ctrl.handleCreateEmployee(payload); setNewOpen(false); }}
      />
    </div>
  );
}
