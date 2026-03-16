"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import TenantProvider from "@/lib/tenant/TenantProvider";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: companyLink } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.id)
      .limit(1);

    if (!companyLink || companyLink.length === 0) {
      router.replace("/create-company");
      return;
    }

    setLoading(false);
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Cargando Mobility OS...</div>;
  }

  return (
    <TenantProvider>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#0b1220",
          color: "#fff",
        }}
      >
        {/* 🧭 SIDEBAR */}
        <aside
          style={{
            width: 260,
            background: "#0f172a",
            padding: 20,
            borderRight: "1px solid #1e293b",
          }}
        >
          <h2 style={{ marginBottom: 20 }}>Mobility OS</h2>

          <nav style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a href="/dashboard">Dashboard</a>
            <a href="/agenda">Agenda</a>
            <a href="/crm">CRM</a>
            <a href="/company">Empresa</a>
            <a href="/reports">Reportes</a>
          </nav>
        </aside>

        {/* 📦 CONTENIDO */}
        <main style={{ flex: 1, padding: 30 }}>
          {children}
        </main>
      </div>
    </TenantProvider>
  );
}
