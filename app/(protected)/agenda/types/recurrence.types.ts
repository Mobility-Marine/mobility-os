export type RecurrenceFrequency = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type RecurrenceEnd = "never" | "date" | "count";

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval: number;
  days_of_week?: number[];
  end_type: RecurrenceEnd;
  end_date?: string;
  end_count?: number;
}

export const DEFAULT_RECURRENCE: RecurrenceConfig = {
  frequency:  "none",
  interval:   1,
  end_type:   "never",
};

export type ReminderUnit = "minutes" | "hours" | "days";

export interface ReminderConfig {
  value: number;
  unit: ReminderUnit;
}

export const REMINDER_PRESETS: { label: string; value: number; unit: ReminderUnit }[] = [
  { label: "5 min antes",   value: 5,   unit: "minutes" },
  { label: "15 min antes",  value: 15,  unit: "minutes" },
  { label: "30 min antes",  value: 30,  unit: "minutes" },
  { label: "1 hora antes",  value: 1,   unit: "hours"   },
  { label: "2 horas antes", value: 2,   unit: "hours"   },
  { label: "1 día antes",   value: 1,   unit: "days"    },
  { label: "2 días antes",  value: 2,   unit: "days"    },
];

export const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  none:    "Sin repetición",
  daily:   "Diario",
  weekly:  "Semanal",
  monthly: "Mensual",
  yearly:  "Anual",
};

export const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
