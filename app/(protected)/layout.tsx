"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";

const modules = [
  "Dashboard",
  "Prospectos",
  "CRM",
  "Agenda",
  "Cotizaciones",
  "Embarques",
  "Facturación",
  "Reportes",
  "Proveedores",
  "Comercio Exterior",
  "Empresa",
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { companyId, memberships, setActiveCompany } =
    useTenant();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#070f24",
        color: "#fff",
        fontFamily: "Inter, Arial",
        display: "grid",
        gridTemplateColumns: "280px 1fr",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          background: "#0b1733",
          borderRight: "1px solid #1f2f5a",
          padding: 24,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <img
            src="/logo.png"
            alt="Mobility OS"
            style={{ width: "100%", maxWidth: 180 }}
          />
          <p style={{ color: "#9fb3d9", marginTop: 6 }}>
            Mobility Marine
          </p>
        </div>

        <div style={{ flex: 1 }}>
          {modules.map((m) => (
            <div
              key={m}
              onClick={() => {
                if (m === "Dashboard") router.push("/");
                else if (m === "Agenda") router.push("/agenda");
                else if (m === "Empresa") router.push("/company");
              }}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                marginBottom: 8,
                cursor: "pointer",
              }}
            >
              {m}
            </div>
          ))}
        </div>

        <div
          style={{
            paddingTop: 16,
            borderTop: "1px solid #1f2f5a",
            fontSize: 14,
            color: "#9fb3d9",
          }}
        >
          Conectado como:
          <div style={{ color: "#fff", marginTop: 4 }}>
            {user?.email}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ padding: 32 }}>
        {/* HEADER */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 28,
            background: "#0b1733",
            padding: "12px 18px",
            borderRadius: 12,
            border: "1px solid #1f2f5a",
          }}
        >
          <div>Mobility OS Platform</div>

          <div style={{ display: "flex", gap: 16 }}>
            {/* Selector empresa */}
            <select
              value={companyId || ""}
              onChange={async (e) => {
                await setActiveCompany(e.target.value);
                window.location.reload();
              }}
            >
              {memberships.map((m) => (
                <option key={m.id} value={m.company_id}>
                  {m.company_name}
                </option>
              ))}
            </select>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace("/login");
              }}
            >
              Salir
            </button>
          </div>
        </header>

        {/* CONTENIDO */}
        {children}
      </main>
    </div>
  );
}
