"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CreateReceptionPayload, POForReception, ReceptionItem } from "../types/recepciones.types";
import { fetchPendingPOs } from "../services/recepciones.service";
import { useTenant } from "@/lib/tenant/TenantProvider";

type Props = {
  open:     boolean;
  onClose:  () => void;
  onCreate: (
    payload: CreateReceptionPayload,
    items: Omit<ReceptionItem, "id" | "company_id" | "reception_id" | "created_at">[]
  ) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

export default function RecepcionCreateDrawer({ open, onClose, onCreate }: Props) {
  const { lang } = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [step, setStep]       = useState<"po" | "items" | "docs">("po");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [pendingPOs, setPendingPOs] = useState<POForReception[]>([]);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [selectedPO, setSelectedPO] = useState<POForReception | null>(null);
  const [poSearch,   setPoSearch]   = useState("");

  // Formulario recepción
  const [form, setForm] = useState({
    received_date:     new Date().toISOString().split("T")[0],
    warehouse:         "",
    supplier_invoice:  "",
    supplier_remission:"",
    supplier_ref:      "",
    notes:             "",
  });

  // Ítems a recibir (inicializados desde la OC)
  const [items, setItems] = useState<{
    po_item_id: string; description: string; sku: string; unit: string;
    quantity_expected: number; quantity_received: number;
    quantity_accepted: number; quantity_rejected: number; quantity_quarantine: number;
    qc_status: string; condition: string; unit_price: number; qc_notes: string;
  }[]>([]);

  useEffect(() => {
    if (!open || !companyId) return;
    setLoadingPOs(true);
    fetchPendingPOs(companyId)
      .then(setPendingPOs)
      .finally(() => setLoadingPOs(false));
  }, [open, companyId]);

  // Al seleccionar OC, pre-cargar ítems pendientes
  function handleSelectPO(po: POForReception) {
    setSelectedPO(po);
    const pending = (po.items ?? []).filter((i) => Number(i.quantity_pending) > 0);
    setItems(pending.map((i) => ({
      po_item_id:          i.id,
      description:         i.description,
      sku:                 i.sku ?? "",
      unit:                i.unit ?? "pza",
      quantity_expected:   Number(i.quantity_pending),
      quantity_received:   Number(i.quantity_pending),
      quantity_accepted:   Number(i.quantity_pending),
      quantity_rejected:   0,
      quantity_quarantine: 0,
      qc_status:           "pending",
      condition:           "good",
      unit_price:          Number(i.unit_price),
      qc_notes:            "",
    })));
    setStep("items");
  }

  function setItemField(i: number, k: string, v: any) {
    setItems((prev) => prev.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, [k]: v };
      // Auto-calcular: received = accepted + rejected + quarantine
      if (["quantity_accepted", "quantity_rejected", "quantity_quarantine"].includes(k)) {
        const total = Number(updated.quantity_accepted) + Number(updated.quantity_rejected) + Number(updated.quantity_quarantine);
        updated.quantity_received = total;
        // Auto-QC status
        if (Number(updated.quantity_rejected) === Number(updated.quantity_expected)) {
          updated.qc_status = "rejected";
        } else if (Number(updated.quantity_quarantine) > 0) {
          updated.qc_status = "quarantine";
        } else if (Number(updated.quantity_accepted) === Number(updated.quantity_expected)) {
          updated.qc_status = "approved";
        } else if (Number(updated.quantity_accepted) > 0) {
          updated.qc_status = "partial";
        }
      }
      return updated;
    }));
  }

  async function handleCreate() {
    if (!selectedPO) return;
    setSaving(true); setError(null);
    try {
      await onCreate(
        {
          po_id:             selectedPO.id,
          supplier_id:       selectedPO.supplier_id ?? undefined,
          received_date:     form.received_date,
          warehouse:         form.warehouse || undefined,
          supplier_invoice:  form.supplier_invoice  || undefined,
          supplier_remission:form.supplier_remission || undefined,
          supplier_ref:      form.supplier_ref       || undefined,
          notes:             form.notes              || undefined,
        },
        items as any
      );
      handleClose();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  function handleClose() {
    setStep("po"); setSelectedPO(null); setPoSearch("");
    setItems([]); setError(null);
    setForm({ received_date: new Date().toISOString().split("T")[0], warehouse: "", supplier_invoice: "", supplier_remission: "", supplier_ref: "", notes: "" });
    onClose();
  }

  if (!open) return null;

  const filteredPOs = pendingPOs.filter((p) =>
    p.po_number.toLowerCase().includes(poSearch.toLowerCase()) ||
    (p.supplier?.name ?? "").toLowerCase().includes(poSearch.toLowerCase())
  );

  const STEPS = ["po", "items", "docs"] as const;
  const STEP_LABELS = {
    po:    es ? "Orden de Compra" : "Purchase Order",
    items: es ? "Ítems"          : "Items",
    docs:  es ? "Documentos"     : "Documents",
  };

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: "min(680px, 96vw)",
        background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-xl)", zIndex: 401,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* HEADER */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {es ? "Nueva recepción" : "New Reception"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {STEP_LABELS[step]}
              </div>
            </div>
            <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          {/* Progress */}
          <div style={{ display: "flex", gap: "3px" }}>
            {STEPS.map((s, i) => {
              const idx    = STEPS.indexOf(step);
              const done   = i < idx;
              const active = s === step;
              return (
                <div key={s} style={{ flex: 1 }}>
                  <div style={{ height: "3px", borderRadius: "var(--radius-full)", background: done || active ? "var(--color-brand-blue)" : "var(--color-border-faint)" }} />
                  <div style={{ fontSize: "9px", fontWeight: 600, color: active ? "var(--color-brand-blue)" : "var(--color-text-muted)", marginTop: "3px", textTransform: "uppercase" }}>
                    {STEP_LABELS[s]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div style={{ margin: "0 24px", marginTop: "10px", padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px", flexShrink: 0 }}>
            {error}
          </div>
        )}

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>

          {/* ── STEP 1: SELECCIONAR OC ── */}
          {step === "po" && (
            <>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                {es ? "Selecciona la Orden de Compra a recibir. Solo se muestran OCs aprobadas con cantidades pendientes." : "Select the Purchase Order to receive. Only approved POs with pending items are shown."}
              </div>
              <input
                value={poSearch}
                onChange={(e) => setPoSearch(e.target.value)}
                placeholder={es ? "Buscar por número o proveedor…" : "Search by number or supplier…"}
                style={INPUT}
              />
              {loadingPOs ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
                  {es ? "Cargando órdenes…" : "Loading orders…"}
                </div>
              ) : filteredPOs.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-text-muted)" }}>
                  {es ? "No hay órdenes de compra pendientes de recepción" : "No purchase orders pending reception"}
                </div>
              ) : (
                <div style={{ display: "grid", gap: "6px" }}>
                  {filteredPOs.map((po) => (
                    <div
                      key={po.id}
                      onClick={() => handleSelectPO(po)}
                      style={{
                        padding: "14px 16px", borderRadius: "var(--radius-md)", cursor: "pointer",
                        background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        transition: "border-color 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-blue)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border-faint)")}
                    >
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-brand-blue)" }}>{po.po_number}</div>
                        <div style={{ fontSize: "12px", color: "var(--color-text-second)", marginTop: "2px" }}>{po.supplier?.name ?? "—"}</div>
                        {po.expected_date && (
                          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                            {es ? "Fecha esperada:" : "Expected:"} {new Date(po.expected_date).toLocaleDateString(es ? "es-MX" : "en-US")}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                          {po.currency} ${Number(po.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                          {(po.items ?? []).filter((i) => Number(i.quantity_pending) > 0).length} {es ? "ítems pendientes" : "pending items"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── STEP 2: ÍTEMS ── */}
          {step === "items" && (
            <>
              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)" }}>
                {es ? "Verifica las cantidades recibidas. Ajusta Aceptados / Rechazados / Cuarentena según la inspección física." : "Verify received quantities. Adjust Accepted / Rejected / Quarantine per physical inspection."}
              </div>

              {/* Fecha de recepción y almacén */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {es ? "Fecha de recepción *" : "Reception date *"}
                  </div>
                  <input type="date" value={form.received_date} onChange={(e) => setForm((p) => ({ ...p, received_date: e.target.value }))} style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {es ? "Almacén / Ubicación" : "Warehouse / Location"}
                  </div>
                  <input value={form.warehouse} onChange={(e) => setForm((p) => ({ ...p, warehouse: e.target.value }))} placeholder={es ? "Almacén principal…" : "Main warehouse…"} style={INPUT} />
                </div>
              </div>

              {/* Tabla de ítems */}
              <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                {/* Head */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 70px 70px 70px 70px 70px 100px", gap: "6px", padding: "8px 12px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <span>{es ? "Descripción" : "Description"}</span>
                  <span style={{ textAlign: "center" }}>{es ? "Esperado" : "Expected"}</span>
                  <span style={{ textAlign: "center" }}>{es ? "Aceptado" : "Accepted"}</span>
                  <span style={{ textAlign: "center" }}>{es ? "Rechazado" : "Rejected"}</span>
                  <span style={{ textAlign: "center" }}>{es ? "Cuarentena" : "Quarantine"}</span>
                  <span style={{ textAlign: "center" }}>QC</span>
                  <span>{es ? "Condición" : "Condition"}</span>
                </div>
                {items.map((item, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 70px 70px 70px 70px 70px 100px", gap: "6px", padding: "10px 12px", borderBottom: i < items.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{item.description}</div>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{item.sku || item.unit}</div>
                    </div>
                    <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)" }}>
                      {item.quantity_expected}
                    </div>
                    <input
                      type="number" min="0" max={item.quantity_expected}
                      value={item.quantity_accepted}
                      onChange={(e) => setItemField(i, "quantity_accepted", Number(e.target.value))}
                      style={{ ...INPUT, height: "30px", textAlign: "center", padding: "0 4px", fontSize: "12px" }}
                    />
                    <input
                      type="number" min="0" max={item.quantity_expected}
                      value={item.quantity_rejected}
                      onChange={(e) => setItemField(i, "quantity_rejected", Number(e.target.value))}
                      style={{ ...INPUT, height: "30px", textAlign: "center", padding: "0 4px", fontSize: "12px", borderColor: item.quantity_rejected > 0 ? "var(--color-danger-border)" : undefined }}
                    />
                    <input
                      type="number" min="0" max={item.quantity_expected}
                      value={item.quantity_quarantine}
                      onChange={(e) => setItemField(i, "quantity_quarantine", Number(e.target.value))}
                      style={{ ...INPUT, height: "30px", textAlign: "center", padding: "0 4px", fontSize: "12px", borderColor: item.quantity_quarantine > 0 ? "#a78bfa" : undefined }}
                    />
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 5px", borderRadius: "var(--radius-full)", background: item.qc_status === "approved" ? "var(--color-success-bg)" : item.qc_status === "rejected" ? "var(--color-danger-bg)" : "var(--color-warning-bg)", color: item.qc_status === "approved" ? "var(--color-success-text)" : item.qc_status === "rejected" ? "var(--color-danger-text)" : "var(--color-warning-text)" }}>
                        {item.qc_status}
                      </span>
                    </div>
                    <select
                      value={item.condition}
                      onChange={(e) => setItemField(i, "condition", e.target.value)}
                      style={{ ...INPUT, height: "30px", fontSize: "11px" }}
                    >
                      <option value="good">{es ? "Bueno" : "Good"}</option>
                      <option value="damaged">{es ? "Dañado" : "Damaged"}</option>
                      <option value="wrong_item">{es ? "Artículo wrong" : "Wrong item"}</option>
                      <option value="incomplete">{es ? "Incompleto" : "Incomplete"}</option>
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── STEP 3: DOCUMENTOS ── */}
          {step === "docs" && (
            <>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                {es ? "Registra los documentos del proveedor para trazabilidad completa." : "Register supplier documents for full traceability."}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { key: "supplier_invoice",   label: es ? "Factura proveedor"  : "Supplier invoice",   ph: "FAC-2026-001" },
                  { key: "supplier_remission",  label: es ? "Remisión"           : "Remission",          ph: "REM-2026-001" },
                  { key: "supplier_ref",        label: es ? "Referencia adicional" : "Additional ref",   ph: es ? "Referencia…" : "Reference…" },
                ].map((f) => (
                  <div key={f.key}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {f.label}
                    </div>
                    <input
                      value={(form as any)[f.key]}
                      onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.ph}
                      style={INPUT}
                    />
                  </div>
                ))}
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {es ? "Notas" : "Notes"}
                  </div>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder={es ? "Observaciones de la recepción…" : "Reception notes…"}
                    style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }}
                  />
                </div>
              </div>

              {/* Resumen antes de crear */}
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                  {es ? "Resumen" : "Summary"}
                </div>
                <div style={{ display: "grid", gap: "5px" }}>
                  {[
                    { l: es ? "OC"         : "PO",        v: selectedPO?.po_number },
                    { l: es ? "Proveedor"  : "Supplier",  v: selectedPO?.supplier?.name },
                    { l: es ? "Ítems"      : "Items",     v: `${items.length}` },
                    { l: es ? "Aceptados"  : "Accepted",  v: `${items.reduce((s, i) => s + i.quantity_accepted, 0)}` },
                    { l: es ? "Rechazados" : "Rejected",  v: `${items.reduce((s, i) => s + i.quantity_rejected, 0)}` },
                  ].map((r) => r.v ? (
                    <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
                      <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{r.v}</span>
                    </div>
                  ) : null)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          {step !== "po" && (
            <button onClick={() => setStep(step === "docs" ? "items" : "po")} style={{ height: "40px", padding: "0 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
              ← {es ? "Atrás" : "Back"}
            </button>
          )}
          {step === "items" && (
            <button onClick={() => setStep("docs")} disabled={items.length === 0} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: items.length > 0 ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: items.length > 0 ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: items.length > 0 ? "pointer" : "not-allowed" }}>
              {es ? "Siguiente" : "Next"} →
            </button>
          )}
          {step === "docs" && (
            <button onClick={handleCreate} disabled={saving} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? (es ? "Guardando…" : "Saving…") : (es ? "Crear recepción" : "Create reception")}
            </button>
          )}
          <button onClick={handleClose} style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            {es ? "Cancelar" : "Cancel"}
          </button>
        </div>
      </div>
    </>
  );
}
