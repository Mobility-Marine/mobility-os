"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";

import type {
  CrmAccount,
  CrmDocument,
  CrmActivity,
  CrmOpportunity,
  CrmQuote,
  CrmOrder,
  TimelineItem,
  CrmContact
} from "../types/crm.types";

import {
  fetchAccounts,
  fetchDocuments,
  fetchActivities,
  fetchContacts,
  fetchRelations,
  fetchTimeline
} from "./crm.service";

export function useCRMController() {

  const { companyId } = useTenant();

  const [accounts, setAccounts] = useState<CrmAccount[]>([]);
  const [selected, setSelected] = useState<CrmAccount | null>(null);
  const [documents, setDocuments] = useState<CrmDocument[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([]);
  const [quotes, setQuotes] = useState<CrmQuote[]>([]);
  const [orders, setOrders] = useState<CrmOrder[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  const [loading, setLoading] = useState(true);

  // ===== LOAD ACCOUNTS =====
  useEffect(() => {
    if (!companyId) return;

    fetchAccounts(companyId).then((data) => {
      setAccounts(data);
      setLoading(false);
    });

    const channel = supabase
      .channel("crm-accounts-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "crm_accounts",
          filter: `company_id=eq.${companyId}`,
        },
        () => fetchAccounts(companyId).then(setAccounts)
      )
      .subscribe();

   return () => {
  void supabase.removeChannel(channel);
};

  }, [companyId]);

  /// ===== LOAD ACCOUNT DETAIL =====
useEffect(() => {
  if (!selected) return;

  let cancelled = false;

  fetchDocuments(selected.id).then((data) => {
    if (!cancelled) setDocuments(data);
  });

  fetchActivities(selected.id).then((data) => {
    if (!cancelled) setActivities(data);
  });

  fetchContacts(selected.id).then((data) => {
    if (!cancelled) setContacts(data);
  });

  fetchRelations(selected.id).then((r) => {
    if (!cancelled) {
      setOpportunities(r.opportunities);
      setQuotes(r.quotes);
      setOrders(r.orders);
    }
  });

  fetchTimeline(selected.id).then((data) => {
    if (!cancelled) setTimeline(data);
  });

  return () => {
    cancelled = true;
  };

}, [selected]);

  return {
    loading,

    accounts,
    selected,
    setSelected,

    documents,
    activities,
    contacts,
    opportunities,
    quotes,
    orders,
    timeline
  };
}
