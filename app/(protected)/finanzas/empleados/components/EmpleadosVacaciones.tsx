"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { EmployeeTimeOff, Employee } from "../types/empleados.types";
import { TIME_OFF_TYPE_CONFIG } from "../types/empleados.types";

type Props = {
  timeOff:   EmployeeTimeOff[];
  employees: Employee[];
  saving:    boolean;
  onCreate:  (payload: any) => Promise<void>;
  onUpdate:  (id: string, status: string) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

const STATUS_CONFIG = {
  pending:   { label: "Pendiente", color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
  approved:  { label: "Aprobado",  color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
  rejected:  { label: "Rechazado", color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)"  },
  cancelled: { label: "Cancelado", color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)"  },
};

export default function EmpleadosVacaciones({ timeOff, employees, saving, onCreate, onUpdate }: Props) {
  const { lang, t } = useTranslation();
  const es = lang !== "en";
  const em = (t as any).empleados ?? {};
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    employee_id: "", type: "vacation", start_date: "", end_date: "", notes: "",
  });

  function setF(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  const days = form.start_date && form.end_date
    ? Math.max(0, Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000) + 1)
    : 0;

  async function handleSubmit() {
    if (!form.employee_id || !form.start_date || !form.end_date) return;
    await onCreate({ ...form, days });
    setShowForm(false);
    setForm({ employee_id: "", type: "vacation", start_date: "", end_date: "", notes: "" });
  }

  const pending  = timeOff.filter(t => t.status === "pending");
  const rest     = timeOff.filter(t => t.status !== "pending");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setShowForm(v => !v)}
          style={{ height: "34px", padding: "0 16px", borderRadius: "var(--radius-md)", background: showForm ? "var(--color-bg-subtle)" : "var(--color-brand-blue)", color: showForm ? "var(--color-text-muted)" : "#fff", border: showForm ? "1px solid var(--color-border)" : "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
          {showForm ? (es ? "Cancelar" : "Cancel") : (es ? "+ Solicitar permiso" : "+ Request time off")}
        </button>
      </div>

      {showForm && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "grid", gap: "12px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {es ? "Nueva solicitud de permiso/vacaciones" : "New time off request"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Empleado *</div>
              <select value={form.employee_id} onChange={e => setF("employee_id", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                <option value="">— Seleccionar —</option>
                {employees.filter(e => e.status === "active").map(e => (
                  <option key={e.id} value={e.id}>{e.full_name} — {e.position}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{em.tipoPermiso ?? "Tipo"}</div>
              <select value={form.type} onChange={e => setF("type", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                {Object.entries(TIME_OFF_TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "20px" }}>
              {days > 0 && (
                <div style={{ padding: "6px 12px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", fontWeight: 700, color: "var(--color-brand-blue)" }}>
                  {days} {es ? "días" : "days"}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{em.fechaInicio ?? "Fecha inicio"} *</div>
              <input type="date" value={form.start_date} onChange={e => setF("start_date", e.target.value)} style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{em.fechaFin ?? "Fecha fin"} *</div>
              <input type="date" value={form.end_date} onChange={e => setF("end_date", e.target.value)} style={INPUT} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Notas</div>
              <input value={form.notes} onChange={e => setF("notes", e.target.value)} style={INPUT} />
            </div>
          </div>
          <button onClick={handleSubmit} disabled={saving || !form.employee_id || !form.start_date || !form.end_date}
            style={{ height: "36px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
            {saving ? "Guardando…" : "✓ Enviar solicitud"}
          </button>
        </div>
      )}

      {/* Pendientes de aprobación */}
      {pending.length > 0 && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-warning-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "10px 18px", background: "var(--color-warning-bg)", borderBottom: "1px solid var(--color-warning-border)", fontSize: "12px", fontWeight: 700, color: "var(--color-warning-text)" }}>
            {es ? "Pendientes de aprobación" : "Pending approval"} ({pending.length})
          </div>
          {pending.map((item, i) => {
            const tc = TIME_OFF_TYPE_CONFIG[item.type];
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px", borderBottom: i < pending.length-1 ? "1px solid var(--color-border-faint)" : "none" }}>
                <span style={{ fontSize: "20px" }}>{tc.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {item.employee ? `${item.employee.first_name} ${item.employee.last_name}` : "—"} — {tc.label}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                    {new Date(item.start_date).toLocaleDateString("es-MX")} — {new Date(item.end_date).toLocaleDateString("es-MX")} · {item.days} {es ? "días" : "days"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => onUpdate(item.id, "approved")}
                    style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>
                    ✓ {em.aprobarPermiso ?? "Aprobar"}
                  </button>
                  <button onClick={() => onUpdate(item.id, "rejected")}
                    style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>
                    ✗ {em.rechazarPermiso ?? "Rechazar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Historial */}
      {rest.length > 0 && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "10px 18px", borderBottom: "1px solid var(--color-border-faint)", fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {es ? "Historial" : "History"}
          </div>
          {rest.map((item, i) => {
            const tc = TIME_OFF_TYPE_CONFIG[item.type];
            const sc = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 18px", borderBottom: i < rest.length-1 ? "1px solid var(--color-border-faint)" : "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <span style={{ fontSize: "18px" }}>{tc.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {item.employee ? `${item.employee.first_name} ${item.employee.last_name}` : "—"} — {tc.label}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                    {new Date(item.start_date).toLocaleDateString("es-MX")} — {new Date(item.end_date).toLocaleDateString("es-MX")} · {item.days} {es ? "días" : "days"}
                  </div>
                </div>
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: sc.bg, color: sc.color }}>
                  {sc.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
