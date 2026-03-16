"use client";

import { useTenant } from "@/lib/tenant/TenantProvider";
import { useRouter } from "next/navigation";

export default function CompanyManagementPage() {
  const {
    companyId,
    memberships,
    setActiveCompany,
  } = useTenant();

  const router = useRouter();

  return (
    <div style={{ padding: 40 }}>
      <h1>Gestión de empresas</h1>

      {/* 🏢 Lista de empresas */}
      <h2 style={{ marginTop: 30 }}>Mis empresas</h2>

      {memberships.length === 0 && (
        <p>No perteneces a ninguna empresa.</p>
      )}

      {memberships.map((m) => (
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
            <strong>{m.company_name}</strong>
            <div>Rol: {m.role}</div>
          </div>

          <button
            onClick={async () => {
              await setActiveCompany(m.company_id);
              window.location.reload();
            }}
          >
            {companyId === m.company_id
              ? "Empresa activa"
              : "Activar"}
          </button>
        </div>
      ))}

      {/* ➕ Crear nueva empresa */}
      <button
        onClick={() => router.push("/create-company")}
        style={{
          marginTop: 24,
          padding: "12px 18px",
          borderRadius: 8,
          background: "#2563eb",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        + Crear nueva empresa
      </button>

      {/* ⚙️ Acciones avanzadas */}
      {companyId && (
        <>
          <h2 style={{ marginTop: 40 }}>
            Administración de empresa activa
          </h2>

          <p>ID empresa: {companyId}</p>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              gap: 20,
            }}
          >
            <button
              onClick={() => router.push("/company/members")}
            >
              Usuarios
            </button>

            <button
              onClick={() =>
                router.push("/company/invitations")
              }
            >
              Invitaciones
            </button>

            <button
              onClick={() => router.push("/company/roles")}
            >
              Roles
            </button>
          </div>
        </>
      )}
    </div>
  );
}
