export type BankAccountType = "checking" | "savings" | "investment" | "petty_cash";
export type BankTransactionType = "income" | "expense" | "transfer_in" | "transfer_out" | "adjustment";
export type BankTransactionCategory =
  | "client_payment" | "supplier_payment" | "payroll"
  | "tax" | "transfer" | "other";

export const ACCOUNT_TYPE_CONFIG: Record<BankAccountType, { label: string; icon: string; color: string }> = {
  checking:    { label: "Cuenta de cheques", icon: "🏦", color: "var(--color-brand-blue)"   },
  savings:     { label: "Cuenta de ahorro",  icon: "💰", color: "var(--color-success-text)" },
  investment:  { label: "Inversión",         icon: "📈", color: "#8b5cf6"                   },
  petty_cash:  { label: "Caja chica",        icon: "💵", color: "var(--color-warning-text)" },
};

export const TX_TYPE_CONFIG: Record<BankTransactionType, { label: string; color: string; sign: 1 | -1 }> = {
  income:       { label: "Ingreso",             color: "var(--color-success-text)", sign:  1 },
  expense:      { label: "Egreso",              color: "var(--color-danger-text)",  sign: -1 },
  transfer_in:  { label: "Transferencia +",     color: "var(--color-brand-blue)",   sign:  1 },
  transfer_out: { label: "Transferencia −",     color: "#f97316",                  sign: -1 },
  adjustment:   { label: "Ajuste",              color: "var(--color-text-muted)",   sign:  1 },
};

export const TX_CATEGORY_CONFIG: Record<BankTransactionCategory, { label: string; icon: string }> = {
  client_payment:   { label: "Cobro a cliente",     icon: "💳" },
  supplier_payment: { label: "Pago a proveedor",    icon: "📤" },
  payroll:          { label: "Nómina",              icon: "👥" },
  tax:              { label: "Impuesto",            icon: "🏛️" },
  transfer:         { label: "Traspaso",            icon: "🔄" },
  other:            { label: "Otro",                icon: "📝" },
};

export const BANK_NAMES = [
  "BBVA", "Santander", "Banamex / Citibanamex", "Banorte",
  "HSBC", "Scotiabank", "Inbursa", "Bajío", "Afirme",
  "Monexbank", "Mifel", "Banbajío", "Banco del Ejército",
  "CIBanco", "Banca Mifel", "Otro",
];

export type BankAccount = {
  id:               string;
  company_id:       string;
  name:             string;
  bank_name:        string;
  account_type:     BankAccountType;
  account_number?:  string | null;
  clabe?:           string | null;
  currency:         string;
  opening_balance:  number;
  current_balance:  number;
  is_active:        boolean;
  color:            string;
  notes?:           string | null;
  created_at:       string;
  updated_at:       string;
};

export type BankTransaction = {
  id:               string;
  company_id:       string;
  bank_account_id:  string;
  type:             BankTransactionType;
  category?:        BankTransactionCategory | null;
  concept:          string;
  reference?:       string | null;
  transaction_date: string;
  amount:           number;
  balance_after:    number;
  currency:         string;
  exchange_rate:    number;
  ar_payment_id?:   string | null;
  ap_payment_id?:   string | null;
  transfer_to_id?:  string | null;
  reconciled:       boolean;
  reconciled_at?:   string | null;
  is_manual:        boolean;
  notes?:           string | null;
  created_at:       string;
  // joined
  bank_account?:    { name: string; bank_name: string; color: string } | null;
  transfer_to?:     { name: string } | null;
};

export type BankStats = {
  total_balance:    number;
  total_income:     number;
  total_expense:    number;
  net_flow:         number;
  projected_ar:     number;
  projected_ap:     number;
  projected_net:    number;
  unreconciled:     number;
};

export type BankFilters = {
  search:           string;
  type:             BankTransactionType | "all";
  category:         BankTransactionCategory | "all";
  reconciled:       "all" | "yes" | "no";
  account_id:       string | "all";
  from:             string;
  to:               string;
};

export const DEFAULT_BANK_FILTERS: BankFilters = {
  search: "", type: "all", category: "all",
  reconciled: "all", account_id: "all", from: "", to: "",
};
