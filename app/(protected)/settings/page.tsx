"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { usePermissions } from "@/lib/auth/usePermissions";
import { useAuth } from "@/lib/auth/AuthProvider";
import TabPerfil       from "./tabs/TabPerfil";
import TabEmpresa      from "./tabs/TabEmpresa";
import TabUsuarios     from "./tabs/TabUsuarios";
import TabSuscripcion  from "./tabs/TabSuscripcion";
import TabHerramientas from "./tabs/TabHerramientas";

type TabKey = "perfil" | "empresa" | "usuarios" | "suscripcion" | "herramientas";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { canManageCompany, loading: permLoading } = usePermissions();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("perfil");

  if (permLoading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>
        {(t.general as any)?.loading ?? "Cargando…"}
      </div>
    </div>
  );

  type Tab = { key: TabKey; label: string; icon: React.ReactNode; adminOnly?: boolean };

  const TABS: Tab[] = [
    {
      key:   "perfil",
      label: (t.settings as any)?.tabPerfil ?? "Mi perfil",
      icon:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    },
    {
      key:       "empresa",
      label:     (t.settings as any)?.tabEmpresa ?? "Empresa",
      adminOnly: true,
      icon:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    },
    {
      key:       "usuarios",
      label:     (t.settings as any)?.tabUsuarios ?? "Usuarios",
      adminOnly: true,
      icon:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      key:       "suscripcion",
      label:     (t.settings as any)?.tabSuscripcion ?? "Suscripción",
      adminOnly: true,
      icon:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    },
    {
      key:       "herramientas",
      label:     (t.settings as any)?.tabHerramientas ?? "Herramientas",
      adminOnly: true,
      icon:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
    },
  ];

  const visibleTabs = TABS.filter((tab) => !tab.adminOnly || canManageCompany);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "24px", paddingBottom: "32px", alignItems: "start" }}>
      {/* SIDEBAR */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "12px", display: "flex", flexDirection: "column", gap: "4px", position: "sticky", top: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px", padding: "6px 10px", marginBottom: "4px" }}>
          {(t.settings as any)?.title ?? "Configuración"}
        </div>
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "var(--radius-md)", background: isActive ? "var(--color-bg-active)" : "transparent", border: isActive ? "1px solid var(--color-brand-blue)40" : "1px solid transparent", color: isActive ? "var(--color-brand-blue)" : "var(--color-text-second)", fontSize: "13px", fontWeight: isActive ? 600 : 400, cursor: "pointer", textAlign: "left", transition: "var(--transition-fast)" }}>
              <span style={{ color: isActive ? "var(--color-brand-blue)" : "var(--color-text-muted)", flexShrink: 0 }}>
                {tab.icon}
              </span>
              {tab.label}
              {tab.adminOnly && (
                <span style={{ marginLeft: "auto", fontSize: "9px", padding: "1px 5px", borderRadius: "var(--radius-full)", background: "var(--color-warning-bg)", color: "var(--color-warning-text)", border: "1px solid var(--color-warning-border)", fontWeight: 700 }}>
                  ADMIN
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* CONTENIDO */}
      <div style={{ minWidth: 0 }}>
        {activeTab === "perfil"       &&                    <TabPerfil />}
        {activeTab === "empresa"      && canManageCompany && <TabEmpresa />}
        {activeTab === "usuarios"     && canManageCompany && <TabUsuarios />}
        {activeTab === "suscripcion"  && canManageCompany && <TabSuscripcion />}
        {activeTab === "herramientas" && canManageCompany && <TabHerramientas />}
      </div>
    </div>
  );
}
