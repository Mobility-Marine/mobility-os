"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getNavForRole } from "./navConfig";

interface SidebarProps {
  userEmail: string | null;
  userRole: string | null;
  companyName: string;
  memberships: { company_id: string; company_name?: string | null }[];
  activeCompanyId: string | null;
  onChangeCompany: (id: string) => void;
  onSignOut: () => void;
}

export default function Sidebar({
  userEmail,
  userRole,
  companyName,
  memberships,
  activeCompanyId,
  onChangeCompany,
  onSignOut,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<string[]>(["general"]);

  const visibleSections = useMemo(
    () => getNavForRole(userRole),
    [userRole]
  );

  // Abre automáticamente la sección activa
  useMemo(() => {
    visibleSections.forEach((section) => {
      const isActive = section.items.some((item) => pathname.startsWith(item.path));
      if (isActive && !openSections.includes(section.key)) {
        setOpenSections((prev) => [...prev, section.key]);
      }
    });
  }, [pathname]);

  function toggleSection(key: string) {
    setOpenSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  const initial = userEmail?.charAt(0).toUpperCase() ?? "U";

  return (
    <aside style={{
      width: "var(--sidebar-width)",
      height: "100vh",
      background: "var(--color-sidebar-bg)",
      borderRight: "1px solid var(--color-sidebar-border)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      flexShrink: 0,
    }}>

      {/* LOGO + EMPRESA */}
      <div style={{
        padding: "16px",
        borderBottom: "1px solid var(--color-sidebar-border)",
        flexShrink: 0,
      }}>
        <img
          src="/logo.png"
          alt="Mobility OS"
          style={{ width: "100%", maxWidth: "160px", height: "auto", marginBottom: "12px" }}
        />
        {memberships.length > 1 ? (
          <select
            value={activeCompanyId ?? ""}
            onChange={(e) => onChangeCompany(e.target.value)}
            style={{
              width: "100%",
              height: "32px",
              padding: "0 8px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-subtle)",
              color: "var(--color-text-primary)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {memberships.map((m) => (
              <option key={m.company_id} value={m.company_id}>
                {m.company_name ?? "Empresa"}
              </option>
            ))}
          </select>
        ) : (
          <div style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}>
            {companyName}
          </div>
        )}
      </div>

      {/* NAVEGACIÓN */}
      <nav style={{
        flex: 1,
        overflowY: "auto",
        padding: "8px",
      }}>
        {visibleSections.map((section) => {
          const isOpen = openSections.includes(section.key);
          const hasActive = section.items.some((item) => pathname.startsWith(item.path));

          return (
            <div key={section.key} style={{ marginBottom: "2px" }}>

              {/* CABECERA DE SECCIÓN */}
              <button
                onClick={() => toggleSection(section.key)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-md)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "var(--transition-fast)",
                }}
              >
                <div>
                  <div style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    color: hasActive
                      ? "var(--color-sidebar-active-text)"
                      : "var(--color-text-muted)",
                    textTransform: "uppercase",
                  }}>
                    {section.title}
                  </div>
                  <div style={{
                    fontSize: "11px",
                    color: "var(--color-text-muted)",
                    marginTop: "1px",
                  }}>
                    {section.subtitle}
                  </div>
                </div>
                <span style={{
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                  fontWeight: 600,
                }}>
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {/* ITEMS */}
              {isOpen && (
                <div style={{ paddingLeft: "4px", paddingBottom: "4px" }}>
                  {section.items.map((item) => {
                    const active = pathname === item.path || pathname.startsWith(item.path + "/");
                    return (
                      <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "7px 12px",
                          border: "none",
                          borderLeft: active
                            ? "3px solid var(--color-brand-blue)"
                            : "3px solid transparent",
                          background: active
                            ? "var(--color-sidebar-active-bg)"
                            : "transparent",
                          color: active
                            ? "var(--color-sidebar-active-text)"
                            : "var(--color-sidebar-text)",
                          fontSize: "13px",
                          fontWeight: active ? 600 : 400,
                          cursor: "pointer",
                          transition: "var(--transition-fast)",
                          marginBottom: "1px",
                          borderRadius: "0 var(--radius-md) var(--radius-md) 0",
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

      {/* USUARIO + SALIR */}
      <div style={{
        padding: "12px",
        borderTop: "1px solid var(--color-sidebar-border)",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 10px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-bg-subtle)",
        }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "var(--radius-full)",
            background: "var(--color-brand-blue)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            fontWeight: 700,
            flexShrink: 0,
          }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--color-text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {userEmail}
            </div>
            <div style={{
              fontSize: "11px",
              color: "var(--color-text-muted)",
              textTransform: "capitalize",
            }}>
              {userRole ?? "usuario"}
            </div>
          </div>
          <button
            onClick={onSignOut}
            title="Cerrar sesión"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              fontSize: "16px",
              padding: "4px",
              borderRadius: "var(--radius-sm)",
              flexShrink: 0,
            }}
          >
            ↪
          </button>
        </div>
      </div>
    </aside>
  );
}
