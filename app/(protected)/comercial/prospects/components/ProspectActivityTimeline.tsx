"use client";

import { useState } from "react";
import type { ProspectActivity, CreateActivityPayload, ActivityType } from "../types/prospects.types";
import { ACTIVITY_CONFIG } from "../types/prospects.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  activities?: ProspectActivity[];
  onAdd?: (payload: CreateActivityPayload) => Promise<void>;
  loading?: boolean;
};

const ACTIVITY_TYPES: ActivityType[] = [
  "call", "email", "meeting", "whatsapp", "visit", "demo", "proposal_sent", "follow_up", "note",
];

export default function ProspectActivityTimeline({ activities = [], onAdd, loading = false }: Props) {
  const { t, lang } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState<CreateActivityPayload>({
    activity_type: "call",
    activity_date: new Date().toISOString().slice(0, 16),
    comments: "",
  });

  const locale = lang === "en" ? "en-US" : "es-MX";

  async function handleAdd() {
    if (!onAdd || !form.comments?.trim()) return;
    setSaving(true);
    try {
      await onAdd(form);
      setForm({ activity_type: "call", activity_date: new Date().toISOString().slice(0, 16), comments: "" });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "18px",
      display: "grid", gap: "14px",
    }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          {t.prospects.activities}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            padding: "2px 8px", borderRadius: "var(--radius-full)",
            background: "var(--color-brand-blue-light)",
            color: "var(--color-brand-blue)",
            fontSize: "11px", fontWeight: 600,
          }}>
            {activities.length}
          </span>
          {onAdd && (
            <button
              onClick={() => setShowForm((v) => !v)}
              style={{
                height: "28px", padding: "0 12px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-brand-blue)",
                color: "#fff", border: "none",
                fontSize: "12px", fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + {t.prospects.addActivity}
            </button>
          )}
        </div>
      </div>

      {/* FORM */}
      {showForm && onAdd && (
        <div style={{
          background: "var(--color-bg-subtle)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "14px",
          display: "grid", gap: "10px",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {t.agenda.type}
              </div>
              <select
                value={form.activity_type}
                onChange={(e) => setForm((p) => ({ ...p, activity_type: e.target.value as ActivityType }))}
                style={{
                  width: "100%", height: "34px", padding: "0 10px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg-base)",
                  color: "var(--color-text-primary)",
                  fontSize: "12px", outline: "none",
                }}
              >
                {ACTIVITY_TYPES.map((type) => {
                  const cfg = ACTIVITY_CONFIG[type];
                  return (
                    <option key={type} value={type}>
                      {cfg?.icon} {(t.prospects as any)[cfg?.labelKey?.replace("prospects.", "")] ?? type}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {t.agenda.start}
              </div>
              <input
                type="datetime-local"
                value={form.activity_date}
                onChange={(e) => setForm((p) => ({ ...p, activity_date: e.target.value }))}
                style={{
                  width: "100%", height: "34px", padding: "0 10px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg-base)",
                  color: "var(--color-text-primary)",
                  fontSize: "12px", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          <textarea
            placeholder={t.prospects.notesPlaceholder}
            value={form.comments ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, comments: e.target.value }))}
            rows={3}
            style={{
              width: "100%", padding: "10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-base)",
              color: "var(--color-text-primary)",
              fontSize: "13px", outline: "none",
              resize: "vertical", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleAdd}
              disabled={saving || !form.comments?.trim()}
              style={{
                height: "32px", padding: "0 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-brand-blue)", color: "#fff", border: "none",
                fontSize: "12px", fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? t.general.loading : t.general.save}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                height: "32px", padding: "0 14px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-bg-base)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
                fontSize: "12px", cursor: "pointer",
              }}
            >
              {t.general.cancel}
            </button>
          </div>
        </div>
      )}

      {/* TIMELINE */}
      {loading ? (
        <div style={{ display: "grid", gap: "8px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", gap: "10px", padding: "10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", opacity: 0.5 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-border)", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "grid", gap: "5px" }}>
                <div style={{ height: 10, background: "var(--color-border)", borderRadius: 4, width: "60%" }} />
                <div style={{ height: 8, background: "var(--color-border-faint)", borderRadius: 4, width: "40%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div style={{
          padding: "24px", borderRadius: "var(--radius-md)",
          border: "1px dashed var(--color-border)",
          color: "var(--color-text-muted)",
          textAlign: "center", fontSize: "13px",
        }}>
          {t.prospects.noActivities}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {activities.map((a, i) => {
            const cfg        = ACTIVITY_CONFIG[a.activity_type ?? "other"] ?? ACTIVITY_CONFIG.other;
            const labelKey   = cfg.labelKey.replace("prospects.", "");
            const label      = (t.prospects as any)[labelKey] ?? a.activity_type ?? "Actividad";
            const isLast     = i === activities.length - 1;

            return (
              <div key={a.id} style={{ display: "flex", gap: "12px" }}>
                {/* TIMELINE LINE */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{
                    width: "32px", height: "32px",
                    borderRadius: "50%",
                    background: cfg.color + "20",
                    border: `1.5px solid ${cfg.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "14px",
                  }}>
                    {cfg.icon}
                  </div>
                  {!isLast && (
                    <div style={{
                      width: "1px", flex: 1, minHeight: "12px",
                      background: "var(--color-border-faint)",
                      margin: "4px 0",
                    }} />
                  )}
                </div>

                {/* CONTENT */}
                <div style={{
                  flex: 1, paddingTop: "4px",
                  paddingBottom: isLast ? 0 : "8px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <span style={{
                      fontSize: "11px", fontWeight: 700,
                      color: cfg.color,
                      padding: "1px 6px",
                      borderRadius: "var(--radius-full)",
                      background: cfg.color + "15",
                    }}>
                      {label}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                      {a.activity_date
                        ? new Date(a.activity_date).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </span>
                  </div>
                  <div style={{
                    fontSize: "13px", fontWeight: 500,
                    color: "var(--color-text-primary)",
                    lineHeight: 1.5,
                  }}>
                    {a.comments || "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
