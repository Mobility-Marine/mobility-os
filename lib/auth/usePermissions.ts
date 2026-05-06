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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ===== Roles del sistema (8) =====
  const isOwner     = role === "owner";
  const isAdmin     = role === "admin";
  const isManager   = role === "manager";
  const isComercial = role === "comercial";
  const isLogistica = role === "logistica";
  const isFinanzas  = role === "finanzas";
  const isCompras   = role === "compras";
  const isUser      = role === "user";
  const isViewer    = role === "viewer";

  // ===== Permisos derivados (área general) =====
  const canManageCompany   = isOwner || isAdmin;
  const canManageSales     = isOwner || isAdmin || isManager || isComercial;
  const canManageLogistics = isOwner || isAdmin || isManager || isLogistica;
  const canManageFinance   = isOwner || isAdmin || isManager || isFinanzas;
  const canManagePurchases = isOwner || isAdmin || isManager || isCompras;
  const canEdit            = !isViewer;
  const canView            = true;

  // ===== Permisos específicos: costos multi-factura en embarques =====
  // Crear cost_pending o invoice asociado a un embarque
  const canRegisterShipmentCost =
    isOwner || isAdmin || isManager || isFinanzas || isLogistica;

  // Convertir cost_pending → invoice (acción financiera)
  const canConvertCostToInvoice = isOwner || isAdmin || isFinanzas;

  // Activar/desactivar requires_supplier_invoice en un embarque
  const canToggleRequiresInvoice = isOwner || isAdmin || isManager;

  return {
    role,
    loading,

    // Roles individuales
    isOwner, isAdmin, isManager,
    isComercial, isLogistica, isFinanzas, isCompras,
    isUser, isViewer,

    // Permisos por área
    canManageCompany,
    canManageSales,
    canManageLogistics,
    canManageFinance,
    canManagePurchases,
    canEdit,
    canView,

    // Permisos específicos: costos multi-factura
    canRegisterShipmentCost,
    canConvertCostToInvoice,
    canToggleRequiresInvoice,
  };
}
// ===== FIN RBAC Hook =====