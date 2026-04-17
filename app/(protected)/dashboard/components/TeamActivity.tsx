"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface Member {
  id:           string;
  user_id:      string;
  role:         string;
  last_active?: string;
  display_name?:string;
}

function Avatar({ userId, name, size = 32 }: { userId: string; name?: string; size?: number }) {
  const initial = (name || userId).charAt(0).toUpperCase();
  const colors  = [
    "var(--color-brand-blue)", "var(--color-info-text)",
    "var(--color-success-text)", "var(--color-warning-text)",
  ];
  const color = colors[userId.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color + "20", border: `1.5px solid ${color}40`,
      color, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

function isOnline(lastActive?: string): boolean {
  if (!lastActive) return false;
  return Date.now() - new Date(lastActive).getTime() < 15 * 60 * 1000;
}

function lastSeen(lastActive: string | undefined, lang: string): string {
  if (!lastActive) return lang === "en" ? "No activity" : "Sin actividad";
  const diff = Math.floor((Date.now() - new Date(lastActive).getTime()) / 60000);
  if (diff < 1)    return lang === "en" ? "Active now"        : "Activo ahora";
  if (diff < 60)   return lang === "en" ? `${diff}m ago`      : `Hace ${diff}m`;
  if (diff < 1440) return lang === "en" ? `${Math.floor(diff / 60)}h ago`  : `Hace ${Math.floor(diff / 60)}h`;
  return           lang === "en" ? `${Math.floor(diff / 1440)}d ago` : `Hace ${Math.floor(diff / 1440)}d`;
}

export default function TeamActivity() {
  const { companyId }  = useTenant();
  const { t, lang }    = useTranslation();
  const [members, setMembers]   = useState<Member[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [companyId]);

  async function load() {
    if (!companyId) return;
    const { data } = await supabase
      .from("company_users")
      .select("id, user_id, role")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .limit(8);
    if (!data) return;
    const withActivity = await Promise.all(
      data.map(async (m) => {
        const [{ data: settings }, { data: profile }] = await Promise.all([
          supabase.from("user_settings").select("updated_at").eq("user_id", m.user_id).maybeSingle() as any,
          supabase.from("profiles").select("full_name, email").eq("id", m.user_id).maybeSingle() as any,
        ]);
        const display_name = profile?.full_name
          || profile?.email?.split("@")[0]
          || null;
        return { ...m, last_active: settings?.updated_at, display_name };
      })
    );
    setMembers(withActivity);
    setLoading(false);
  }

  const online = members.filter((m) => isOnline(m.last_active));

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "18px", boxShadow: "var(--shadow-sm)",
      display: "grid", gap: "14px",
      height: "100%", alignContent: "start",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
          {t.dashboard.team}
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <div style={{
            padding: "2px 8px", borderRadius: "var(--radius-full)",
            background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)",
            fontSize: "11px", fontWeight: 600, color: "var(--color-success-text)",
          }}>
            {online.length} {t.general.online}
          </div>
          <div style={{
            padding: "2px 8px", borderRadius: "var(--radius-full)",
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
            fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)",
          }}>
            {members.length} {t.dashboard.totalMembers}
          </div>
        </div>
      </div>

      {online.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "-4px" }}>
          {online.slice(0, 5).map((m, i) => (
            <div key={m.id} style={{ marginLeft: i > 0 ? "-8px" : 0, zIndex: online.length - i }}>
              <Avatar userId={m.user_id} size={34} />
            </div>
          ))}
          {online.length > 5 && (
            <div style={{
              marginLeft: "-8px", width: 34, height: 34, borderRadius: "50%",
              background: "var(--color-bg-subtle)", border: "1.5px solid var(--color-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)",
            }}>
              +{online.length - 5}
            </div>
          )}
          <div style={{ marginLeft: "12px", fontSize: "12px", color: "var(--color-success-text)", fontWeight: 500 }}>
            {online.length === 1
              ? `1 ${t.dashboard.activePerson}`
              : `${online.length} ${t.dashboard.activePersons}`}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: "6px" }}>
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "8px", borderRadius: "var(--radius-md)",
              background: "var(--color-bg-subtle)", opacity: 0.5,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-border)" }} />
              <div style={{ flex: 1, display: "grid", gap: "4px" }}>
                <div style={{ height: "10px", background: "var(--color-border)", borderRadius: 4, width: "60%" }} />
                <div style={{ height: "8px", background: "var(--color-border-faint)", borderRadius: 4, width: "40%" }} />
              </div>
            </div>
          ))
        ) : members.length === 0 ? (
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", textAlign: "center", padding: "16px 0" }}>
            {lang === "en" ? "No team members" : "Sin miembros en el equipo"}
          </div>
        ) : (
          members.map((member) => {
            const active = isOnline(member.last_active);
            return (
              <div key={member.id} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "8px 10px", borderRadius: "var(--radius-md)",
                background: active ? "var(--color-success-bg)" : "var(--color-bg-subtle)",
                border: `1px solid ${active ? "var(--color-success-border)" : "var(--color-border-faint)"}`,
                transition: "var(--transition-fast)",
              }}>
                <div style={{ position: "relative" }}>
                  <Avatar userId={member.user_id} name={member.display_name} size={30} />
                  <span style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: active ? "var(--color-success-text)" : "var(--color-border)",
                    border: "2px solid var(--color-bg-base)",
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {member.user_id.slice(0, 12)}…
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {member.display_name || member.user_id.slice(0, 8) + "…"}
                  </div>
                </div>
                <div style={{
                  fontSize: "10px", fontWeight: 500,
                  color: active ? "var(--color-success-text)" : "var(--color-text-muted)",
                  whiteSpace: "nowrap",
                }}>
                  {lastSeen(member.last_active, lang)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
