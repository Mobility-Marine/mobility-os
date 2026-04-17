export type ContractType = "indefinite" | "fixed_term" | "project" | "per_hour" | "internship";
export type WorkType     = "full_time"  | "part_time"  | "remote"  | "hybrid";
export type SalaryType   = "weekly"     | "biweekly"   | "bimonthly" | "monthly";
export type EmployeeStatus = "active" | "inactive" | "vacation" | "leave" | "terminated";
export type PeriodStatus   = "draft"  | "calculated" | "approved" | "paid" | "cancelled";
export type TimeOffType    = "vacation" | "sick" | "personal" | "maternity" | "paternity" | "unpaid" | "other";
export type TimeOffStatus  = "pending"  | "approved" | "rejected" | "cancelled";

export const SALARY_TYPE_CONFIG: Record<SalaryType, { label: string; periodsPerYear: number }> = {
  weekly:    { label: "Semanal",    periodsPerYear: 52 },
  biweekly:  { label: "Catorcenal", periodsPerYear: 26 },
  bimonthly: { label: "Quincenal",  periodsPerYear: 24 },
  monthly:   { label: "Mensual",    periodsPerYear: 12 },
};

export const CONTRACT_TYPE_CONFIG: Record<ContractType, { label: string }> = {
  indefinite:  { label: "Indefinido"          },
  fixed_term:  { label: "Tiempo determinado"  },
  project:     { label: "Por proyecto"        },
  per_hour:    { label: "Por hora"            },
  internship:  { label: "Prácticas"           },
};

export const WORK_TYPE_CONFIG: Record<WorkType, { label: string; icon: string }> = {
  full_time: { label: "Tiempo completo", icon: "🏢" },
  part_time: { label: "Medio tiempo",    icon: "⏰" },
  remote:    { label: "Remoto",          icon: "🏠" },
  hybrid:    { label: "Híbrido",         icon: "🔄" },
};

export const EMPLOYEE_STATUS_CONFIG: Record<EmployeeStatus, { label: string; color: string; bg: string }> = {
  active:     { label: "Activo",     color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
  inactive:   { label: "Inactivo",   color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)"  },
  vacation:   { label: "Vacaciones", color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)"    },
  leave:      { label: "Permiso",    color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
  terminated: { label: "Baja",       color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)"  },
};

export const PERIOD_STATUS_CONFIG: Record<PeriodStatus, { label: string; color: string; bg: string }> = {
  draft:      { label: "Borrador",    color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)"  },
  calculated: { label: "Calculada",   color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)"    },
  approved:   { label: "Aprobada",    color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
  paid:       { label: "Pagada",      color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
  cancelled:  { label: "Cancelada",   color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)"  },
};

export const TIME_OFF_TYPE_CONFIG: Record<TimeOffType, { label: string; icon: string; color: string }> = {
  vacation:   { label: "Vacaciones",   icon: "🏖️", color: "var(--color-brand-blue)"   },
  sick:       { label: "Incapacidad",  icon: "🏥", color: "var(--color-danger-text)"  },
  personal:   { label: "Personal",     icon: "👤", color: "var(--color-warning-text)" },
  maternity:  { label: "Maternidad",   icon: "👶", color: "#ec4899"                   },
  paternity:  { label: "Paternidad",   icon: "👨‍👶", color: "#8b5cf6"                  },
  unpaid:     { label: "Sin goce",     icon: "💸", color: "var(--color-text-muted)"   },
  other:      { label: "Otro",         icon: "📋", color: "var(--color-text-muted)"   },
};

export const DEPARTMENTS = [
  "Dirección", "Administración", "Comercial", "Operaciones",
  "Logística", "Finanzas", "Recursos Humanos", "TI", "Marketing", "Otro",
];

// Tablas IMSS 2025 (cuotas como % del SBC)
export const IMSS_RATES = {
  // Patrón
  enfermedad_patron:      0.01050,
  maternidad_patron:      0.00700,
  invalidez_patron:       0.01750,
  guarderias_patron:      0.01000,
  vejez_patron:           0.03150,
  retiro_patron:          0.02000,
  // Empleado
  enfermedad_empleado:    0.00375,
  invalidez_empleado:     0.00625,
  vejez_empleado:         0.01125,
  // INFONAVIT patrón
  infonavit_patron:       0.05000,
};

export type EmployeeBenefits = {
  fondo_ahorro_pct?:    number;   // % sobre salario, ej: 5
  vales_despensa?:      number;   // Monto fijo por período
  sgm?:                 boolean;  // Seguro gastos médicos
  bono_productividad?:  number;   // Monto extra
  caja_ahorro_pct?:     number;   // % deducción voluntaria
};

export type Employee = {
  id:                   string;
  company_id:           string;
  first_name:           string;
  last_name:            string;
  second_last_name?:    string | null;
  birth_date?:          string | null;
  gender?:              string | null;
  curp?:                string | null;
  rfc?:                 string | null;
  nss?:                 string | null;
  email?:               string | null;
  phone?:               string | null;
  address?:             string | null;
  city?:                string | null;
  state?:               string | null;
  zip?:                 string | null;
  employee_number?:     string | null;
  position:             string;
  department?:          string | null;
  start_date:           string;
  end_date?:            string | null;
  contract_type:        ContractType;
  work_type:            WorkType;
  status:               EmployeeStatus;
  salary_type:          SalaryType;
  base_salary:          number;
  daily_salary?:        number | null;
  integrated_salary?:   number | null;
  bank_name?:           string | null;
  bank_account?:        string | null;
  bank_clabe?:          string | null;
  benefits:             EmployeeBenefits;
  cfdi_nomina_enabled:  boolean;
  photo_url?:           string | null;
  notes?:               string | null;
  created_at:           string;
  updated_at:           string;
  // Computed
  full_name?:           string;
};

export type PayrollPeriod = {
  id:                   string;
  company_id:           string;
  period_type:          SalaryType;
  period_number:        number;
  year:                 number;
  start_date:           string;
  end_date:             string;
  payment_date:         string;
  status:               PeriodStatus;
  total_perceptions:    number;
  total_deductions:     number;
  total_net:            number;
  employee_count:       number;
  notes?:               string | null;
  created_at:           string;
};

export type PayrollEntry = {
  id:                   string;
  company_id:           string;
  period_id:            string;
  employee_id:          string;
  base_salary:          number;
  overtime_hours:       number;
  overtime_amount:      number;
  bonus:                number;
  vacation_premium:     number;
  christmas_bonus:      number;
  food_vouchers:        number;
  savings_fund_employer:number;
  other_perceptions:    number;
  total_perceptions:    number;
  isr_withheld:         number;
  imss_employee:        number;
  savings_fund_employee:number;
  loans_deduction:      number;
  other_deductions:     number;
  total_deductions:     number;
  net_salary:           number;
  imss_employer:        number;
  infonavit:            number;
  status:               string;
  cfdi_uuid?:           string | null;
  notes?:               string | null;
  // joined
  employee?:            { first_name: string; last_name: string; position: string; salary_type: string } | null;
};

export type EmployeeTimeOff = {
  id:           string;
  company_id:   string;
  employee_id:  string;
  type:         TimeOffType;
  start_date:   string;
  end_date:     string;
  days:         number;
  status:       TimeOffStatus;
  notes?:       string | null;
  created_at:   string;
  employee?:    { first_name: string; last_name: string } | null;
};

export type EmployeeLoan = {
  id:             string;
  company_id:     string;
  employee_id:    string;
  amount:         number;
  balance:        number;
  monthly_payment:number;
  start_date:     string;
  status:         string;
  notes?:         string | null;
  employee?:      { first_name: string; last_name: string } | null;
};

export type EmployeeStats = {
  total:           number;
  active:          number;
  on_vacation:     number;
  terminated_ytd:  number;
  payroll_monthly: number;
  cost_monthly:    number;
  by_department:   Record<string, number>;
};
