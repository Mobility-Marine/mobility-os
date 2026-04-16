import { useState, useCallback, useEffect } from "react";
import type { BankAccount, BankTransaction, BankStats, BankFilters } from "../types/bancos.types";
import { DEFAULT_BANK_FILTERS } from "../types/bancos.types";
import {
  fetchBankAccounts, fetchTransactions, fetchBankStats,
  createBankAccount, updateBankAccount,
  createTransaction, reconcileTransaction,
  unreconcileTransaction, deleteTransaction,
} from "./bancos.service";

export function useBancosController(companyId: string, userId: string) {
  const [accounts,      setAccounts]      = useState<BankAccount[]>([]);
  const [transactions,  setTransactions]  = useState<BankTransaction[]>([]);
  const [stats,         setStats]         = useState<BankStats>({
    total_balance: 0, total_income: 0, total_expense: 0, net_flow: 0,
    projected_ar: 0, projected_ap: 0, projected_net: 0, unreconciled: 0,
  });
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [filters,       setFilters]       = useState<BankFilters>(DEFAULT_BANK_FILTERS);
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const load = useCallback(async (f?: BankFilters) => {
    if (!companyId) return;
    setLoading(true); setError(null);
    const active = f ?? filters;
    try {
      const [accs, txs, st] = await Promise.all([
        fetchBankAccounts(companyId),
        fetchTransactions(companyId, active),
        fetchBankStats(companyId),
      ]);
      setAccounts(accs);
      setTransactions(txs);
      setStats(st);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyId, filters]);

  const handleFilter = useCallback((partial: Partial<BankFilters>) => {
    setFilters(p => { const next = { ...p, ...partial }; load(next); return next; });
  }, [load]);

  const handleCreateAccount = useCallback(async (payload: any) => {
    setSaving(true); setError(null);
    try { await createBankAccount(companyId, userId, payload); await load(); }
    catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load]);

  const handleUpdateAccount = useCallback(async (id: string, updates: Partial<BankAccount>) => {
    setSaving(true);
    try { await updateBankAccount(companyId, id, updates); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }, [companyId, load]);

  const handleCreateTransaction = useCallback(async (payload: any) => {
    setSaving(true); setError(null);
    try { await createTransaction(companyId, userId, payload); await load(); }
    catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load]);

  const handleReconcile = useCallback(async (id: string) => {
    try { await reconcileTransaction(companyId, id, userId); await load(); }
    catch (e: any) { setError(e.message); }
  }, [companyId, userId, load]);

  const handleUnreconcile = useCallback(async (id: string) => {
    try { await unreconcileTransaction(companyId, id); await load(); }
    catch (e: any) { setError(e.message); }
  }, [companyId, load]);

  const handleDeleteTransaction = useCallback(async (id: string) => {
    try { await deleteTransaction(companyId, id); await load(); }
    catch (e: any) { setError(e.message); }
  }, [companyId, load]);

  return {
    accounts, transactions, stats, selectedAccount, filters,
    loading, saving, error,
    setSelectedAccount, load, handleFilter,
    handleCreateAccount, handleUpdateAccount,
    handleCreateTransaction, handleReconcile,
    handleUnreconcile, handleDeleteTransaction,
  };
}
