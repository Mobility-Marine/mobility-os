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
    title: "GENERAL",
    subtitle: "Base operativa",
    items: [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Agenda", path: "/agenda" },
    ],
  },
  {
    key: "comercial",
    title: "COMERCIAL",
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
    title: "LOGÍSTICA",
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
    title: "COMPRAS & ABASTECIMIENTO",
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
    title: "FINANZAS",
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
    title: "ADMINISTRACIÓN",
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
    sectionTitle: "GENERAL",
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
        display: "grid",
        gridTemplateColumns: "312px 1fr",
        background: "#07090d",
        color: "#f3f5f7",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, sans-serif",
      }}
    >
      <aside
        style={{
          background: "#0b0f14",
          borderRight: "1px solid #181d24",
          padding: 20,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: 18,
            borderRadius: 16,
            background: "#0f141b",
            border: "1px solid #1b222c",
            marginBottom: 18,
          }}
        >
          <img
            src="/logo.png"
            alt="Mobility OS"
            style={{
              width: 180,
              display: "block",
            }}
          />

          <div
            style={{
              marginTop: 14,
              fontSize: 11,
              color: "#8b98ab",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Workspace
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 26,
              fontWeight: 750,
              lineHeight: 1.05,
              color: "#f7f9fb",
            }}
          >
            Mobility Marine
          </div>
        </div>

        <nav>
          {navSections.map((section) => {
            const open = openSections.includes(section.key);
            const hasActive = section.items.some(
              (item) => item.path === pathname
            );

            return (
              <div
                key={section.key}
                style={{
                  marginBottom: 10,
                  border: "1px solid #171d25",
                  borderRadius: 14,
                  overflow: "hidden",
                  background: hasActive ? "#0f141b" : "#0c1117",
                }}
              >
                <button
                  onClick={() => toggleSection(section.key)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    color: "#e8edf3",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 14px 12px 14px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 1.1,
                        color: hasActive ? "#dfe7f3" : "#9aa8bb",
                      }}
                    >
                      {section.title}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 12,
                        color: "#6f7b8d",
                      }}
                    >
                      {section.subtitle}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 15,
                      color: "#8d99aa",
                      fontWeight: 700,
                      paddingLeft: 12,
                    }}
                  >
                    {open ? "−" : "+"}
                  </div>
                </button>

                {open && (
                  <div
                    style={{
                      padding: "0 8px 10px 8px",
                      display: "grid",
                      gap: 4,
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
                            background: active ? "#131a23" : "transparent",
                            color: active ? "#ffffff" : "#c5cfdb",
                            border: active
                              ? "1px solid #273142"
                              : "1px solid transparent",
                            borderLeft: active
                              ? "3px solid #7aa2ff"
                              : "3px solid transparent",
                            borderRadius: 10,
                            padding: "10px 12px",
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: active ? 650 : 500,
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
            paddingTop: 16,
            borderTop: "1px solid #171d25",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#8b98ab",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Usuario
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: "#0f141b",
              border: "1px solid #1b222c",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "#f7f9fb",
                fontWeight: 650,
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
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            height: 72,
            borderBottom: "1px solid #181d24",
            background: "#0a0d12",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            gap: 16,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1.1,
                color: "#8b98ab",
                fontWeight: 700,
              }}
            >
              {current.sectionTitle}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 30,
                lineHeight: 1,
                fontWeight: 780,
                color: "#f7f9fb",
              }}
            >
              {current.itemName}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {companyId && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "#0f141b",
                  border: "1px solid #1b222c",
                  fontSize: 12,
                  fontWeight: 650,
                  color: "#b8c3d1",
                }}
              >
                Tenant activo: {companyId.slice(0, 8)}
              </div>
            )}

            <select
              value={companyId || ""}
              onChange={async (e) => {
                await setActiveCompany(e.target.value);
                window.location.reload();
              }}
              style={{
                minWidth: 220,
                height: 42,
                padding: "0 14px",
                borderRadius: 10,
                background: "#0f141b",
                border: "1px solid #263140",
                color: "#f7f9fb",
                fontWeight: 650,
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
                height: 42,
                padding: "0 16px",
                borderRadius: 10,
                background: "#f4f6f8",
                color: "#0a0d12",
                border: "1px solid #f4f6f8",
                fontWeight: 750,
                cursor: "pointer",
              }}
            >
              Salir
            </button>
          </div>
        </header>

        <section
          style={{
            flex: 1,
            minHeight: "calc(100vh - 72px)",
            background: "#07090d",
            padding: 24,
          }}
        >
          <div
            style={{
              minHeight: "calc(100vh - 120px)",
              borderRadius: 18,
              background: "#0b0f14",
              border: "1px solid #181d24",
              padding: 28,
            }}
          >
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}
