"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { CalendarEvent, CompanyMember } from "../types/agenda.types";

export interface MemberAvailability {
  member: CompanyMember;
  email?: string;
  eventsToday: CalendarEvent[];
  isBusy: boolean;
  nextFree?: string;
}

export function useTeamAvailability(
  members: CompanyMember[],
  companyId: string | null,
  selectedDate: string
) {
  const [availability, setAvailability] = useState<MemberAvailability[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId || members.length === 0) return;
    void load();
  }, [members, companyId, selectedDate]);

  async function load() {
    setLoading(true);
    const from = new Date(selectedDate + "T00:00:00").toISOString();
    const to   = new Date(selectedDate + "T23:59:59").toISOString();

    const { data: allEvents } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("company_id", companyId)
      .gte("start_datetime", from)
      .lte("start_datetime", to);

    const result: MemberAvailability[] = members.map((member) => {
      const memberEvents = (allEvents ?? []).filter((ev: CalendarEvent) =>
        ev.created_by === member.user_id
      );

      const now = new Date();
      const isBusy = memberEvents.some((ev: CalendarEvent) => {
        const s = new Date(ev.start_datetime);
        const e = new Date(ev.end_datetime ?? ev.start_datetime);
        return s <= now && e >= now;
      });

      const upcoming = memberEvents
        .filter((ev: CalendarEvent) => new Date(ev.start_datetime) > now)
        .sort((a: CalendarEvent, b: CalendarEvent) =>
          new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
        );

      return {
        member,
        eventsToday: memberEvents,
        isBusy,
        nextFree: upcoming[0]
          ? new Date(upcoming[0].start_datetime).toLocaleTimeString("es-MX", {
              hour: "2-digit", minute: "2-digit",
            })
          : undefined,
      };
    });

    setAvailability(result);
    setLoading(false);
  }

  return { availability, loading, reload: load };
}
