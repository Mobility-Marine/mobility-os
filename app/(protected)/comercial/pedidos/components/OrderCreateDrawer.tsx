"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { Order, OrderPriority } from "../types/orders.types";
import { supabase } from "@/lib/supabaseClient";

// ─── Tipos ────────────────────────────────────────────────────

type ClientWithProgram = {
  id:           string;
  name:         string;
  rfc?:         string;
  email?:       string;
};

type NegotiatedItem = {
  quotation_id:  string;
  quote_number:  string;
  item_id:       string;
  product_id?:   string | null;
  sku?:          string | null;
  description:   string;
  details?:      string | null;
  unit:          string;
  unit_price:    number;
  discount_pct:  number;
};

type Props = {
  open:     boolean;
  onClose:  () => void;
  onCreated:(order: Order) => void;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
      {children}
      {hint && <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "3px" }}>{hint}</div>}
    </div>
  );
}

export default function OrderCreateDrawer({ open, onClose, onCreated }: Props) {
  const { t, lang }    = useTranslation();
  const { companyId }  = useTenant();
  const { user }       = useAuth();
  const to             = (t.orders as any) ?? {};
  const locale         = lang === "en" ? "en-US" : "es-MX";

  // ── Estado ────────────────────────────────────────────────

  // Clientes con precios negociados
  const [clients,       setClients]       = useState<ClientWithProgram[]>([]);
  const [clientSearch,  setClientSearch]  = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientWithProgram | null>(null);
  const [showClientDD,  setShowClientDD]  = useState(false);

  // Productos negociados del cliente
  const [items,         setItems]         = useState<NegotiatedItem[]>([]);
  const [loadingItems,  setLoadingItems]  = useState(false);

  // Cantidades de esta orden
  const [quantities,    setQuantities]    = useState<Record<string, string>>({});

  // Config de la orden
  const [clientPO,      setClientPO]      = useState("");
  const [deliveryDate,  setDeliveryDate]  = useState("");
  const [deliveryAddr,  setDeliveryAddr]  = useState("");
  const [priority,      setPriority]      = useState<OrderPriority>("normal");
  const [notes,         setNotes]         = useState("");

  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // ── Cargar clientes con cotizaciones aceptadas ────────────

  useEffect(() => {
    if (!open || !companyId) return;
    loadClients();
  }, [open, companyId]);

  async function loadClients() {
    const { data } = await supabase
      .from("quotations")
      .select("client_id, client_name, client:clients(id, name, rfc, email)")
      .eq("company_id", companyId!)
      .eq("type", "products")
      .eq("status", "accepted")
      .not("client_id", "is", null);

    if (!data?.length) { setClients([]); return; }

    const map = new Map<string, ClientWithProgram>();
    for (const q of data) {
      const clientData = q.client as any;
      const id   = q.client_id!;
      const name = clientData?.name ?? q.client_name ?? id.slice(0, 8);
      if (!map.has(id)) {
        map.set(id, { id, name, rfc: clientData?.rfc, email: clientData?.email });
      }
    }
    setClients(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
  }

  // ── Cargar precios negociados del cliente ─────────────────

  async function handleSelectClient(client: ClientWithProgram) {
    setSelectedClient(client);
    setClientSearch(client.name);
    setShowClientDD(false);
    setItems([]);
    setQuantities({});
    setLoadingItems(true);

    // Buscar la cotización aceptada más reciente de este cliente
    const { data: quotations } = await supabase
      .from("quotations")
      .select("id, quote_number")
      .eq("company_id", companyId!)
      .eq("client_id", client.id)
      .eq("type", "products")
      .eq("status", "accepted")
      .order("accepted_at", { ascending: false })
      .limit(1);

    if (!quotations?.length) { setLoadingItems(false); return; }

    const quot = quotations[0];

    const { data: qItems } = await supabase
      .from("quotation_items")
      .select("id, sku, description, details, unit, unit_price, discount_pct, product_id")
      .eq("quotation_id", quot.id)
      .order("sort_order");

    if (qItems?.length) {
      const negotiatedItems: NegotiatedItem[] = qItems.map((qi) => ({
        quotation_id:  quot.id,
        quote_number:  quot.quote_number,
        item_id:       qi.id,
        product_id:    qi.product_id ?? null,
        sku:           qi.sku        ?? null,
        description:   qi.description,
        details:       qi.details    ?? null,
        unit:          qi.unit,
        unit_price:    qi.unit_price,
        discount_pct:  qi.discount_pct ?? 0,
      }));
      setItems(negotiatedItems);
      // Inicializar cantidades en 0
      const init: Record<string, string> = {};
      for (const ni of negotiatedItems) init[ni.item_id] = "";
      setQuantities(init);
    }
    setLoadingItems(false);
  }

  // ── Filtro clientes ───────────────────────────────────────

  const filteredClients = clients.filter((c) =>
    !clientSearch.trim() || c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // ── Totales ───────────────────────────────────────────────

  const activeItems = items.filter((item) => {
    const qty = parseFloat(quantities[item.item_id] || "0");
    return qty > 0;
  });

  const subtotal = activeItems.reduce((sum, item) => {
    const qty   = parseFloat(quantities[item.item_id] || "0");
    const price = item.unit_price * (1 - (item.discount_pct ?? 0) / 100);
    return sum + qty * price;
  }, 0);

  const tax   = subtotal * 0.16;
  const total = subtotal + tax;

  // ── Crear orden ───────────────────────────────────────────

  async function handleCreate() {
    if (!companyId || !user || !selectedClient || activeItems.length === 0) return;
    if (!deliveryDate) { setError(lang === "en" ? "Delivery date is required" : "La fecha de entrega es requerida"); return; }

    setSaving(true); setError(null);
    try {
      // 1. Generar número de pedido
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);
      const num   = String((count ?? 0) + 1).padStart(4, "0");
      const year  = new Date().getFullYear();
      const orderNumber = `PED-${year}-${num}`;

      // 2. Crear orden
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          company_id:       companyId,
          order_number:     orderNumber,
          quotation_id:     activeItems[0]?.quotation_id ?? null,
          client_id:        selectedClient.id,
          status:           "pending",
          priority,
          currency:         "MXN",
          subtotal,
          discount_amount:  0,
          tax_rate:         16,
          tax_amount:       tax,
          total,
          delivery_date:    deliveryDate,
          delivery_address: deliveryAddr || null,
          notes:            [
            clientPO ? `OC Cliente: ${clientPO}` : null,
            notes || null,
          ].filter(Boolean).join(" | ") || null,
          created_by:       user.id,
        })
        .select("*, client:clients(name, email, rfc), quotation:quotations(quote_number)")
        .single();

      if (orderErr) throw orderErr;

      // 3. Crear items
      const orderItems = activeItems.map((item, idx) => {
        const qty   = parseFloat(quantities[item.item_id] || "0");
        const disc  = 1 - (item.discount_pct ?? 0) / 100;
        return {
          company_id:         companyId,
          order_id:           order.id,
          product_id:         item.product_id ?? null,
          quotation_item_id:  item.item_id,
          sort_order:         idx,
          sku:                item.sku         ?? null,
          description:        item.description,
          details:            item.details     ?? null,
          quantity:           qty,
          quantity_delivered: 0,
          unit:               item.unit,
          unit_price:         item.unit_price,
          discount_pct:       item.discount_pct ?? 0,
          subtotal:           qty * item.unit_price * disc,
        };
      });
      await supabase.from("order_items").insert(orderItems);

      // 4. Timeline
      await supabase.from("entity_timeline_events").insert({
        company_id:     companyId,
        entity_type:    "order",
        entity_id:      order.id,
        module_key:     "pedidos",
        event_type:     "order_created",
        event_category: "commercial",
        title:          `Pedido creado${clientPO ? ` — OC: ${clientPO}` : ""}`,
        created_by:     user.id,
      }).then(() => {});

      onCreated(order as unknown as Order);
      handleClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setSelectedClient(null);
    setClientSearch("");
    setItems([]);
    setQuantities({});
    setClientPO("");
    setDeliveryDate("");
    setDeliveryAddr("");
    setPriority("normal");
    setNotes("");
    setError(null);
    onClose();
  }

  if (!open) return null;

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
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {to.quickOrder ?? "Nueva orden"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {lang === "en"
                  ? "Prices are fixed — just enter quantities and delivery date"
                  : "Los precios están fijos — solo captura cantidades y fecha de entrega"}
              </div>
            </div>
            <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "grid", gap: "16px", alignContent: "start" }}>

          {/* ── CLIENTE ── */}
          <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "14px 18px", display: "grid", gap: "12px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", paddingBottom: "8px", borderBottom: "1px solid var(--color-border-faint)" }}>
              {to.selectClient ?? "Cliente"}
            </div>

            <div style={{ position: "relative" }}>
              <div style={{ position: "relative" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"
                  style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", zIndex: 1 }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); setShowClientDD(true); setSelectedClient(null); setItems([]); }}
                  onFocus={() => setShowClientDD(true)}
                  placeholder={lang === "en" ? "Search client with negotiated prices…" : "Buscar cliente con precios negociados…"}
                  style={{ ...INPUT, paddingLeft: "32px" }}
                />
              </div>

              {/* Dropdown clientes */}
              {showClientDD && filteredClients.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                  background: "var(--color-bg-base)", border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-lg)",
                  maxHeight: "200px", overflowY: "auto",
                }}>
                  {filteredClients.map((c) => (
                    <div key={c.id} onClick={() => handleSelectClient(c)} style={{
                      padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--color-border-faint)",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{c.name}</div>
                        {c.rfc && <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{c.rfc}</div>}
                      </div>
                      <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontWeight: 700 }}>
                        {lang === "en" ? "Fixed prices" : "Precio fijo"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* No hay clientes */}
              {showClientDD && filteredClients.length === 0 && clientSearch && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "12px 14px", fontSize: "12px", color: "var(--color-text-muted)" }}>
                  {to.noPriceProgram ?? "Sin cotizaciones aceptadas"}
                </div>
              )}
            </div>

            {/* Cliente seleccionado */}
            {selectedClient && (
              <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success-text)" }}>✓ {selectedClient.name}</div>
                {selectedClient.rfc && <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>RFC: {selectedClient.rfc}</div>}
              </div>
            )}
          </div>

          {/* ── PRODUCTOS CON PRECIOS FIJOS ── */}
          {selectedClient && (
            <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {to.quantityThisOrder ?? "Cantidades para esta orden"}
                </div>
                {items.length > 0 && (
                  <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "var(--radius-full)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", color: "var(--color-info-text)", fontWeight: 700 }}>
                    {to.fromNRA ?? "Precio fijo de contrato"}
                  </span>
                )}
              </div>

              {loadingItems ? (
                <div style={{ padding: "20px", textAlign: "center", fontSize: "13px", color: "var(--color-text-muted)" }}>
                  {t.general.loading}…
                </div>
              ) : items.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", fontSize: "13px", color: "var(--color-text-muted)" }}>
                  {to.noPriceProgram ?? "Sin precios negociados"}
                </div>
              ) : (
                <div style={{ display: "grid" }}>
                  {/* Header tabla */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 70px", gap: "8px", padding: "8px 18px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)" }}>
                    {["Producto", "Unidad", "P. Fijo", "Cantidad"].map((h) => (
                      <div key={h} style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>{h}</div>
                    ))}
                  </div>

                  {/* Filas */}
                  {items.map((item, i) => {
                    const qty      = parseFloat(quantities[item.item_id] || "0");
                    const discount = 1 - (item.discount_pct ?? 0) / 100;
                    const lineTotal = qty * item.unit_price * discount;
                    const hasQty   = qty > 0;

                    return (
                      <div key={item.item_id} style={{
                        display: "grid", gridTemplateColumns: "1fr 80px 90px 70px", gap: "8px",
                        padding: "10px 18px", alignItems: "center",
                        borderBottom: i < items.length - 1 ? "1px solid var(--color-border-faint)" : "none",
                        background: hasQty ? "var(--color-info-bg)" : "transparent",
                        transition: "background 0.2s",
                      }}>
                        {/* Producto */}
                        <div>
                          {item.sku && (
                            <div style={{ fontSize: "9px", fontFamily: "monospace", color: "var(--color-text-muted)", marginBottom: "2px" }}>{item.sku}</div>
                          )}
                          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{item.description}</div>
                          {item.details && <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{item.details}</div>}
                          {hasQty && (
                            <div style={{ fontSize: "10px", color: "var(--color-success-text)", fontWeight: 700, marginTop: "2px", fontVariantNumeric: "tabular-nums" }}>
                              = ${lineTotal.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </div>

                        {/* Unidad */}
                        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{item.unit}</div>

                        {/* Precio fijo — NO editable */}
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                            ${item.unit_price.toLocaleString(locale, { minimumFractionDigits: 2 })}
                          </div>
                          {item.discount_pct > 0 && (
                            <div style={{ fontSize: "9px", color: "var(--color-success-text)" }}>-{item.discount_pct}%</div>
                          )}
                        </div>

                        {/* Cantidad — ÚNICO campo editable */}
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={quantities[item.item_id] ?? ""}
                          onChange={(e) => setQuantities((p) => ({ ...p, [item.item_id]: e.target.value }))}
                          placeholder="0"
                          style={{
                            width: "100%", height: "34px", padding: "0 8px",
                            borderRadius: "var(--radius-md)",
                            border: `2px solid ${hasQty ? "var(--color-brand-blue)" : "var(--color-border)"}`,
                            background: hasQty ? "var(--color-bg-base)" : "var(--color-bg-subtle)",
                            color: "var(--color-text-primary)",
                            fontSize: "13px", fontWeight: 700, outline: "none",
                            boxSizing: "border-box", textAlign: "center",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        />
                      </div>
                    );
                  })}

                  {/* TOTAL DE LA ORDEN */}
                  {activeItems.length > 0 && (
                    <div style={{ padding: "12px 18px", background: "var(--color-success-bg)", borderTop: "1px solid var(--color-success-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                          {activeItems.length} {lang === "en" ? "products" : "productos"} · IVA 16%
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                          Subtotal: ${subtotal.toLocaleString(locale, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "10px", color: "var(--color-success-text)", fontWeight: 600, textTransform: "uppercase" }}>TOTAL</div>
                        <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                          ${total.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── CONFIG DE LA ORDEN ── */}
          {selectedClient && items.length > 0 && (
            <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "14px 18px", display: "grid", gap: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", paddingBottom: "8px", borderBottom: "1px solid var(--color-border-faint)" }}>
                {to.deliveryConfig ?? "Configuración de entrega"}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Field label={to.clientPO ?? "No. OC del cliente"} hint={to.clientPOHint ?? "Número en la orden de compra del cliente"}>
                  <input
                    value={clientPO}
                    onChange={(e) => setClientPO(e.target.value)}
                    placeholder="OC-2026-1234"
                    style={INPUT}
                  />
                </Field>

                <Field label={`${to.deliveryDate ?? "Fecha de entrega"} *`}>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    style={INPUT}
                  />
                </Field>

                <Field label={to.priority ?? "Prioridad"}>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as OrderPriority)} style={{ ...INPUT, cursor: "pointer" }}>
                    {(["low", "normal", "high", "urgent"] as OrderPriority[]).map((p) => (
                      <option key={p} value={p}>
                        {to[`priority${p.charAt(0).toUpperCase()}${p.slice(1)}`] ?? p}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label={to.deliveryAddress ?? "Dirección de entrega"}>
                  <input
                    value={deliveryAddr}
                    onChange={(e) => setDeliveryAddr(e.target.value)}
                    placeholder={lang === "en" ? "Optional — street and number" : "Opcional — calle y número"}
                    style={INPUT}
                  />
                </Field>
              </div>

              <Field label={to.notes ?? "Notas"}>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === "en" ? "Special instructions…" : "Instrucciones especiales…"}
                  style={INPUT}
                />
              </Field>
            </div>
          )}
        </div>

        {/* ERROR */}
        {error && (
          <div style={{ margin: "0 24px 8px", padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px", flexShrink: 0 }}>
            {error}
          </div>
        )}

        {/* FOOTER */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleClose} style={{
            height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
            color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer",
          }}>
            {t.general.cancel}
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || activeItems.length === 0 || !deliveryDate || !selectedClient}
            style={{
              flex: 1, height: "40px", borderRadius: "var(--radius-md)",
              background: activeItems.length > 0 && deliveryDate ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
              color: activeItems.length > 0 && deliveryDate ? "#fff" : "var(--color-text-muted)",
              border: "none", fontSize: "13px", fontWeight: 700,
              cursor: saving || activeItems.length === 0 || !deliveryDate ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
          >
            {saving ? t.general.loading : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
                {to.scheduleDelivery ?? "Crear pedido"}
                {activeItems.length > 0 && ` · $${total.toLocaleString(locale, { maximumFractionDigits: 0 })}`}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
