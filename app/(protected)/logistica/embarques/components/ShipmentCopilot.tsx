"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { Shipment } from "../types/shipments.types";
import { SHIPMENT_STATUS_CONFIG, SERVICE_TYPE_CONFIG, SERVICE_TYPE_CATEGORY } from "../types/shipments.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = { shipment: Shipment | null };

type APProvider = { supplier_name: string; total: number; currency: string };

export default function ShipmentCopilot({ shipment }: Props) {
  const { t, lang } = useTranslation();
  const { companyId } = useTenant();
  const tl     = (t.logistics as any) ?? {};
  const locale = lang === "en" ? "en-US" : "es-MX";

  const [apProviders, setApProviders] = useState<APProvider[]>([]);

  useEffect(() => {
    if (!shipment?.id || !companyId) { setApProviders([]); return; }
    supabase.from("accounts_payable")
      .select("supplier_name, total, currency")
      .eq("company_id", companyId)
      .eq("related_shipment_id", shipment.id)
      .then(({ data }) => setApProviders(data ?? []));
  }, [shipment?.id, companyId]);

  if (!shipment) return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", gap: "10px", height: "100%" }}>
      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Copilot</div>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
        {tl.copilotEmpty ?? "Selecciona un embarque para ver análisis."}
      </div>
    </div>
  );

  const stCfg     = SHIPMENT_STATUS_CONFIG[shipment.status];
  const totalRevForMargin = shipment.totals_by_currency
    ? Object.values(shipment.totals_by_currency).reduce((s, v) => s + v.total, 0)
    : (shipment.total ?? 0);
  const profitPct = totalRevForMargin > 0 ? ((shipment.profit ?? 0) / totalRevForMargin) * 100 : 0;
  const isLate    = shipment.estimated_delivery && !["delivered","invoiced","cancelled"].includes(shipment.status)
    ? new Date(shipment.estimated_delivery).getTime() < Date.now() : false;
  const daysLate  = isLate && shipment.estimated_delivery
    ? Math.ceil((Date.now() - new Date(shipment.estimated_delivery).getTime()) / 86400000) : 0;

  const isReadyToInvoice = shipment.status === "delivered" && !shipment.invoice_id;
  const isConsulting     = SERVICE_TYPE_CATEGORY[shipment.service_type] === "consulting";

  // Sin proveedor = no tiene provider_id NI facturas de proveedor en AP
  const hasNoProvider = (!isConsulting || shipment.service_type === "seguro")
    && !shipment.provider_id
    && apProviders.length === 0
    && !["cancelled"].includes(shipment.status);

  // Costos agrupados por moneda desde AP
  const costsByCurrency = apProviders.reduce((acc, ap) => {
    const cur = ap.currency ?? shipment.currency;
    acc[cur]  = (acc[cur] ?? 0) + Number(ap.total ?? 0);
    return acc;
  }, {} as Record<string, number>);

  const hasMixedCurrencies = Object.keys(costsByCurrency).some(c => c !== shipment.currency);

  // Nombre del proveedor a mostrar: preferir AP si no hay provider_id
  const providerDisplay = shipment.provider?.name
    ?? (apProviders.length > 0
      ? apProviders.map(ap => ap.supplier_name).join(", ")
      : "—");

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", height: "100%", minHeight: 0, overflowY: "auto" }}>
      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Copilot — {shipment.reference}
      </div>

      {/* STATUS */}
      <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: stCfg.bg, border: `1px solid ${stCfg.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Estado</span>
        <span style={{ fontSize: "12px", fontWeight: 800, color: stCfg.color }}>
          {tl[`status${shipment.status.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`] ?? shipment.status}
        </span>
      </div>

      {/* FINANCIERO */}
      <div>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
          {tl.profitAnalysis ?? "Rentabilidad"}
        </div>
        <div style={{ display: "grid", gap: "5px" }}>
          {/* Ingreso — multi-moneda */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "5px 8px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{tl.revenue ?? "Ingreso"}</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1px" }}>
              {shipment.totals_by_currency && Object.keys(shipment.totals_by_currency).length > 0
                ? Object.entries(shipment.totals_by_currency)
                    .filter(([, v]) => v.total > 0)
                    .map(([cur, vals]) => (
                      <span key={cur} style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                        {cur} ${vals.total.toLocaleString(locale, { minimumFractionDigits: 2 })}
                      </span>
                    ))
                : (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                    {shipment.currency} ${Number(shipment.total ?? 0).toLocaleString(locale, { minimumFractionDigits: 2 })}
                  </span>
                )
              }
            </div>
          </div>

          {/* Costo — separado por moneda */}
          <div style={{ padding: "5px 8px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{tl.cost ?? "Costo"}</span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                {Object.keys(costsByCurrency).length > 0 ? (
                  Object.entries(costsByCurrency).map(([cur, total]) => (
                    <span key={cur} style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
                      {cur} ${Number(total).toLocaleString(locale, { minimumFractionDigits: 2 })}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
                    {shipment.currency} ${Number(shipment.provider_cost ?? 0).toLocaleString(locale, { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Ganancia */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{tl.profit ?? "Ganancia"}</span>
            {hasMixedCurrencies ? (
              <span style={{ fontSize: "10px", color: "var(--color-text-muted)", fontStyle: "italic" }}>Monedas mixtas</span>
            ) : (
              <span style={{ fontSize: "11px", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: (shipment.profit ?? 0) >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)" }}>
                {shipment.currency} ${Number(shipment.profit ?? 0).toLocaleString(locale, { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>

          {/* Margen */}
          <div style={{ padding: "6px 8px", borderRadius: "var(--radius-sm)", background: profitPct >= 20 ? "var(--color-success-bg)" : profitPct >= 10 ? "var(--color-warning-bg)" : "var(--color-danger-bg)", border: `1px solid ${profitPct >= 20 ? "var(--color-success-border)" : profitPct >= 10 ? "var(--color-warning-border)" : "var(--color-danger-border)"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)" }}>{tl.margin ?? "Margen"}</span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: profitPct >= 20 ? "var(--color-success-text)" : profitPct >= 10 ? "var(--color-warning-text)" : "var(--color-danger-text)" }}>
                {hasMixedCurrencies ? "—" : `${profitPct.toFixed(1)}%`}
              </span>
            </div>
            {!hasMixedCurrencies && (
              <div style={{ height: "4px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "5px" }}>
                <div style={{ height: "100%", width: `${Math.min(Math.max(profitPct, 0), 100)}%`, background: profitPct >= 20 ? "var(--color-success-text)" : profitPct >= 10 ? "var(--color-warning-text)" : "var(--color-danger-text)", borderRadius: "var(--radius-full)" }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ALERTAS */}
      {isLate && (
        <div style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", fontSize: "11px", color: "var(--color-danger-text)", fontWeight: 600 }}>
          ⚠️ {tl.overdueDelivery ?? "Entrega vencida"} — {daysLate} {tl.daysLate ?? "días de retraso"}
        </div>
      )}
      {hasNoProvider && (
        <div style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "11px", color: "var(--color-warning-text)" }}>
          ⚠️ {tl.noProviderAlert ?? "Sin proveedor asignado"}
        </div>
      )}
      {!isConsulting && !shipment.pickup_date && !["delivered","invoiced","cancelled"].includes(shipment.status) && (
        <div style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "11px", color: "var(--color-warning-text)" }}>
          ⚠️ {tl.noPickupDate ?? "Sin fecha de recolección definida"}
        </div>
      )}
      {isReadyToInvoice && (
        <div style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", fontSize: "11px", color: "var(--color-success-text)", fontWeight: 700 }}>
          ⚡ {tl.readyToInvoice ?? "Listo para facturar"} — Ve a Finanzas
        </div>
      )}

      {/* INFO */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        {[
          { label: "Cliente",      value: shipment.client?.name ?? "—" },
          { label: "Proveedor",    value: providerDisplay },
          { label: "Recolección",  value: shipment.pickup_date
              ? new Date(shipment.pickup_date).toLocaleDateString(locale) : "—" },
          { label: "Entrega est.", value: shipment.estimated_delivery
              ? new Date(shipment.estimated_delivery).toLocaleDateString(locale) : "—" },
        ].map((r) => (
          <div key={r.label} style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-sm)", padding: "7px 8px" }}>
            <div style={{ fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "2px" }}>{r.label}</div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.value}</div>
          </div>
        ))}
      </div>

      {/* Proveedores facturados detalle — si hay AP */}
      {apProviders.length > 0 && (
        <div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "5px" }}>
            Factura(s) de proveedor
          </div>
          {apProviders.map((ap, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", color: "var(--color-text-second)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{ap.supplier_name}</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
                {ap.currency} ${Number(ap.total).toLocaleString(locale, { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
