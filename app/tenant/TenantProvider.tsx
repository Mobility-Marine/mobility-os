"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TenantContextType = {
  companyId: string | null;
  setCompanyId: (id: string | null) => void;
};

const TenantContext = createContext<TenantContextType>({
  companyId: null,
  setCompanyId: () => {},
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    loadActiveCompany();
  }, []);

  async function loadActiveCompany() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) return;

    // 🔹 Opción temporal: localStorage
    const stored = localStorage.getItem("activeCompanyId");

    if (stored) {
      setCompanyId(stored);
    }
  }

  return (
    <TenantContext.Provider value={{ companyId, setCompanyId }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
