"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";

type NavItem = {
  name: string;
  path: string;
};

type NavSection = {
  key: string;
  title: string;
  subtitle: string;
  items: NavItem[];
};

const sidebarStructure: NavSection[] = [
  {
    key: "general",
    title: "General",
    subtitle: "Base operativa",
    items: [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Agenda", path: "/agenda" },
    ],
  },
  {
    key: "comercial",
    title: "Comercial",
    subtitle: "Ventas y relación",
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
    key: "logistica",
    title: "Logística",
    subtitle: "Operación del servicio",
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
    key: "abastecimiento",
    title: "Compras & Abastecimiento",
    subtitle: "Compras e inventario",
    items: [
      { name: "Proveedores", path: "/abastecimiento/proveedores" },
      { name: "Compras", path: "/abastecimiento/compras" },
      {
        name: "Órdenes de compra",
        path: "/abastecimiento/ordenes-compra",
      },
      { name: "Inventarios", path: "/abastecimiento/inventarios" },
      { name: "Recepciones", path: "/abastecimiento/recepciones" },
      { name: "Costos", path: "/abastecimiento/costos" },
    ],
  },
  {
    key: "finanzas",
    title: "Finanzas",
    subtitle: "Control económico",
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
    key: "administracion",
    title: "Administración",
    subtitle: "Plataforma y soporte",
    items: [
      { name: "Reportes", path: "/reports" },
      { name: "Empresa", path: "/company" },
      { name: "Configuración", path: "/settings" },
      { name: "Ayuda", path: "/help" },
    ],
  },
];

function getCurrentPageTitle(pathname: string) {
  for (const section of sidebarStructure) {
    const item = section.items.find((x) => x.path === pathname);
    if (item) return item.name;
  }
  return "Mobility OS";
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const { user } = useAuth();
  const { companyId, memberships, setActiveCompany } = useTenant();

  const activeSectionKey = useMemo(() => {
    return (
      sidebarStructure.find((section) =>
        section.items.some((item) => item.path === pathname)
      )?.key ?? "general"
    );
  }, [pathname]);

  const [openSections, setOpenSections] = useState<string[]>([]);

  useEffect(() => {
    setOpenSections((prev) =>
      prev.includes(activeSectionKey) ? prev : [...prev, activeSectionKey]
    );
  }, [activeSectionKey]);

  const currentPageTitle = getCurrentPageTitle(pathname);

  function toggleSection(sectionKey: string) {
    setOpenSections((prev) =>
      prev.includes(sectionKey)
        ? prev.filter((key) => key !== sectionKey)
        : [...prev, sectionKey]
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #112a63 0%, #091327 34%, #050913 68%, #03050b 100%)",
        color: "#e9eefc",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, sans-serif",
        display: "grid",
        gridTemplateColumns: "336px 1fr",
      }}
    >
      <aside
        style={{
          padding: 22,
          borderRight: "1px solid rgba(115,146,255,0.10)",
          background:
            "linear-gradient(180deg, rgba(7,14,30,0.90) 0%, rgba(5,10,22,0.94) 100%)",
          backdropFilter: "blur(18px)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            marginBottom: 18,
            padding: 18,
            borderRadius: 24,
            background:
              "linear-gradient(180deg, rgba(17,31,67,0.95) 0%, rgba(9,18,40,0.92) 100%)",
            border: "1px solid rgba(115,146,255,0.14)",
            boxShadow:
              "0 24px 44px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          <img
            src="/logo.png"
            alt="Mobility OS"
            style={{
              width: 188,
              display: "block",
              filter: "drop-shadow(0 0 20px rgba(59,130,246,0.25))",
            }}
          />
          <div
            style={{
              marginTop: 14,
              color: "#8ea6d9",
              fontSize: 12,
              letterSpacing: 0.5,
            }}
          >
            Mobility Marine
          </div>
        </div>

        <div
          style={{
            marginBottom: 18,
            padding: 16,
            borderRadius: 20,
            background:
              "linear-gradient(180deg, rgba(14,27,59,0.88) 0%, rgba(8,16,34,0.86) 100%)",
            border: "1px solid rgba(115,146,255,0.10)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#7fa1ff",
              textTransform: "uppercase",
              letterSpacing: 1.2,
              fontWeight: 800,
              marginBottom: 6,
            }}
          >
            Módulo actual
          </div>
          <div
            style={{
              fontSize: 22,
              lineHeight: 1.15,
              fontWeight: 800,
              color: "#f4f7ff",
            }}
          >
            {currentPageTitle}
          </div>
        </div>

        <nav>
          {sidebarStructure.map((section) => {
            const open = openSections.includes(section.key);
            const hasActiveItem = section.items.some(
              (item) => item.path === pathname
            );

            return (
              <div
                key={section.key}
                style={{
                  marginBottom: 14,
                  borderRadius: 22,
                  overflow: "hidden",
                  background: hasActiveItem
                    ? "linear-gradient(180deg, rgba(20,37,80,0.92) 0%, rgba(9,18,41,0.90) 100%)"
                    : "linear-gradient(180deg, rgba(11,18,38,0.82) 0%, rgba(7,12,26,0.72) 100%)",
                  border: hasActiveItem
                    ? "1px solid rgba(96,147,255,0.24)"
                    : "1px solid rgba(115,146,255,0.08)",
                  boxShadow: hasActiveItem
                    ? "0 16px 34px rgba(9,22,54,0.36)"
                    : "none",
                }}
              >
                <button
                  onClick={() => toggleSection(section.key)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    padding: 16,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "left",
                    color: "#e9eefc",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: hasActiveItem ? "#9bb6ff" : "#7e9ad3",
                        textTransform: "uppercase",
                        letterSpacing: 1.2,
                        fontWeight: 800,
                      }}
                    >
                      {section.title}
                    </div>
                    <div
                      style={{
                        marginTop: 5,
                        fontSize: 12,
                        color: "#7e94c2",
                      }}
                    >
                      {section.subtitle}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#dbe5ff",
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {open ? "−" : "+"}
                  </div>
                </button>

                {open && (
                  <div
                    style={{
                      padding: "0 12px 12px 12px",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    {section.items.map((item) => {
                      const active = pathname === item.path;

                      return (
                        <button
                          key={item.name}
                          onClick={() => router.push(item.path)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "13px 16px",
                            borderRadius: 16,
                            border: active
                              ? "1px solid rgba(101,152,255,0.58)"
                              : "1px solid rgba(255,255,255,0.05)",
                            cursor: "pointer",
                            color: active ? "#ffffff" : "#dce6ff",
                            fontSize: 14,
                            fontWeight: active ? 700 : 550,
                            background: active
                              ? "linear-gradient(135deg, #2e6cff 0%, #1f4ed8 100%)"
                              : "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)",
                            boxShadow: active
                              ? "0 16px 28px rgba(33,92,255,0.34)"
                              : "none",
                            transition: "all .18s ease",
                          }}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div
          style={{
            marginTop: 18,
            paddingTop: 18,
            borderTop: "1px solid rgba(115,146,255,0.10)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#8fa7d6",
              marginBottom: 8,
            }}
          >
            Sesión activa
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 16,
              background:
                "linear-gradient(180deg, rgba(14,27,59,0.84) 0%, rgba(8,16,34,0.82) 100%)",
              border: "1px solid rgba(115,146,255,0.08)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#ffffff",
                wordBreak: "break-word",
                lineHeight: 1.35,
              }}
            >
              {user?.email}
            </div>
          </div>
        </div>
      </aside>

      <main
        style={{
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <header
          style={{
            borderRadius: 26,
            padding: 24,
            background:
              "linear-gradient(135deg, rgba(14,29,69,0.92) 0%, rgba(7,15,36,0.88) 100%)",
            border: "1px solid rgba(115,146,255,0.14)",
            boxShadow:
              "0 26px 54px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.03)",
            backdropFilter: "blur(14px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                color: "#8fa7d6",
                marginBottom: 6,
                letterSpacing: 0.2,
              }}
            >
              Mobility OS Platform
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: "#f5f8ff",
                lineHeight: 1.1,
              }}
            >
              {currentPageTitle}
            </div>
            {companyId && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "#7fa1ff",
                  fontWeight: 700,
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
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <select
              value={companyId || ""}
              onChange={async (e) => {
                await setActiveCompany(e.target.value);
                window.location.reload();
              }}
              style={{
                minWidth: 220,
                padding: "12px 16px",
                borderRadius: 16,
                background:
                  "linear-gradient(180deg, rgba(5,10,24,0.96) 0%, rgba(7,15,36,0.96) 100%)",
                color: "#ffffff",
                border: "1px solid rgba(95,147,255,0.35)",
                fontWeight: 700,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
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
                padding: "12px 18px",
                borderRadius: 16,
                border: "1px solid rgba(95,147,255,0.42)",
                background:
                  "linear-gradient(135deg, #2e6cff 0%, #1f4ed8 100%)",
                color: "#ffffff",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 16px 28px rgba(33,92,255,0.30)",
              }}
            >
              Salir
            </button>
          </div>
        </header>

        <section
          style={{
            flex: 1,
            minHeight: "72vh",
            borderRadius: 30,
            padding: 32,
            background:
              "linear-gradient(180deg, rgba(14,28,66,0.94) 0%, rgba(7,14,35,0.90) 100%)",
            border: "1px solid rgba(115,146,255,0.12)",
            boxShadow:
              "0 30px 60px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.03)",
            backdropFilter: "blur(14px)",
          }}
        >
          {children}
        </section>
      </main>
    </div>
  );
}
