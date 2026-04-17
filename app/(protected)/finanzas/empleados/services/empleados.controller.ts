import { useState, useCallback } from "react";
import type { Employee, PayrollPeriod, PayrollEntry, EmployeeTimeOff, EmployeeLoan, EmployeeStats, SalaryType } from "../types/empleados.types";
import {
  fetchEmployees, createEmployee, updateEmployee, fetchEmployeeStats,
  fetchPayrollPeriods, fetchPayrollEntries, createPayrollPeriod,
  calculatePayroll, approvePayroll, payPayroll,
  fetchTimeOff, createTimeOff, updateTimeOffStatus,
  fetchLoans, createLoan,
} from "./empleados.service";

export function useEmpleadosController(companyId: string, userId: string) {
  const [employees,       setEmployees]       = useState<Employee[]>([]);
  const [periods,         setPeriods]         = useState<PayrollPeriod[]>([]);
  const [entries,         setEntries]         = useState<PayrollEntry[]>([]);
  const [timeOff,         setTimeOff]         = useState<EmployeeTimeOff[]>([]);
  const [loans,           setLoans]           = useState<EmployeeLoan[]>([]);
  const [stats,           setStats]           = useState<EmployeeStats>({ total: 0, active: 0, on_vacation: 0, terminated_ytd: 0, payroll_monthly: 0, cost_monthly: 0, by_department: {} });
  const [selectedPeriod,  setSelectedPeriod]  = useState<PayrollPeriod | null>(null);
  const [selectedEmployee,setSelectedEmployee]= useState<Employee | null>(null);
  const [loading,         setLoading]         = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try {
      const [emps, pers, st, to, ls] = await Promise.all([
        fetchEmployees(companyId),
        fetchPayrollPeriods(companyId),
        fetchEmployeeStats(companyId),
        fetchTimeOff(companyId),
        fetchLoans(companyId),
      ]);
      setEmployees(emps); setPeriods(pers); setStats(st);
      setTimeOff(to); setLoans(ls);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyId]);

  const loadEntries = useCallback(async (periodId: string) => {
    const data = await fetchPayrollEntries(companyId, periodId);
    setEntries(data);
  }, [companyId]);

  const handleCreateEmployee = useCallback(async (payload: Partial<Employee>) => {
    setSaving(true); setError(null);
    try { await createEmployee(companyId, userId, payload); await load(); }
    catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load]);

  const handleUpdateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    setSaving(true);
    try { await updateEmployee(companyId, id, updates); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }, [companyId, load]);

  const handleCreatePeriod = useCallback(async (payload: any) => {
    setSaving(true); setError(null);
    try { const p = await createPayrollPeriod(companyId, userId, payload); await load(); return p; }
    catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load]);

  const handleCalculate = useCallback(async (periodId: string) => {
    setSaving(true); setError(null);
    try { await calculatePayroll(companyId, userId, periodId); await load(); await loadEntries(periodId); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }, [companyId, userId, load, loadEntries]);

  const handleApprove = useCallback(async (periodId: string) => {
    setSaving(true);
    try { await approvePayroll(companyId, periodId); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }, [companyId, load]);

  const handlePay = useCallback(async (periodId: string) => {
    setSaving(true);
    try { await payPayroll(companyId, userId, periodId); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }, [companyId, userId, load]);

  const handleCreateTimeOff = useCallback(async (payload: any) => {
    setSaving(true);
    try { await createTimeOff(companyId, userId, payload); await load(); }
    catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load]);

  const handleUpdateTimeOff = useCallback(async (id: string, status: string) => {
    try { await updateTimeOffStatus(companyId, id, status, userId); await load(); }
    catch (e: any) { setError(e.message); }
  }, [companyId, userId, load]);

  const handleCreateLoan = useCallback(async (payload: any) => {
    setSaving(true);
    try { await createLoan(companyId, userId, payload); await load(); }
    catch (e: any) { setError(e.message); throw e; }
    finally { setSaving(false); }
  }, [companyId, userId, load]);

  return {
    employees, periods, entries, timeOff, loans, stats,
    selectedPeriod, selectedEmployee,
    loading, saving, error,
    setSelectedPeriod, setSelectedEmployee,
    load, loadEntries,
    handleCreateEmployee, handleUpdateEmployee,
    handleCreatePeriod, handleCalculate, handleApprove, handlePay,
    handleCreateTimeOff, handleUpdateTimeOff, handleCreateLoan,
  };
}
