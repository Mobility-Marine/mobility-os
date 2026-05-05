// ════════════════════════════════════════════════════════════════════════
// PARTNERS CONTROLLER — Hook React para gestión del listado
// ════════════════════════════════════════════════════════════════════════
"use client";

import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import type { PartnerListItem } from "../types/partners.types";
import { mapRowToListItem } from "./partners.normalization";

const SELECT_LIST = `
  id, name, legal_name, rfc, email, phone,
  industry, country,
  is_customer, is_supplier, is_logistics_provider,
  is_active, rating, validation_69b_status,
  created_at
`;

export type UsePartnersControllerReturn = {
  partners:        PartnerListItem[];
  selectedId:      string | null;
  selectedPartner: PartnerListItem | null;
  loading:         boolean;
  error:           string | null;
  companyId:       string | undefined;
  userId:          string | undefined;

  refresh:        () => Promise<void>;
  selectPartner:  (id: string | null) => void;
  onPartnerSaved: (savedId: string) => Promise<void>;
};

export function usePartnersController(): UsePartnersControllerReturn {
  const { companyId } = useTenant();
  const { user }      = useAuth();
  const userId        = user?.id;

  const [partners,   setPartners]   = useState<PartnerListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setPartners([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from("business_partners")
        .select(SELECT_LIST)
        .eq("company_id", companyId)
        .order("name", { ascending: true });

      if (qErr) throw new Error(qErr.message);

      const items = (data ?? []).map((row: Record<string, unknown>) => mapRowToListItem(row));
      setPartners(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      // eslint-disable-next-line no-console
      console.error("[usePartnersController] refresh error:", e);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void refresh();
  }, [companyId, refresh]);

  const selectPartner = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const onPartnerSaved = useCallback(
    async (savedId: string) => {
      await refresh();
      setSelectedId(savedId);
    },
    [refresh],
  );

  const selectedPartner = selectedId
    ? partners.find((p) => p.id === selectedId) ?? null
    : null;

  return {
    partners,
    selectedId,
    selectedPartner,
    loading,
    error,
    companyId,
    userId,
    refresh,
    selectPartner,
    onPartnerSaved,
  };
}