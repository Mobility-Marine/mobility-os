"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";

const modules = [
  { name: "Dashboard", path: "/" },
  { name: "Agenda", path: "/agenda" },
  { name: "CRM", path: "/crm" },
  { name: "Cotizaciones", path: "/quotes" },
  { name: "Embarques", path: "/shipments" },
  { name: "Facturación", path: "/billing" },
  { name: "Reportes", path: "/reports" },
  { name: "Empresa", path: "/company" },
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { companyId, memberships, setActiveCompany } =
    useTenant();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#070f24",
        color: "#e6ecff",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, sans-serif",
        display: "grid",
        gridTemplateColumns: "260px 1fr",
      }}
    >
      {/* ───────── SIDEBAR ───────── /}
      <aside
        style={{
          background: "#0b1733",
          borderRight: "1px solid #1f2f5a",
          padding: "28px 20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/ LOGO /}
        <div style={{ marginBottom: 32 }}>
          <img
            src="/logo.png"
            alt="Mobility OS"
            style={{ width: 160 }}
          />
          <div
            style={{
              fontSize: 12,
              color: "#9fb3d9",
              marginTop: 8,
              letterSpacing: 0.5,
            }}
          >
            Mobility Marine
          </div>
        </div>

        {/ MENÚ /}
        <nav style={{ flex: 1 }}>
          {modules.map((m) => {
            const active = pathname === m.path;

            return (
              <div
                key={m.name}
                onClick={() => router.push(m.path)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  marginBottom: 6,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  background: active ? "#162554" : "transparent",
                  border: active
                    ? "1px solid #3b82f6"
                    : "1px solid transparent",
                  transition: "all .15s ease",
                }}
              >
                {m.name}
              </div>
            );
          })}
        </nav>

        {/ USUARIO /}
        <div
          style={{
            paddingTop: 18,
            borderTop: "1px solid #1f2f5a",
            fontSize: 13,
            color: "#9fb3d9",
          }}
        >
          Conectado como
          <div
            style={{
              color: "#e6ecff",
              marginTop: 4,
              fontWeight: 500,
            }}
          >
            {user?.email}
          </div>
        </div>
      </aside>

      {/ ───────── MAIN ───────── /}
      <main
        style={{
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/ HEADER /}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#0f1c3f",
            border: "1px solid #1f2f5a",
            borderRadius: 14,
            padding: "14px 20px",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            Mobility OS Platform
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {/ SELECTOR EMPRESA /}
            <select
              value={companyId || ""}
              onChange={async (e) => {
                await setActiveCompany(e.target.value);
                window.location.reload();
              }}
              style={{
                background: "#070f24",
                color: "#e6ecff",
                border: "1px solid #2a4a88",
                padding: "8px 12px",
                borderRadius: 10,
                fontWeight: 500,
              }}
            >
              {memberships.map((m) => (
                <option key={m.id} value={m.company_id}>
                  {m.company_name}
                </option>
              ))}
            </select>

            {/ LOGOUT /}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace("/login");
              }}
              style={{
                background: "#1f3a8a",
                border: "none",
                padding: "8px 14px",
                borderRadius: 10,
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Salir
            </button>
          </div>
        </header>

        {/ CONTENIDO */}
        <div
          style={{
            background: "#0f1c3f",
            border: "1px solid #1f2f5a",
            borderRadius: 16,
            padding: 24,
            minHeight: "calc(100vh - 160px)",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
