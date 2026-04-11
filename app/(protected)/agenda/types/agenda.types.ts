export type CalendarView = "day" | "week" | "month" | "year";

export interface CalendarEvent {
  id: string;
  company_id: string;
  title: string;
  description?: string | null;
  event_type?: string | null;
  start_datetime: string;
  end_datetime?: string | null;
  location?: string | null;
  meeting_link?: string | null;
  priority?: string | null;
  status?: string | null;
  color?: string | null;
  all_day?: boolean | null;
  visibility?: string | null;
  timezone?: string | null;
  created_by?: string | null;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id?: string | null;
  email?: string | null;
  attendee_type?: string | null;
  role?: string | null;
  status?: string | null;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role?: string | null;
}

export interface EventFormData {
  title: string;
  description: string;
  event_type: string;
  priority: string;
  status: string;
  color: string;
  location: string;
  meeting_link: string;
  start: string;
  end: string;
  all_day: boolean;
  visibility: string;
  internal_attendees: string[];
  external_emails: string;
}

export const DEFAULT_FORM: EventFormData = {
  title: "",
  description: "",
  event_type: "Reunión",
  priority: "Media",
  status: "Programado",
  color: "#274B97",
  location: "",
  meeting_link: "",
  start: "",
  end: "",
  all_day: false,
  visibility: "company",
  internal_attendees: [],
  external_emails: "",
};

export const EVENT_TYPES = ["Reunión", "Llamada", "Visita", "Seguimiento", "Operación", "Personal"];
export const PRIORITIES  = ["Baja", "Media", "Alta", "Crítica"];
export const STATUSES    = ["Programado", "Confirmado", "Completado", "Cancelado"];
export const VISIBILITIES = [
  { value: "company",  label: "Empresa" },
  { value: "team",     label: "Equipo" },
  { value: "private",  label: "Privado" },
];

export const HOURS_START = 7;
export const HOURS_END   = 21;
export const HOUR_HEIGHT = 64;
