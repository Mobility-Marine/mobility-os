"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";

const sidebarStructure = [
  {
    section: "GENERAL",
    items: [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Agenda", path: "/agenda" },
    ],
  },

  {
    section: "COMERCIAL",
    items: [
      { name: "Prospectos", path: "/comercial/prospectos" },
      { name: "CRM", path: "/comercial/crm" },
      { name: "Clientes", path: "/comercial/clientes" },
      { name: "Cotizaciones", path: "/comercial/cotizaciones" },
      { name: "Productos", path: "/comercial/productos" },
      { name: "Pedidos", path: "/comercial/pedidos" },
    ],
  },

  {
    section: "LOGÍSTICA",
    items: [
      { name: "Embarques", path: "/logistica/embarques" },
      { name: "Transporte", path: "/logistica/transporte" },
      { name: "Comercio Exterior", path: "/logistica/comercio-exterior" },
      { name: "Tracking", path: "/logistica/tracking" },
      { name: "Documentación", path: "/logistica/documentacion" },
      {
        name: "Proveedores logísticos",
        path: "/logistica/proveedores-logisticos",
      },
      { name: "Órdenes de servicio", path: "/logistica/ordenes-servicio" },
    ],
  },

  {
    section: "COMPRAS & ABASTECIMIENTO",
    items: [
      { name: "Proveedores", path: "/abastecimiento/proveedores" },
      { name: "Compras", path: "/abastecimiento/compras" },
      { name: "Órdenes de compra", path: "/abastecimiento/ordenes-compra" },
      { name: "Inventarios", path: "/abastecimiento/inventarios" },
      { name: "Recepciones", path: "/abastecimiento/recepciones" },
      { name: "Costos", path: "/abastecimiento/costos" },
    ],
  },

  {
    section: "FINANZAS",
    items: [
      { name: "Facturación", path: "/finanzas/facturacion" },
      { name: "Cuentas por cobrar", path: "/finanzas/cxc" },
      { name: "Cuentas por pagar", path: "/finanzas/cxp" },
      { name: "Bancos", path: "/finanzas/bancos" },
      { name: "Contabilidad", path: "/finanzas/contabilidad" },
      { name: "Impuestos", path: "/finanzas/impuestos" },
    ],
  },

  {
    section: "ADMINISTRACIÓN",
    items: [
      { name: "Reportes", path: "/reports" },
      { name: "Empresa", path: "/company" },
      { name: "Configuración", path: "/settings" },
      { name: "Ayuda", path: "/help" },
    ],
  },
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
        background:
          "radial-gradient(circle at 20% 20%, #0a1a3f, #050b18)",
        color: "#e8edff",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, sans-serif",
        display: "grid",
        gridTemplateColumns: "300px 1fr",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          background: "linear-gradient(180deg,#0b1630,#070f24)",
          borderRight: "1px solid #182952",
          padding: "28px 22px",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* LOGO */}
        <div style={{ marginBottom: 34 }}>
          <img
            src="/logo.png"
            alt="Mobility OS"
            style={{
              width: 180,
              filter:
                "drop-shadow(0 0 18px rgba(59,130,246,0.35))",
            }}
          />
          <div
            style={{
              fontSize: 12,
              color: "#8fa7d6",
              marginTop: 12,
              letterSpacing: 0.5,
            }}
          >
            Mobility Marine
          </div>
        </div>

        {/* MENÚ */}
        <nav style={{ flex: 1 }}>
          {sidebarStructure.map((section) => (
            <div key={section.section} style={{ marginBottom: 22 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "#7fa1ff",
                  marginBottom: 8,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                }}
              >
                {section.section}
              </div>

              {section.items.map((item) => {
                const active = pathname === item.path;

                return (
                  <div
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    style={{
                      padding: "13px 16px",
                      borderRadius: 14,
                      marginBottom: 6,
                      cursor: "pointer",
                      fontWeight: 500,
                      fontSize: 14,
                      transition: "all .18s ease",
                      background: active
                        ? "linear-gradient(135deg,#2563eb,#1d4ed8)"
                        : "transparent",
                      border: active
                        ? "1px solid #3b82f6"
                        : "1px solid transparent",
                      boxShadow: active
                        ? "0 8px 24px rgba(37,99,235,0.45)"
                        : "none",
                    }}
                  >
                    {item.name}
                  </div>
                );
              })}
            </div>
          ))}
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
      <main style={{ padding: 32 }}>
        {/* HEADER */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
            background:
              "linear-gradient(135deg,#0f1c3f,#0b1733)",
            border: "1px solid #1f2f5a",
            borderRadius: 18,
            padding: "18px 24px",
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>
              Mobility OS Platform
            </div>

            {companyId && (
              <div
                style={{
                  fontSize: 12,
                  color: "#7fa1ff",
                  marginTop: 3,
                }}
              >
                Tenant activo: {companyId.slice(0, 8)}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 14 }}>
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
                padding: "10px 16px",
                borderRadius: 14,
                fontWeight: 600,
                minWidth: 220,
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
              style={{
                background:
                  "linear-gradient(135deg,#1f3a8a,#2563eb)",
                border: "none",
                padding: "11px 18px",
                borderRadius: 14,
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                boxShadow:
                  "0 8px 22px rgba(37,99,235,0.45)",
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
            borderRadius: 22,
            padding: 28,
            minHeight: "72vh",
            boxShadow: "0 28px 60px rgba(0,0,0,0.55)",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
