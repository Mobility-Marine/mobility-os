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
  fetchTimeline,
  findClientByName,
  createGlobalClient
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

// ======================================================
// ===== CREATE ACCOUNT — GLOBAL CUSTOMER CONNECTED =====
// ======================================================
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

  // ===== 1) BUSCAR CLIENTE GLOBAL EXISTENTE =====
  let client = await findClientByName(companyId, payload.name);

  // ===== 2) CREAR CLIENTE GLOBAL SI NO EXISTE =====
  if (!client) {
    client = await createGlobalClient(companyId, {
      name: payload.name,
      legal_name: payload.legal_name,
      country: payload.country,
      city: payload.city,
      notes: payload.notes,
    });
  }

  // ===== 3) CREAR CUENTA CRM LIGADA AL CLIENTE GLOBAL =====
  const { data: account, error } = await supabase
    .from("crm_accounts")
    .insert({
      company_id: companyId,
      client_id: client.id,
      name: payload.name,
      legal_name: payload.legal_name || null,
      industry: payload.industry || null,
      country: payload.country || null,
      city: payload.city || null,
      status: payload.status || "active",
      notes: payload.notes || null,
      is_customer: true,
      lifecycle_stage: "customer",
    })
    .select("*")
    .single();

  if (error) throw error;

  // ===== 4) REGISTRAR TRAZABILIDAD =====
  await supabase.from("customer_identity_bridge").insert({
    company_id: companyId,
    crm_account_id: account.id,
    client_id: client.id,
    bridge_status: "linked",
    source_of_truth: "crm_accounts",
    conversion_type: "manual_account_creation",
    conversion_source: "crm_module",
    is_primary: true,
  });

  // ===== 5) REGISTRAR EVENTO GLOBAL =====
  await supabase.from("entity_timeline_events").insert({
    company_id: companyId,
    entity_type: "crm_account",
    entity_id: account.id,
    related_account_id: account.id,
    related_client_id: client.id,
    module_key: "crm",
    event_type: "created",
    event_category: "commercial",
    title: "Cuenta CRM creada",
    description: `Cuenta ligada al cliente global ${client.name ?? payload.name}`,
  });

  const data = await fetchAccounts(companyId);
  setAccounts(data);
}

// ======================================================
// ===== CREATE CONTACT — ALIGNED TO REAL DB SCHEMA =====
// ======================================================
async function createContact(accountId: string) {
  if (!companyId) return;

  const fullName = prompt("Nombre completo del contacto");
  if (!fullName) return;

  const parts = fullName.trim().split(" ");
  const first_name = parts.shift() || "";
  const last_name = parts.join(" ") || null;

  const job_title = prompt("Puesto") || null;
  const email = prompt("Email") || null;
  const phone = prompt("Teléfono") || null;

  const { error } = await supabase.from("crm_contacts").insert({
    company_id: companyId,
    account_id: accountId,
    first_name,
    last_name,
    email,
    phone,
    mobile_phone: null,
    job_title,
    department: null,
    role_in_decision: "user",
    influence_level: 3,
    notes: null,
  });

  if (error) throw error;

  const data = await fetchContacts(accountId);
  setContacts(data);

  // ===== TIMELINE GLOBAL =====
  await supabase.from("entity_timeline_events").insert({
    company_id: companyId,
    entity_type: "crm_account",
    entity_id: accountId,
    related_account_id: accountId,
    module_key: "crm",
    event_type: "contact_created",
    event_category: "relationship",
    title: "Contacto agregado",
    description: fullName,
  });
}

// ======================================================
// ===== CREATE ACTIVITY — GLOBAL TIMELINE CONNECTED =====
// ======================================================
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

  const { data: activity, error } = await supabase
    .from("crm_activities")
    .insert({
      company_id: companyId,
      account_id: accountId,
      type,
      title,
      scheduled_at: scheduled,
      completed: false,
    })
    .select("*")
    .single();

  if (error) throw error;

  // ===== TIMELINE GLOBAL =====
  await supabase.from("entity_timeline_events").insert({
    company_id: companyId,
    entity_type: "crm_account",
    entity_id: accountId,
    related_account_id: accountId,
    related_activity_id: activity.id,
    module_key: "crm",
    event_type: "activity_created",
    event_category: "commercial",
    title: "Actividad creada",
    description: title,
    occurred_at: activity.created_at,
  });

  const data = await fetchActivities(accountId);
  setActivities(data);
}

// ======================================================
// ===== UPLOAD DOCUMENT — GLOBAL EVENT CONNECTED =======
// ======================================================
async function uploadDocument(accountId: string, file: File) {
  if (!companyId) return;

  const filePath = `${companyId}/${accountId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("crm-documents")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: doc, error } = await supabase
    .from("crm_documents")
    .insert({
      company_id: companyId,
      account_id: accountId,
      name: file.name,
      file_path: filePath,
      file_type: file.type,
      size: file.size,
      storage_provider: "supabase",
    })
    .select("*")
    .single();

  if (error) throw error;

  // ===== EVENTO GLOBAL =====
  await supabase.from("entity_timeline_events").insert({
    company_id: companyId,
    entity_type: "crm_account",
    entity_id: accountId,
    related_account_id: accountId,
    related_document_id: doc.id,
    module_key: "crm",
    event_type: "document_uploaded",
    event_category: "information",
    title: "Documento cargado",
    description: file.name,
    occurred_at: doc.created_at,
  });

  const data = await fetchDocuments(accountId);
  setDocuments(data);
}

// ======================================================
// ===== UPDATE ACCOUNT LIFECYCLE — GLOBAL SAFE =========
// ======================================================
async function updateAccountLifecycle(
  accountId: string,
  stage: "lead" | "prospect" | "customer" | "inactive" | "strategic"
) {
  if (!companyId) return;

  // ===== 1) ACTUALIZAR CUENTA CRM =====
  const { data: account, error } = await supabase
    .from("crm_accounts")
    .update({
      lifecycle_stage: stage,
    })
    .eq("id", accountId)
    .eq("company_id", companyId)
    .select("*")
    .single();

  if (error || !account) return;

  // ===== 2) EVENTO GLOBAL =====
  await supabase.from("entity_timeline_events").insert({
    company_id: companyId,
    entity_type: "crm_account",
    entity_id: accountId,
    related_account_id: accountId,
    related_client_id: account.client_id ?? null,
    module_key: "crm",
    event_type: "lifecycle_changed",
    event_category: "commercial",
    title: "Cambio de etapa",
    description: `Nueva etapa: ${stage}`,
  });

  // ===== 3) SI SE CONVIERTE EN CLIENTE — ASEGURAR FLAG =====
  if (stage === "customer") {
    await supabase
      .from("crm_accounts")
      .update({ is_customer: true })
      .eq("id", accountId)
      .eq("company_id", companyId);
  }

  // ===== 4) SI SE INACTIVA =====
  if (stage === "inactive") {
    await supabase
      .from("crm_accounts")
      .update({ archived: true })
      .eq("id", accountId)
      .eq("company_id", companyId);
  }
}
  
// ======================================================
// ===== IMPORTADOR DE CUENTAS — PRO ====================
// ======================================================

function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "");
}

function findHeaderIndex(headers: string[], aliases: string[]) {
  const normalized = headers.map(normalizeHeader);
  const aliasSet = aliases.map(normalizeHeader);
  return normalized.findIndex((h) => aliasSet.includes(h));
}

async function handleImportAccounts(file: File) {
  if (!companyId) return [];

  const text = await file.text();

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);

  const idx = {
    name: findHeaderIndex(headers, ["name", "nombre", "empresa", "account"]),
    legal_name: findHeaderIndex(headers, [
      "legal_name",
      "razon_social",
      "razón_social",
      "legalname",
    ]),
    industry: findHeaderIndex(headers, ["industry", "industria", "sector"]),
    country: findHeaderIndex(headers, ["country", "pais", "país"]),
    city: findHeaderIndex(headers, ["city", "ciudad"]),
    status: findHeaderIndex(headers, ["status", "estado"]),
    notes: findHeaderIndex(headers, ["notes", "notas", "comentarios"]),
  };

  if (idx.name === -1) return [];

  const seenKeys = new Set<string>();

  const rows = lines.slice(1).map((line, i) => {
    const cols = parseCsvLine(line);

    const row = {
      name: cols[idx.name] || "",
      legal_name: idx.legal_name >= 0 ? cols[idx.legal_name] || "" : "",
      industry: idx.industry >= 0 ? cols[idx.industry] || "" : "",
      country: idx.country >= 0 ? cols[idx.country] || "" : "",
      city: idx.city >= 0 ? cols[idx.city] || "" : "",
      status: idx.status >= 0 ? cols[idx.status] || "active" : "active",
      notes: idx.notes >= 0 ? cols[idx.notes] || "" : "",
      _rowNumber: i + 2,
      _warnings: [] as string[],
    };

    const uniqueKey =
      row.name.trim().toLowerCase() ||
      row.legal_name.trim().toLowerCase();

    if (!row.name.trim()) {
      row._warnings.push("Fila sin nombre");
    }

    if (uniqueKey) {
      if (seenKeys.has(uniqueKey)) {
        row._warnings.push("Duplicada dentro del archivo");
      } else {
        seenKeys.add(uniqueKey);
      }
    }

    return row;
  });

  return rows.filter((r) => r.name.trim());
}

// ======================================================
// ===== CONFIRM IMPORT — GLOBAL SAFE VERSION ===========
// ======================================================
async function confirmImportAccounts(
  rows: any[],
  mode: "insert" | "upsert"
) {
  if (!companyId || rows.length === 0) return;

  for (const row of rows) {

    // ===== 1) BUSCAR CLIENTE GLOBAL =====
    let client = await findClientByName(companyId, row.name);

    // ===== 2) CREAR CLIENTE GLOBAL SI NO EXISTE =====
    if (!client) {
      client = await createGlobalClient(companyId, {
        name: row.name,
        legal_name: row.legal_name,
        country: row.country,
        city: row.city,
        notes: row.notes,
      });
    }

    // ===== 3) BUSCAR CUENTA CRM EXISTENTE =====
    let existingAccountId: string | null = null;

    const { data: existing } = await supabase
      .from("crm_accounts")
      .select("id")
      .eq("company_id", companyId)
      .eq("client_id", client.id)
      .maybeSingle();

    if (existing?.id) existingAccountId = existing.id;

    // ===== 4) UPSERT LOGIC =====
    if (existingAccountId && mode === "upsert") {

      await supabase
        .from("crm_accounts")
        .update({
          legal_name: row.legal_name || null,
          industry: row.industry || null,
          country: row.country || null,
          city: row.city || null,
          status: row.status || "active",
          notes: row.notes || null,
        })
        .eq("id", existingAccountId);

    } else if (!existingAccountId) {

      const { data: account } = await supabase
        .from("crm_accounts")
        .insert({
          company_id: companyId,
          client_id: client.id,
          name: row.name,
          legal_name: row.legal_name || null,
          industry: row.industry || null,
          country: row.country || null,
          city: row.city || null,
          status: row.status || "active",
          notes: row.notes || null,
          is_customer: true,
          lifecycle_stage: "customer",
        })
        .select("*")
        .single();

      // ===== BRIDGE =====
      await supabase.from("customer_identity_bridge").insert({
        company_id: companyId,
        crm_account_id: account.id,
        client_id: client.id,
        bridge_status: "linked",
        source_of_truth: "crm_accounts",
        conversion_type: "import",
        conversion_source: "crm_import",
        is_primary: true,
      });

      // ===== EVENTO GLOBAL =====
      await supabase.from("entity_timeline_events").insert({
        company_id: companyId,
        entity_type: "crm_account",
        entity_id: account.id,
        related_account_id: account.id,
        related_client_id: client.id,
        module_key: "crm",
        event_type: "imported",
        event_category: "commercial",
        title: "Cuenta importada",
        description: row.name,
      });
    }
  }

  await fetchAccounts(companyId).then(setAccounts);
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
uploadDocument,
handleImportAccounts,
confirmImportAccounts,
updateAccountLifecycle,
};
}
