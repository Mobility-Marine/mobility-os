"use client";

import React from "react";
import type { MemberAvailability } from "../hooks/useTeamAvailability";

interface TeamSidebarProps {
  availability: MemberAvailability[];
  loading: boolean;
  onScheduleWith: (userId: string) => void;
}

function Avatar({ userId, size = 32 }: { userId: string; size?: number }) {
  const colors = ["#274B97", "#1D9E75", "#BA7517", "#D4537E", "#534AB7"];
  const color = colors[userId.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color + "20", border: `1.5px solid ${color}40`,
      color, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {userId.charAt(0).toUpperCase()}
    </div>
  );
}

export default function TeamSidebar({ availability, loading, onScheduleWith }: TeamSidebarProps) {
  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "16px",
      boxShadow: "var(--shadow-sm)",
      display: "grid",
      gap: "14px",
      alignContent: "start",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
          Disponibilidad
        </div>
        <div style={{
          padding: "2px 8px", borderRadius: "var(--radius-full)",
          background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)",
          fontSize: "11px", fontWeight: 600, color: "var(--color-success-text)",
        }}>
          {availability.filter((a) => !a.isBusy).length} libres
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: "8px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-bg-subtle)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 10, background: "var(--color-bg-subtle)", borderRadius: 4, width: "60%", marginBottom: 4 }} />
                <div style={{ height: 8, background: "var(--color-bg-subtle)", borderRadius: 4, width: "40%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : availability.length === 0 ? (
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)", textAlign: "center", padding: "16px 0" }}>
          Sin miembros en el equipo
        </div>
      ) : (
        <div style={{ display: "grid", gap: "6px" }}>
          {availability.map(({ member, eventsToday, isBusy, nextFree }) => (
            <div
              key={member.id}
              style={{
                padding: "8px 10px",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${isBusy ? "var(--color-warning-border)" : "var(--color-border-faint)"}`,
                background: isBusy ? "var(--color-warning-bg)" : "var(--color-bg-subtle)",
                display: "grid", gap: "6px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ position: "relative" }}>
                  <Avatar userId={member.user_id} size={28} />
                  <span style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: "7px", height: "7px", borderRadius: "50%",
                    background: isBusy ? "var(--color-warning-text)" : "var(--color-success-text)",
                    border: "2px solid var(--color-bg-base)",
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {member.user_id.slice(0, 12)}…
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                    {member.role ?? "usuario"}
                  </div>
                </div>
                <div style={{
                  fontSize: "10px", fontWeight: 600,
                  color: isBusy ? "var(--color-warning-text)" : "var(--color-success-text)",
                }}>
                  {isBusy ? "Ocupado" : "Libre"}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                  {eventsToday.length} evento{eventsToday.length !== 1 ? "s" : ""} hoy
                  {nextFree ? ` · próx. ${nextFree}` : ""}
                </div>
                <button
                  onClick={() => onScheduleWith(member.user_id)}
                  style={{
                    fontSize: "10px", fontWeight: 600,
                    color: "var(--color-brand-blue)",
                    background: "var(--color-brand-blue-light)",
                    border: "none", borderRadius: "var(--radius-sm)",
                    padding: "3px 8px", cursor: "pointer",
                  }}
                >
                  Agendar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INTEGRACIONES */}
      <div style={{ borderTop: "1px solid var(--color-border-faint)", paddingTop: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "8px" }}>
          Calendarios externos
        </div>
        <div style={{ display: "grid", gap: "6px" }}>
          {[
            { name: "Google Calendar", color: "#4285F4", connected: false },
            { name: "Outlook",         color: "#0078D4", connected: false },
            { name: "Apple Calendar",  color: "#555555", connected: false },
          ].map((cal) => (
            <button
              key={cal.name}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "8px 10px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-faint)",
                background: cal.connected ? "var(--color-success-bg)" : "var(--color-bg-subtle)",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "var(--transition-fast)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = cal.color; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border-faint)"; }}
            >
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: cal.color, flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-second)", flex: 1 }}>
                {cal.name}
              </span>
              <span style={{
                fontSize: "10px", fontWeight: 600,
                color: cal.connected ? "var(--color-success-text)" : "var(--color-brand-orange)",
              }}>
                {cal.connected ? "Conectado" : "Conectar"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
