"use client";

// ════════════════════════════════════════════════════════════════════════
// useCompanySettings — Hook centralizado para leer/escribir company_settings
// ════════════════════════════════════════════════════════════════════════
// Cada categoría de Settings que necesite leer/guardar configuración usa
// este hook. Provee:
//   - settings: snapshot actual de la fila company_settings
//   - loading: true mientras se carga la primera vez
//   - saving:  true mientras se está guardando un update
//   - update(partial): guarda un subconjunto de campos y refresca state
//   - reload(): vuelve a leer desde BD (útil tras importaciones masivas)
//
// El hook detecta automáticamente la empresa activa vía useTenant().
// ════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from "react";
import { supabase }   from "@/lib/supabaseClient";
import { useTenant }  from "@/lib/tenant/TenantProvider";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CompanySettings = Record<string, any>;

export type UseCompanySettingsResult = {
  settings: CompanySettings | null;
  loading:  boolean;
  saving:   boolean;
  error:    string | null;
  update:   (partial: Partial<CompanySettings>) => Promise<boolean>;
  reload:   () => Promise<void>;
};

export function useCompanySettings(): UseCompanySettingsResult {
  const { companyId } = useTenant();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("company_settings")
      .select("*")
      .eq("company_id", companyId)
      .single();

    if (err) {
      setError(err.message);
      setSettings(null);
    } else {
      setSettings(data ?? null);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const update = useCallback(
    async (partial: Partial<CompanySettings>): Promise<boolean> => {
      if (!companyId) return false;
      setSaving(true);
      setError(null);

      const payload = { ...partial, updated_at: new Date().toISOString() };
      const { error: err } = await supabase
        .from("company_settings")
        .update(payload)
        .eq("company_id", companyId);

      if (err) {
        setError(err.message);
        setSaving(false);
        return false;
      }

      // Optimistic update local
      setSettings((prev) => (prev ? { ...prev, ...payload } : prev));
      setSaving(false);
      return true;
    },
    [companyId],
  );

  return { settings, loading, saving, error, update, reload: fetch };
}