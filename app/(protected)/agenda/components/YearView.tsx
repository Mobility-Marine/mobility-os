"use client";

import React from "react";
import { CalendarEvent } from "../types/agenda.types";

interface YearViewProps {
  selectedDate: string;
  events: CalendarEvent[];
  onMonthClick: (dateStr: string) => void;
}

function getLocalDateISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMiniGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: { day: number; current: boolean }[] = [];
  for (let i = 0; i < startDay; i++) days.push({ day: 0, current: false });
  for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, current: true });
  while (days.length < 35) days.push({ day: 0, current: false });
  return days;
}

export default function YearView({ selectedDate, events, onMonthClick }: YearViewProps) {
  const base  = new Date(selectedDate + "T12:00:00");
  const year  = base.getFullYear();
  const todayStr = getLocalDateISO(new Date());

  function getEventsForDay(month: number, day: number): number {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((ev) => getLocalDateISO(new Date(ev.start_datetime)) === dateStr).length;
}

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, i, 1);
    return {
      date: d,
      label: d.toLocaleDateString("es-MX", { month: "long" }),
      grid: getMiniGrid(year, i),
    };
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px" }}>
      {months.map(({ date, label, grid }) => {
        const month = date.getMonth();
        const monthStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const eventsThisMonth = events.filter((ev) => {
          const s = new Date(ev.start_datetime);
          return s.getFullYear() === year && s.getMonth() === month;
        }).length;

        return (
          <div
            key={month}
            onClick={() => onMonthClick(monthStr)}
            style={{
              background: "var(--color-bg-base)",
              border: "1px solid var(--color-border-faint)",
              borderRadius: "var(--radius-lg)",
              padding: "14px",
              cursor: "pointer",
              boxShadow: "var(--shadow-sm)",
              transition: "var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border-faint)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "capitalize" }}>
                {label}
              </div>
              {eventsThisMonth > 0 && (
                <div style={{
                  padding: "1px 7px", borderRadius: "var(--radius-full)",
                  background: "var(--color-brand-blue-light)",
                  color: "var(--color-brand-blue)",
                  fontSize: "10px", fontWeight: 600,
                }}>
                  {eventsThisMonth}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "1px" }}>
              {["L","M","X","J","V","S","D"].map((d) => (
                <div key={d} style={{ fontSize: "8px", textAlign: "center", color: "var(--color-text-muted)", fontWeight: 600, paddingBottom: "2px" }}>
                  {d}
                </div>
              ))}
              {grid.map((cell, ci) => {
                if (!cell.current) return <div key={ci} />;
                const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
                const isToday = dayStr === todayStr;
                const hasEvs = getEventsForDay(month, cell.day) > 0;

                return (
                  <div key={ci} style={{
                    fontSize: "9px", textAlign: "center",
                    padding: "2px",
                    borderRadius: "3px",
                    background: isToday ? "var(--color-brand-blue)" : "transparent",
                    color: isToday ? "#fff" : hasEvs ? "var(--color-brand-blue)" : "var(--color-text-second)",
                    fontWeight: isToday || hasEvs ? 700 : 400,
                    position: "relative",
                  }}>
                    {cell.day}
                    {hasEvs && !isToday && (
                      <div style={{
                        width: "3px", height: "3px", borderRadius: "50%",
                        background: "var(--color-brand-blue)",
                        margin: "0 auto",
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
