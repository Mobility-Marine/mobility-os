import { supabase } from "@/lib/supabaseClient";
import type { ReminderConfig } from "../types/recurrence.types";

export async function saveReminders(eventId: string, reminders: ReminderConfig[]) {
  await supabase
    .from("calendar_event_reminders")
    .delete()
    .eq("event_id", eventId);

  if (reminders.length === 0) return;

  const rows = reminders.map((r) => ({
    event_id:        eventId,
    minutes_before:  toMinutes(r),
    reminder_type:   "notification",
    is_sent:         false,
  }));

  const { error } = await supabase
    .from("calendar_event_reminders")
    .insert(rows as any);

  if (error) console.error("saveReminders error:", error);
}

export async function saveRecurrence(eventId: string, config: import("../types/recurrence.types").RecurrenceConfig) {
  if (config.frequency === "none") {
    await supabase.from("calendar_event_recurrence").delete().eq("event_id", eventId);
    return;
  }

  await supabase.from("calendar_event_recurrence").upsert({
    event_id:     eventId,
    frequency:    config.frequency,
    interval:     config.interval,
    days_of_week: config.days_of_week ? JSON.stringify(config.days_of_week) : null,
    end_type:     config.end_type,
    end_date:     config.end_date ?? null,
    end_count:    config.end_count ?? null,
  } as any);
}

export async function getReminders(eventId: string): Promise<ReminderConfig[]> {
  const { data } = await supabase
    .from("calendar_event_reminders")
    .select("minutes_before")
    .eq("event_id", eventId);

  return (data ?? []).map((r: any) => fromMinutes(r.minutes_before));
}

export async function getRecurrence(eventId: string) {
  const { data } = await supabase
    .from("calendar_event_recurrence")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();
  return data;
}

export async function checkAndSendReminders(companyId: string) {
  const now = new Date();
  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, title, start_datetime, created_by, company_id")
    .eq("company_id", companyId)
    .gte("start_datetime", now.toISOString());

  if (!events) return;

  for (const event of events) {
    const { data: reminders } = await supabase
      .from("calendar_event_reminders")
      .select("*")
      .eq("event_id", event.id)
      .eq("is_sent", false);

    if (!reminders) continue;

    for (const reminder of reminders) {
      const eventStart   = new Date(event.start_datetime);
      const reminderTime = new Date(eventStart.getTime() - reminder.minutes_before * 60000);

      if (reminderTime <= now) {
        await supabase.from("notifications").insert({
          user_id:    event.created_by,
          company_id: event.company_id,
          type:       "reminder",
          title:      `Recordatorio: ${event.title}`,
          message:    `El evento comienza en ${reminder.minutes_before} minutos`,
          read:       false,
        } as any);

        await supabase
          .from("calendar_event_reminders")
          .update({ is_sent: true } as any)
          .eq("id", reminder.id);
      }
    }
  }
}

function toMinutes(r: ReminderConfig): number {
  if (r.unit === "minutes") return r.value;
  if (r.unit === "hours")   return r.value * 60;
  if (r.unit === "days")    return r.value * 1440;
  return r.value;
}

function fromMinutes(minutes: number): ReminderConfig {
  if (minutes % 1440 === 0) return { value: minutes / 1440, unit: "days" };
  if (minutes % 60   === 0) return { value: minutes / 60,   unit: "hours" };
  return { value: minutes, unit: "minutes" };
}
