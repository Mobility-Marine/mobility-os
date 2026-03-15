"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type CalendarView = "day" | "week" | "month" | "year";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  event_type: string | null;
  start_datetime: string;
  end_datetime: string | null;
  location: string | null;
  meeting_link: string | null;
  priority: string | null;
  status: string | null;
  color: string | null;
  related_prospect_id?: string | null;
  related_client_id?: string | null;
  assigned_to?: string | null;
  created_by?: string | null;
  type?: string | null;
  prospect_id?: string | null;
  client_id?: string | null;
};

const panelStyle: React.CSSProperties = {
  background: "#12284d",
  border: "1px solid #284577",
  borderRadius: 16,
  padding: 22,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0b1220",
  color: "#fff",
  border: "1px solid #334155",
  borderRadius: 10,
  padding: "12px 14px",
  outline: "none",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  background: "#1d4ed8",
  border: "none",
  padding: "8px 12px",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
};

function getLocalDateISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateTimeLocal(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function combineDateAndHour(baseDate: string, hour: string) {
  const date = new Date(`${baseDate}T12:00:00`);
  const [h, m] = hour.split(":");
  date.setHours(Number(h), Number(m), 0, 0);
  return formatDateTimeLocal(date);
}

export default function Agenda() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarView, setCalendarView] = useState<CalendarView>("week");
  const [selectedDate, setSelectedDate] = useState(getLocalDateISO());
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "Reunión",
    start_datetime: "",
    end_datetime: "",
    location: "",
    meeting_link: "",
    priority: "Media",
    status: "Programado",
    color: "#2563eb",
  });

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);

    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .order("start_datetime", { ascending: true });

    if (error) {
      alert("Error cargando agenda: " + error.message);
      setLoading(false);
      return;
    }

    setEvents((data as EventRow[]) || []);
    setLoading(false);
  }

  function resetForm(startDateTime?: string) {
    const start = startDateTime || combineDateAndHour(getLocalDateISO(), "09:00");
    const endDate = new Date(start);
    endDate.setHours(endDate.getHours() + 1);

    setEditingEventId(null);
    setForm({
      title: "",
      description: "",
      event_type: "Reunión",
      start_datetime: start,
      end_datetime: formatDateTimeLocal(endDate),
      location: "",
      meeting_link: "",
      priority: "Media",
      status: "Programado",
      color: "#2563eb",
    });
  }

  function openCreateModal(startDateTime?: string) {
    resetForm(startDateTime);
    setShowModal(true);
  }

  function openEditModal(ev: EventRow) {
    const start = formatDateTimeLocal(new Date(ev.start_datetime));
    const end = ev.end_datetime
      ? formatDateTimeLocal(new Date(ev.end_datetime))
      : formatDateTimeLocal(new Date(new Date(ev.start_datetime).getTime() + 60 * 60 * 1000));

    setEditingEventId(ev.id);
    setForm({
      title: ev.title || "",
      description: ev.description || "",
      event_type: ev.event_type || ev.type || "Reunión",
      start_datetime: start,
      end_datetime: end,
      location: ev.location || "",
      meeting_link: ev.meeting_link || "",
      priority: ev.priority || "Media",
      status: ev.status || "Programado",
      color: ev.color || "#2563eb",
    });
    setShowModal(true);
  }

  async function saveEvent() {
    if (!form.title.trim()) {
      alert("Escribe el título del evento");
      return;
    }

    if (!form.start_datetime || !form.end_datetime) {
      alert("Completa inicio y fin");
      return;
    }

    if (new Date(form.end_datetime) < new Date(form.start_datetime)) {
      alert("La fecha de fin no puede ser menor que la de inicio");
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      event_type: form.event_type || null,
      start_datetime: new Date(form.start_datetime).toISOString(),
      end_datetime: new Date(form.end_datetime).toISOString(),
      location: form.location || null,
      meeting_link: form.meeting_link || null,
      priority: form.priority || null,
      status: form.status || null,
      color: form.color || "#2563eb",
      type: form.event_type || "Reunión",
    };

    if (editingEventId) {
      const { error } = await supabase
        .from("calendar_events")
        .update(payload)
        .eq("id", editingEventId);

      if (error) {
        alert("Error actualizando evento: " + error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("calendar_events").insert(payload);

      if (error) {
        alert("Error creando evento: " + error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setShowModal(false);
    resetForm();
    loadEvents();
  }

  async function deleteEvent() {
    if (!editingEventId) return;
    if (!confirm("¿Eliminar este evento?")) return;

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", editingEventId);

    if (error) {
      alert("Error eliminando evento: " + error.message);
      return;
    }

    setShowModal(false);
    resetForm();
    loadEvents();
  }

  function generateHours() {
    const hours: string[] = [];
    for (let h = 8; h <= 20; h++) {
      hours.push(`${String(h).padStart(2, "0")}:00`);
    }
    return hours;
  }

  function getWeekDays() {
    const base = new Date(`${selectedDate}T12:00:00`);
    const start = new Date(base);
    start.setDate(base.getDate() - ((base.getDay() + 6) % 7));

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }

  function getMonthDays() {
    const base = new Date(`${selectedDate}T12:00:00`);
    const year = base.getFullYear();
    const month = base.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDay = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: Date; currentMonth: boolean }[] = [];
    const prevMonthDays = new Date(year, month, 0).getDate();

    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        currentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        currentMonth: true,
      });
    }

    while (days.length < 42) {
      const d = days.length - daysInMonth - startDay + 1;
      days.push({
        date: new Date(year, month + 1, d),
        currentMonth: false,
      });
    }

    return days;
  }

  function navigate(direction: "prev" | "next" | "today") {
    if (direction === "today") {
      setSelectedDate(getLocalDateISO());
      return;
    }

    const d = new Date(`${selectedDate}T12:00:00`);

    if (calendarView === "day") d.setDate(d.getDate() + (direction === "next" ? 1 : -1));
    if (calendarView === "week") d.setDate(d.getDate() + (direction === "next" ? 7 : -7));
    if (calendarView === "month") d.setMonth(d.getMonth() + (direction === "next" ? 1 : -1));
    if (calendarView === "year") d.setFullYear(d.getFullYear() + (direction === "next" ? 1 : -1));

    setSelectedDate(getLocalDateISO(d));
  }

  const titleLabel = useMemo(() => {
    if (calendarView === "day") {
      return new Date(`${selectedDate}T12:00:00`).toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    if (calendarView === "week") {
      const weekDays = getWeekDays();
      const start = weekDays[0];
      const end = weekDays[6];

      return `${start.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
      })} — ${end.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;
    }

    if (calendarView === "month") {
      return new Date(`${selectedDate}T12:00:00`).toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric",
      });
    }

    return String(new Date(`${selectedDate}T12:00:00`).getFullYear());
  }, [calendarView, selectedDate]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["day", "week", "month", "year"] as const).map((view) => (
            <button
              key={view}
              onClick={() => setCalendarView(view)}
              style={{
                ...buttonStyle,
                background: calendarView === view ? "#2563eb" : "#0f1f3d",
                border: "1px solid #2f5aa6",
              }}
            >
              {view === "day" && "Día"}
              {view === "week" && "Semana"}
              {view === "month" && "Mes"}
              {view === "year" && "Año"}
            </button>
          ))}
        </div>

        <button onClick={() => openCreateModal()} style={{ ...buttonStyle, padding: "10px 16px" }}>
          Nuevo evento
        </button>
      </div>

      <section style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
          <h3 style={{ margin: 0, textTransform: "capitalize" }}>{titleLabel}</h3>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => navigate("prev")} style={buttonStyle}>◀ Anterior</button>
            <button onClick={() => navigate("today")} style={buttonStyle}>Hoy</button>
            <button onClick={() => navigate("next")} style={buttonStyle}>Siguiente ▶</button>
          </div>
        </div>

        {loading && <p>Cargando agenda...</p>}

        {!loading && calendarView === "day" && (
          <DayView
            selectedDate={selectedDate}
            events={events}
            onCreate={openCreateModal}
            onEdit={openEditModal}
          />
        )}

        {!loading && calendarView === "week" && (
          <WeekView
            selectedDate={selectedDate}
            events={events}
            onCreate={openCreateModal}
            onEdit={openEditModal}
          />
        )}

        {!loading && calendarView === "month" && (
          <MonthView
            selectedDate={selectedDate}
            events={events}
            onCreate={openCreateModal}
            onEdit={openEditModal}
          />
        )}

        {!loading && calendarView === "year" && (
          <YearView
            selectedDate={selectedDate}
            events={events}
            onCreate={openCreateModal}
            onEdit={openEditModal}
          />
        )}
      </section>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            backdropFilter: "blur(4px)",
            padding: 20,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 680,
              background: "#0f172a",
              border: "1px solid #284577",
              borderRadius: 18,
              padding: 24,
              boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {editingEventId ? "Editar evento" : "Nuevo evento"}
            </h2>

            <div style={{ display: "grid", gap: 12 }}>
              <input
                placeholder="Título"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                style={inputStyle}
              />

              <textarea
                placeholder="Descripción"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                <select
                  value={form.event_type}
                  onChange={(e) => setForm((prev) => ({ ...prev, event_type: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="Reunión">Reunión</option>
                  <option value="Llamada">Llamada</option>
                  <option value="Visita">Visita</option>
                  <option value="Seguimiento">Seguimiento</option>
                  <option value="Operación">Operación</option>
                  <option value="Personal">Personal</option>
                </select>

                <select
                  value={form.priority}
                  onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                  <option value="Crítica">Crítica</option>
                </select>

                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="Programado">Programado</option>
                  <option value="Confirmado">Confirmado</option>
                  <option value="Completado">Completado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Color</label>
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                    style={{ width: "100%", height: 44, background: "transparent", border: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                <input
                  type="datetime-local"
                  value={form.start_datetime}
                  onChange={(e) => setForm((prev) => ({ ...prev, start_datetime: e.target.value }))}
                  style={inputStyle}
                />

                <input
                  type="datetime-local"
                  value={form.end_datetime}
                  onChange={(e) => setForm((prev) => ({ ...prev, end_datetime: e.target.value }))}
                  style={inputStyle}
                />

                <input
                  placeholder="Ubicación"
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                  style={inputStyle}
                />

                <input
                  placeholder="Link de reunión"
                  value={form.meeting_link}
                  onChange={(e) => setForm((prev) => ({ ...prev, meeting_link: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ ...buttonStyle, background: "#475569" }}
              >
                Cancelar
              </button>

              {editingEventId && (
                <button
                  onClick={deleteEvent}
                  style={{ ...buttonStyle, background: "#dc2626" }}
                >
                  Eliminar
                </button>
              )}

              <button
                onClick={saveEvent}
                disabled={saving}
                style={{ ...buttonStyle, background: "#2563eb", padding: "10px 16px" }}
              >
                {saving ? "Guardando..." : editingEventId ? "Guardar cambios" : "Crear evento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DayView({
  selectedDate,
  events,
  onCreate,
  onEdit,
}: {
  selectedDate: string;
  events: EventRow[];
  onCreate: (dateTime?: string) => void;
  onEdit: (event: EventRow) => void;
}) {
  const hours = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);
  const selected = new Date(`${selectedDate}T12:00:00`);
  const headerHeight = 48;
  const hourHeight = 72;
  const startHour = 8;
  const endHour = 21;

  const dayEvents = events.filter((ev) => {
    const d = new Date(ev.start_datetime);
    return (
      d.getFullYear() === selected.getFullYear() &&
      d.getMonth() === selected.getMonth() &&
      d.getDate() === selected.getDate()
    );
  });

  return (
    <div
      style={{
        border: "1px solid #284577",
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          background: "#0f1f3d",
          padding: 12,
          fontWeight: 700,
          borderBottom: "1px solid #284577",
        }}
      >
        {selected.toLocaleDateString("es-MX", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>

      {hours.map((hour) => (
        <div
          key={hour}
          onClick={() => onCreate(combineDateAndHour(selectedDate, hour))}
          style={{
            minHeight: hourHeight,
            display: "grid",
            gridTemplateColumns: "100px 1fr",
            borderBottom: "1px solid #284577",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              padding: "12px",
              background: "#102244",
              borderRight: "1px solid #284577",
              fontWeight: 700,
            }}
          >
            {hour}
          </div>
          <div />
        </div>
      ))}

      {dayEvents.map((ev) => {
        const start = new Date(ev.start_datetime);
        const end = ev.end_datetime ? new Date(ev.end_datetime) : new Date(start.getTime() + 60 * 60 * 1000);

        let startMinutes = (start.getHours() - startHour) * 60 + start.getMinutes();
        let endMinutes = (end.getHours() - startHour) * 60 + end.getMinutes();

        startMinutes = Math.max(startMinutes, 0);
        endMinutes = Math.min(endMinutes, (endHour - startHour) * 60);

        const durationMinutes = Math.max(endMinutes - startMinutes, 30);
        const top = headerHeight + (startMinutes / 60) * hourHeight;
        const height = (durationMinutes / 60) * hourHeight;

        return (
          <div
            key={ev.id}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(ev);
            }}
            style={{
              position: "absolute",
              top,
              left: 108,
              right: 8,
              height,
              background: ev.color || "#2563eb",
              borderRadius: 8,
              padding: "6px 10px",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
              overflow: "hidden",
            }}
          >
            <div style={{ fontWeight: 700 }}>{ev.title}</div>
            <div style={{ fontSize: 12, opacity: 0.95 }}>
              {start.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} -{" "}
              {end.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
            </div>
            {ev.location && <div style={{ fontSize: 12, marginTop: 4 }}>{ev.location}</div>}
          </div>
        );
      })}
    </div>
  );
}

function WeekView({
  selectedDate,
  events,
  onCreate,
  onEdit,
}: {
  selectedDate: string;
  events: EventRow[];
  onCreate: (dateTime?: string) => void;
  onEdit: (event: EventRow) => void;
}) {
  const base = new Date(`${selectedDate}T12:00:00`);
  const start = new Date(base);
  start.setDate(base.getDate() - ((base.getDay() + 6) % 7));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const hours = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);
  const hourHeight = 64;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "80px repeat(7, 1fr)",
        border: "1px solid #284577",
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div />

      {weekDays.map((day, i) => {
        const today = new Date();
        const isToday =
          day.getFullYear() === today.getFullYear() &&
          day.getMonth() === today.getMonth() &&
          day.getDate() === today.getDate();

        return (
          <div
            key={i}
            style={{
              background: isToday ? "#1d4ed8" : "#0f1f3d",
              padding: 10,
              textAlign: "center",
              fontWeight: 700,
              borderLeft: "1px solid #284577",
            }}
          >
            {day.toLocaleDateString("es-MX", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </div>
        );
      })}

      {hours.map((hour) => (
        <React.Fragment key={hour}>
          <div
            style={{
              borderTop: "1px solid #284577",
              padding: 8,
              fontSize: 12,
              color: "#9fb3d9",
            }}
          >
            {hour}
          </div>

          {weekDays.map((day, i) => {
            const dateISO = getLocalDateISO(day);

            return (
              <div
                key={`${hour}-${i}`}
                onClick={() => onCreate(combineDateAndHour(dateISO, hour))}
                style={{
                  borderTop: "1px solid #284577",
                  borderLeft: "1px solid #284577",
                  minHeight: hourHeight,
                  cursor: "pointer",
                }}
              />
            );
          })}
        </React.Fragment>
      ))}

      {events.map((ev) => {
        const start = new Date(ev.start_datetime);
        const end = ev.end_datetime ? new Date(ev.end_datetime) : new Date(start.getTime() + 60 * 60 * 1000);

        const dayIndex = weekDays.findIndex(
          (d) =>
            d.getFullYear() === start.getFullYear() &&
            d.getMonth() === start.getMonth() &&
            d.getDate() === start.getDate()
        );

        if (dayIndex === -1) return null;

        const startOffset = (start.getHours() - 8) * hourHeight + (start.getMinutes() / 60) * hourHeight;
        const durationMinutes = Math.max((end.getTime() - start.getTime()) / 60000, 30);
        const height = (durationMinutes / 60) * hourHeight;

        return (
          <div
            key={ev.id}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(ev);
            }}
            style={{
              position: "absolute",
              top: 42 + startOffset,
              left: `calc(80px + ${dayIndex} * ((100% - 80px) / 7) + 4px)`,
              width: `calc((100% - 80px) / 7 - 8px)`,
              height: Math.max(height, 24),
              background: ev.color || "#2563eb",
              borderRadius: 8,
              padding: "4px 6px",
              fontSize: 11,
              color: "#fff",
              cursor: "pointer",
              zIndex: 20,
              boxShadow: "0 3px 10px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            <div style={{ fontWeight: 700 }}>{ev.title}</div>
            <div>
              {start.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthView({
  selectedDate,
  events,
  onCreate,
  onEdit,
}: {
  selectedDate: string;
  events: EventRow[];
  onCreate: (dateTime?: string) => void;
  onEdit: (event: EventRow) => void;
}) {
  const base = new Date(`${selectedDate}T12:00:00`);
  const year = base.getFullYear();
  const month = base.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const days: { date: Date; currentMonth: boolean }[] = [];

  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      currentMonth: false,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      currentMonth: true,
    });
  }

  while (days.length < 42) {
    const d = days.length - daysInMonth - startDay + 1;
    days.push({
      date: new Date(year, month + 1, d),
      currentMonth: false,
    });
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        border: "1px solid #284577",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
        <div
          key={d}
          style={{
            background: "#0f1f3d",
            padding: 10,
            textAlign: "center",
            fontWeight: 700,
            borderBottom: "1px solid #284577",
            borderRight: "1px solid #284577",
          }}
        >
          {d}
        </div>
      ))}

      {days.map((day, i) => {
        const today = new Date();
        const isToday =
          day.date.getFullYear() === today.getFullYear() &&
          day.date.getMonth() === today.getMonth() &&
          day.date.getDate() === today.getDate();

        const dayEvents = events.filter((e) => {
          const d = new Date(e.start_datetime);
          return d.toDateString() === day.date.toDateString();
        });

        const dateISO = getLocalDateISO(day.date);

        return (
          <div
            key={i}
            onClick={() => onCreate(`${dateISO}T09:00`)}
            style={{
              minHeight: 140,
              padding: 6,
              borderTop: "1px solid #284577",
              borderRight: "1px solid #284577",
              background: day.currentMonth ? "#08142c" : "#0b1b3a",
              opacity: day.currentMonth ? 1 : 0.35,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                background: isToday ? "#2563eb" : "transparent",
                borderRadius: 6,
                display: "inline-block",
                padding: "3px 7px",
                marginBottom: 6,
                color: "#fff",
              }}
            >
              {day.date.getDate()}
            </div>

            {dayEvents.slice(0, 4).map((ev) => {
              const start = new Date(ev.start_datetime);
              const end = ev.end_datetime ? new Date(ev.end_datetime) : new Date(start.getTime() + 60 * 60 * 1000);
              const durationMin = Math.max((end.getTime() - start.getTime()) / 60000, 30);
              const hours = Math.floor(durationMin / 60);
              const mins = durationMin % 60;

              return (
                <div
                  key={ev.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(ev);
                  }}
                  style={{
                    background: ev.color || "#2563eb",
                    padding: "5px 7px",
                    borderRadius: 6,
                    marginBottom: 5,
                    fontSize: 11,
                    color: "#fff",
                    lineHeight: 1.2,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>
                    {start.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ev.title}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.85 }}>
                    {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
                  </div>
                </div>
              );
            })}

            {dayEvents.length > 4 && (
              <div style={{ fontSize: 10, opacity: 0.7 }}>
                +{dayEvents.length - 4} más
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function YearView({
  selectedDate,
  events,
  onCreate,
  onEdit,
}: {
  selectedDate: string;
  events: EventRow[];
  onCreate: (dateTime?: string) => void;
  onEdit: (event: EventRow) => void;
}) {
  const year = new Date(`${selectedDate}T12:00:00`).getFullYear();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
      }}
    >
      {Array.from({ length: 12 }).map((_, monthIndex) => {
        const firstDay = new Date(year, monthIndex, 1);
        const startDay = (firstDay.getDay() + 6) % 7;
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const prevMonthDays = new Date(year, monthIndex, 0).getDate();

        const days: { date: Date; currentMonth: boolean }[] = [];

        for (let i = startDay - 1; i >= 0; i--) {
          days.push({
            date: new Date(year, monthIndex - 1, prevMonthDays - i),
            currentMonth: false,
          });
        }

        for (let i = 1; i <= daysInMonth; i++) {
          days.push({
            date: new Date(year, monthIndex, i),
            currentMonth: true,
          });
        }

        while (days.length < 42) {
          const d = days.length - daysInMonth - startDay + 1;
          days.push({
            date: new Date(year, monthIndex + 1, d),
            currentMonth: false,
          });
        }

        return (
          <div
            key={monthIndex}
            style={{
              background: "#0f1f3d",
              padding: 10,
              borderRadius: 10,
            }}
          >
            <div
              style={{
                textAlign: "center",
                fontWeight: 700,
                marginBottom: 8,
                textTransform: "capitalize",
              }}
            >
              {new Date(year, monthIndex).toLocaleString("es-MX", {
                month: "long",
              })}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                fontSize: 10,
                marginBottom: 4,
                opacity: 0.7,
              }}
            >
              {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                <div key={d} style={{ textAlign: "center" }}>
                  {d}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 2,
              }}
            >
              {days.map((day, i) => {
                const today = new Date();
                const isToday =
                  day.date.getFullYear() === today.getFullYear() &&
                  day.date.getMonth() === today.getMonth() &&
                  day.date.getDate() === today.getDate();

                const hasEvents = events.some((ev) => {
                  const d = new Date(ev.start_datetime);
                  return (
                    d.getFullYear() === day.date.getFullYear() &&
                    d.getMonth() === day.date.getMonth() &&
                    d.getDate() === day.date.getDate()
                  );
                });

                return (
                  <div
                    key={i}
                    onClick={() => onCreate(`${getLocalDateISO(day.date)}T09:00`)}
                    style={{
                      padding: 4,
                      textAlign: "center",
                      borderRadius: 4,
                      cursor: "pointer",
                      background: isToday ? "#2563eb" : "#08142c",
                      opacity: day.currentMonth ? 1 : 0.3,
                      border: "1px solid #1e335c",
                      fontSize: 11,
                      position: "relative",
                    }}
                  >
                    <span>{day.date.getDate()}</span>

                    {hasEvents && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 2,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#60a5fa",
                        }}
                      />
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
