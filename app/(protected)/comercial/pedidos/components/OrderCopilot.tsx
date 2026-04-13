"use client";

import { useEffect, useState } from "react";
import type { Order } from "../types/orders.types";
import { ORDER_STATUS_CONFIG } from "../types/orders.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { checkOrderStock, checkClientFinancial } from "../services/orders.service";

type Props = { order: Order | null };

export default function OrderCopilot({ order }: Props) {
  const { t, lang }   = useTranslation();
  const { companyId } = useTenant();
  const locale        = lang === "en" ? "en-US" : "es-MX";
  const to            = (t.orders as any) ?? {};

  const [stockCheck, setStockCheck] = useState<{ ok: boolean; alerts: any[] } | null>(null);
  const [financial,  setFinancial]  = useState<{ hasOverdue: boolean; overdueAmount: number } | null>(null);

  useEffect(() => {
    if (!order || !companyId) return;
    setStockCheck(null);
    setFinancial(null);

    checkOrderStock(companyId, order.id).then(setStockCheck);
    if (order.client_id) {
      checkClientFinancial(companyId, order.client_id).then(setFinancial);
    }
  }, [order?.id, companyId]);

  if (!order) return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "18px",
      display: "flex", flexDirection: "column", gap: "10px", height: "100%",
    }}>
      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Copilot
      </div>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
        {to.copilotEmpty ?? "Selecciona un pedido para ver análisis."}
      </div>
    </div>
  );

  const statusCfg   = ORDER_STATUS_CONFIG[order.status];
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";
  const items       = order.items ?? [];

  // Análisis
  const daysOverdue = order.delivery_date
    ? Math.ceil((Date.now() - new Date(order.delivery_date).getTime()) / 86400000)
    : null;
  const isLate = daysOverdue !== null && daysOverdue > 0 && !isDelivered && !isCancelled;

  const completionPct = items.length > 0
    ? Math.round(items.reduce((s, i) => s + (i.quantity_delivered / Math.max(i.quantity, 1)), 0) / items.length * 100)
    : 0;

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "16px",
      display: "flex", flexDirection: "column", gap: "12px",
      height: "100%", minHeight: 0, overflowY: "auto",
    }}>
      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Copilot — {order.order_number}
      </div>

      {/* STATUS */}
      <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: statusCfg.bg, border: `1px solid ${statusCfg.border}`, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Estado</span>
        <span style={{ fontSize: "12px", fontWeight: 800, color: statusCfg.color }}>
          {to[`status${order.status.charAt(0).toUpperCase()}${order.status.slice(1)}`] ?? order.status}
        </span>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "3px" }}>{to.tabItems ?? "Productos"}</div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-brand-blue)" }}>{items.length}</div>
        </div>
        <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "3px" }}>Total</div>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
            ${Number(order.total).toLocaleString(locale, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* PROGRESO ENTREGA */}
      {items.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
            <span style={{ color: "var(--color-text-muted)" }}>Progreso de entrega</span>
            <span style={{ fontWeight: 700, color: completionPct >= 100 ? "var(--color-success-text)" : "var(--color-brand-blue)" }}>
              {completionPct}%
            </span>
          </div>
          <div style={{ height: "6px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "var(--radius-full)", transition: "width 0.5s ease",
              background: completionPct >= 100 ? "var(--color-success-text)" : "var(--color-brand-blue)",
              width: `${completionPct}%`,
            }} />
          </div>
        </div>
      )}

      {/* ENTREGA TARDÍA */}
      {isLate && (
        <div style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", fontSize: "11px", color: "var(--color-danger-text)" }}>
          Entrega con {daysOverdue} día{daysOverdue === 1 ? "" : "s"} de retraso
        </div>
      )}

      {/* STOCK CHECK */}
      {stockCheck && (
        <div style={{ display: "grid", gap: "5px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {to.stockAlert ?? "Stock"}
          </div>
          {stockCheck.ok ? (
            <div style={{ padding: "7px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", fontSize: "11px", color: "var(--color-success-text)" }}>
              ✓ {to.stockOk ?? "Stock disponible para todos los productos"}
            </div>
          ) : (
            stockCheck.alerts.map((a, i) => (
              <div key={i} style={{ padding: "7px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", fontSize: "11px", color: "var(--color-danger-text)" }}>
                ⚠️ <strong>{a.sku}</strong> — Necesita {a.needed}, disponible {a.available}
              </div>
            ))
          )}
        </div>
      )}

      {/* FINANCIERO */}
      {financial && (
        <div style={{ display: "grid", gap: "5px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {to.financialAlert ?? "Situación financiera"}
          </div>
          {financial.hasOverdue ? (
            <div style={{ padding: "7px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "11px", color: "var(--color-warning-text)" }}>
              ⚠️ Cliente con ${financial.overdueAmount.toLocaleString(locale, { maximumFractionDigits: 0 })} MXN vencidos
            </div>
          ) : (
            <div style={{ padding: "7px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", fontSize: "11px", color: "var(--color-success-text)" }}>
              ✓ Cliente sin adeudos
            </div>
          )}
        </div>
      )}

      {/* LISTO PARA FACTURAR */}
      {isDelivered && !order.invoice_id && (
        <div style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "11px", color: "var(--color-warning-text)", fontWeight: 600 }}>
          ⚡ {to.readyToInvoice ?? "Listo para facturar"} — Ve a Finanzas
        </div>
      )}
    </div>
  );
}
