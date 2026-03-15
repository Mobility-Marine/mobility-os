"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth/AuthProvider";

type CompanyMembership = {
  id: string;
  company_id: string;
  role: string | null;
  company_name?: string | null;
};

type TenantContextType = {
  companyId: string | null;
  memberships: CompanyMembership[];
  loadingTenant: boolean;
  setActiveCompany: (companyId: string) => void;
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export default function TenantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<CompanyMembership[]>([]);
  const [loadingTenant, setLoadingTenant] = useState(true);

  useEffect(() => {
    async function loadTenant() {
      if (loading) return;

      if (!user) {
        setMemberships([]);
        setCompanyId(null);
        setLoadingTenant(false);
        return;
      }

      setLoadingTenant(true);

      const { data, error } = await supabase
        .from("company_users")
        .select("id, company_id, role")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error cargando memberships", error);
        setMemberships([]);
        setCompanyId(null);
        setLoadingTenant(false);
        return;
      }

      const rows = (data || []) as CompanyMembership[];
      setMemberships(rows);

      const savedCompanyId =
        typeof window !== "undefined"
          ? window.localStorage.getItem("activeCompanyId")
          : null;

      const validSaved = rows.find((r) => r.company_id === savedCompanyId);

      const nextCompanyId = validSaved?.company_id || rows[0]?.company_id || null;

      setCompanyId(nextCompanyId);

      if (nextCompanyId && typeof window !== "undefined") {
        window.localStorage.setItem("activeCompanyId", nextCompanyId);
      }

      setLoadingTenant(false);
    }

    loadTenant();
  }, [user, loading]);

  function setActiveCompany(nextCompanyId: string) {
    setCompanyId(nextCompanyId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("activeCompanyId", nextCompanyId);
    }
  }

  const value = useMemo(
    () => ({
      companyId,
      memberships,
      loadingTenant,
      setActiveCompany,
    }),
    [companyId, memberships, loadingTenant]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant must be used inside TenantProvider");
  }
  return ctx;
}
