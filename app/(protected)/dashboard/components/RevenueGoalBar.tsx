"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";

const MONTHLY_GOAL = 100;

export default function RevenueGoalBar() {
  const { companyId } = useTenant();
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [companyId]);

  async function load() {
    if (!companyId) return;
    const { count } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId);
    setCurrent(count ?? 0);
    setLoading(false);
  }

  const pct = Math.min(Math.round((current / MONTHLY_GOAL) * 100), 100);
  const tone = pct >= 80 ? "var(--color-success-text)" : pct >= 50 ? "var(--color-warning-text)" : "var(--color-brand-blue)";
  const barColor = pct >= 80 ? "var(--color-success-text)" : pct >= 50 ? "var(--color-warning-text)" : "var(--color-brand-blue)";

  if (loading) return null;

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "12px 20px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
          Objetivo mensual
        </div>
        <div style={{ fontSize: "18px", fontWeight: 700, color: tone, lineHeight: 1.2 }}>
          {pct}%
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{
          width: "100%",
          height: "8px",
          borderRadius: "var(--radius-full)",
          background: "var(--color-bg-subtle)",
          overflow: "hidden",
        }}>
          <div style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: "var(--radius-full)",
            background: barColor,
            transition: "width 0.6s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            {current} facturas emitidas
          </span>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            Meta: {MONTHLY_GOAL}
          </span>
        </div>
      </div>

      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px" }}>
          Días restantes
        </div>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()}
        </div>
      </div>
    </div>
  );
}
