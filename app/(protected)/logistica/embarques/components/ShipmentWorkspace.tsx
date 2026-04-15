"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Shipment, ShipmentStatus, ShipmentService, ServiceLineType } from "../types/shipments.types";
import { SHIPMENT_STATUS_CONFIG, SERVICE_TYPE_CONFIG, NEXT_STATUS, STATUS_FLOW, SERVICE_LINE_TYPES, INCOTERMS, CURRENCIES, SHIPMENT_SERVICE_TYPES } from "../types/shipments.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { upsertShipmentService, deleteShipmentService } from "../services/shipments.service";

type Tab = "detail" | "services" | "documents" | "service_orders" | "timeline";

type Props = {
  shipment:       Shipment | null;
  onStatusChange: (id: string, status: ShipmentStatus) => Promise<void>;
  onUpdate:       (id: string, updates: Partial<Shipment>) => Promise<void>;
  onReload:       () => Promise<void>;
  saving:         boolean;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

export default function ShipmentWorkspace({ shipment, onStatusChange, onUpdate, onReload, saving }: Props) {
  const { t, lang }   = useTranslation();
  const { companyId } = useTenant();
  const router        = useRouter();
  const tl            = (t.logistics as any) ?? {};
  const locale        = lang === "en" ? "en-US" : "es-MX";

  const [tab,          setTab]          = useState<Tab>("detail");
  const [editing,      setEditing]      = useState(false);
  const [form,         setForm]         = useState<Partial<Shipment>>({});
  const [confirmNext,  setConfirmNext]  = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Services
  const [addingSvc,    setAddingSvc]    = useState(false);
  const [svcForm,      setSvcForm]      = useState<Partial<ShipmentService>>({ service_type: "terrestre", currency: "USD", price: 0, cost: 0 });
  const [savingSvc,    setSavingSvc]    = useState(false);

  if (!shipment) return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", height: "100%" }}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        {tl.workspaceEmpty ?? "Selecciona un servicio"}
      </div>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "300px", lineHeight: 1.6 }}>
        {tl.workspaceEmptyDesc ?? "Aquí verás el detalle del embarque, servicios y documentos."}
      </div>
    </div>
  );

  const stCfg      = SHIPMENT_STATUS_CONFIG[shipment.status];
  const svcCfg     = SERVICE_TYPE_CONFIG[shipment.service_type];
  const nextStatus = NEXT_STATUS[shipment.status];
  const isCancelled = shipment.status === "cancelled";
  const isDelivered = ["delivered","invoiced"].includes(shipment.status);
  const isDone      = isCancelled || isDelivered;
  const services    = shipment.services ?? [];

  function getStatusLabel(s: ShipmentStatus): string {
    const key = `status${s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`;
    return tl[key] ?? s;
  }

  function getNextLabel(): string {
    if (!nextStatus) return "";
    const labels: Partial<Record<ShipmentStatus, string>> = {
      coordinating:      tl.confirmCoordinating  ?? "Confirmar coordinación",
      pickup_scheduled:  tl.confirmPickup        ?? "Confirmar recolección",
      in_transit:        tl.confirmInTransit     ?? "Confirmar en tránsito",
      at_destination:    tl.confirmAtDest        ?? "Confirmar en destino",
      delivered:         tl.confirmDelivered     ?? "Confirmar entrega",
    };
    return labels[nextStatus] ?? `Avanzar a ${getStatusLabel(nextStatus)}`;
  }

  async function handleAdvance() {
    if (!nextStatus) return;
    await onStatusChange(shipment.id, nextStatus);
    setConfirmNext(false);
  }

  async function handleCancel() {
    await onStatusChange(shipment.id, "cancelled");
    setConfirmCancel(false);
  }

  async function handleSaveService() {
    if (!companyId || !svcForm.description?.trim()) return;
    setSavingSvc(true);
    try {
      await upsertShipmentService(companyId, shipment.id, svcForm as any);
      await onReload();
      setAddingSvc(false);
      setSvcForm({ service_type: "terrestre", currency: "USD", price: 0, cost: 0 });
    } finally { setSavingSvc(false); }
  }

  async function handleDeleteService(serviceId: string) {
    if (!companyId) return;
    await deleteShipmentService(companyId, shipment.id, serviceId);
    await onReload();
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "detail",         label: tl.tabDetail        ?? "Detalle"              },
    { key: "services",       label: `${tl.tabServices  ?? "Servicios"} (${services.length})` },
    { key: "documents",      label: tl.tabDocuments     ?? "Documentos"           },
    { key: "service_orders", label: tl.tabServiceOrders ?? "Órdenes de servicio"  },
    { key: "timeline",       label: tl.tabTimeline      ?? "Historial"            },
  ];

  const profitPct = shipment.total > 0 ? ((shipment.profit ?? 0) / shipment.total) * 100 : 0;

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>

      {/* HEADER */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: svcCfg.color, fontFamily: "monospace" }}>
                {shipment.reference}
              </span>
              <span style={{ padding: "2px 8px", borderRadius: "var(--radius-full)", background: stCfg.bg, border: `1px solid ${stCfg.border}`, fontSize: "10px", fontWeight: 700, color: stCfg.color, textTransform: "uppercase" }}>
                {getStatusLabel(shipment.status)}
              </span>
              <span style={{ fontSize: "10px", color: svcCfg.color, background: `${svcCfg.color}15`, padding: "2px 7px", borderRadius: "var(--radius-full)", border: `1px solid ${svcCfg.color}30` }}>
                {tl[`service${shipment.service_type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`] ?? shipment.service_type}
              </span>
              {shipment.quotation?.quote_number && (
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  ← {shipment.quotation.quote_number}
                </span>
              )}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>
              {shipment.client?.name ?? "—"}
              {(shipment.origin || shipment.destination) && ` · ${[shipment.origin, shipment.destination].filter(Boolean).join(" → ")}`}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
              {shipment.currency} ${Number(shipment.total ?? 0).toLocaleString(locale, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: "11px", color: profitPct >= 20 ? "var(--color-success-text)" : "var(--color-warning-text)", fontWeight: 700 }}>
              {tl.margin ?? "Margen"}: {profitPct.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* PROGRESO */}
        {!isCancelled && (
          <div style={{ display: "flex", gap: "0", marginBottom: "10px", alignItems: "center" }}>
            {STATUS_FLOW.map((s, i) => {
              const sCfg = SHIPMENT_STATUS_CONFIG[s];
              const done = sCfg.step < stCfg.step;
              const cur  = s === shipment.status;
              const label = getStatusLabel(s);
              return (
                <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <div style={{ flex: 1, height: "2px", background: done || cur ? sCfg.color : "var(--color-border-faint)" }} />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: done ? "var(--color-success-text)" : cur ? sCfg.color : "var(--color-border-faint)", border: `2px solid ${done ? "var(--color-success-text)" : cur ? sCfg.color : "var(--color-border-faint)"}` }} />
                    <span style={{ fontSize: "8px", color: cur ? sCfg.color : "var(--color-text-muted)", fontWeight: cur ? 700 : 400, whiteSpace: "nowrap" }}>
                      {label}
                    </span>
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div style={{ flex: 1, height: "2px", background: done ? "var(--color-success-text)" : "var(--color-border-faint)" }} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {/* Avanzar estado */}
          {nextStatus && !isDone && (
            !confirmNext ? (
              <button onClick={() => setConfirmNext(true)} disabled={saving} style={{
                height: "28px", padding: "0 14px", borderRadius: "var(--radius-md)",
                background: SHIPMENT_STATUS_CONFIG[nextStatus].color, color: "#fff", border: "none",
                fontSize: "11px", fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "5px",
              }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                {getNextLabel()}
              </button>
            ) : (
              <>
                <button onClick={handleAdvance} disabled={saving} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                  {saving ? t.general.loading : "✓ Confirmar"}
                </button>
                <button onClick={() => setConfirmNext(false)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                  {t.general.cancel}
                </button>
              </>
            )
          )}

          {/* Editar */}
          {!isDone && !editing && (
            <button onClick={() => { setForm({ ...shipment }); setEditing(true); }} style={{
              height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
              background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
              color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "4px",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {t.general.edit}
            </button>
          )}

          {editing && (
            <>
              <button onClick={async () => { await onUpdate(shipment.id, form); setEditing(false); setForm({}); }} disabled={saving} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                {saving ? t.general.loading : `✓ ${t.general.save}`}
              </button>
              <button onClick={() => { setEditing(false); setForm({}); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                {t.general.cancel}
              </button>
            </>
          )}

          {/* Crear orden de servicio */}
          {!isDone && (
            <button onClick={() => router.push("/logistica/ordenes-servicio")} style={{
              height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
              background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)",
              color: "var(--color-info-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
            }}>
              {tl.createServiceOrder ?? "Orden de servicio"}
            </button>
          )}

          {/* Facturar */}
          {shipment.status === "delivered" && !shipment.invoice_id && (
            <button onClick={() => router.push("/finanzas/facturacion")} style={{
              height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
              background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)",
              color: "var(--color-warning-text)", fontSize: "11px", fontWeight: 700, cursor: "pointer",
            }}>
              ⚡ {tl.generateInvoice ?? "Generar factura"}
            </button>
          )}

          {/* Cancelar */}
          {!isDone && (
            !confirmCancel ? (
              <button onClick={() => setConfirmCancel(true)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                {tl.cancelShipment ?? "Cancelar"}
              </button>
            ) : (
              <>
                <button onClick={handleCancel} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                  ¿Confirmar cancelación?
                </button>
                <button onClick={() => setConfirmCancel(false)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                  {(t.general as any).no ?? "No"}
                </button>
              </>
            )
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0, overflowX: "auto" }}>
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            height: "36px", padding: "0 12px", border: "none", background: "transparent", whiteSpace: "nowrap",
            borderBottom: tab === tb.key ? "2px solid var(--color-brand-blue)" : "2px solid transparent",
            color: tab === tb.key ? "var(--color-brand-blue)" : "var(--color-text-muted)",
            fontSize: "12px", fontWeight: tab === tb.key ? 700 : 400, cursor: "pointer",
          }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>

        {/* ── DETAIL ── */}
        {tab === "detail" && (
          <div style={{ display: "grid", gap: "12px" }}>
            {editing ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {([
                  { k: "origin",              label: tl.origin              ?? "Origen",           cols: "" },
                  { k: "destination",         label: tl.destination         ?? "Destino",          cols: "" },
                  { k: "origin_country",      label: tl.originCountry       ?? "País origen",      cols: "" },
                  { k: "destination_country", label: tl.destinationCountry  ?? "País destino",     cols: "" },
                  { k: "pickup_date",         label: tl.pickupDate          ?? "Fecha recolección", type: "date" },
                  { k: "estimated_delivery",  label: tl.estimatedDelivery   ?? "Entrega estimada",  type: "date" },
                  { k: "tracking_number",     label: tl.trackingNumber      ?? "No. rastreo",      cols: "" },
                  { k: "provider_cost",       label: tl.cost                ?? "Costo proveedor",  type: "number" },
                ] as any[]).map((f) => (
                  <div key={f.k} style={{ gridColumn: f.cols === "1 / -1" ? "1 / -1" : "auto" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
                    <input type={f.type ?? "text"} value={(form as any)[f.k] ?? ""} onChange={(e) => setForm((p) => ({ ...p, [f.k]: f.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))} style={INPUT} />
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Incoterm</div>
                  <select value={(form as any).incoterm ?? ""} onChange={(e) => setForm((p) => ({ ...p, incoterm: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                    <option value="">—</option>
                    {INCOTERMS.map((inc) => <option key={inc} value={inc}>{inc}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Moneda</div>
                  <select value={(form as any).currency ?? "USD"} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tl.notes ?? "Notas"}</div>
                  <textarea rows={2} value={(form as any).notes ?? ""} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "14px" }}>
                {[
                  { label: tl.reference         ?? "Referencia",     value: shipment.reference },
                  { label: tl.serviceType       ?? "Tipo",           value: tl[`service${shipment.service_type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`] ?? shipment.service_type },
                  { label: tl.origin            ?? "Origen",         value: shipment.origin },
                  { label: tl.destination       ?? "Destino",        value: shipment.destination },
                  { label: tl.originCountry     ?? "País origen",    value: shipment.origin_country },
                  { label: tl.destinationCountry ?? "País destino",  value: shipment.destination_country },
                  { label: tl.incoterm          ?? "Incoterm",       value: shipment.incoterm },
                  { label: tl.provider          ?? "Proveedor",      value: shipment.provider?.name },
                  { label: tl.pickupDate        ?? "Recolección",    value: shipment.pickup_date ? new Date(shipment.pickup_date).toLocaleDateString(locale) : null },
                  { label: tl.estimatedDelivery ?? "Entrega est.",   value: shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleDateString(locale) : null },
                  { label: tl.trackingNumber    ?? "Rastreo",        value: shipment.tracking_number },
                  { label: tl.currency          ?? "Moneda",         value: shipment.currency },
                ].map((r) => r.value ? (
                  <div key={r.label}>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{r.label}</div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{r.value}</div>
                  </div>
                ) : null)}
              </div>
            )}

            {/* FINANCIERO */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {[
                { label: tl.revenue ?? "Ingreso",   value: shipment.total,         color: "var(--color-success-text)" },
                { label: tl.cost    ?? "Costo",     value: shipment.provider_cost, color: "var(--color-danger-text)"  },
                { label: tl.profit  ?? "Ganancia",  value: shipment.profit ?? 0,   color: (shipment.profit ?? 0) >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)" },
              ].map((r) => (
                <div key={r.label} style={{ padding: "10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>{r.label}</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: r.color, fontVariantNumeric: "tabular-nums" }}>
                    {shipment.currency} ${Number(r.value ?? 0).toLocaleString(locale, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>

            {/* Barra de margen */}
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "6px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>{tl.margin ?? "Margen"}</span>
                <span style={{ fontWeight: 800, color: profitPct >= 20 ? "var(--color-success-text)" : profitPct >= 10 ? "var(--color-warning-text)" : "var(--color-danger-text)" }}>
                  {profitPct.toFixed(1)}%
                </span>
              </div>
              <div style={{ height: "6px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: "var(--radius-full)", transition: "width 0.5s ease",
                  background: profitPct >= 20 ? "var(--color-success-text)" : profitPct >= 10 ? "var(--color-warning-text)" : "var(--color-danger-text)",
                  width: `${Math.min(Math.max(profitPct, 0), 100)}%`,
                }} />
              </div>
            </div>

            {shipment.notes && (
              <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.6 }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.notes ?? "Notas"}</div>
                {shipment.notes}
              </div>
            )}
          </div>
        )}

        {/* ── SERVICES ── */}
        {tab === "services" && (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                {tl.shipmentServices ?? "Servicios del embarque"}
              </div>
              {!addingSvc && (
                <button onClick={() => setAddingSvc(true)} style={{
                  height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)",
                  background: "var(--color-brand-blue)", color: "#fff", border: "none",
                  fontSize: "11px", fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "5px",
                }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  {tl.addService ?? "Agregar servicio"}
                </button>
              )}
            </div>

            {/* Formulario agregar servicio */}
            {addingSvc && (
              <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", display: "grid", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Tipo *</div>
                    <select value={svcForm.service_type ?? "terrestre"} onChange={(e) => setSvcForm((p) => ({ ...p, service_type: e.target.value as ServiceLineType }))} style={{ ...INPUT, cursor: "pointer" }}>
                      {SERVICE_LINE_TYPES.map((type) => (
                        <option key={type} value={type} style={{ textTransform: "capitalize" }}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Descripción *</div>
                    <input value={svcForm.description ?? ""} onChange={(e) => setSvcForm((p) => ({ ...p, description: e.target.value }))} placeholder="Flete terrestre GDL-CDMX…" style={INPUT} />
                  </div>
                  {[
                    { k: "origin",       label: "Origen",      type: "text" },
                    { k: "destination",  label: "Destino",     type: "text" },
                    { k: "transit_time", label: "Tiempo tránsito", type: "text" },
                    { k: "incoterm",     label: "Incoterm",    type: "text" },
                  ].map((f) => (
                    <div key={f.k}>
                      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{f.label}</div>
                      <input value={(svcForm as any)[f.k] ?? ""} onChange={(e) => setSvcForm((p) => ({ ...p, [f.k]: e.target.value }))} style={INPUT} />
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.servicePrice ?? "Precio venta"} *</div>
                    <input type="number" min="0" value={svcForm.price ?? 0} onChange={(e) => setSvcForm((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))} style={INPUT} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.serviceCost ?? "Costo proveedor"}</div>
                    <input type="number" min="0" value={svcForm.cost ?? 0} onChange={(e) => setSvcForm((p) => ({ ...p, cost: parseFloat(e.target.value) || 0 }))} style={INPUT} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Moneda</div>
                    <select value={svcForm.currency ?? "USD"} onChange={(e) => setSvcForm((p) => ({ ...p, currency: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleSaveService} disabled={savingSvc || !svcForm.description?.trim()} style={{ height: "32px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    {savingSvc ? t.general.loading : t.general.save}
                  </button>
                  <button onClick={() => { setAddingSvc(false); setSvcForm({ service_type: "terrestre", currency: "USD", price: 0, cost: 0 }); }} style={{ height: "32px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
                    {t.general.cancel}
                  </button>
                </div>
              </div>
            )}

            {/* Lista de servicios */}
            {services.length === 0 && !addingSvc ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                {tl.noServices ?? "Sin servicios capturados"}
              </div>
            ) : services.map((svc) => {
              const svcMargin = svc.price > 0 ? ((svc.price - svc.cost) / svc.price) * 100 : 0;
              return (
                <div key={svc.id} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gap: "5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-brand-blue)", background: "var(--color-info-bg)", padding: "1px 6px", borderRadius: "var(--radius-full)", border: "1px solid var(--color-info-border)", textTransform: "capitalize" }}>
                      {svc.service_type}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", flex: 1 }}>
                      {svc.description}
                    </span>
                    <button onClick={() => handleDeleteService(svc.id)} style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "10px", fontSize: "11px" }}>
                    {svc.origin && <span style={{ color: "var(--color-text-muted)" }}>{svc.origin} → {svc.destination}</span>}
                    {svc.transit_time && <span style={{ color: "var(--color-text-muted)" }}>⏱ {svc.transit_time}</span>}
                    {svc.incoterm && <span style={{ color: "var(--color-text-muted)" }}>{svc.incoterm}</span>}
                  </div>
                  <div style={{ display: "flex", gap: "12px", fontSize: "11px" }}>
                    <span style={{ color: "var(--color-success-text)", fontWeight: 700 }}>
                      {svc.currency} ${Number(svc.price).toLocaleString(locale, { minimumFractionDigits: 2 })}
                    </span>
                    {svc.cost > 0 && (
                      <>
                        <span style={{ color: "var(--color-danger-text)" }}>
                          Costo: ${Number(svc.cost).toLocaleString(locale, { minimumFractionDigits: 2 })}
                        </span>
                        <span style={{ color: svcMargin >= 20 ? "var(--color-success-text)" : "var(--color-warning-text)", fontWeight: 700 }}>
                          {svcMargin.toFixed(0)}% margen
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab === "documents" && (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
            La documentación de este servicio se gestiona en el módulo <strong>Documentación</strong>.
            Los documentos subidos para este servicio ({shipment.reference}) aparecerán aquí conectados.
          </div>
        )}

        {/* ── SERVICE ORDERS ── */}
        {tab === "service_orders" && (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)" }}>
              Las órdenes de servicio son opcionales. Genera una CCP+Carta, BOL USA o Carta Aduanal desde el módulo de Órdenes de Servicio vinculada a este embarque.
            </div>
            <button onClick={() => router.push("/logistica/ordenes-servicio")} style={{
              height: "36px", padding: "0 16px", borderRadius: "var(--radius-md)",
              background: "var(--color-brand-blue)", color: "#fff", border: "none",
              fontSize: "12px", fontWeight: 700, cursor: "pointer", width: "fit-content",
            }}>
              {tl.createServiceOrder ?? "Crear orden de servicio"}
            </button>
          </div>
        )}

        {/* ── TIMELINE ── */}
        {tab === "timeline" && (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "12px", color: "var(--color-text-muted)" }}>
              Historial de cambios — {shipment.reference}
            </div>
            {[
              { label: "Servicio creado",        date: shipment.created_at,         color: "var(--color-brand-blue)",   icon: "+" },
              { label: "En recolección",         date: shipment.pickup_date,        color: "#a78bfa",                   icon: "↑" },
              { label: "Entrega estimada",       date: shipment.estimated_delivery, color: "var(--color-warning-text)", icon: "→" },
              { label: "Entregado",              date: shipment.actual_delivery,    color: "var(--color-success-text)", icon: "✓" },
            ].filter((e) => e.date).map((event, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, background: `${event.color}20`, border: `1px solid ${event.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: event.color }}>
                  {event.icon}
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{event.label}</div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                    {new Date(event.date!).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
