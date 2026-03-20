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

// ===== CONFIRMAR IMPORTACIÓN =====

async function confirmImportAccounts(
  rows: any[],
  mode: "insert" | "upsert"
) {
  if (!companyId || rows.length === 0) return;

  if (mode === "insert") {
    const payload = rows.map((row) => ({
      company_id: companyId,
      name: row.name,
      legal_name: row.legal_name || null,
      industry: row.industry || null,
      country: row.country || null,
      city: row.city || null,
      status: row.status || "active",
      notes: row.notes || null,
    }));

    await supabase.from("crm_accounts").insert(payload);
    await fetchAccounts(companyId).then(setAccounts);
    return;
  }

  for (const row of rows) {
    const legalName = row.legal_name?.trim();
    const name = row.name.trim();

    let existingId: string | null = null;

    if (legalName) {
      const { data } = await supabase
        .from("crm_accounts")
        .select("id")
        .eq("company_id", companyId)
        .eq("legal_name", legalName)
        .maybeSingle();

      if (data?.id) existingId = data.id;
    }

    if (!existingId) {
      const { data } = await supabase
        .from("crm_accounts")
        .select("id")
        .eq("company_id", companyId)
        .eq("name", name)
        .maybeSingle();

      if (data?.id) existingId = data.id;
    }

    if (existingId) {
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
        .eq("id", existingId);
    } else {
      await supabase.from("crm_accounts").insert({
        company_id: companyId,
        name: row.name,
        legal_name: row.legal_name || null,
        industry: row.industry || null,
        country: row.country || null,
        city: row.city || null,
        status: row.status || "active",
        notes: row.notes || null,
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
  uploadDocument
  handleImportAccounts,
  confirmImportAccounts,
};
}
