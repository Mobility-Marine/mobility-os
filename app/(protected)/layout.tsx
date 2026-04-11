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

function getCurrentSection(pathname: string) {
  for (const section of navSections) {
    const item = section.items.find(
      (x) => pathname === x.path || pathname.startsWith(x.path + "/")
    );
    if (item) return { sectionTitle: section.title, itemName: item.name };
  }
  return { sectionTitle: "General", itemName: "Dashboard" };
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { companyId, memberships, setActiveCompany } = useTenant();
  const [hubOpen, setHubOpen] = useState(false);

  const { sectionTitle, itemName } = useMemo(
    () => getCurrentSection(pathname),
    [pathname]
  );

  const activeCompany = memberships.find((m) => m.company_id === companyId);
  const companyName = activeCompany?.company_name ?? "Mi empresa";
  const userRole = activeCompany?.role ?? null;

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
      const item = section.items.find(
        (i) => i.name.toLowerCase().includes(q) || i.path.toLowerCase().includes(q)
      );
      if (item) { router.push(item.path); return; }
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

      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        <AppHeader
          section={sectionTitle}
          title={itemName}
          onOpenHub={() => setHubOpen(true)}
          onSearch={handleSearch}
        />

        <main style={{
          flex: 1,
          overflow: "auto",
          padding: "24px",
        }}>
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
