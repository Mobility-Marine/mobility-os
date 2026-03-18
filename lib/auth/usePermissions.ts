// ===== INICIO RBAC Hook — permisos enterprise =====
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";

export function usePermissions() {
  const { companyId } = useTenant();

  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRole();
  }, [companyId]);

  async function loadRole() {
    if (!companyId) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("company_users")
      .select("role")
      .eq("user_id", user.id)
      .eq("company_id", companyId)
      .single();

    setRole(data?.role || null);
    setLoading(false);
  }

  // ===== Permisos derivados =====

  const isOwner = role === "owner";
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isUser = role === "user";
  const isViewer = role === "viewer";

  const canManageCompany = isOwner || isAdmin;
  const canManageSales = isOwner || isAdmin || isManager;
  const canEdit = !isViewer;
  const canView = true;

  return {
    role,
    loading,

    isOwner,
    isAdmin,
    isManager,
    isUser,
    isViewer,

    canManageCompany,
    canManageSales,
    canEdit,
    canView,
  };
}
// ===== FIN RBAC Hook =====
