"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  getCalendarEventsByCompany,
  getCalendarEventAttendees,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/services/agenda/agenda.service";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { getCompanyUsers } from "@/services/agenda/agenda.service";

type CalendarView = "day" | "week" | "month" | "year";

type EventRow = {
  id: string;
  company_id: string | null;
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
  all_day?: boolean | null;
  visibility?: string | null;
  timezone?: string | null;
  created_by?: string | null;
};

type AttendeeRow = {
  id: string;
  event_id: string;
  user_id?: string | null;
  email?: string | null;
  attendee_type?: string | null;
  role?: string | null;
  status?: string | null;
};

type CompanyUserRow = {
  id: string;
  company_id: string;
  user_id: string;
  role: string | null;
};

const HOURS_START = 7;
const HOURS_END = 21;
const HOUR_HEIGHT = 72;

const UI = {
  bg: "#0b0f14",
  bgSoft: "#0f141b",
  bgSubtle: "#111827",
  bgMuted: "#0c1117",
  border: "#1f2937",
  borderSoft: "#273244",
  text: "#e5e7eb",
  textSoft: "#9ca3af",
  textMuted: "#94a3b8",
  accent: "#d1d5db",
  accentBg: "#111827",
  accentStrong: "#3b82f6",
  danger: "#b91c1c",
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

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getMonthGrid(selectedDate: string) {
  const base = new Date(selectedDate + "T12:00:00");
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

  return days;
}

function getHours() {
  const hours: string[] = [];
  for (let h = HOURS_START; h <= HOURS_END; h++) {
    hours.push(`${String(h).padStart(2, "0")}:00`);
  }
  return hours;
}

function getDayEvents(events: EventRow[], date: Date) {
  return events.filter((ev) => {
    const start = new Date(ev.start_datetime);
    return (
      start.getFullYear() === date.getFullYear() &&
      start.getMonth() === date.getMonth() &&
      start.getDate() === date.getDate()
    );
  });
}

function minutesFromStart(date: Date) {
  return (date.getHours() - HOURS_START) * 60 + date.getMinutes();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

// ===== HEADER TEMPORAL ENTERPRISE =====

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function renderTimeHeader(
  view: CalendarView,
  currentDate: Date
) {
  const d = new Date(currentDate);

  let label = "";

  if (view === "day") {
    label = d.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (view === "week") {
    const start = startOfWeek(d);
    const end = endOfWeek(d);

    label = `Semana ${getWeekNumber(d)} — ${start.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
    })} al ${end.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`;
  }

  if (view === "month") {
    label = d.toLocaleDateString("es-MX", {
      month: "long",
      year: "numeric",
    });
  }

  if (view === "year") {
    label = d.getFullYear().toString();
  }

  return (
    <div
      style={{
        fontSize: 22,
        fontWeight: 700,
        marginBottom: 12,
        color: "#e5e7eb",
      }}
    >
      {label}
    </div>
  );
}

function getYearMonths(selectedDate: string) {
  const base = new Date(selectedDate + "T12:00:00");
  const year = base.getFullYear();

  return Array.from({ length: 12 }).map((_, i) => {
    return new Date(year, i, 1);
  });
}

export default function Agenda() {
  const { user, loading } = useAuth();
  const { companyId, loadingTenant } = useTenant();
  const [status, setStatus] = useState("Cargando agenda...");
  const [view, setView] = useState<CalendarView>("week");
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getLocalDateISO());

  const [events, setEvents] = useState<EventRow[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [companyUsers, setCompanyUsers] = useState<CompanyUserRow[]>([]);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("Reunión");
  const [formPriority, setFormPriority] = useState("Media");
  const [formStatus, setFormStatus] = useState("Programado");
  const [formColor, setFormColor] = useState("#2563eb");
  const [formLocation, setFormLocation] = useState("");
  const [formMeetingLink, setFormMeetingLink] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formAllDay, setFormAllDay] = useState(false);
  const [formVisibility, setFormVisibility] = useState("company");

  const [internalAttendees, setInternalAttendees] = useState<string[]>([]);
  const [externalEmails, setExternalEmails] = useState("");
  const [loadedAttendees, setLoadedAttendees] = useState<AttendeeRow[]>([]);

  const currentDate = useMemo(
    () => new Date(selectedDate + "T12:00:00"),
    [selectedDate]
  );

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const yearMonths = useMemo(() => getYearMonths(selectedDate), [selectedDate]);

  useEffect(() => {
    initializeAgenda();
  }, [user, companyId]);

  useEffect(() => {
    if (companyId) {
      loadEvents();
      loadCompanyUsers();
    } else {
      setEvents([]);
      setCompanyUsers([]);
    }
  }, [companyId, selectedDate, view]);

  async function initializeAgenda() {
    try {
      setEventsLoading(true);

      if (!user) {
        setStatus("No hay usuario autenticado");
        return;
      }

      if (!companyId) {
        setStatus("Usuario sin empresa activa");
        setEvents([]);
        setCompanyUsers([]);
        return;
      }

      setAuthUserId(user.id);
      setStatus("Operativa");
    } catch (error) {
      console.error(error);
      setStatus("Error inicializando agenda");
    } finally {
      setEventsLoading(false);
    }
  }

  async function loadCompanyUsers() {
    if (!companyId) return;

    try {
      const data = await getCompanyUsers(companyId);
      setCompanyUsers((data as CompanyUserRow[]) || []);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadEvents() {
    if (!companyId) return;

    setEventsLoading(true);

    let fromDate = new Date(selectedDate + "T00:00:00");
    let toDate = new Date(selectedDate + "T23:59:59");

    if (view === "week") {
      fromDate = startOfWeek(currentDate);
      toDate = endOfWeek(currentDate);
    }

    if (view === "month") {
      const base = new Date(selectedDate + "T12:00:00");
      fromDate = new Date(base.getFullYear(), base.getMonth(), 1);
      toDate = new Date(
        base.getFullYear(),
        base.getMonth() + 1,
        0,
        23,
        59,
        59
      );
    }

    if (view === "year") {
      const base = new Date(selectedDate + "T12:00:00");
      fromDate = new Date(base.getFullYear(), 0, 1, 0, 0, 0);
      toDate = new Date(base.getFullYear(), 11, 31, 23, 59, 59);
    }

    try {
      const data = await getCalendarEventsByCompany(companyId, {
        fromIso: fromDate.toISOString(),
        toIso: toDate.toISOString(),
      });

      setEvents(data || []);
    } catch (error) {
      console.error(error);
      setStatus("Error cargando eventos");
    } finally {
      setEventsLoading(false);
    }
  }

  async function loadEventAttendees(eventId: string) {
    try {
      const attendees = await getCalendarEventAttendees(eventId);

      setLoadedAttendees(attendees || []);

      setInternalAttendees(
        attendees
          .filter((a) => a.attendee_type === "internal" && a.user_id)
          .map((a) => a.user_id as string)
      );

      setExternalEmails(
        attendees
          .filter((a) => a.attendee_type === "external" && a.email)
          .map((a) => a.email)
          .join(", ")
      );
    } catch (error) {
      console.error(error);
    }
  }

  function resetForm() {
    const now = new Date();
    const later = new Date(now);
    later.setHours(now.getHours() + 1);

    setSelectedEvent(null);
    setFormTitle("");
    setFormDescription("");
    setFormType("Reunión");
    setFormPriority("Media");
    setFormStatus("Programado");
    setFormColor("#2563eb");
    setFormLocation("");
    setFormMeetingLink("");
    setFormStart(formatDateTimeLocal(now));
    setFormEnd(formatDateTimeLocal(later));
    setFormAllDay(false);
    setFormVisibility("company");
    setInternalAttendees([]);
    setExternalEmails("");
    setLoadedAttendees([]);
  }

  function openNewEventModal(dateTime?: string) {
    resetForm();

    if (dateTime) {
      const start = new Date(dateTime);
      const end = new Date(start);
      end.setHours(start.getHours() + 1);
      setFormStart(formatDateTimeLocal(start));
      setFormEnd(formatDateTimeLocal(end));
    }

    setShowModal(true);
  }

  async function openEditEventModal(event: EventRow) {
    setSelectedEvent(event);
    setFormTitle(event.title || "");
    setFormDescription(event.description || "");
    setFormType(event.event_type || "Reunión");
    setFormPriority(event.priority || "Media");
    setFormStatus(event.status || "Programado");
    setFormColor(event.color || "#2563eb");
    setFormLocation(event.location || "");
    setFormMeetingLink(event.meeting_link || "");
    setFormStart(formatDateTimeLocal(new Date(event.start_datetime)));
    setFormEnd(
      formatDateTimeLocal(new Date(event.end_datetime || event.start_datetime))
    );
    setFormAllDay(Boolean(event.all_day));
    setFormVisibility(event.visibility || "company");
    await loadEventAttendees(event.id);
    setShowModal(true);
  }

  async function saveEvent() {
    if (!companyId || !authUserId) {
      alert("No hay empresa o usuario autenticado");
      return;
    }

    if (!formTitle || !formStart) {
      alert("Completa título e inicio");
      return;
    }

    const endDateTime = formEnd || formStart;

    const payload = {
      company_id: companyId,
      title: formTitle,
      description: formDescription || null,
      event_type: formType,
      start_datetime: new Date(formStart).toISOString(),
      end_datetime: new Date(endDateTime).toISOString(),
      location: formLocation || null,
      meeting_link: formMeetingLink || null,
      priority: formPriority,
      status: formStatus,
      color: formColor,
      all_day: formAllDay,
      visibility: formVisibility,
      timezone: "America/Mexico_City",
      created_by: authUserId,
    };

    let eventId = selectedEvent?.id || null;

    try {
      if (selectedEvent) {
        await updateCalendarEvent(selectedEvent.id, payload);
        eventId = selectedEvent.id;
      } else {
        const data = await createCalendarEvent(payload);
        eventId = data.id;
      }

      setShowModal(false);
      resetForm();
      loadEvents();
    } catch (err) {
      console.error(err);
      alert("Error guardando evento");
    }
  }

  async function deleteEvent() {
    if (!selectedEvent) return;

    const confirmed = confirm("¿Eliminar este evento?");
    if (!confirmed) return;

    try {
      await deleteCalendarEvent(selectedEvent.id);

      setShowModal(false);
      resetForm();
      loadEvents();
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar el evento");
    }
  }

  async function moveEvent(eventId: string, targetDate: Date) {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    const start = new Date(event.start_datetime);
    const end = new Date(event.end_datetime || event.start_datetime);
    const durationMs = end.getTime() - start.getTime();

    const newStart = new Date(targetDate);
    const newEnd = new Date(
      newStart.getTime() + Math.max(durationMs, 30 * 60000)
    );

    try {
      await updateCalendarEvent(eventId, {
        start_datetime: newStart.toISOString(),
        end_datetime: newEnd.toISOString(),
      });

      loadEvents();
    } catch (error) {
      console.error(error);
      alert("No se pudo mover el evento");
    }
  }

  function renderTopActions() {
    return (
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 18,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button onClick={() => openNewEventModal()} style={primaryButton}>
          Nuevo evento
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          {(["day", "week", "month", "year"] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                ...secondaryButton,
                background:
                  view === v ? UI.bgSubtle : "transparent",
                color: view === v ? UI.text : UI.textSoft,
                border:
                  view === v
                    ? `1px solid ${UI.borderSoft}`
                    : `1px solid ${UI.border}`,
              }}
            >
              {v === "day"
                ? "Día"
                : v === "week"
                ? "Semana"
                : v === "month"
                ? "Mes"
                : "Año"}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSelectedDate(getLocalDateISO())}
          style={secondaryButton}
        >
          Hoy
        </button>

        <button
          onClick={() => {
            const d = new Date(currentDate);
            if (view === "day") d.setDate(d.getDate() - 1);
            if (view === "week") d.setDate(d.getDate() - 7);
            if (view === "month") d.setMonth(d.getMonth() - 1);
            if (view === "year") d.setFullYear(d.getFullYear() - 1);
            setSelectedDate(getLocalDateISO(d));
          }}
          style={secondaryButton}
        >
          ◀
        </button>

        <button
          onClick={() => {
            const d = new Date(currentDate);
            if (view === "day") d.setDate(d.getDate() + 1);
            if (view === "week") d.setDate(d.getDate() + 7);
            if (view === "month") d.setMonth(d.getMonth() + 1);
            if (view === "year") d.setFullYear(d.getFullYear() + 1);
            setSelectedDate(getLocalDateISO(d));
          }}
          style={secondaryButton}
        >
          ▶
        </button>
      </div>
    );
  }

  function renderDayView() {
    const dayEvents = getDayEvents(events, currentDate);

    return (
      <div
        style={{
          border: `1px solid ${UI.border}`,
          borderRadius: 14,
          overflow: "hidden",
          position: "relative",
          background: UI.bg,
        }}
      >
        <div
          style={{
            padding: 14,
            fontWeight: 700,
            borderBottom: `1px solid ${UI.border}`,
            background: UI.bgSoft,
            color: UI.text,
          }}
        >
          {currentDate.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>

        {getHours().map((hour) => (
          <div
            key={hour}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const eventId = e.dataTransfer.getData("eventId");
              if (!eventId) return;
              const [h, m] = hour.split(":");
              const date = new Date(currentDate);
              date.setHours(Number(h), Number(m), 0, 0);
              moveEvent(eventId, date);
            }}
            onClick={() => {
              const [h, m] = hour.split(":");
              const date = new Date(currentDate);
              date.setHours(Number(h), Number(m), 0, 0);
              openNewEventModal(formatDateTimeLocal(date));
            }}
            style={{
              display: "grid",
              gridTemplateColumns: "90px 1fr",
              minHeight: HOUR_HEIGHT,
              borderBottom: `1px solid ${UI.border}`,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                padding: 12,
                background: UI.bgSoft,
                borderRight: `1px solid ${UI.border}`,
                fontWeight: 700,
                color: UI.textSoft,
              }}
            >
              {hour}
            </div>
            <div />
          </div>
        ))}

        {dayEvents.map((ev) => {
          const start = new Date(ev.start_datetime);
          const end = new Date(ev.end_datetime || ev.start_datetime);

          const startMin = clamp(
            minutesFromStart(start),
            0,
            (HOURS_END - HOURS_START + 1) * 60
          );
          const endMin = clamp(
            minutesFromStart(end),
            30,
            (HOURS_END - HOURS_START + 1) * 60
          );

          const top = 49 + (startMin / 60) * HOUR_HEIGHT;
          const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 30);

          return (
            <div
              key={ev.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("eventId", ev.id)}
              onClick={(e) => {
                e.stopPropagation();
                openEditEventModal(ev);
              }}
              style={{
                position: "absolute",
                top,
                left: 96,
                right: 10,
                height,
                background: ev.color || "#2563eb",
                borderRadius: 8,
                padding: "6px 10px",
                color: "#fff",
                cursor: "grab",
                boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                overflow: "hidden",
              }}
            >
              <div style={{ fontWeight: 700 }}>{ev.title}</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                {start.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                -{" "}
                {end.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderWeekView() {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "80px repeat(7, 1fr)",
          border: `1px solid ${UI.border}`,
          borderRadius: 14,
          overflow: "hidden",
          background: UI.bg,
          position: "relative",
        }}
      >
        <div style={{ background: UI.bgSoft }} />

        {weekDays.map((day, i) => {
          const isToday =
            getLocalDateISO(day) === getLocalDateISO(new Date());

          return (
            <div
              key={i}
              style={{
                padding: 10,
                textAlign: "center",
                fontWeight: 700,
                background: isToday ? UI.bgSubtle : UI.bgSoft,
                color: UI.text,
                borderLeft: `1px solid ${UI.border}`,
              }}
            >
           {day.toLocaleDateString("es-MX", { weekday: "short" })}
            </div>
          );
        })}

        {getHours().map((hour) => (
          <React.Fragment key={hour}>
            <div
              style={{
                borderTop: `1px solid ${UI.border}`,
                padding: 8,
                fontSize: 12,
                background: UI.bgSoft,
                color: UI.textSoft,
              }}
            >
              {hour}
            </div>

            {weekDays.map((day, i) => (
              <div
                key={i}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const eventId = e.dataTransfer.getData("eventId");
                  if (!eventId) return;
                  const [h, m] = hour.split(":");
                  const date = new Date(day);
                  date.setHours(Number(h), Number(m), 0, 0);
                  moveEvent(eventId, date);
                }}
                onClick={() => {
                  const [h, m] = hour.split(":");
                  const date = new Date(day);
                  date.setHours(Number(h), Number(m), 0, 0);
                  openNewEventModal(formatDateTimeLocal(date));
                }}
                style={{
                  minHeight: 58,
                  borderTop: `1px solid ${UI.border}`,
                  borderLeft: `1px solid ${UI.border}`,
                  cursor: "pointer",
                }}
              />
            ))}
          </React.Fragment>
        ))}

        {events.map((ev) => {
          const start = new Date(ev.start_datetime);
          const end = new Date(ev.end_datetime || ev.start_datetime);

          const dayIndex = weekDays.findIndex(
            (d) =>
              d.getFullYear() === start.getFullYear() &&
              d.getMonth() === start.getMonth() &&
              d.getDate() === start.getDate()
          );

          if (dayIndex === -1) return null;

          const startMin = clamp(
            minutesFromStart(start),
            0,
            (HOURS_END - HOURS_START + 1) * 60
          );
          const endMin = clamp(
            minutesFromStart(end),
            30,
            (HOURS_END - HOURS_START + 1) * 60
          );

          const top = 42 + (startMin / 60) * 58;
          const height = Math.max(((endMin - startMin) / 60) * 58, 26);

          return (
            <div
              key={ev.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("eventId", ev.id)}
              onClick={() => openEditEventModal(ev)}
              style={{
                position: "absolute",
                top,
                left: `calc(80px + ${dayIndex} * ((100% - 80px) / 7) + 4px)`,
                width: `calc((100% - 80px) / 7 - 8px)`,
                height,
                background: ev.color || "#2563eb",
                borderRadius: 8,
                padding: "4px 6px",
                fontSize: 11,
                color: "#fff",
                cursor: "grab",
                boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                overflow: "hidden",
              }}
            >
              <div style={{ fontWeight: 700 }}>{ev.title}</div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderMonthView() {
    const monthDays = getMonthGrid(selectedDate);

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          border: `1px solid ${UI.border}`,
          borderRadius: 14,
          overflow: "hidden",
          background: UI.bg,
        }}
      >
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <div
            key={d}
            style={{
              padding: 12,
              textAlign: "center",
              fontWeight: 700,
              background: UI.bgSoft,
              color: UI.text,
              borderBottom: `1px solid ${UI.border}`,
              borderRight: `1px solid ${UI.border}`,
            }}
          >
            {d}
          </div>
        ))}

        {monthDays.map((day, i) => {
          const isToday =
            getLocalDateISO(day.date) === getLocalDateISO(new Date());
          const dayEvents = getDayEvents(events, day.date);

          return (
            <div
              key={i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const eventId = e.dataTransfer.getData("eventId");
                if (!eventId) return;
                const d = new Date(day.date);
                d.setHours(9, 0, 0, 0);
                moveEvent(eventId, d);
              }}
              onClick={() => {
                const d = new Date(day.date);
                d.setHours(9, 0, 0, 0);
                openNewEventModal(formatDateTimeLocal(d));
              }}
              style={{
                minHeight: 150,
                padding: 8,
                borderTop: `1px solid ${UI.border}`,
                borderRight: `1px solid ${UI.border}`,
                background: day.currentMonth ? UI.bg : UI.bgMuted,
                opacity: day.currentMonth ? 1 : 0.45,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "3px 8px",
                  borderRadius: 8,
                  background: isToday ? UI.bgSubtle : "transparent",
                  color: UI.text,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                {day.date.getDate()}
              </div>

              {dayEvents.slice(0, 4).map((ev) => {
                const start = new Date(ev.start_datetime);
                const end = new Date(ev.end_datetime || ev.start_datetime);

                return (
                  <div
                    key={ev.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("eventId", ev.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditEventModal(ev);
                    }}
                    style={{
                      background: ev.color || "#2563eb",
                      color: "#fff",
                      borderRadius: 6,
                      padding: "4px 6px",
                      marginBottom: 4,
                      fontSize: 11,
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>
                      {start.toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {ev.title}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.9 }}>
                      {Math.max(
                        Math.round((end.getTime() - start.getTime()) / 60000),
                        30
                      )}{" "}
                      min
                    </div>
                  </div>
                );
              })}

              {dayEvents.length > 4 && (
                <div style={{ fontSize: 11, color: UI.textSoft }}>
                  +{dayEvents.length - 4} más
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderYearView() {
  const year = currentDate.getFullYear();

  const months = Array.from({ length: 12 }).map((_, i) => {
    const date = new Date(year, i, 1);
    const grid = getMonthGrid(getLocalDateISO(date));

    return { date, grid };
  });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
      }}
    >
      {months.map(({ date, grid }) => (
        <div
          key={date.toISOString()}
          onClick={() => {
            setSelectedDate(getLocalDateISO(date));
            setView("month");
          }}
          style={{
            border: "1px solid #1f2937",
            borderRadius: 12,
            padding: 12,
            background: "#0b1220",
            cursor: "pointer",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            {date.toLocaleDateString("es-MX", { month: "long" })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 2,
              fontSize: 11,
            }}
          >
            {grid.map((d, i) => (
              <div
                key={i}
                style={{
                  padding: 4,
                  textAlign: "center",
                  opacity: d.currentMonth ? 1 : 0.3,
                }}
              >
                {d.date.getDate()}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 32, color: UI.text }}>
          Programación
        </h2>
        <p style={{ color: UI.textSoft, marginTop: 8 }}>
          Planificación operativa multiempresa
        </p>
      </div>

      <div
        style={{
          background: UI.bgSoft,
          border: `1px solid ${UI.border}`,
          padding: "12px 14px",
          borderRadius: 12,
          color: UI.textSoft,
          fontSize: 14,
        }}
      >
        {status}
      </div>

      {renderTopActions()}

      {renderTimeHeader(view, currentDate)}
      
      {loading || loadingTenant || eventsLoading ? (
        <div style={panelStyle}>Cargando programación...</div>
      ) : !companyId ? (
        <div style={panelStyle}>No hay empresa activa seleccionada.</div>
      ) : (
        <>
          {view === "day" && renderDayView()}
          {view === "week" && renderWeekView()}
          {view === "month" && renderMonthView()}
          {view === "year" && renderYearView()}
        </>
      )}

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5000,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 760,
              maxHeight: "92vh",
              overflowY: "auto",
              background: UI.bg,
              border: `1px solid ${UI.border}`,
              borderRadius: 16,
              padding: 22,
              boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
              color: UI.text,
            }}
          >
            <h3 style={{ marginTop: 0, color: UI.text }}>
              {selectedEvent ? "Editar evento" : "Nuevo evento"}
            </h3>

            <div style={formGrid}>
              <input
                placeholder="Título"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                style={inputStyle}
              />

              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                style={inputStyle}
              >
                <option>Reunión</option>
                <option>Llamada</option>
                <option>Visita</option>
                <option>Seguimiento</option>
                <option>Operación</option>
                <option>Personal</option>
              </select>

              <textarea
                placeholder="Descripción"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                style={{
                  ...inputStyle,
                  minHeight: 90,
                  gridColumn: "1 / -1",
                  resize: "vertical",
                }}
              />

              <input
                type="datetime-local"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                style={inputStyle}
              />

              <input
                type="datetime-local"
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
                style={inputStyle}
              />

              <input
                placeholder="Ubicación"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                style={inputStyle}
              />

              <input
                placeholder="Meeting link"
                value={formMeetingLink}
                onChange={(e) => setFormMeetingLink(e.target.value)}
                style={inputStyle}
              />

              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
                style={inputStyle}
              >
                <option>Baja</option>
                <option>Media</option>
                <option>Alta</option>
                <option>Crítica</option>
              </select>

              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                style={inputStyle}
              >
                <option>Programado</option>
                <option>Confirmado</option>
                <option>Completado</option>
                <option>Cancelado</option>
              </select>

              <select
                value={formVisibility}
                onChange={(e) => setFormVisibility(e.target.value)}
                style={inputStyle}
              >
                <option value="company">Empresa</option>
                <option value="private">Privado</option>
                <option value="team">Equipo</option>
              </select>

              <div
                style={{
                  ...inputStyle,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <label>Color</label>
                <input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  style={{
                    width: 44,
                    height: 30,
                    border: "none",
                    background: "transparent",
                  }}
                />
              </div>

              <div
                style={{
                  ...inputStyle,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <input
                  id="all-day"
                  type="checkbox"
                  checked={formAllDay}
                  onChange={(e) => setFormAllDay(e.target.checked)}
                />
                <label htmlFor="all-day">Todo el día</label>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Invitados internos</label>
                <select
                  multiple
                  value={internalAttendees}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions).map(
                      (o) => o.value
                    );
                    setInternalAttendees(values);
                  }}
                  style={{ ...inputStyle, minHeight: 120 }}
                >
                  {companyUsers.map((u) => (
                    <option key={u.id} value={u.user_id}>
                      {u.user_id} {u.role ? `— ${u.role}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Invitados externos</label>
                <input
                  placeholder="correo1@empresa.com, correo2@empresa.com"
                  value={externalEmails}
                  onChange={(e) => setExternalEmails(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {selectedEvent && loadedAttendees.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <h4 style={{ marginBottom: 8, color: UI.text }}>
                  Invitados cargados
                </h4>
                <div style={{ display: "grid", gap: 8 }}>
                  {loadedAttendees.map((a) => (
                    <div key={a.id} style={miniCardStyle}>
                      {a.email || a.user_id || "Invitado"} — {a.attendee_type} —{" "}
                      {a.status}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 22,
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={secondaryButton}
              >
                Cancelar
              </button>

              {selectedEvent && (
                <button
                  onClick={deleteEvent}
                  style={{
                    ...secondaryButton,
                    background: UI.danger,
                    border: `1px solid ${UI.danger}`,
                    color: "#fff",
                  }}
                >
                  Eliminar
                </button>
              )}

              <button onClick={saveEvent} style={primaryButton}>
                {selectedEvent ? "Guardar cambios" : "Crear evento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: UI.bgSoft,
  border: `1px solid ${UI.border}`,
  borderRadius: 16,
  padding: 20,
  color: UI.text,
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: UI.bgMuted,
  color: UI.text,
  border: `1px solid ${UI.borderSoft}`,
  borderRadius: 10,
  padding: "12px 14px",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 8,
  color: UI.textSoft,
  fontSize: 13,
};

const primaryButton: React.CSSProperties = {
  background: UI.text,
  color: "#0b0f14",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButton: React.CSSProperties = {
  background: "transparent",
  color: UI.text,
  border: `1px solid ${UI.borderSoft}`,
  borderRadius: 10,
  padding: "10px 16px",
  cursor: "pointer",
};

const miniCardStyle: React.CSSProperties = {
  background: UI.bgSoft,
  border: `1px solid ${UI.border}`,
  borderRadius: 10,
  padding: "10px 12px",
  color: UI.text,
};
