import { useState, useCallback } from "react";
import type { ComprasDashboard, ComprasAlert, ComprasActivity, TopSupplier } from "../types/compras.types";
import { DEFAULT_DASHBOARD } from "../types/compras.types";
import { fetchDashboard, fetchAlerts, fetchRecentActivity, fetchTopSuppliers } from "./compras.service";

export function useComprasController(companyId: string) {
  const [dashboard,  setDashboard]  = useState<ComprasDashboard>(DEFAULT_DASHBOARD);
  const [alerts,     setAlerts]     = useState<ComprasAlert[]>([]);
  const [activity,   setActivity]   = useState<ComprasActivity[]>([]);
  const [suppliers,  setSuppliers]  = useState<TopSupplier[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try {
      const [dash, alts, act, sups] = await Promise.all([
        fetchDashboard(companyId),
        fetchAlerts(companyId),
        fetchRecentActivity(companyId),
        fetchTopSuppliers(companyId),
      ]);
      setDashboard(dash);
      setAlerts(alts);
      setActivity(act);
      setSuppliers(sups);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyId]);

  return { dashboard, alerts, activity, suppliers, loading, error, load };
}
