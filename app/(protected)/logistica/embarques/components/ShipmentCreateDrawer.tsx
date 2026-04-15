"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth }   from "@/lib/auth/AuthProvider";
import type { Shipment, ShipmentServiceType } from "../types/shipments.types";
import { SHIPMENT_SERVICE_TYPES, SERVICE_TYPE_CONFIG, SERVICE_TYPE_CATEGORY, INCOTERMS, CURRENCIES } from "../types/shipments.types";
import { fetchAcceptedServiceQuotations, fetchQuotationServices, fetchAvgPrice } from "../services/shipments.service";
import { supabase } from "@/lib/supabaseClient";

type CreateMode = "quotation" | "direct";
type Props = {
  open:     boolean;
  onClose:  () => void;
  onCreated:(shipment: Shipment) => void;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "3px" }}>{hint}</div>}
    </div>
  );
}

// Etiquetas legibles para cada tipo de servicio
const SERVICE_TYPE_LABELS: Record<ShipmentServiceType, string> = {
  terrestre_mx:  "Terrestre MX",
  terrestre_usa: "Terrestre USA",
  maritimo:      "Marítimo",
  aereo:         "Aéreo",
  multimodal:    "Multimodal",
  almacenaje:    "Almacenaje",
  aduanal:       "Aduanal",
  consultoria:   "Consultoría",
  seguro:        "Seguro",
  otro:          "Otro",
};

export default function ShipmentCreateDrawer({ open, onClose, onCreated }: Props) {
  const { t, lang }   = useTranslation();
  const { companyId } = useTenant();
  const { user }      = useAuth();
  const tl            = (t.logistics as any) ?? {};
  const locale        = lang === "en" ? "en-US" : "es-MX";

  const [mode,           setMode]           = useState<CreateMode>("direct");
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  // Cotizaciones aceptadas
  const [quotations,     setQuotations]     = useState<any[]>([]);
  const [selectedQuot,   setSelectedQuot]   = useState<any | null>(null);
  const [quotSearch,     setQuotSearch]     = useState("");

  // Clientes
  const [clients,        setClients]        = useState<any[]>([]);
  const [clientSearch,   setClientSearch]   = useState("");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [showClientDD,   setShowClientDD]   = useState(false);

  // Precio sugerido
  const [avgPrice,       setAvgPrice]       = useState<{ avg: number; count: number } | null>(null);

  const [form, setForm] = useState({
    service_type:        "terrestre_mx" as ShipmentServiceType,
    origin:              "",
    destination:         "",
    origin_country:      "México",
    destination_country: "México",
    incoterm:            "",
    currency:            "USD",
    total:               "",
    provider_cost:       "",
    pickup_date:         "",
    estimated_delivery:  "",
    notes:               "",
  });

  function setF(k: string, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  // Determinar si el tipo seleccionado es logístico o de consultoría
  const isLogistics = SERVICE_TYPE_CATEGORY[form.service_type] === "logistics";

  useEffect(() => {
    if (!open || !companyId) return;
    fetchAcceptedServiceQuotations(companyId).then(setQuotations);
    supabase.from("clients").select("id, name, rfc, email").eq("company_id", companyId).order("name")
      .then(({ data }) => setClients(data ?? []));
  }, [open, companyId]);

  // Sugerir precio solo para servicios logísticos con ruta definida
  useEffect(() => {
    if (!companyId || !form.service_type || !isLogistics) { setAvgPrice(null); return; }
    if (!form.origin && !form.destination) { setAvgPrice(null); return; }
    fetchAvgPrice(companyId, form.service_type, form.origin || undefined, form.destination || undefined)
      .then(setAvgPrice);
  }, [companyId, form.service_type, form.origin, form.destination, isLogistics]);

  function handleClose() {
    setMode("direct"); setSelectedQuot(null); setSelectedClient(null);
    setQuotSearch(""); setClientSearch(""); setAvgPrice(null);
    setForm({
      service_type: "terrestre_mx", origin: "", destination: "",
      origin_country: "México", destination_country: "México",
      incoterm: "", currency: "USD", total: "", provider_cost: "",
      pickup_date: "", estimated_delivery: "", notes: "",
    });
    setError(null); onClose();
  }

  async function handleCreate() {
    if (!companyId || !user) return;
    const clientName = selectedClient?.name ?? selectedQuot?.client?.name ?? "GEN";
    const total      = parseFloat(form.total) || 0;
    const provCost   = parseFloat(form.provider_cost) || 0;
    setSaving(true); setError(null);
    try {
      const { createShipment } = await import("../services/shipments.service");
      const shipment = await createShipment(companyId, user.id, {
        clientName,
        quotation_id:        selectedQuot?.id                              ?? null,
        client_id:           selectedClient?.id ?? selectedQuot?.client_id ?? null,
        service_type:        form.service_type,
        origin:              isLogistics ? (form.origin       || null) : null,
        destination:         isLogistics ? (form.destination  || null) : null,
        origin_country:      isLogistics ? (form.origin_country  || "México") : null,
        destination_country: isLogistics ? (form.destination_country || "México") : null,
        incoterm:            isLogistics ? (form.incoterm     || null) : null,
        currency:            form.currency,
        subtotal:            total,
        tax_rate:            16,
        tax_amount:          total * 0.16,
        total:               total * 1.16,
        provider_cost:       provCost,
        provider_currency:   form.currency,
        profit:              total * 1.16 - provCost,
        pickup_date:         isLogistics ? (form.pickup_date        || null) : null,
        estimated_delivery:  isLogistics ? (form.estimated_delivery || null) : null,
        notes:               form.notes || null,
      });
      onCreated(shipment);
      handleClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const filteredClients = clients.filter((c) =>
    !clientSearch.trim() || c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );
  const filteredQuots = quotations.filter((q) =>
    !quotSearch.trim() ||
    q.quote_number?.toLowerCase().includes(quotSearch.toLowerCase()) ||
    (q.client?.name ?? q.client_name ?? "").toLowerCase().includes(quotSearch.toLowerCase())
  );

  const canCreate = mode === "direct" ? !!selectedClient && !!form.total : !!selectedQuot;

  if (!open) return null;

  // Separar tipos logísticos y de consultoría para mostrarlos en grupos
  const logisticsTypes = SHIPMENT_SERVICE_TYPES.filter((t) => SERVICE_TYPE_CATEGORY[t] === "logistics");
  const consultingTypes = SHIPMENT_SERVICE_TYPES.filter((t) => SERVICE_TYPE_CATEGORY[t] === "consulting");

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: "min(560px, 96vw)",
        background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-xl)", zIndex: 401,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* HEADER */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {tl.newShipment ?? "Nuevo servicio"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
              {isLogistics
                ? (tl.shipmentsDesc ?? "Gestión de operaciones logísticas")
                : "Consultoría, seguros y servicios sin ruta logística"}
            </div>
          </div>
          <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "grid", gap: "14px", alignContent: "start" }}>

          {/* MODO */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {([
              { key: "direct",    label: tl.createDirect       ?? "Servicio directo", icon: "🚚" },
              { key: "quotation", label: tl.createFromQuotation ?? "Desde cotización", icon: "📄" },
            ] as { key: CreateMode; label: string; icon: string }[]).map((m) => (
              <button key={m.key} onClick={() => setMode(m.key)} style={{
                padding: "12px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "center",
                background: mode === m.key ? "var(--color-info-bg)" : "var(--color-bg-subtle)",
                border: `2px solid ${mode === m.key ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
              }}>
                <div style={{ fontSize: "20px", marginBottom: "4px" }}>{m.icon}</div>
                <div style={{ fontSize: "11px", fontWeight: mode === m.key ? 700 : 400, color: mode === m.key ? "var(--color-brand-blue)" : "var(--color-text-second)" }}>
                  {m.label}
                </div>
              </button>
            ))}
          </div>

          {/* MODO: DESDE COTIZACIÓN */}
          {mode === "quotation" && (
            <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "14px", display: "grid", gap: "10px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                {tl.selectQuotation ?? "Cotización de servicios aceptada"}
              </div>
              <input placeholder="Buscar cotización…" value={quotSearch} onChange={(e) => setQuotSearch(e.target.value)} style={INPUT} />
              {quotations.length === 0 ? (
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", padding: "8px 0" }}>
                  {tl.noAcceptedQuotations ?? "Sin cotizaciones de servicios aceptadas"}
                </div>
              ) : (
                <div style={{ maxHeight: "200px", overflowY: "auto", display: "grid", gap: "4px" }}>
                  {filteredQuots.map((q) => {
                    const isSel      = selectedQuot?.id === q.id;
                    const clientName = q.client?.name ?? q.client_name ?? "—";
                    return (
                      <div key={q.id} onClick={() => setSelectedQuot(isSel ? null : q)} style={{
                        padding: "10px 12px", borderRadius: "var(--radius-md)", cursor: "pointer",
                        background: isSel ? "var(--color-info-bg)" : "var(--color-bg-subtle)",
                        border: `2px solid ${isSel ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "monospace" }}>{q.quote_number}</div>
                          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{clientName}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)" }}>
                            {q.currency} ${Number(q.total).toLocaleString(locale, { maximumFractionDigits: 0 })}
                          </div>
                          {q.accepted_at && (
                            <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                              Aceptada: {new Date(q.accepted_at).toLocaleDateString(locale)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MODO: DIRECTO — CLIENTE */}
          {mode === "direct" && (
            <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "14px", display: "grid", gap: "10px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Cliente *</div>
              <div style={{ position: "relative" }}>
                <input
                  placeholder="Buscar cliente…"
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); setShowClientDD(true); setSelectedClient(null); }}
                  onFocus={() => setShowClientDD(true)}
                  style={INPUT}
                />
                {showClientDD && filteredClients.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-lg)", maxHeight: "180px", overflowY: "auto" }}>
                    {filteredClients.map((c) => (
                      <div key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(c.name); setShowClientDD(false); }} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--color-border-faint)" }}>
                        <div style={{ fontSize: "13px", fontWeight: 700 }}>{c.name}</div>
                        {c.rfc && <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{c.rfc}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedClient && (
                <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)" }}>
                  ✓ {selectedClient.name}
                </div>
              )}
            </div>
          )}

          {/* TIPO DE SERVICIO */}
          <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "14px", display: "grid", gap: "12px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
              {isLogistics ? "Tipo de servicio y ruta" : "Tipo de servicio"}
            </div>

            {/* Grupo: Logística */}
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🚛 Logística
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "5px" }}>
                {logisticsTypes.map((type) => {
                  const cfg        = SERVICE_TYPE_CONFIG[type];
                  const label      = SERVICE_TYPE_LABELS[type];
                  const isSelected = form.service_type === type;
                  return (
                    <button key={type} onClick={() => setF("service_type", type)} style={{
                      padding: "7px 4px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "center",
                      background: isSelected ? `${cfg.color}15` : "var(--color-bg-subtle)",
                      border: `2px solid ${isSelected ? cfg.color : "var(--color-border-faint)"}`,
                    }}>
                      <div style={{ fontSize: "9px", fontWeight: isSelected ? 700 : 400, color: isSelected ? cfg.color : "var(--color-text-muted)" }}>
                        {label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grupo: Consultoría */}
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                📋 Consultoría y servicios
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px" }}>
                {consultingTypes.map((type) => {
                  const cfg        = SERVICE_TYPE_CONFIG[type];
                  const label      = SERVICE_TYPE_LABELS[type];
                  const isSelected = form.service_type === type;
                  return (
                    <button key={type} onClick={() => setF("service_type", type)} style={{
                      padding: "7px 4px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "center",
                      background: isSelected ? `${cfg.color}15` : "var(--color-bg-subtle)",
                      border: `2px solid ${isSelected ? cfg.color : "var(--color-border-faint)"}`,
                    }}>
                      <div style={{ fontSize: "9px", fontWeight: isSelected ? 700 : 400, color: isSelected ? cfg.color : "var(--color-text-muted)" }}>
                        {label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RUTA — solo para servicios logísticos */}
            {isLogistics && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field label="Origen">
                  <input value={form.origin} onChange={(e) => setF("origin", e.target.value)} placeholder="Ciudad, estado…" style={INPUT} />
                </Field>
                <Field label="Destino">
                  <input value={form.destination} onChange={(e) => setF("destination", e.target.value)} placeholder="Ciudad, estado…" style={INPUT} />
                </Field>
                <Field label="País origen">
                  <input value={form.origin_country} onChange={(e) => setF("origin_country", e.target.value)} style={INPUT} />
                </Field>
                <Field label="País destino">
                  <input value={form.destination_country} onChange={(e) => setF("destination_country", e.target.value)} style={INPUT} />
                </Field>
                <Field label="Incoterm">
                  <select value={form.incoterm} onChange={(e) => setF("incoterm", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                    <option value="">—</option>
                    {INCOTERMS.map((inc) => <option key={inc} value={inc}>{inc}</option>)}
                  </select>
                </Field>
                <Field label="Moneda">
                  <select value={form.currency} onChange={(e) => setF("currency", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
            )}

            {/* AVISO consultoría — sin ruta */}
            {!isLogistics && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ gridColumn: "1 / -1", padding: "10px 14px", borderRadius: "var(--radius-md)", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.3)", fontSize: "12px", color: "#8b5cf6", lineHeight: 1.6 }}>
                  ✓ Servicio sin ruta logística — se registra para documentación y facturación sin tracking de embarque.
                </div>
                <Field label="Moneda">
                  <select value={form.currency} onChange={(e) => setF("currency", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
            )}
          </div>

          {/* PRECIOS */}
          <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "14px", display: "grid", gap: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Precios</div>

            {avgPrice && avgPrice.count > 0 && isLogistics && (
              <div
                style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                onClick={() => setF("total", avgPrice.avg.toFixed(2))}
              >
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-info-text)" }}>
                    {tl.suggestedPrice ?? "Precio sugerido"} — Clic para usar
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "1px" }}>
                    {tl.avgFromHistory ?? "Basado en"} {avgPrice.count} {tl.avgShipments ?? "servicios anteriores"}
                  </div>
                </div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-info-text)", fontVariantNumeric: "tabular-nums" }}>
                  {form.currency} ${avgPrice.avg.toLocaleString(locale, { maximumFractionDigits: 0 })}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field label={`${tl.revenue ?? "Precio de venta"} *`} hint="Sin IVA">
                <input type="number" min="0" value={form.total} onChange={(e) => setF("total", e.target.value)} placeholder="0.00" style={INPUT} />
              </Field>
              <Field label={tl.cost ?? "Costo proveedor"} hint="Sin IVA">
                <input type="number" min="0" value={form.provider_cost} onChange={(e) => setF("provider_cost", e.target.value)} placeholder="0.00" style={INPUT} />
              </Field>
            </div>

            {form.total && parseFloat(form.total) > 0 && (
              <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>{tl.profit ?? "Ganancia estimada"}</span>
                {(() => {
                  const total  = parseFloat(form.total) || 0;
                  const cost   = parseFloat(form.provider_cost) || 0;
                  const profit = total - cost;
                  const pct    = total > 0 ? (profit / total) * 100 : 0;
                  return (
                    <span style={{ fontWeight: 800, color: pct >= 20 ? "var(--color-success-text)" : pct >= 10 ? "var(--color-warning-text)" : "var(--color-danger-text)" }}>
                      {form.currency} ${profit.toLocaleString(locale, { minimumFractionDigits: 2 })} ({pct.toFixed(0)}%)
                    </span>
                  );
                })()}
              </div>
            )}
          </div>

          {/* FECHAS — solo para logística */}
          {isLogistics && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field label={tl.pickupDate ?? "Fecha de recolección"}>
                <input type="date" value={form.pickup_date} onChange={(e) => setF("pickup_date", e.target.value)} style={INPUT} />
              </Field>
              <Field label={tl.estimatedDelivery ?? "Entrega estimada"}>
                <input type="date" value={form.estimated_delivery} onChange={(e) => setF("estimated_delivery", e.target.value)} style={INPUT} />
              </Field>
            </div>
          )}

          <Field label={tl.notes ?? "Notas"}>
            <input value={form.notes} onChange={(e) => setF("notes", e.target.value)} placeholder={isLogistics ? "Instrucciones especiales de manejo…" : "Alcance del servicio, condiciones, observaciones…"} style={INPUT} />
          </Field>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
              {error}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleClose} style={{ height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
            {t.general.cancel}
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !canCreate}
            style={{
              flex: 1, height: "40px", borderRadius: "var(--radius-md)",
              background: canCreate ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
              color: canCreate ? "#fff" : "var(--color-text-muted)",
              border: "none", fontSize: "13px", fontWeight: 700,
              cursor: saving || !canCreate ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
          >
            {saving ? t.general.loading : (
              <>
                {isLogistics
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                }
                {isLogistics ? (tl.newShipment ?? "Crear embarque") : "Crear servicio de consultoría"}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
