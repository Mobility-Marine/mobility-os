import { supabase } from "@/lib/supabaseClient";

export interface AttendeePayload {
  event_id: string;
  user_id?: string;
  email?: string;
  attendee_type: "internal" | "external";
  role: "attendee" | "organizer";
  status: "pending" | "accepted" | "declined" | "tentative";
}

export async function insertAttendees(attendees: AttendeePayload[]) {
  if (attendees.length === 0) return;
  const { error } = await supabase
    .from("calendar_event_attendees")
    .insert(attendees);
  if (error) console.error("insertAttendees error:", error);
}

export async function updateAttendeeStatus(
  eventId: string,
  userId: string,
  status: "accepted" | "declined" | "tentative"
) {
  const { error } = await supabase
    .from("calendar_event_attendees")
    .update({ status } as any)
    .eq("event_id", eventId)
    .eq("user_id", userId);
  if (error) console.error("updateAttendeeStatus error:", error);
}

export async function getEventAttendees(eventId: string) {
  const { data } = await supabase
    .from("calendar_event_attendees")
    .select("*")
    .eq("event_id", eventId);
  return data ?? [];
}

export async function sendEventNotifications(payload: {
  eventId: string;
  eventTitle: string;
  companyId: string;
  organizerId: string;
  internalUserIds: string[];
  externalEmails: string[];
}) {
  const { eventId, eventTitle, companyId, organizerId, internalUserIds } = payload;
  if (internalUserIds.length === 0) return;

  const notifications = internalUserIds
    .filter((uid) => uid !== organizerId)
    .map((userId) => ({
      user_id:    userId,
      company_id: companyId,
      type:       "calendar_invitation",
      title:      `Invitación: ${eventTitle}`,
      message:    `Has sido invitado a un evento. Confirma tu asistencia.`,
      metadata:   JSON.stringify({ event_id: eventId, event_title: eventTitle }),
      read:       false,
    }));

  if (notifications.length === 0) return;

  const { error } = await supabase
    .from("notifications")
    .insert(notifications as any);

  if (error) console.error("sendEventNotifications error:", error);
}
