"use client";

import { useTenant } from "@/lib/tenant/TenantProvider";
import { useRouter } from "next/navigation";

export default function CompanyManagementPage() {
  const { companyId, memberships } = useTenant();
  const router = useRouter();

  if (!companyId) {
    return <div style={{ padding: 40 }}>Sin empresa activa</div>;
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Company Management</h1>

      <p>Empresa activa: {companyId}</p>

      <div style={{ marginTop: 30, display: "flex", gap: 20 }}>
        <button onClick={() => router.push("/company/members")}>
          Usuarios
        </button>

        <button onClick={() => router.push("/company/invitations")}>
          Invitaciones
        </button>

        <button onClick={() => router.push("/company/roles")}>
          Roles
        </button>
      </div>
    </div>
  );
}
