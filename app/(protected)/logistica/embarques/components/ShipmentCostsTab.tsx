"use client";
import { useState, useEffect } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { usePermissions } from "@/lib/auth/usePermissions";
import { supabase } from "@/lib/supabaseClient";
import type { Shipment } from "../types/shipments.types";
import {
  listShipmentCosts,
  createShipmentCost,
  updateShipmentCost,
  deleteShipmentCost,
  toggleRequiresSupplierInvoice,
  fetchShipmentFinancials,
  type ShipmentCost,
  type ShipmentFinancials,
} from "../services/shipments.service";
import { convertCostPendingToInvoice } from "../../../finanzas/cxp/services/cxp.service";

type Props = {
  shipment: Shipment;
  onReload: () => Promise<void>;
};

type DrawerState =
  | { mode: "create"; preselectType: "cost_pending" | "invoice" }
  | { mode: "edit"; cost: ShipmentCost }
  | { mode: "convert"; cost: ShipmentCost };

const fmt = (n: number) =>
  Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function ShipmentCostsTab({ shipment, onReload }: Props) {
  const { companyId } = useTenant();
  const {
    canRegisterShipmentCost,
    canConvertCostToInvoice,
    canToggleRequiresInvoice,
  } = usePermissions();

  const [costs, setCosts] = useState<ShipmentCost[]>([]);
  const [financials, setFinancials] = useState<ShipmentFinancials | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingFlag, setSavingFlag] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);

  // Default true si no está seteado (compatibilidad backwards)
  const requiresInvoice = shipment.requires_supplier_invoice !== false;

  async function reload() {
    if (!companyId) return;
    setLoading(true);
    const [c, f] = await Promise.all([
      listShipmentCosts(companyId, shipment.id),
      fetchShipmentFinancials(companyId, shipment.id),
    ]);
    setCosts(c);
    setFinancials(f);
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipment.id, companyId]);

  // Mantiene shipment.provider_cost legacy en sync (compat con CxPPendientes viejo)
  // Suma SOLO los costos en la moneda principal del embarque.
  async function syncLegacyProviderCost(latestCosts: ShipmentCost[]) {
    if (!companyId) return;
    const sameCur = latestCosts.filter((c) => c.currency === shipment.currency);
    const total = sameCur.reduce((s, c) => s + Number(c.total ?? 0), 0);
    await supabase
      .from("shipments")
      .update({
        provider_cost: total,
        profit: (Number(shipment.total) || 0) - total,
        updated_at: new Date().toISOString(),
      })
      .eq("id", shipment.id)
      .eq("company_id", companyId);
  }

  async function refreshAll() {
    await reload();
    const fresh = await listShipmentCosts(companyId!, shipment.id);
    await syncLegacyProviderCost(fresh);
    await onReload();
  }

  async function handleToggleRequires(newValue: boolean) {
    if (!companyId) return;
    setSavingFlag(true);
    try {
      await toggleRequiresSupplierInvoice(companyId, shipment.id, newValue);
      await onReload();
    } finally {
      setSavingFlag(false);
    }
  }

  async function handleDelete(cost: ShipmentCost) {
    if (!companyId) return;
    const label =
      cost.document_type === "cost_pending"
        ? "este costo provisional"
        : "este registro";
    if (!confirm(`¿Eliminar ${label}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteShipmentCost(companyId, cost.id);
      await refreshAll();
    } catch (e: any) {
      alert(e.message);
    }
  }

  // ─── RENDER: cargando ───────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>
        Cargando costos…
      </div>
    );
  }

  // ─── RENDER: flag desactivado (consultoría / seguro) ────────
  if (!requiresInvoice) {
    return (
      <div style={{ display: "grid", gap: "14px" }}>
        <div style={{ padding: "14px 18px", borderRadius: "var(--radius-md)", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>📋</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#8b5cf6", marginBottom: "4px" }}>
              Este servicio no requiere facturas de proveedor
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.6 }}>
              No se generan costos ni aparece en Cuentas por Pagar. Típico para servicios de consultoría, seguros y asesorías que no involucran proveedores externos.
            </div>
          </div>
        </div>
        {canToggleRequiresInvoice && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => handleToggleRequires(true)} disabled={savingFlag}
              style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: savingFlag ? "not-allowed" : "pointer", opacity: savingFlag ? 0.6 : 1 }}>
              {savingFlag ? "Activando…" : "Activar facturas de proveedor"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── RENDER: flag activado ──────────────────────────────────
  const totalsByCurrency: Record<string, number> = {};
  for (const c of costs) {
    totalsByCurrency[c.currency] = (totalsByCurrency[c.currency] ?? 0) + Number(c.total ?? 0);
  }
  const invoiceCount = costs.filter((c) => c.document_type === "invoice").length;
  const pendingCount = costs.filter((c) => c.document_type === "cost_pending").length;

  const totalCostsLabel = Object.keys(totalsByCurrency).length === 0
    ? "—"
    : Object.entries(totalsByCurrency).map(([cur, v]) => `${cur} $${fmt(v)}`).join(" · ");

  const sameMoneda = financials && financials.currency === shipment.currency;
  const marginValue = sameMoneda ? `${shipment.currency} $${fmt(financials.margin)}` : "Multi-moneda";
  const marginPct   = financials ? Number(financials.margin_pct ?? 0) : 0;
  const marginColor = !financials ? "var(--color-text-muted)"
    : financials.margin >= 0 && marginPct >= 20 ? "var(--color-success-text)"
    : marginPct >= 10 ? "var(--color-warning-text)"
    : "var(--color-danger-text)";

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        <KPIBox label="Total costos" value={totalCostsLabel} color="var(--color-danger-text)" />
        <KPIBox
          label={`Facturas (${invoiceCount}/${invoiceCount + pendingCount})`}
          value={pendingCount > 0 ? `${pendingCount} pendiente${pendingCount > 1 ? "s" : ""}` : invoiceCount === 0 ? "Sin captura" : "Completo"}
          color={pendingCount > 0 ? "var(--color-warning-text)" : invoiceCount === 0 ? "var(--color-text-muted)" : "var(--color-success-text)"}
        />
        <KPIBox label="Margen" value={marginValue} color={marginColor} />
        <KPIBox label="% Margen" value={financials ? `${marginPct.toFixed(1)}%` : "—"} color={marginColor} />
      </div>

      {/* Toggle desactivar (solo si no hay costos) */}
      {canToggleRequiresInvoice && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-6px" }}>
          <button onClick={() => handleToggleRequires(false)} disabled={savingFlag || costs.length > 0}
            title={costs.length > 0 ? "No se puede desactivar mientras existan costos registrados" : "Desactivar — el embarque dejará de aparecer en CXP"}
            style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "transparent", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)", fontSize: "10px", cursor: costs.length > 0 ? "not-allowed" : "pointer", opacity: costs.length > 0 ? 0.4 : 1 }}>
            Desactivar facturas de proveedor
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          {costs.length === 0 ? "Sin costos registrados" : `${costs.length} ${costs.length === 1 ? "registro" : "registros"}`}
        </div>
        {canRegisterShipmentCost && (
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => setDrawer({ mode: "create", preselectType: "cost_pending" })}
              style={{ height: "30px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-warning-border)", color: "var(--color-warning-text)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
              + Costo provisional
            </button>
            <button onClick={() => setDrawer({ mode: "create", preselectType: "invoice" })}
              style={{ height: "30px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
              + Capturar factura
            </button>
          </div>
        )}
      </div>

      {/* Lista de costos */}
      {costs.length === 0 ? (
        <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
          Sin costos registrados aún. Usa los botones de arriba para agregar un costo provisional o capturar una factura del proveedor.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "6px" }}>
          {costs.map((cost) => (
            <CostRow
              key={cost.id}
              cost={cost}
              shipmentCurrency={shipment.currency}
              canEdit={canRegisterShipmentCost}
              canConvert={canConvertCostToInvoice}
              onEdit={() => setDrawer({ mode: "edit", cost })}
              onConvert={() => setDrawer({ mode: "convert", cost })}
              onDelete={() => handleDelete(cost)}
            />
          ))}
        </div>
      )}

      {/* Drawer */}
      {drawer && (
        <CostFormDialog
          mode={drawer.mode}
          shipment={shipment}
          existing={"cost" in drawer ? drawer.cost : undefined}
          preselectType={"preselectType" in drawer ? drawer.preselectType : undefined}
          onClose={() => setDrawer(null)}
          onSaved={async () => {
            setDrawer(null);
            await refreshAll();
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// KPI BOX
// ─────────────────────────────────────────────────────────────
function KPIBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
      <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "13px", fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FILA DE COSTO
// ─────────────────────────────────────────────────────────────
function CostRow({
  cost, shipmentCurrency, canEdit, canConvert, onEdit, onConvert, onDelete,
}: {
  cost: ShipmentCost;
  shipmentCurrency: string;
  canEdit: boolean;
  canConvert: boolean;
  onEdit: () => void;
  onConvert: () => void;
  onDelete: () => void;
}) {
  const isPending = cost.document_type === "cost_pending";
  const typeColor = isPending ? "var(--color-warning-text)" : "var(--color-brand-blue)";
  const typeBg    = isPending ? "var(--color-warning-bg)"   : "var(--color-info-bg)";
  const typeBd    = isPending ? "var(--color-warning-border)" : "var(--color-info-border)";

  return (
    <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: "12px", alignItems: "center" }}>
      <span style={{ fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "var(--radius-full)", background: typeBg, color: typeColor, border: `1px solid ${typeBd}`, whiteSpace: "nowrap" }}>
        {isPending ? "🕒 Provisional" : "🧾 Factura"}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cost.supplier_name}
          {cost.document_number && <span style={{ fontWeight: 400, color: "var(--color-text-muted)", marginLeft: "6px" }}>· {cost.document_number}</span>}
        </div>
        <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
          {new Date(cost.document_date).toLocaleDateString("es-MX")}
          {!cost.has_tax && <span style={{ marginLeft: "6px", color: "var(--color-warning-text)" }}>· sin IVA</span>}
          {cost.pdf_url && (<a href={cost.pdf_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "6px", color: "var(--color-brand-blue)", textDecoration: "none", fontWeight: 600 }}>PDF</a>)}
          {cost.xml_url && (<a href={cost.xml_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "6px", color: "var(--color-brand-blue)", textDecoration: "none", fontWeight: 600 }}>XML</a>)}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
          {cost.currency} ${fmt(cost.total)}
        </div>
        {cost.currency !== shipmentCurrency && (
          <div style={{ fontSize: "9px", color: "var(--color-warning-text)", marginTop: "1px" }}>
            ≠ moneda embarque
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
        {isPending && canConvert && (
          <button onClick={onConvert} title="Convertir a factura"
            style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>
            ↑ Subir factura
          </button>
        )}
        {canEdit && (
          <>
            <button onClick={onEdit} title="Editar"
              style={{ width: "26px", height: "26px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-second)" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onClick={onDelete} disabled={cost.paid_amount > 0.01}
              title={cost.paid_amount > 0.01 ? "Tiene pagos — cancela desde CXP" : "Eliminar"}
              style={{ width: "26px", height: "26px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: cost.paid_amount > 0.01 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: cost.paid_amount > 0.01 ? 0.4 : 1 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DRAWER (CostFormDialog)
// ─────────────────────────────────────────────────────────────
function CostFormDialog({
  mode, shipment, existing, preselectType, onClose, onSaved,
}: {
  mode: "create" | "edit" | "convert";
  shipment: Shipment;
  existing?: ShipmentCost;
  preselectType?: "cost_pending" | "invoice";
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { companyId } = useTenant();
  const [providers, setProviders] = useState<{ id: string; name: string; rfc?: string | null }[]>([]);
  const [saving, setSaving] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialDocType: "cost_pending" | "invoice" =
    mode === "convert" ? "invoice"
    : mode === "edit" && existing ? (existing.document_type as any)
    : preselectType ?? "cost_pending";

  const [form, setForm] = useState({
    document_type: initialDocType,
    logistics_provider_id: existing?.logistics_provider_id ?? shipment.provider_id ?? "",
    supplier_name: existing?.supplier_name ?? (shipment as any).provider?.name ?? "",
    supplier_rfc: existing?.supplier_rfc ?? "",
    document_number: existing?.document_number ?? "",
    document_date: existing?.document_date ?? new Date().toISOString().split("T")[0],
    due_date: existing?.due_date ?? "",
    currency: existing?.currency ?? shipment.currency ?? "USD",
    has_tax: existing?.has_tax ?? (shipment.currency === "MXN"),
    subtotal: existing ? String(existing.subtotal) : "",
    tax_amount: existing ? String(existing.tax_amount) : "",
    total: existing ? String(existing.total) : "",
    notes: existing?.notes ?? "",
  });

  useEffect(() => {
    if (!companyId) return;
    supabase.from("business_partners")
      .select("id, name, rfc")
      .eq("company_id", companyId)
      .eq("is_logistics_provider", true)
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => setProviders(data ?? []));
  }, [companyId]);

  function setHasTax(value: boolean) {
    setForm((f) => {
      const sub = parseFloat(f.subtotal) || 0;
      if (value) {
        const tax = sub * 0.16;
        return { ...f, has_tax: true, tax_amount: tax.toFixed(2), total: (sub + tax).toFixed(2) };
      }
      return { ...f, has_tax: false, tax_amount: "0", total: f.subtotal || "0" };
    });
  }

  function calcFromSubtotal(val: string) {
    const n = parseFloat(val) || 0;
    setForm((f) => {
      if (f.has_tax) {
        const tax = n * 0.16;
        return { ...f, subtotal: val, tax_amount: tax.toFixed(2), total: (n + tax).toFixed(2) };
      }
      return { ...f, subtotal: val, tax_amount: "0", total: val };
    });
  }

  function calcFromTotal(val: string) {
    const n = parseFloat(val) || 0;
    setForm((f) => {
      if (f.has_tax) {
        const sub = n / 1.16;
        return { ...f, total: val, subtotal: sub.toFixed(2), tax_amount: (n - sub).toFixed(2) };
      }
      return { ...f, total: val, subtotal: val, tax_amount: "0" };
    });
  }

  function selectProvider(id: string) {
    const p = providers.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      logistics_provider_id: id,
      supplier_name: p?.name ?? f.supplier_name,
      supplier_rfc: p?.rfc ?? f.supplier_rfc,
    }));
  }

  async function uploadFile(file: File, type: "pdf" | "xml"): Promise<string | null> {
    if (!companyId) return null;
    const ext = type === "pdf" ? "pdf" : "xml";
    const path = `${companyId}/cxp/${Date.now()}-${type}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("financial-documents")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) return null;
    const { data } = supabase.storage.from("financial-documents").getPublicUrl(path);
    return data?.publicUrl ?? null;
  }

  async function handleSave() {
    if (!companyId) { setError("No hay empresa activa"); return; }
    if (!form.supplier_name.trim()) { setError("Selecciona o escribe el proveedor"); return; }
    const total = parseFloat(form.total);
    if (!total || total <= 0) { setError("Ingresa un total mayor a cero"); return; }
    if ((form.document_type === "invoice" || mode === "convert") && !form.document_number.trim()) {
      setError("Para una factura debes ingresar el folio del documento");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      let pdf_url: string | null = existing?.pdf_url ?? null;
      let xml_url: string | null = existing?.xml_url ?? null;
      if (pdfFile) pdf_url = await uploadFile(pdfFile, "pdf");
      if (xmlFile) xml_url = await uploadFile(xmlFile, "xml");

      const subtotal = parseFloat(form.subtotal) || 0;
      const tax_amount = parseFloat(form.tax_amount) || 0;

      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? "";

      if (mode === "create") {
        await createShipmentCost(companyId, userId, {
          shipment_id: shipment.id,
          document_type: form.document_type,
          supplier_type: "logistics",
          logistics_provider_id: form.logistics_provider_id || null,
          supplier_name: form.supplier_name,
          supplier_rfc: form.supplier_rfc || null,
          document_number: form.document_number || null,
          document_date: form.document_date,
          due_date: form.due_date || null,
          currency: form.currency,
          has_tax: form.has_tax,
          subtotal, tax_amount, total,
          notes: form.notes || null,
          pdf_url, xml_url,
        });
      } else if (mode === "edit" && existing) {
        await updateShipmentCost(companyId, existing.id, {
          document_type: form.document_type,
          logistics_provider_id: form.logistics_provider_id || null,
          supplier_name: form.supplier_name,
          supplier_rfc: form.supplier_rfc || null,
          document_number: form.document_number || null,
          document_date: form.document_date,
          due_date: form.due_date || null,
          currency: form.currency,
          has_tax: form.has_tax,
          subtotal, tax_amount, total,
          notes: form.notes || null,
          pdf_url, xml_url,
        });
      } else if (mode === "convert" && existing) {
        await convertCostPendingToInvoice(companyId, existing.id, {
          document_number: form.document_number,
          document_date: form.document_date,
          due_date: form.due_date || null,
          has_tax: form.has_tax,
          subtotal, tax_amount, total,
          xml_url, pdf_url,
          notes: form.notes || null,
        });
      }
      await onSaved();
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  const title = mode === "convert" ? "Convertir costo provisional en factura"
    : mode === "edit" ? "Editar costo"
    : form.document_type === "invoice" ? "Capturar factura del proveedor"
    : "Nuevo costo provisional";

  const isInvoiceMode = form.document_type === "invoice" || mode === "convert";

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 600 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(560px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", zIndex: 601, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-text-primary)" }}>{title}</div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>{shipment.reference}</div>
          </div>
          <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "12px", alignContent: "start" }}>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "12px" }}>
              {error}
            </div>
          )}

          {mode === "create" && (
            <div>
              <Label>Tipo de registro</Label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { v: "cost_pending", icon: "🕒", title: "Solo costo", desc: "Sin factura aún" },
                  { v: "invoice",      icon: "🧾", title: "Capturar factura", desc: "Con CFDI / folio" },
                ].map((o) => {
                  const active = form.document_type === o.v;
                  return (
                    <button key={o.v} type="button" onClick={() => setForm((f) => ({ ...f, document_type: o.v as any }))}
                      style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", border: `2px solid ${active ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`, background: active ? "var(--color-info-bg)" : "var(--color-bg-subtle)", cursor: "pointer", textAlign: "left" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: active ? "var(--color-info-text)" : "var(--color-text-primary)" }}>
                        {o.icon} {o.title}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>{o.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <Label>Proveedor *</Label>
            <select value={form.logistics_provider_id} onChange={(e) => selectProvider(e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
              <option value="">— Seleccionar del catálogo —</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {!form.logistics_provider_id && (
              <input value={form.supplier_name} onChange={(e) => setForm((f) => ({ ...f, supplier_name: e.target.value }))}
                placeholder="O escribe el nombre del proveedor" style={{ ...INPUT, marginTop: "6px" }} />
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <Label>RFC (opcional)</Label>
              <input value={form.supplier_rfc} onChange={(e) => setForm((f) => ({ ...f, supplier_rfc: e.target.value.toUpperCase() }))} style={INPUT} />
            </div>
            <div>
              <Label>Moneda</Label>
              <select value={form.currency} onChange={(e) => {
                const cur = e.target.value;
                setForm((f) => ({ ...f, currency: cur, has_tax: cur === "MXN" }));
              }} style={{ ...INPUT, cursor: "pointer" }}>
                {["MXN", "USD", "EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <Label>{isInvoiceMode ? "Folio factura *" : "Folio (opcional)"}</Label>
              <input value={form.document_number} onChange={(e) => setForm((f) => ({ ...f, document_number: e.target.value }))} placeholder={isInvoiceMode ? "FAC-001" : "—"} style={INPUT} />
            </div>
            <div>
              <Label>Fecha documento *</Label>
              <input type="date" value={form.document_date} onChange={(e) => setForm((f) => ({ ...f, document_date: e.target.value }))} style={INPUT} />
            </div>
          </div>

          <div>
            <Label>Fecha vencimiento (opcional)</Label>
            <input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} style={INPUT} />
          </div>

          {/* has_tax toggle */}
          <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.has_tax} onChange={(e) => setHasTax(e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>Calcular IVA (16%)</div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                  {form.has_tax ? "El IVA se calculará y sumará al subtotal" : "Sin IVA — total = subtotal (típico facturas extranjeras)"}
                </div>
              </div>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <div>
              <Label>Subtotal *</Label>
              <input type="number" min="0" value={form.subtotal} onChange={(e) => calcFromSubtotal(e.target.value)} placeholder="0.00" style={INPUT} />
            </div>
            <div>
              <Label>IVA</Label>
              <input type="number" min="0" value={form.tax_amount} onChange={(e) => setForm((f) => ({ ...f, tax_amount: e.target.value }))} disabled={!form.has_tax} placeholder="0.00" style={{ ...INPUT, opacity: form.has_tax ? 1 : 0.5 }} />
            </div>
            <div>
              <Label>Total *</Label>
              <input type="number" min="0" value={form.total} onChange={(e) => calcFromTotal(e.target.value)} placeholder="0.00" style={INPUT} />
            </div>
          </div>

          {(isInvoiceMode) && (
            <div>
              <Label>Adjuntar (opcional)</Label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { kind: "pdf", file: pdfFile, setFile: setPdfFile, label: "PDF", color: "var(--color-danger-text)", accept: ".pdf,application/pdf" },
                  { kind: "xml", file: xmlFile, setFile: setXmlFile, label: "XML", color: "var(--color-brand-blue)", accept: ".xml,text/xml,application/xml" },
                ].map((f) => (
                  <label key={f.kind} style={{ display: "flex", alignItems: "center", gap: "6px", height: "34px", padding: "0 10px", borderRadius: "var(--radius-md)", border: `1px dashed ${f.file ? f.color : "var(--color-border)"}`, background: f.file ? `${f.color}10` : "var(--color-bg-subtle)", cursor: "pointer", fontSize: "11px", color: f.file ? f.color : "var(--color-text-muted)", fontWeight: f.file ? 600 : 400 }}>
                    {f.file ? f.file.name.slice(0, 22) + (f.file.name.length > 22 ? "…" : "") : `Subir ${f.label}`}
                    <input type="file" accept={f.accept} style={{ display: "none" }} onChange={(e) => f.setFile(e.target.files?.[0] ?? null)} />
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>Notas</Label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px" }}>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Guardando…" : mode === "convert" ? "Convertir en factura" : mode === "edit" ? "Guardar cambios" : "Crear"}
          </button>
          <button onClick={onClose}
            style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {children}
    </div>
  );
}