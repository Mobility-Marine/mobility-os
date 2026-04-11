"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { CalendarEvent, CompanyMember } from "../types/agenda.types";

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

function endOfWeek(date: Date) {
  const s = startOfWeek(date);
  s.setDate(s.getDate() + 6);
  s.setHours(23, 59, 59, 999);
  return s;
}

export function useAgenda() {
  const { user } = useAuth();
  const { companyId } = useTenant();

  const [selectedDate, setSelectedDate] = useState(getLocalDateISO());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!companyId) return;
    void loadAll();
    setupRealtime();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [companyId, selectedDate]);

  function setupRealtime() {
    if (!companyId) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel(`agenda-${companyId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "calendar_events",
        filter: `company_id=eq.${companyId}`,
      }, () => void loadEvents())
      .subscribe();
    channelRef.current = channel;
  }

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadEvents(), loadMembers()]);
    setLoading(false);
  }

  async function loadEvents() {
    if (!companyId) return;
    const base = new Date(selectedDate + "T12:00:00");
    const from = startOfWeek(base);
    const to   = endOfWeek(base);
    // Extend range for month view coverage
    from.setDate(from.getDate() - 7);
    to.setDate(to.getDate() + 14);

    const { data } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("company_id", companyId)
      .gte("start_datetime", from.toISOString())
      .lte("start_datetime", to.toISOString())
      .order("start_datetime", { ascending: true });

    setEvents(data ?? []);
  }

  async function loadMembers() {
    if (!companyId) return;
    const { data } = await supabase
      .from("company_users")
      .select("id, company_id, user_id, role")
      .eq("company_id", companyId)
      .eq("is_active", true);
    setMembers(data ?? []);
  }

  async function createEvent(payload: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    const { data, error } = await supabase
      .from("calendar_events")
      .insert({ ...payload, company_id: companyId, created_by: user?.id })
      .select()
      .single();
    if (error) { console.error(error); return null; }
    await loadEvents();
    return data;
  }

  async function updateEvent(id: string, payload: Partial<CalendarEvent>): Promise<boolean> {
    const { error } = await supabase
      .from("calendar_events")
      .update(payload)
      .eq("id", id);
    if (error) { console.error(error); return false; }
    await loadEvents();
    return true;
  }

  async function deleteEvent(id: string): Promise<boolean> {
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error) { console.error(error); return false; }
    await loadEvents();
    return true;
  }

  async function moveEvent(eventId: string, newStart: Date) {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;
    const duration = new Date(ev.end_datetime ?? ev.start_datetime).getTime()
      - new Date(ev.start_datetime).getTime();
    const newEnd = new Date(newStart.getTime() + Math.max(duration, 30 * 60000));
    await updateEvent(eventId, {
      start_datetime: newStart.toISOString(),
      end_datetime:   newEnd.toISOString(),
    });
  }

  return {
    user, companyId,
    selectedDate, setSelectedDate,
    events, members, loading,
    createEvent, updateEvent, deleteEvent, moveEvent,
    reload: loadAll,
    getLocalDateISO,
    startOfWeek,
    endOfWeek,
  };
}
