"use client";

import { useState, useEffect } from "react";
import type { ServiceOrder, ServiceOrderItem, ServiceOrderStatus, SOTemplate, ServiceOrderType } from "../types/service-orders.types";
import { SO_TYPE_CONFIG, SO_STATUS_CONFIG, SAT_PACKAGING_TYPES, SAT_UNIT_CODES, CCP_VEHICLE_TYPES } from "../types/service-orders.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth }   from "@/lib/auth/AuthProvider";
import { updateSOStatus, upsertSOItem, deleteSOItem, generateAndDownloadSO } from "../services/service-orders.service";
import { fetchCompanySettings } from "@/app/(protected)/comercial/cotizaciones/services/quotations.service";

type Tab = "general" | "carrier" | "cargo" | "instructions";

type Props = {
  order:     ServiceOrder | null;
  onUpdate:  (id: string, updates: Partial<ServiceOrder>) => Promise<void>;
  onDelete:  (id: string) => Promise<void>;
  onReload:  () => Promise<void>;
  saving:    boolean;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", paddingBottom: "6px", borderBottom: "1px solid var(--color-border-faint)", marginBottom: "10px", gridColumn: "1 / -1" }}>
      {children}
    </div>
  );
}

export default function SOWorkspace({ order, onUpdate, onDelete, onReload, saving }: Props) {
  const { t, lang }   = useTranslation();
  const { companyId } = useTenant();
  const { user }      = useAuth();
  const tl            = (t.logistics as any) ?? {};
  const locale        = lang === "en" ? "en-US" : "es-MX";

  const [tab,         setTab]         = useState<Tab>("general");
  const [editing,     setEditing]     = useState(false);
  const [form,        setForm]        = useState<Partial<ServiceOrder>>({});
  const [genPDF,      setGenPDF]      = useState(false);
  const [template,    setTemplate]    = useState<SOTemplate>("elegante");
  const [confirmDel,  setConfirmDel]  = useState(false);

  // Cargo item form
  const [addingItem,  setAddingItem]  = useState(false);
  const [itemForm,    setItemForm]    = useState<Partial<ServiceOrderItem>>({ quantity: 1, unit: "pza", weight_kg: 0, weight_lbs: 0, commercial_value: 0, currency: "USD", country_of_origin: "México" });
  const [savingItem,  setSavingItem]  = useState(false);

  const isCCP     = order?.order_type === "ccp_carta";
  const isBOL     = order?.order_type === "bol_usa";
  const isAduanal = order?.order_type === "carta_aduanal";

  if (!order) return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", height: "100%" }}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>{tl.workspaceEmpty ?? "Selecciona una orden de servicio"}</div>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>{tl.workspaceEmptyDesc ?? "Aquí verás el detalle y generarás el PDF."}</div>
    </div>
  );

  const typeCfg  = SO_TYPE_CONFIG[order.order_type];
  const stCfg    = SO_STATUS_CONFIG[order.status];
  const items    = order.items ?? [];
  const typeLabel = tl[`type${order.order_type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`] ?? order.order_type;
  const stLabel   = tl[`status${order.status.charAt(0).toUpperCase()}${order.status.slice(1)}SO`] ?? order.status;

  function set(k: keyof ServiceOrder, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleDownloadPDF() {
    if (!companyId) return;
    setGenPDF(true);
    try {
      const settings = await fetchCompanySettings(companyId);
      await generateAndDownloadSO({ ...order, items }, settings, template);
    } finally { setGenPDF(false); }
  }

  async function handleSaveItem() {
    if (!companyId || !itemForm.description?.trim()) return;
    setSavingItem(true);
    try {
      await upsertSOItem(companyId, order.id, itemForm as any);
      await onReload();
      setAddingItem(false);
      setItemForm({ quantity: 1, unit: "pza", weight_kg: 0, weight_lbs: 0, commercial_value: 0, currency: "USD", country_of_origin: "México" });
    } finally { setSavingItem(false); }
  }

  async function handleDeleteItem(itemId: string) {
    if (!companyId) return;
    await deleteSOItem(companyId, itemId);
    await onReload();
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "general",      label: isBOL ? "Shipment" : "General"                 },
    { key: "carrier",      label: isBOL ? "Carrier" : (isCCP ? "Transportista" : "Agente Aduanal") },
    { key: "cargo",        label: `${tl.sectionCargo ?? "Mercancía"} (${items.length})` },
    { key: "instructions", label: tl.sectionInstructions ?? "Instrucciones"       },
  ];

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>

      {/* HEADER */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "14px", fontWeight: 800, color: typeCfg.color, fontFamily: "monospace" }}>
                {order.shipment?.reference ?? order.id.slice(0, 8).toUpperCase()}
              </span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: typeCfg.bg, border: `1px solid ${typeCfg.border}`, color: typeCfg.color }}>
                {typeLabel}
              </span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: stCfg.bg, border: `1px solid ${stCfg.border}`, color: stCfg.color }}>
                {stLabel}
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "3px" }}>
              {order.shipment?.client?.name ?? order.carrier_name ?? "—"}
              {order.shipment?.reference && ` · ${tl.soLinkedTo ?? "Vinculada al embarque"}: ${order.shipment.reference}`}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Editar */}
          {!editing ? (
            <button onClick={() => { setForm({ ...order }); setEditing(true); }} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              {t.general.edit}
            </button>
          ) : (
            <>
              <button onClick={async () => { await onUpdate(order.id, form); setEditing(false); setForm({}); }} disabled={saving} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                {saving ? t.general.loading : `✓ ${t.general.save}`}
              </button>
              <button onClick={() => { setEditing(false); setForm({}); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                {t.general.cancel}
              </button>
            </>
          )}

          {/* Marcar enviada */}
          {order.status === "draft" && (
            <button onClick={async () => { await updateSOStatus(companyId!, order.id, "sent"); await onReload(); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", color: "var(--color-info-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
              {tl.markAsSent ?? "Marcar como enviada"}
            </button>
          )}
          {order.status === "sent" && (
            <button onClick={async () => { await updateSOStatus(companyId!, order.id, "confirmed"); await onReload(); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
              ✓ Confirmar recepción
            </button>
          )}

          {/* PDF */}
          <div style={{ display: "flex", gap: "4px", alignItems: "center", marginLeft: "auto" }}>
            <select value={template} onChange={(e) => setTemplate(e.target.value as SOTemplate)} style={{ height: "28px", padding: "0 6px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "10px", cursor: "pointer" }}>
              {(["elegante","moderna","corporativa"] as SOTemplate[]).map((tpl) => (
                <option key={tpl} value={tpl} style={{ textTransform: "capitalize" }}>{tpl}</option>
              ))}
            </select>
            <button onClick={handleDownloadPDF} disabled={genPDF} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: typeCfg.color, color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {genPDF ? (tl.generatingPDF ?? "Generando…") : (tl.generatePDF ?? "Generar PDF")}
            </button>
          </div>

          {/* Eliminar */}
          {!confirmDel ? (
            <button onClick={() => setConfirmDel(true)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", cursor: "pointer" }}>
              {t.general.delete}
            </button>
          ) : (
            <>
              <button onClick={() => onDelete(order.id)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>¿Eliminar?</button>
              <button onClick={() => setConfirmDel(false)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>{(t.general as any).no ?? "No"}</button>
            </>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{ height: "36px", padding: "0 14px", border: "none", background: "transparent", borderBottom: tab === tb.key ? "2px solid var(--color-brand-blue)" : "2px solid transparent", color: tab === tb.key ? "var(--color-brand-blue)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: tab === tb.key ? 700 : 400, cursor: "pointer" }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>

        {/* ── GENERAL (Remitente + Destinatario) ── */}
        {tab === "general" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <SectionTitle>{isBOL ? "Shipper" : tl.sectionShipper ?? "Remitente"}</SectionTitle>
            {([
              { k: "shipper_name",    label: isBOL ? "Name" : tl.shipperName    ?? "Nombre"    },
              { k: "shipper_address", label: isBOL ? "Address" : tl.shipperAddress ?? "Dirección" },
              { k: "shipper_city",    label: isBOL ? "City" : tl.shipperCity    ?? "Ciudad"    },
              { k: "shipper_state",   label: isBOL ? "State" : tl.shipperState  ?? "Estado"    },
              { k: "shipper_country", label: isBOL ? "Country" : tl.shipperCountry ?? "País"   },
              { k: "shipper_contact", label: isBOL ? "Contact" : tl.shipperContact ?? "Contacto"},
              { k: "shipper_phone",   label: isBOL ? "Phone" : tl.shipperPhone  ?? "Teléfono"  },
            ] as any[]).map((f) => (
              <Field key={f.k} label={f.label}>
                {editing ? (
                  <input value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k as keyof ServiceOrder, e.target.value)} style={INPUT} />
                ) : (
                  <div style={{ fontSize: "12px", color: "var(--color-text-primary)", minHeight: "20px" }}>{(order as any)[f.k] ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}</div>
                )}
              </Field>
            ))}

            <SectionTitle>{isBOL ? "Consignee" : tl.sectionConsignee ?? "Destinatario"}</SectionTitle>
            {([
              { k: "consignee_name",    label: isBOL ? "Name" : tl.consigneeName    ?? "Nombre"    },
              { k: "consignee_address", label: isBOL ? "Address" : tl.consigneeAddress ?? "Dirección" },
              { k: "consignee_city",    label: isBOL ? "City" : tl.consigneeCity    ?? "Ciudad"    },
              { k: "consignee_state",   label: isBOL ? "State" : tl.consigneeState  ?? "Estado"    },
              { k: "consignee_country", label: isBOL ? "Country" : tl.consigneeCountry ?? "País"   },
              { k: "consignee_contact", label: isBOL ? "Contact" : tl.consigneeContact ?? "Contacto"},
              { k: "consignee_phone",   label: isBOL ? "Phone" : tl.consigneePhone  ?? "Teléfono"  },
            ] as any[]).map((f) => (
              <Field key={f.k} label={f.label}>
                {editing ? (
                  <input value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k as keyof ServiceOrder, e.target.value)} style={INPUT} />
                ) : (
                  <div style={{ fontSize: "12px", color: "var(--color-text-primary)", minHeight: "20px" }}>{(order as any)[f.k] ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}</div>
                )}
              </Field>
            ))}
          </div>
        )}

        {/* ── CARRIER ── */}
        {tab === "carrier" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <SectionTitle>{isBOL ? "Carrier" : isAduanal ? "Agente Aduanal" : tl.sectionCarrier ?? "Transportista"}</SectionTitle>
            {([
              { k: "carrier_name",    label: isBOL ? "Carrier Name" : isAduanal ? "Nombre del agente" : tl.carrierName    ?? "Empresa"    },
              { k: "carrier_contact", label: isBOL ? "Contact" : tl.carrierContact ?? "Contacto" },
              { k: "carrier_phone",   label: isBOL ? "Phone" : tl.carrierPhone   ?? "Teléfono"  },
              ...(isBOL    ? [{ k: "carrier_scac",   label: "SCAC Code"                      }] : []),
              ...(isBOL    ? [{ k: "pro_number",     label: tl.proNumber ?? "PRO Number"      }] : []),
              ...(!isAduanal ? [{ k: "driver_name",  label: tl.driverName   ?? "Operador"     }] : []),
              ...(!isAduanal ? [{ k: "driver_license",label: tl.driverLicense ?? "Licencia"   }] : []),
            ] as any[]).map((f) => (
              <Field key={f.k} label={f.label}>
                {editing ? (
                  <input value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k as keyof ServiceOrder, e.target.value)} style={INPUT} />
                ) : (
                  <div style={{ fontSize: "12px", color: "var(--color-text-primary)", minHeight: "20px" }}>{(order as any)[f.k] ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}</div>
                )}
              </Field>
            ))}

            {/* Vehículo solo para CCP */}
            {isCCP && (
              <>
                <SectionTitle>{tl.sectionVehicle ?? "Vehículo (CCP)"}</SectionTitle>
                <Field label={tl.vehicleType ?? "Tipo de vehículo"}>
                  {editing ? (
                    <select value={(form as any).vehicle_type ?? ""} onChange={(e) => set("vehicle_type", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                      <option value="">—</option>
                      {CCP_VEHICLE_TYPES.map((v) => <option key={v.code} value={v.code}>{v.code} — {v.desc}</option>)}
                    </select>
                  ) : (
                    <div style={{ fontSize: "12px", color: "var(--color-text-primary)" }}>{order.vehicle_type ?? "—"}</div>
                  )}
                </Field>
                {([
                  { k: "vehicle_plates", label: tl.vehiclePlates ?? "Placas"         },
                  { k: "trailer_plates", label: tl.trailerPlates ?? "Remolque"        },
                ] as any[]).map((f) => (
                  <Field key={f.k} label={f.label}>
                    {editing ? (
                      <input value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k as keyof ServiceOrder, e.target.value)} style={INPUT} />
                    ) : (
                      <div style={{ fontSize: "12px", color: "var(--color-text-primary)", minHeight: "20px" }}>{(order as any)[f.k] ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}</div>
                    )}
                  </Field>
                ))}
              </>
            )}

            {/* Fechas */}
            <SectionTitle>{tl.sectionLogistics ?? "Logística"}</SectionTitle>
            {([
              { k: "pickup_date",       label: tl.pickupDate    ?? "Fecha recolección", type: "date" },
              { k: "pickup_address",    label: tl.pickupAddress ?? "Dirección recolección"            },
              { k: "delivery_date",     label: tl.deliveryDate  ?? "Fecha entrega",      type: "date" },
              { k: "delivery_address",  label: tl.deliveryAddress ?? "Dirección entrega"              },
              { k: "reference_number",  label: tl.referenceNumber ?? "No. Referencia"                 },
              { k: "incoterm",          label: tl.incoterm        ?? "Incoterm"                       },
            ] as any[]).map((f) => (
              <Field key={f.k} label={f.label}>
                {editing ? (
                  <input type={f.type ?? "text"} value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k as keyof ServiceOrder, e.target.value)} style={INPUT} />
                ) : (
                  <div style={{ fontSize: "12px", color: "var(--color-text-primary)", minHeight: "20px" }}>
                    {f.type === "date" && (order as any)[f.k]
                      ? new Date((order as any)[f.k]).toLocaleDateString(locale)
                      : (order as any)[f.k] ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                  </div>
                )}
              </Field>
            ))}
          </div>
        )}

        {/* ── CARGO ── */}
        {tab === "cargo" && (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{tl.sectionCargo ?? "Mercancías"}</div>
              {!addingItem && (
                <button onClick={() => setAddingItem(true)} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  {tl.addItem ?? "Agregar mercancía"}
                </button>
              )}
            </div>

            {addingItem && (
              <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.cargoDescription ?? "Descripción de la mercancía"} *</div>
                  <input value={itemForm.description ?? ""} onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))} placeholder="Descripción de la mercancía…" style={INPUT} />
                </div>

                {/* SAT Product Code — solo CCP */}
                {isCCP && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.satProductCode ?? "Clave SAT"}</div>
                    <input value={itemForm.sat_product_code ?? ""} onChange={(e) => setItemForm((p) => ({ ...p, sat_product_code: e.target.value }))} placeholder="78101700" style={INPUT} />
                  </div>
                )}

                {/* Embalaje — solo CCP */}
                {isCCP && (
                  <>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.packagingType ?? "Tipo de embalaje"}</div>
                      <select value={itemForm.packaging_type ?? ""} onChange={(e) => setItemForm((p) => ({ ...p, packaging_type: e.target.value, packaging_desc: SAT_PACKAGING_TYPES.find((x) => x.code === e.target.value)?.desc ?? "" }))} style={{ ...INPUT, cursor: "pointer" }}>
                        <option value="">—</option>
                        {SAT_PACKAGING_TYPES.map((pkg) => <option key={pkg.code} value={pkg.code}>{pkg.code} — {pkg.desc}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Material peligroso (si aplica)</div>
                      <input value={itemForm.hazmat_key ?? ""} onChange={(e) => setItemForm((p) => ({ ...p, hazmat_key: e.target.value }))} placeholder="Clave SAT mat. peligroso" style={INPUT} />
                    </div>
                  </>
                )}

                {/* Fracción arancelaria — solo Aduanal */}
                {isAduanal && (
                  <>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.tariffCode ?? "Fracción arancelaria"}</div>
                      <input value={itemForm.tariff_code ?? ""} onChange={(e) => setItemForm((p) => ({ ...p, tariff_code: e.target.value }))} placeholder="01012100" style={INPUT} />
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Descripción arancelaria</div>
                      <input value={itemForm.tariff_description ?? ""} onChange={(e) => setItemForm((p) => ({ ...p, tariff_description: e.target.value }))} style={INPUT} />
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>País de origen</div>
                      <input value={itemForm.country_of_origin ?? "México"} onChange={(e) => setItemForm((p) => ({ ...p, country_of_origin: e.target.value }))} style={INPUT} />
                    </div>
                  </>
                )}

                {/* Cantidad y unidad */}
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.quantity ?? "Cantidad"}</div>
                  <input type="number" min="0" value={itemForm.quantity ?? 1} onChange={(e) => setItemForm((p) => ({ ...p, quantity: parseFloat(e.target.value) || 1 }))} style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.unit ?? "Unidad"}</div>
                  {isCCP ? (
                    <select value={itemForm.sat_unit_code ?? ""} onChange={(e) => setItemForm((p) => ({ ...p, sat_unit_code: e.target.value, unit: SAT_UNIT_CODES.find((x) => x.code === e.target.value)?.code ?? "pza" }))} style={{ ...INPUT, cursor: "pointer" }}>
                      <option value="">Seleccionar…</option>
                      {SAT_UNIT_CODES.map((u) => <option key={u.code} value={u.code}>{u.code} — {u.desc}</option>)}
                    </select>
                  ) : (
                    <input value={itemForm.unit ?? "pza"} onChange={(e) => setItemForm((p) => ({ ...p, unit: e.target.value }))} placeholder="pza, kg, caja…" style={INPUT} />
                  )}
                </div>

                {/* Pesos */}
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.weightKg ?? "Peso (kg)"}</div>
                  <input type="number" min="0" step="0.01" value={itemForm.weight_kg ?? 0} onChange={(e) => setItemForm((p) => ({ ...p, weight_kg: parseFloat(e.target.value) || 0, weight_lbs: parseFloat(((parseFloat(e.target.value) || 0) * 2.20462).toFixed(2)) }))} style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.weightLbs ?? "Peso (lbs)"}</div>
                  <input type="number" min="0" step="0.01" value={itemForm.weight_lbs ?? 0} onChange={(e) => setItemForm((p) => ({ ...p, weight_lbs: parseFloat(e.target.value) || 0, weight_kg: parseFloat(((parseFloat(e.target.value) || 0) / 2.20462).toFixed(2)) }))} style={INPUT} />
                </div>

                {/* Valor comercial */}
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.commercialValue ?? "Valor comercial"}</div>
                  <input type="number" min="0" value={itemForm.commercial_value ?? 0} onChange={(e) => setItemForm((p) => ({ ...p, commercial_value: parseFloat(e.target.value) || 0 }))} style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Moneda</div>
                  <select value={itemForm.currency ?? "USD"} onChange={(e) => setItemForm((p) => ({ ...p, currency: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                    {["USD","MXN","EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px" }}>
                  <button onClick={handleSaveItem} disabled={savingItem || !itemForm.description?.trim()} style={{ height: "32px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    {savingItem ? t.general.loading : t.general.save}
                  </button>
                  <button onClick={() => { setAddingItem(false); setItemForm({ quantity: 1, unit: "pza", weight_kg: 0, weight_lbs: 0, commercial_value: 0, currency: "USD", country_of_origin: "México" }); }} style={{ height: "32px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
                    {t.general.cancel}
                  </button>
                </div>
              </div>
            )}

            {items.length === 0 && !addingItem ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>{tl.noItems ?? "Sin mercancías"}</div>
            ) : items.map((item) => (
              <div key={item.id} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gap: "4px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", flex: 1 }}>{item.description}</span>
                  <button onClick={() => handleDeleteItem(item.id)} style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div style={{ display: "flex", gap: "10px", fontSize: "10px", color: "var(--color-text-muted)", flexWrap: "wrap" }}>
                  <span>Cant: {item.quantity} {item.unit}</span>
                  {item.weight_kg > 0 && <span>{item.weight_kg} kg / {item.weight_lbs} lbs</span>}
                  {item.packaging_type && <span>Embalaje: {item.packaging_type}</span>}
                  {item.tariff_code && <span>Fracción: {item.tariff_code}</span>}
                  {item.commercial_value > 0 && <span style={{ color: "var(--color-success-text)", fontWeight: 700 }}>{item.currency} ${item.commercial_value}</span>}
                  {item.country_of_origin && <span>Origen: {item.country_of_origin}</span>}
                </div>
                {item.sat_product_code && <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>SAT: {item.sat_product_code}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ── INSTRUCTIONS ── */}
        {tab === "instructions" && (
          <div style={{ display: "grid", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {tl.specialInstructions ?? "Instrucciones especiales"}
              </div>
              {editing ? (
                <textarea rows={6} value={(form as any).special_instructions ?? ""} onChange={(e) => set("special_instructions", e.target.value)} placeholder={isCCP ? "Instrucciones al transportista: manejo, temperatura, acceso, contacto en destino…" : isBOL ? "Special handling instructions, notifications, delivery requirements…" : "Instrucciones al agente aduanal: tipo de despacho, pedimento previo, documentos requeridos…"} style={{ ...INPUT, height: "auto", padding: "10px", resize: "vertical", lineHeight: 1.6 }} />
              ) : (
                <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "12px", color: order.special_instructions ? "var(--color-text-primary)" : "var(--color-text-muted)", lineHeight: 1.6, minHeight: "80px" }}>
                  {order.special_instructions ?? "Sin instrucciones especiales."}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tl.notes ?? "Notas internas"}</div>
              {editing ? (
                <textarea rows={3} value={(form as any).notes ?? ""} onChange={(e) => set("notes", e.target.value)} style={{ ...INPUT, height: "auto", padding: "10px", resize: "vertical", lineHeight: 1.6 }} />
              ) : (
                <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "12px", color: "var(--color-warning-text)", lineHeight: 1.6, minHeight: "50px" }}>
                  {order.notes ?? <span style={{ color: "var(--color-text-muted)" }}>Sin notas internas.</span>}
                </div>
              )}
            </div>

            {/* Tipo de documento info */}
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: typeCfg.bg, border: `1px solid ${typeCfg.border}`, fontSize: "12px", color: typeCfg.color, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, marginBottom: "4px" }}>{typeLabel}</div>
              <div style={{ fontSize: "11px" }}>{typeCfg.description}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
