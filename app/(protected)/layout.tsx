"use client";

import React, { useEffect, useMemo, useState } from "react";
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

const navSections: NavSection[] = [
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
    subtitle: "Inventario y suministro",
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

function getCurrentItem(pathname: string) {
  for (const section of navSections) {
    const item = section.items.find((x) => x.path === pathname);
    if (item) {
      return {
        sectionKey: section.key,
        sectionTitle: section.title,
        itemName: item.name,
      };
    }
  }

  return {
    sectionKey: "general",
    sectionTitle: "General",
    itemName: "Mobility OS",
  };
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

  const current = useMemo(() => getCurrentItem(pathname), [pathname]);

  const [openSections, setOpenSections] = useState<string[]>([]);

  useEffect(() => {
    setOpenSections((prev) =>
      prev.includes(current.sectionKey)
        ? prev
        : [...prev, current.sectionKey]
    );
  }, [current.sectionKey]);

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
        color: "#EEF4FF",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, sans-serif",
        background:
          "radial-gradient(circle at 0% 0%, #173A87 0%, #0A1634 26%, #040A17 58%, #02050C 100%)",
        display: "grid",
        gridTemplateColumns: "340px 1fr",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          position: "relative",
          padding: 24,
          borderRight: "1px solid rgba(140,170,255,0.10)",
          background:
            "linear-gradient(180deg, rgba(7,13,28,0.88) 0%, rgba(4,8,18,0.94) 100%)",
          backdropFilter: "blur(18px)",
          overflowY: "auto",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -80,
            width: 280,
            height: 280,
            borderRadius: 999,
            background: "rgba(38, 104, 255, 0.18)",
            filter: "blur(90px)",
            pointerEvents: "none",
          }}
        />

        {/* Brand Card */}
        <div
          style={{
            position: "relative",
            marginBottom: 18,
            padding: 20,
            borderRadius: 26,
            background:
              "linear-gradient(180deg, rgba(15,29,66,0.96) 0%, rgba(8,16,36,0.92) 100%)",
            border: "1px solid rgba(120,150,255,0.14)",
            boxShadow:
              "0 24px 54px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <img
            src="/logo.png"
            alt="Mobility OS"
            style={{
              width: 196,
              display: "block",
              filter: "drop-shadow(0 0 18px rgba(59,130,246,0.22))",
            }}
          />

          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#8EA6D9",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                }}
              >
                Workspace
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#F8FBFF",
                  lineHeight: 1.1,
                }}
              >
                Mobility Marine
              </div>
            </div>

            <div
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                color: "#A8C1FF",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                whiteSpace: "nowrap",
              }}
            >
              SaaS OS
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ position: "relative" }}>
          {navSections.map((section) => {
            const open = openSections.includes(section.key);
            const hasActive = section.items.some(
              (item) => item.path === pathname
            );

            return (
              <div
                key={section.key}
                style={{
                  marginBottom: 14,
                  borderRadius: 24,
                  overflow: "hidden",
                  background: hasActive
                    ? "linear-gradient(180deg, rgba(16,33,76,0.94) 0%, rgba(8,16,37,0.92) 100%)"
                    : "linear-gradient(180deg, rgba(10,18,40,0.80) 0%, rgba(6,11,24,0.72) 100%)",
                  border: hasActive
                    ? "1px solid rgba(98,145,255,0.24)"
                    : "1px solid rgba(120,150,255,0.08)",
                  boxShadow: hasActive
                    ? "0 18px 38px rgba(9,20,51,0.34)"
                    : "none",
                }}
              >
                <button
                  onClick={() => toggleSection(section.key)}
                  style={{
                    width: "100%",
                    padding: 18,
                    background: "transparent",
                    border: "none",
                    color: "#EAF0FF",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    textAlign: "left",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 1.35,
                        fontWeight: 800,
                        color: hasActive ? "#A6BEFF" : "#7F9AD3",
                      }}
                    >
                      {section.title}
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        color: "#7188B8",
                      }}
                    >
                      {section.subtitle}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#D9E4FF",
                      fontWeight: 800,
                      fontSize: 14,
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
                            padding: "14px 16px",
                            borderRadius: 18,
                            cursor: "pointer",
                            border: active
                              ? "1px solid rgba(104,150,255,0.60)"
                              : "1px solid rgba(255,255,255,0.05)",
                            background: active
                              ? "linear-gradient(135deg, #2E6CFF 0%, #1E4FDB 100%)"
                              : "linear-gradient(180deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.015) 100%)",
                            color: active ? "#FFFFFF" : "#DCE7FF",
                            fontSize: 15,
                            fontWeight: active ? 750 : 560,
                            boxShadow: active
                              ? "0 16px 30px rgba(34,92,255,0.34)"
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

        {/* Session */}
        <div
          style={{
            marginTop: 18,
            paddingTop: 18,
            borderTop: "1px solid rgba(120,150,255,0.10)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#8EA6D9",
              marginBottom: 8,
            }}
          >
            Sesión activa
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 18,
              background:
                "linear-gradient(180deg, rgba(14,27,59,0.84) 0%, rgba(8,16,34,0.82) 100%)",
              border: "1px solid rgba(120,150,255,0.08)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1.4,
                wordBreak: "break-word",
              }}
            >
              {user?.email}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main
        style={{
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        {/* Command Header */}
        <header
          style={{
            borderRadius: 30,
            padding: 24,
            background:
              "linear-gradient(135deg, rgba(14,29,69,0.94) 0%, rgba(7,15,36,0.90) 100%)",
            border: "1px solid rgba(120,150,255,0.14)",
            boxShadow:
              "0 28px 58px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.04)",
            backdropFilter: "blur(16px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 1.1,
                color: "#86A3E8",
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              {current.sectionTitle}
            </div>

            <div
              style={{
                fontSize: 40,
                lineHeight: 1.05,
                fontWeight: 850,
                color: "#F7FAFF",
              }}
            >
              {current.itemName}
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              {companyId && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#A6BEFF",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  Tenant activo: {companyId.slice(0, 8)}
                </div>
              )}

              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#B8C8F2",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                Plataforma operativa con IA
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "flex-end",
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
                borderRadius: 18,
                background:
                  "linear-gradient(180deg, rgba(5,10,24,0.96) 0%, rgba(7,15,36,0.96) 100%)",
                color: "#FFFFFF",
                border: "1px solid rgba(95,147,255,0.35)",
                fontWeight: 750,
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
                borderRadius: 18,
                border: "1px solid rgba(95,147,255,0.42)",
                background:
                  "linear-gradient(135deg, #2E6CFF 0%, #1F4ED8 100%)",
                color: "#FFFFFF",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 16px 28px rgba(33,92,255,0.30)",
              }}
            >
              Salir
            </button>
          </div>
        </header>

        {/* Main Surface */}
        <section
          style={{
            flex: 1,
            minHeight: "72vh",
            borderRadius: 34,
            padding: 34,
            background:
              "linear-gradient(180deg, rgba(14,28,66,0.95) 0%, rgba(7,14,35,0.91) 100%)",
            border: "1px solid rgba(120,150,255,0.12)",
            boxShadow:
              "0 32px 64px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.03)",
            backdropFilter: "blur(16px)",
          }}
        >
          {children}
        </section>
      </main>
    </div>
  );
}
