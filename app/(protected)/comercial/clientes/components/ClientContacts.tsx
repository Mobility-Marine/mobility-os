"use client";

import { useState } from "react";
import type { ClientContact, ClientContactRole } from "../types/clients.types";
import { CONTACT_ROLE_CONFIG } from "../types/clients.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  contacts:   ClientContact[];
  clientId:   string | null;
  onAdd:      (payload: { name: string; role: ClientContactRole; title?: string; email?: string; phone?: string; is_primary?: boolean; notes?: string }) => Promise<void>;
  onEdit:     (id: string, updates: Partial<ClientContact>) => Promise<void>;
  onRemove:   (id: string) => Promise<void>;
  loading?:   boolean;
  compact?:   boolean; // for use inside drawer
};

const ROLES: ClientContactRole[] = [
  "general_manager", "accounts_payable", "invoice_reception",
  "purchasing", "commercial", "operations", "legal", "general", "other",
];

const INPUT: React.CSSProperties = {
  width: "100%", height: "32px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-base)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

const EMPTY_FORM = {
  name: "", role: "general" as ClientContactRole,
  title: "", email: "", phone: "", is_primary: false, notes: "",
};

export default function ClientContacts({
  contacts, clientId, onAdd, onEdit, onRemove, loading, compact,
}: Props) {
  const { t } = useTranslation();
  const [showForm, setShowForm]   = useState(false);
  const [editId,   setEditId]     = useState<string | null>(null);
  const [saving,   setSaving]     = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);

  function set(key: string, value: any) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function startEdit(c: ClientContact) {
    setEditId(c.id);
    setForm({ name: c.name, role: c.role, title: c.title ?? "", email: c.email ?? "", phone: c.phone ?? "", is_primary: c.is_primary, notes: c.notes ?? "" });
    setShowForm(false);
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await onEdit(editId, { name: form.name, role: form.role, title: form.title || undefined, email: form.email || undefined, phone: form.phone || undefined, is_primary: form.is_primary, notes: form.notes || undefined });
        setEditId(null);
      } else {
        await onAdd({ name: form.name, role: form.role, title: form.title || undefined, email: form.email || undefined, phone: form.phone || undefined, is_primary: form.is_primary, notes: form.notes || undefined });
        setShowForm(false);
      }
      setForm(EMPTY_FORM);
    } finally { setSaving(false); }
  }

  const getRoleLabel = (role: ClientContactRole) => {
    const cfg = CONTACT_ROLE_CONFIG[role];
    return (t.clients as any)?.[cfg.labelKey.replace("clients.", "")] ?? role;
  };

  return (
    <div style={{
      background: compact ? "transparent" : "var(--color-bg-base)",
      border: compact ? "none" : "1px solid var(--color-border-faint)",
      borderRadius: compact ? 0 : "var(--radius-lg)",
      padding: compact ? 0 : "18px",
      display: "flex", flexDirection: "column", gap: "12px",
      height: compact ? "auto" : "100%",
    }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-second)" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {(t.clients as any)?.contacts ?? "Contactos"}
          </span>
          <span style={{ fontSize: "11px", padding: "1px 6px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>
            {contacts.length}
          </span>
        </div>
        {clientId && !editId && (
          <button onClick={() => { setShowForm((v) => !v); setEditId(null); }} style={{
            height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)",
            background: showForm ? "var(--color-bg-subtle)" : "var(--color-brand-blue)",
            color: showForm ? "var(--color-text-muted)" : "#fff", border: "none",
            fontSize: "11px", fontWeight: 600, cursor: "pointer",
          }}>
            {showForm ? (t.general as any)?.cancel ?? "Cancelar" : `+ ${(t.clients as any)?.addContact ?? "Agregar"}`}
          </button>
        )}
      </div>

      {/* FORM */}
      {(showForm || editId) && (
        <div style={{
          background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)", padding: "12px",
          display: "grid", gap: "10px",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {(t.clients as any)?.contactName ?? "Nombre"} *
              </div>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="María González" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {(t.clients as any)?.contactRole ?? "Rol"}
              </div>
              <select value={form.role} onChange={(e) => set("role", e.target.value as ClientContactRole)} style={{ ...INPUT, cursor: "pointer" }}>
                {ROLES.map((role) => (
                  <option key={role} value={role}>{getRoleLabel(role)}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {(t.clients as any)?.contactTitle ?? "Cargo"}
              </div>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Directora de Finanzas" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Email
              </div>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="maria@empresa.com" style={INPUT} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {(t.clients as any)?.phone ?? "Teléfono"}
              </div>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+52 33 1234 5678" style={INPUT} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "2px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px", color: "var(--color-text-second)" }}>
                <input type="checkbox" checked={form.is_primary} onChange={(e) => set("is_primary", e.target.checked)} />
                {(t.clients as any)?.primaryContact ?? "Contacto principal"}
              </label>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{
              height: "30px", padding: "0 14px", borderRadius: "var(--radius-md)",
              background: "var(--color-brand-blue)", color: "#fff", border: "none",
              fontSize: "12px", fontWeight: 600, cursor: "pointer",
            }}>
              {saving ? t.general.loading : t.general.save}
            </button>
            <button onClick={cancelForm} style={{
              height: "30px", padding: "0 12px", borderRadius: "var(--radius-md)",
              background: "var(--color-bg-base)", border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer",
            }}>
              {t.general.cancel}
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
      ) : contacts.length === 0 ? (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "8px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)",
          color: "var(--color-text-muted)", fontSize: "13px", padding: "24px", minHeight: "80px",
        }}>
          {(t.clients as any)?.noContacts ?? "Sin contactos registrados"}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", display: "grid", gap: "8px", alignContent: "start" }}>
          {contacts.map((c) => {
            const cfg   = CONTACT_ROLE_CONFIG[c.role] ?? CONTACT_ROLE_CONFIG.other;
            const label = (t.clients as any)?.[cfg.labelKey.replace("clients.", "")] ?? c.role;

            return (
              <div key={c.id} style={{
                padding: "10px 12px", borderRadius: "var(--radius-md)",
                background: "var(--color-bg-subtle)",
                border: `1px solid ${c.is_primary ? "var(--color-brand-blue)40" : "var(--color-border-faint)"}`,
                display: "flex", alignItems: "flex-start", gap: "10px",
              }}>
                {/* AVATAR */}
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                  background: cfg.color + "20", border: `1px solid ${cfg.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 800, color: cfg.color,
                }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                      {c.name}
                    </span>
                    {c.is_primary && (
                      <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "var(--radius-full)", background: "var(--color-brand-blue)20", color: "var(--color-brand-blue)", fontWeight: 700 }}>
                        {(t.clients as any)?.primary ?? "Principal"}
                      </span>
                    )}
                    <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: cfg.color + "15", color: cfg.color }}>
                      {label}
                    </span>
                  </div>
                  {c.title && <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "1px" }}>{c.title}</div>}
                  <div style={{ display: "flex", gap: "12px", marginTop: "4px", flexWrap: "wrap" }}>
                    {c.email && (
                      <a href={`mailto:${c.email}`} style={{ fontSize: "11px", color: "var(--color-brand-blue)", textDecoration: "none", display: "flex", alignItems: "center", gap: "3px" }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        {c.email}
                      </a>
                    )}
                    {c.phone && (
                      <a href={`tel:${c.phone}`} style={{ fontSize: "11px", color: "var(--color-text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "3px" }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        {c.phone}
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  <button onClick={() => startEdit(c)} style={{
                    width: "26px", height: "26px", borderRadius: "var(--radius-sm)",
                    background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "var(--color-info-text)",
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button onClick={() => onRemove(c.id)} style={{
                    width: "26px", height: "26px", borderRadius: "var(--radius-sm)",
                    background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "var(--color-danger-text)",
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
