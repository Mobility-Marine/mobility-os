}
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
    // 🔐 1) Usuario autenticado
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      router.replace("/login");
      return;
    }

    // 🏢 2) Usuario pertenece a alguna empresa
    const { data: companyLink } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.id)
      .limit(1);

    if (!companyLink || companyLink.length === 0) {
      router.replace("/create-company");
      return;
    }

    // ✅ Acceso permitido
    setLoading(false);
  }

  // ⏳ Pantalla de carga
  if (loading) {
    return <div style={{ padding: 40 }}>Cargando Mobility OS...</div>;
  }

  // 🏢 Activar multi-tenant context
  return (
    <TenantProvider>
      {children}
    </TenantProvider>
  );
