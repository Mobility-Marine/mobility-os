"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Agenda() {
  const [events, setEvents] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [dateTime, setDateTime] = useState("");

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
    if (!title || !dateTime) return;

    await supabase.from("calendar_events").insert({
      title,
      start_datetime: dateTime,
      end_datetime: dateTime,
    });

    setShowModal(false);
    setTitle("");
    setDateTime("");
    loadEvents();
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <button
        onClick={() => setShowModal(true)}
        style={{
          background: "#2563eb",
          color: "#fff",
          border: "none",
          padding: "10px 16px",
          borderRadius: 8,
          cursor: "pointer",
          width: 160,
        }}
      >
        Nuevo evento
      </button>

      <div
        style={{
          background: "#12284d",
          borderRadius: 16,
          padding: 20,
          border: "1px solid #284577",
        }}
      >
        <h3>Eventos</h3>

        {events.length === 0 ? (
          <p>No hay eventos</p>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              style={{
                padding: 10,
                borderBottom: "1px solid #243a63",
              }}
            >
              <strong>{e.title}</strong>
              <div style={{ fontSize: 12, color: "#9fb3d9" }}>
                {new Date(e.start_datetime).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0f172a",
              padding: 24,
              borderRadius: 12,
              width: 400,
            }}
          >
            <h2>Nuevo evento</h2>

            <input
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={input}
            />

            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              style={input}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowModal(false)} style={btnGray}>
                Cancelar
              </button>

              <button onClick={createEvent} style={btnBlue}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  marginBottom: 12,
  padding: 10,
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#0b1220",
  color: "#fff",
};

const btnBlue: React.CSSProperties = {
  background: "#2563eb",
  border: "none",
  padding: "10px 14px",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
};

const btnGray: React.CSSProperties = {
  background: "#475569",
  border: "none",
  padding: "10px 14px",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
};
