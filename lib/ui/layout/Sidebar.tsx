"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getNavForRole } from "./navConfig";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface SidebarProps {
  userEmail:       string | null;
  userRole:        string | null;
  companyName:     string;
  memberships:     { company_id: string; company_name?: string | null }[];
  activeCompanyId: string | null;
  onChangeCompany: (id: string) => void;
  onSignOut:       () => void;
}

export default function Sidebar({
  userEmail, userRole, companyName,
  memberships, activeCompanyId, onChangeCompany, onSignOut,
}: SidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const { t }   = useTranslation();

  const visibleSections = useMemo(() => getNavForRole(userRole), [userRole]);

  const getActiveSection = (path: string) =>
    visibleSections.find((s) => s.items.some((i) => path.startsWith(i.path)))?.key ?? "general";

  const [openSections, setOpenSections] = useState<string[]>(() => [getActiveSection(pathname)]);

  useEffect(() => {
    const active = getActiveSection(pathname);
    setOpenSections([active]);
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
      display: "flex", flexDirection: "column",
      overflow: "hidden", flexShrink: 0,
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
          style={{
            display: "block",
            width: "auto",
            maxWidth: "160px",
            height: "auto",
            margin: "0 auto 12px",
            // Filtro para logo blanco sobre fondo azul en modo claro
            filter: "brightness(0) invert(1)",
          }}
        />

        {/* Workspace label */}
        <div style={{
          fontSize: "9px", fontWeight: 600, letterSpacing: "1px",
          textTransform: "uppercase",
          color: "var(--color-sidebar-muted, rgba(255,255,255,0.5))",
          textAlign: "center", marginBottom: "4px",
        }}>
          WORKSPACE
        </div>

        {memberships.length > 1 ? (
          <select
            value={activeCompanyId ?? ""}
            onChange={(e) => onChangeCompany(e.target.value)}
            style={{
              width: "100%", height: "32px", padding: "0 8px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-sidebar-border)",
              background: "rgba(255,255,255,0.12)",
              color: "var(--color-sidebar-active-text)",
              fontSize: "13px", fontWeight: 500, cursor: "pointer",
            }}
          >
            {memberships.map((m) => (
              <option key={m.company_id} value={m.company_id}
                style={{ background: "#274B97", color: "#fff" }}>
                {m.company_name ?? "Empresa"}
              </option>
            ))}
          </select>
        ) : (
          <div style={{
            fontSize: "14px", fontWeight: 600,
            color: "var(--color-sidebar-active-text)",
            textAlign: "center",
          }}>
            {companyName}
          </div>
        )}
      </div>

      {/* NAVEGACIÓN */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {visibleSections.map((section) => {
          const isOpen    = openSections.includes(section.key);
          const hasActive = section.items.some((item) => pathname.startsWith(item.path));
          const title    = (t.nav as any)[section.titleKey]    ?? section.titleKey;
          const subtitle = (t.nav as any)[section.subtitleKey] ?? section.subtitleKey;

          return (
            <div key={section.key} style={{ marginBottom: "2px" }}>
              {/* CABECERA SECCIÓN */}
              <button
                onClick={() => toggleSection(section.key)}
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-md)",
                  background: "transparent", border: "none",
                  cursor: "pointer", textAlign: "left",
                  transition: "var(--transition-fast)",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div>
                  <div style={{
                    fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px",
                    color: hasActive
                      ? "var(--color-sidebar-active-text)"
                      : "var(--color-sidebar-text)",
                    textTransform: "uppercase",
                  }}>
                    {title}
                  </div>
                  <div style={{
                    fontSize: "10px",
                    color: "var(--color-sidebar-muted, rgba(255,255,255,0.45))",
                    marginTop: "1px",
                  }}>
                    {subtitle}
                  </div>
                </div>
                <span style={{
                  fontSize: "14px", fontWeight: 400,
                  color: "var(--color-sidebar-text)",
                  opacity: 0.6,
                }}>
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {/* ITEMS */}
              {isOpen && (
                <div style={{ paddingLeft: "4px", paddingBottom: "4px" }}>
                  {section.items.map((item) => {
                    const active   = pathname === item.path || pathname.startsWith(item.path + "/");
                    const itemName = (t.navItems as any)[item.nameKey] ?? item.nameKey;
                    return (
                      <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        style={{
                          width: "100%", textAlign: "left",
                          padding: "7px 12px", border: "none",
                          borderLeft: active
                            ? "3px solid rgba(255,255,255,0.9)"
                            : "3px solid transparent",
                          background: active
                            ? "var(--color-sidebar-active-bg)"
                            : "transparent",
                          color: active
                            ? "var(--color-sidebar-active-text)"
                            : "var(--color-sidebar-text)",
                          fontSize: "13px", fontWeight: active ? 600 : 400,
                          cursor: "pointer",
                          transition: "var(--transition-fast)",
                          marginBottom: "1px",
                          borderRadius: "0 var(--radius-md) var(--radius-md) 0",
                        }}
                        onMouseEnter={e => {
                          if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                        }}
                        onMouseLeave={e => {
                          if (!active) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {itemName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* USUARIO */}
      <div style={{
        padding: "12px",
        borderTop: "1px solid var(--color-sidebar-border)",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "8px 10px", borderRadius: "var(--radius-md)",
          background: "rgba(255,255,255,0.10)",
        }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "var(--radius-full)",
            background: "rgba(255,255,255,0.25)",
            color: "#ffffff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: 700, flexShrink: 0,
            border: "1px solid rgba(255,255,255,0.3)",
          }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: "12px", fontWeight: 500,
              color: "var(--color-sidebar-active-text)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {userEmail}
            </div>
            <div style={{
              fontSize: "11px",
              color: "var(--color-sidebar-text)",
              textTransform: "capitalize",
            }}>
              {userRole ?? t.navItems.user}
            </div>
          </div>
          <button
            onClick={onSignOut}
            title={t.navItems.signOut}
            style={{
              background: "transparent", border: "none",
              color: "var(--color-sidebar-text)",
              cursor: "pointer", fontSize: "16px",
              padding: "4px", borderRadius: "var(--radius-sm)",
              flexShrink: 0, opacity: 0.7,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
          >
            ↪
          </button>
        </div>
      </div>
    </aside>
  );
}
