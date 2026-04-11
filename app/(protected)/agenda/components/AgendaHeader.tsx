"use client";

import React from "react";
import { CalendarView } from "../types/agenda.types";

interface AgendaHeaderProps {
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  selectedDate: string;
  onNavigate: (direction: "prev" | "next" | "today") => void;
  onNewEvent: () => void;
}

function getLabel(view: CalendarView, dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  if (view === "day") return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  if (view === "week") {
    const start = new Date(d);
    const day = d.getDay();
    start.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString("es-MX", { day: "numeric", month: "short" })} — ${end.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  if (view === "month") return d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  return d.getFullYear().toString();
}

const views: { key: CalendarView; label: string }[] = [
  { key: "day",   label: "Día" },
  { key: "week",  label: "Semana" },
  { key: "month", label: "Mes" },
  { key: "year",  label: "Año" },
];

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

export default function AgendaHeader({
  view, onViewChange, selectedDate, onNavigate, onNewEvent,
}: AgendaHeaderProps) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={onNewEvent}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            height: "36px", padding: "0 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-brand-blue)",
            color: "#fff", border: "none",
            fontSize: "13px", fontWeight: 600,
            cursor: "pointer", flexShrink: 0,
            boxShadow: "var(--shadow-brand-blue)",
          }}
        >
          <PlusIcon />
          Nuevo evento
        </button>

        <div style={{ display: "flex", gap: "1px", background: "var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "2px", overflow: "hidden" }}>
          {views.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onViewChange(key)}
              style={{
                height: "30px", padding: "0 12px",
                borderRadius: "calc(var(--radius-md) - 2px)",
                border: "none",
                background: view === key ? "var(--color-bg-base)" : "transparent",
                color: view === key ? "var(--color-text-primary)" : "var(--color-text-muted)",
                fontSize: "12px", fontWeight: view === key ? 600 : 400,
                cursor: "pointer",
                boxShadow: view === key ? "var(--shadow-sm)" : "none",
                transition: "var(--transition-fast)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={() => onNavigate("today")}
          style={{
            height: "32px", padding: "0 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-subtle)",
            color: "var(--color-text-second)",
            fontSize: "12px", fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Hoy
        </button>

        <div style={{ display: "flex", gap: "4px" }}>
          {(["prev", "next"] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => onNavigate(dir)}
              style={{
                width: "32px", height: "32px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-subtle)",
                color: "var(--color-text-second)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ChevronIcon dir={dir === "prev" ? "left" : "right"} />
            </button>
          ))}
        </div>

        <div style={{
          fontSize: "14px", fontWeight: 600,
          color: "var(--color-text-primary)",
          textTransform: "capitalize",
          minWidth: "200px",
        }}>
          {getLabel(view, selectedDate)}
        </div>
      </div>
    </div>
  );
}
