"use client";

// ===== INICIO IMPORTS =====
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";

import AccountsSidebar from "./components/AccountsSidebar";
import AccountWorkspace from "./components/AccountWorkspace";
import AccountCopilot from "./components/AccountCopilot";

// ===== TYPES =====
import type {
  CrmAccount,
  CrmDocument,
  CrmActivity,
  CrmOpportunity,
  CrmQuote,
  CrmOrder,
  TimelineItem,
  CrmAccountInsights,
  CustomerAlert,
  AiDirectorAdvice,
  CrmContact,
  AccountRadar,
  AccountRevenue,
  AccountPriority,
  AccountAction,
  CommandCenterData
} from "./types/crm.types";

// ===== SERVICES =====
import {
  fetchAccounts,
  fetchDocuments,
  fetchActivities,
  fetchContacts,
  fetchRelations,
  fetchTimeline
} from "./services/crm.service";

// ===== ANALYTICS ENGINE =====
import {
  calculateAccountRadar,
  calculateAccountRevenue,
  calculateAccountPriority,
  calculateAccountAction,
  calculateCommandCenter,
  calculateDirectorAdvice
} from "./services/crm.analytics";

// ===== UI =====
import {
  panelCard,
  panelCardTitle,
  inputStyle,
  miniButton,
  primaryButton,
  chipHot,
  chipCritical,
  chipMoney,
  chipQuote,
  chipRisk,
  tableHead,
  tableCell,
  CommandList,
  TimelineRow,
  CommercialHealthPanel,
  RiskOpportunityPanel
} from "./components/ui/CRMSharedUI";
// ===== INTELLIGENCE =====
import {
  buildAccountInsights,
  buildCustomerAlerts
} from "./services/crm.intelligence";
// ===== FIN IMPORTS =====

export default function CRMPage() {
  // ===== INICIO TENANT =====
  const { companyId } = useTenant();
  // ===== FIN TENANT =====

  // ===== INICIO STATE =====
  const [accounts, setAccounts] = useState<CrmAccount[]>([]);
  const [selected, setSelected] = useState<CrmAccount | null>(null);
  const [documents, setDocuments] = useState<CrmDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [newActivityType, setNewActivityType] = useState("call");
  const [newActivityDate, setNewActivityDate] = useState("");

  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [insights, setInsights] = useState<CrmAccountInsights | null>(null);
  const [director, setDirector] = useState<AiDirectorAdvice | null>(null);
  const [alerts, setAlerts] = useState<CustomerAlert[]>([]);

  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([]);
  const [quotes, setQuotes] = useState<CrmQuote[]>([]);
  const [orders, setOrders] = useState<CrmOrder[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);

  const [radarMap, setRadarMap] = useState<Record<string, AccountRadar>>({});
  const [revenueMap, setRevenueMap] = useState<Record<string, AccountRevenue>>(
    {}
  );
  const [priorityMap, setPriorityMap] = useState<
    Record<string, AccountPriority>
  >({});
  const [actionMap, setActionMap] = useState<Record<string, AccountAction>>({});
  const [commandCenter, setCommandCenter] =
    useState<CommandCenterData | null>(null);

  const [search, setSearch] = useState("");
  // ===== ACCOUNT CREATION MODAL =====
const [showCreateAccount, setShowCreateAccount] = useState(false);

const [newAccount, setNewAccount] = useState({
  name: "",
  legal_name: "",
  industry: "",
  country: "",
  city: "",
  status: "active",
  notes: "",
});

// ===== INICIO STATE IMPORTADOR =====
const [showImportModal, setShowImportModal] = useState(false);
const [importing, setImporting] = useState(false);
const [importRows, setImportRows] = useState<
  Array<{
    name: string;
    legal_name: string;
    industry: string;
    country: string;
    city: string;
    status: string;
    notes: string;
    _rowNumber: number;
    _warnings: string[];
  }>
>([]);

const [importMode, setImportMode] = useState<"insert" | "upsert">("insert");
// ===== FIN STATE IMPORTADOR =====
  
  // ===== FIN STATE =====

  // ===== INICIO FILTERED ACCOUNTS =====
  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return [...accounts].sort(
        (a, b) =>
          (priorityMap[b.id]?.score || 0) - (priorityMap[a.id]?.score || 0)
      );
    }

    return [...accounts]
      .filter((a) => {
        return (
          a.name.toLowerCase().includes(q) ||
          a.legal_name?.toLowerCase().includes(q) ||
          a.industry?.toLowerCase().includes(q) ||
          a.city?.toLowerCase().includes(q) ||
          a.country?.toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          (priorityMap[b.id]?.score || 0) - (priorityMap[a.id]?.score || 0)
      );
  }, [accounts, priorityMap, search]);
  // ===== FIN FILTERED ACCOUNTS =====

// ===== INICIO EXECUTIVE TOP ACCOUNTS =====
const executiveTopAccounts = useMemo(() => {
  return [...accounts]
    .map((account) => {
      const priority = priorityMap[account.id];
      const revenue = revenueMap[account.id];
      const radar = radarMap[account.id];
      const action = actionMap[account.id];

      let executiveScore = 0;

      executiveScore += priority?.score || 0;

      if (revenue?.tier === "STRATEGIC") executiveScore += 30;
      else if (revenue?.tier === "HIGH") executiveScore += 20;
      else if (revenue?.tier === "MEDIUM") executiveScore += 10;

      if (radar?.urgency === "CRITICA") executiveScore += 25;
      else if (radar?.urgency === "ALTA") executiveScore += 15;
      else if (radar?.urgency === "MEDIA") executiveScore += 8;

      if (action?.urgency === "CRITICA") executiveScore += 20;
      else if (action?.urgency === "ALTA") executiveScore += 12;
      else if (action?.urgency === "MEDIA") executiveScore += 6;

      return {
        account,
        executiveScore,
      };
    })
    .sort((a, b) => b.executiveScore - a.executiveScore)
    .slice(0, 3);
}, [accounts, priorityMap, revenueMap, radarMap, actionMap]);
// ===== FIN EXECUTIVE TOP ACCOUNTS =====
  
  // ===== INICIO LOAD ACCOUNTS =====
  useEffect(() => {
  if (!companyId) {
  setLoading(false);
  return;
}

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
      () => {
        fetchAccounts(companyId).then(setAccounts);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [companyId]);
  // ===== FIN LOAD ACCOUNTS =====

// ===== INICIO CALCULO INTELIGENCIA DE CUENTAS =====
useEffect(() => {
  accounts.forEach((acc) => {
    buildAccountRadar(acc);
    buildAccountRevenue(acc);
  });
}, [accounts]);
// ===== FIN CALCULO INTELIGENCIA DE CUENTAS =====
  
  // ===== INICIO LOAD DETALLE COMPLETO CRM =====
  useEffect(() => {
  if (!selected) return;

  fetchDocuments(selected.id).then(setDocuments);
  fetchActivities(selected.id).then(setActivities);
  fetchContacts(selected.id).then(setContacts);

  fetchRelations(selected.id).then((r) => {
    setOpportunities(r.opportunities);
    setQuotes(r.quotes);
    setOrders(r.orders);
  });

}, [selected]);
  // ===== FIN LOAD DETALLE COMPLETO CRM =====

  // ===== INICIO RECALCULAR TIMELINE AUTOMATICO =====
  useEffect(() => {
    if (!selected) return;
    buildTimeline(selected.id);
  }, [activities, documents, opportunities, quotes, orders, selected]);
  // ===== FIN RECALCULAR TIMELINE AUTOMATICO =====

  // ===== INICIO RECALCULAR INSIGHTS =====
  useEffect(() => {
  if (!selected) return;

  const insights = buildAccountInsights(selected, {
    contacts,
    activities,
    documents,
    opportunities,
    quotes,
    orders,
    timeline
  });

  setInsights(insights);

}, [
  selected,
  contacts,
  activities,
  documents,
  opportunities,
  quotes,
  orders,
  timeline
]);
  // ===== FIN RECALCULAR INSIGHTS =====

  // ===== INICIO RECALCULAR DIRECTOR IA =====
  useEffect(() => {
    if (!selected) return;
    buildDirectorAdvice(selected);
  }, [selected, contacts, activities, opportunities, quotes, orders, timeline]);
  // ===== FIN RECALCULAR DIRECTOR IA =====

  // ===== INICIO CALCULO PRIORIDAD =====
useEffect(() => {
  accounts.forEach((acc) => buildAccountPriority(acc));
}, [accounts, radarMap, revenueMap, activities]);
// ===== FIN CALCULO PRIORIDAD =====

  // ===== INICIO RECALCULAR COMMAND CENTER =====
  useEffect(() => {
    if (accounts.length === 0) return;
    buildCommandCenter();
  }, [accounts, radarMap, revenueMap, priorityMap, actionMap]);
  // ===== FIN RECALCULAR COMMAND CENTER =====

  // ===== INICIO RECALCULAR CUSTOMER ALERTS =====
 useEffect(() => {
  if (!selected) return;

  const alerts = buildCustomerAlerts(
    insights,
    activities,
    contacts,
    opportunities,
    quotes,
    orders
  );

  setAlerts(alerts);

}, [
  selected,
  insights,
  activities,
  contacts,
  opportunities,
  quotes,
  orders
]);
  // ===== FIN RECALCULAR CUSTOMER ALERTS =====

  async function buildTimeline(accountId: string) {
  const items = await fetchTimeline(accountId);
  setTimeline(items);
}

  async function uploadDocument(file: File) {
    if (!selected || !companyId) return;

    const filePath = `${companyId}/${selected.id}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("crm-documents")
      .upload(filePath, file);

    if (error) {
      alert("Error subiendo archivo");
      return;
    }

    await supabase.from("crm_documents").insert({
      company_id: companyId,
      account_id: selected.id,
      name: file.name,
      file_path: filePath,
      file_type: file.type,
      size: file.size,
      storage_provider: "supabase",
    });

    fetchDocuments(selected.id).then(setDocuments);
  }

  async function createContact() {
    if (!selected || !companyId) return;

    const name = prompt("Nombre del contacto");
    if (!name) return;

    const position = prompt("Puesto") || null;
    const email = prompt("Email") || null;
    const phone = prompt("Teléfono") || null;

    await supabase.from("crm_contacts").insert({
      company_id: companyId,
      account_id: selected.id,
      name,
      position,
      email,
      phone,
      role: "user",
      influence_level: 3,
      relationship_score: 50,
    });

    fetchContacts(selected.id).then(setContacts);
  }

  async function createActivity() {
    if (!selected || !companyId) return;
    if (!newActivityTitle.trim()) return;

    const scheduled = newActivityDate
      ? new Date(newActivityDate).toISOString()
      : null;

    const { error } = await supabase
      .from("crm_activities")
      .insert({
        company_id: companyId,
        account_id: selected.id,
        type: newActivityType,
        title: newActivityTitle,
        scheduled_at: scheduled,
        completed: false,
      });

    if (error) {
      alert("Error creando actividad");
      return;
    }

    if (scheduled) {
      await supabase.from("calendar_events").insert({
        company_id: companyId,
        title: newActivityTitle,
        event_type: newActivityType,
        related_account_id: selected.id,
        start_at: scheduled,
        source: "crm",
      });
    }

    setNewActivityTitle("");
    setNewActivityDate("");
  }

  function buildDirectorAdvice(account: CrmAccount) {
    const directorAlerts: string[] = [];
    const opportunitiesDetected: string[] = [];
    const risksDetected: string[] = [];

    let urgency: AiDirectorAdvice["urgency"] = "BAJA";
    let accountTemperature: AiDirectorAdvice["accountTemperature"] = "FRIA";
    let recommendedAction = "Monitorear actividad.";

    const recentActivity = activities.length > 0;

    if (recentActivity) accountTemperature = "TIBIA";

    if (opportunities.length > 0) {
      accountTemperature = "CALIENTE";
      opportunitiesDetected.push("Oportunidad comercial activa");
    }

    if (quotes.length > 0 && orders.length === 0) {
      opportunitiesDetected.push("Cotización enviada sin cierre");
      recommendedAction = "Dar seguimiento a cotización";
      urgency = "ALTA";
    }

    if (orders.length > 0) {
      opportunitiesDetected.push("Cliente activo con pedidos");
      recommendedAction = "Mantener relación y detectar upsell";
    }

    if (contacts.length === 0) {
      risksDetected.push("No hay contactos registrados");
      directorAlerts.push("Cuenta sin relación identificada");
      urgency = "ALTA";
      recommendedAction = "Identificar contacto clave";
    }

    if (!recentActivity) {
      risksDetected.push("Sin actividad registrada");
      directorAlerts.push("Cuenta inactiva");
      urgency = "MEDIA";
      recommendedAction = "Programar contacto";
    }

    if (timeline.length < 2) {
      risksDetected.push("Poco historial del cliente");
    }

    if (account.status === "strategic") {
      urgency = "CRITICA";
      directorAlerts.push("Cuenta estratégica");
    }

    setDirector({
      urgency,
      accountTemperature,
      recommendedAction,
      alerts: directorAlerts,
      opportunitiesDetected,
      risksDetected,
    });
  }

  async function buildAccountRadar(account: CrmAccount) {
    const id = account.id;

    const { data: opps } = await supabase
      .from("sales_opportunities")
      .select("id")
      .eq("account_id", id);

    const { data: qts } = await supabase
      .from("quotes")
      .select("id")
      .eq("account_id", id);

    const { data: ords } = await supabase
      .from("orders")
      .select("id")
      .eq("account_id", id);

    const { data: cts } = await supabase
      .from("crm_contacts")
      .select("id")
      .eq("account_id", id);

    let temperature: AccountRadar["temperature"] = "FRIA";
    let urgency: AccountRadar["urgency"] = "BAJA";

    if ((opps?.length || 0) > 0) temperature = "CALIENTE";
    else if ((cts?.length || 0) > 0) temperature = "TIBIA";

    if ((qts?.length || 0) > 0 && (ords?.length || 0) === 0) {
      urgency = "ALTA";
    }

    if ((cts?.length || 0) === 0) {
      urgency = "CRITICA";
    }

    setRadarMap((prev) => ({
      ...prev,
      [id]: {
        accountId: id,
        temperature,
        urgency,
        hasOpportunity: (opps?.length || 0) > 0,
        hasQuote: (qts?.length || 0) > 0,
        hasOrder: (ords?.length || 0) > 0,
        hasContacts: (cts?.length || 0) > 0,
      },
    }));
  }

  async function buildAccountRevenue(account: CrmAccount) {
    const id = account.id;

    const { data: opps } = await supabase
      .from("sales_opportunities")
      .select("estimated_value")
      .eq("account_id", id);

    const { data: qts } = await supabase
      .from("quotes")
      .select("total_amount")
      .eq("account_id", id);

    const { data: ords } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("account_id", id);

    const pipelineValue =
      opps?.reduce((s, o) => s + (o.estimated_value || 0), 0) || 0;

    const quotedValue =
      qts?.reduce((s, q) => s + (q.total_amount || 0), 0) || 0;

    const wonValue =
      ords?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0;

    const totalPotential = pipelineValue + quotedValue + wonValue;

    let tier: AccountRevenue["tier"] = "LOW";
    if (totalPotential > 5_000_000) tier = "STRATEGIC";
    else if (totalPotential > 1_000_000) tier = "HIGH";
    else if (totalPotential > 100_000) tier = "MEDIUM";

    setRevenueMap((prev) => ({
      ...prev,
      [id]: {
        accountId: id,
        pipelineValue,
        quotedValue,
        wonValue,
        totalPotential,
        tier,
      },
    }));
  }

  function buildAccountPriority(account: CrmAccount) {
  const id = account.id;

  const priority = calculateAccountPriority(
    radarMap[id],
    revenueMap[id],
    activities
  );

  setPriorityMap((prev) => ({
    ...prev,
    [id]: { ...priority, accountId: id },
  }));
}

  function buildAccountAction(account: CrmAccount) {
  const id = account.id;

  const action = calculateAccountAction(
    radarMap[id],
    revenueMap[id],
    priorityMap[id]
  );

  setActionMap((prev) => ({
    ...prev,
    [id]: { ...action, accountId: id },
  }));
}

  function buildCommandCenter() {
  const data = calculateCommandCenter(
    accounts,
    radarMap,
    revenueMap,
    priorityMap,
    actionMap
  );

  setCommandCenter(data);
}

  // ===== INICIO FUNCIONES IMPORTADOR =====
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

async function handleImportFile(file: File) {
  if (!companyId) return;

  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    alert("El archivo no contiene datos.");
    return;
  }

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

  if (idx.name === -1) {
    alert(
      'No encontré la columna de nombre. Usa una de estas: "name", "nombre", "empresa", "account".'
    );
    return;
  }

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

    const uniqueKey = `${row.name}`.trim().toLowerCase() ||
      `${row.legal_name}`.trim().toLowerCase();

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

    if (!row.status.trim()) {
      row.status = "active";
    }

    return row;
  });

  const validRows = rows.filter((r) => r.name.trim());

  if (validRows.length === 0) {
    alert("No se encontraron filas válidas para importar.");
    return;
  }

  setImportRows(validRows);
  setShowImportModal(true);
}

async function confirmImportRows() {
  if (!companyId || importRows.length === 0) return;

  try {
    setImporting(true);

    if (importMode === "insert") {
      const payload = importRows.map((row) => ({
        company_id: companyId,
        name: row.name,
        legal_name: row.legal_name || null,
        industry: row.industry || null,
        country: row.country || null,
        city: row.city || null,
        status: row.status || "active",
        notes: row.notes || null,
      }));

      const { error } = await supabase.from("crm_accounts").insert(payload);

      if (error) {
        alert("Error importando cuentas.");
        return;
      }

      setShowImportModal(false);
      setImportRows([]);
      await fetchAccounts(companyId).then(setAccounts);
      alert(`Se importaron ${payload.length} cuentas.`);
      return;
    }

    for (const row of importRows) {
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
        const { error } = await supabase
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

        if (error) {
          alert(`Error actualizando cuenta: ${row.name}`);
          return;
        }
      } else {
        const { error } = await supabase.from("crm_accounts").insert({
          company_id: companyId,
          name: row.name,
          legal_name: row.legal_name || null,
          industry: row.industry || null,
          country: row.country || null,
          city: row.city || null,
          status: row.status || "active",
          notes: row.notes || null,
        });

        if (error) {
          alert(`Error insertando cuenta: ${row.name}`);
          return;
        }
      }
    }

    setShowImportModal(false);
    setImportRows([]);
    await fetchAccounts(companyId).then(setAccounts);
    alert(`Importación completada en modo upsert (${importRows.length} filas).`);
  } finally {
    setImporting(false);
  }
}
// ===== FIN FUNCIONES IMPORTADOR =====

  // ===== INICIO FUNCION EXPORTADOR =====
function exportAccountsToCsv(onlyFiltered = false) {
  const list = onlyFiltered ? filteredAccounts : accounts;

  if (!list || list.length === 0) {
    alert("No hay cuentas para exportar.");
    return;
  }

  const headers = [
    "name",
    "legal_name",
    "industry",
    "country",
    "city",
    "status",
    "notes",
  ];

  const escape = (value: any) => {
    if (value == null) return "";
    const str = String(value);
    if (str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    if (str.includes(",") || str.includes("\n")) {
      return `"${str}"`;
    }
    return str;
  };

  const rows = list.map((a) =>
    [
      escape(a.name),
      escape(a.legal_name),
      escape(a.industry),
      escape(a.country),
      escape(a.city),
      escape(a.status),
      escape(a.notes),
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;

  const date = new Date().toISOString().slice(0, 10);

  link.download = onlyFiltered
    ? `crm-cuentas-filtradas-${date}.csv`
    : `crm-cuentas-${date}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
// ===== FIN FUNCION EXPORTADOR =====

  // ===== INICIO RENDER =====
  if (loading) return <div style={{ padding: 40 }}>Cargando CRM...</div>;

  return (
    <div
      style={{
        height: "calc(100vh - 40px)",
        display: "grid",
        gridTemplateColumns: "320px minmax(0, 1fr) 340px",
        gap: 16,
        padding: 16,
        background: "#020617",
      }}
    >
      {/* ========================================================= */}
      {/* ===== PANEL IZQUIERDO — RADAR DE CUENTAS ===== */}
      {/* ========================================================= */}

<AccountsSidebar
  search={search}
  setSearch={setSearch}
  filteredAccounts={filteredAccounts}
  selected={selected}
  setSelected={setSelected}
  radarMap={radarMap}
  revenueMap={revenueMap}
  actionMap={actionMap}
  executiveTopAccounts={executiveTopAccounts}
  commandCenter={commandCenter}
  handleImportFile={handleImportFile}
  exportAccountsToCsv={exportAccountsToCsv}
  miniButton={miniButton}
  chipHot={chipHot}
  chipCritical={chipCritical}
  chipMoney={chipMoney}
  chipQuote={chipQuote}
  chipRisk={chipRisk}
  CommandList={CommandList}
/>
      
{/* ========================================================= */}
{/* ===== PANEL CENTRAL — WORKSPACE DEL CLIENTE ===== */}
{/* ========================================================= */}
<AccountWorkspace
  selected={selected}
  priorityMap={priorityMap}
  radarMap={radarMap}
  revenueMap={revenueMap}
  actionMap={actionMap}
  insights={insights}
  opportunities={opportunities}
  quotes={quotes}
  orders={orders}
  activities={activities}
  timeline={timeline}
  contacts={contacts}
  createActivity={createActivity}
  createContact={createContact}
  uploadDocument={uploadDocument}
  primaryButton={primaryButton}
  miniButton={miniButton}
  panelCard={panelCard}
  panelCardTitle={panelCardTitle}
  TimelineRow={TimelineRow}
  CommercialHealthPanel={CommercialHealthPanel}
  RiskOpportunityPanel={RiskOpportunityPanel}
/>

      {/* ========================================================= */}
      {/* ===== PANEL DERECHO — COPILOT IA ===== */}
      {/* ========================================================= */}
      
      <AccountCopilot
  selected={selected}
  director={director}
/>

{/* ========================================================= */}
{/* ===== MODAL CREAR CUENTA — UNICORN WIZARD ===== */}
{/* ========================================================= */}
{showCreateAccount && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "grid",
      placeItems: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        width: 520,
        maxWidth: "95vw",
        background: "#020617",
        border: "1px solid #1f2937",
        borderRadius: 14,
        padding: 22,
        display: "grid",
        gap: 14,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 800 }}>
        Nueva cuenta
      </div>

      {/* ===== CAMPOS ===== */}
      <input
        placeholder="Nombre comercial *"
        value={newAccount.name}
        onChange={(e) =>
          setNewAccount({ ...newAccount, name: e.target.value })
        }
        style={inputStyle}
      />

      <input
        placeholder="Razón social"
        value={newAccount.legal_name}
        onChange={(e) =>
          setNewAccount({
            ...newAccount,
            legal_name: e.target.value,
          })
        }
        style={inputStyle}
      />

      <input
        placeholder="Industria"
        value={newAccount.industry}
        onChange={(e) =>
          setNewAccount({
            ...newAccount,
            industry: e.target.value,
          })
        }
        style={inputStyle}
      />

      <div style={{ display: "flex", gap: 10 }}>
        <input
          placeholder="Ciudad"
          value={newAccount.city}
          onChange={(e) =>
            setNewAccount({ ...newAccount, city: e.target.value })
          }
          style={{ ...inputStyle, flex: 1 }}
        />

        <input
          placeholder="País"
          value={newAccount.country}
          onChange={(e) =>
            setNewAccount({
              ...newAccount,
              country: e.target.value,
            })
          }
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>

      <textarea
        placeholder="Notas estratégicas"
        value={newAccount.notes}
        onChange={(e) =>
          setNewAccount({
            ...newAccount,
            notes: e.target.value,
          })
        }
        style={{
          ...inputStyle,
          minHeight: 80,
          resize: "vertical",
        }}
      />

      {/* ===== BOTONES ===== */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          style={miniButton}
          onClick={() => setShowCreateAccount(false)}
        >
          Cancelar
        </button>

        <button
          style={primaryButton}
          onClick={async () => {
            if (!newAccount.name || !companyId) return;

            await supabase.from("crm_accounts").insert({
              company_id: companyId,
              ...newAccount,
            });

            setShowCreateAccount(false);

            setNewAccount({
              name: "",
              legal_name: "",
              industry: "",
              country: "",
              city: "",
              status: "active",
              notes: "",
            });

            fetchAccounts(companyId).then(setAccounts);
          }}
        >
          Crear cuenta
        </button>
      </div>
    </div>
  </div>
)}

{/* ===== MODAL IMPORTACIÓN MASIVA ===== */}
{showImportModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "grid",
      placeItems: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        width: 900,
        maxWidth: "95vw",
        maxHeight: "85vh",
        overflow: "auto",
        background: "#020617",
        border: "1px solid #1f2937",
        borderRadius: 14,
        padding: 20,
        display: "grid",
        gap: 14,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 800 }}>
        Importación masiva de cuentas
      </div>

      <div style={{ display: "grid", gap: 8 }}>
  <div style={{ color: "#94a3b8", fontSize: 13 }}>
    Se detectaron {importRows.length} filas válidas.
  </div>

  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    <span style={{ fontSize: 13, color: "#cbd5e1" }}>
      Modo:
    </span>

    <button
      type="button"
      style={importMode === "insert" ? primaryButton : miniButton}
      onClick={() => setImportMode("insert")}
    >
      Insertar nuevas
    </button>

    <button
      type="button"
      style={importMode === "upsert" ? primaryButton : miniButton}
      onClick={() => setImportMode("upsert")}
    >
      Insertar / actualizar
    </button>
  </div>
</div>

      <div
        style={{
          border: "1px solid #1f2937",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr style={{ background: "#0b1220" }}>
              <th style={tableHead}>Nombre</th>
              <th style={tableHead}>Razón social</th>
              <th style={tableHead}>Industria</th>
              <th style={tableHead}>Ciudad</th>
              <th style={tableHead}>País</th>
              <th style={tableHead}>Estado</th>
              <th style={tableHead}>Advertencias</th>
            </tr>
          </thead>

          <tbody>
            {importRows.slice(0, 50).map((row, i) => (
              <tr key={i}>
                <td style={tableCell}>{row.name}</td>
                <td style={tableCell}>{row.legal_name || "-"}</td>
                <td style={tableCell}>{row.industry || "-"}</td>
                <td style={tableCell}>{row.city || "-"}</td>
                <td style={tableCell}>{row.country || "-"}</td>
                <td style={tableCell}>{row.status || "active"}</td>
                <td style={tableCell}>
  {row._warnings.length > 0 ? row._warnings.join(" · ") : "-"}
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {importRows.length > 50 && (
        <div style={{ color: "#94a3b8", fontSize: 12 }}>
          Mostrando solo las primeras 50 filas.
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          style={miniButton}
          onClick={() => {
            setShowImportModal(false);
            setImportRows([]);
          }}
          disabled={importing}
        >
          Cancelar
        </button>

        <button
          style={primaryButton}
          onClick={confirmImportRows}
          disabled={importing}
        >
          {importing ? "Importando..." : "Confirmar importación"}
        </button>
      </div>
    </div>
  </div>
)}
  
</div>
);

 // ===== FIN RENDER =====
}
