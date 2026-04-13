"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type {
  CrmAccount, CrmDocument, CrmActivity, CrmContact,
  CrmOpportunity, CrmQuote, CrmOrder, TimelineItem,
  CreateAccountPayload, CreateContactPayload, CreateActivityPayload,
} from "../types/crm.types";
import {
  fetchAccounts, updateAccount as updateAccountSvc,
  fetchContacts, createContact as createContactSvc, deleteContact,
  fetchActivities, createActivity as createActivitySvc, toggleActivity,
  fetchDocuments,
  fetchRelations, fetchTimeline,
  findClientByName, createGlobalClient,
} from "./crm.service";

export function useCRMController() {
  const { companyId } = useTenant();

  const [accounts,      setAccounts]      = useState<CrmAccount[]>([]);
  const [selected,      setSelected]      = useState<CrmAccount | null>(null);
  const [documents,     setDocuments]     = useState<CrmDocument[]>([]);
  const [activities,    setActivities]    = useState<CrmActivity[]>([]);
  const [contacts,      setContacts]      = useState<CrmContact[]>([]);
  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([]);
  const [quotes,        setQuotes]        = useState<CrmQuote[]>([]);
  const [orders,        setOrders]        = useState<CrmOrder[]>([]);
  const [timeline,      setTimeline]      = useState<TimelineItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── LOAD ACCOUNTS ─────────────────────────────────────────

  const load = useCallback(async () => {
    if (!companyId) return;
    const data = await fetchAccounts(companyId);
    setAccounts(data);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const channel = supabase
      .channel(`crm-${companyId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "crm_accounts",
        filter: `company_id=eq.${companyId}`,
      }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [companyId, load]);

  // ── LOAD DETAIL ───────────────────────────────────────────

  useEffect(() => {
    if (!selected || !companyId) {
      setDocuments([]); setActivities([]); setContacts([]);
      setOpportunities([]); setQuotes([]); setOrders([]); setTimeline([]);
      return;
    }
    setDetailLoading(true);
    Promise.all([
      fetchDocuments(selected.id),
      fetchActivities(selected.id),
      fetchContacts(selected.id),
      fetchRelations(companyId, selected.id, selected.client_id),
      fetchTimeline(companyId, selected.id),
    ]).then(([docs, acts, conts, rels, tl]) => {
      setDocuments(docs);
      setActivities(acts);
      setContacts(conts);
      setOpportunities(rels.opportunities);
      setQuotes(rels.quotes);
      setOrders(rels.orders);
      setTimeline(tl);
    }).finally(() => setDetailLoading(false));
  }, [selected?.id, companyId]);

  // ── ACCOUNT ACTIONS ───────────────────────────────────────

  async function createAccount(payload: CreateAccountPayload) {
    if (!companyId) return;
    setSaving(true);
    try {
      // 1. Buscar o crear cliente global
      let client = await findClientByName(companyId, payload.name);
      if (!client) {
        client = await createGlobalClient(companyId, {
          name:       payload.name,
          legal_name: payload.legal_name,
          country:    payload.country,
          city:       payload.city,
          notes:      payload.notes,
        });
      }

      // 2. Crear cuenta CRM
      const { data: account, error } = await supabase
        .from("crm_accounts")
        .insert({
          company_id:     companyId,
          client_id:      client.id,
          name:           payload.name,
          legal_name:     payload.legal_name     ?? null,
          industry:       payload.industry       ?? null,
          country:        payload.country        ?? null,
          city:           payload.city           ?? null,
          website:        payload.website        ?? null,
          status:         payload.status         ?? "active",
          notes:          payload.notes          ?? null,
          is_customer:    true,
          lifecycle_stage:payload.lifecycle_stage ?? "customer",
        })
        .select("*")
        .single();
      if (error) throw error;

      // 3. Identity bridge
      await supabase.from("customer_identity_bridge").insert({
        company_id: companyId, crm_account_id: account.id, client_id: client.id,
        bridge_status: "linked", source_of_truth: "crm_accounts",
        conversion_type: "manual_account_creation", conversion_source: "crm_module", is_primary: true,
      });

      // 4. Timeline event
      await supabase.from("entity_timeline_events").insert({
        company_id: companyId, entity_type: "crm_account", entity_id: account.id,
        related_account_id: account.id, related_client_id: client.id,
        module_key: "crm", event_type: "created", event_category: "commercial",
        title: "Cuenta CRM creada", description: payload.name,
      });

      await load();
    } finally { setSaving(false); }
  }

  async function updateAccount(id: string, updates: Partial<CrmAccount>) {
    if (!companyId) return;
    setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, ...updates } : a));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, ...updates } : prev);
    await updateAccountSvc(companyId, id, updates);
    await load();
  }

  async function updateLifecycle(accountId: string, stage: string) {
    if (!companyId) return;
    await supabase
      .from("crm_accounts")
      .update({ lifecycle_stage: stage, updated_at: new Date().toISOString() })
      .eq("id", accountId).eq("company_id", companyId);
    await supabase.from("entity_timeline_events").insert({
      company_id: companyId, entity_type: "crm_account", entity_id: accountId,
      related_account_id: accountId, module_key: "crm",
      event_type: "lifecycle_changed", event_category: "commercial",
      title: "Cambio de etapa", description: stage,
    });
    await load();
    if (selected?.id === accountId)
      setSelected((prev) => prev ? { ...prev, lifecycle_stage: stage as any } : prev);
  }

  // ── CONTACT ACTIONS ───────────────────────────────────────

  async function addContact(payload: CreateContactPayload) {
    if (!companyId || !selected) return;
    const contact = await createContactSvc(companyId, payload);
    setContacts((prev) => [contact, ...prev]);
    await supabase.from("entity_timeline_events").insert({
      company_id: companyId, entity_type: "crm_account", entity_id: selected.id,
      related_account_id: selected.id, module_key: "crm",
      event_type: "contact_created", event_category: "relationship",
      title: "Contacto agregado",
      description: `${payload.first_name} ${payload.last_name ?? ""}`.trim(),
    });
  }

  async function removeContact(contactId: string) {
    if (!companyId) return;
    await deleteContact(companyId, contactId);
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
  }

  // ── ACTIVITY ACTIONS ──────────────────────────────────────

  async function addActivity(payload: CreateActivityPayload) {
    if (!companyId || !selected) return;
    const act = await createActivitySvc(companyId, payload);
    setActivities((prev) => [act, ...prev]);
    await supabase.from("entity_timeline_events").insert({
      company_id: companyId, entity_type: "crm_account", entity_id: selected.id,
      related_account_id: selected.id, module_key: "crm",
      event_type: "activity_created", event_category: "commercial",
      title: "Actividad registrada", description: payload.title,
    });
  }

  async function completeActivity(id: string, completed: boolean) {
    if (!companyId) return;
    await toggleActivity(companyId, id, completed);
    setActivities((prev) => prev.map((a) =>
      a.id === id ? { ...a, completed: !completed } : a
    ));
  }

  // ── DOCUMENT ACTIONS ──────────────────────────────────────

  async function uploadDocument(accountId: string, file: File) {
    if (!companyId) return;
    const filePath = `${companyId}/${accountId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("crm-documents").upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: doc, error } = await supabase
      .from("crm_documents")
      .insert({
        company_id: companyId, account_id: accountId,
        name: file.name, file_path: filePath,
        file_type: file.type, size: file.size, storage_provider: "supabase",
      })
      .select("*").single();
    if (error) throw error;
    setDocuments((prev) => [doc as CrmDocument, ...prev]);
  }

  return {
    loading, saving, detailLoading,
    accounts, selected, setSelected,
    documents, activities, contacts,
    opportunities, quotes, orders, timeline,
    createAccount, updateAccount, updateLifecycle,
    addContact, removeContact,
    addActivity, completeActivity,
    uploadDocument,
    reload: load,
  };
}
