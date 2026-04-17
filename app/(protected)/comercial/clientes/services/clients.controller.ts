"use client";
// ============================================================
// CLIENTS CONTROLLER v2 — GOD LEVEL
// Auto-crea crm_account + identity bridge al crear cliente
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import type {
  Client, ClientDocument, ClientContact, ClientConnection,
  CreateClientPayload, ClientDocumentType, ClientContactRole,
} from "../types/clients.types";
import {
  fetchClients, createClient as createSvc, updateClient as updateSvc,
  toggleClientStatus, fetchClientDocuments, createClientDocument,
  updateClientDocument, deleteClientDocument, fetchClientContacts,
  createClientContact, updateClientContact, deleteClientContact,
  fetchClientConnections, fetchClientStats,
} from "./clients.service";

export function useClientsController() {
  const { companyId } = useTenant();
  const { user }      = useAuth();

  const [clients,       setClients]       = useState<Client[]>([]);
  const [selected,      setSelected]      = useState<Client | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [documents,     setDocuments]     = useState<ClientDocument[]>([]);
  const [contacts,      setContacts]      = useState<ClientContact[]>([]);
  const [connections,   setConnections]   = useState<ClientConnection[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const [data, { data: balances }] = await Promise.all([
        fetchClients(companyId),
        supabase
          .from("accounts_receivable")
          .select("client_id, balance")
          .eq("company_id", companyId)
          .in("status", ["pending", "partial"]),
      ]);

      // Agrupar saldos por client_id
      const balanceMap: Record<string, number> = {};
      for (const row of balances ?? []) {
        if (!row.client_id) continue;
        balanceMap[row.client_id] = (balanceMap[row.client_id] ?? 0) + parseFloat(row.balance ?? "0");
      }

      // Merge saldo en cada cliente
      const withBalances = data.map((c) => ({
        ...c,
        stats: {
          ...(c.stats ?? { opportunities: 0, openOrders: 0, totalRevenue: 0, lastActivity: undefined, riskLevel: "LOW" as const }),
          openBalance: balanceMap[c.id] ?? 0,
        },
      }));

      setClients(withBalances);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const channel = supabase
      .channel(`clients-${companyId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "clients",
        filter: `company_id=eq.${companyId}`,
      }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [companyId, load]);

  useEffect(() => {
    if (!selected || !companyId) {
      setDocuments([]); setContacts([]); setConnections([]); return;
    }
    setDetailLoading(true);
    Promise.all([
      fetchClientDocuments(companyId, selected.id),
      fetchClientContacts(companyId, selected.id),
      fetchClientConnections(companyId, selected.id),
      fetchClientStats(companyId, selected.id),
    ]).then(([docs, conts, conns, stats]) => {
      setDocuments(docs);
      setContacts(conts);
      setConnections(conns);
      setSelected((prev) => prev ? { ...prev, stats } : prev);
    }).finally(() => setDetailLoading(false));
  }, [selected?.id, companyId]);

  // ── CLIENT ACTIONS ───────────────────────────────────────

  async function createClient(
    payload: CreateClientPayload,
    initialContacts?: { name: string; role: ClientContactRole; title?: string; email?: string; phone?: string; is_primary?: boolean }[],
    initialDocuments?: { name: string; type: ClientDocumentType; url?: string; notes?: string; expires_at?: string }[]
  ) {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      const client = await createSvc(companyId, payload);

      // ── PARALELO: contactos + documentos + CRM ──────────
      await Promise.all([
        // Contactos iniciales
        ...(initialContacts?.length ? initialContacts.map((c) =>
          createClientContact(companyId, client.id, user.id, c)
        ) : []),
        // Documentos iniciales
        ...(initialDocuments?.length ? initialDocuments.map((d) =>
          createClientDocument(companyId, client.id, user.id, d)
        ) : []),
        // Auto-crear cuenta CRM
        autoCreateCRMAccount(companyId, client.id, payload),
      ]);

      await load();
      return client;
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function updateClient(id: string, updates: Partial<Client>) {
    if (!companyId) return;
    setClients((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, ...updates } : prev);
    try {
      await updateSvc(companyId, id, updates);
      await load();
    } catch (e: any) { setError(e.message); await load(); }
  }

  async function toggleStatus(id: string, is_active: boolean) {
    if (!companyId) return;
    await toggleClientStatus(companyId, id, is_active);
    await load();
  }

  // ── CONTACT ACTIONS ─────────────────────────────────────

  async function addContact(payload: {
    name: string; role: ClientContactRole; title?: string;
    email?: string; phone?: string; is_primary?: boolean; notes?: string;
  }) {
    if (!companyId || !selected || !user) return;
    const contact = await createClientContact(companyId, selected.id, user.id, payload);
    setContacts((prev) => [...prev, contact]);
  }

  async function editContact(id: string, updates: Partial<ClientContact>) {
    if (!companyId) return;
    await updateClientContact(companyId, id, updates);
    setContacts((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c));
  }

  async function removeContact(id: string) {
    if (!companyId) return;
    await deleteClientContact(companyId, id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  // ── DOCUMENT ACTIONS ─────────────────────────────────────

  async function addDocument(payload: {
    name: string; type: ClientDocumentType;
    url?: string; notes?: string; expires_at?: string;
  }) {
    if (!companyId || !selected || !user) return;
    const doc = await createClientDocument(companyId, selected.id, user.id, payload);
    setDocuments((prev) => [doc, ...prev]);
  }

  async function editDocument(id: string, updates: {
    name?: string; url?: string; notes?: string; expires_at?: string;
  }) {
    if (!companyId) return;
    await updateClientDocument(companyId, id, updates);
    setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, ...updates } : d));
  }

  async function removeDocument(id: string) {
    if (!companyId) return;
    await deleteClientDocument(companyId, id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  return {
    clients, selected, setSelected,
    loading, saving, error, detailLoading,
    documents, contacts, connections,
    createClient, updateClient, toggleStatus,
    addContact, editContact, removeContact,
    addDocument, editDocument, removeDocument,
    reload: load,
  };
}

// ============================================================
// AUTO-CREAR CUENTA CRM — se llama al crear un cliente
// No bloquea si falla — el cliente ya fue creado
// ============================================================

async function autoCreateCRMAccount(
  companyId: string,
  clientId:  string,
  payload:   CreateClientPayload
): Promise<void> {
  try {
    // 1. Verificar que no exista ya una cuenta CRM para este cliente
    const { data: existing } = await supabase
      .from("crm_accounts")
      .select("id")
      .eq("company_id", companyId)
      .eq("client_id", clientId)
      .maybeSingle();

    if (existing) return; // Ya existe, no duplicar

    // 2. Crear cuenta CRM
    const { data: account, error } = await supabase
      .from("crm_accounts")
      .insert({
        company_id:      companyId,
        client_id:       clientId,
        name:            payload.name,
        legal_name:      payload.legal_name     ?? null,
        city:            payload.city           ?? null,
        country:         payload.country        ?? "México",
        status:          "active",
        is_customer:     payload.is_customer,
        lifecycle_stage: payload.is_customer ? "customer" : "lead",
        archived:        false,
      })
      .select("id")
      .single();

    if (error || !account) return;

    // 3. Identity bridge — conecta client ↔ crm_account
    await supabase.from("customer_identity_bridge").insert({
      company_id:       companyId,
      crm_account_id:   account.id,
      client_id:        clientId,
      bridge_status:    "linked",
      source_of_truth:  "clients",
      conversion_type:  "direct_client_creation",
      conversion_source:"clients_module",
      is_primary:       true,
    });

    // 4. Evento global en timeline
    await supabase.from("entity_timeline_events").insert({
      company_id:         companyId,
      entity_type:        "crm_account",
      entity_id:          account.id,
      related_account_id: account.id,
      related_client_id:  clientId,
      module_key:         "clients",
      event_type:         "created",
      event_category:     "commercial",
      title:              "Cuenta CRM creada automáticamente",
      description:        payload.name,
    });

  } catch {
    // Silencioso — no bloqueamos la creación del cliente
  }
}
