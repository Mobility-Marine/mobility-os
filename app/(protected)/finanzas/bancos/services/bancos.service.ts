import { supabase } from "@/lib/supabaseClient";
import type {
  BankAccount, BankTransaction, BankStats, BankFilters,
  BankAccountType, BankTransactionType, BankTransactionCategory,
} from "../types/bancos.types";

// ── CUENTAS ───────────────────────────────────────────────────
export async function fetchBankAccounts(companyId: string): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as BankAccount[];
}

export async function createBankAccount(
  companyId: string, userId: string,
  payload: {
    name: string; bank_name: string; account_type: BankAccountType;
    account_number?: string; clabe?: string; currency: string;
    opening_balance: number; color?: string; notes?: string;
  }
): Promise<BankAccount> {
  const { data, error } = await supabase
    .from("bank_accounts")
    .insert({
      company_id:      companyId,
      name:            payload.name,
      bank_name:       payload.bank_name,
      account_type:    payload.account_type,
      account_number:  payload.account_number ?? null,
      clabe:           payload.clabe          ?? null,
      currency:        payload.currency,
      opening_balance: payload.opening_balance,
      current_balance: payload.opening_balance, // empieza igual al saldo inicial
      color:           payload.color ?? "#1d4ed8",
      notes:           payload.notes ?? null,
      created_by:      userId,
    })
    .select("*").single();
  if (error) throw new Error(error.message);
  return data as BankAccount;
}

export async function updateBankAccount(
  companyId: string, id: string, updates: Partial<BankAccount>
): Promise<void> {
  const { id: _id, company_id: _cid, created_at: _ca, ...safe } = updates as any;
  await supabase.from("bank_accounts")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

// ── TRANSACCIONES ─────────────────────────────────────────────
export async function fetchTransactions(
  companyId: string, filters: BankFilters, limit = 100
): Promise<BankTransaction[]> {
  let q = supabase
    .from("bank_transactions")
    .select("*, bank_account:bank_accounts!bank_account_id(name, bank_name, color), transfer_to:bank_accounts!transfer_to_id(name)")
    .eq("company_id", companyId)
    .order("transaction_date", { ascending: false })
    .order("created_at",       { ascending: false })
    .limit(limit);

  if (filters.account_id !== "all")  q = q.eq("bank_account_id", filters.account_id);
  if (filters.type       !== "all")  q = q.eq("type", filters.type);
  if (filters.category   !== "all")  q = q.eq("category", filters.category);
  if (filters.from)                  q = q.gte("transaction_date", filters.from);
  if (filters.to)                    q = q.lte("transaction_date", filters.to);
  if (filters.reconciled === "yes")  q = q.eq("reconciled", true);
  if (filters.reconciled === "no")   q = q.eq("reconciled", false);
  if (filters.search) {
    q = q.or(`concept.ilike.%${filters.search}%,reference.ilike.%${filters.search}%`);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as BankTransaction[];
}

export async function createTransaction(
  companyId: string, userId: string,
  payload: {
    bank_account_id:  string;
    type:             BankTransactionType;
    category?:        BankTransactionCategory;
    concept:          string;
    reference?:       string;
    transaction_date: string;
    amount:           number;
    currency:         string;
    exchange_rate?:   number;
    transfer_to_id?:  string;
    notes?:           string;
  }
): Promise<BankTransaction> {
  // Si es transferencia, crear 2 movimientos
  if (payload.type === "transfer_out" && payload.transfer_to_id) {
    const [{ data: out, error: e1 }, { data: inn, error: e2 }] = await Promise.all([
      supabase.from("bank_transactions").insert({
        company_id: companyId, created_by: userId, is_manual: true,
        bank_account_id: payload.bank_account_id,
        type: "transfer_out", category: "transfer",
        concept: payload.concept, reference: payload.reference ?? null,
        transaction_date: payload.transaction_date,
        amount: payload.amount, currency: payload.currency,
        exchange_rate: payload.exchange_rate ?? 1,
        transfer_to_id: payload.transfer_to_id,
        notes: payload.notes ?? null,
        balance_after: 0,
      }).select("*").single(),
      supabase.from("bank_transactions").insert({
        company_id: companyId, created_by: userId, is_manual: true,
        bank_account_id: payload.transfer_to_id,
        type: "transfer_in", category: "transfer",
        concept: payload.concept, reference: payload.reference ?? null,
        transaction_date: payload.transaction_date,
        amount: payload.amount, currency: payload.currency,
        exchange_rate: payload.exchange_rate ?? 1,
        notes: payload.notes ?? null,
        balance_after: 0,
      }).select("*").single(),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    return out as BankTransaction;
  }

  const { data, error } = await supabase
    .from("bank_transactions")
    .insert({
      company_id:      companyId,
      bank_account_id: payload.bank_account_id,
      type:            payload.type,
      category:        payload.category  ?? null,
      concept:         payload.concept,
      reference:       payload.reference ?? null,
      transaction_date:payload.transaction_date,
      amount:          payload.amount,
      currency:        payload.currency,
      exchange_rate:   payload.exchange_rate ?? 1,
      transfer_to_id:  payload.transfer_to_id ?? null,
      notes:           payload.notes     ?? null,
      is_manual:       true,
      balance_after:   0,
      created_by:      userId,
    })
    .select("*").single();
  if (error) throw new Error(error.message);
  return data as BankTransaction;
}

export async function reconcileTransaction(
  companyId: string, id: string, userId: string
): Promise<void> {
  await supabase.from("bank_transactions").update({
    reconciled:    true,
    reconciled_at: new Date().toISOString(),
    reconciled_by: userId,
    updated_at:    new Date().toISOString(),
  }).eq("id", id).eq("company_id", companyId);
}

export async function unreconcileTransaction(
  companyId: string, id: string
): Promise<void> {
  await supabase.from("bank_transactions").update({
    reconciled:    false,
    reconciled_at: null,
    reconciled_by: null,
    updated_at:    new Date().toISOString(),
  }).eq("id", id).eq("company_id", companyId);
}

export async function deleteTransaction(
  companyId: string, id: string
): Promise<void> {
  // Solo permitir eliminar movimientos manuales
  const { data } = await supabase
    .from("bank_transactions").select("is_manual").eq("id", id).single();
  if (!data?.is_manual) throw new Error("Solo se pueden eliminar movimientos manuales");
  await supabase.from("bank_transactions")
    .delete().eq("id", id).eq("company_id", companyId);
}

// ── STATS ─────────────────────────────────────────────────────
export async function fetchBankStats(companyId: string): Promise<BankStats> {
  const today    = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];

  const [{ data: accounts }, { data: txMonth }, { data: ar }, { data: ap }] = await Promise.all([
    supabase.from("bank_accounts").select("current_balance, currency").eq("company_id", companyId).eq("is_active", true),
    supabase.from("bank_transactions").select("type, amount").eq("company_id", companyId).gte("transaction_date", firstDay),
    supabase.from("accounts_receivable").select("balance").eq("company_id", companyId).in("status", ["pending","partial"]),
    supabase.from("accounts_payable").select("balance").eq("company_id", companyId).in("status", ["pending","partial"]),
  ]);

  const total_balance  = (accounts ?? []).reduce((s, a) => s + (a.current_balance ?? 0), 0);
  const total_income   = (txMonth  ?? []).filter(t => ["income","transfer_in"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const total_expense  = (txMonth  ?? []).filter(t => ["expense","transfer_out"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const projected_ar   = (ar       ?? []).reduce((s, r) => s + (r.balance ?? 0), 0);
  const projected_ap   = (ap       ?? []).reduce((s, r) => s + (r.balance ?? 0), 0);

  const { data: unrec } = await supabase
    .from("bank_transactions").select("id", { count: "exact", head: true })
    .eq("company_id", companyId).eq("reconciled", false).eq("is_manual", false);

  return {
    total_balance,
    total_income,
    total_expense,
    net_flow:      total_income - total_expense,
    projected_ar,
    projected_ap,
    projected_net: total_balance + projected_ar - projected_ap,
    unreconciled:  (unrec as any)?.count ?? 0,
  };
}
