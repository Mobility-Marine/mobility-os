"use client";

import React from "react";
import { CalendarEvent } from "../types/agenda.types";

interface MonthViewProps {
  selectedDate: string;
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  onSlotClick: (dateTime: string) => void;
  onEventDrop: (eventId: string, newStart: Date) => void;
}

function getLocalDateISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMonthGrid(dateStr: string) {
  const base = new Date(dateStr + "T12:00:00");
  const year  = base.getFullYear();
  const month = base.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevLast = new Date(year, month, 0).getDate();

  const days: { date: Date; currentMonth: boolean }[] = [];
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevLast - i), currentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), currentMonth: true });
  }
  while (days.length < 42) {
    days.push({ date: new Date(year, month + 1, days.length - daysInMonth - startDay + 1), currentMonth: false });
  }
  return days;
}

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function MonthView({ selectedDate, events, onEventClick, onSlotClick, onEventDrop }: MonthViewProps) {
  const todayStr = getLocalDateISO(new Date());
  const grid = getMonthGrid(selectedDate);

  function getDayEvents(day: Date) {
    return events.filter((ev) => getLocalDateISO(new Date(ev.start_datetime)) === getLocalDateISO(day));
  }

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", borderBottom: "1px solid var(--color-border-faint)" }}>
        {DAY_LABELS.map((d) => (
          <div key={d} style={{
            padding: "10px 8px", textAlign: "center",
            fontSize: "11px", fontWeight: 600,
            color: "var(--color-text-muted)",
            textTransform: "uppercase", letterSpacing: "0.5px",
            background: "var(--color-bg-subtle)",
            borderRight: "1px solid var(--color-border-faint)",
          }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {grid.map((day, i) => {
          const dayStr   = getLocalDateISO(day.date);
          const isToday  = dayStr === todayStr;
          const isSelected = dayStr === selectedDate;
          const dayEvs   = getDayEvents(day.date);

          return (
            <div
              key={i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("eventId");
                if (!id) return;
                const d = new Date(day.date);
                d.setHours(9, 0, 0, 0);
                onEventDrop(id, d);
              }}
              onClick={() => {
                const d = new Date(day.date);
                d.setHours(9, 0, 0, 0);
                onSlotClick(`${dayStr}T09:00`);
              }}
              style={{
                minHeight: "120px",
                padding: "6px",
                borderTop: "1px solid var(--color-border-faint)",
                borderRight: "1px solid var(--color-border-faint)",
                background: isSelected ? "var(--color-bg-active)" : "transparent",
                opacity: day.currentMonth ? 1 : 0.4,
                cursor: "pointer",
                transition: "background var(--transition-fast)",
              }}
              onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "var(--color-bg-hover)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = isSelected ? "var(--color-bg-active)" : "transparent"; }}
            >
              <div style={{
                width: "26px", height: "26px", borderRadius: "50%",
                background: isToday ? "var(--color-brand-blue)" : "transparent",
                color: isToday ? "#fff" : "var(--color-text-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: isToday ? 700 : 500,
                marginBottom: "4px",
              }}>
                {day.date.getDate()}
              </div>

              {dayEvs.slice(0, 3).map((ev) => (
                <div
                  key={ev.id}
                  draggable
                  onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData("eventId", ev.id); }}
                  onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                  style={{
                    background: ev.color ?? "var(--color-brand-blue)",
                    color: "#fff",
                    borderRadius: "3px",
                    padding: "2px 5px",
                    marginBottom: "2px",
                    fontSize: "10px",
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    cursor: "grab",
                  }}
                >
                  {new Date(ev.start_datetime).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} {ev.title}
                </div>
              ))}

              {dayEvs.length > 3 && (
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontWeight: 500, paddingLeft: "2px" }}>
                  +{dayEvs.length - 3} más
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
