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

// ===== ACTIONS =====

async function createAccount(payload: {
  name: string;
  legal_name?: string;
  industry?: string;
  country?: string;
  city?: string;
  status?: string;
  notes?: string;
}) {
  if (!companyId) return;

  await supabase.from("crm_accounts").insert({
    company_id: companyId,
    ...payload,
  });

  const data = await fetchAccounts(companyId);
  setAccounts(data);
}

async function createContact(accountId: string) {
  if (!companyId) return;

  const name = prompt("Nombre del contacto");
  if (!name) return;

  const position = prompt("Puesto") || null;
  const email = prompt("Email") || null;
  const phone = prompt("Teléfono") || null;

  await supabase.from("crm_contacts").insert({
    company_id: companyId,
    account_id: accountId,
    name,
    position,
    email,
    phone,
    role: "user",
    influence_level: 3,
    relationship_score: 50,
  });

  const data = await fetchContacts(accountId);
  setContacts(data);
}

async function createActivity(
  accountId: string,
  title: string,
  type: string,
  date?: string
) {
  if (!companyId || !title.trim()) return;

  const scheduled = date
    ? new Date(date).toISOString()
    : null;

  await supabase.from("crm_activities").insert({
    company_id: companyId,
    account_id: accountId,
    type,
    title,
    scheduled_at: scheduled,
    completed: false,
  });

  const data = await fetchActivities(accountId);
  setActivities(data);
}

async function uploadDocument(accountId: string, file: File) {
  if (!companyId) return;

  const filePath = `${companyId}/${accountId}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("crm-documents")
    .upload(filePath, file);

  if (error) throw error;

  await supabase.from("crm_documents").insert({
    company_id: companyId,
    account_id: accountId,
    name: file.name,
    file_path: filePath,
    file_type: file.type,
    size: file.size,
    storage_provider: "supabase",
  });

  const data = await fetchDocuments(accountId);
  setDocuments(data);
}
  
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
  timeline,

  // ===== ACTIONS =====
  createAccount,
  createContact,
  createActivity,
  uploadDocument
};
}
