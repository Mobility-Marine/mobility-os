"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";

export interface DashboardMetrics {
  activeProspects: number;
  openQuotations: number;
  activeShipments: number;
  pendingInvoices: number;
  criticalPending: number;
}

export function useDashboard() {
  const { companyId } = useTenant();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeProspects: 0,
    openQuotations: 0,
    activeShipments: 0,
    pendingInvoices: 0,
    criticalPending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [companyState, setCompanyState] = useState<any>(null);

  useEffect(() => {
    if (!companyId) return;
    void loadMetrics();
  }, [companyId]);

  async function loadMetrics() {
    if (!companyId) return;
    setLoading(true);
    try {
      const [prospects, quotations, shipments, invoices] = await Promise.all([
        supabase.from("prospects").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        supabase.from("quotations").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        supabase.from("shipments").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        supabase.from("invoices").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      ]);
      const pending = invoices.count ?? 0;
      setMetrics({
        activeProspects: prospects.count ?? 0,
        openQuotations: quotations.count ?? 0,
        activeShipments: shipments.count ?? 0,
        pendingInvoices: pending,
        criticalPending: pending,
      });
    } catch (err) {
      console.error("Dashboard metrics error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCompanyState() {
    if (!companyId) return;
    try {
      const res = await fetch(`/api/ai/company-state?companyId=${companyId}`);
      const json = await res.json();
      setCompanyState(json);
    } catch (err) {
      console.error("Company state error:", err);
    }
  }

  return { metrics, loading, companyState, loadCompanyState, refresh: loadMetrics };
}
