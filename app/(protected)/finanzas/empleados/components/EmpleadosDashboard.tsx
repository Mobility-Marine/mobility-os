"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { EmployeeStats, Employee, PayrollPeriod } from "../types/empleados.types";
import { EMPLOYEE_STATUS_CONFIG, PERIOD_STATUS_CONFIG } from "../types/empleados.types";

type Props = {
  stats:    EmployeeStats;
  employees:Employee[];
  periods:  PayrollPeriod[];
  loading:  boolean;
  onNewEmployee:() => void;
  onNewPeriod:  () => void;
  onSelectPeriod:(p: PayrollPeriod) => void;
};

const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });
const fmt  = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function EmpleadosDashboard({ stats: s, employees, periods, loading, onNewEmployee, onNewPeriod, onSelectPeriod }: Props) {
  const { lang, t } = useTranslation();
  const es  = lang !== "en";
  const em  = (t as any).empleados ?? {};

  const recentPeriods = periods.slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
        {[
          { label: em.totalEmpleados ?? "Total empleados",  value: String(s.total),  sub: `${s.active} ${em.activosCount ?? "activos"}`, color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",     icon: "👥" },
          { label: em.nominaMes      ?? "Nómina del mes",   value: `$${fmt0(s.payroll_monthly)}`, sub: es ? "salarios netos" : "net salaries", color: "var(--color-warning-text)", bg: "var(--color-warning-bg)",  icon: "💰" },
          { label: em.costoTotal     ?? "Costo total",      value: `$${fmt0(s.cost_monthly)}`,    sub: es ? "incl. IMSS e INFONAVIT" : "incl. IMSS & INFONAVIT", color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",   icon: "📊" },
          { label: es ? "En vacaciones" : "On vacation",   value: String(s.on_vacation), sub: es ? "empleados fuera" : "employees out", color: s.on_vacation > 0 ? "var(--color-success-text)" : "var(--color-text-muted)", bg: s.on_vacation > 0 ? "var(--color-success-bg)" : "var(--color-bg-base)", icon: "🏖️" },
        ].map(c => (
          <div key={c.label} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</div>
              <div style={{ width: "34px", height: "34px", borderRadius: "var(--radius-md)", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>{c.icon}</div>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Por departamento + Períodos recientes */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "16px" }}>

        {/* Por departamento */}
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
            {es ? "Por departamento" : "By department"}
          </div>
          {Object.entries(s.by_department).sort((a,b) => b[1]-a[1]).map(([dep, count]) => {
            const pct = s.active > 0 ? (count / s.active) * 100 : 0;
            return (
              <div key={dep} style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "11px", color: "var(--color-text-second)" }}>{dep}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-primary)" }}>{count}</span>
                </div>
                <div style={{ height: "5px", background: "var(--color-border-faint)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "var(--color-brand-blue)", borderRadius: "3px" }} />
                </div>
              </div>
            );
          })}
          {Object.keys(s.by_department).length === 0 && (
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", textAlign: "center", padding: "20px 0" }}>
              {es ? "Sin datos" : "No data"}
            </div>
          )}
        </div>

        {/* Períodos de nómina */}
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {es ? "Períodos de nómina recientes" : "Recent payroll periods"}
            </div>
            <button onClick={onNewPeriod}
              style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
              {em.nuevaNomina ?? "+ Nueva nómina"}
            </button>
          </div>
          {recentPeriods.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
              {es ? "Sin períodos de nómina" : "No payroll periods"}
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 120px 120px 90px", padding: "7px 18px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                <span>Período</span>
                <span style={{ textAlign: "center" }}>Empl.</span>
                <span style={{ textAlign: "right" }}>Percepciones</span>
                <span style={{ textAlign: "right" }}>Deducciones</span>
                <span style={{ textAlign: "right" }}>Neto</span>
                <span style={{ textAlign: "center" }}>Estado</span>
              </div>
              {recentPeriods.map((p, i) => {
                const sc = PERIOD_STATUS_CONFIG[p.status];
                return (
                  <div key={p.id} onClick={() => onSelectPeriod(p)}
                    style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 120px 120px 90px", padding: "10px 18px", borderBottom: i < recentPeriods.length-1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                        P{p.period_number}/{p.year}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                        {new Date(p.start_date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })} — {new Date(p.end_date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                      </div>
                    </div>
                    <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 700 }}>{p.employee_count}</div>
                    <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>${fmt0(p.total_perceptions)}</div>
                    <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-danger-text)",  fontVariantNumeric: "tabular-nums" }}>${fmt0(p.total_deductions)}</div>
                    <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>${fmt0(p.total_net)}</div>
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: sc.bg, color: sc.color }}>{sc.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lista rápida empleados activos */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {es ? "Empleados activos" : "Active employees"} ({employees.filter(e => e.status === "active").length})
          </div>
          <button onClick={onNewEmployee}
            style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
            {em.nuevoEmpleado ?? "+ Nuevo empleado"}
          </button>
        </div>
        {employees.filter(e => e.status === "active").slice(0, 8).map((emp, i, arr) => {
          const sc = EMPLOYEE_STATUS_CONFIG[emp.status];
          return (
            <div key={emp.id}
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 18px", borderBottom: i < arr.length-1 ? "1px solid var(--color-border-faint)" : "none" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "var(--color-brand-blue)", flexShrink: 0 }}>
                {emp.first_name[0]}{emp.last_name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{emp.full_name}</div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{emp.position}{emp.department ? ` · ${emp.department}` : ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>${fmt(emp.base_salary)}</div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{emp.salary_type}</div>
              </div>
              <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: sc.bg, color: sc.color }}>{sc.label}</span>
            </div>
          );
        })}
        {employees.filter(e => e.status === "active").length === 0 && (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>👥</div>
            <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{em.sinEmpleados}</div>
          </div>
        )}
      </div>
    </div>
  );
}
