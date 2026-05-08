"use client";
import { useState } from "react";
import { Field, SELECT, INPUT } from "../../drawerShared";
import { CURRENCIES, SERVICE_TYPES, SERVICE_TYPE_CONFIG } from "../../../../types/quotations.types";
import type { ServiceType, CreateServicePayload } from "../../../../types/quotations.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type LineDraft = Omit<CreateServicePayload, "quotation_id">;

const UNIT_LABELS = [
  "Por servicio", "Por contenedor", "Por BL", "Por pedimento",
  "Por factura", "Por kg", "Por tonelada", "Por m³", "Por W/M",
  "Por pieza", "Por embarque", "Por trámite",
];

interface Props {
  line:               LineDraft;
  index:              number;
  blockedByOtherEdit: boolean;
  onSave:             (updated: LineDraft) => void;
  onDelete:           () => void;
  onEditingChange:    (isEditing: boolean) => void;
}

/**
 * Una fila de línea de detalle con su propio modo view/edit.
 *
 * IMPORTANTE — diseño zero-touch:
 *  - El estado de edición vive 100% LOCAL en este componente
 *  - "Cancelar" solo cambia el modo (NO modifica el array del padre)
 *  - "Guardar" llama onSave con la línea completa (preservando ...line)
 *  - Eso elimina por construcción el bug de "línea desaparece al cancelar"
 */
export default function LineRow({
  line, index, blockedByOtherEdit, onSave, onDelete, onEditingChange,
}: Props) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [draft,     setDraft]     = useState<LineDraft>(line);

  const taxLabel =
    (line as any).tax_rate === -1 ? "Exento"
    : (line as any).tax_rate === 0 ? "0%"
    : `IVA ${(line as any).tax_rate ?? 16}%`;

  function startEdit() {
    setDraft({ ...line });
    setIsEditing(true);
    onEditingChange(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    onEditingChange(false);
    // ⚠ NO se toca el array del padre. La línea original queda intacta.
  }

  function saveEdit() {
    if (!draft.description?.trim() || !draft.price) return;
    // Preserva TODOS los campos originales (id, product_id, origin, etc.)
    onSave({ ...line, ...draft, price: Number(draft.price) });
    setIsEditing(false);
    onEditingChange(false);
  }

  function deleteWithConfirm() {
    if (window.confirm(`¿Eliminar la línea "${line.description}"?\n\nEsta acción no se puede deshacer.`)) {
      onDelete();
    }
  }

  // ─── MODO VIEW ────────────────────────────────────────────────
  if (!isEditing) {
    return (
      <div style={{
        display: "flex", gap: "8px", padding: "10px 12px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-bg-subtle)",
        border: "1px solid var(--color-border-faint)",
        alignItems: "center",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
            {line.description}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
            {line.service_type} · {taxLabel} · {line.currency}
            {(line as any).unit_label && (
              <span style={{ marginLeft: "6px", padding: "1px 6px", borderRadius: "var(--radius-full)", background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)" }}>
                {(line as any).unit_label}
              </span>
            )}
          </div>
        </div>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success-text)", flexShrink: 0 }}>
          ${Number(line.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
        </span>
        <button
          onClick={startEdit}
          disabled={blockedByOtherEdit}
          title={blockedByOtherEdit ? "Termina la edición activa primero" : "Editar línea"}
          style={{
            height: "28px", padding: "0 12px", borderRadius: "var(--radius-sm)",
            background: "var(--color-brand-blue)", border: "none", cursor: blockedByOtherEdit ? "not-allowed" : "pointer",
            color: "#fff", display: "flex", alignItems: "center", gap: "5px",
            flexShrink: 0, fontSize: "11px", fontWeight: 700,
            opacity: blockedByOtherEdit ? 0.4 : 1,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editar
        </button>
        <button
          onClick={deleteWithConfirm}
          disabled={blockedByOtherEdit}
          title="Eliminar línea"
          style={{
            width: "28px", height: "28px", borderRadius: "var(--radius-sm)",
            background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
            cursor: blockedByOtherEdit ? "not-allowed" : "pointer",
            color: "var(--color-danger-text)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            opacity: blockedByOtherEdit ? 0.4 : 1,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    );
  }

  // ─── MODO EDIT ────────────────────────────────────────────────
  return (
    <div style={{
      padding: "14px",
      borderRadius: "var(--radius-md)",
      background: "var(--color-warning-bg)",
      border: "2px solid var(--color-warning-border)",
      display: "grid", gap: "10px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{
          fontSize: "10px", fontWeight: 800, padding: "2px 8px",
          borderRadius: "var(--radius-full)",
          background: "var(--color-warning-text)", color: "#fff",
          letterSpacing: "0.5px",
        }}>
          EDITANDO LÍNEA {index + 1}
        </span>
        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          Los cambios solo se aplican al guardar
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px" }}>
        <Field label="Tipo *">
          <select value={draft.service_type} onChange={(e) => setDraft(p => ({ ...p, service_type: e.target.value as ServiceType }))} style={SELECT}>
            {SERVICE_TYPES.map((st) => {
              const cfg   = SERVICE_TYPE_CONFIG[st];
              const label = (t.quot as any)?.[cfg.labelKey.replace("quot.", "")] ?? st;
              return <option key={st} value={st}>{label}</option>;
            })}
          </select>
        </Field>
        <Field label="Descripción *">
          <input value={draft.description} onChange={(e) => setDraft(p => ({ ...p, description: e.target.value }))} placeholder="Flete, honorarios, maniobras…" style={INPUT} />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", gap: "8px" }}>
        <Field label="Cantidad *">
          <input type="number" min="1" value={(draft as any).quantity ?? 1} onChange={(e) => setDraft(p => ({ ...p, quantity: Number(e.target.value) || 1 } as any))} style={INPUT} />
        </Field>
        <Field label="Unidad de cobro *">
          <select value={(draft as any).unit_label || ""} onChange={(e) => setDraft(p => ({ ...p, unit_label: e.target.value } as any))} style={SELECT}>
            <option value="">— Selecciona —</option>
            {UNIT_LABELS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </Field>
        <Field label="Precio unitario *">
          <input type="number" step="0.01" value={String(draft.price ?? "")} onChange={(e) => setDraft(p => ({ ...p, price: e.target.value as any }))} placeholder="0.00" style={INPUT} />
        </Field>
        <Field label="Total (auto)">
          <input value={`$${(Number(draft.price) || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} readOnly style={{ ...INPUT, background: "var(--color-bg-subtle)" }} />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "8px" }}>
        <Field label="Moneda">
          <select value={draft.currency} onChange={(e) => setDraft(p => ({ ...p, currency: e.target.value }))} style={SELECT}>
            {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
          </select>
        </Field>
        <Field label="IVA">
          <select value={String(draft.tax_rate ?? 16)} onChange={(e) => setDraft(p => ({ ...p, tax_rate: Number(e.target.value) }))} style={SELECT}>
            <option value="16">IVA 16%</option>
            <option value="0">Tasa 0%</option>
            <option value="-1">Exento</option>
            <option value="8">IVA 8%</option>
          </select>
        </Field>
        <Field label="Notas">
          <input value={draft.notes ?? ""} onChange={(e) => setDraft(p => ({ ...p, notes: e.target.value }))} placeholder="Observaciones…" style={INPUT} />
        </Field>
      </div>

      <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
        <button
          onClick={saveEdit}
          disabled={!draft.description?.trim() || !draft.price}
          style={{
            height: "36px", padding: "0 18px", borderRadius: "var(--radius-md)",
            background: "var(--color-brand-blue)", color: "#fff", border: "none",
            fontSize: "12px", fontWeight: 700,
            cursor: !draft.description?.trim() || !draft.price ? "not-allowed" : "pointer",
            opacity: !draft.description?.trim() || !draft.price ? 0.5 : 1,
            display: "flex", alignItems: "center", gap: "6px",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Guardar cambios
        </button>
        <button
          onClick={cancelEdit}
          style={{
            height: "36px", padding: "0 14px", borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)", background: "var(--color-bg-base)",
            color: "var(--color-text-muted)", fontSize: "12px", fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}