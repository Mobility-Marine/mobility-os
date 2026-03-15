import { supabase } from "@/lib/supabaseClient";

/* =========================================================
   📅 AGENDA SERVICE — Mobility OS
   Capa de acceso a datos para calendario multiempresa
   ========================================================= */

/* 🔹 Obtener eventos por empresa */
export async function getCalendarEventsByCompany(
  companyId: string,
  options?: { fromIso?: string; toIso?: string }
) {
  let query = supabase
    .from("calendar_events")
    .select("*")
    .eq("company_id", companyId)
    .order("start_datetime", { ascending: true });

  if (options?.fromIso) {
    query = query.gte("start_datetime", options.fromIso);
  }

  if (options?.toIso) {
    query = query.lte("start_datetime", options.toIso);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data;
}

/* 🔹 Obtener asistentes de evento */
export async function getCalendarEventAttendees(eventId: string) {
  const { data, error } = await supabase
    .from("calendar_event_attendees")
    .select("*")
    .eq("event_id", eventId);

  if (error) throw error;

  return data;
}

/* 🔹 Crear evento */
export async function createCalendarEvent(payload: any) {
  const { data, error } = await supabase
    .from("calendar_events")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;

  return data;
}

/* 🔹 Actualizar evento */
export async function updateCalendarEvent(id: string, payload: any) {
  const { error } = await supabase
    .from("calendar_events")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

/* 🔹 Eliminar evento */
export async function deleteCalendarEvent(id: string) {
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* =========================================================
   👥 ORGANIZACIÓN / MULTIEMPRESA
   ========================================================= */

/* 🔹 Obtener usuarios de la empresa */
export async function getCompanyUsers(companyId: string) {
  const { data, error } = await supabase
    .from("company_users")
    .select("id, company_id, user_id, role")
    .eq("company_id", companyId);

  if (error) throw error;

  return data;
}
