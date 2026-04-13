"use client";
import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth }   from "@/lib/auth/AuthProvider";
import { supabase }  from "@/lib/supabaseClient";
import type { ShipmentDocument, DocFilters } from "../types/docs.types";
import { DEFAULT_DOC_FILTERS }               from "../types/docs.types";
import {
  fetchDocuments, fetchDocument, createDocument,
  updateDocument, updateDocStatus, deleteDocument,
  filterDocuments,
} from "./docs.service";

export function useDocsController(shipmentId?: string) {
  const { companyId } = useTenant();
  const { user }      = useAuth();

  const [docs,     setDocs]     = useState<ShipmentDocument[]>([]);
  const [selected, setSelected] = useState<ShipmentDocument | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [filters,  setFilters]  = useState<DocFilters>(DEFAULT_DOC_FILTERS);

  const load = useCallback(async () => {
    if (!companyId) return;
    const data = await fetchDocuments(companyId, shipmentId);
    setDocs(data);
    setLoading(false);
  }, [companyId, shipmentId]);

  useEffect(() => {
    if (!companyId) return;
    void load();
    const ch = supabase
      .channel(`docs-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "shipment_documents", filter: `company_id=eq.${companyId}` },
        () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [companyId, load]);

  const filtered = filterDocuments(docs, filters);

  async function handleCreate(payload: Partial<ShipmentDocument>): Promise<ShipmentDocument | undefined> {
    if (!companyId || !user) return;
    setSaving(true);
    try {
      const doc = await createDocument(companyId, user.id, payload);
      await load();
      setSelected(doc);
      return doc;
    } finally { setSaving(false); }
  }

  async function handleUpdate(id: string, updates: Partial<ShipmentDocument>) {
    if (!companyId) return;
    setSaving(true);
    try {
      await updateDocument(companyId, id, updates);
      await load();
      if (selected?.id === id) {
        const d = await fetchDocument(companyId, id);
        if (d) setSelected(d);
      }
    } finally { setSaving(false); }
  }

  async function handleStatusChange(id: string, status: any) {
    if (!companyId) return;
    await updateDocStatus(companyId, id, status);
    await load();
    if (selected?.id === id) {
      const d = await fetchDocument(companyId, id);
      if (d) setSelected(d);
    }
  }

  async function handleDelete(id: string) {
    if (!companyId) return;
    await deleteDocument(companyId, id);
    if (selected?.id === id) setSelected(null);
    await load();
  }

  return {
    docs, filtered, selected, setSelected,
    loading, saving,
    filters, setFilters,
    handleCreate, handleUpdate, handleStatusChange, handleDelete,
    reload: load,
  };
}
