"use client";

import React, { useState } from "react";
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

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const { user } = useAuth();
  const { companyId, memberships, setActiveCompany } = useTenant();

  const [openSection, setOpenSection] = useState("GENERAL");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 20% 20%, #0a1a3f, #050b18)",
        color: "#e8edff",
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          padding: 24,
          borderRight: "1px solid rgba(120,150,255,0.15)",
          backdropFilter: "blur(12px)",
          background: "rgba(6,12,27,0.75)",
          overflowY: "auto",
        }}
      >
        {/* LOGO */}
        <div style={{ marginBottom: 26 }}>
          <img
            src="/logo.png"
            alt="Mobility OS"
            style={{
              width: 190,
              filter: "drop-shadow(0 0 20px rgba(59,130,246,0.35))",
            }}
          />
          <div style={{ fontSize: 12, color: "#8fa7d6", marginTop: 10 }}>
            Mobility Marine
          </div>
        </div>

        {/* ÁREAS */}
        {sidebarStructure.map((section) => {
          const isOpen = openSection === section.section;

          return (
            <div
              key={section.section}
              style={{
                marginBottom: 18,
                borderRadius: 16,
                padding: "12px 12px",
                background: isOpen
                  ? "rgba(37,99,235,0.08)"
                  : "transparent",
                border: "1px solid rgba(120,150,255,0.08)",
              }}
            >
              {/* HEADER ÁREA */}
              <div
                onClick={() =>
                  setOpenSection(isOpen ? "" : section.section)
                }
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: "#7fa1ff",
                  cursor: "pointer",
                  marginBottom: isOpen ? 10 : 0,
                }}
              >
                {section.section}
              </div>

              {/* MÓDULOS */}
              {isOpen &&
                section.items.map((item) => {
                  const active = pathname === item.path;

                  return (
                    <div
                      key={item.name}
                      onClick={() => router.push(item.path)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        marginBottom: 6,
                        cursor: "pointer",
                        fontWeight: 500,
                        fontSize: 14,
                        background: active
                          ? "linear-gradient(135deg,#2563eb,#1d4ed8)"
                          : "rgba(255,255,255,0.02)",
                        border: active
                          ? "1px solid #3b82f6"
                          : "1px solid rgba(255,255,255,0.05)",
                        boxShadow: active
                          ? "0 10px 28px rgba(37,99,235,0.45)"
                          : "none",
                        transition: "all .15s ease",
                      }}
                    >
                      {item.name}
                    </div>
                  );
                })}
            </div>
          );
        })}

        {/* USUARIO */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid rgba(120,150,255,0.15)",
            fontSize: 13,
            color: "#8fa7d6",
          }}
        >
          Conectado como
          <div style={{ color: "#fff", marginTop: 4, fontWeight: 600 }}>
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
            padding: "18px 24px",
            borderRadius: 18,
            background: "rgba(15,28,63,0.8)",
            border: "1px solid rgba(120,150,255,0.2)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>Mobility OS Platform</div>
            {companyId && (
              <div style={{ fontSize: 12, color: "#7fa1ff" }}>
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
                padding: "11px 18px",
                borderRadius: 14,
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Salir
            </button>
          </div>
        </header>

        {/* CONTENIDO */}
        <div
          style={{
            background: "rgba(15,28,63,0.85)",
            border: "1px solid rgba(120,150,255,0.15)",
            borderRadius: 24,
            padding: 32,
            minHeight: "72vh",
            backdropFilter: "blur(6px)",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
