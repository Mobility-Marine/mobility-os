"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";

type CompanyUser = {
  id:         string;
  user_id:    string;
  role:       string;
  created_at: string;
  user_email?: string;
  user_name?:  string;
};

const ROLES = ["owner", "admin", "manager", "comercial", "logistica", "finanzas", "compras", "user", "viewer"];

const ROLE_COLOR: Record<string, string> = {
  owner:    "var(--color-danger-text)",
  admin:    "#a78bfa",
  manager:  "var(--color-brand-blue)",
  comercial:"var(--color-success-text)",
  logistica:"var(--color-info-text)",
  finanzas: "var(--color-warning-text)",
  compras:  "#f59e0b",
  user:     "var(--color-text-second)",
  viewer:   "var(--color-text-muted)",
};

export default function TabUsuarios() {
  const { t }         = useTranslation();
  const { companyId } = useTenant();

  const [users,    setUsers]    = useState<CompanyUser[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [invEmail, setInvEmail] = useState("");
  const [invRole,  setInvRole]  = useState("user");
  const [inviting, setInviting] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);
  const [invitations,     setInvitations]     = useState<any[]>([]);
  const [loadingInvites,  setLoadingInvites]  = useState(false);
  const [inviteLink,      setInviteLink]      = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    loadUsers();
    loadInvitations();
  }, [companyId]);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase
      .from("company_users")
      .select("id, user_id, role, created_at")
      .eq("company_id", companyId!)
      .order("created_at", { ascending: true });

    if (!data) { setLoading(false); return; }

    // Enriquecer con emails de auth.users (via user_profiles si existe)
    const enriched = await Promise.all(
      data.map(async (u) => {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("full_name")
          .eq("user_id", u.user_id)
          .maybeSingle();
        // Email via user_settings
        const { data: settings } = await supabase
          .from("user_settings")
          .select("value")
          .eq("user_id", u.user_id)
          .eq("key", "email")
          .maybeSingle();
        return {
          ...u,
          user_name:  profile?.full_name ?? null,
          user_email: settings?.value    ?? u.user_id.slice(0, 8) + "…",
        };
      })
    );

    setUsers(enriched);
    setLoading(false);
  }

  async function handleInvite() {
    if (!invEmail.trim() || !companyId) return;
    setInviting(true); setError(null);
    try {
      // Crear invitación en company_invitations
      const { error } = await supabase.from("company_invitations").insert({
        company_id: companyId,
        email:      invEmail.trim().toLowerCase(),
        role:       invRole,
        status:     "pending",
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      if (error) throw error;
      const { data: inv } = await supabase.from("company_invitations")
        .select("token").eq("company_id", companyId!).eq("email", invEmail.trim().toLowerCase())
        .order("created_at", { ascending: false }).limit(1).single();
      const link = inv?.token ? `${window.location.origin}/accept-invitation?token=${inv.token}` : null;
      setInviteLink(link);
      setSuccess(`Invitación creada para ${invEmail}`);
      setInvEmail("");
      await loadInvitations();
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (e: any) { setError(e.message); }
    finally { setInviting(false); }
  }

  async function handleChangeRole(userId: string, newRole: string) {
    if (!companyId) return;
    await supabase.from("company_users").update({ role: newRole }).eq("user_id", userId).eq("company_id", companyId);
    setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, role: newRole } : u));
  }

  async function handleRemove(userId: string) {
    if (!companyId) return;
    if (!window.confirm("¿Eliminar este usuario del equipo?")) return;
    await supabase.from("company_users").delete().eq("user_id", userId).eq("company_id", companyId);
    setUsers((prev) => prev.filter((u) => u.user_id !== userId));
  }

  async function loadInvitations() {
    if (!companyId) return;
    setLoadingInvites(true);
    const { data } = await supabase.from("company_invitations")
      .select("*").eq("company_id", companyId!)
      .neq("status", "cancelled").order("created_at", { ascending: false });
    setInvitations(data ?? []);
    setLoadingInvites(false);
  }

  async function cancelInvitation(id: string) {
    if (!companyId) return;
    await supabase.from("company_invitations").update({ status: "cancelled" }).eq("id", id).eq("company_id", companyId!);
    setInvitations(p => p.filter(i => i.id !== id));
  }

  const INPUT: React.CSSProperties = {
    width: "100%", height: "38px", padding: "0 12px",
    borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
    background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
    fontSize: "13px", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>
        {(t.settings as any)?.tabUsuarios ?? "Usuarios del equipo"}
      </div>

      {/* INVITAR */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 24px", display: "grid", gap: "14px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", paddingBottom: "10px", borderBottom: "1px solid var(--color-border-faint)" }}>
          {(t.settings as any)?.inviteUser ?? "Invitar usuario"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px auto", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</div>
            <input
              type="email"
              value={invEmail}
              onChange={(e) => setInvEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              placeholder="usuario@empresa.com"
              style={INPUT}
            />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rol</div>
            <select value={invRole} onChange={(e) => setInvRole(e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
              {ROLES.filter((r) => r !== "owner").map((r) => (
                <option key={r} value={r} style={{ textTransform: "capitalize" }}>{r}</option>
              ))}
            </select>
          </div>
          <div style={{ paddingTop: "20px" }}>
            <button onClick={handleInvite} disabled={inviting || !invEmail.trim()} style={{
              height: "38px", padding: "0 20px", borderRadius: "var(--radius-md)",
              background: "var(--color-brand-blue)", color: "#fff", border: "none",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}>
              {inviting ? t.general.loading : (t.settings as any)?.invite ?? "Invitar"}
            </button>
          </div>
        </div>
        {error   && <div style={{ fontSize: "12px", color: "var(--color-danger-text)" }}>{error}</div>}
        {success && <div style={{ fontSize: "12px", color: "var(--color-success-text)" }}>✓ {success}</div>}
      </div>

      {/* LISTA */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {(t.settings as any)?.teamMembers ?? "Miembros del equipo"}
          </div>
          <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", border: "1px solid var(--color-border-faint)" }}>
            {users.length} usuarios
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "20px 24px", fontSize: "13px", color: "var(--color-text-muted)" }}>
            {t.general.loading}
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
            Sin usuarios
          </div>
        ) : users.map((u, i) => (
          <div key={u.id} style={{
            padding: "12px 24px", display: "flex", alignItems: "center", gap: "12px",
            borderBottom: i < users.length - 1 ? "1px solid var(--color-border-faint)" : "none",
          }}>
            {/* Avatar */}
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
              background: `${ROLE_COLOR[u.role]}20`, border: `1px solid ${ROLE_COLOR[u.role]}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", fontWeight: 800, color: ROLE_COLOR[u.role],
            }}>
              {(u.user_name ?? u.user_email ?? "U").charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {u.user_name ?? u.user_email}
              </div>
              {u.user_name && (
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{u.user_email}</div>
              )}
            </div>

            {/* Role selector */}
            <select
              value={u.role}
              onChange={(e) => handleChangeRole(u.user_id, e.target.value)}
              disabled={u.role === "owner"}
              style={{
                height: "30px", padding: "0 8px", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)", background: `${ROLE_COLOR[u.role]}15`,
                color: ROLE_COLOR[u.role], fontSize: "11px", fontWeight: 700,
                cursor: u.role === "owner" ? "not-allowed" : "pointer",
                textTransform: "capitalize",
              }}
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>

            {/* Remove */}
            {u.role !== "owner" && (
              <button onClick={() => handleRemove(u.user_id)} style={{
                width: "30px", height: "30px", borderRadius: "var(--radius-sm)",
                background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--color-danger-text)", flexShrink: 0,
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

{/* INVITACIONES PENDIENTES */}
      {invitations.length > 0 && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              Invitaciones pendientes
            </div>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "var(--radius-full)", background: "var(--color-warning-bg)", color: "var(--color-warning-text)", border: "1px solid var(--color-warning-border)" }}>
              {invitations.filter(i => i.status === "pending").length} pendientes
            </span>
          </div>
          {invitations.map((inv, i) => {
            const isExpired = new Date(inv.expires_at) < new Date();
            const link = `${typeof window !== "undefined" ? window.location.origin : ""}/accept-invitation?token=${inv.token}`;
            return (
              <div key={inv.id} style={{ padding: "12px 24px", display: "flex", alignItems: "center", gap: "12px", borderBottom: i < invitations.length - 1 ? "1px solid var(--color-border-faint)" : "none" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{inv.email}</div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "1px" }}>
                    Rol: <strong>{inv.role}</strong> · {isExpired ? "Expirada" : `Expira ${new Date(inv.expires_at).toLocaleDateString("es-MX")}`}
                  </div>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(link); }}
                  title="Copiar link de invitación"
                  style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-sm)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", color: "var(--color-brand-blue)", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>
                  Copiar link
                </button>
                <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "var(--radius-full)", background: isExpired ? "var(--color-danger-bg)" : inv.status === "accepted" ? "var(--color-success-bg)" : "var(--color-warning-bg)", color: isExpired ? "var(--color-danger-text)" : inv.status === "accepted" ? "var(--color-success-text)" : "var(--color-warning-text)", fontWeight: 700 }}>
                  {isExpired ? "Expirada" : inv.status === "accepted" ? "Aceptada" : "Pendiente"}
                </span>
                {inv.status !== "accepted" && (
                  <button onClick={() => cancelInvitation(inv.id)}
                    style={{ width: "28px", height: "28px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-danger-text)", flexShrink: 0 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Link copiado */}
      {inviteLink && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "flex", gap: "10px", alignItems: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-blue)" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <div style={{ flex: 1, fontSize: "11px", color: "var(--color-brand-blue)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {inviteLink}
          </div>
          <button onClick={() => { navigator.clipboard.writeText(inviteLink); setInviteLink(null); }}
            style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-sm)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            Copiar
          </button>
        </div>
      )}
      
      {/* ROLES INFO */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 24px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
          {(t.settings as any)?.rolesGuide ?? "Guía de roles"}
        </div>
        <div style={{ display: "grid", gap: "6px" }}>
          {[
            { role: "owner",    desc: "Acceso total. No puede ser modificado." },
            { role: "admin",    desc: "Acceso total + configuración de empresa." },
            { role: "manager",  desc: "Acceso a todos los módulos, sin configuración." },
            { role: "comercial",desc: "Acceso a módulos comerciales (prospectos, cotizaciones, CRM)." },
            { role: "logistica",desc: "Acceso a módulos logísticos (embarques, transporte)." },
            { role: "finanzas", desc: "Acceso a módulos financieros (facturación, CxC, bancos)." },
            { role: "compras",  desc: "Acceso a abastecimiento (compras, inventario, proveedores)." },
            { role: "user",     desc: "Acceso básico de lectura y captura." },
            { role: "viewer",   desc: "Solo lectura — no puede crear ni editar." },
          ].map((r) => (
            <div key={r.role} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 7px", borderRadius: "var(--radius-full)", background: `${ROLE_COLOR[r.role]}20`, color: ROLE_COLOR[r.role], border: `1px solid ${ROLE_COLOR[r.role]}30`, flexShrink: 0, textTransform: "uppercase", marginTop: "1px" }}>
                {r.role}
              </span>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{r.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
