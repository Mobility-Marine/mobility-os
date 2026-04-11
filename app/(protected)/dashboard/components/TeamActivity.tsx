"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";

interface Member {
  id: string;
  user_id: string;
  role: string;
  email?: string;
  last_active?: string;
}

function Avatar({ email, size = 28 }: { email?: string; size?: number }) {
  const initial = email?.charAt(0).toUpperCase() ?? "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "var(--color-brand-blue)",
      color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 600, flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

export default function TeamActivity() {
  const { companyId } = useTenant();
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!companyId) return;
    void load();
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

    const withEmails = await Promise.all(
      data.map(async (m) => {
        const { data: settings } = await supabase
          .from("user_settings")
          .select("active_company_id, updated_at")
          .eq("user_id", m.user_id)
          .maybeSingle() as any;
        return { ...m, last_active: settings?.updated_at };
      })
    );
    setMembers(withEmails);
  }

  function isOnline(lastActive?: string): boolean {
    if (!lastActive) return false;
    return Date.now() - new Date(lastActive).getTime() < 15 * 60 * 1000;
  }

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "18px",
      boxShadow: "var(--shadow-sm)",
      display: "grid",
      gap: "12px",
      alignContent: "start",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
          Equipo
        </div>
        <span style={{
          padding: "2px 8px",
          borderRadius: "var(--radius-full)",
          background: "var(--color-success-bg)",
          color: "var(--color-success-text)",
          fontSize: "11px",
          fontWeight: 600,
        }}>
          {members.filter((m) => isOnline(m.last_active)).length} en línea
        </span>
      </div>

      <div style={{ display: "grid", gap: "8px" }}>
        {members.length === 0 ? (
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", textAlign: "center", padding: "16px 0" }}>
            Sin miembros
          </div>
        ) : (
          members.map((member) => {
            const online = isOnline(member.last_active);
            return (
              <div key={member.id} style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 8px",
                borderRadius: "var(--radius-md)",
                background: online ? "var(--color-bg-subtle)" : "transparent",
              }}>
                <div style={{ position: "relative" }}>
                  <Avatar email={member.email ?? member.user_id} size={28} />
                  <span style={{
                    position: "absolute",
                    bottom: 0, right: 0,
                    width: "8px", height: "8px",
                    borderRadius: "50%",
                    background: online ? "var(--color-success-text)" : "var(--color-border)",
                    border: "2px solid var(--color-bg-base)",
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--color-text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {member.user_id.slice(0, 8)}…
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                    {member.role}
                  </div>
                </div>
                <div style={{
                  fontSize: "10px",
                  color: online ? "var(--color-success-text)" : "var(--color-text-muted)",
                  fontWeight: online ? 600 : 400,
                }}>
                  {online ? "activo" : "inactivo"}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
