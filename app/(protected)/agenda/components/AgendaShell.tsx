"use client";

import React, { useMemo, useState } from "react";
import { CalendarView, CalendarEvent } from "../types/agenda.types";
import { useAgenda } from "../hooks/useAgenda";
import { useTeamAvailability } from "../hooks/useTeamAvailability";
import { useModuleEvents } from "../hooks/useModuleEvents";
import { isModuleEvent } from "@/services/agenda/module-events.service";
import { useTranslation } from "@/lib/i18n/useTranslation";
import AgendaHeader from "./AgendaHeader";
import WeekView from "./WeekView";
import DayView from "./DayView";
import MonthView from "./MonthView";
import YearView from "./YearView";
import TeamSidebar from "./TeamSidebar";
import EventModal from "./EventModal";

function getLocalDateISO(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function AgendaShell() {
  const agenda = useAgenda();
  const { t }  = useTranslation();
  const {
    user, companyId, selectedDate, setSelectedDate,
    events, members, loading,
    createEvent, updateEvent, deleteEvent, moveEvent,
  } = agenda;

  const [view, setView]                           = useState<CalendarView>("week");
  const [modalOpen, setModalOpen]                 = useState(false);
  const [editingEvent, setEditingEvent]           = useState<CalendarEvent | null>(null);
  const [slotDateTime, setSlotDateTime]           = useState<string | undefined>();
  const [prefilledAttendee, setPrefilledAttendee] = useState<string | undefined>();

  const { availability } = useTeamAvailability(members, companyId, selectedDate);
  const { syncing }      = useModuleEvents(companyId);

  const currentDate = useMemo(() => new Date(selectedDate + "T12:00:00"), [selectedDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  function navigate(dir: "prev" | "next" | "today") {
    if (dir === "today") { setSelectedDate(getLocalDateISO()); return; }
    const d     = new Date(currentDate);
    const delta = dir === "prev" ? -1 : 1;
    if (view === "day")   d.setDate(d.getDate()         + delta);
    if (view === "week")  d.setDate(d.getDate()         + delta * 7);
    if (view === "month") d.setMonth(d.getMonth()       + delta);
    if (view === "year")  d.setFullYear(d.getFullYear() + delta);
    setSelectedDate(getLocalDateISO(d));
  }

  function openNewEvent(dateTime?: string, attendee?: string) {
    setEditingEvent(null);
    setSlotDateTime(dateTime);
    setPrefilledAttendee(attendee);
    setModalOpen(true);
  }

  function openEditEvent(ev: CalendarEvent) {
    if (isModuleEvent(ev.event_type)) return;
    setEditingEvent(ev);
    setSlotDateTime(undefined);
    setPrefilledAttendee(undefined);
    setModalOpen(true);
  }

  async function handleSave(payload: Partial<CalendarEvent>, form?: any) {
    if (editingEvent) {
      await agenda.updateEvent(editingEvent.id, payload);
    } else {
      await agenda.createEvent(
        payload,
        form?.internal_attendees ?? [],
        form?.external_emails
          ? form.external_emails.split(",").map((e: string) => e.trim()).filter(Boolean)
          : []
      );
    }
    setModalOpen(false);
  }

  async function handleDelete() {
    if (!editingEvent) return;
    await deleteEvent(editingEvent.id);
    setModalOpen(false);
  }

  return (
    <div style={{ display: "grid", gap: "16px" }}>

      <div>
        <AgendaHeader
          view={view}
          onViewChange={setView}
          selectedDate={selectedDate}
          onNavigate={navigate}
          onNewEvent={() => openNewEvent()}
        />
        {syncing && (
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            fontSize: "11px", color: "var(--color-text-muted)",
            marginTop: "6px",
          }}>
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: "var(--color-brand-blue)", opacity: 0.7,
            }} />
            {t.agenda.syncingModules}
          </div>
        )}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 260px",
        gap: "16px", alignItems: "start",
      }}>
        <div>
          {loading ? (
            <div style={{
              background: "var(--color-bg-base)",
              border: "1px solid var(--color-border-faint)",
              borderRadius: "var(--radius-lg)",
              padding: "40px", textAlign: "center",
              color: "var(--color-text-muted)", fontSize: "13px",
            }}>
              {t.agenda.loading}
            </div>
          ) : (
            <>
              {view === "week" && <WeekView weekDays={weekDays} events={events} selectedDate={selectedDate} onEventClick={openEditEvent} onSlotClick={(dt) => openNewEvent(dt)} onEventDrop={moveEvent} />}
              {view === "day"  && <DayView  currentDate={currentDate} events={events} onEventClick={openEditEvent} onSlotClick={(dt) => openNewEvent(dt)} onEventDrop={moveEvent} />}
              {view === "month" && <MonthView selectedDate={selectedDate} events={events} onEventClick={openEditEvent} onSlotClick={(dt) => openNewEvent(dt)} onEventDrop={moveEvent} />}
              {view === "year"  && <YearView  selectedDate={selectedDate} events={events} onMonthClick={(dateStr) => { setSelectedDate(dateStr); setView("month"); }} />}
            </>
          )}
        </div>

        <TeamSidebar
          availability={availability}
          loading={loading}
          onScheduleWith={(userId) => openNewEvent(undefined, userId)}
        />
      </div>

      {modalOpen && companyId && user && (
        <EventModal
          event={editingEvent}
          initialDateTime={slotDateTime}
          prefilledAttendee={prefilledAttendee}
          members={members}
          companyId={companyId}
          userId={user.id}
          onSave={handleSave}
          onDelete={editingEvent ? handleDelete : undefined}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
