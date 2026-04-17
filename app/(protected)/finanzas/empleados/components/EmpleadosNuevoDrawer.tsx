"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { Employee, ContractType, WorkType, SalaryType } from "../types/empleados.types";
import { CONTRACT_TYPE_CONFIG, WORK_TYPE_CONFIG, SALARY_TYPE_CONFIG, DEPARTMENTS } from "../types/empleados.types";

type Props = {
  open:    boolean;
  saving:  boolean;
  onClose: () => void;
  onCreate:(payload: Partial<Employee>) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};
const LABEL: React.CSSProperties = {
  fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)",
  marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px", display: "block",
};
const SECTION_TITLE: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)",
  textTransform: "uppercase", letterSpacing: "1px",
  padding: "8px 0 4px", borderBottom: "1px solid var(--color-border-faint)", marginBottom: "8px",
};

export default function EmpleadosNuevoDrawer({ open, saving, onClose, onCreate }: Props) {
  const { lang, t } = useTranslation();
  const es  = lang !== "en";
  const em  = (t as any).empleados ?? {};
  const [error, setError] = useState<string | null>(null);
  const [tab,   setTab]   = useState<"personal" | "laboral" | "prestaciones">("personal");

  const [form, setForm] = useState<Partial<Employee> & { fondo_ahorro_pct: string; vales_despensa: string; bono_productividad: string }>({
    first_name:        "",
    last_name:         "",
    second_last_name:  "",
    birth_date:        "",
    gender:            "",
    curp:              "",
    rfc:               "",
    nss:               "",
    email:             "",
    phone:             "",
    position:          "",
    department:        "",
    start_date:        new Date().toISOString().split("T")[0],
    contract_type:     "indefinite",
    work_type:         "full_time",
    salary_type:       "monthly",
    base_salary:       undefined,
    bank_name:         "",
    bank_clabe:        "",
    cfdi_nomina_enabled: false,
    fondo_ahorro_pct:  "0",
    vales_despensa:    "0",
    bono_productividad:"0",
  });

  function setF(k: string, v: any) { setForm(p => ({ ...p, [k]: v })); }

  async function handleSubmit() {
    if (!form.first_name?.trim()) { setError("El nombre es requerido"); return; }
    if (!form.last_name?.trim())  { setError("El apellido es requerido"); return; }
    if (!form.position?.trim())   { setError("El puesto es requerido"); return; }
    if (!form.base_salary || form.base_salary <= 0) { setError("El salario es requerido"); return; }
    setError(null);
    try {
      await onCreate({
        first_name:       form.first_name!.trim(),
        last_name:        form.last_name!.trim(),
        second_last_name: form.second_last_name?.trim() || undefined,
        birth_date:       form.birth_date        || undefined,
        gender:           form.gender            || undefined,
        curp:             form.curp?.toUpperCase()|| undefined,
        rfc:              form.rfc?.toUpperCase() || undefined,
        nss:              form.nss               || undefined,
        email:            form.email             || undefined,
        phone:            form.phone             || undefined,
        position:         form.position!.trim(),
        department:       form.department        || undefined,
        start_date:       form.start_date!,
        contract_type:    form.contract_type,
        work_type:        form.work_type,
        salary_type:      form.salary_type,
        base_salary:      form.base_salary,
        bank_name:        form.bank_name         || undefined,
        bank_clabe:       form.bank_clabe        || undefined,
        cfdi_nomina_enabled: form.cfdi_nomina_enabled,
        benefits: {
          fondo_ahorro_pct:   parseFloat(form.fondo_ahorro_pct)   || 0,
          vales_despensa:     parseFloat(form.vales_despensa)     || 0,
          bono_productividad: parseFloat(form.bono_productividad) || 0,
        },
      });
      onClose();
    } catch (e: any) { setError(e.message); }
  }

  if (!open) return null;

  const TABS = [
    { key: "personal" as const,     label: es ? "Personal"     : "Personal"     },
    { key: "laboral" as const,      label: es ? "Laboral"      : "Employment"   },
    { key: "prestaciones" as const, label: es ? "Prestaciones" : "Benefits"     },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 500 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(600px,96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", zIndex: 501, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
            👤 {em.nuevoEmpleado ?? "Nuevo empleado"}
          </div>
          <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Tabs del drawer */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-faint)", padding: "0 24px" }}>
          {TABS.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              style={{ height: "36px", padding: "0 14px", background: "transparent", border: "none", borderBottom: `2px solid ${tab === tb.key ? "var(--color-brand-blue)" : "transparent"}`, color: tab === tb.key ? "var(--color-brand-blue)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: tab === tb.key ? 700 : 400, cursor: "pointer" }}>
              {tb.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "12px", alignContent: "start" }}>
          {error && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{error}</div>}

          {tab === "personal" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={LABEL}>{em.nombre ?? "Nombre"} *</label>
                  <input value={form.first_name} onChange={e => setF("first_name", e.target.value)} placeholder="Juan" style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>{em.apellidoPaterno ?? "Apellido paterno"} *</label>
                  <input value={form.last_name} onChange={e => setF("last_name", e.target.value)} placeholder="García" style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>{em.apellidoMaterno ?? "Apellido materno"}</label>
                  <input value={form.second_last_name ?? ""} onChange={e => setF("second_last_name", e.target.value)} placeholder="López" style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>Fecha de nacimiento</label>
                  <input type="date" value={form.birth_date ?? ""} onChange={e => setF("birth_date", e.target.value)} style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>Género</label>
                  <select value={form.gender ?? ""} onChange={e => setF("gender", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                    <option value="">—</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label style={LABEL}>{em.curp ?? "CURP"}</label>
                  <input value={form.curp ?? ""} onChange={e => setF("curp", e.target.value.toUpperCase())} placeholder="GARL900101HMCRPZ01" maxLength={18} style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>{em.rfc ?? "RFC"}</label>
                  <input value={form.rfc ?? ""} onChange={e => setF("rfc", e.target.value.toUpperCase())} placeholder="GARL900101ABC" maxLength={13} style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>{em.nss ?? "NSS (IMSS)"}</label>
                  <input value={form.nss ?? ""} onChange={e => setF("nss", e.target.value)} placeholder="12345678901" maxLength={11} style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>Email</label>
                  <input type="email" value={form.email ?? ""} onChange={e => setF("email", e.target.value)} style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>Teléfono</label>
                  <input value={form.phone ?? ""} onChange={e => setF("phone", e.target.value)} style={INPUT} />
                </div>
              </div>
              <div style={SECTION_TITLE}>Datos bancarios</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={LABEL}>{em.banco ?? "Banco"}</label>
                  <input value={form.bank_name ?? ""} onChange={e => setF("bank_name", e.target.value)} placeholder="BBVA, Santander…" style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>{em.clabe ?? "CLABE"}</label>
                  <input value={form.bank_clabe ?? ""} onChange={e => setF("bank_clabe", e.target.value)} placeholder="18 dígitos" maxLength={18} style={INPUT} />
                </div>
              </div>
            </>
          )}

          {tab === "laboral" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={LABEL}>{em.puesto ?? "Puesto"} *</label>
                  <input value={form.position ?? ""} onChange={e => setF("position", e.target.value)} placeholder="Gerente de Ventas" style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>{em.departamento ?? "Departamento"}</label>
                  <select value={form.department ?? ""} onChange={e => setF("department", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                    <option value="">— Sin departamento —</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LABEL}>{em.fechaIngreso ?? "Fecha de ingreso"} *</label>
                  <input type="date" value={form.start_date ?? ""} onChange={e => setF("start_date", e.target.value)} style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>{em.tipoContrato ?? "Tipo de contrato"}</label>
                  <select value={form.contract_type} onChange={e => setF("contract_type", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                    {(Object.entries(CONTRACT_TYPE_CONFIG) as [ContractType, any][]).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={LABEL}>{em.tipoJornada ?? "Tipo de jornada"}</label>
                  <select value={form.work_type} onChange={e => setF("work_type", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                    {(Object.entries(WORK_TYPE_CONFIG) as [WorkType, any][]).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={SECTION_TITLE}>Compensación</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={LABEL}>{em.periodicidad ?? "Periodicidad"}</label>
                  <select value={form.salary_type} onChange={e => setF("salary_type", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                    {(Object.entries(SALARY_TYPE_CONFIG) as [SalaryType, any][]).map(([k, v]) => (
                      <option key={k} value={k}>{v.label} ({v.periodsPerYear} períodos/año)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={LABEL}>{em.salarioBase ?? "Salario base"} * (MXN)</label>
                  <input type="number" min="0" value={form.base_salary ?? ""} onChange={e => setF("base_salary", parseFloat(e.target.value) || 0)} placeholder="0.00" style={INPUT} />
                </div>
              </div>

              {form.base_salary && form.base_salary > 0 && (
                <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-brand-blue)" }}>
                  💡 {es ? "Salario anual estimado:" : "Estimated annual salary:"} <strong>MXN ${((form.base_salary ?? 0) * (SALARY_TYPE_CONFIG[form.salary_type ?? "monthly"]?.periodsPerYear ?? 12)).toLocaleString("es-MX", { minimumFractionDigits: 0 })}</strong>
                </div>
              )}

              <div>
                <label style={{ ...LABEL, marginBottom: "8px" }}>CFDI de nómina</label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input type="checkbox" checked={form.cfdi_nomina_enabled ?? false} onChange={e => setF("cfdi_nomina_enabled", e.target.checked)} style={{ width: "16px", height: "16px" }} />
                  <span style={{ fontSize: "12px", color: "var(--color-text-second)" }}>
                    {es ? "Habilitar timbrado de CFDI de nómina para este empleado" : "Enable payroll CFDI stamping for this employee"}
                  </span>
                </div>
              </div>
            </>
          )}

          {tab === "prestaciones" && (
            <>
              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                {es ? "Las prestaciones de ley (aguinaldo 15 días, prima vacacional 25%) se calculan automáticamente. Aquí configura las prestaciones adicionales." : "Mandatory benefits (15-day Christmas bonus, 25% vacation premium) are calculated automatically. Configure additional benefits here."}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={LABEL}>{em.fondoAhorroPct ?? "Fondo de ahorro (%)"}</label>
                  <input type="number" min="0" max="13" value={form.fondo_ahorro_pct} onChange={e => setF("fondo_ahorro_pct", e.target.value)} placeholder="0" style={INPUT} />
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "3px" }}>
                    {es ? "% sobre salario (patrón pone igual, máx 13%)" : "% of salary (employer matches, max 13%)"}
                  </div>
                </div>
                <div>
                  <label style={LABEL}>{em.valesMonto ?? "Vales de despensa (MXN/período)"}</label>
                  <input type="number" min="0" value={form.vales_despensa} onChange={e => setF("vales_despensa", e.target.value)} placeholder="0" style={INPUT} />
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "3px" }}>
                    {es ? "Exentos de ISR hasta el 10% del UMA diario" : "Tax exempt up to 10% of daily UMA"}
                  </div>
                </div>
                <div>
                  <label style={LABEL}>{em.bonoProductividad ?? "Bono de productividad (MXN/período)"}</label>
                  <input type="number" min="0" value={form.bono_productividad} onChange={e => setF("bono_productividad", e.target.value)} placeholder="0" style={INPUT} />
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", paddingTop: "22px" }}>
                  <input type="checkbox" checked={(form.benefits as any)?.sgm ?? false} onChange={e => setF("benefits", { ...form.benefits, sgm: e.target.checked })} style={{ width: "16px", height: "16px", marginTop: "2px" }} />
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-second)" }}>{em.sgm ?? "Seguro de gastos médicos"}</div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{es ? "Marcar si aplica" : "Check if applicable"}</div>
                  </div>
                </div>
              </div>

              {/* Preview costo */}
              {form.base_salary && form.base_salary > 0 && (
                <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
                    {es ? "Preview costo mensual estimado" : "Estimated monthly cost preview"}
                  </div>
                  {(() => {
                    const salary     = form.base_salary ?? 0;
                    const periods    = SALARY_TYPE_CONFIG[form.salary_type ?? "monthly"].periodsPerYear;
                    const monthly    = salary * periods / 12;
                    const fondoPct   = parseFloat(form.fondo_ahorro_pct) / 100;
                    const vales      = parseFloat(form.vales_despensa);
                    const totalMonth = monthly + monthly * fondoPct + vales;
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11px" }}>
                        <span style={{ color: "var(--color-text-muted)" }}>Salario mensual:</span>
                        <span style={{ fontWeight: 700, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>${monthly.toLocaleString("es-MX", { minimumFractionDigits: 0 })}</span>
                        <span style={{ color: "var(--color-text-muted)" }}>Fondo de ahorro patrón:</span>
                        <span style={{ fontWeight: 700, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>${(monthly * fondoPct).toLocaleString("es-MX", { minimumFractionDigits: 0 })}</span>
                        <span style={{ color: "var(--color-text-muted)" }}>Vales de despensa:</span>
                        <span style={{ fontWeight: 700, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>${vales.toLocaleString("es-MX", { minimumFractionDigits: 0 })}</span>
                        <span style={{ color: "var(--color-danger-text)", fontWeight: 800, borderTop: "1px solid var(--color-border-faint)", paddingTop: "4px" }}>Total costo empresa:</span>
                        <span style={{ fontWeight: 900, color: "var(--color-danger-text)", textAlign: "right", borderTop: "1px solid var(--color-border-faint)", paddingTop: "4px", fontVariantNumeric: "tabular-nums" }}>${totalMonth.toLocaleString("es-MX", { minimumFractionDigits: 0 })}</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px" }}>
          <button onClick={handleSubmit} disabled={saving}
            style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? (es ? "Guardando…" : "Saving…") : (es ? "✓ Crear empleado" : "✓ Create employee")}
          </button>
          <button onClick={onClose}
            style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            {es ? "Cancelar" : "Cancel"}
          </button>
        </div>
      </div>
    </>
  );
}
