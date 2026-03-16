"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { companyId, loadingTenant } = useTenant();
  const router = useRouter();

  // 🔐 Sin sesión → login
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // 🏢 Sin empresa → onboarding
  useEffect(() => {
    if (!loading && !loadingTenant && user && !companyId) {
      router.replace("/create-company");
    }
  }, [loading, loadingTenant, user, companyId, router]);

  // ⏳ Loader global
  if (loading || loadingTenant || !user) {
    return <div style={{ padding: 40 }}>Verificando sesión...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Sistema listo para operar.</p>
    </div>
  );
}
