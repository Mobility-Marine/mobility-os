"use client";

import React from "react";
import { ReminderConfig, ReminderUnit } from "../types/recurrence.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface ReminderPickerProps {
  reminders: ReminderConfig[];
  onChange: (reminders: ReminderConfig[]) => void;
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  height: "30px", padding: "0 8px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)",
  color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none",
};

export default function ReminderPicker({ reminders, onChange }: ReminderPickerProps) {
  const { t, lang } = useTranslation();

  const PRESETS = [
    { label: lang === "en" ? "5 min before"  : "5 min antes",   value: 5,  unit: "minutes" as ReminderUnit },
    { label: lang === "en" ? "15 min before" : "15 min antes",  value: 15, unit: "minutes" as ReminderUnit },
    { label: lang === "en" ? "30 min before" : "30 min antes",  value: 30, unit: "minutes" as ReminderUnit },
    { label: lang === "en" ? "1 hour before" : "1 hora antes",  value: 1,  unit: "hours"   as ReminderUnit },
    { label: lang === "en" ? "2 hours before": "2 horas antes", value: 2,  unit: "hours"   as ReminderUnit },
    { label: lang === "en" ? "1 day before"  : "1 día antes",   value: 1,  unit: "days"    as ReminderUnit },
    { label: lang === "en" ? "2 days before" : "2 días antes",  value: 2,  unit: "days"    as ReminderUnit },
  ];

  const unitLabels: Record<ReminderUnit, string> = {
    minutes: lang === "en" ? "minutes before" : "minutos antes",
    hours:   lang === "en" ? "hours before"   : "horas antes",
    days:    lang === "en" ? "days before"    : "días antes",
  };

  function addPreset(value: number, unit: ReminderUnit) {
    if (reminders.some((r) => r.value === value && r.unit === unit)) return;
    onChange([...reminders, { value, unit }]);
  }

  function addCustom() {
    onChange([...reminders, { value: 30, unit: "minutes" }]);
  }

  function remove(index: number) {
    onChange(reminders.filter((_, i) => i !== index));
  }

  function update(index: number, key: keyof ReminderConfig, val: any) {
    onChange(reminders.map((r, i) => i === index ? { ...r, [key]: val } : r));
  }

  return (
    <div style={{ display: "grid", gap: "10px" }}>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {PRESETS.map((preset) => {
          const active = reminders.some((r) => r.value === preset.value && r.unit === preset.unit);
          return (
            <button
              key={`${preset.value}-${preset.unit}`}
              onClick={() => active
                ? onChange(reminders.filter((r) => !(r.value === preset.value && r.unit === preset.unit)))
                : addPreset(preset.value, preset.unit)
              }
              style={{
                padding: "4px 10px", borderRadius: "var(--radius-full)",
                border: `1px solid ${active ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
                background: active ? "var(--color-brand-blue-light)" : "var(--color-bg-subtle)",
                color: active ? "var(--color-brand-blue)" : "var(--color-text-muted)",
                fontSize: "11px", fontWeight: active ? 600 : 400,
                cursor: "pointer", transition: "var(--transition-fast)",
              }}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {reminders.length > 0 && (
        <div style={{ display: "grid", gap: "6px" }}>
          {reminders.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-brand-blue)", flexShrink: 0 }} />
              <input type="number" min={1} value={r.value} onChange={(e) => update(i, "value", Number(e.target.value))} style={{ ...INPUT_STYLE, width: "60px" }} />
              <select value={r.unit} onChange={(e) => update(i, "unit", e.target.value as ReminderUnit)} style={{ ...INPUT_STYLE, flex: 1 }}>
                {(["minutes", "hours", "days"] as ReminderUnit[]).map((unit) => (
                  <option key={unit} value={unit}>{unitLabels[unit]}</option>
                ))}
              </select>
              <button onClick={() => remove(i)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}>
                <XIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={addCustom}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "6px 12px", borderRadius: "var(--radius-md)",
          border: "1px dashed var(--color-border)",
          background: "transparent", color: "var(--color-text-muted)",
          fontSize: "12px", cursor: "pointer", width: "fit-content",
          transition: "var(--transition-fast)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-brand-blue)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--color-brand-blue)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
        }}
      >
        <PlusIcon />
        {lang === "en" ? "Add custom reminder" : "Agregar recordatorio personalizado"}
      </button>
    </div>
  );
}
