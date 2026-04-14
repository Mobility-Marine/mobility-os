"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { Warehouse, CreateWarehousePayload, WarehouseType } from "../types/inventarios.types";
import { WAREHOUSE_TYPE_CONFIG } from "../types/inventarios.types";

type Props = {
  warehouses: Warehouse[];
  saving:     boolean;
  onCreate:   (payload: CreateWarehousePayload) => Promise<void>;
  onUpdate:   (id: string, payload: Partial<CreateWarehousePayload>) => Promise<void>;
};

const EMPTY: CreateWarehousePayload = {
  name: "", code: "", address: "", city: "",
  type: "own", manager: "", phone: "", email: "", notes: "",
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

export default function InventarioAlmacenes({ warehouses, saving, onCreate, onUpdate }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Warehouse | null>(null);
  const [form,     setForm]     = useState<CreateWarehousePayload>(EMPTY);
  const [error,    setError]    = useState<string | null>(null);

  function openNew() { setEditing(null); setForm(EMPTY); setShowForm(true); setError(null); }
  function openEdit(w: Warehouse) {
    setEditing(w);
    setForm({ name: w.name, code: w.code ?? "", address: w.address ?? "", city: w.city ?? "", type: w.type ?? "own", manager: w.manager ?? "", phone: w.phone ?? "", email: w.email ?? "", notes: w.notes ?? "" });
    setShowForm(true);
    setError(null);
  }
  function setF(k: string, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSave() {
    if (!form.name.trim()) { setError(es ? "El nombre es requerido" : "Name is required"); return; }
    setError(null);
    try {
      if (editing) await onUpdate(editing.id, form);
      else         await onCreate(form);
      setShowForm(false);
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          {warehouses.length} {es ? "almacenes" : "warehouses"}
        </div>
        <button onClick={openNew} style={{ height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {es ? "Nuevo almacén" : "New warehouse"}
        </button>
      </div>

      {/* Lista de almacenes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
        {warehouses.map((w) => (
          <div key={w.id} style={{ background: "var(--color-bg-base)", border: `1px solid ${w.is_default ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`, borderRadius: "var(--radius-lg)", padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-text-primary)" }}>{w.name}</div>
                  {w.is_default && (
                    <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 6px", borderRadius: "var(--radius-full)", background: "var(--color-info-bg)", color: "var(--color-brand-blue)", border: "1px solid var(--color-info-border)" }}>
                      {es ? "Principal" : "Default"}
                    </span>
                  )}
                </div>
                {w.code && <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>{w.code}</div>}
              </div>
              <button onClick={() => openEdit(w)} style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                {es ? "Editar" : "Edit"}
              </button>
            </div>
            <div style={{ display: "grid", gap: "4px" }}>
              {[
                { l: es ? "Tipo"       : "Type",     v: es ? WAREHOUSE_TYPE_CONFIG[w.type ?? "own"].labelEs : WAREHOUSE_TYPE_CONFIG[w.type ?? "own"].labelEn },
                { l: es ? "Ciudad"     : "City",     v: w.city    },
                { l: es ? "Dirección"  : "Address",  v: w.address },
                { l: es ? "Responsable": "Manager",  v: w.manager },
                { l: es ? "Teléfono"   : "Phone",    v: w.phone   },
              ].map((r) => r.v ? (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
                  <span style={{ color: "var(--color-text-second)", fontWeight: 600 }}>{r.v}</span>
                </div>
              ) : null)}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginTop: "4px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>{es ? "Estado" : "Status"}</span>
                <span style={{ color: w.is_active ? "var(--color-success-text)" : "var(--color-danger-text)", fontWeight: 700 }}>
                  {w.is_active ? (es ? "Activo" : "Active") : (es ? "Inactivo" : "Inactive")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FORM PANEL */}
      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 400 }} />
          <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(480px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {editing ? (es ? "Editar almacén" : "Edit warehouse") : (es ? "Nuevo almacén" : "New warehouse")}
              </div>
              <button onClick={() => setShowForm(false)} style={{ width: "28px", height: "28px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "12px", alignContent: "start" }}>
              {[
                { k: "name",    l: es ? "Nombre *"    : "Name *",     ph: es ? "Almacén principal" : "Main warehouse", req: true },
                { k: "code",    l: es ? "Código"       : "Code",       ph: "ALM-01" },
                { k: "city",    l: es ? "Ciudad"       : "City",       ph: "Aguascalientes" },
                { k: "address", l: es ? "Dirección"    : "Address",    ph: es ? "Av. Principal 123" : "123 Main St." },
                { k: "manager", l: es ? "Responsable"  : "Manager",    ph: "Juan Pérez" },
                { k: "phone",   l: es ? "Teléfono"     : "Phone",      ph: "+52 449 000 0000" },
                { k: "email",   l: "Email",                              ph: "almacen@empresa.com" },
              ].map((f) => (
                <div key={f.k}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.l}</div>
                  <input value={(form as any)[f.k] ?? ""} onChange={(e) => setF(f.k, e.target.value)} placeholder={f.ph} style={INPUT} />
                </div>
              ))}

              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Tipo" : "Type"}</div>
                <select value={form.type ?? "own"} onChange={(e) => setF("type", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                  {(["own", "external", "transit", "consignment"] as WarehouseType[]).map((t) => (
                    <option key={t} value={t}>{es ? WAREHOUSE_TYPE_CONFIG[t].labelEs : WAREHOUSE_TYPE_CONFIG[t].labelEn}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input type="checkbox" id="is_default" checked={!!(form as any).is_default} onChange={(e) => setF("is_default", e.target.checked)} style={{ cursor: "pointer" }} />
                <label htmlFor="is_default" style={{ fontSize: "12px", color: "var(--color-text-second)", cursor: "pointer" }}>
                  {es ? "Marcar como almacén principal" : "Set as default warehouse"}
                </label>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Notas" : "Notes"}</div>
                <textarea rows={2} value={form.notes ?? ""} onChange={(e) => setF("notes", e.target.value)} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
              </div>

              {error && <div style={{ padding: "10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "12px" }}>{error}</div>}
            </div>

            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px" }}>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                {saving ? (es ? "Guardando…" : "Saving…") : (es ? "Guardar" : "Save")}
              </button>
              <button onClick={() => setShowForm(false)} style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
                {es ? "Cancelar" : "Cancel"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
