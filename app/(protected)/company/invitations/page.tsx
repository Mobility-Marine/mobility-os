"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";

type Invitation = {
  id: string;
  email: string;
  token: string;
  status: string | null;
  created_at: string;
};

export default function InvitationsPage() {
  const { companyId } = useTenant();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    loadInvitations();
  }, [companyId]);

  async function loadInvitations() {
    if (!companyId) return;

  // ===== INICIO loadInvitations() activas =====
const { data, error } = await supabase
  .from("company_invitations")
  .select("*")
  .eq("company_id", companyId)
  .neq("status", "cancelled")
  .order("created_at", { ascending: false });
// ===== FIN loadInvitations() activas =====

    if (error) {
      console.error(error);
      return;
    }

    setInvitations(data || []);
  }

  async function invite() {
    if (!companyId || !email) return;

    setLoading(true);

    const token = crypto.randomUUID();

    const { error } = await supabase
      .from("company_invitations")
      .insert({
        company_id: companyId,
        email,
        token,
        status: "pending",
      });

    if (error) {
      console.error(error);
      alert("Error creando invitación");
      setLoading(false);
      return;
    }

    alert("Invitación creada");
    setEmail("");
    setLoading(false);

    loadInvitations();
  }

 // ===== INICIO cancelInvitation() soft cancel =====
async function cancelInvitation(id: string) {
  if (!companyId) return;

  await supabase
    .from("company_invitations")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("company_id", companyId);

  loadInvitations();
}
// ===== FIN cancelInvitation() =====

  if (!companyId) {
    return (
      <div style={{ padding: 40 }}>
        Sin empresa activa
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Invitaciones</h1>

      {/* 🔹 Crear invitación */}
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
          onClick={invite}
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

      {/* 🔹 Lista de invitaciones */}
      <div style={{ marginTop: 40 }}>
        <h2>Invitaciones pendientes</h2>

        {invitations.length === 0 && (
          <p>No hay invitaciones.</p>
        )}

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
                Creada:{" "}
                {new Date(inv.created_at).toLocaleString()}
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
    </div>
  );
}
