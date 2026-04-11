"use client";

import React, { useRef } from "react";
import { CalendarEvent, HOURS_START, HOURS_END, HOUR_HEIGHT } from "../types/agenda.types";
import { isModuleEvent } from "@/services/agenda/module-events.service";
import ModuleEventBadge from "./ModuleEventBadge";

interface WeekViewProps {
  weekDays: Date[];
  events: CalendarEvent[];
  selectedDate: string;
  onEventClick: (ev: CalendarEvent) => void;
  onSlotClick: (dateTime: string) => void;
  onEventDrop: (eventId: string, newStart: Date) => void;
}

function minutesFromStart(date: Date) {
  return (date.getHours() - HOURS_START) * 60 + date.getMinutes();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

function getLocalDateISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const HOURS = Array.from({ length: HOURS_END - HOURS_START + 1 }, (_, i) =>
  `${String(HOURS_START + i).padStart(2, "0")}:00`
);

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function getEventsByDay(events: CalendarEvent[], day: Date) {
  return events.filter((ev) => {
    const s = new Date(ev.start_datetime);
    return s.getFullYear() === day.getFullYear()
      && s.getMonth() === day.getMonth()
      && s.getDate() === day.getDate();
  });
}

export default function WeekView({
  weekDays, events, selectedDate,
  onEventClick, onSlotClick, onEventDrop,
}: WeekViewProps) {
  const todayStr = getLocalDateISO(new Date());
  const draggingId = useRef<string | null>(null);

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
    }}>
      {/* HEADER DÍAS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))",
        borderBottom: "1px solid var(--color-border-faint)",
        background: "var(--color-bg-subtle)",
      }}>
        <div />
        {weekDays.map((day, i) => {
          const isToday = getLocalDateISO(day) === todayStr;
          const isSelected = getLocalDateISO(day) === selectedDate;
          return (
            <div
              key={i}
              style={{
                padding: "10px 8px",
                textAlign: "center",
                borderLeft: "1px solid var(--color-border-faint)",
              }}
            >
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {DAY_LABELS[i]}
              </div>
              <div style={{
                width: "30px", height: "30px",
                borderRadius: "50%",
                background: isToday ? "var(--color-brand-blue)" : isSelected ? "var(--color-brand-blue-light)" : "transparent",
                color: isToday ? "#fff" : isSelected ? "var(--color-brand-blue)" : "var(--color-text-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "4px auto 0",
                fontSize: "14px", fontWeight: 700,
              }}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* GRID HORAS */}
      <div style={{ position: "relative", overflowY: "auto", maxHeight: "calc(100vh - 300px)" }}>
        {/* HORA ACTUAL */}
        <NowIndicator weekDays={weekDays} />

        <div style={{ display: "grid", gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }}>
          {HOURS.map((hour) => (
            <React.Fragment key={hour}>
              <div style={{
                padding: "0 8px",
                height: `${HOUR_HEIGHT}px`,
                display: "flex", alignItems: "flex-start", paddingTop: "4px",
                fontSize: "10px", fontWeight: 600,
                color: "var(--color-text-muted)",
                borderTop: "1px solid var(--color-border-faint)",
                flexShrink: 0,
              }}>
                {hour}
              </div>
              {weekDays.map((day, di) => (
                <div
                  key={di}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = draggingId.current || e.dataTransfer.getData("eventId");
                    if (!id) return;
                    const [h] = hour.split(":");
                    const d = new Date(day);
                    d.setHours(Number(h), 0, 0, 0);
                    onEventDrop(id, d);
                  }}
                  onClick={() => {
                    const [h] = hour.split(":");
                    const d = new Date(day);
                    d.setHours(Number(h), 0, 0, 0);
                    const dt = `${getLocalDateISO(d)}T${h.padStart(2, "0")}:00`;
                    onSlotClick(dt);
                  }}
                  style={{
                    height: `${HOUR_HEIGHT}px`,
                    borderTop: "1px solid var(--color-border-faint)",
                    borderLeft: "1px solid var(--color-border-faint)",
                    cursor: "pointer",
                    transition: "background var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--color-bg-hover)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                />
              ))}
            </React.Fragment>
          ))}
        </div>

        {/* EVENTOS POSICIONADOS */}
        {weekDays.map((day, di) => {
          const dayEvs = getEventsByDay(events, day);
          return dayEvs.map((ev) => {
            const start = new Date(ev.start_datetime);
            const end   = new Date(ev.end_datetime ?? ev.start_datetime);
            const startMin = clamp(minutesFromStart(start), 0, (HOURS_END - HOURS_START + 1) * 60);
            const endMin   = clamp(minutesFromStart(end), startMin + 30, (HOURS_END - HOURS_START + 1) * 60);
            const top    = (startMin / 60) * HOUR_HEIGHT;
            const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 28);
            const colWidth = `calc((100% - 56px) / 7)`;

            return (
              <div
                key={ev.id}
                draggable
                onDragStart={(e) => {
                  draggingId.current = ev.id;
                  e.dataTransfer.setData("eventId", ev.id);
                }}
                onDragEnd={() => { draggingId.current = null; }}
                onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                style={{
                  position: "absolute",
                  top: `${top}px`,
                  left: `calc(56px + ${di} * ${colWidth} + 3px)`,
                  width: `calc(${colWidth} - 6px)`,
                  height: `${height}px`,
                  background: ev.color ?? "var(--color-brand-blue)",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 7px",
                  cursor: "grab",
                  overflow: "hidden",
                  boxShadow: "var(--shadow-sm)",
                  borderLeft: `3px solid ${adjustColor(ev.color ?? "#274B97")}`,
                  zIndex: 2,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px", overflow: "hidden" }}>
  <div style={{ fontSize: "11px", fontWeight: 700, color: "#fff", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
    {ev.title}
  </div>
  {isModuleEvent(ev.event_type) && (
    <div style={{
      width: "6px", height: "6px", borderRadius: "50%",
      background: "rgba(255,255,255,0.8)", flexShrink: 0,
    }} />
  )}
</div>
{height > 40 && (
  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.8)", marginTop: "1px" }}>
    {isModuleEvent(ev.event_type)
      ? "Evento automático"
      : `${start.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} — ${end.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`
    }
  </div>
)}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}

function adjustColor(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.max(0, r - 40)},${Math.max(0, g - 40)},${Math.max(0, b - 40)})`;
  } catch { return hex; }
}

function NowIndicator({ weekDays }: { weekDays: Date[] }) {
  const now = new Date();
  const todayIdx = weekDays.findIndex((d) => getLocalDateISO(d) === getLocalDateISO(now));
  if (todayIdx === -1) return null;

  const min = minutesFromStart(now);
  if (min < 0 || min > (HOURS_END - HOURS_START + 1) * 60) return null;

  const top = (min / 60) * HOUR_HEIGHT;
  const colWidth = `calc((100% - 56px) / 7)`;

  return (
    <div style={{
      position: "absolute",
      top: `${top}px`,
      left: `calc(56px + ${todayIdx} * ${colWidth})`,
      width: colWidth,
      height: "2px",
      background: "var(--color-brand-orange)",
      zIndex: 3,
      pointerEvents: "none",
    }}>
      <div style={{
        width: "8px", height: "8px", borderRadius: "50%",
        background: "var(--color-brand-orange)",
        marginTop: "-3px", marginLeft: "-4px",
      }} />
    </div>
  );
}
