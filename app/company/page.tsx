"use client";

import { useTenant } from "@/lib/tenant/TenantProvider";
import { useRouter } from "next/navigation";

export default function CompanyManagementPage() {
  const { companyId, memberships, setActiveCompany } = useTenant();
  const router = useRouter();

  return (
    <div style={{ padding: 32 }}>
      {/* 🏢 Header */}
      <div
        style={{
          marginBottom: 30,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>
          Gestión de empresas
        </h1>
        <p style={{ opacity: 0.7 }}>
          Administra tus organizaciones dentro de Mobility OS
        </p>
      </div>

      {/* 🏢 Lista de empresas */}
      <div
        style={{
          background: "#0f1b34",
          padding: 24,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h2 style={{ marginBottom: 20 }}>Mis empresas</h2>

        {memberships.length === 0 && (
          <p style={{ opacity: 0.7 }}>
            No perteneces a ninguna empresa.
          </p>
        )}

        {memberships.map((m) => (
          <div
            key={m.id}
            style={{
              padding: 18,
              marginBottom: 14,
              borderRadius: 10,
              background: "#162544",
              border:
                companyId === m.company_id
                  ? "2px solid #3b82f6"
                  : "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>
                {m.company_name}
              </div>
              <div style={{ opacity: 0.7, fontSize: 14 }}>
                Rol: {m.role}
              </div>
            </div>

            <button
              onClick={async () => {
                await setActiveCompany(m.company_id);
                window.location.reload();
              }}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                background:
                  companyId === m.company_id
                    ? "#22c55e"
                    : "#2563eb",
                color: "#fff",
              }}
            >
              {companyId === m.company_id
                ? "Empresa activa"
                : "Activar"}
            </button>
          </div>
        ))}

        {/* ➕ Crear empresa */}
        <button
          onClick={() => router.push("/create-company")}
          style={{
            marginTop: 10,
            padding: "12px 18px",
            borderRadius: 10,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          + Crear nueva empresa
        </button>
      </div>

      {/* ⚙️ Administración empresa activa */}
      {companyId && (
        <div
          style={{
            marginTop: 30,
            background: "#0f1b34",
            padding: 24,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2 style={{ marginBottom: 10 }}>
            Administración de empresa activa
          </h2>

          <p style={{ opacity: 0.7 }}>
            ID empresa: {companyId}
          </p>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => router.push("/company/members")}
              style={navButton}
            >
              Usuarios
            </button>

            <button
              onClick={() =>
                router.push("/company/invitations")
              }
              style={navButton}
            >
              Invitaciones
            </button>

            <button
              onClick={() => router.push("/company/roles")}
              style={navButton}
            >
              Roles
            </button>

            <button
              onClick={() =>
                router.push("/company/permissions")
              }
              style={{
                ...navButton,
                background: "#7c3aed",
              }}
            >
              Permisos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const navButton = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  background: "#1f3a8a",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};
