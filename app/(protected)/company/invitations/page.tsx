"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { usePermissions } from "@/lib/auth/usePermissions";

type Invitation = {
  id: string;
  email: string;
  token: string;
  status: string | null;
  created_at: string;
};

// ===== INICIO InvitationsPage =====
export default function InvitationsPage() {
  // ===== INICIO HOOKS =====
  const { companyId, loading: tenantLoading } = useTenant();
  const { canManageCompany, loading: permLoading } = usePermissions();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  // ===== FIN HOOKS =====

  // ===== INICIO EFFECT carga invitaciones =====
  useEffect(() => {
    if (!companyId) return;
    void loadInvitations();
  }, [companyId]);
  // ===== FIN EFFECT carga invitaciones =====

  // ===== INICIO loadInvitations =====
  async function loadInvitations() {
    if (!companyId) return;

    const { data, error } = await supabase
      .from("company_invitations")
      .select("*")
      .eq("company_id", companyId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando invitaciones:", error);
      return;
    }

    setInvitations(data || []);
  }
  // ===== FIN loadInvitations =====

  // ===== INICIO createInvitation =====
  async function createInvitation() {
    if (!companyId) return;

    const finalEmail = email.trim();
    if (!finalEmail) {
      alert("Ingresa un email");
      return;
    }

    try {
      setLoading(true);

      const role = prompt("Rol (admin, manager, user)") || "user";
      const token = crypto.randomUUID();

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase.from("company_invitations").insert({
        company_id: companyId,
        email: finalEmail,
        role,
        token,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      });

      if (error) {
        console.error("Error creando invitación:", error);
        alert("No se pudo crear la invitación");
        return;
      }

      alert(
        `Invitación creada.\n\nLink de acceso:\n${window.location.origin}/accept-invitation?token=${token}`
      );

      setEmail("");
      await loadInvitations();
    } finally {
      setLoading(false);
    }
  }
  // ===== FIN createInvitation =====

  // ===== INICIO cancelInvitation =====
  async function cancelInvitation(id: string) {
    if (!companyId) return;

    const { error } = await supabase
      .from("company_invitations")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) {
      console.error("Error cancelando invitación:", error);
      alert("No se pudo cancelar la invitación");
      return;
    }

    await loadInvitations();
  }
  // ===== FIN cancelInvitation =====

  // ===== INICIO GUARDS =====
  if (tenantLoading) {
    return <div style={{ padding: 40 }}>Cargando empresa...</div>;
  }

  if (permLoading) {
    return <div style={{ padding: 40 }}>Cargando permisos...</div>;
  }

  if (!canManageCompany) {
    return (
      <div style={{ padding: 40 }}>
        No tienes permisos para acceder a esta sección
      </div>
    );
  }

  if (!companyId) {
    return <div style={{ padding: 40 }}>Sin empresa activa</div>;
  }
  // ===== FIN GUARDS =====

  // ===== INICIO UI =====
  return (
    <div style={{ padding: 40 }}>
      <h1>Invitaciones</h1>

      {/* ===== INICIO BLOQUE crear invitación ===== */}
      <div style={{ marginTop: 20 }}>
        <input
          placeholder="Email del usuario"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: 10,
            marginRight: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={createInvitation}
          disabled={loading}
          style={{
            padding: "10px 16px",
            borderRadius: 6,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "Enviando..." : "Invitar"}
        </button>
      </div>
      {/* ===== FIN BLOQUE crear invitación ===== */}

      {/* ===== INICIO BLOQUE listado invitaciones ===== */}
      <div style={{ marginTop: 40 }}>
        <h2>Invitaciones pendientes</h2>

        {invitations.length === 0 && <p>No hay invitaciones.</p>}

        {invitations.map((inv) => (
          <div
            key={inv.id}
            style={{
              padding: 16,
              marginTop: 12,
              border: "1px solid #ccc",
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>{inv.email}</strong>

              <div style={{ fontSize: 12 }}>
                Estado: {inv.status || "pending"}
              </div>

              <div style={{ fontSize: 11 }}>
                Creada: {new Date(inv.created_at).toLocaleString()}
              </div>
            </div>

            <button
              onClick={() => cancelInvitation(inv.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                border: "none",
                background: "#ef4444",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancelar
            </button>
          </div>
        ))}
      </div>
      {/* ===== FIN BLOQUE listado invitaciones ===== */}
    </div>
  );
  // ===== FIN UI =====
}
// ===== FIN InvitationsPage =====
