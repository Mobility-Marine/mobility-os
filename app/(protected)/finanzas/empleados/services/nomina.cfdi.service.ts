import type { Employee, PayrollEntry, PayrollPeriod, SalaryType } from "../types/empleados.types";

// ── CATÁLOGOS SAT ─────────────────────────────────────────────
const PERIODICIDAD_MAP: Record<SalaryType, string> = {
  weekly:    "02", // Semanal
  biweekly:  "03", // Catorcenal
  bimonthly: "04", // Quincenal
  monthly:   "05", // Mensual
};

const CONTRATO_MAP: Record<string, string> = {
  indefinite:  "01",
  fixed_term:  "02",
  project:     "03",
  per_hour:    "04",
  internship:  "08",
};

// Tipos de percepción SAT
const PERCEPCION = {
  SUELDO:           "001",
  AGUINALDO:        "002",
  PRIMA_VACACIONAL: "021",
  HORAS_EXTRA:      "019",
  VALES_DESPENSA:   "029",
  FONDO_AHORRO:     "005",
  BONO:             "028",
  OTROS:            "038",
};

// Tipos de deducción SAT
const DEDUCCION = {
  IMSS:         "001",
  ISR:          "002",
  FONDO_AHORRO: "015",
  PRESTAMO:     "009",
  OTROS:        "004",
};

// ── BUILDER PAYLOAD FACTURAPI ─────────────────────────────────
export function buildNominaPayload(
  employee: Employee,
  entry:    PayrollEntry,
  period:   PayrollPeriod,
  issuerSettings: {
    fiscal_name?:    string | null;
    fiscal_rfc?:     string | null;
    fiscal_regime?:  string | null;
    fiscal_zip?:     string | null;
    fiscal_address?: string | null;
    fiscal_state?:   string | null;
  }
) {
  if (!employee.rfc)  throw new Error("El empleado no tiene RFC registrado.");
  if (!employee.curp) throw new Error("El empleado no tiene CURP registrado.");
  if (!employee.nss)  throw new Error("El empleado no tiene NSS registrado.");

  const dailySalary      = employee.daily_salary      ?? (employee.base_salary / 30);
  const integratedSalary = employee.integrated_salary ?? dailySalary;
  const workedDays       = calcWorkedDays(period);
  const periodicity      = PERIODICIDAD_MAP[employee.salary_type] ?? "05";
  const contractType     = CONTRATO_MAP[employee.contract_type]   ?? "01";

  // ── Percepciones ──────────────────────────────────────────
  const percepciones: any[] = [];

  if (entry.base_salary > 0) {
    percepciones.push({
      type:           PERCEPCION.SUELDO,
      key:            PERCEPCION.SUELDO,
      description:    "Sueldo",
      taxed_amount:   entry.base_salary,
      exempt_amount:  0,
    });
  }

  if (entry.overtime_amount > 0) {
    percepciones.push({
      type:           PERCEPCION.HORAS_EXTRA,
      key:            PERCEPCION.HORAS_EXTRA,
      description:    "Horas extra",
      taxed_amount:   entry.overtime_amount,
      exempt_amount:  0,
    });
  }

  if (entry.bonus > 0) {
    percepciones.push({
      type:           PERCEPCION.BONO,
      key:            PERCEPCION.BONO,
      description:    "Bono",
      taxed_amount:   entry.bonus,
      exempt_amount:  0,
    });
  }

  if (entry.vacation_premium > 0) {
    percepciones.push({
      type:           PERCEPCION.PRIMA_VACACIONAL,
      key:            PERCEPCION.PRIMA_VACACIONAL,
      description:    "Prima vacacional",
      taxed_amount:   0,
      exempt_amount:  entry.vacation_premium, // Prima vacacional exenta hasta 15 días UMA
    });
  }

  if (entry.christmas_bonus > 0) {
    percepciones.push({
      type:           PERCEPCION.AGUINALDO,
      key:            PERCEPCION.AGUINALDO,
      description:    "Aguinaldo",
      taxed_amount:   0,
      exempt_amount:  entry.christmas_bonus, // Aguinaldo exento hasta 30 días UMA
    });
  }

  if (entry.food_vouchers > 0) {
    // Vales de despensa: 50% exento hasta el 10% del SMG
    const exento  = Math.min(entry.food_vouchers, entry.food_vouchers * 0.5);
    const gravado = Math.max(0, entry.food_vouchers - exento);
    percepciones.push({
      type:          PERCEPCION.VALES_DESPENSA,
      key:           PERCEPCION.VALES_DESPENSA,
      description:   "Vales de despensa",
      taxed_amount:  gravado,
      exempt_amount: exento,
    });
  }

  if (entry.savings_fund_employer > 0) {
    percepciones.push({
      type:          PERCEPCION.FONDO_AHORRO,
      key:           PERCEPCION.FONDO_AHORRO,
      description:   "Fondo de ahorro (aportación patronal)",
      taxed_amount:  0,
      exempt_amount: entry.savings_fund_employer, // Exento hasta el 13%
    });
  }

  if (entry.other_perceptions > 0) {
    percepciones.push({
      type:          PERCEPCION.OTROS,
      key:           PERCEPCION.OTROS,
      description:   "Otros ingresos",
      taxed_amount:  entry.other_perceptions,
      exempt_amount: 0,
    });
  }

  // ── Deducciones ───────────────────────────────────────────
  const deducciones: any[] = [];

  if (entry.isr_withheld > 0) {
    deducciones.push({
      type:        DEDUCCION.ISR,
      key:         DEDUCCION.ISR,
      description: "ISR",
      amount:      entry.isr_withheld,
    });
  }

  if (entry.imss_employee > 0) {
    deducciones.push({
      type:        DEDUCCION.IMSS,
      key:         DEDUCCION.IMSS,
      description: "Cuota IMSS empleado",
      amount:      entry.imss_employee,
    });
  }

  if (entry.savings_fund_employee > 0) {
    deducciones.push({
      type:        DEDUCCION.FONDO_AHORRO,
      key:         DEDUCCION.FONDO_AHORRO,
      description: "Fondo de ahorro (aportación empleado)",
      amount:      entry.savings_fund_employee,
    });
  }

  if (entry.loans_deduction > 0) {
    deducciones.push({
      type:        DEDUCCION.PRESTAMO,
      key:         DEDUCCION.PRESTAMO,
      description: "Préstamo",
      amount:      entry.loans_deduction,
    });
  }

  if (entry.other_deductions > 0) {
    deducciones.push({
      type:        DEDUCCION.OTROS,
      key:         DEDUCCION.OTROS,
      description: "Otras deducciones",
      amount:      entry.other_deductions,
    });
  }

  // ── Payload Facturapi tipo N ──────────────────────────────
  const invoice = {
    type:   "N",
    date:   new Date(period.payment_date + "T12:00:00").toISOString(),
    employee: {
      curp:             employee.curp,
      social_security:  employee.nss,
      start_date:       employee.start_date,
      contract_type:    contractType,
      worked_days:      workedDays,
      salary_per_day:   Math.round(dailySalary * 100) / 100,
      risk_factor:      "1",        // Clase I por defecto (ajustable)
      periodicity,
      integrated_salary: Math.round(integratedSalary * 100) / 100,
      tax_id:           employee.rfc.toUpperCase(),
      name:             `${employee.last_name} ${employee.second_last_name ?? ""} ${employee.first_name}`.trim().toUpperCase(),
      job_position: {
        code:  "20",                // Código genérico SAT "Empleado en general"
        title: employee.position.substring(0, 100),
      },
      address: {
        municipality_code: "001",
        state_code:        "AGU",   // Ajustable — idealmente viene del empleado
        country_code:      "MEX",
        zip:               "20000",
      },
    },
    payroll: {
      type:       "O",              // O = Ordinaria
      date_start: period.start_date,
      date_end:   period.end_date,
      perceptions:  percepciones,
      deductions:   deducciones,
    },
  };

  return { invoice };
}

function calcWorkedDays(period: PayrollPeriod): number {
  const start = new Date(period.start_date);
  const end   = new Date(period.end_date);
  const days  = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(days, 31));
}

// ── LLAMADA AL API ────────────────────────────────────────────
export async function emitirCFDINomina(
  companyId: string,
  userId:    string,
  employee:  Employee,
  entry:     PayrollEntry,
  period:    PayrollPeriod,
  issuerSettings: any
): Promise<{ cfdi_id: string; uuid: string; facturapi_id: string }> {
  const { invoice } = buildNominaPayload(employee, entry, period, issuerSettings);

  const res = await fetch("/api/facturacion", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action:    "emitir",
      companyId,
      payload: {
        invoice,
        user_id:   userId,
        concepts:  [], // Nómina no lleva conceptos separados
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Error timbrado CFDI de nómina");

  return {
    cfdi_id:      data.cfdi?.id,
    uuid:         data.invoice?.uuid ?? data.cfdi?.uuid,
    facturapi_id: data.invoice?.id,
  };
}
