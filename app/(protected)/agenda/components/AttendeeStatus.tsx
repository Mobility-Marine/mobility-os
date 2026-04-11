"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getEventAttendees, updateAttendeeStatus } from "../services/attendees.service";

interface Attendee {
  id: string;
  user_id?: string;
  email?: string;
  attendee_type: string;
  status: string;
}

interface AttendeeStatusProps {
  eventId: string;
  currentUserId: string;
}

const STATUS_CONFIG = {
  pending:   { label: "Pendiente",  color: "var(--color-warning-text)",  bg: "var(--color-warning-bg)" },
  accepted:  { label: "Aceptado",   color: "var(--color-success-text)",  bg: "var(--color-success-bg)" },
  declined:  { label: "Rechazado",  color: "var(--color-danger-text)",   bg: "var(--color-danger-bg)" },
  tentative: { label: "Tentativo",  color: "var(--color-info-text)",     bg: "var(--color-info-bg)" },
};

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

export default function AttendeeStatus({ eventId, currentUserId }: AttendeeStatusProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    void load();
  }, [eventId]);

  async function load() {
    const data = await getEventAttendees(eventId);
    setAttendees(data as Attendee[]);
    const mine = (data as Attendee[]).find((a) => a.user_id === currentUserId);
    setMyStatus(mine?.status ?? null);
    setLoading(false);
  }

  async function respond(status: "accepted" | "declined" | "tentative") {
    setUpdating(true);
    await updateAttendeeStatus(eventId, currentUserId, status);
    setMyStatus(status);
    await load();
    setUpdating(false);
  }

  if (loading) return null;

  const accepted  = attendees.filter((a) => a.status === "accepted").length;
  const declined  = attendees.filter((a) => a.status === "declined").length;
  const pending   = attendees.filter((a) => a.status === "pending").length;
  const total     = attendees.length;

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {/* RESUMEN */}
      {total > 0 && (
        <div style={{
          display: "flex", gap: "8px", flexWrap: "wrap",
        }}>
          <div style={{
            padding: "4px 10px", borderRadius: "var(--radius-full)",
            background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)",
            fontSize: "11px", fontWeight: 600, color: "var(--color-success-text)",
            display: "flex", alignItems: "center", gap: "4px",
          }}>
            <CheckIcon /> {accepted} aceptaron
          </div>
          <div style={{
            padding: "4px 10px", borderRadius: "var(--radius-full)",
            background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
            fontSize: "11px", fontWeight: 600, color: "var(--color-danger-text)",
            display: "flex", alignItems: "center", gap: "4px",
          }}>
            <XIcon /> {declined} rechazaron
          </div>
          <div style={{
            padding: "4px 10px", borderRadius: "var(--radius-full)",
            background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)",
            fontSize: "11px", fontWeight: 600, color: "var(--color-warning-text)",
          }}>
            {pending} pendientes
          </div>
        </div>
      )}

      {/* LISTA DE ASISTENTES */}
      {attendees.length > 0 && (
        <div style={{ display: "grid", gap: "6px" }}>
          {attendees.map((a) => {
            const cfg = STATUS_CONFIG[a.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
            return (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "6px 10px", borderRadius: "var(--radius-md)",
                background: "var(--color-bg-subtle)",
                border: "1px solid var(--color-border-faint)",
              }}>
                <div style={{
                  width: "26px", height: "26px", borderRadius: "50%",
                  background: "var(--color-brand-blue-light)",
                  color: "var(--color-brand-blue)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 700, flexShrink: 0,
                }}>
                  {(a.user_id ?? a.email ?? "?").charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.email ?? `${a.user_id?.slice(0, 14)}…`}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                    {a.attendee_type === "internal" ? "Interno" : "Externo"}
                  </div>
                </div>
                <div style={{
                  padding: "2px 8px", borderRadius: "var(--radius-full)",
                  background: cfg.bg, color: cfg.color,
                  fontSize: "10px", fontWeight: 600,
                }}>
                  {cfg.label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MI RESPUESTA */}
      {myStatus !== null && (
        <div style={{
          padding: "12px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border-faint)",
          background: "var(--color-bg-subtle)",
        }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Tu respuesta
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {(["accepted", "tentative", "declined"] as const).map((s) => {
              const cfg = STATUS_CONFIG[s];
              const isActive = myStatus === s;
              return (
                <button
                  key={s}
                  onClick={() => respond(s)}
                  disabled={updating}
                  style={{
                    flex: 1, height: "32px",
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${isActive ? cfg.color : "var(--color-border-faint)"}`,
                    background: isActive ? cfg.bg : "transparent",
                    color: isActive ? cfg.color : "var(--color-text-muted)",
                    fontSize: "12px", fontWeight: isActive ? 600 : 400,
                    cursor: updating ? "not-allowed" : "pointer",
                    opacity: updating ? 0.5 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                    transition: "var(--transition-fast)",
                  }}
                >
                  {s === "accepted"  && <CheckIcon />}
                  {s === "declined"  && <XIcon />}
                  {s === "tentative" && <QuestionIcon />}
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
