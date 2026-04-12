"use client";

import React, { useRef } from "react";
import { CalendarEvent, HOURS_START, HOURS_END, HOUR_HEIGHT } from "../types/agenda.types";
import { isModuleEvent } from "@/services/agenda/module-events.service";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  onSlotClick: (dateTime: string) => void;
  onEventDrop: (eventId: string, newStart: Date) => void;
}

function getLocalDateISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function minutesFromStart(date: Date) {
  return (date.getHours() - HOURS_START) * 60 + date.getMinutes();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

const HOURS = Array.from({ length: HOURS_END - HOURS_START + 1 }, (_, i) =>
  `${String(HOURS_START + i).padStart(2, "0")}:00`
);

export default function DayView({ currentDate, events, onEventClick, onSlotClick, onEventDrop }: DayViewProps) {
  const draggingId = useRef<string | null>(null);
  const dayStr     = getLocalDateISO(currentDate);
  const dayEvents  = events.filter((ev) => getLocalDateISO(new Date(ev.start_datetime)) === dayStr);

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
    }}>
      {/* DÍA HEADER */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--color-border-faint)",
        background: "var(--color-bg-subtle)",
        display: "flex", alignItems: "center", gap: "12px",
      }}>
        <div style={{
          width: "40px", height: "40px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-brand-blue)",
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px", fontWeight: 700, flexShrink: 0,
        }}>
          {currentDate.getDate()}
        </div>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "capitalize" }}>
            {currentDate.toLocaleDateString("es-MX", { weekday: "long", month: "long", year: "numeric" })}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {dayEvents.length} evento{dayEvents.length !== 1 ? "s" : ""} programado{dayEvents.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* GRID */}
      <div style={{ position: "relative", overflowY: "auto", maxHeight: "calc(100vh - 320px)" }}>
        {HOURS.map((hour) => (
          <div
            key={hour}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = draggingId.current || e.dataTransfer.getData("eventId");
              if (!id) return;
              const [h] = hour.split(":");
              const d = new Date(currentDate);
              d.setHours(Number(h), 0, 0, 0);
              onEventDrop(id, d);
            }}
            onClick={() => {
              const [h] = hour.split(":");
              onSlotClick(`${dayStr}T${h.padStart(2, "0")}:00`);
            }}
            style={{
              display: "grid",
              gridTemplateColumns: "60px 1fr",
              height: `${HOUR_HEIGHT}px`,
              borderTop: "1px solid var(--color-border-faint)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--color-bg-hover)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
          >
            <div style={{
              padding: "4px 8px",
              fontSize: "10px", fontWeight: 600,
              color: "var(--color-text-muted)",
              background: "var(--color-bg-subtle)",
              borderRight: "1px solid var(--color-border-faint)",
            }}>
              {hour}
            </div>
            <div />
          </div>
        ))}

        {/* EVENTOS */}
        {dayEvents.map((ev) => {
          const start    = new Date(ev.start_datetime);
          const end      = new Date(ev.end_datetime ?? ev.start_datetime);
          const startMin = clamp(minutesFromStart(start), 0, (HOURS_END - HOURS_START + 1) * 60);
          const endMin   = clamp(minutesFromStart(end), startMin + 30, (HOURS_END - HOURS_START + 1) * 60);
          const top      = (startMin / 60) * HOUR_HEIGHT;
          const height   = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 36);
          const isModule = isModuleEvent(ev.event_type);

          return (
            <div
              key={ev.id}
              draggable={!isModule}
              onDragStart={(e) => {
                if (isModule) { e.preventDefault(); return; }
                draggingId.current = ev.id;
                e.dataTransfer.setData("eventId", ev.id);
              }}
              onDragEnd={() => { draggingId.current = null; }}
              onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
              style={{
                position: "absolute",
                top:    `${top}px`,
                left:   "68px",
                right:  "8px",
                height: `${height}px`,
                background:   ev.color ?? "var(--color-brand-blue)",
                borderRadius: "var(--radius-md)",
                padding:      "6px 10px",
                cursor:       isModule ? "default" : "grab",
                overflow:     "hidden",
                boxShadow:    "var(--shadow-md)",
                borderLeft:   `4px solid rgba(0,0,0,0.2)`,
                zIndex: 2,
                opacity: isModule ? 0.85 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ev.title}
                </div>
                {isModule && (
                  <span style={{
                    fontSize: "9px", fontWeight: 700,
                    padding: "1px 5px", borderRadius: "3px",
                    background: "rgba(255,255,255,0.25)",
                    color: "#fff", flexShrink: 0,
                  }}>
                    AUTO
                  </span>
                )}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", marginTop: "2px" }}>
                {isModule
                  ? "Evento automático de módulo"
                  : `${start.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} — ${end.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`
                }
              </div>
              {ev.location && !isModule && (
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>
                  {ev.location}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
