"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import { executeCommand } from "@/lib/actions/actionEngine";

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

const iconButton: React.CSSProperties = {
  height: 40,
  width: 40,
  minWidth: 40,
  borderRadius: 10,
  background: "#0f141b",
  border: "1px solid #1b222c",
  color: "#c5cfdb",
  fontSize: 16,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all .18s ease",
};

const headerPill: React.CSSProperties = {
  height: 40,
  display: "inline-flex",
  alignItems: "center",
  padding: "0 12px",
  borderRadius: 10,
  background: "#0f141b",
  border: "1px solid #1b222c",
  fontSize: 12,
  fontWeight: 650,
  color: "#b8c3d1",
};

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
  const [globalSearch, setGlobalSearch] = useState("");
  
  const [hubOpen, setHubOpen] = useState(false);

  const [commandResult, setCommandResult] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    setOpenSections((prev) =>
      prev.includes(current.sectionKey)
        ? prev
        : [...prev, current.sectionKey]
    );
  }, [current.sectionKey]);

  useEffect(() => {
  function handler(e: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().includes("MAC");

    if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setHubOpen((v) => !v);
    }

    if (e.key === "Escape") setHubOpen(false);
  }

  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, []);

  function toggleSection(sectionKey: string) {
    setOpenSections((prev) =>
      prev.includes(sectionKey)
        ? prev.filter((key) => key !== sectionKey)
        : [...prev, sectionKey]
    );
  }

  function handleGlobalSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = globalSearch.trim().toLowerCase();

    if (!query) return;

    for (const section of navSections) {
      const exactItem = section.items.find(
        (item) =>
          item.name.toLowerCase() === query ||
          item.path.toLowerCase() === query
      );

      if (exactItem) {
        router.push(exactItem.path);
        setGlobalSearch("");
        return;
      }
    }

    for (const section of navSections) {
      const partialItem = section.items.find(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.path.toLowerCase().includes(query)
      );

      if (partialItem) {
        router.push(partialItem.path);
        setGlobalSearch("");
        return;
      }
    }
  }

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  const [commandText, setCommandText] = useState("");

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
          background:
            "radial-gradient(circle at top left, rgba(122,162,255,0.06), transparent 24%), #0b0f14",
          borderRight: "1px solid #181d24",
          padding: 20,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: 18,
            borderRadius: 18,
            background:
              "linear-gradient(180deg, rgba(17,22,30,0.96) 0%, rgba(13,17,24,0.96) 100%)",
            border: "1px solid #1b222c",
            marginBottom: 18,
            boxShadow: "0 16px 40px rgba(0,0,0,0.28)",
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
                  borderRadius: 16,
                  overflow: "hidden",
                  background: hasActive ? "#0f141b" : "#0c1117",
                  boxShadow: hasActive
                    ? "0 10px 24px rgba(0,0,0,0.18)"
                    : "none",
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
              borderRadius: 14,
              background: "#0f141b",
              border: "1px solid #1b222c",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#7aa2ff",
                color: "#0a0d12",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {userInitial}
            </div>

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
    height: 86,
    borderBottom: "1px solid #181d24",
    background:
      "radial-gradient(circle at top center, rgba(122,162,255,0.05), transparent 24%), #0a0d12",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    gap: 18,
  }}
>
  {/* IZQUIERDA — TÍTULO COMPLETO */}
  <div
    style={{
      flexShrink: 0,
      minWidth: "fit-content",
    }}
  >
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

  {/* DERECHA — COMMAND HUB */}
  <div
    style={{
      flex: 1,
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 10,
    }}
  >
    {/* BUSCADOR FLEXIBLE */}
    <form
      onSubmit={handleGlobalSearch}
      style={{
        flex: "1 1 80px",
        minWidth: 80,
        maxWidth: 320,
        display: "flex",
      }}
    >
      <input
        value={globalSearch}
        onChange={(e) => setGlobalSearch(e.target.value)}
        placeholder="Buscar o ejecutar…"
        style={{
          width: "100%",
          minWidth: 0,
          height: 40,
          padding: "0 14px",
          borderRadius: 10,
          background: "#0f141b",
          border: "1px solid #263140",
          color: "#f7f9fb",
          fontWeight: 500,
          outline: "none",
        }}
      />
    </form>

    <button type="button" style={iconButton} title="Notificaciones">
      🔔
    </button>

    <button type="button" style={iconButton} title="Mensajes internos">
      💬
    </button>

    <button
  type="button"
  onClick={() => setHubOpen(true)}
  style={{
    ...iconButton,
    width: "auto",
    minWidth: 48,
    padding: "0 12px",
    background: "#7aa2ff",
    color: "#0a0d12",
    fontWeight: 800,
    border: "1px solid #7aa2ff",
  }}
  title="Command Hub"
>
  IA
</button>

    {companyId && (
      <div
        style={{
          height: 40,
          padding: "4px 12px",
          borderRadius: 10,
          background: "#0f141b",
          border: "1px solid #1b222c",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          lineHeight: 1.05,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "#7f8da3",
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          TENANT
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#cfe1ff",
            fontWeight: 700,
          }}
        >
          {companyId.slice(0, 8)}
        </div>
      </div>
    )}

    <select
      value={companyId || ""}
      onChange={async (e) => {
        await setActiveCompany(e.target.value);
        window.location.reload();
      }}
      style={{
        minWidth: 200,
        height: 40,
        padding: "0 12px",
        borderRadius: 10,
        background: "#0f141b",
        border: "1px solid #263140",
        color: "#f7f9fb",
        fontWeight: 650,
        flexShrink: 0,
      }}
    >
      {memberships.map((m) => (
        <option key={m.id} value={m.company_id}>
          {m.company_name}
        </option>
      ))}
    </select>

    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "#7aa2ff",
        color: "#0a0d12",
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        border: "1px solid #7aa2ff",
        boxShadow: "0 6px 18px rgba(122,162,255,0.35)",
        flexShrink: 0,
      }}
      title={user?.email || "Usuario"}
    >
      {userInitial}
    </div>

    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.replace("/login");
      }}
      style={{
        height: 40,
        padding: "0 16px",
        borderRadius: 10,
        background: "#f4f6f8",
        color: "#0a0d12",
        border: "1px solid #f4f6f8",
        fontWeight: 750,
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      Salir
    </button>
  </div>
</header>

  {/* CONTENIDO */}
  <section
    style={{
      flex: 1,
      minHeight: "calc(100vh - 86px)",
      background: "#07090d",
      padding: 24,
    }}
  >
    <div
      style={{
        minHeight: "calc(100vh - 134px)",
        borderRadius: 20,
        background:
          "radial-gradient(circle at top center, rgba(122,162,255,0.04), transparent 18%), #0b0f14",
        border: "1px solid #181d24",
        padding: 28,
        boxShadow: "0 18px 50px rgba(0,0,0,0.24)",
      }}
    >
      {children}
    </div>
  </section>

{hubOpen && (
  <div
    onClick={() => setHubOpen(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(6,8,12,0.72)",
      backdropFilter: "blur(10px)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      paddingTop: "10vh",
      zIndex: 9999,
    }}
  >
    {/* PANEL */}
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "min(900px, 92vw)",
        borderRadius: 20,
        background:
          "linear-gradient(180deg,#0f141b 0%, #0b0f14 100%)",
        border: "1px solid #1b2430",
        boxShadow: "0 40px 120px rgba(0,0,0,0.55)",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: 18,
          borderBottom: "1px solid #1a212c",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
       <input
  autoFocus
  value={commandText}
  onChange={(e) => setCommandText(e.target.value)}
  onKeyDown={async (e) => {
    if (e.key === "Enter") {
      if (!commandText.trim()) return;

      setIsExecuting(true);
      setCommandResult(null);

      try {
        let result;

        try {
          // 👉 Acción interna
          result = await executeCommand(commandText, {
            companyId,
            userId: user?.id,
          });
        } catch {
          // 👉 Fallback IA
          const aiResponse = await fetch("/api/ai/command", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: commandText }),
          });

          const aiData = await aiResponse.json();
          result = aiData.result;
        }

        setCommandResult(
          typeof result === "string"
            ? result
            : JSON.stringify(result, null, 2)
        );
      } catch (err: any) {
        setCommandResult(err.message || "Error ejecutando comando");
      } finally {
        setIsExecuting(false);
      }
    }
  }}
  placeholder="Escribe un comando, módulo o pregunta…"
  style={{
    flex: 1,
    height: 48,
    borderRadius: 12,
    background: "#070a0f",
    border: "1px solid #263140",
    padding: "0 16px",
    color: "#fff",
    fontSize: 16,
    outline: "none",
  }}
/>
        <div
          style={{
            fontSize: 12,
            color: "#7f8da3",
            fontWeight: 600,
          }}
        >
          ESC
        </div>
      </div>

{isExecuting && (
  <div
    style={{
      padding: 20,
      textAlign: "center",
      color: "#7aa2ff",
      fontWeight: 700,
    }}
  >
    Ejecutando comando…
  </div>
)}

{commandResult && (
  <div
    style={{
      padding: 16,
      margin: 10,
      borderRadius: 12,
      background: "#0b1118",
      border: "1px solid #263140",
      whiteSpace: "pre-wrap",
      fontSize: 13,
      color: "#cfe1ff",
      fontFamily: "monospace",
    }}
  >
    {commandResult}
  </div>
)}
      
      {/* RESULTADOS */}
      <div
        style={{
          maxHeight: "60vh",
          overflowY: "auto",
          padding: 10,
          display: "grid",
          gap: 6,
        }}
      >
        {navSections.flatMap((section) =>
          section.items.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                router.push(item.path);
                setHubOpen(false);
              }}
              style={{
                textAlign: "left",
                padding: "14px 16px",
                borderRadius: 12,
                background: "#0f141b",
                border: "1px solid #1b2430",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#eaf0f8",
                }}
              >
                {item.name}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "#7f8da3",
                }}
              >
                {section.title}
              </div>
            </button>
          ))
        )}
      </div>

      {/* FOOTER */}
      <div
        style={{
          padding: "10px 14px",
          borderTop: "1px solid #1a212c",
          fontSize: 12,
          color: "#7f8da3",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>⌘/Ctrl + K</span>
        <span>Mobility OS Command Hub</span>
      </div>
    </div>
  </div>
)}
        
</main>
    </div>
  );
}
