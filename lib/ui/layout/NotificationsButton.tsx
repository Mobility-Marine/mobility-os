"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth/AuthProvider";
import { updateAttendeeStatus } from "@/app/(protected)/agenda/services/attendees.service";

interface Notification {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  read?: boolean;
  metadata?: string;
  created_at: string;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function BellIcon({ hasUnread }: { hasUnread: boolean }) {
  return (
    <div style={{ position: "relative" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      {hasUnread && (
        <span style={{
          position: "absolute", top: "-3px", right: "-3px",
          width: "8px", height: "8px", borderRadius: "50%",
          background: "var(--color-brand-orange)",
          border: "2px solid var(--color-bg-base)",
        }} />
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function getTypeColor(type?: string): string {
  if (!type) return "var(--color-text-muted)";
  if (type === "calendar_invitation") return "var(--color-brand-blue)";
  if (type.includes("danger") || type.includes("alert")) return "var(--color-danger-text)";
  if (type.includes("warning")) return "var(--color-warning-text)";
  if (type.includes("success")) return "var(--color-success-text)";
  return "var(--color-brand-blue)";
}

function CalendarInviteActions({
  notif,
  userId,
  onResponded,
}: {
  notif: Notification;
  userId: string;
  onResponded: () => void;
}) {
  const [responding, setResponding] = useState(false);
  const [responded, setResponded] = useState<string | null>(null);

  let eventId: string | null = null;
  try {
    if (notif.metadata) {
      const meta = JSON.parse(notif.metadata);
      eventId = meta.event_id ?? null;
    }
  } catch {}

  if (!eventId || responded) {
    return responded ? (
      <div style={{
        fontSize: "10px", fontWeight: 600, marginTop: "6px",
        color: responded === "accepted" ? "var(--color-success-text)"
          : responded === "declined" ? "var(--color-danger-text)"
          : "var(--color-info-text)",
      }}>
        {responded === "accepted" ? "Aceptado" : responded === "declined" ? "Rechazado" : "Tentativo"}
      </div>
    ) : null;
  }

  async function respond(status: "accepted" | "declined" | "tentative") {
    setResponding(true);
    await updateAttendeeStatus(eventId!, userId, status);
    await supabase
      .from("notifications")
      .update({ read: true } as any)
      .eq("id", notif.id);
    setResponded(status);
    setResponding(false);
    onResponded();
  }

  return (
    <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
      <button
        onClick={(e) => { e.stopPropagation(); respond("accepted"); }}
        disabled={responding}
        style={{
          flex: 1, height: "26px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--color-success-border)",
          background: "var(--color-success-bg)",
          color: "var(--color-success-text)",
          fontSize: "11px", fontWeight: 600,
          cursor: responding ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "3px",
        }}
      >
        <CheckIcon /> Aceptar
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); respond("tentative"); }}
        disabled={responding}
        style={{
          flex: 1, height: "26px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--color-info-border)",
          background: "var(--color-info-bg)",
          color: "var(--color-info-text)",
          fontSize: "11px", fontWeight: 600,
          cursor: responding ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "3px",
        }}
      >
        <QuestionIcon /> Tentativo
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); respond("declined"); }}
        disabled={responding}
        style={{
          flex: 1, height: "26px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--color-danger-border)",
          background: "var(--color-danger-bg)",
          color: "var(--color-danger-text)",
          fontSize: "11px", fontWeight: 600,
          cursor: responding ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "3px",
        }}
      >
        <XIcon /> Declinar
      </button>
    </div>
  );
}

export default function NotificationsButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    void loadNotifications();
    const channel = supabase
      .channel(`notifs-${user.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "notifications", filter: `user_id=eq.${user.id}`,
      }, () => void loadNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadNotifications() {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(15);
    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    }
  }

  async function markAllRead() {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read: true } as any)
      .eq("user_id", user.id)
      .eq("read", false);
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true } as any).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "34px", height: "34px",
          borderRadius: "var(--radius-md)",
          border: open ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border)",
          background: open ? "var(--color-brand-blue-light)" : "var(--color-bg-subtle)",
          color: open ? "var(--color-brand-blue)" : "var(--color-text-second)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "var(--transition-fast)",
        }}
      >
        <BellIcon hasUnread={unreadCount > 0} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "42px", right: 0,
          width: "380px",
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-xl)",
          zIndex: 200, overflow: "hidden",
        }}>
          {/* HEADER */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid var(--color-border-faint)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                Notificaciones
              </span>
              {unreadCount > 0 && (
                <span style={{
                  padding: "1px 7px", borderRadius: "var(--radius-full)",
                  background: "var(--color-brand-orange)",
                  color: "#fff", fontSize: "11px", fontWeight: 600,
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: "12px", color: "var(--color-brand-blue)",
                  background: "none", border: "none",
                  cursor: "pointer", fontWeight: 500,
                }}
              >
                Marcar todo leído
              </button>
            )}
          </div>

          {/* LISTA */}
          <div style={{ maxHeight: "440px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: "40px 20px", textAlign: "center",
                color: "var(--color-text-muted)", fontSize: "13px",
              }}>
                Sin notificaciones
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--color-border-faint)",
                    background: notif.read ? "transparent" : "var(--color-bg-subtle)",
                    cursor: "pointer",
                    transition: "var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--color-bg-hover)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = notif.read ? "transparent" : "var(--color-bg-subtle)"; }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{
                      width: "7px", height: "7px", borderRadius: "50%",
                      background: notif.read ? "transparent" : getTypeColor(notif.type),
                      marginTop: "5px", flexShrink: 0,
                      border: notif.read ? "1px solid var(--color-border)" : "none",
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "13px",
                        fontWeight: notif.read ? 400 : 600,
                        color: "var(--color-text-primary)",
                        lineHeight: 1.4,
                      }}>
                        {notif.title ?? "Nueva notificación"}
                      </div>
                      {notif.message && (
                        <div style={{
                          fontSize: "12px", color: "var(--color-text-muted)",
                          marginTop: "2px", lineHeight: 1.4,
                        }}>
                          {notif.message}
                        </div>
                      )}

                      {/* ACCIONES DE INVITACIÓN */}
                      {notif.type === "calendar_invitation" && user && (
                        <CalendarInviteActions
                          notif={notif}
                          userId={user.id}
                          onResponded={loadNotifications}
                        />
                      )}

                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                        {timeAgo(notif.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FOOTER */}
          <div style={{
            padding: "10px 16px",
            borderTop: "1px solid var(--color-border-faint)",
            textAlign: "center",
          }}>
            <button style={{
              fontSize: "12px", color: "var(--color-brand-blue)",
              background: "none", border: "none",
              cursor: "pointer", fontWeight: 500,
            }}>
              Ver todas las notificaciones
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
