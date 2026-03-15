"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabaseClient";

type Membership = {
  id: string;
  company_id: string;
  role: string | null;
  company_name?: string;
};

type TenantContextType = {
  companyId: string | null;
  memberships: Membership[];
  loadingTenant: boolean;
  setActiveCompany: (companyId: string) => Promise<void>;
  refreshTenant: () => Promise<void>;
};

const TenantContext = createContext<TenantContextType>({
  companyId: null,
  memberships: [],
  loadingTenant: true,
  setActiveCompany: async () => {},
  refreshTenant: async () => {},
});

export default function TenantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loadingTenant, setLoadingTenant] = useState(true);

  useEffect(() => {
    initializeTenant();
  }, []);

  async function initializeTenant() {
    setLoadingTenant(true);

    try {
      const { data: userData, error: authError } =
        await supabase.auth.getUser();

      if (authError) {
        console.error(authError);
        setCompanyId(null);
        setMemberships([]);
        setLoadingTenant(false);
        return;
      }

      const user = userData.user;

      if (!user) {
        setCompanyId(null);
        setMemberships([]);
        setLoadingTenant(false);
        return;
      }

      const { data: membershipRows, error: membershipsError } = await supabase
        .from("company_users")
        .select(`
          id,
          company_id,
          role,
          companies (
            name
          )
        `)
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (membershipsError) {
        console.error(membershipsError);
        setCompanyId(null);
        setMemberships([]);
        setLoadingTenant(false);
        return;
      }

      const normalizedMemberships: Membership[] = (membershipRows || []).map(
        (row: any) => ({
          id: row.id,
          company_id: row.company_id,
          role: row.role,
          company_name: row.companies?.name || "Empresa sin nombre",
        })
      );

      setMemberships(normalizedMemberships);

      if (normalizedMemberships.length === 0) {
        setCompanyId(null);
        setLoadingTenant(false);
        return;
      }

      const { data: settingsRow, error: settingsError } = await supabase
        .from("user_settings")
        .select("active_company_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (settingsError) {
        console.error(settingsError);
      }

      const savedCompanyId = settingsRow?.active_company_id || null;

      const savedStillValid = normalizedMemberships.some(
        (m) => m.company_id === savedCompanyId
      );

      if (savedCompanyId && savedStillValid) {
        setCompanyId(savedCompanyId);
        setLoadingTenant(false);
        return;
      }

      const fallbackCompanyId = normalizedMemberships[0].company_id;

      await supabase.from("user_settings").upsert({
        user_id: user.id,
        active_company_id: fallbackCompanyId,
        updated_at: new Date().toISOString(),
      });

      setCompanyId(fallbackCompanyId);
    } catch (error) {
      console.error("initializeTenant error:", error);
      setCompanyId(null);
      setMemberships([]);
    } finally {
      setLoadingTenant(false);
    }
  }

  async function setActiveCompany(nextCompanyId: string) {
    const { data: userData, error: authError } =
      await supabase.auth.getUser();

    if (authError) {
      console.error(authError);
      return;
    }

    const user = userData.user;
    if (!user) return;

    const isAllowed = memberships.some((m) => m.company_id === nextCompanyId);
    if (!isAllowed) {
      console.error("Empresa no permitida para este usuario");
      return;
    }

    const { error } = await supabase.from("user_settings").upsert({
      user_id: user.id,
      active_company_id: nextCompanyId,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error(error);
      return;
    }

    setCompanyId(nextCompanyId);
  }

  async function refreshTenant() {
    await initializeTenant();
  }

  const value = useMemo(
    () => ({
      companyId,
      memberships,
      loadingTenant,
      setActiveCompany,
      refreshTenant,
    }),
    [companyId, memberships, loadingTenant]
  );

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
