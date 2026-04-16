"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  pendingShipments: any[];
  pendingPOs:       any[];
  onRegisterFromShipment: (s: any) => void;
  onRegisterFromPO:       (p: any) => void;
};

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function CxPPendientes({ pendingShipments, pendingPOs, onRegisterFromShipment, onRegisterFromPO }: Props) {
  const { lang, t } = useTranslation();
  const es  = lang !== "en";
  const cxp = (t as any).cxp ?? {};

  const totalShipments = pendingShipments.reduce((s, sh) => s + (sh.provider_cost ?? 0), 0);
  const totalPOs       = pendingPOs.reduce((s, po) => s + (po.total ?? 0), 0);

  if (pendingShipments.length === 0 && pendingPOs.length === 0) {
    return (
      <div style={{ padding: "60px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <div style={{ fontSize: "40px" }}>✅</div>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-success-text)" }}>{cxp.noPending ?? "Sin pendientes — todo al día"}</div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
          {es ? "Todos los embarques facturados y órdenes de compra tienen su factura de proveedor registrada." : "All invoiced shipments and purchase orders have their supplier invoice registered."}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Embarques sin factura proveedor */}
      {pendingShipments.length > 0 && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(245,158,11,0.05)" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-warning-text)" }}>
                🚛 {cxp.pendingShipments ?? "Embarques sin factura de proveedor"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {pendingShipments.length} {es ? "embarques facturados con costo de proveedor sin registrar" : "invoiced shipments with unregistered provider cost"}
              </div>
            </div>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "var(--color-warning-text)", fontVariantNumeric: "tabular-nums" }}>
              ${fmt(totalShipments)}
            </div>
          </div>
          {pendingShipments.map((sh, i) => (
            <div key={sh.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 20px", borderBottom: i < pendingShipments.length - 1 ? "1px solid var(--color-border-faint)" : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-text-primary)", fontFamily: "monospace" }}>{sh.reference}</span>
                  <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{sh.client?.name ?? "—"}</span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                  Proveedor: {sh.provider?.name ?? "Sin asignar"} · {sh.service_type?.replace(/_/g, " ")}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
                  {sh.currency} ${fmt(sh.provider_cost)}
                </div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{es ? "costo proveedor" : "provider cost"}</div>
              </div>
              <button onClick={() => onRegisterFromShipment(sh)}
                style={{ height: "30px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                {cxp.registerInvoice ?? "Registrar factura"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Órdenes de compra sin factura */}
      {pendingPOs.length > 0 && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(59,130,246,0.05)" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-brand-blue)" }}>
                📦 {cxp.pendingPOs ?? "Órdenes de compra sin factura"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {pendingPOs.length} {es ? "OC recibidas sin factura de proveedor" : "received POs without supplier invoice"}
              </div>
            </div>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>
              ${fmt(totalPOs)}
            </div>
          </div>
          {pendingPOs.map((po, i) => (
            <div key={po.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 20px", borderBottom: i < pendingPOs.length - 1 ? "1px solid var(--color-border-faint)" : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-text-primary)", fontFamily: "monospace" }}>{po.po_number}</span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                  {po.supplier?.name ?? "—"} · {po.order_date ? new Date(po.order_date).toLocaleDateString("es-MX") : "—"}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>
                  {po.currency} ${fmt(po.total)}
                </div>
              </div>
              <button onClick={() => onRegisterFromPO(po)}
                style={{ height: "30px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                {cxp.registerInvoice ?? "Registrar factura"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
