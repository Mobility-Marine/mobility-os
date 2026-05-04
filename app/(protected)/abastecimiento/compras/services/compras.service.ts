import { supabase } from "@/lib/supabaseClient";
import type { ComprasDashboard, ComprasActivity, TopSupplier, ComprasAlert } from "../types/compras.types";

export async function fetchDashboard(companyId: string): Promise<ComprasDashboard> {
  const { data, error } = await supabase.rpc("get_compras_dashboard", { p_company_id: companyId });
  if (error || !data) return {
    req_total: 0, req_pending: 0, req_approved: 0,
    rfq_total: 0, rfq_open: 0,
    po_total: 0, po_pending_approval: 0, po_active: 0, po_overdue: 0,
    po_value_active: 0, po_value_month: 0,
    rec_pending: 0, rec_discrepancies: 0,
    stock_alerts: 0, suppliers_active: 0,
  };
  return data as ComprasDashboard;
}

export async function fetchAlerts(companyId: string): Promise<ComprasAlert[]> {
  const alerts: ComprasAlert[] = [];

  // OCs atrasadas
  const { data: overdue } = await supabase
    .from("purchase_orders")
    .select("id, po_number, expected_date, supplier:business_partners!supplier_id(name)")
    .eq("company_id", companyId)
    .in("status", ["approved", "sent", "partial"])
    .lt("expected_date", new Date().toISOString().split("T")[0])
    .order("expected_date")
    .limit(5);

  for (const po of overdue ?? []) {
    const days = Math.floor((Date.now() - new Date(po.expected_date).getTime()) / 86400000);
    alerts.push({
      id: po.id, type: "overdue_po", priority: "high",
      title: `OC ${po.po_number} atrasada ${days} días`,
      subtitle: (po.supplier as any)?.name ?? "—",
      path: "/abastecimiento/ordenes-compra",
      date: po.expected_date,
    });
  }

  // OCs pendientes de aprobación
  const { data: pendingPOs } = await supabase
    .from("purchase_orders")
    .select("id, po_number, total, currency, supplier:business_partners!supplier_id(name), created_at")
    .eq("company_id", companyId)
    .in("status", ["draft", "pending_approval"])
    .order("created_at")
    .limit(5);

  for (const po of pendingPOs ?? []) {
    const days = Math.floor((Date.now() - new Date(po.created_at).getTime()) / 86400000);
    alerts.push({
      id: po.id, type: "pending_approval", priority: days > 3 ? "high" : "medium",
      title: `${po.po_number} pendiente de aprobar`,
      subtitle: `${(po.supplier as any)?.name ?? "—"} · ${po.currency} $${Number(po.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      path: "/abastecimiento/ordenes-compra",
      date: po.created_at,
    });
  }

  // Requisiciones urgentes
  const { data: urgentReqs } = await supabase
    .from("procurement_requisitions")
    .select("id, requisition_number, title, needed_by")
    .eq("company_id", companyId)
    .eq("status", "pending_approval")
    .eq("priority", "urgent")
    .order("needed_by")
    .limit(3);

  for (const req of urgentReqs ?? []) {
    alerts.push({
      id: req.id, type: "urgent_req", priority: "high",
      title: `Req. urgente: ${req.title}`,
      subtitle: req.requisition_number,
      path: "/abastecimiento/requisiciones",
      date: req.needed_by,
    });
  }

  // Recepciones con discrepancias
  const { data: discrep } = await supabase
    .from("purchase_receptions")
    .select("id, reception_number, supplier:business_partners!supplier_id(name)")
    .eq("company_id", companyId)
    .eq("has_discrepancies", true)
    .not("status", "eq", "complete")
    .limit(3);

  for (const rec of discrep ?? []) {
    alerts.push({
      id: rec.id, type: "discrepancy", priority: "medium",
      title: `Recepción ${rec.reception_number} con discrepancias`,
      subtitle: (rec.supplier as any)?.name ?? "—",
      path: "/abastecimiento/recepciones",
    });
  }

  return alerts.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return p[a.priority] - p[b.priority];
  });
}

export async function fetchRecentActivity(companyId: string): Promise<ComprasActivity[]> {
  const activities: ComprasActivity[] = [];

  // OCs recientes
  const { data: pos } = await supabase
    .from("purchase_orders")
    .select("id, po_number, status, total, currency, created_at, updated_at, supplier:business_partners!supplier_id(name)")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false })
    .limit(8);

  for (const po of pos ?? []) {
    const typeMap: Record<string, ComprasActivity["type"]> = {
      draft: "po_created", pending_approval: "po_created",
      approved: "po_approved", sent: "po_sent",
      partial: "po_sent", complete: "po_sent",
    };
    activities.push({
      id: po.id,
      type: typeMap[po.status] ?? "po_created",
      title: `OC ${po.po_number}`,
      subtitle: (po.supplier as any)?.name ?? "—",
      date: po.updated_at ?? po.created_at,
      amount: Number(po.total),
      currency: po.currency,
      status: po.status,
    });
  }

  // Recepciones recientes
  const { data: recs } = await supabase
    .from("purchase_receptions")
    .select("id, reception_number, status, created_at, updated_at, supplier:business_partners!supplier_id(name)")
    .eq("company_id", companyId)
    .eq("status", "complete")
    .order("updated_at", { ascending: false })
    .limit(5);

  for (const rec of recs ?? []) {
    activities.push({
      id: rec.id,
      type: "reception_complete",
      title: `Recepción ${rec.reception_number} completada`,
      subtitle: (rec.supplier as any)?.name ?? "—",
      date: rec.updated_at ?? rec.created_at,
    });
  }

  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
}

export async function fetchTopSuppliers(companyId: string): Promise<TopSupplier[]> {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("supplier_id, total, currency, created_at, supplier:business_partners!supplier_id(id, name)")
    .eq("company_id", companyId)
    .not("status", "eq", "cancelled")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const map: Record<string, { name: string; count: number; value: number; currency: string; last: string }> = {};
  for (const po of data) {
    const sid = po.supplier_id;
    if (!sid) continue;
    if (!map[sid]) map[sid] = { name: (po.supplier as any)?.name ?? "—", count: 0, value: 0, currency: po.currency, last: po.created_at };
    map[sid].count++;
    map[sid].value += Number(po.total ?? 0);
    if (po.created_at > map[sid].last) map[sid].last = po.created_at;
  }

  return Object.entries(map)
    .map(([id, v]) => ({ id, name: v.name, po_count: v.count, total_value: v.value, currency: v.currency, last_po: v.last }))
    .sort((a, b) => b.total_value - a.total_value)
    .slice(0, 6);
}
