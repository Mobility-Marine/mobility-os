"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";

const modules = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Agenda", path: "/agenda" },
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
        background: "#060c1b",
        color: "#e8edff",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, sans-serif",
        display: "grid",
        gridTemplateColumns: "260px 1fr",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          background: "#0b1630",
          borderRight: "1px solid #182952",
          padding: "28px 20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* LOGO */}
        <div style={{ marginBottom: 36 }}>
          <img
            src="/logo.png"
            alt="Mobility OS"
            style={{
              width: 170,
              filter: "drop-shadow(0 0 12px rgba(59,130,246,0.25))",
            }}
          />
          <div
            style={{
              fontSize: 12,
              color: "#8fa7d6",
              marginTop: 10,
              letterSpacing: 0.4,
            }}
          >
            Mobility Marine
          </div>
        </div>

        {/* MENÚ */}
        <nav style={{ flex: 1 }}>
          {modules.map((m) => {
            const active = pathname === m.path;

            return (
              <div
                key={m.name}
                onClick={() => router.push(m.path)}
                style={{
                  padding: "13px 16px",
                  borderRadius: 14,
                  marginBottom: 8,
                  cursor: "pointer",
                  fontWeight: 500,
                  transition: "all .15s ease",
                  background: active
                    ? "linear-gradient(135deg,#1e40af,#2563eb)"
                    : "transparent",
                  border: active
                    ? "1px solid #3b82f6"
                    : "1px solid transparent",
                  boxShadow: active
                    ? "0 6px 18px rgba(37,99,235,0.35)"
                    : "none",
                }}
              >
                {m.name}
              </div>
            );
          })}
        </nav>

        {/* USUARIO */}
        <div
          style={{
            paddingTop: 18,
            borderTop: "1px solid #182952",
            fontSize: 13,
            color: "#8fa7d6",
          }}
        >
          Conectado como
          <div
            style={{
              color: "#fff",
              marginTop: 4,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {user?.email}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ padding: 28 }}>
        {/* HEADER */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 26,
            background:
              "linear-gradient(135deg,#0f1c3f,#0b1733)",
            border: "1px solid #1f2f5a",
            borderRadius: 16,
            padding: "16px 22px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              Mobility OS Platform
            </div>

            {companyId && (
              <div
                style={{
                  fontSize: 11,
                  color: "#7fa1ff",
                  marginTop: 2,
                }}
              >
                Tenant activo: {companyId.slice(0, 8)}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            {/* Selector empresa */}
            <select
              value={companyId || ""}
              onChange={async (e) => {
                await setActiveCompany(e.target.value);
                window.location.reload();
              }}
              style={{
                background: "#070f24",
                color: "#fff",
                border: "1px solid #2a4a88",
                padding: "10px 14px",
                borderRadius: 12,
                fontWeight: 600,
                minWidth: 200,
              }}
            >
              {memberships.map((m) => (
                <option key={m.id} value={m.company_id}>
                  {m.company_name}
                </option>
              ))}
            </select>

            {/* LOGOUT */}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace("/login");
              }}
              style={{
                background:
                  "linear-gradient(135deg,#1f3a8a,#2563eb)",
                border: "none",
                padding: "10px 16px",
                borderRadius: 12,
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                boxShadow:
                  "0 6px 16px rgba(37,99,235,0.4)",
              }}
            >
              Salir
            </button>
          </div>
        </header>

        {/* CONTENIDO */}
        <div
          style={{
            background:
              "linear-gradient(180deg,#0f1c3f,#0b1733)",
            border: "1px solid #1f2f5a",
            borderRadius: 18,
            padding: 26,
            minHeight: "72vh",
            boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
