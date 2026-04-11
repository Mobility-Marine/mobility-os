"use client";

import React from "react";
import {
  RecurrenceConfig, RecurrenceFrequency,
  FREQUENCY_LABELS, DAY_LABELS, DEFAULT_RECURRENCE,
} from "../types/recurrence.types";

interface RecurrencePickerProps {
  value: RecurrenceConfig;
  onChange: (config: RecurrenceConfig) => void;
  eventStart: string;
}

const INPUT_STYLE: React.CSSProperties = {
  height: "32px",
  padding: "0 10px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)",
  color: "var(--color-text-primary)",
  fontSize: "12px",
  outline: "none",
};

const FREQUENCIES: RecurrenceFrequency[] = ["none", "daily", "weekly", "monthly", "yearly"];

export default function RecurrencePicker({ value, onChange, eventStart }: RecurrencePickerProps) {
  function set(key: keyof RecurrenceConfig, val: any) {
    onChange({ ...value, [key]: val });
  }

  function toggleDay(day: number) {
    const current = value.days_of_week ?? [];
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();
    set("days_of_week", next);
  }

  function getSummary(): string {
    if (value.frequency === "none") return "";
    const freq = FREQUENCY_LABELS[value.frequency].toLowerCase();
    const interval = value.interval > 1 ? `cada ${value.interval} ` : "";
    let base = `Se repite ${interval}${freq}`;
    if (value.frequency === "weekly" && value.days_of_week?.length) {
      base += ` (${value.days_of_week.map((d) => DAY_LABELS[d]).join(", ")})`;
    }
    if (value.end_type === "date" && value.end_date) {
      base += ` hasta ${new Date(value.end_date).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}`;
    }
    if (value.end_type === "count" && value.end_count) {
      base += `, ${value.end_count} veces`;
    }
    return base;
  }

  return (
    <div style={{ display: "grid", gap: "12px" }}>

      {/* FRECUENCIA */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {FREQUENCIES.map((freq) => (
          <button
            key={freq}
            onClick={() => onChange({ ...DEFAULT_RECURRENCE, frequency: freq })}
            style={{
              padding: "5px 12px",
              borderRadius: "var(--radius-full)",
              border: `1px solid ${value.frequency === freq ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
              background: value.frequency === freq ? "var(--color-brand-blue-light)" : "var(--color-bg-subtle)",
              color: value.frequency === freq ? "var(--color-brand-blue)" : "var(--color-text-muted)",
              fontSize: "12px",
              fontWeight: value.frequency === freq ? 600 : 400,
              cursor: "pointer",
              transition: "var(--transition-fast)",
            }}
          >
            {FREQUENCY_LABELS[freq]}
          </button>
        ))}
      </div>

      {value.frequency !== "none" && (
        <div style={{ display: "grid", gap: "10px" }}>

          {/* INTERVALO */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Repetir cada</span>
            <input
              type="number"
              min={1}
              max={99}
              value={value.interval}
              onChange={(e) => set("interval", Math.max(1, Number(e.target.value)))}
              style={{ ...INPUT_STYLE, width: "60px", textAlign: "center" }}
            />
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              {value.frequency === "daily"   ? "día(s)"   :
               value.frequency === "weekly"  ? "semana(s)" :
               value.frequency === "monthly" ? "mes(es)"  : "año(s)"}
            </span>
          </div>

          {/* DÍAS DE LA SEMANA */}
          {value.frequency === "weekly" && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Días de la semana
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {DAY_LABELS.map((label, i) => {
                  const selected = value.days_of_week?.includes(i) ?? false;
                  return (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      style={{
                        width: "36px", height: "36px",
                        borderRadius: "50%",
                        border: `1px solid ${selected ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
                        background: selected ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
                        color: selected ? "#fff" : "var(--color-text-muted)",
                        fontSize: "11px", fontWeight: selected ? 700 : 400,
                        cursor: "pointer",
                        transition: "var(--transition-fast)",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* FIN DE RECURRENCIA */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Termina
            </div>
            <div style={{ display: "grid", gap: "6px" }}>
              {[
                { key: "never", label: "Nunca" },
                { key: "date",  label: "En fecha específica" },
                { key: "count", label: "Después de N veces" },
              ].map(({ key, label }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    onClick={() => set("end_type", key)}
                    style={{
                      width: "16px", height: "16px",
                      borderRadius: "50%",
                      border: `2px solid ${value.end_type === key ? "var(--color-brand-blue)" : "var(--color-border)"}`,
                      background: value.end_type === key ? "var(--color-brand-blue)" : "transparent",
                      cursor: "pointer",
                      flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {value.end_type === key && (
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />
                    )}
                  </div>
                  <span
                    onClick={() => set("end_type", key)}
                    style={{ fontSize: "12px", color: "var(--color-text-second)", cursor: "pointer" }}
                  >
                    {label}
                  </span>

                  {key === "date" && value.end_type === "date" && (
                    <input
                      type="date"
                      value={value.end_date ?? ""}
                      min={eventStart.slice(0, 10)}
                      onChange={(e) => set("end_date", e.target.value)}
                      style={{ ...INPUT_STYLE, flex: 1 }}
                    />
                  )}

                  {key === "count" && value.end_type === "count" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={value.end_count ?? 10}
                        onChange={(e) => set("end_count", Math.max(1, Number(e.target.value)))}
                        style={{ ...INPUT_STYLE, width: "70px", textAlign: "center" }}
                      />
                      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>veces</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RESUMEN */}
          <div style={{
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-brand-blue-light)",
            border: "1px solid var(--color-brand-blue-light)",
          }}>
            <span style={{ fontSize: "12px", color: "var(--color-brand-blue)", fontWeight: 500 }}>
              {getSummary()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
