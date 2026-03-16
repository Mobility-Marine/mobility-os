"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  setActiveCompany: (companyId: string) => Promise<void>;
  refreshTenant: () => Promise<void>;
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
        .select(
          `
          id,
          company_id,
          role,
          companies (
            name
          )
        `
        )
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) {
        console.error("Error cargando memberships", error);
        setMemberships([]);
        setCompanyId(null);
        setLoadingTenant(false);
        return;
      }

      const rows = (data || []).map((row: any) => ({
        id: row.id,
        company_id: row.company_id,
        role: row.role,
        company_name: row.companies?.name || "Empresa",
      })) as CompanyMembership[];

      setMemberships(rows);

      if (rows.length === 0) {
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
        console.error("Error cargando user_settings", settingsError);
      }

      const savedCompanyId = settingsRow?.active_company_id || null;
      const validSaved = rows.find((r) => r.company_id === savedCompanyId);
      const nextCompanyId = validSaved?.company_id || rows[0]?.company_id || null;

      setCompanyId(nextCompanyId);

      if (nextCompanyId) {
        const { error: upsertError } = await supabase.from("user_settings").upsert({
          user_id: user.id,
          active_company_id: nextCompanyId,
          updated_at: new Date().toISOString(),
        });

        if (upsertError) {
          console.error("Error guardando active_company_id", upsertError);
        }
      }

      setLoadingTenant(false);
    }

    loadTenant();
  }, [user, loading]);

  async function setActiveCompany(nextCompanyId: string) {
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
      console.error("Error guardando empresa activa", error);
      return;
    }

    setCompanyId(nextCompanyId);
  }

  async function refreshTenant() {
    if (!user) return;

    setLoadingTenant(true);

    const { data, error } = await supabase
      .from("company_users")
      .select(
        `
        id,
        company_id,
        role,
        companies (
          name
        )
      `
      )
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (error) {
      console.error("Error refrescando memberships", error);
      setLoadingTenant(false);
      return;
    }

    const rows = (data || []).map((row: any) => ({
      id: row.id,
      company_id: row.company_id,
      role: row.role,
      company_name: row.companies?.name || "Empresa",
    })) as CompanyMembership[];

    setMemberships(rows);
    setLoadingTenant(false);
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

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant must be used inside TenantProvider");
  }
  return ctx;
}
