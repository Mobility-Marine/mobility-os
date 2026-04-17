"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import { fetchCompanySettings } from "@/app/(protected)/comercial/cotizaciones/services/quotations.service";
import { emitirCFDINomina } from "@/app/(protected)/finanzas/empleados/services/nomina.cfdi.service";
import type { PayrollPeriod } from "@/app/(protected)/finanzas/empleados/types/empleados.types";
import { PERIOD_STATUS_CONFIG, SALARY_TYPE_CONFIG } from "@/app/(protected)/finanzas/empleados/types/empleados.types";

type Props = {
  open:    boolean;
  onClose: () => void;
  onDone:  () => void;
};

type EntryWithEmployee = {
  id:             string;
  employee_id:    string;
  total_perceptions: number;
  total_deductions:  number;
  net_salary:     number;
  isr_withheld:   number;
  imss_employee:  number;
  cfdi_uuid:      string | null;
  status:         string;
  base_salary:    number;
  overtime_amount:number;
  bonus:          number;
  vacation_premium:number;
  christmas_bonus:number;
  food_vouchers:  number;
  savings_fund_employer: number;
  savings_fund_employee: number;
  other_perceptions:     number;
  loans_deduction:       number;
  other_deductions:      number;
  imss_employer:  number;
  infonavit:      number;
  employee: {
    id:                string;
    first_name:        string;
    last_name:         string;
    second_last_name?: string;
    rfc?:              string;
    curp?:             string;
    nss?:              string;
    position:          string;
    salary_type:       string;
    contract_type:     string;
    base_salary:       number;
    daily_salary?:     number;
    integrated_salary?:number;
    start_date:        string;
    department?:       string;
    bank_name?:        string;
    bank_clabe?:       string;
    benefits?:         any;
    cfdi_nomina_enabled: boolean;
  };
};

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });

export default function CFDINominaDrawer({ open, onClose, onDone }: Props) {
  const { lang }      = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [userId,         setUserId]         = useState("");
  const [periods,        setPeriods]        = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [entries,        setEntries]        = useState<EntryWithEmployee[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [timbrandoId,    setTimbrandoId]    = useState<string | null>(null);
  const [timbrandoAll,   setTimbrandoAll]   = useState(false);
  const [errors,         setErrors]         = useState<Record<string, string>>({});
  const [progress,       setProgress]       = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  useEffect(() => {
    if (!open || !companyId) return;
    setLoadingPeriods(true);
    supabase.from("payroll_periods").select("*")
      .eq("company_id", companyId)
      .in("status", ["approved","paid"])
      .order("year", { ascending: false })
      .order("period_number", { ascending: false })
      .then(({ data }) => { setPeriods((data ?? []) as PayrollPeriod[]); setLoadingPeriods(false); });
  }, [open, companyId]);

  async function loadEntries(period: PayrollPeriod) {
    setSelectedPeriod(period);
    setEntries([]);
    setErrors({});
    setLoadingEntries(true);
    const { data } = await supabase.from("payroll_entries")
      .select("*, employee:employees(*)")
      .eq("company_id", companyId!)
      .eq("period_id", period.id)
      .neq("status", "cancelled");
    setEntries((data ?? []) as EntryWithEmployee[]);
    setLoadingEntries(false);
  }

  async function timbraEntry(entry: EntryWithEmployee) {
    if (!companyId || !selectedPeriod) return;
    setTimbrandoId(entry.id);
    setErrors(p => { const n = {...p}; delete n[entry.id]; return n; });
    try {
      const [settings, { data: { user } }] = await Promise.all([
        fetchCompanySettings(companyId),
        supabase.auth.getUser(),
      ]);
      // Construir objeto employee completo desde entry.employee
      const emp = entry.employee as any;
      const result = await emitirCFDINomina(
        companyId, user?.id ?? "",
        emp, entry as any, selectedPeriod, settings
      );
      // Guardar UUID en la entrada
      await supabase.from("payroll_entries")
        .update({ cfdi_uuid: result.uuid, updated_at: new Date().toISOString() })
        .eq("id", entry.id);
      // Actualizar local
      setEntries(p => p.map(e => e.id === entry.id ? { ...e, cfdi_uuid: result.uuid } : e));
    } catch (e: any) {
      setErrors(p => ({ ...p, [entry.id]: e.message }));
    } finally { setTimbrandoId(null); }
  }

  async function timbraTodos() {
    const pendientes = entries.filter(e => !e.cfdi_uuid && e.employee?.rfc && e.employee?.curp && e.employee?.nss);
    if (!pendientes.length) return;
    setTimbrandoAll(true); setProgress(0);
    for (let i = 0; i < pendientes.length; i++) {
      await timbraEntry(pendientes[i]);
      setProgress(Math.round(((i + 1) / pendientes.length) * 100));
    }
    setTimbrandoAll(false);
  }

  const timbrados     = entries.filter(e => e.cfdi_uuid).length;
  const pendientes    = entries.filter(e => !e.cfdi_uuid).length;
  const sinDatosRFC   = entries.filter(e => !e.cfdi_uuid && (!e.employee?.rfc || !e.employee?.curp || !e.employee?.nss)).length;
  const listosTimbrar = entries.filter(e => !e.cfdi_uuid && e.employee?.rfc && e.employee?.curp && e.employee?.nss).length;

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(820px,96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
              💰 {es ? "Timbrar CFDI de Nómina" : "Stamp Payroll CFDI"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
              {es ? "Complemento de Nómina 1.2 — CFDI 4.0 tipo N" : "Payroll Complement 1.2 — CFDI 4.0 type N"}
            </div>
          </div>
          <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "260px 1fr", overflow: "hidden" }}>

          {/* Lista períodos */}
          <div style={{ borderRight: "1px solid var(--color-border-faint)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border-faint)", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {es ? "Períodos aprobados / pagados" : "Approved / paid periods"}
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {loadingPeriods ? (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>Cargando…</div>
              ) : periods.length === 0 ? (
                <div style={{ padding: "20px 16px", fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                  {es ? "No hay períodos aprobados o pagados. Aprueba una nómina primero en el módulo de Empleados." : "No approved or paid periods. Approve payroll first in the Employees module."}
                </div>
              ) : periods.map(p => {
                const sc         = PERIOD_STATUS_CONFIG[p.status];
                const isSelected = selectedPeriod?.id === p.id;
                return (
                  <div key={p.id} onClick={() => loadEntries(p)}
                    style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border-faint)", cursor: "pointer", background: isSelected ? "var(--color-info-bg)" : "transparent", borderLeft: `3px solid ${isSelected ? "var(--color-brand-blue)" : "transparent"}` }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        P{p.period_number}/{p.year}
                      </span>
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                      {SALARY_TYPE_CONFIG[p.period_type as any]?.label} · {p.employee_count} emp.
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-brand-blue)", marginTop: "2px", fontVariantNumeric: "tabular-nums" }}>
                      ${fmt0(p.total_net)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detalle entradas */}
          {!selectedPeriod ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px", color: "var(--color-text-muted)" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="1"/></svg>
              <div style={{ fontSize: "13px" }}>{es ? "Selecciona un período para ver los empleados" : "Select a period to view employees"}</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

              {/* Header del período seleccionado */}
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)", flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                      Período P{selectedPeriod.period_number}/{selectedPeriod.year} — {SALARY_TYPE_CONFIG[selectedPeriod.period_type as any]?.label}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                      Pago: {new Date(selectedPeriod.payment_date).toLocaleDateString("es-MX")}
                    </div>
                  </div>
                  {listosTimbrar > 0 && !timbrandoAll && (
                    <button onClick={timbraTodos}
                      style={{ height: "32px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-warning-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                      ⚡ {es ? `Timbrar todos (${listosTimbrar})` : `Stamp all (${listosTimbrar})`}
                    </button>
                  )}
                  {timbrandoAll && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning-text)" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                      <span style={{ fontSize: "12px", color: "var(--color-warning-text)", fontWeight: 600 }}>{progress}%</span>
                    </div>
                  )}
                </div>

                {/* Resumen timbrado */}
                <div style={{ display: "flex", gap: "16px", marginTop: "10px" }}>
                  {[
                    { l: "Timbrados",    v: timbrados,    color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
                    { l: "Pendientes",   v: pendientes,   color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
                    { l: "Sin RFC/CURP", v: sinDatosRFC,  color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)" },
                  ].map(c => (
                    <div key={c.l} style={{ padding: "6px 12px", borderRadius: "var(--radius-md)", background: c.bg, display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "16px", fontWeight: 900, color: c.color }}>{c.v}</span>
                      <span style={{ fontSize: "10px", color: c.color }}>{c.l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabla empleados */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {loadingEntries ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
                    {es ? "Cargando empleados…" : "Loading employees…"}
                  </div>
                ) : entries.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
                    {es ? "Sin entradas en este período" : "No entries in this period"}
                  </div>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 100px 180px", padding: "7px 20px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", position: "sticky", top: 0 }}>
                      <span>Empleado</span>
                      <span style={{ textAlign: "right" }}>Percep.</span>
                      <span style={{ textAlign: "right" }}>Neto</span>
                      <span style={{ textAlign: "center" }}>Datos SAT</span>
                      <span style={{ textAlign: "right" }}>CFDI</span>
                    </div>
                    {entries.map((entry, i) => {
                      const emp       = entry.employee;
                      const hasDatos  = !!(emp?.rfc && emp?.curp && emp?.nss);
                      const isTimbring = timbrandoId === entry.id;
                      const err       = errors[entry.id];
                      return (
                        <div key={entry.id}
                          style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 100px 180px", padding: "11px 20px", borderBottom: i < entries.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                          {/* Empleado */}
                          <div>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                              {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                            </div>
                            <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{emp?.position}</div>
                            {err && <div style={{ fontSize: "9px", color: "var(--color-danger-text)", marginTop: "2px", lineHeight: 1.3 }}>{err}</div>}
                          </div>

                          <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                            ${fmt(entry.total_perceptions)}
                          </div>
                          <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>
                            ${fmt(entry.net_salary)}
                          </div>

                          {/* Datos SAT */}
                          <div style={{ textAlign: "center" }}>
                            {hasDatos ? (
                              <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: "var(--color-success-bg)", color: "var(--color-success-text)" }}>
                                ✓ Completos
                              </span>
                            ) : (
                              <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: "var(--color-danger-bg)", color: "var(--color-danger-text)" }}>
                                {!emp?.rfc ? "Sin RFC" : !emp?.curp ? "Sin CURP" : "Sin NSS"}
                              </span>
                            )}
                          </div>

                          {/* Estado CFDI */}
                          <div style={{ textAlign: "right" }}>
                            {entry.cfdi_uuid ? (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                                <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: "var(--color-success-bg)", color: "var(--color-success-text)", border: "1px solid var(--color-success-border)" }}>
                                  ✓ Timbrado
                                </span>
                                <span style={{ fontSize: "8px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                                  {entry.cfdi_uuid.substring(0, 6)}…
                                </span>
                              </div>
                            ) : isTimbring ? (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "5px" }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning-text)" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                                <span style={{ fontSize: "10px", color: "var(--color-warning-text)", fontWeight: 600 }}>Timbrando…</span>
                              </div>
                            ) : hasDatos ? (
                              <button onClick={() => timbraEntry(entry)} disabled={timbrandoAll}
                                style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", color: "var(--color-warning-text)", fontSize: "10px", fontWeight: 700, cursor: "pointer", opacity: timbrandoAll ? 0.5 : 1 }}>
                                Timbrar CFDI
                              </button>
                            ) : (
                              <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                                {es ? "Completa datos en Empleados" : "Complete data in Employees"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            {timbrados > 0 && `${timbrados} CFDI${timbrados > 1 ? "s" : ""} timbrado${timbrados > 1 ? "s" : ""} exitosamente`}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {timbrados > 0 && (
              <button onClick={() => { onDone(); onClose(); }}
                style={{ height: "36px", padding: "0 18px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                ✓ {es ? "Ver en historial" : "View in history"}
              </button>
            )}
            <button onClick={onClose}
              style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
              {es ? "Cerrar" : "Close"}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
