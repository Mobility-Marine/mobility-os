"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type EventRow = {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  color?: string;
};

export default function Agenda() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    const { data } = await supabase
      .from("calendar_events")
      .select("*")
      .order("start_datetime");

    setEvents(data || []);
  }

  async function createEvent() {
    if (!newTitle || !newStart) return;

    await supabase.from("calendar_events").insert({
      title: newTitle,
      start_datetime: newStart,
      end_datetime: newEnd || newStart,
      color: "#2563eb",
    });

    setShowModal(false);
    setNewTitle("");
    setNewStart("");
    setNewEnd("");
    loadEvents();
  }

  function generateHours() {
    const hours = [];
    for (let h = 8; h <= 20; h++) {
      hours.push(`${String(h).padStart(2, "0")}:00`);
    }
    return hours;
  }

  function eventsForDay(date: Date) {
    return events.filter((e) => {
      const d = new Date(e.start_datetime);
      return d.toDateString() === date.toDateString();
    });
  }

  return (
    <div style={{ padding: 20 }}>
      {/* HEADER */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setView("day")}>Día</button>
        <button onClick={() => setView("week")}>Semana</button>
        <button onClick={() => setView("month")}>Mes</button>

        <button
          onClick={() => setShowModal(true)}
          style={{
            marginLeft: "auto",
            background: "#2563eb",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 6,
          }}
        >
          Nuevo evento
        </button>
      </div>

      {/* ================= DAY VIEW ================= */}
      {view === "day" && (
        <div style={{ position: "relative" }}>
          {generateHours().map((hour) => (
            <div
              key={hour}
              style={{
                borderBottom: "1px solid #334155",
                height: 60,
                display: "flex",
                alignItems: "center",
                paddingLeft: 10,
              }}
            >
              {hour}
            </div>
          ))}

          {eventsForDay(selectedDate).map((ev) => {
            const start = new Date(ev.start_datetime);
            const end = new Date(ev.end_datetime);

            const top =
              (start.getHours() - 8) * 60 + start.getMinutes();
            const duration =
              (end.getTime() - start.getTime()) / 60000;

            return (
              <div
                key={ev.id}
                style={{
                  position: "absolute",
                  top,
                  left: 80,
                  right: 20,
                  height: Math.max(duration, 30),
                  background: ev.color || "#2563eb",
                  borderRadius: 6,
                  padding: 6,
                  color: "#fff",
                }}
              >
                {ev.title}
              </div>
            );
          })}
        </div>
      )}

      {/* ================= WEEK VIEW ================= */}
      {view === "week" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() - d.getDay() + i);

            return (
              <div key={i} style={{ border: "1px solid #334155", minHeight: 200 }}>
                <div style={{ padding: 6, fontWeight: "bold" }}>
                  {d.toLocaleDateString()}
                </div>

                {eventsForDay(d).map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      background: ev.color || "#2563eb",
                      margin: 4,
                      padding: 4,
                      borderRadius: 4,
                      color: "#fff",
                      fontSize: 12,
                    }}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MONTH VIEW ================= */}
      {view === "month" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
          {Array.from({ length: 35 }).map((_, i) => {
            const d = new Date(selectedDate);
            d.setDate(i - d.getDay() + 1);

            return (
              <div
                key={i}
                style={{
                  border: "1px solid #334155",
                  minHeight: 120,
                  padding: 4,
                }}
              >
                <div style={{ fontSize: 12 }}>{d.getDate()}</div>

                {eventsForDay(d).map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      background: ev.color || "#2563eb",
                      marginTop: 4,
                      padding: 3,
                      borderRadius: 4,
                      fontSize: 11,
                      color: "#fff",
                    }}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL ================= */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0f172a",
              padding: 20,
              borderRadius: 10,
              width: 400,
            }}
          >
            <h2>Nuevo evento</h2>

            <input
              placeholder="Título"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ width: "100%", marginBottom: 10 }}
            />

            <input
              type="datetime-local"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              style={{ width: "100%", marginBottom: 10 }}
            />

            <input
              type="datetime-local"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              style={{ width: "100%", marginBottom: 10 }}
            />

            <button
              onClick={createEvent}
              style={{
                background: "#2563eb",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: 6,
              }}
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
