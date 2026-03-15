"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TenantContextType = {
  companyId: string | null;
  loadingTenant: boolean;
};

const TenantContext = createContext<TenantContextType>({
  companyId: null,
  loadingTenant: true,
});

export default function TenantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loadingTenant, setLoadingTenant] = useState(true);

  useEffect(() => {
    initializeTenant();
  }, []);

  async function initializeTenant() {
    // 🔐 Usuario actual
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setLoadingTenant(false);
      return;
    }

    // ⭐ 1️⃣ Intentar leer empresa activa guardada
    const { data: settings } = await supabase
      .from("user_settings")
      .select("active_company_id")
      .eq("user_id", user.id)
      .single();

    if (settings?.active_company_id) {
      setCompanyId(settings.active_company_id);
      setLoadingTenant(false);
      return;
    }

    // ⭐ 2️⃣ Si no existe, obtener primera empresa del usuario
    const { data: companyLinks } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.id)
      .limit(1);

    if (companyLinks && companyLinks.length > 0) {
      const firstCompanyId = companyLinks[0].company_id;

      setCompanyId(firstCompanyId);

      // Guardar automáticamente como activa
      await supabase.from("user_settings").upsert({
        user_id: user.id,
        active_company_id: firstCompanyId,
      });
    }

    setLoadingTenant(false);
  }

  return (
    <TenantContext.Provider value={{ companyId, loadingTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
