"use client";

import { useTenant } from "@/lib/tenant/TenantProvider";
import { useRouter } from "next/navigation";

export default function CompanyManagementPage() {
  const { companyId, memberships, setActiveCompany } = useTenant();
  const router = useRouter();

  return (
    <div style={container}>
      <div style={header}>
        <div>
          <h1 style={title}>Empresas</h1>
          <p style={subtitle}>
            Gestiona tus organizaciones dentro de Mobility OS
          </p>
        </div>
      </div>

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
          <p style={emptyText}>No perteneces a ninguna empresa.</p>
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
                  <div style={companyName}>{m.company_name}</div>
                  <div style={companyMeta}>Rol: {m.role}</div>
                </div>

                <button
                  onClick={async () => {
                    await setActiveCompany(m.company_id);
                    window.location.reload();
                  }}
                  style={{
                    ...actionButton,
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

      {companyId && (
        <div style={card}>
          <div style={sectionHeader}>
            <h2 style={sectionTitle}>Administración</h2>

            <span style={idBadge}>ID: {companyId}</span>
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

const UI = {
  bgCard: "#0b0f14",
  bgCardSoft: "#0f141b",
  bgItem: "#10161f",
  bgItemActive: "#131a23",
  border: "#1f2937",
  borderSoft: "#273142",
  text: "#f3f4f6",
  textSoft: "#9ca3af",
  textMuted: "#6b7280",
  solid: "#f3f4f6",
  solidText: "#0b0f14",
};

const container: React.CSSProperties = {
  padding: 32,
  display: "grid",
  gap: 24,
  maxWidth: 1120,
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const title: React.CSSProperties = {
  fontSize: 34,
  fontWeight: 750,
  letterSpacing: "-0.03em",
  color: UI.text,
  margin: 0,
};

const subtitle: React.CSSProperties = {
  marginTop: 8,
  color: UI.textSoft,
  fontSize: 15,
};

const card: React.CSSProperties = {
  background: UI.bgCard,
  borderRadius: 16,
  border: `1px solid ${UI.border}`,
  padding: 24,
};

const sectionHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18,
  gap: 16,
  flexWrap: "wrap",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 650,
  color: UI.text,
  margin: 0,
};

const primaryButton: React.CSSProperties = {
  background: UI.solid,
  color: UI.solidText,
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 650,
  cursor: "pointer",
};

const emptyText: React.CSSProperties = {
  color: UI.textSoft,
  fontSize: 14,
};

const companyItem: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 18,
  borderRadius: 12,
  border: `1px solid ${UI.border}`,
  background: UI.bgItem,
  gap: 16,
};

const companyItemActive: React.CSSProperties = {
  background: UI.bgItemActive,
  border: `1px solid ${UI.borderSoft}`,
};

const companyName: React.CSSProperties = {
  fontWeight: 650,
  fontSize: 16,
  color: UI.text,
};

const companyMeta: React.CSSProperties = {
  fontSize: 13,
  color: UI.textSoft,
  marginTop: 4,
};

const actionButton: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 9,
  border: `1px solid ${UI.borderSoft}`,
  background: "transparent",
  color: UI.text,
  fontWeight: 650,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const activeBadge: React.CSSProperties = {
  background: UI.solid,
  color: UI.solidText,
  border: "none",
};

const idBadge: React.CSSProperties = {
  fontSize: 12,
  color: UI.textSoft,
  wordBreak: "break-all",
};

const navGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
};

const navButton: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: 12,
  border: `1px solid ${UI.border}`,
  background: UI.bgItem,
  color: UI.text,
  fontWeight: 650,
  cursor: "pointer",
};

const navButtonHighlight: React.CSSProperties = {
  background: UI.solid,
  color: UI.solidText,
  border: "none",
};
