"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarEvent, EventFormData, DEFAULT_FORM,
  EVENT_TYPES, PRIORITIES, STATUSES, VISIBILITIES,
} from "../types/agenda.types";
import type { CompanyMember } from "../types/agenda.types";
import ColorPicker from "./ColorPicker";
import ReminderPicker from "./ReminderPicker";
import RecurrencePicker from "./RecurrencePicker";
import type { ReminderConfig, RecurrenceConfig } from "../types/recurrence.types";
import { DEFAULT_RECURRENCE } from "../types/recurrence.types";
import { saveReminders, saveRecurrence, getReminders, getRecurrence } from "../services/reminders.service";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface EventModalProps {
  event?: CalendarEvent | null;
  initialDateTime?: string;
  prefilledAttendee?: string;
  members: CompanyMember[];
  companyId: string;
  userId: string;
  onSave: (payload: Partial<CalendarEvent>, form: EventFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

function formatDTLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)",
  color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

export default function EventModal({
  event, initialDateTime, prefilledAttendee,
  members, companyId, userId,
  onSave, onDelete, onClose,
}: EventModalProps) {
  const { t, lang }           = useTranslation();
  const [form, setForm]       = useState<EventFormData>(DEFAULT_FORM);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reminders, setReminders]   = useState<ReminderConfig[]>([]);
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>(DEFAULT_RECURRENCE);

  // Translated options — driven by lang so they update live
  const eventTypes   = lang === "en"
    ? ["Meeting", "Call", "Visit", "Follow-up", "Operation", "Personal"]
    : EVENT_TYPES;
  const priorities   = lang === "en"
    ? ["Low", "Medium", "High", "Critical"]
    : PRIORITIES;
  const statuses     = lang === "en"
    ? ["Scheduled", "Confirmed", "Completed", "Cancelled"]
    : STATUSES;
  const visibilities = lang === "en"
    ? [{ value: "company", label: "Company" }, { value: "team", label: "Team" }, { value: "private", label: "Private" }]
    : VISIBILITIES;

  useEffect(() => {
    if (event) {
      const start = new Date(event.start_datetime);
      const end   = new Date(event.end_datetime ?? event.start_datetime);
      setForm({
        title:              event.title,
        description:        event.description ?? "",
        event_type:         event.event_type ?? eventTypes[0],
        priority:           event.priority ?? priorities[1],
        status:             event.status ?? statuses[0],
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
      void getReminders(event.id).then(setReminders);
      void getRecurrence(event.id).then((r) => {
        if (r) setRecurrence({
          frequency:    r.frequency,
          interval:     r.interval ?? 1,
          days_of_week: r.days_of_week ? JSON.parse(r.days_of_week) : [],
          end_type:     r.end_type ?? "never",
          end_date:     r.end_date ?? undefined,
          end_count:    r.end_count ?? undefined,
        });
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
      setReminders([]);
      setRecurrence(DEFAULT_RECURRENCE);
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
      }, form);
      if (event?.id) {
        await saveReminders(event.id, reminders);
        await saveRecurrence(event.id, recurrence);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete || !confirm(t.agenda.confirmDelete)) return;
    setDeleting(true);
    try { await onDelete(); } finally { setDeleting(false); }
  }

  const isEditing = Boolean(event);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: "20px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "640px", maxHeight: "90vh", overflowY: "auto", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-xl)", padding: "24px" }}
      >
        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {isEditing ? t.agenda.editEvent : t.agenda.newEventTitle}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
              {isEditing ? t.agenda.editEventSub : t.agenda.newEventSub}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "4px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* COLOR STRIP */}
        <div style={{ height: "4px", borderRadius: "var(--radius-full)", background: form.color, marginBottom: "20px", opacity: 0.8, transition: "background var(--transition-normal)" }} />

        <div style={{ display: "grid", gap: "14px" }}>

          <Field label={t.agenda.eventTitle}>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder={t.agenda.eventTitlePlaceholder} autoFocus style={{ ...INPUT_STYLE, fontSize: "15px", fontWeight: 600, height: "42px" }} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label={t.agenda.type}>
              <select value={form.event_type} onChange={(e) => set("event_type", e.target.value)} style={INPUT_STYLE}>
                {eventTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </Field>
            <Field label={t.agenda.priority}>
              <select value={form.priority} onChange={(e) => set("priority", e.target.value)} style={INPUT_STYLE}>
                {priorities.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label={t.agenda.start}>
              <input type="datetime-local" value={form.start} onChange={(e) => set("start", e.target.value)} style={INPUT_STYLE} />
            </Field>
            <Field label={t.agenda.end}>
              <input type="datetime-local" value={form.end} onChange={(e) => set("end", e.target.value)} style={INPUT_STYLE} />
            </Field>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="checkbox" id="all-day" checked={form.all_day} onChange={(e) => set("all_day", e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
            <label htmlFor="all-day" style={{ fontSize: "13px", color: "var(--color-text-second)", cursor: "pointer" }}>
              {t.agenda.allDay}
            </label>
          </div>

          <Field label={t.agenda.description}>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={t.agenda.descriptionPlaceholder} rows={3} style={{ ...INPUT_STYLE, height: "auto", padding: "10px 12px", resize: "vertical" }} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label={t.agenda.location}>
              <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder={t.agenda.locationPlaceholder} style={INPUT_STYLE} />
            </Field>
            <Field label={t.agenda.meetingLink}>
              <input value={form.meeting_link} onChange={(e) => set("meeting_link", e.target.value)} placeholder="https://meet.google.com/..." style={INPUT_STYLE} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label={t.agenda.status}>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} style={INPUT_STYLE}>
                {statuses.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label={t.agenda.visibility}>
              <select value={form.visibility} onChange={(e) => set("visibility", e.target.value)} style={INPUT_STYLE}>
                {visibilities.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label={t.agenda.color}>
            <ColorPicker value={form.color} onChange={(c) => set("color", c)} />
          </Field>

          {members.length > 0 && (
            <Field label={t.agenda.inviteTeam}>
              <div style={{ display: "grid", gap: "6px", maxHeight: "140px", overflowY: "auto" }}>
                {members.map((m) => {
                  const selected = form.internal_attendees.includes(m.user_id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => set("internal_attendees", selected ? form.internal_attendees.filter((id) => id !== m.user_id) : [...form.internal_attendees, m.user_id])}
                      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "var(--radius-md)", border: `1px solid ${selected ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`, background: selected ? "var(--color-brand-blue-light)" : "var(--color-bg-subtle)", cursor: "pointer", transition: "var(--transition-fast)" }}
                    >
                      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: selected ? "var(--color-brand-blue)" : "var(--color-border)", flexShrink: 0 }} />
                      <span style={{ fontSize: "12px", color: selected ? "var(--color-brand-blue)" : "var(--color-text-second)", fontWeight: selected ? 600 : 400 }}>
                        {m.user_id.slice(0, 16)}… · {m.role ?? t.navItems.user}
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

          <Field label={t.agenda.externalGuests}>
            <input value={form.external_emails} onChange={(e) => set("external_emails", e.target.value)} placeholder={t.agenda.externalGuestsPlaceholder} style={INPUT_STYLE} />
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              {t.agenda.externalGuestsTip}
            </div>
          </Field>

          <Field label={t.agenda.reminders}>
            <ReminderPicker reminders={reminders} onChange={setReminders} />
          </Field>

          <Field label={t.agenda.recurrence}>
            <RecurrencePicker value={recurrence} onChange={setRecurrence} eventStart={form.start} />
          </Field>

        </div>

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--color-border-faint)" }}>
          <div>
            {isEditing && onDelete && (
              <button onClick={handleDelete} disabled={deleting} style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-danger-border)", background: "var(--color-danger-bg)", color: "var(--color-danger-text)", fontSize: "13px", fontWeight: 500, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.5 : 1 }}>
                {deleting ? t.agenda.deleting : t.agenda.deleteEvent}
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onClose} style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
              {t.general.cancel}
            </button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()} style={{ height: "36px", padding: "0 20px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 600, cursor: saving || !form.title.trim() ? "not-allowed" : "pointer", opacity: saving || !form.title.trim() ? 0.5 : 1, boxShadow: "var(--shadow-brand-blue)" }}>
              {saving ? t.agenda.saving : isEditing ? t.agenda.saveChanges : t.agenda.createEvent}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
