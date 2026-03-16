"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";

type Role = {
  id: string;
  name: string;
  description: string | null;
};

export default function RolesPage() {
  const { companyId } = useTenant();

  const [roles, setRoles] = useState<Role[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadRoles();
  }, [companyId]);

  async function loadRoles() {
    if (!companyId) return;

    const { data, error } = await supabase
      .from("company_roles")
      .select("*")
      .eq("company_id", companyId)
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setRoles(data || []);
  }

  async function createRole() {
    if (!companyId || !name) return;

    const { error } = await supabase
      .from("company_roles")
      .insert({
        company_id: companyId,
        name,
        description,
      });

    if (error) {
      console.error(error);
      alert("Error creando rol");
      return;
    }

    setName("");
    setDescription("");
    loadRoles();
  }

  async function deleteRole(id: string) {
    const confirmDelete = confirm(
      "¿Eliminar este rol?"
    );
    if (!confirmDelete) return;

    await supabase
      .from("company_roles")
      .delete()
      .eq("id", id);

    loadRoles();
  }

  if (!companyId) {
    return (
      <div style={{ padding: 40 }}>
        Sin empresa activa
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Roles de la empresa</h1>

      {/* 🔹 Crear rol */}
      <div style={{ marginTop: 20 }}>
        <input
          placeholder="Nombre del rol"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            padding: 10,
            marginRight: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <input
          placeholder="Descripción"
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          style={{
            padding: 10,
            marginRight: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
            width: 260,
          }}
        />

        <button
          onClick={createRole}
          style={{
            padding: "10px 16px",
            borderRadius: 6,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Crear rol
        </button>
      </div>

      {/* 🔹 Lista */}
      <div style={{ marginTop: 40 }}>
        <h2>Roles existentes</h2>

        {roles.length === 0 && (
          <p>No hay roles creados.</p>
        )}

        {roles.map((role) => (
          <div
            key={role.id}
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
              <strong>{role.name}</strong>

              {role.description && (
                <div style={{ fontSize: 12 }}>
                  {role.description}
                </div>
              )}
            </div>

            <button
              onClick={() =>
                deleteRole(role.id)
              }
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
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
