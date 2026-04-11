"use client";

import React from "react";
import {
  ReminderConfig, ReminderUnit,
  REMINDER_PRESETS,
} from "../types/recurrence.types";

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
  height: "30px",
  padding: "0 8px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)",
  color: "var(--color-text-primary)",
  fontSize: "12px",
  outline: "none",
};

export default function ReminderPicker({ reminders, onChange }: ReminderPickerProps) {
  function addPreset(value: number, unit: ReminderUnit) {
    const already = reminders.some((r) => r.value === value && r.unit === unit);
    if (already) return;
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

      {/* PRESETS */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {REMINDER_PRESETS.map((preset) => {
          const active = reminders.some((r) => r.value === preset.value && r.unit === preset.unit);
          return (
            <button
              key={`${preset.value}-${preset.unit}`}
              onClick={() => active
                ? onChange(reminders.filter((r) => !(r.value === preset.value && r.unit === preset.unit)))
                : addPreset(preset.value, preset.unit)
              }
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                border: `1px solid ${active ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
                background: active ? "var(--color-brand-blue-light)" : "var(--color-bg-subtle)",
                color: active ? "var(--color-brand-blue)" : "var(--color-text-muted)",
                fontSize: "11px",
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                transition: "var(--transition-fast)",
              }}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* RECORDATORIOS ACTIVOS */}
      {reminders.length > 0 && (
        <div style={{ display: "grid", gap: "6px" }}>
          {reminders.map((r, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "6px 10px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-bg-subtle)",
              border: "1px solid var(--color-border-faint)",
            }}>
              <div style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: "var(--color-brand-blue)", flexShrink: 0,
              }} />
              <input
                type="number"
                min={1}
                value={r.value}
                onChange={(e) => update(i, "value", Number(e.target.value))}
                style={{ ...INPUT_STYLE, width: "60px" }}
              />
              <select
                value={r.unit}
                onChange={(e) => update(i, "unit", e.target.value as ReminderUnit)}
                style={{ ...INPUT_STYLE, flex: 1 }}
              >
                <option value="minutes">minutos antes</option>
                <option value="hours">horas antes</option>
                <option value="days">días antes</option>
              </select>
              <button
                onClick={() => remove(i)}
                style={{
                  background: "none", border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer", padding: "2px",
                  display: "flex", alignItems: "center",
                }}
              >
                <XIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AGREGAR PERSONALIZADO */}
      <button
        onClick={addCustom}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "6px 12px",
          borderRadius: "var(--radius-md)",
          border: "1px dashed var(--color-border)",
          background: "transparent",
          color: "var(--color-text-muted)",
          fontSize: "12px",
          cursor: "pointer",
          width: "fit-content",
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
        <PlusIcon /> Agregar recordatorio personalizado
      </button>
    </div>
  );
}
