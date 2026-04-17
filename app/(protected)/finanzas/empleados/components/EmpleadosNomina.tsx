"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { PayrollPeriod, PayrollEntry, Employee } from "../types/empleados.types";
import { PERIOD_STATUS_CONFIG, SALARY_TYPE_CONFIG } from "../types/empleados.types";

type Props = {
  periods:         PayrollPeriod[];
  entries:         PayrollEntry[];
  employees:       Employee[];
  saving:          boolean;
  onCreatePeriod:  (payload: any) => Promise<any>;
  onCalculate:     (periodId: string) => Promise<void>;
  onApprove:       (periodId: string) => Promise<void>;
  onPay:           (periodId: string) => Promise<void>;
  onSelectPeriod:  (p: PayrollPeriod) => void;
  selectedPeriod:  PayrollPeriod | null;
};

const fmt  = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

export default function EmpleadosNomina({ periods, entries, employees, saving, onCreatePeriod, onCalculate, onApprove, onPay, onSelectPeriod, selectedPeriod }: Props) {
  const { lang, t } = useTranslation();
  const es = lang !== "en";
  const em = (t as any).empleados ?? {};
  const [showNew,  setShowNew]  = useState(false);
  const [confirm,  setConfirm]  = useState<"approve" | "pay" | null>(null);
  const [newForm,  setNewForm]  = useState({
    period_type:   "monthly",
    period_number: "1",
    year:          String(new Date().getFullYear()),
    start_date:    "",
    end_date:      "",
    payment_date:  "",
  });

  async function handleCreatePeriod() {
    const period = await onCreatePeriod({
      period_type:   newForm.period_type,
      period_number: parseInt(newForm.period_number),
      year:          parseInt(newForm.year),
      start_date:    newForm.start_date,
      end_date:      newForm.end_date,
      payment_date:  newForm.payment_date,
    });
    setShowNew(false);
    if (period) onSelectPeriod(period);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "16px", height: "calc(100vh - 220px)" }}>

      {/* Lista períodos */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {es ? "Períodos" : "Periods"}
          </div>
          <button onClick={() => setShowNew(v => !v)}
            style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>
            + {es ? "Nuevo" : "New"}
          </button>
        </div>

        {showNew && (
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)", display: "flex", flexDirection: "column", gap: "8px" }}>
            <select value={newForm.period_type} onChange={e => setNewForm(p => ({ ...p, period_type: e.target.value }))} style={INPUT}>
              {Object.entries(SALARY_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              <input placeholder="No. período" type="number" value={newForm.period_number} onChange={e => setNewForm(p => ({ ...p, period_number: e.target.value }))} style={INPUT} />
              <input placeholder="Año" type="number" value={newForm.year} onChange={e => setNewForm(p => ({ ...p, year: e.target.value }))} style={INPUT} />
              <input type="date" placeholder="Inicio" value={newForm.start_date} onChange={e => setNewForm(p => ({ ...p, start_date: e.target.value }))} style={INPUT} />
              <input type="date" placeholder="Fin" value={newForm.end_date} onChange={e => setNewForm(p => ({ ...p, end_date: e.target.value }))} style={INPUT} />
              <input type="date" placeholder="Pago" value={newForm.payment_date} onChange={e => setNewForm(p => ({ ...p, payment_date: e.target.value }))} style={{ ...INPUT, gridColumn: "1 / -1" }} />
            </div>
            <button onClick={handleCreatePeriod} disabled={saving}
              style={{ height: "30px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
              {saving ? "Creando…" : "Crear período"}
            </button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto" }}>
          {periods.map((p, i) => {
            const sc = PERIOD_STATUS_CONFIG[p.status];
            const isSelected = selectedPeriod?.id === p.id;
            return (
              <div key={p.id} onClick={() => onSelectPeriod(p)}
                style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border-faint)", cursor: "pointer", background: isSelected ? "var(--color-info-bg)" : "transparent", borderLeft: `3px solid ${isSelected ? "var(--color-brand-blue)" : "transparent"}` }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                    P{p.period_number}/{p.year}
                  </div>
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: sc.bg, color: sc.color }}>{sc.label}</span>
                </div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                  {SALARY_TYPE_CONFIG[p.period_type as any]?.label} · {p.employee_count} emp.
                </div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-brand-blue)", marginTop: "2px", fontVariantNumeric: "tabular-nums" }}>
                  ${fmt0(p.total_net)}
                </div>
              </div>
            );
          })}
          {periods.length === 0 && (
            <div style={{ padding: "30px", textAlign: "center", fontSize: "12px", color: "var(--color-text-muted)" }}>
              {es ? "Sin períodos" : "No periods"}
            </div>
          )}
        </div>
      </div>

      {/* Detalle del período */}
      {!selectedPeriod ? (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "10px", color: "var(--color-text-muted)" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <div style={{ fontSize: "13px" }}>{es ? "Selecciona un período para ver el detalle" : "Select a period to view details"}</div>
        </div>
      ) : (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>

          {/* Header período */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                  Nómina P{selectedPeriod.period_number}/{selectedPeriod.year} — {SALARY_TYPE_CONFIG[selectedPeriod.period_type as any]?.label}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                  {new Date(selectedPeriod.start_date).toLocaleDateString("es-MX")} — {new Date(selectedPeriod.end_date).toLocaleDateString("es-MX")} · Pago: {new Date(selectedPeriod.payment_date).toLocaleDateString("es-MX")}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {selectedPeriod.status === "draft" && (
                  <button onClick={() => onCalculate(selectedPeriod.id)} disabled={saving}
                    style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                    {saving ? "Calculando…" : em.calcular ?? "Calcular nómina"}
                  </button>
                )}
                {selectedPeriod.status === "calculated" && (
                  <button onClick={() => setConfirm("approve")} disabled={saving}
                    style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                    {em.aprobar ?? "Aprobar"}
                  </button>
                )}
                {selectedPeriod.status === "approved" && (
                  <button onClick={() => setConfirm("pay")} disabled={saving}
                    style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                    {em.pagar ?? "Pagar nómina"}
                  </button>
                )}
              </div>
            </div>

            {/* Confirmación */}
            {confirm && (
              <div style={{ marginTop: "10px", padding: "10px 14px", borderRadius: "var(--radius-md)", background: confirm === "pay" ? "var(--color-success-bg)" : "var(--color-warning-bg)", border: `1px solid ${confirm === "pay" ? "var(--color-success-border)" : "var(--color-warning-border)"}`, display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: confirm === "pay" ? "var(--color-success-text)" : "var(--color-warning-text)", flex: 1 }}>
                  {confirm === "approve" ? "¿Confirmar aprobación de nómina?" : `¿Confirmar pago de MXN $${fmt0(selectedPeriod.total_net)}? Se creará una CXP automáticamente.`}
                </span>
                <button onClick={async () => { confirm === "approve" ? await onApprove(selectedPeriod.id) : await onPay(selectedPeriod.id); setConfirm(null); }}
                  style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: confirm === "pay" ? "var(--color-success-text)" : "var(--color-warning-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                  ✓ Confirmar
                </button>
                <button onClick={() => setConfirm(null)}
                  style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            )}

            {/* Totales */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", marginTop: "12px" }}>
              {[
                { l: "Empleados",      v: selectedPeriod.employee_count,    color: "var(--color-text-primary)", isCount: true },
                { l: em.percepciones ?? "Percepciones", v: selectedPeriod.total_perceptions, color: "var(--color-success-text)" },
                { l: em.deducciones  ?? "Deducciones",  v: selectedPeriod.total_deductions,  color: "var(--color-danger-text)"  },
                { l: em.netoAPagar   ?? "Neto a pagar", v: selectedPeriod.total_net,         color: "var(--color-brand-blue)"   },
              ].map(c => (
                <div key={c.l} style={{ padding: "8px 12px", background: "var(--color-bg-base)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
                  <div style={{ fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>{c.l}</div>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums" }}>
                    {(c as any).isCount ? c.v : `$${fmt0(c.v as number)}`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabla de empleados */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {entries.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
                {es ? "Presiona \"Calcular nómina\" para generar los recibos" : "Press \"Calculate payroll\" to generate pay stubs"}
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px 110px 110px 100px", padding: "7px 18px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", position: "sticky", top: 0 }}>
                  <span>Empleado</span>
                  <span style={{ textAlign: "right" }}>Percepciones</span>
                  <span style={{ textAlign: "right" }}>ISR</span>
                  <span style={{ textAlign: "right" }}>IMSS</span>
                  <span style={{ textAlign: "right" }}>Neto</span>
                  <span style={{ textAlign: "right" }}>Costo patrón</span>
                </div>
                {entries.map((e, i) => {
                  const emp = e.employee;
                  const costoPatron = e.total_perceptions + e.imss_employer + e.infonavit;
                  return (
                    <div key={e.id}
                      style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px 110px 110px 100px", padding: "10px 18px", borderBottom: i < entries.length-1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center" }}
                      onMouseEnter={ev => (ev.currentTarget.style.background = "var(--color-bg-subtle)")}
                      onMouseLeave={ev => (ev.currentTarget.style.background = "transparent")}>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                          {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{emp?.position}</div>
                      </div>
                      <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>${fmt(e.total_perceptions)}</div>
                      <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>${fmt(e.isr_withheld)}</div>
                      <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>${fmt(e.imss_employee)}</div>
                      <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 800, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>${fmt(e.net_salary)}</div>
                      <div style={{ textAlign: "right", fontSize: "10px", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>${fmt0(costoPatron)}</div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
