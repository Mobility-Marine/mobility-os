"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";

type Member = {
  id: string;
  user_id: string;
  role: string | null;
  is_active: boolean;
  email?: string;
};

export default function MembersPage() {
  const { companyId } = useTenant();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, [companyId]);

  async function loadMembers() {
    if (!companyId) return;

    setLoading(true);

    // 🔎 Obtener membresías
    const { data, error } = await supabase
      .from("company_users")
      .select(`
        id,
        user_id,
        role,
        is_active,
        users (
          email
        )
      `)
      .eq("company_id", companyId);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const normalized: Member[] = (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      role: row.role,
      is_active: row.is_active,
      email: row.users?.email || "Sin email",
    }));

    setMembers(normalized);
    setLoading(false);
  }

 // ===== INICIO toggleActive() seguro por empresa =====
async function toggleActive(member: Member) {
  if (!companyId) return;

  await supabase
    .from("company_users")
    .update({ is_active: !member.is_active })
    .eq("id", member.id)
    .eq("company_id", companyId);

  loadMembers();
}
// ===== FIN toggleActive() =====
  if (!companyId) {
    return (
      <div style={{ padding: 40 }}>
        Sin empresa activa
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Usuarios de la empresa</h1>

      {loading && <p>Cargando...</p>}

      {!loading && members.length === 0 && (
        <p>No hay usuarios en esta empresa.</p>
      )}

      {members.map((m) => (
        <div
          key={m.id}
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
            <strong>{m.email}</strong>

            <div style={{ fontSize: 14 }}>
              Rol: {m.role || "sin rol"}
            </div>

            <div style={{ fontSize: 12 }}>
              Estado: {m.is_active ? "Activo" : "Inactivo"}
            </div>
          </div>

          <button
            onClick={() => toggleActive(m)}
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              border: "none",
              background: m.is_active
                ? "#ef4444"
                : "#10b981",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {m.is_active ? "Desactivar" : "Activar"}
          </button>
        </div>
      ))}
    </div>
  );
}
