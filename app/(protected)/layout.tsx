"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";

const sidebarStructure = [
  {
    section: "GENERAL",
    alwaysOpen: true,
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
      { name: "Proveedores logísticos", path: "/logistica/proveedores-logisticos" },
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

  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #0b1733, #060c1b)",
        color: "#e8edff",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif",
        display: "grid",
        gridTemplateColumns: "300px 1fr",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          background: "linear-gradient(180deg,#0b1630,#070f24)",
          borderRight: "1px solid #16254b",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* LOGO */}
        <div style={{ marginBottom: 32 }}>
          <img src="/logo.png" alt="Mobility OS" style={{ width: 180 }} />
          <div style={{ fontSize: 12, color: "#8fa7d6", marginTop: 10 }}>
            Mobility Marine
          </div>
        </div>

        {/* MENÚ */}
        <nav style={{ flex: 1 }}>
          {sidebarStructure.map((section) => {
            const isOpen =
              section.alwaysOpen || openSections.includes(section.section);

            return (
              <div
                key={section.section}
                style={{
                  marginBottom: 16,
                  background: "#0f1c3f",
                  borderRadius: 14,
                  border: "1px solid #1f2f5a",
                  padding: 10,
                }}
              >
                {/* SECTION HEADER */}
                <div
                  onClick={() =>
                    !section.alwaysOpen && toggleSection(section.section)
                  }
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#7fa1ff",
                    letterSpacing: 1,
                    marginBottom: isOpen ? 10 : 0,
                    cursor: section.alwaysOpen ? "default" : "pointer",
                  }}
                >
                  {section.section}
                </div>

                {/* ITEMS */}
                {isOpen &&
                  section.items.map((item) => {
                    const active = pathname === item.path;

                    return (
                      <div
                        key={item.name}
                        onClick={() => router.push(item.path)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 10,
                          marginBottom: 6,
                          cursor: "pointer",
                          fontWeight: 500,
                          background: active
                            ? "linear-gradient(135deg,#2563eb,#1d4ed8)"
                            : "transparent",
                          boxShadow: active
                            ? "0 8px 20px rgba(37,99,235,.35)"
                            : "none",
                        }}
                      >
                        {item.name}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </nav>

        {/* USER */}
        <div
          style={{
            borderTop: "1px solid #1f2f5a",
            paddingTop: 14,
            fontSize: 13,
            color: "#8fa7d6",
          }}
        >
          Conectado como
          <div style={{ color: "#fff", fontWeight: 600 }}>
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
            marginBottom: 24,
            background: "linear-gradient(135deg,#0f1c3f,#0b1733)",
            border: "1px solid #1f2f5a",
            borderRadius: 18,
            padding: "18px 24px",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>
              Mobility OS Platform
            </div>
            {companyId && (
              <div style={{ fontSize: 12, color: "#7fa1ff" }}>
                Tenant activo: {companyId.slice(0, 8)}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
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
                background: "linear-gradient(135deg,#1f3a8a,#2563eb)",
                border: "none",
                padding: "10px 16px",
                borderRadius: 12,
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Salir
            </button>
          </div>
        </header>

        {/* CONTENT CARD */}
        <div
          style={{
            background: "linear-gradient(180deg,#0f1c3f,#0b1733)",
            border: "1px solid #1f2f5a",
            borderRadius: 20,
            padding: 28,
            minHeight: "72vh",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
