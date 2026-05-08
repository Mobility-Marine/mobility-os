"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";

// ═══════════════════════════════════════════════════════════════════
// useCurrentUser — Hook centralizado para datos del usuario autenticado
//
// Combina:
//   - auth.users  (id, email)
//   - user_profiles (full_name, phone, phone_mobile, job_title, avatar_url)
//   - company_users (role en la empresa activa)
//
// Patrón ERP-grade: una sola fuente de verdad para los datos del usuario
// en todos los módulos. Si necesitas el usuario actual EN CUALQUIER LUGAR
// del sistema, importa este hook.
// ═══════════════════════════════════════════════════════════════════

export interface CurrentUser {
  id:           string;
  email:        string;
  full_name:    string | null;
  phone:        string | null;
  phone_mobile: string | null;
  job_title:    string | null;
  avatar_url:   string | null;
  role:         string | null;
}

export function useCurrentUser() {
  const { companyId } = useTenant();
  const [user, setUser]       = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // 1) Auth user
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) {
          if (!cancelled) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        const authUser = authData.user;

        // 2) Profile (full_name, phone, phone_mobile, job_title, avatar_url)
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("full_name, phone, phone_mobile, job_title, avatar_url")
          .eq("user_id", authUser.id)
          .maybeSingle();

        // 3) Role en la empresa activa (si hay companyId)
        let role: string | null = null;
        if (companyId) {
          const { data: membership } = await supabase
            .from("company_users")
            .select("role")
            .eq("user_id", authUser.id)
            .eq("company_id", companyId)
            .eq("is_active", true)
            .maybeSingle();
          role = membership?.role ?? null;
        }

        if (cancelled) return;

        setUser({
          id:           authUser.id,
          email:        authUser.email ?? "",
          full_name:    profile?.full_name    ?? null,
          phone:        profile?.phone        ?? null,
          phone_mobile: profile?.phone_mobile ?? null,
          job_title:    profile?.job_title    ?? null,
          avatar_url:   profile?.avatar_url   ?? null,
          role,
        });
      } catch (err) {
        console.error("[useCurrentUser] error loading:", err);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return { user, loading };
}