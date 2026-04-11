"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";

interface Notification {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  read?: boolean;
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
          position: "absolute",
          top: "-3px",
          right: "-3px",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "var(--color-brand-orange)",
          border: "2px solid var(--color-bg-base)",
        }} />
      )}
    </div>
  );
}

export default function NotificationsButton() {
  const { user } = useAuth();
  const { companyId } = useTenant();
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
        event: "INSERT", schema: "public", table: "notifications",
        filter: `user_id=eq.${user.id}`,
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
      .limit(12);
    if (data) {
      setNotifications(data);
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

  function getTypeColor(type?: string): string {
    if (!type) return "var(--color-text-muted)";
    if (type.includes("danger") || type.includes("alert")) return "var(--color-danger-text)";
    if (type.includes("warning")) return "var(--color-warning-text)";
    if (type.includes("success")) return "var(--color-success-text)";
    return "var(--color-brand-blue)";
  }

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "var(--radius-md)",
          border: open ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border)",
          background: open ? "var(--color-brand-blue-light)" : "var(--color-bg-subtle)",
          color: open ? "var(--color-brand-blue)" : "var(--color-text-second)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "var(--transition-fast)",
        }}
      >
        <BellIcon hasUnread={unreadCount > 0} />
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "42px",
          right: 0,
          width: "360px",
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-xl)",
          zIndex: 200,
          overflow: "hidden",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
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
                  padding: "1px 7px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--color-brand-orange)",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 600,
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: "12px",
                  color: "var(--color-brand-blue)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Marcar todo leído
              </button>
            )}
          </div>

          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "var(--color-text-muted)",
                fontSize: "13px",
              }}>
                Sin notificaciones
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--color-border-faint)",
                    background: notif.read ? "transparent" : "var(--color-bg-subtle)",
                    cursor: "pointer",
                    transition: "var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "var(--color-bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = notif.read ? "transparent" : "var(--color-bg-subtle)";
                  }}
                >
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: notif.read ? "transparent" : getTypeColor(notif.type),
                    marginTop: "5px",
                    flexShrink: 0,
                    border: notif.read ? "1px solid var(--color-border)" : "none",
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "13px",
                      fontWeight: notif.read ? 400 : 600,
                      color: "var(--color-text-primary)",
                      lineHeight: 1.4,
                    }}>
                      {notif.title || notif.message || "Nueva notificación"}
                    </div>
                    {notif.message && notif.title && (
                      <div style={{
                        fontSize: "12px",
                        color: "var(--color-text-muted)",
                        marginTop: "2px",
                        lineHeight: 1.4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {notif.message}
                      </div>
                    )}
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                      {timeAgo(notif.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{
            padding: "10px 16px",
            borderTop: "1px solid var(--color-border-faint)",
            textAlign: "center",
          }}>
            <button style={{
              fontSize: "12px",
              color: "var(--color-brand-blue)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
            }}>
              Ver todas las notificaciones
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
