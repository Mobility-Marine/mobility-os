"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "@/lib/ui/layout/Sidebar";
import AppHeader from "@/lib/ui/layout/AppHeader";
import CommandHub from "@/lib/ui/layout/CommandHub";
import { navSections } from "@/lib/ui/layout/navConfig";
import { useTranslation } from "@/lib/i18n/useTranslation";

function getCurrentSectionKeys(pathname: string) {
  for (const section of navSections) {
    const item = section.items.find(
      (x) => pathname === x.path || pathname.startsWith(x.path + "/")
    );
    if (item) return { sectionKey: section.titleKey, itemKey: item.nameKey };
  }
  return { sectionKey: "general", itemKey: "dashboard" };
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { companyId, memberships, setActiveCompany } = useTenant();
  const { t } = useTranslation();
  const [hubOpen, setHubOpen] = useState(false);

  const { sectionKey, itemKey } = useMemo(
    () => getCurrentSectionKeys(pathname),
    [pathname]
  );

  const sectionTitle = (t.nav as any)[sectionKey]      ?? sectionKey;
  const itemName     = (t.navItems as any)[itemKey]    ?? itemKey;

  const activeCompany = memberships.find((m) => m.company_id === companyId);
  const companyName   = activeCompany?.company_name ?? "Mi empresa";
  const userRole      = activeCompany?.role ?? null;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function handleChangeCompany(id: string) {
    await setActiveCompany(id);
    window.location.reload();
  }

  function handleSearch(query: string) {
    const q = query.toLowerCase();
    for (const section of navSections) {
      const item = section.items.find((i) => {
        const translated = (t.navItems as any)[i.nameKey] ?? i.nameKey;
        return (
          translated.toLowerCase().includes(q) ||
          i.path.toLowerCase().includes(q) ||
          i.nameKey.toLowerCase().includes(q)
        );
      });
      if (item) {
        router.push(item.path);
        return;
      }
    }
  }

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      background: "var(--color-bg-page)",
    }}>
      <Sidebar
        userEmail={user?.email ?? null}
        userRole={userRole}
        companyName={companyName}
        memberships={memberships}
        activeCompanyId={companyId}
        onChangeCompany={handleChangeCompany}
        onSignOut={handleSignOut}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <AppHeader
          section={sectionTitle}
          title={itemName}
          onOpenHub={() => setHubOpen(true)}
          onSearch={handleSearch}
        />
        <main style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {children}
        </main>
      </div>

      <CommandHub
        open={hubOpen}
        onClose={() => setHubOpen(false)}
        companyId={companyId}
        userId={user?.id ?? null}
      />
    </div>
  );
}
