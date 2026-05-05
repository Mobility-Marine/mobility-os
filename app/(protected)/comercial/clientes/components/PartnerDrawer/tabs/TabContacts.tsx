// ════════════════════════════════════════════════════════════════════════
// TabContacts — Tab 3 del wizard PartnerDrawer
// ════════════════════════════════════════════════════════════════════════
// Lista multi-contactos del partner (CRUD local).
// Los cambios se persisten al guardar el wizard (no en tiempo real).
//
// Operaciones:
//   - Agregar contacto vacío
//   - Editar campos inline (marca _isDirty)
//   - Marcar como primario (solo uno permitido a la vez)
//   - Eliminar (marca _isDeleted, no aparece en UI)
// ════════════════════════════════════════════════════════════════════════
"use client";

import type { CSSProperties } from "react";
import type { PartnerContact, PartnerContactRole } from "../types";
import { CONTACT_ROLE_LABELS } from "../types";
import { Field, FIELD_INPUT, FIELD_SELECT, SectionTitle } from "../components/Field";

// ── Props ─────────────────────────────────────────────────────────────
export type TabContactsProps = {
  contacts:    PartnerContact[];
  onChange:    (contacts: PartnerContact[]) => void;
};

// ── Estilos ───────────────────────────────────────────────────────────
const ROW: CSSProperties = {
  position:      "relative",
  padding:       "16px",
  borderRadius:  "var(--radius-md)",
  border:        "1px solid var(--color-border)",
  background:    "var(--color-bg-subtle)",
  display:       "flex",
  flexDirection: "column",
  gap:           "12px",
};

const ROW_HEADER: CSSProperties = {
  display:        "flex",
  alignItems:     "center",
  justifyContent: "space-between",
  gap:            "12px",
};

const PRIMARY_BADGE: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            "4px",
  padding:        "3px 8px",
  borderRadius:   "var(--radius-sm, 4px)",
  fontSize:       "10px",
  fontWeight:     700,
  letterSpacing:  "0.4px",
  textTransform:  "uppercase",
  background:     "rgba(34, 197, 94, 0.15)",
  color:          "var(--color-success-text)",
};

const ICON_BUTTON: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  justifyContent: "center",
  width:          "28px",
  height:         "28px",
  borderRadius:   "var(--radius-sm, 4px)",
  border:         "1px solid var(--color-border)",
  background:     "transparent",
  color:          "var(--color-text-muted)",
  cursor:         "pointer",
  fontSize:       "14px",
  outline:        "none",
};

const ADD_BUTTON: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            "6px",
  height:         "34px",
  padding:        "0 14px",
  borderRadius:   "var(--radius-md)",
  fontSize:       "13px",
  fontWeight:     600,
  cursor:         "pointer",
  border:         "1px dashed var(--color-brand-blue, #3b82f6)",
  background:     "transparent",
  color:          "var(--color-brand-blue, #3b82f6)",
  outline:        "none",
  alignSelf:      "flex-start",
};

const EMPTY_STATE: CSSProperties = {
  padding:       "32px 20px",
  textAlign:     "center",
  border:        "1px dashed var(--color-border)",
  borderRadius:  "var(--radius-md)",
  color:         "var(--color-text-muted)",
  fontSize:      "13px",
  lineHeight:    1.6,
};

// ── Helper: generar UUID local (modo CREATE) ──────────────────────────
function genLocalId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ── Componente ────────────────────────────────────────────────────────
export function TabContacts({ contacts, onChange }: TabContactsProps) {
  // Filtrar los eliminados solo a nivel UI; el padre los conserva con _isDeleted
  const visibleContacts = contacts.filter((c) => !c._isDeleted);

  // ── Handlers ──────────────────────────────────────────────────────
  function handleAdd() {
    const newContact: PartnerContact = {
      _localId:   genLocalId(),
      _isDirty:   true,
      name:       "",
      role:       "general",
      email:      "",
      phone:      "",
      title:      "",
      is_primary: contacts.length === 0,
    };
    onChange([...contacts, newContact]);
  }

  function handlePatch(idxVisible: number, patch: Partial<PartnerContact>) {
    // Mapear índice visible al índice real en el array completo
    const target = visibleContacts[idxVisible];
    const realIdx = contacts.indexOf(target);
    if (realIdx < 0) return;

    const next = [...contacts];
    next[realIdx] = { ...target, ...patch, _isDirty: true };

    // Si se marca is_primary, desmarcar los demás
    if (patch.is_primary === true) {
      next.forEach((c, i) => {
        if (i !== realIdx && c.is_primary && !c._isDeleted) {
          next[i] = { ...c, is_primary: false, _isDirty: true };
        }
      });
    }
    onChange(next);
  }

  function handleDelete(idxVisible: number) {
    const target = visibleContacts[idxVisible];
    const realIdx = contacts.indexOf(target);
    if (realIdx < 0) return;

    const next = [...contacts];
    if (target.id) {
      // Es un contacto persistido — marcar para borrar en el sync
      next[realIdx] = { ...target, _isDeleted: true };
    } else {
      // Es solo local, eliminar del array directamente
      next.splice(realIdx, 1);
    }
    onChange(next);
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <SectionTitle>Contactos del partner</SectionTitle>

      <div
        style={{
          fontSize:    "12px",
          color:       "var(--color-text-muted)",
          lineHeight:  1.5,
        }}
      >
        Agrega los contactos relevantes del partner: gerentes, cuentas por pagar, recepción de
        facturas, comercial, operaciones, etc. Los cambios se guardan al presionar
        <strong> Guardar</strong> en el wizard.
      </div>

      {visibleContacts.length === 0 && (
        <div style={EMPTY_STATE}>
          📞 No hay contactos registrados.
          <br />
          Agrega al menos uno para facilitar la comunicación con el partner.
        </div>
      )}

      {visibleContacts.map((c, i) => (
        <div key={c.id ?? c._localId ?? i} style={ROW}>
          <div style={ROW_HEADER}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>👤</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                {c.name || "(sin nombre)"}
              </span>
              {c.is_primary && (
                <span style={PRIMARY_BADGE}>⭐ Primario</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleDelete(i)}
              style={ICON_BUTTON}
              title="Eliminar contacto"
              aria-label="Eliminar contacto"
            >
              🗑️
            </button>
          </div>

          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap:                 "12px",
            }}
          >
            <Field label="Nombre completo" required span={2}>
              <input
                type="text"
                value={c.name ?? ""}
                onChange={(e) => handlePatch(i, { name: e.target.value })}
                placeholder="Ej. Juan Pérez García"
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="Cargo / título">
              <input
                type="text"
                value={c.title ?? ""}
                onChange={(e) => handlePatch(i, { title: e.target.value })}
                placeholder="Ej. Director general"
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="Rol funcional">
              <select
                value={(c.role as string) ?? ""}
                onChange={(e) => handlePatch(i, { role: e.target.value as PartnerContactRole })}
                style={FIELD_SELECT}
              >
                <option value="">— Seleccionar —</option>
                {(Object.keys(CONTACT_ROLE_LABELS) as PartnerContactRole[]).map((r) => (
                  <option key={r} value={r}>
                    {CONTACT_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Email" span={2}>
              <input
                type="email"
                value={c.email ?? ""}
                onChange={(e) => handlePatch(i, { email: e.target.value })}
                placeholder="contacto@empresa.com"
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="Teléfono">
              <input
                type="tel"
                value={c.phone ?? ""}
                onChange={(e) => handlePatch(i, { phone: e.target.value })}
                placeholder="+52 449 123 4567"
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="Primario">
              <label
                style={{
                  display:    "inline-flex",
                  alignItems: "center",
                  gap:        "8px",
                  height:     "36px",
                  cursor:     "pointer",
                  fontSize:   "13px",
                  color:      "var(--color-text-primary)",
                }}
              >
                <input
                  type="checkbox"
                  checked={c.is_primary ?? false}
                  onChange={(e) => handlePatch(i, { is_primary: e.target.checked })}
                  style={{ width: "16px", height: "16px", accentColor: "var(--color-brand-blue, #3b82f6)" }}
                />
                Contacto principal
              </label>
            </Field>
          </div>
        </div>
      ))}

      <button type="button" onClick={handleAdd} style={ADD_BUTTON}>
        ➕ Agregar contacto
      </button>
    </div>
  );
}