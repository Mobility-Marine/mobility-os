"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  pendingShipments: any[];
  pendingPOs:       any[];
  onRegisterFromShipment: (s: any) => void;
  onRegisterFromPO:       (p: any) => void;
};

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

function getStatus(sh: any) {
  const inv = Number(sh.invoices_count ?? 0);
  const pen = Number(sh.pending_count ?? 0);
  if (pen === 0 && inv === 0) {
    return { label: "Sin captura",                                        color: "#ef4444",                   bg: "rgba(239,68,68,0.1)",      border: "rgba(239,68,68,0.3)",         icon: "🚨" };
  }
  if (pen > 0 && inv === 0) {
    return { label: `${pen} provisional${pen > 1 ? "es" : ""}`,           color: "var(--color-warning-text)", bg: "var(--color-warning-bg)",  border: "var(--color-warning-border)", icon: "🕒" };
  }
  if (pen > 0 && inv > 0) {
    return { label: `${inv} factura${inv > 1 ? "s" : ""} + ${pen} pend.`, color: "var(--color-info-text)",    bg: "var(--color-info-bg)",     border: "var(--color-info-border)",    icon: "🧾" };
  }
  return   { label: `${inv} factura${inv > 1 ? "s" : ""} capturada${inv > 1 ? "s" : ""}`, color: "var(--color-success-text)", bg: "var(--color-success-bg)",  border: "var(--color-success-border)", icon: "✓" };
}

export default function CxPPendientes({ pendingShipments, pendingPOs, onRegisterFromShipment, onRegisterFromPO }: Props) {
  const { lang, t } = useTranslation();
  const es  = lang !== "en";
  const cxp = (t as any).cxp ?? {};

  const actionable = pendingShipments.filter((sh) => {
    const inv = Number(sh.invoices_count ?? 0);
    const pen = Number(sh.pending_count ?? 0);
    return pen > 0 || inv === 0;
  });

  const totalsNoCapture:   Record<string, number> = {};
  const totalsProvisional: Record<string, number> = {};

  for (const sh of actionable) {
    const inv = Number(sh.invoices_count ?? 0);
    const pen = Number(sh.pending_count ?? 0);
    const cur = sh.currency ?? "MXN";
    if (pen === 0 && inv === 0) {
      totalsNoCapture[cur] = (totalsNoCapture[cur] ?? 0) + Number(sh.total ?? 0);
    } else if (pen > 0) {
      totalsProvisional[cur] = (totalsProvisional[cur] ?? 0) + Number(sh.total_captured ?? 0);
    }
  }

  const totalPOs = pendingPOs.reduce((s, po) => s + (po.total ?? 0), 0);

  if (actionable.length === 0 && pendingPOs.length === 0) {
    return (
      <div style={{ padding: "60px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <div style={{ fontSize: "40px" }}>✅</div>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-success-text)" }}>
          {cxp.noPending ?? "Sin pendientes — todo al día"}
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
          {es
            ? "Todos los embarques tienen sus facturas de proveedor capturadas y no hay órdenes de compra pendientes."
            : "All shipments have supplier invoices captured and no pending purchase orders."}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {actionable.length > 0 && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(245,158,11,0.05)", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-warning-text)" }}>
                🚛 {es ? "Embarques pendientes de captura" : "Shipments pending capture"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {actionable.length} {es ? "embarques requieren factura de proveedor" : "shipments need supplier invoice"}
              </div>
            </div>
            {(Object.keys(totalsNoCapture).length > 0 || Object.keys(totalsProvisional).length > 0) && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1px", fontSize: "11px", fontVariantNumeric: "tabular-nums" }}>
                {Object.keys(totalsNoCapture).length > 0 && (
                  <div style={{ color: "#ef4444" }}>
                    🚨 {Object.entries(totalsNoCapture).map(([c, v]) => `${c} $${fmt(v)}`).join(" · ")}
                    <span style={{ color: "var(--color-text-muted)", marginLeft: "4px" }}>{es ? "sin captura" : "uncaptured"}</span>
                  </div>
                )}
                {Object.keys(totalsProvisional).length > 0 && (
                  <div style={{ color: "var(--color-warning-text)" }}>
                    🕒 {Object.entries(totalsProvisional).map(([c, v]) => `${c} $${fmt(v)}`).join(" · ")}
                    <span style={{ color: "var(--color-text-muted)", marginLeft: "4px" }}>{es ? "provisional" : "provisional"}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {actionable.map((sh, i) => {
            const status = getStatus(sh);
            const inv = Number(sh.invoices_count ?? 0);
            const pen = Number(sh.pending_count ?? 0);
            return (
              <div key={sh.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 20px", borderBottom: i < actionable.length - 1 ? "1px solid var(--color-border-faint)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-text-primary)", fontFamily: "monospace" }}>{sh.reference}</span>
                    <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: status.bg, color: status.color, border: `1px solid ${status.border}`, whiteSpace: "nowrap" }}>
                      {status.icon} {status.label}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{sh.client?.name ?? "—"}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    {sh.provider?.name ?? (es ? "Sin proveedor asignado" : "No provider")} · {sh.service_type?.replace(/_/g, " ")}
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {pen > 0 ? (
                    <>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-warning-text)", fontVariantNumeric: "tabular-nums" }}>
                        {sh.currency} ${fmt(Number(sh.total_captured ?? 0))}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{es ? "provisional" : "provisional"}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
                        {sh.currency} ${fmt(Number(sh.total ?? 0))}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{es ? "venta total" : "total revenue"}</div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => onRegisterFromShipment(sh)}
                  title={pen > 0 ? (es ? "Tip: para convertir un costo provisional, abre el embarque desde Logística → Embarques" : "Tip: to convert a provisional cost, open the shipment") : ""}
                  style={{ height: "30px", padding: "0 14px", borderRadius: "var(--radius-md)", background: pen > 0 || inv > 0 ? "var(--color-info-text)" : "var(--color-warning-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {pen > 0 || inv > 0 ? (es ? "+ Otra factura" : "+ Another") : (es ? "Capturar factura" : "Capture invoice")}
                </button>
              </div>
            );
          })}
        </div>
      )}

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