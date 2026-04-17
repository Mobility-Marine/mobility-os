"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";

export interface DashboardMetrics {
  activeProspects:   number;
  openQuotations:    number;
  activeShipments:   number;
  pendingInvoices:   number;   // CFDIs válidos emitidos
  criticalPending:   number;   // compat
  delayedShipments:  number;   // embarques logísticos con retraso real
  cxcBalance:        number;   // saldo por cobrar desde CXC
  monthlyGoal:       number;   // objetivo mensual desde Settings
  monthlyGoalMetric: string;   // "invoices" | "amount"
}

const REFRESH_INTERVAL_MS = 60_000;

export function useDashboard() {
  const { companyId } = useTenant();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeProspects:   0,
    openQuotations:    0,
    activeShipments:   0,
    pendingInvoices:   0,
    criticalPending:   0,
    delayedShipments:  0,
    cxcBalance:        0,
    monthlyGoal:       100,
    monthlyGoalMetric: "invoices",
  });
  const [loading, setLoading]         = useState(true);
  const [companyState, setCompanyState] = useState<any>(null);
  const channelRef  = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!companyId) return;
    void loadMetrics();
    setupRealtime();
    startPolling();
    return () => cleanup();
  }, [companyId]);

  function startPolling() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => void loadMetrics(), REFRESH_INTERVAL_MS);
  }

  function setupRealtime() {
    if (!companyId) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel(`dashboard-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "prospects",           filter: `company_id=eq.${companyId}` }, () => void loadMetrics())
      .on("postgres_changes", { event: "*", schema: "public", table: "quotations",          filter: `company_id=eq.${companyId}` }, () => void loadMetrics())
      .on("postgres_changes", { event: "*", schema: "public", table: "shipments",           filter: `company_id=eq.${companyId}` }, () => void loadMetrics())
      .on("postgres_changes", { event: "*", schema: "public", table: "cfdi_documents",      filter: `company_id=eq.${companyId}` }, () => void loadMetrics())
      .on("postgres_changes", { event: "*", schema: "public", table: "accounts_receivable", filter: `company_id=eq.${companyId}` }, () => void loadMetrics())
      .subscribe();
    channelRef.current = channel;
  }

  function cleanup() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (channelRef.current) supabase.removeChannel(channelRef.current);
  }

  async function loadMetrics() {
    if (!companyId) return;
    try {
      const now = new Date().toISOString();
      const [prospects, quotations, shipments, invoices, delayed, cxc, goalSettings] = await Promise.all([
        supabase.from("prospects")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId).eq("is_active", true),
        supabase.from("quotations")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId).not("status", "in", "(rejected,expired,cancelled)"),
        supabase.from("shipments")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId).not("status", "in", "(delivered,invoiced,cancelled)"),
        supabase.from("cfdi_documents")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId).eq("status", "valid"),
        // Solo embarques logísticos reales con retraso — excluye seguro y consultoría
        supabase.from("shipments")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .lt("estimated_delivery", now)
          .not("status", "in", "(delivered,invoiced,cancelled)")
          .not("service_type", "in", "(seguro,consultoria)"),
        // Saldo por cobrar desde CXC
        supabase.from("accounts_receivable")
          .select("balance")
          .eq("company_id", companyId)
          .in("status", ["pending", "partial"]),
        // Objetivo mensual desde Settings
        supabase.from("company_settings")
          .select("monthly_goal, monthly_goal_metric")
          .eq("company_id", companyId)
          .maybeSingle(),
      ]);

      const cxcTotal = (cxc.data ?? []).reduce((sum: number, r: any) => sum + (parseFloat(r.balance) || 0), 0);
      const goal     = (goalSettings.data as any)?.monthly_goal        ?? 100;
      const metric   = (goalSettings.data as any)?.monthly_goal_metric ?? "invoices";

      setMetrics({
        activeProspects:   prospects.count  ?? 0,
        openQuotations:    quotations.count ?? 0,
        activeShipments:   shipments.count  ?? 0,
        pendingInvoices:   invoices.count   ?? 0,
        criticalPending:   invoices.count   ?? 0,
        delayedShipments:  delayed.count    ?? 0,
        cxcBalance:        cxcTotal,
        monthlyGoal:       goal,
        monthlyGoalMetric: metric,
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
      const res  = await fetch(`/api/ai/company-state?companyId=${companyId}`);
      const json = await res.json();
      setCompanyState(json);
    } catch (err) {
      console.error("Company state error:", err);
    }
  }

  return { metrics, loading, companyState, loadCompanyState, refresh: loadMetrics };
}
