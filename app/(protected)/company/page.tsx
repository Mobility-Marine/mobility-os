"use client";

import { useTenant } from "@/lib/tenant/TenantProvider";
import { useRouter } from "next/navigation";

export default function CompanyManagementPage() {
  const { companyId, memberships, setActiveCompany } = useTenant();
  const router = useRouter();

  return (
    <div style={container}>
      
      {/* 🏢 Header */}
      <div style={header}>
        <div>
          <h1 style={title}>Empresas</h1>
          <p style={subtitle}>
            Gestiona tus organizaciones dentro de Mobility OS
          </p>
        </div>
      </div>

      {/* 🏢 Lista de empresas */}
      <div style={card}>
        <div style={sectionHeader}>
          <h2 style={sectionTitle}>Workspaces</h2>

          <button
            onClick={() => router.push("/create-company")}
            style={primaryButton}
          >
            + Nueva empresa
          </button>
        </div>

        {memberships.length === 0 && (
          <p style={emptyText}>
            No perteneces a ninguna empresa.
          </p>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {memberships.map((m) => {
            const isActive = companyId === m.company_id;

            return (
              <div
                key={m.id}
                style={{
                  ...companyItem,
                  ...(isActive ? companyItemActive : {}),
                }}
              >
                <div>
                  <div style={companyName}>
                    {m.company_name}
                  </div>

                  <div style={companyMeta}>
                    Rol: {m.role}
                  </div>
                </div>

                <button
                  onClick={async () => {
                    await setActiveCompany(m.company_id);
                    window.location.reload();
                  }}
                  style={{
                    ...activateButton,
                    ...(isActive ? activeBadge : {}),
                  }}
                >
                  {isActive ? "Activa" : "Activar"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ⚙️ Administración empresa activa */}
      {companyId && (
        <div style={card}>
          <div style={sectionHeader}>
            <h2 style={sectionTitle}>Administración</h2>

            <span style={idBadge}>
              ID: {companyId}
            </span>
          </div>

          <div style={navGrid}>
            <NavButton
              label="Usuarios"
              onClick={() => router.push("/company/members")}
            />

            <NavButton
              label="Invitaciones"
              onClick={() => router.push("/company/invitations")}
            />

            <NavButton
              label="Roles"
              onClick={() => router.push("/company/roles")}
            />

            <NavButton
              label="Permisos"
              onClick={() => router.push("/company/permissions")}
              highlight
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NavButton({
  label,
  onClick,
  highlight = false,
}: {
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...navButton,
        ...(highlight ? navButtonHighlight : {}),
      }}
    >
      {label}
    </button>
  );
}

//
// 🎨 ESTILOS ENTERPRISE
//

const container: React.CSSProperties = {
  padding: 32,
  display: "grid",
  gap: 24,
  maxWidth: 1100,
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const title: React.CSSProperties = {
  fontSize: 34,
  fontWeight: 700,
  letterSpacing: "-0.02em",
};

const subtitle: React.CSSProperties = {
  opacity: 0.65,
  marginTop: 6,
};

const card: React.CSSProperties = {
  background: "#0b1220",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  padding: 24,
};

const sectionHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
};

const primaryButton: React.CSSProperties = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 600,
  cursor: "pointer",
};

const emptyText: React.CSSProperties = {
  opacity: 0.6,
  fontSize: 14,
};

const companyItem: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 18,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#0f172a",
  transition: "all 0.2s ease",
};

const companyItemActive: React.CSSProperties = {
  border: "1px solid #3b82f6",
  background: "#0f1b34",
};

const companyName: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 16,
};

const companyMeta: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.6,
  marginTop: 4,
};

const activateButton: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: "#1f2937",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const activeBadge: React.CSSProperties = {
  background: "#22c55e",
};

const idBadge: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.6,
};

const navGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
};

const navButton: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const navButtonHighlight: React.CSSProperties = {
  background: "#7c3aed",
};
