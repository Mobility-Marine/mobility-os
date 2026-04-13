"use client";

import { useState } from "react";
import type { ClientAddress, AddressType } from "../types/clients.types";
import { ADDRESS_TYPE_CONFIG } from "../types/clients.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  addresses:  ClientAddress[];
  clientId:   string | null;
  onAdd:      (payload: any) => Promise<void>;
  onRemove:   (id: string) => Promise<void>;
  onDefault:  (id: string) => Promise<void>;
  loading?:   boolean;
};

const ADDRESS_TYPES: AddressType[] = ["delivery", "warehouse", "pickup", "other"];

const INPUT: React.CSSProperties = {
  width: "100%", height: "32px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-base)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

const EMPTY_FORM = {
  type: "delivery" as AddressType, alias: "",
  street: "", ext_number: "", int_number: "",
  neighborhood: "", city: "", state: "",
  zip_code: "", country: "México",
  is_default: false, notes: "",
};

export default function ClientAddresses({
  addresses, clientId, onAdd, onRemove, onDefault, loading,
}: Props) {
  const { t }                 = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [form, setForm]         = useState(EMPTY_FORM);

  function set(k: string, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleAdd() {
    if (!form.zip_code.trim()) { setError("Código postal requerido"); return; }
    setSaving(true);
    try {
      await onAdd({ ...form });
      setForm(EMPTY_FORM);
      setShowForm(false);
      setError(null);
    } finally { setSaving(false); }
  }

  const getTypeLabel = (type: AddressType) => {
    const cfg = ADDRESS_TYPE_CONFIG[type];
    return (t.clients as any)?.[cfg.labelKey.replace("clients.", "")] ?? type;
  };

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "18px",
      display: "flex", flexDirection: "column", gap: "12px",
      height: "100%", width: "100%",
    }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-second)" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {(t.clients as any)?.addresses ?? "Direcciones"}
          </span>
          <span style={{ fontSize: "11px", padding: "1px 6px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>
            {addresses.length}
          </span>
        </div>
        {clientId && (
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{
              height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)",
              background: showForm ? "var(--color-bg-subtle)" : "var(--color-brand-blue)",
              color: showForm ? "var(--color-text-muted)" : "#fff", border: "none",
              fontSize: "11px", fontWeight: 600, cursor: "pointer",
            }}
          >
            {showForm ? t.general.cancel : `+ ${(t.clients as any)?.addAddress ?? "Agregar"}`}
          </button>
        )}
      </div>

      {/* FORM */}
      {showForm && (
        <div style={{
          background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)", padding: "14px",
          display: "grid", gap: "10px", flexShrink: 0,
        }}>
          {error && <div style={{ fontSize: "12px", color: "var(--color-danger-text)" }}>{error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tipo</div>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                {ADDRESS_TYPES.map((type) => <option key={type} value={type}>{getTypeLabel(type)}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {(t.clients as any)?.alias ?? "Alias / Nombre"}
              </div>
              <input value={form.alias} onChange={(e) => set("alias", e.target.value)} placeholder="Bodega Norte, Planta GDL…" style={INPUT} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "8px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Calle</div>
              <input value={form.street} onChange={(e) => set("street", e.target.value)} placeholder="Av. Principal" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>No. Ext.</div>
              <input value={form.ext_number} onChange={(e) => set("ext_number", e.target.value)} placeholder="123" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>No. Int.</div>
              <input value={form.int_number} onChange={(e) => set("int_number", e.target.value)} placeholder="A" style={INPUT} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Colonia</div>
              <input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} placeholder="Col. Centro" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>C.P. *</div>
              <input value={form.zip_code} onChange={(e) => set("zip_code", e.target.value)} placeholder="44100" style={INPUT} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ciudad</div>
              <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Guadalajara" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Estado</div>
              <input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="Jalisco" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>País</div>
              <input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="México" style={INPUT} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px", color: "var(--color-text-second)" }}>
              <input type="checkbox" checked={form.is_default} onChange={(e) => set("is_default", e.target.checked)} />
              {(t.clients as any)?.defaultAddress ?? "Dirección predeterminada"}
            </label>
            <button onClick={handleAdd} disabled={saving || !form.zip_code.trim()} style={{
              height: "30px", padding: "0 16px", borderRadius: "var(--radius-md)",
              background: "var(--color-brand-blue)", color: "#fff", border: "none",
              fontSize: "12px", fontWeight: 600, cursor: "pointer",
            }}>
              {saving ? t.general.loading : t.general.save}
            </button>
          </div>
        </div>
      )}

      {/* LIST */}
      {!clientId ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
          {(t.clients as any)?.workspaceEmpty ?? "Selecciona un cliente"}
        </div>
      ) : loading ? (
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{t.general.loading}</div>
      ) : addresses.length === 0 ? (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "8px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)",
          color: "var(--color-text-muted)", fontSize: "13px", padding: "24px", minHeight: "80px",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {(t.clients as any)?.noAddresses ?? "Sin direcciones registradas"}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", display: "grid", gap: "8px", alignContent: "start" }}>
          {addresses.map((addr) => {
            const cfg   = ADDRESS_TYPE_CONFIG[addr.type] ?? ADDRESS_TYPE_CONFIG.other;
            const label = (t.clients as any)?.[cfg.labelKey.replace("clients.", "")] ?? addr.type;

            const fullAddress = [
              addr.street && `${addr.street} ${addr.ext_number ?? ""}${addr.int_number ? ` Int. ${addr.int_number}` : ""}`.trim(),
              addr.neighborhood,
              `C.P. ${addr.zip_code}`,
              addr.city,
              addr.state,
            ].filter(Boolean).join(", ");

            return (
              <div key={addr.id} style={{
                padding: "10px 12px", borderRadius: "var(--radius-md)",
                background: "var(--color-bg-subtle)",
                border: `1px solid ${addr.is_default ? "var(--color-brand-blue)40" : "var(--color-border-faint)"}`,
                display: "grid", gap: "4px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "11px", fontWeight: 700, color: cfg.color }}>{label}</span>
                  {addr.alias && <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-primary)" }}>— {addr.alias}</span>}
                  {addr.is_default && (
                    <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: "var(--color-brand-blue)20", color: "var(--color-brand-blue)", marginLeft: "auto" }}>
                      {(t.clients as any)?.default ?? "Predeterminada"}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-second)", lineHeight: 1.5 }}>{fullAddress}</div>
                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                  {!addr.is_default && (
                    <button onClick={() => onDefault(addr.id)} style={{
                      height: "24px", padding: "0 10px", borderRadius: "var(--radius-sm)",
                      background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)",
                      fontSize: "10px", fontWeight: 600, color: "var(--color-info-text)", cursor: "pointer",
                    }}>
                      {(t.clients as any)?.setDefault ?? "Predeterminar"}
                    </button>
                  )}
                  <button onClick={() => onRemove(addr.id)} style={{
                    height: "24px", width: "24px", borderRadius: "var(--radius-sm)",
                    background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "var(--color-danger-text)",
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
