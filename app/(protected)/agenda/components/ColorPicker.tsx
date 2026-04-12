"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export interface ColorPreset {
  color:   string;
  labelKey: string;
  meaning: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { color: "#274B97", labelKey: "colorMeeting",   meaning: "meeting"   },
  { color: "#1D9E75", labelKey: "colorDone",       meaning: "done"      },
  { color: "#E44E36", labelKey: "colorUrgent",     meaning: "urgent"    },
  { color: "#BA7517", labelKey: "colorFollowup",   meaning: "followup"  },
  { color: "#534AB7", labelKey: "colorPersonal",   meaning: "personal"  },
  { color: "#D4537E", labelKey: "colorImportant",  meaning: "important" },
  { color: "#0F6E56", labelKey: "colorOperation",  meaning: "operation" },
  { color: "#6B7280", labelKey: "colorInfo",       meaning: "info"      },
];

interface ColorPickerProps {
  value:    string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "8px" }}>
        {COLOR_PRESETS.map((preset) => {
          const isSelected = value === preset.color;
          const label = (t.agenda as any)[preset.labelKey] ?? preset.labelKey;
          return (
            <button
              key={preset.color}
              onClick={() => onChange(preset.color)}
              title={label}
              style={{
                padding: "6px 4px",
                borderRadius: "var(--radius-md)",
                border: isSelected ? `2px solid ${preset.color}` : "2px solid transparent",
                background: isSelected ? preset.color + "20" : "var(--color-bg-subtle)",
                cursor: "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: "4px",
                transition: "var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = preset.color + "15";
              }}
              onMouseLeave={(e) => {
                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-subtle)";
              }}
            >
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%",
                background: preset.color,
                boxShadow: isSelected ? `0 0 0 2px white, 0 0 0 4px ${preset.color}` : "none",
                transition: "var(--transition-fast)", flexShrink: 0,
              }} />
              <span style={{
                fontSize: "9px",
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? preset.color : "var(--color-text-muted)",
                lineHeight: 1.2, textAlign: "center",
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "8px", borderRadius: "var(--radius-md)",
        background: "var(--color-bg-subtle)",
        border: "1px solid var(--color-border-faint)",
      }}>
        <div style={{ width: "24px", height: "24px", borderRadius: "var(--radius-sm)", background: value, flexShrink: 0 }} />
        <span style={{ fontSize: "12px", color: "var(--color-text-muted)", flex: 1 }}>
          {t.agenda.customColor}
        </span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: "32px", height: "28px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer", padding: "2px", background: "transparent" }}
        />
      </div>
    </div>
  );
}
