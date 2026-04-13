"use client";
// ============================================================
// CLIENTS CONTROLLER v2 — GOD LEVEL
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

  const [clients,      setClients]      = useState<Client[]>([]);
  const [selected,     setSelected]     = useState<Client | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [documents,    setDocuments]    = useState<ClientDocument[]>([]);
  const [contacts,     setContacts]     = useState<ClientContact[]>([]);
  const [connections,  setConnections]  = useState<ClientConnection[]>([]);
  const [detailLoading,setDetailLoading]= useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const data = await fetchClients(companyId);
      setClients(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const channel = supabase
      .channel(`clients-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "clients", filter: `company_id=eq.${companyId}` }, () => void load())
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
      // Create contacts in parallel
      if (initialContacts?.length) {
        await Promise.all(
          initialContacts.map((c) => createClientContact(companyId, client.id, user.id, c))
        );
      }
      // Create documents in parallel
      if (initialDocuments?.length) {
        await Promise.all(
          initialDocuments.map((d) => createClientDocument(companyId, client.id, user.id, d))
        );
      }
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

  async function addContact(payload: { name: string; role: ClientContactRole; title?: string; email?: string; phone?: string; is_primary?: boolean; notes?: string }) {
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

  async function addDocument(payload: { name: string; type: ClientDocumentType; url?: string; notes?: string; expires_at?: string }) {
    if (!companyId || !selected || !user) return;
    const doc = await createClientDocument(companyId, selected.id, user.id, payload);
    setDocuments((prev) => [doc, ...prev]);
  }

  async function editDocument(id: string, updates: { name?: string; url?: string; notes?: string; expires_at?: string }) {
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
