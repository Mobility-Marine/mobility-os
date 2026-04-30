"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

  // Track del user_id actual para evitar reloads redundantes en eventos como TOKEN_REFRESHED.
  const currentUserIdRef = useRef<string | null>(null);

  // ────────────────────────────────────────────
  // 1) Carga inicial + listener de cambios de sesión
  // ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    // Carga inicial al montar el componente (cubre F5 / navegación directa)
    initializeTenant();

    // Listener: reacciona a SIGNED_IN, SIGNED_OUT y cambio de usuario
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;

        const newUserId = session?.user?.id ?? null;

        // SIGNED_OUT explícito → limpiar todo
        if (event === "SIGNED_OUT" || !newUserId) {
          currentUserIdRef.current = null;
          setCompanyId(null);
          setMemberships([]);
          setLoadingTenant(false);
          return;
        }

        // SIGNED_IN o cambio de usuario → recargar
        // Si es el mismo usuario (TOKEN_REFRESHED, USER_UPDATED), NO recargar para evitar parpadeo.
        if (newUserId !== currentUserIdRef.current) {
          currentUserIdRef.current = newUserId;
          initializeTenant();
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ────────────────────────────────────────────
  // 2) initializeTenant: resuelve el tenant activo
  // ────────────────────────────────────────────
  async function initializeTenant() {
    setLoadingTenant(true);

    try {
      const { data: userData, error: authError } =
        await supabase.auth.getUser();

      if (authError) {
        console.error("[TenantProvider] auth error:", authError);
        currentUserIdRef.current = null;
        setCompanyId(null);
        setMemberships([]);
        setLoadingTenant(false);
        return;
      }

      const user = userData.user;

      if (!user) {
        currentUserIdRef.current = null;
        setCompanyId(null);
        setMemberships([]);
        setLoadingTenant(false);
        return;
      }

      currentUserIdRef.current = user.id;

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
        console.error("[TenantProvider] memberships error:", membershipsError);
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
        console.error("[TenantProvider] settings error:", settingsError);
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

      // Fallback: usar la primera empresa y guardarla como activa
      const fallbackCompanyId = normalizedMemberships[0].company_id;

      await supabase.from("user_settings").upsert({
        user_id: user.id,
        active_company_id: fallbackCompanyId,
        updated_at: new Date().toISOString(),
      });

      setCompanyId(fallbackCompanyId);
    } catch (error) {
      console.error("[TenantProvider] initializeTenant error:", error);
      setCompanyId(null);
      setMemberships([]);
    } finally {
      setLoadingTenant(false);
    }
  }

  // ────────────────────────────────────────────
  // 3) Cambiar empresa activa
  // ────────────────────────────────────────────
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

  // ────────────────────────────────────────────
  // 4) Refresh manual (lo usan algunos componentes)
  // ────────────────────────────────────────────
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
