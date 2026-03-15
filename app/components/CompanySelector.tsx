"use client";

import { useTenant } from "@/lib/tenant/TenantProvider";

export default function CompanySelector() {
  const { companyId, memberships, loadingTenant, setActiveCompany } =
    useTenant();

  if (loadingTenant) {
    return (
      <select
        disabled
        style={{
          background: "#0f2045",
          color: "#fff",
          border: "1px solid #2a4a88",
          padding: "10px 12px",
          borderRadius: 8,
          fontWeight: 600,
        }}
      >
        <option>Cargando...</option>
      </select>
    );
  }

  return (
    <select
      value={companyId || ""}
      onChange={(e) => setActiveCompany(e.target.value)}
      disabled={memberships.length === 0}
      style={{
        background: "#0f2045",
        color: "#fff",
        border: "1px solid #2a4a88",
        padding: "10px 12px",
        borderRadius: 8,
        fontWeight: 600,
        minWidth: 220,
      }}
    >
      {memberships.length === 0 ? (
        <option value="">Sin empresas</option>
      ) : (
        memberships.map((m) => (
          <option key={m.id} value={m.company_id}>
            {m.company_name || "Empresa"}
          </option>
        ))
      )}
    </select>
  );
}
