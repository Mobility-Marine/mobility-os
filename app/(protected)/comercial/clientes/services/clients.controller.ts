"use client";

// ============================================================
// CLIENTS CONTROLLER v1 — GOD LEVEL
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import type {
  Client, ClientDocument, ClientConnection,
  CreateClientPayload, ClientDocumentType,
} from "../types/clients.types";
import {
  fetchClients, createClient as createSvc,
  updateClient as updateSvc, toggleClientStatus,
  fetchClientDocuments, createClientDocument,
  deleteClientDocument, fetchClientConnections,
  fetchClientStats,
} from "./clients.service";

export function useClientsController() {
  const { companyId } = useTenant();
  const { user }      = useAuth();

  const [clients,     setClients]     = useState<Client[]>([]);
  const [selected,    setSelected]    = useState<Client | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [documents,   setDocuments]   = useState<ClientDocument[]>([]);
  const [connections, setConnections] = useState<ClientConnection[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── LOAD ────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const data = await fetchClients(companyId);
      setClients(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
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

  // ── LOAD DETAIL ─────────────────────────────────────────

  useEffect(() => {
    if (!selected || !companyId) {
      setDocuments([]); setConnections([]); return;
    }
    setDetailLoading(true);
    Promise.all([
      fetchClientDocuments(companyId, selected.id),
      fetchClientConnections(companyId, selected.id),
      fetchClientStats(companyId, selected.id),
    ]).then(([docs, conns, stats]) => {
      setDocuments(docs);
      setConnections(conns);
      setSelected((prev) => prev ? { ...prev, stats } : prev);
    }).finally(() => setDetailLoading(false));
  }, [selected?.id, companyId]);

  // ── ACTIONS ─────────────────────────────────────────────

  async function createClient(payload: CreateClientPayload) {
    if (!companyId) return;
    setSaving(true);
    try {
      const client = await createSvc(companyId, payload);
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

  async function addDocument(payload: {
    name: string; type: ClientDocumentType;
    url?: string; notes?: string; expires_at?: string;
  }) {
    if (!companyId || !selected || !user) return;
    const doc = await createClientDocument(companyId, selected.id, user.id, payload);
    setDocuments((prev) => [doc, ...prev]);
  }

  async function removeDocument(docId: string) {
    if (!companyId) return;
    await deleteClientDocument(companyId, docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  }

  return {
    clients, selected, setSelected,
    loading, saving, error, detailLoading,
    documents, connections,
    createClient, updateClient, toggleStatus,
    addDocument, removeDocument,
    reload: load,
  };
}
