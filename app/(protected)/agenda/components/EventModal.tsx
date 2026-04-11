"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarEvent, EventFormData, DEFAULT_FORM,
  EVENT_TYPES, PRIORITIES, STATUSES, VISIBILITIES,
} from "../types/agenda.types";
import type { CompanyMember } from "../types/agenda.types";
import ColorPicker from "./ColorPicker";

interface EventModalProps {
  event?: CalendarEvent | null;
  initialDateTime?: string;
  prefilledAttendee?: string;
  members: CompanyMember[];
  companyId: string;
  userId: string;
  onSave: (payload: Partial<CalendarEvent>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

function formatDTLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function LabelStyle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "11px", fontWeight: 600,
      color: "var(--color-text-muted)",
      marginBottom: "5px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    }}>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <LabelStyle>{label}</LabelStyle>
      {children}
    </div>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  height: "36px",
  padding: "0 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)",
  color: "var(--color-text-primary)",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

export default function EventModal({
  event, initialDateTime, prefilledAttendee,
  members, companyId, userId,
  onSave, onDelete, onClose,
}: EventModalProps) {
  const [form, setForm] = useState<EventFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (event) {
      const start = new Date(event.start_datetime);
      const end   = new Date(event.end_datetime ?? event.start_datetime);
      setForm({
        title:              event.title,
        description:        event.description ?? "",
        event_type:         event.event_type ?? "Reunión",
        priority:           event.priority ?? "Media",
        status:             event.status ?? "Programado",
        color:              event.color ?? "#274B97",
        location:           event.location ?? "",
        meeting_link:       event.meeting_link ?? "",
        start:              formatDTLocal(start),
        end:                formatDTLocal(end),
        all_day:            event.all_day ?? false,
        visibility:         event.visibility ?? "company",
        internal_attendees: prefilledAttendee ? [prefilledAttendee] : [],
        external_emails:    "",
      });
    } else {
      const now = new Date(initialDateTime ? initialDateTime + ":00" : new Date().toISOString());
      const end = new Date(now);
      end.setHours(end.getHours() + 1);
      setForm({
        ...DEFAULT_FORM,
        start: formatDTLocal(now),
        end:   formatDTLocal(end),
        internal_attendees: prefilledAttendee ? [prefilledAttendee] : [],
      });
    }
  }, [event, initialDateTime, prefilledAttendee]);

  function set(key: keyof EventFormData, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title:          form.title,
        description:    form.description || null,
        event_type:     form.event_type,
        priority:       form.priority,
        status:         form.status,
        color:          form.color,
        location:       form.location || null,
        meeting_link:   form.meeting_link || null,
        start_datetime: new Date(form.start).toISOString(),
        end_datetime:   new Date(form.end || form.start).toISOString(),
        all_day:        form.all_day,
        visibility:     form.visibility,
        company_id:     companyId,
        created_by:     userId,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete || !confirm("¿Eliminar este evento?")) return;
    setDeleting(true);
    try { await onDelete(); } finally { setDeleting(false); }
  }

  const isEditing = Boolean(event);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 500, padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "640px",
          maxHeight: "90vh", overflowY: "auto",
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-xl)",
          padding: "24px",
        }}
      >
        {/* HEADER */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}>
          <div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {isEditing ? "Editar evento" : "Nuevo evento"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
              {isEditing ? "Modifica los detalles del evento" : "Completa la información del evento"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none",
              cursor: "pointer", color: "var(--color-text-muted)", padding: "4px",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* COLOR STRIP */}
        <div style={{
          height: "4px",
          borderRadius: "var(--radius-full)",
          background: form.color,
          marginBottom: "20px",
          opacity: 0.8,
          transition: "background var(--transition-normal)",
        }} />

        <div style={{ display: "grid", gap: "14px" }}>

          {/* TÍTULO */}
          <Field label="Título">
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Nombre del evento"
              autoFocus
              style={{ ...INPUT_STYLE, fontSize: "15px", fontWeight: 600, height: "42px" }}
            />
          </Field>

          {/* TIPO + PRIORIDAD */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Tipo">
              <select value={form.event_type} onChange={(e) => set("event_type", e.target.value)} style={INPUT_STYLE}>
                {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Prioridad">
              <select value={form.priority} onChange={(e) => set("priority", e.target.value)} style={INPUT_STYLE}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          {/* FECHAS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Inicio">
              <input
                type="datetime-local"
                value={form.start}
                onChange={(e) => set("start", e.target.value)}
                style={INPUT_STYLE}
              />
            </Field>
            <Field label="Fin">
              <input
                type="datetime-local"
                value={form.end}
                onChange={(e) => set("end", e.target.value)}
                style={INPUT_STYLE}
              />
            </Field>
          </div>

          {/* TODO EL DÍA */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              id="all-day"
              checked={form.all_day}
              onChange={(e) => set("all_day", e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <label htmlFor="all-day" style={{ fontSize: "13px", color: "var(--color-text-second)", cursor: "pointer" }}>
              Todo el día
            </label>
          </div>

          {/* DESCRIPCIÓN */}
          <Field label="Descripción">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Detalles del evento..."
              rows={3}
              style={{ ...INPUT_STYLE, height: "auto", padding: "10px 12px", resize: "vertical" }}
            />
          </Field>

          {/* UBICACIÓN + LINK */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Ubicación">
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Sala, dirección..."
                style={INPUT_STYLE}
              />
            </Field>
            <Field label="Link de reunión">
              <input
                value={form.meeting_link}
                onChange={(e) => set("meeting_link", e.target.value)}
                placeholder="https://meet.google.com/..."
                style={INPUT_STYLE}
              />
            </Field>
          </div>

          {/* ESTADO + VISIBILIDAD */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Estado">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} style={INPUT_STYLE}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Visibilidad">
              <select value={form.visibility} onChange={(e) => set("visibility", e.target.value)} style={INPUT_STYLE}>
                {VISIBILITIES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </Field>
          </div>

          {/* COLOR PICKER */}
          <Field label="Color del evento">
            <ColorPicker value={form.color} onChange={(c) => set("color", c)} />
          </Field>

          {/* INVITADOS INTERNOS */}
          {members.length > 0 && (
            <Field label="Invitar del equipo">
              <div style={{ display: "grid", gap: "6px", maxHeight: "140px", overflowY: "auto" }}>
                {members.map((m) => {
                  const selected = form.internal_attendees.includes(m.user_id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        set("internal_attendees", selected
                          ? form.internal_attendees.filter((id) => id !== m.user_id)
                          : [...form.internal_attendees, m.user_id]
                        );
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "7px 10px",
                        borderRadius: "var(--radius-md)",
                        border: `1px solid ${selected ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
                        background: selected ? "var(--color-brand-blue-light)" : "var(--color-bg-subtle)",
                        cursor: "pointer",
                        transition: "var(--transition-fast)",
                      }}
                    >
                      <div style={{
                        width: "7px", height: "7px", borderRadius: "50%",
                        background: selected ? "var(--color-brand-blue)" : "var(--color-border)",
                        flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: "12px",
                        color: selected ? "var(--color-brand-blue)" : "var(--color-text-second)",
                        fontWeight: selected ? 600 : 400,
                      }}>
                        {m.user_id.slice(0, 16)}… · {m.role ?? "usuario"}
                      </span>
                      {selected && (
                        <svg style={{ marginLeft: "auto", flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-blue)" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            </Field>
          )}

          {/* INVITADOS EXTERNOS */}
          <Field label="Invitados externos">
            <input
              value={form.external_emails}
              onChange={(e) => set("external_emails", e.target.value)}
              placeholder="correo@empresa.com, otro@empresa.com"
              style={INPUT_STYLE}
            />
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              Separa múltiples correos con comas
            </div>
          </Field>

        </div>

        {/* FOOTER */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "24px",
          paddingTop: "16px",
          borderTop: "1px solid var(--color-border-faint)",
        }}>
          <div>
            {isEditing && onDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  height: "36px", padding: "0 16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-danger-border)",
                  background: "var(--color-danger-bg)",
                  color: "var(--color-danger-text)",
                  fontSize: "13px", fontWeight: 500,
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.5 : 1,
                }}
              >
                {deleting ? "Eliminando…" : "Eliminar evento"}
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={onClose}
              style={{
                height: "36px", padding: "0 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-subtle)",
                color: "var(--color-text-second)",
                fontSize: "13px", cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              style={{
                height: "36px", padding: "0 20px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-brand-blue)",
                color: "#fff", border: "none",
                fontSize: "13px", fontWeight: 600,
                cursor: saving || !form.title.trim() ? "not-allowed" : "pointer",
                opacity: saving || !form.title.trim() ? 0.5 : 1,
                boxShadow: "var(--shadow-brand-blue)",
              }}
            >
              {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear evento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
