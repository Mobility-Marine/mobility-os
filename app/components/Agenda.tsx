"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type EventRow = {
  id: string;
  title: string;
  description?: string;
  event_type?: string;
  start_datetime: string;
  end_datetime?: string;
  location?: string;
  meeting_link?: string;
  priority?: string;
  status?: string;
  color?: string;
};

export default function Agenda() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "Reunión",
    start_datetime: "",
    end_datetime: "",
    location: "",
    meeting_link: "",
    priority: "Media",
    status: "pending",
    color: "#2563eb",
  });

  // ===== CARGAR EVENTOS =====
  const loadEvents = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .order("start_datetime", { ascending: true });

    if (!error && data) setEvents(data);

    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // ===== CREAR EVENTO =====
  const createEvent = async () => {
    if (!form.title || !form.start_datetime) {
      alert("Título y fecha son obligatorios");
      return;
    }

    const { error } = await supabase.from("calendar_events").insert([form]);

    if (!error) {
      setShowModal(false);
      setForm({
        title: "",
        description: "",
        event_type: "Reunión",
        start_datetime: "",
        end_datetime: "",
        location: "",
        meeting_link: "",
        priority: "Media",
        status: "pending",
        color: "#2563eb",
      });
      loadEvents();
    }
  };

  // ===== ELIMINAR EVENTO =====
  const deleteEvent = async (id: string) => {
    if (!confirm("¿Eliminar este evento?")) return;

    await supabase.from("calendar_events").delete().eq("id", id);
    loadEvents();
  };

  return (
    <div style={{ padding: 30 }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Agenda</h1>

      <button
        onClick={() => setShowModal(true)}
        style={{
          background: "#2563eb",
          color: "#fff",
          padding: "10px 18px",
          borderRadius: 8,
          marginBottom: 20,
          border: "none",
          cursor: "pointer",
        }}
      >
        Nuevo evento
      </button>

      {/* ===== LISTA DE EVENTOS ===== */}

      {loading ? (
        <p>Cargando eventos...</p>
      ) : events.length === 0 ? (
        <p>No hay eventos</p>
      ) : (
        events.map((ev) => (
          <div
            key={ev.id}
            style={{
              background: "#1e293b",
              padding: 15,
              borderRadius: 10,
              marginBottom: 12,
              borderLeft: `6px solid ${ev.color || "#2563eb"}`,
            }}
          >
            <h3>{ev.title}</h3>
            <p>{ev.description}</p>

            <p>
              📅 {new Date(ev.start_datetime).toLocaleString()}
              {ev.end_datetime &&
                " → " + new Date(ev.end_datetime).toLocaleString()}
            </p>

            {ev.location && <p>📍 {ev.location}</p>}

            <button
              onClick={() => deleteEvent(ev.id)}
              style={{
                marginTop: 8,
                background: "#ef4444",
                color: "#fff",
                border: "none",
                padding: "6px 10px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Eliminar
            </button>
          </div>
        ))
      )}

      {/* ===== MODAL CREAR EVENTO ===== */}

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0f172a",
              padding: 30,
              borderRadius: 12,
              width: 420,
            }}
          >
            <h2 style={{ marginBottom: 20 }}>Nuevo evento</h2>

            <input
              placeholder="Título"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              style={{ width: "100%", marginBottom: 10 }}
            />

            <textarea
              placeholder="Descripción"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              style={{ width: "100%", marginBottom: 10 }}
            />

            <label>Inicio</label>
            <input
              type="datetime-local"
              value={form.start_datetime}
              onChange={(e) =>
                setForm({ ...form, start_datetime: e.target.value })
              }
              style={{ width: "100%", marginBottom: 10 }}
            />

            <label>Fin</label>
            <input
              type="datetime-local"
              value={form.end_datetime}
              onChange={(e) =>
                setForm({ ...form, end_datetime: e.target.value })
              }
              style={{ width: "100%", marginBottom: 10 }}
            />

            <input
              placeholder="Ubicación"
              value={form.location}
              onChange={(e) =>
                setForm({ ...form, location: e.target.value })
              }
              style={{ width: "100%", marginBottom: 10 }}
            />

            <input
              placeholder="Link reunión"
              value={form.meeting_link}
              onChange={(e) =>
                setForm({ ...form, meeting_link: e.target.value })
              }
              style={{ width: "100%", marginBottom: 10 }}
            />

            <label>Color</label>
            <input
              type="color"
              value={form.color}
              onChange={(e) =>
                setForm({ ...form, color: e.target.value })
              }
              style={{ width: "100%", marginBottom: 20 }}
            />

            <button
              onClick={createEvent}
              style={{
                background: "#10b981",
                color: "#fff",
                border: "none",
                padding: "10px 14px",
                borderRadius: 8,
                marginRight: 10,
              }}
            >
              Guardar
            </button>

            <button
              onClick={() => setShowModal(false)}
              style={{
                background: "#374151",
                color: "#fff",
                border: "none",
                padding: "10px 14px",
                borderRadius: 8,
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
