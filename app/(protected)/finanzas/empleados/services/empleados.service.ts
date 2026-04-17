import { supabase } from "@/lib/supabaseClient";
import type {
  Employee, PayrollPeriod, PayrollEntry,
  EmployeeTimeOff, EmployeeLoan, EmployeeStats,
  SalaryType, ContractType, WorkType, EmployeeStatus,
} from "../types/empleados.types";
import { IMSS_RATES, SALARY_TYPE_CONFIG } from "../types/empleados.types";

// ── HELPERS ───────────────────────────────────────────────────
export function calcDailySalary(baseSalary: number, salaryType: SalaryType): number {
  const daysPerYear = 365;
  const periods     = SALARY_TYPE_CONFIG[salaryType].periodsPerYear;
  const annual      = baseSalary * periods;
  return Math.round((annual / daysPerYear) * 100) / 100;
}

export function calcSBC(dailySalary: number, benefits: any, salaryType: SalaryType): number {
  // SBC = Salario diario + partes proporcionales de prestaciones
  const aguinaldoFactor = 15 / 365;             // 15 días mínimo
  const primaFactor     = 0.25 * 6 / 365;       // Prima vacacional 25% de 6 días base
  const fondoFactor     = (benefits?.fondo_ahorro_pct ?? 0) / 100;
  const valesDiarios    = (benefits?.vales_despensa ?? 0) /
    (365 / SALARY_TYPE_CONFIG[salaryType].periodsPerYear);
  const sbc = dailySalary * (1 + aguinaldoFactor + primaFactor + fondoFactor) + valesDiarios;
  return Math.round(sbc * 100) / 100;
}

// ISR mensual por tarifa Art. 96 LISR
export function calcISRMensual(baseGravable: number): number {
  if (baseGravable <= 0) return 0;
  let isr = 0;
  if      (baseGravable <= 7735.00)   isr = baseGravable * 0.0192;
  else if (baseGravable <= 65651.07)  isr = 148.51   + (baseGravable - 7735.00)   * 0.0640;
  else if (baseGravable <= 115375.90) isr = 3855.14  + (baseGravable - 65651.07)  * 0.1088;
  else if (baseGravable <= 134003.90) isr = 9265.20  + (baseGravable - 115375.90) * 0.1600;
  else if (baseGravable <= 160052.90) isr = 12264.16 + (baseGravable - 134003.90) * 0.1792;
  else if (baseGravable <= 321507.73) isr = 16988.05 + (baseGravable - 160052.90) * 0.2136;
  else if (baseGravable <= 482760.03) isr = 51491.82 + (baseGravable - 321507.73) * 0.2352;
  else if (baseGravable <= 644013.00) isr = 89417.10 + (baseGravable - 482760.03) * 0.3000;
  else                                isr = 137746.90 + (baseGravable - 644013.00)* 0.3200;
  return Math.round(isr * 100) / 100;
}

export function calcNomina(employee: Employee, overrides?: Partial<PayrollEntry>): Partial<PayrollEntry> {
  const salary     = employee.base_salary;
  const benefits   = employee.benefits ?? {};
  const daily      = employee.daily_salary ?? calcDailySalary(salary, employee.salary_type);
  const sbc        = employee.integrated_salary ?? calcSBC(daily, benefits, employee.salary_type);

  // Percepciones
  const overtime_amount    = overrides?.overtime_amount    ?? 0;
  const bonus              = overrides?.bonus              ?? 0;
  const food_vouchers      = benefits.vales_despensa       ?? 0;
  const savings_employer   = salary * ((benefits.fondo_ahorro_pct ?? 0) / 100);
  const other_perceptions  = overrides?.other_perceptions  ?? 0;
  const total_perceptions  = salary + overtime_amount + bonus + food_vouchers + savings_employer + other_perceptions;

  // IMSS empleado sobre SBC
  const imss_employee = Math.round(sbc * (IMSS_RATES.enfermedad_empleado + IMSS_RATES.invalidez_empleado + IMSS_RATES.vejez_empleado) * 100) / 100;

  // ISR — base gravable = total percepciones - prestaciones exentas
  const baseGravable = Math.max(0, total_perceptions - food_vouchers * 0.5); // Vales 50% exentos
  const isr_withheld = calcISRMensual(baseGravable);

  // Fondo de ahorro empleado
  const savings_employee = salary * ((benefits.fondo_ahorro_pct ?? 0) / 100);

  // Préstamos (se calculan por separado)
  const loans_deduction    = overrides?.loans_deduction ?? 0;
  const other_deductions   = overrides?.other_deductions ?? 0;
  const total_deductions   = isr_withheld + imss_employee + savings_employee + loans_deduction + other_deductions;
  const net_salary         = total_perceptions - total_deductions;

  // Cuotas patronales
  const imss_employer = Math.round(sbc * (
    IMSS_RATES.enfermedad_patron + IMSS_RATES.maternidad_patron +
    IMSS_RATES.invalidez_patron  + IMSS_RATES.guarderias_patron +
    IMSS_RATES.vejez_patron      + IMSS_RATES.retiro_patron
  ) * 100) / 100;
  const infonavit = Math.round(sbc * IMSS_RATES.infonavit_patron * 100) / 100;

  return {
    base_salary:           salary,
    overtime_hours:        overrides?.overtime_hours    ?? 0,
    overtime_amount,
    bonus,
    food_vouchers,
    savings_fund_employer: savings_employer,
    other_perceptions,
    total_perceptions:     Math.round(total_perceptions * 100) / 100,
    isr_withheld,
    imss_employee,
    savings_fund_employee: savings_employee,
    loans_deduction,
    other_deductions,
    total_deductions:      Math.round(total_deductions * 100) / 100,
    net_salary:            Math.round(net_salary * 100) / 100,
    imss_employer,
    infonavit,
  };
}

// ── EMPLOYEES CRUD ────────────────────────────────────────────
export async function fetchEmployees(companyId: string): Promise<Employee[]> {
  const { data, error } = await supabase
    .from("employees").select("*")
    .eq("company_id", companyId)
    .order("last_name");
  if (error) throw new Error(error.message);
  return ((data ?? []) as Employee[]).map(e => ({ ...e, full_name: `${e.first_name} ${e.last_name}${e.second_last_name ? " " + e.second_last_name : ""}` }));
}

export async function createEmployee(companyId: string, userId: string, payload: Partial<Employee>): Promise<Employee> {
  const daily   = calcDailySalary(payload.base_salary!, payload.salary_type!);
  const sbc     = calcSBC(daily, payload.benefits ?? {}, payload.salary_type!);
  const { data, error } = await supabase.from("employees").insert({
    company_id:   companyId,
    first_name:   payload.first_name,
    last_name:    payload.last_name,
    second_last_name: payload.second_last_name ?? null,
    birth_date:   payload.birth_date   ?? null,
    gender:       payload.gender       ?? null,
    curp:         payload.curp         ?? null,
    rfc:          payload.rfc          ?? null,
    nss:          payload.nss          ?? null,
    email:        payload.email        ?? null,
    phone:        payload.phone        ?? null,
    address:      payload.address      ?? null,
    city:         payload.city         ?? null,
    state:        payload.state        ?? null,
    zip:          payload.zip          ?? null,
    employee_number: payload.employee_number ?? null,
    position:     payload.position,
    department:   payload.department   ?? null,
    start_date:   payload.start_date,
    contract_type:payload.contract_type ?? "indefinite",
    work_type:    payload.work_type     ?? "full_time",
    status:       "active",
    salary_type:  payload.salary_type   ?? "monthly",
    base_salary:  payload.base_salary,
    daily_salary: daily,
    integrated_salary: sbc,
    bank_name:    payload.bank_name    ?? null,
    bank_account: payload.bank_account ?? null,
    bank_clabe:   payload.bank_clabe   ?? null,
    benefits:     payload.benefits     ?? {},
    cfdi_nomina_enabled: payload.cfdi_nomina_enabled ?? false,
    notes:        payload.notes        ?? null,
    created_by:   userId,
  }).select("*").single();
  if (error) throw new Error(error.message);
  return data as Employee;
}

export async function updateEmployee(companyId: string, id: string, updates: Partial<Employee>): Promise<void> {
  const { id: _id, company_id: _cid, created_at: _ca, full_name: _fn, ...safe } = updates as any;
  if (safe.base_salary && safe.salary_type) {
    safe.daily_salary      = calcDailySalary(safe.base_salary, safe.salary_type);
    safe.integrated_salary = calcSBC(safe.daily_salary, safe.benefits ?? {}, safe.salary_type);
  }
  await supabase.from("employees").update({ ...safe, updated_at: new Date().toISOString() }).eq("id", id).eq("company_id", companyId);
}

// ── PAYROLL ───────────────────────────────────────────────────
export async function fetchPayrollPeriods(companyId: string): Promise<PayrollPeriod[]> {
  const { data } = await supabase.from("payroll_periods").select("*")
    .eq("company_id", companyId).order("year", { ascending: false }).order("period_number", { ascending: false });
  return (data ?? []) as PayrollPeriod[];
}

export async function fetchPayrollEntries(companyId: string, periodId: string): Promise<PayrollEntry[]> {
  const { data } = await supabase.from("payroll_entries")
    .select("*, employee:employees(first_name, last_name, position, salary_type)")
    .eq("company_id", companyId).eq("period_id", periodId);
  return (data ?? []) as PayrollEntry[];
}

export async function createPayrollPeriod(companyId: string, userId: string, payload: {
  period_type:   SalaryType;
  period_number: number;
  year:          number;
  start_date:    string;
  end_date:      string;
  payment_date:  string;
}): Promise<PayrollPeriod> {
  const { data, error } = await supabase.from("payroll_periods").insert({
    company_id:    companyId,
    ...payload,
    status:        "draft",
    created_by:    userId,
  }).select("*").single();
  if (error) throw new Error(error.message);
  return data as PayrollPeriod;
}

export async function calculatePayroll(companyId: string, userId: string, periodId: string): Promise<void> {
  // Traer empleados activos
  const { data: employees } = await supabase.from("employees").select("*")
    .eq("company_id", companyId).eq("status", "active");
  if (!employees?.length) return;

  // Traer préstamos activos
  const { data: loans } = await supabase.from("employee_loans").select("employee_id, monthly_payment")
    .eq("company_id", companyId).eq("status", "active");
  const loanMap: Record<string, number> = {};
  for (const l of (loans ?? [])) loanMap[l.employee_id] = (loanMap[l.employee_id] ?? 0) + l.monthly_payment;

  const entries = employees.map(emp => {
    const calc = calcNomina(emp as Employee, { loans_deduction: loanMap[emp.id] ?? 0 });
    return {
      company_id:            companyId,
      period_id:             periodId,
      employee_id:           emp.id,
      ...calc,
      status:                "calculated",
      created_by:            userId,
    };
  });

  // Upsert entradas
  await supabase.from("payroll_entries").upsert(entries, { onConflict: "period_id,employee_id" });

  // Totales del período
  const totalP = entries.reduce((s, e) => s + (e.total_perceptions ?? 0), 0);
  const totalD = entries.reduce((s, e) => s + (e.total_deductions  ?? 0), 0);
  const totalN = entries.reduce((s, e) => s + (e.net_salary        ?? 0), 0);

  await supabase.from("payroll_periods").update({
    status:            "calculated",
    total_perceptions: Math.round(totalP * 100) / 100,
    total_deductions:  Math.round(totalD * 100) / 100,
    total_net:         Math.round(totalN * 100) / 100,
    employee_count:    entries.length,
    updated_at:        new Date().toISOString(),
  }).eq("id", periodId);
}

export async function approvePayroll(companyId: string, periodId: string): Promise<void> {
  await supabase.from("payroll_periods").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", periodId).eq("company_id", companyId);
  await supabase.from("payroll_entries").update({ status: "approved", updated_at: new Date().toISOString() }).eq("period_id", periodId).eq("company_id", companyId);
}

export async function payPayroll(companyId: string, userId: string, periodId: string): Promise<void> {
  // Obtener período
  const { data: period } = await supabase.from("payroll_periods").select("*").eq("id", periodId).single();
  if (!period) throw new Error("Período no encontrado");

  // Crear CXP tipo operating categoría payroll
  await supabase.from("accounts_payable").insert({
    company_id:       companyId,
    supplier_type:    "operating",
    supplier_name:    "Nómina",
    document_type:    "expense",
    document_date:    period.payment_date,
    currency:         "MXN",
    subtotal:         period.total_net,
    tax_amount:       0,
    total:            period.total_net,
    balance:          period.total_net,
    expense_category: "payroll",
    status:           "pending",
    payment_status:   "not_scheduled",
    notes:            `Nómina período ${period.period_number}/${period.year}`,
    created_by:       userId,
  });

  await supabase.from("payroll_periods").update({ status: "paid", updated_at: new Date().toISOString() }).eq("id", periodId).eq("company_id", companyId);
  await supabase.from("payroll_entries").update({ status: "paid", updated_at: new Date().toISOString() }).eq("period_id", periodId).eq("company_id", companyId);
}

// ── TIME OFF ──────────────────────────────────────────────────
export async function fetchTimeOff(companyId: string): Promise<EmployeeTimeOff[]> {
  const { data } = await supabase.from("employee_time_off")
    .select("*, employee:employees(first_name, last_name)")
    .eq("company_id", companyId).order("created_at", { ascending: false });
  return (data ?? []) as EmployeeTimeOff[];
}

export async function createTimeOff(companyId: string, userId: string, payload: {
  employee_id: string; type: string; start_date: string; end_date: string; days: number; notes?: string;
}): Promise<void> {
  await supabase.from("employee_time_off").insert({ company_id: companyId, ...payload, status: "pending", created_by: userId });
}

export async function updateTimeOffStatus(companyId: string, id: string, status: string, approvedBy: string): Promise<void> {
  await supabase.from("employee_time_off").update({ status, approved_by: approvedBy }).eq("id", id).eq("company_id", companyId);
}

// ── LOANS ─────────────────────────────────────────────────────
export async function fetchLoans(companyId: string): Promise<EmployeeLoan[]> {
  const { data } = await supabase.from("employee_loans")
    .select("*, employee:employees(first_name, last_name)")
    .eq("company_id", companyId).order("created_at", { ascending: false });
  return (data ?? []) as EmployeeLoan[];
}

export async function createLoan(companyId: string, userId: string, payload: {
  employee_id: string; amount: number; monthly_payment: number; start_date: string; notes?: string;
}): Promise<void> {
  await supabase.from("employee_loans").insert({ company_id: companyId, ...payload, balance: payload.amount, status: "active", created_by: userId });
}

// ── STATS ─────────────────────────────────────────────────────
export async function fetchEmployeeStats(companyId: string): Promise<EmployeeStats> {
  const { data: employees } = await supabase.from("employees").select("status, department, base_salary, salary_type, integrated_salary, benefits")
    .eq("company_id", companyId);

  const today    = new Date();
  const firstYear = `${today.getFullYear()}-01-01`;

  const { data: terminated } = await supabase.from("employees").select("id")
    .eq("company_id", companyId).eq("status", "terminated").gte("end_date", firstYear);

  const active       = (employees ?? []).filter(e => e.status === "active");
  const on_vacation  = (employees ?? []).filter(e => e.status === "vacation").length;

  const payroll_monthly = active.reduce((s, e) => {
    const periods = SALARY_TYPE_CONFIG[e.salary_type as SalaryType]?.periodsPerYear ?? 12;
    const monthly = e.base_salary * periods / 12;
    return s + monthly;
  }, 0);

  const cost_monthly = active.reduce((s, e) => {
    const periods = SALARY_TYPE_CONFIG[e.salary_type as SalaryType]?.periodsPerYear ?? 12;
    const monthly = e.base_salary * periods / 12;
    const sbc     = e.integrated_salary ?? e.base_salary / 30;
    const imss_p  = sbc * (IMSS_RATES.enfermedad_patron + IMSS_RATES.maternidad_patron + IMSS_RATES.invalidez_patron + IMSS_RATES.guarderias_patron + IMSS_RATES.vejez_patron + IMSS_RATES.retiro_patron);
    const info_p  = sbc * IMSS_RATES.infonavit_patron;
    return s + monthly + imss_p * 30 + info_p * 30;
  }, 0);

  const by_department: Record<string, number> = {};
  for (const e of active) {
    const dep = e.department ?? "Sin departamento";
    by_department[dep] = (by_department[dep] ?? 0) + 1;
  }

  return {
    total:          (employees ?? []).length,
    active:         active.length,
    on_vacation,
    terminated_ytd: (terminated ?? []).length,
    payroll_monthly: Math.round(payroll_monthly),
    cost_monthly:    Math.round(cost_monthly),
    by_department,
  };
}
