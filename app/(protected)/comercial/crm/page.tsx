"use client";

// ===== INICIO IMPORTS =====
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
import AccountsSidebar from "./components/AccountsSidebar";
import AccountWorkspace from "./components/AccountWorkspace";
import AccountCopilot from "./components/AccountCopilot";
// ===== FIN IMPORTS =====

// ===== INICIO TYPES =====
type CrmAccount = {
  id: string;
  company_id: string;
  name: string;
  legal_name: string | null;
  industry: string | null;
  country: string | null;
  city: string | null;
  status: string;
  notes: string | null;
};

type CrmDocument = {
  id: string;
  account_id: string;
  name: string;
  file_path: string;
  file_type: string | null;
  size: number | null;
  storage_provider: string;
  created_at: string;
};

type CrmActivity = {
  id: string;
  company_id: string;
  account_id: string;
  type: string;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  completed: boolean;
  created_at: string;
};

type CrmOpportunity = {
  id: string;
  name: string;
  stage: string;
  estimated_value: number | null;
};

type CrmQuote = {
  id: string;
  quote_number: string;
  total_amount: number | null;
  status: string;
};

type CrmOrder = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number | null;
};

type TimelineItem = {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  date: string;
};

type CrmAccountInsights = {
  healthScore: number;
  priority: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  churnRisk: "BAJO" | "MEDIO" | "ALTO";
  nextBestAction: string;
  executiveSummary: string;
};

type CustomerAlert = {
  level: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";
  title: string;
  message: string;
};

type AiDirectorAdvice = {
  urgency: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  accountTemperature: "FRIA" | "TIBIA" | "CALIENTE";
  recommendedAction: string;
  alerts: string[];
  opportunitiesDetected: string[];
  risksDetected: string[];
};

type CrmContact = {
  id: string;
  account_id: string;
  name: string;
  position: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  role: string | null;
  influence_level: number | null;
  relationship_score: number | null;
  notes: string | null;
};

type AccountRadar = {
  accountId: string;
  temperature: "FRIA" | "TIBIA" | "CALIENTE";
  urgency: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  hasOpportunity: boolean;
  hasQuote: boolean;
  hasOrder: boolean;
  hasContacts: boolean;
};

type AccountRevenue = {
  accountId: string;
  pipelineValue: number;
  quotedValue: number;
  wonValue: number;
  totalPotential: number;
  tier: "LOW" | "MEDIUM" | "HIGH" | "STRATEGIC";
};

type AccountPriority = {
  accountId: string;
  score: number;
  label: "CRITICA" | "ALTA" | "MEDIA" | "BAJA";
};

type AccountAction = {
  accountId: string;
  action: string;
  reason: string;
  urgency: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
};

type CommandCenterData = {
  criticalAccounts: CrmAccount[];
  urgentActions: CrmAccount[];
  noFollowUp: CrmAccount[];
  highValue: CrmAccount[];
  coldAccounts: CrmAccount[];
};
// ===== FIN TYPES =====

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
    if (!companyId) return;

    loadAccounts();

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
        loadAccounts
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);
  // ===== FIN LOAD ACCOUNTS =====

  // ===== INICIO LOAD ACTIVITIES =====
  useEffect(() => {
    if (!selected) return;

    loadActivities(selected.id);

    const channel = supabase
      .channel("crm-activities-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "crm_activities",
          filter: `account_id=eq.${selected.id}`,
        },
        () => loadActivities(selected.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selected]);
  // ===== FIN LOAD ACTIVITIES =====

  async function loadActivities(accountId: string) {
    const { data } = await supabase
      .from("crm_activities")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });

    setActivities(data || []);
  }

  async function loadAccounts() {
    if (!companyId) return;

    const { data } = await supabase
      .from("crm_accounts")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    setAccounts(data || []);
    setLoading(false);

    (data || []).forEach((acc) => buildAccountRadar(acc));
    (data || []).forEach((acc) => buildAccountRevenue(acc));
    (data || []).forEach((acc) => buildAccountPriority(acc));
    (data || []).forEach((acc) => buildAccountAction(acc));
  }

  // ===== INICIO LOAD DETALLE COMPLETO CRM =====
  useEffect(() => {
    if (!selected) return;

    loadDocuments(selected.id);
    loadRelations(selected.id);
    loadContacts(selected.id);
    loadActivities(selected.id);
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
    buildAccountInsights(selected);
  }, [
    selected,
    contacts,
    activities,
    documents,
    opportunities,
    quotes,
    orders,
    timeline,
  ]);
  // ===== FIN RECALCULAR INSIGHTS =====

  // ===== INICIO RECALCULAR DIRECTOR IA =====
  useEffect(() => {
    if (!selected) return;
    buildDirectorAdvice(selected);
  }, [selected, contacts, activities, opportunities, quotes, orders, timeline]);
  // ===== FIN RECALCULAR DIRECTOR IA =====

  // ===== INICIO RECALCULAR ACTION ENGINE =====
  useEffect(() => {
    accounts.forEach((acc) => buildAccountAction(acc));
  }, [accounts, radarMap, revenueMap, priorityMap]);
  // ===== FIN RECALCULAR ACTION ENGINE =====

  // ===== INICIO RECALCULAR COMMAND CENTER =====
  useEffect(() => {
    if (accounts.length === 0) return;
    buildCommandCenter();
  }, [accounts, radarMap, revenueMap, priorityMap, actionMap]);
  // ===== FIN RECALCULAR COMMAND CENTER =====

  // ===== INICIO RECALCULAR CUSTOMER ALERTS =====
  useEffect(() => {
    if (!selected) return;
    buildCustomerAlerts();
  }, [selected, insights, activities, contacts, opportunities, quotes, orders]);
  // ===== FIN RECALCULAR CUSTOMER ALERTS =====

  function buildCustomerAlerts() {
    const list: CustomerAlert[] = [];

    if (insights && insights.churnRisk === "ALTO") {
      list.push({
        level: "CRITICAL",
        title: "Riesgo alto de pérdida",
        message: "La cuenta presenta baja actividad o engagement.",
      });
    }

    const futureActivities = activities.filter(
      (a) => a.scheduled_at && !a.completed
    );

    if (futureActivities.length === 0) {
      list.push({
        level: "WARNING",
        title: "Sin seguimiento programado",
        message: "No hay llamadas o reuniones futuras agendadas.",
      });
    }

    if (contacts.length === 0) {
      list.push({
        level: "CRITICAL",
        title: "Sin contactos clave",
        message: "La cuenta no tiene personas registradas.",
      });
    }

    if (opportunities.length > 0 || quotes.length > 0) {
      list.push({
        level: "INFO",
        title: "Oportunidad activa",
        message: "Existen procesos comerciales abiertos.",
      });
    }

    if (orders.length > 0) {
      list.push({
        level: "SUCCESS",
        title: "Cliente activo",
        message: "Tiene pedidos recientes.",
      });
    }

    setAlerts(list);
  }

  async function loadDocuments(accountId: string) {
    const { data } = await supabase
      .from("crm_documents")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });

    setDocuments(data || []);
  }

  async function loadRelations(accountId: string) {
    const { data: opps } = await supabase
      .from("sales_opportunities")
      .select("id, name, stage, estimated_value")
      .eq("account_id", accountId);

    const { data: qts } = await supabase
      .from("quotes")
      .select("id, quote_number, total_amount, status")
      .eq("account_id", accountId);

    const { data: ords } = await supabase
      .from("orders")
      .select("id, order_number, status, total_amount")
      .eq("account_id", accountId);

    setOpportunities(opps || []);
    setQuotes(qts || []);
    setOrders(ords || []);
  }

  async function buildTimeline(accountId: string) {
    const items: TimelineItem[] = [];

    const { data: acts } = await supabase
      .from("crm_activities")
      .select("*")
      .eq("account_id", accountId);

    acts?.forEach((a) => {
      items.push({
        id: a.id,
        type: "activity",
        title: a.title,
        description: a.type,
        date: a.created_at,
      });
    });

    const { data: docs } = await supabase
      .from("crm_documents")
      .select("*")
      .eq("account_id", accountId);

    docs?.forEach((d) => {
      items.push({
        id: d.id,
        type: "document",
        title: d.name,
        date: d.created_at,
      });
    });

    const { data: opps } = await supabase
      .from("sales_opportunities")
      .select("*")
      .eq("account_id", accountId);

    opps?.forEach((o) => {
      items.push({
        id: o.id,
        type: "opportunity",
        title: o.name,
        description: o.stage,
        date: o.created_at,
      });
    });

    const { data: qts } = await supabase
      .from("quotes")
      .select("*")
      .eq("account_id", accountId);

    qts?.forEach((q) => {
      items.push({
        id: q.id,
        type: "quote",
        title: q.quote_number,
        description: q.status,
        date: q.created_at,
      });
    });

    const { data: ords } = await supabase
      .from("orders")
      .select("*")
      .eq("account_id", accountId);

    ords?.forEach((o) => {
      items.push({
        id: o.id,
        type: "order",
        title: o.order_number,
        description: o.status,
        date: o.created_at,
      });
    });

    items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setTimeline(items);
  }

  function buildAccountInsights(account: CrmAccount) {
    let score = 0;

    if (account.legal_name) score += 10;
    if (account.industry) score += 10;
    if (account.country) score += 8;
    if (account.city) score += 6;
    if (account.notes) score += 6;

    if (contacts.length >= 1) score += 10;
    if (contacts.length >= 3) score += 6;

    const decisionMakers = contacts.filter(
      (c) =>
        c.role?.toLowerCase().includes("decision") ||
        c.role?.toLowerCase().includes("director") ||
        c.role?.toLowerCase().includes("buyer")
    ).length;

    if (decisionMakers > 0) score += 10;

    if (activities.length >= 1) score += 8;
    if (activities.length >= 5) score += 6;

    const futureActivities = activities.filter(
      (a) => a.scheduled_at && !a.completed
    ).length;

    if (futureActivities > 0) score += 8;

    if (documents.length >= 1) score += 8;
    if (documents.length >= 3) score += 4;

    if (opportunities.length >= 1) score += 10;
    if (quotes.length >= 1) score += 8;
    if (orders.length >= 1) score += 12;

    if (timeline.length >= 3) score += 6;
    if (timeline.length >= 8) score += 4;

    const healthScore = Math.min(score, 100);

    let churnRisk: "BAJO" | "MEDIO" | "ALTO" = "BAJO";
    if (healthScore < 40) churnRisk = "ALTO";
    else if (healthScore < 70) churnRisk = "MEDIO";

    let priority: "BAJA" | "MEDIA" | "ALTA" | "CRITICA" = "BAJA";
    if (opportunities.length > 0 && quotes.length > 0 && healthScore >= 70) {
      priority = "CRITICA";
    } else if (opportunities.length > 0 || quotes.length > 0) {
      priority = "ALTA";
    } else if (contacts.length > 0 || activities.length > 0) {
      priority = "MEDIA";
    }

    let nextBestAction = "Registrar siguiente paso comercial.";
    if (contacts.length === 0) {
      nextBestAction = "Agregar al menos un contacto clave de la cuenta.";
    } else if (futureActivities === 0) {
      nextBestAction = "Programar una llamada o reunión en agenda.";
    } else if (documents.length === 0) {
      nextBestAction = "Subir contrato, propuesta o documento comercial.";
    } else if (opportunities.length === 0) {
      nextBestAction =
        "Crear una oportunidad comercial vinculada a esta cuenta.";
    }

    const executiveSummary =
      healthScore >= 75
        ? "Cuenta bien trabajada, con contexto comercial sólido y buena trazabilidad."
        : healthScore >= 50
        ? "Cuenta con base útil, pero todavía necesita estructura comercial adicional."
        : "Cuenta frágil: faltan relaciones, actividad o activos comerciales clave.";

    setInsights({
      healthScore,
      priority,
      churnRisk,
      nextBestAction,
      executiveSummary,
    });
  }

  async function loadContacts(accountId: string) {
    const { data } = await supabase
      .from("crm_contacts")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });

    setContacts(data || []);
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

    loadDocuments(selected.id);
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

    loadContacts(selected.id);
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
    const radar = radarMap[id];
    const rev = revenueMap[id];

    let score = 0;

    if (radar?.temperature === "CALIENTE") score += 30;
    else if (radar?.temperature === "TIBIA") score += 15;

    if (radar?.urgency === "CRITICA") score += 30;
    else if (radar?.urgency === "ALTA") score += 25;
    else if (radar?.urgency === "MEDIA") score += 10;

    if (rev?.tier === "STRATEGIC") score += 35;
    else if (rev?.tier === "HIGH") score += 25;
    else if (rev?.tier === "MEDIUM") score += 10;

    if (activities.length === 0) score += 10;

    let label: AccountPriority["label"] = "BAJA";
    if (score >= 70) label = "CRITICA";
    else if (score >= 50) label = "ALTA";
    else if (score >= 30) label = "MEDIA";

    setPriorityMap((prev) => ({
      ...prev,
      [id]: { accountId: id, score, label },
    }));
  }

  function buildAccountAction(account: CrmAccount) {
    const id = account.id;
    const radar = radarMap[id];
    const rev = revenueMap[id];
    const priority = priorityMap[id];

    let action = "Monitorear cuenta";
    let reason = "No hay señales suficientes para una acción inmediata.";
    let urgency: AccountAction["urgency"] = "BAJA";

    if (!radar) {
      setActionMap((prev) => ({
        ...prev,
        [id]: { accountId: id, action, reason, urgency },
      }));
      return;
    }

    if (!radar.hasContacts) {
      action = "Identificar contacto clave";
      reason = "La cuenta no tiene contactos registrados.";
      urgency = "CRITICA";
    } else if (radar.hasQuote && !radar.hasOrder) {
      action = "Dar seguimiento a cotización";
      reason = "Hay cotización enviada pero todavía no existe pedido.";
      urgency = "ALTA";
    } else if (radar.hasOpportunity && !radar.hasQuote) {
      action = "Convertir oportunidad en propuesta";
      reason = "Existe una oportunidad abierta pero aún no hay cotización.";
      urgency = "ALTA";
    } else if (radar.hasOrder) {
      action = "Buscar upsell o recompra";
      reason = "La cuenta ya compra; conviene expandir relación comercial.";
      urgency = "MEDIA";
    } else if (priority?.label === "CRITICA") {
      action = "Contactar hoy mismo";
      reason = "La cuenta tiene alta prioridad comercial.";
      urgency = "CRITICA";
    } else if (priority?.label === "ALTA") {
      action = "Programar seguimiento";
      reason = "La cuenta tiene señales claras de valor u oportunidad.";
      urgency = "ALTA";
    } else if (rev?.tier === "STRATEGIC") {
      action = "Diseñar plan estratégico";
      reason = "La cuenta tiene alto potencial económico.";
      urgency = "ALTA";
    }

    setActionMap((prev) => ({
      ...prev,
      [id]: { accountId: id, action, reason, urgency },
    }));
  }

  function buildCommandCenter() {
    const criticalAccounts: CrmAccount[] = [];
    const urgentActions: CrmAccount[] = [];
    const noFollowUp: CrmAccount[] = [];
    const highValue: CrmAccount[] = [];
    const coldAccounts: CrmAccount[] = [];

    accounts.forEach((acc) => {
      const id = acc.id;
      const radar = radarMap[id];
      const rev = revenueMap[id];
      const act = actionMap[id];
      const pr = priorityMap[id];

      if (pr?.label === "CRITICA") {
        criticalAccounts.push(acc);
      }

      if (act?.urgency === "CRITICA" || act?.urgency === "ALTA") {
        urgentActions.push(acc);
      }

      if (radar && radar.hasContacts && !radar.hasOpportunity && !radar.hasOrder) {
        noFollowUp.push(acc);
      }

      if (rev?.tier === "STRATEGIC" || rev?.tier === "HIGH") {
        highValue.push(acc);
      }

      if (radar?.temperature === "FRIA") {
        coldAccounts.push(acc);
      }
    });

    setCommandCenter({
      criticalAccounts,
      urgentActions,
      noFollowUp,
      highValue,
      coldAccounts,
    });
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
      await loadAccounts();
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
    await loadAccounts();
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

            loadAccounts();
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
  
  // ===== FIN RENDER =====
}

const panelCard: React.CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 12,
  background: "#0f172a",
  border: "1px solid #1f2937",
  display: "grid",
  gap: 8,
};

const panelCardTitle: React.CSSProperties = {
  fontWeight: 800,
};

const rowCard: React.CSSProperties = {
  marginTop: 10,
  padding: 10,
  borderRadius: 8,
  background: "#0b1220",
  border: "1px solid #1f2937",
};

const inputStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #1f2937",
  background: "#0b1220",
  color: "#fff",
};

const primaryButton: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #1f2937",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};

const miniButton: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #1f2937",
  background: "#0b1220",
  color: "#fff",
  cursor: "pointer",
};

// =========================================================
// ===== 🔥 CRM UNICORNIO — CHIPS TÁCTICOS DE CUENTAS =====
// ===== (Panel izquierdo — radar comercial) =====
// =========================================================

const chipHot: React.CSSProperties = {
  background: "#ef4444",
  padding: "2px 6px",
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 800,
  color: "#fff",
};

const chipCritical: React.CSSProperties = {
  background: "#dc2626",
  padding: "2px 6px",
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 800,
  color: "#fff",
};

const chipMoney: React.CSSProperties = {
  background: "#16a34a",
  padding: "2px 6px",
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 800,
  color: "#fff",
};

const chipQuote: React.CSSProperties = {
  background: "#f59e0b",
  padding: "2px 6px",
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 800,
  color: "#111",
};

const chipRisk: React.CSSProperties = {
  background: "#64748b",
  padding: "2px 6px",
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 800,
  color: "#fff",
};

const tableHead: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "1px solid #1f2937",
  color: "#cbd5e1",
};

const tableCell: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #1f2937",
  color: "#e5e7eb",
};

// ===== INICIO COMPONENT COMMAND LIST =====
function CommandList({
  title,
  color,
  accounts,
  onSelect,
}: {
  title: string;
  color: string;
  accounts: CrmAccount[];
  onSelect: (a: CrmAccount) => void;
}) {
  if (accounts.length === 0) return null;

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontWeight: 700, color }}>
        {title} ({accounts.length})
      </div>

      {accounts.slice(0, 5).map((a) => (
        <div
          key={a.id}
          onClick={() => onSelect(a)}
          style={{
            padding: 10,
            borderRadius: 8,
            background: "#0b1220",
            border: `1px solid ${color}`,
            cursor: "pointer",
          }}
        >
          {a.name}
        </div>
      ))}
    </div>
  );
}
// ===== FIN COMPONENT COMMAND LIST =====

// ===== INICIO COMPONENT DOCUMENT ROW =====
function DocumentRow({ doc }: { doc: CrmDocument }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.storage
      .from("crm-documents")
      .getPublicUrl(doc.file_path);

    setUrl(data.publicUrl);
  }, [doc.file_path]);

  return (
    <div
      style={{
        padding: 10,
        borderBottom: "1px solid #1f2937",
      }}
    >
      <strong>{doc.name}</strong>

      {url && (
        <div>
          <a href={url} target="_blank" rel="noreferrer">
            Ver documento
          </a>
        </div>
      )}
    </div>
  );
}
// ===== FIN COMPONENT DOCUMENT ROW =====

// ===== INICIO COMPONENT ACTIVITY ROW =====
function ActivityRow({ activity }: { activity: CrmActivity }) {
  return (
    <div
      style={{
        padding: 10,
        borderBottom: "1px solid #1f2937",
      }}
    >
      <strong>{activity.title}</strong>

      <div style={{ fontSize: 12, color: "#94a3b8" }}>
        Tipo: {activity.type}
      </div>

      {activity.scheduled_at && (
        <div style={{ fontSize: 12 }}>
          Fecha: {new Date(activity.scheduled_at).toLocaleString("es-MX")}
        </div>
      )}
    </div>
  );
}
// ===== FIN COMPONENT ACTIVITY ROW =====

// ===== INICIO COMPONENT TIMELINE ROW =====
function TimelineRow({ item }: { item: TimelineItem }) {
  const colorMap: Record<string, string> = {
    activity: "#38bdf8",
    document: "#a78bfa",
    opportunity: "#34d399",
    quote: "#fbbf24",
    order: "#f87171",
  };

  const color = colorMap[item.type] || "#94a3b8";

  return (
    <div
      style={{
        padding: 12,
        borderBottom: "1px solid #1f2937",
        display: "grid",
        gap: 4,
      }}
    >
      <div style={{ fontWeight: 600, color }}>{item.title}</div>

      {item.description && (
        <div style={{ fontSize: 12 }}>{item.description}</div>
      )}

      <div style={{ fontSize: 11, color: "#94a3b8" }}>
        {new Date(item.date).toLocaleString("es-MX")}
      </div>
    </div>
  );
}
// ===== FIN COMPONENT TIMELINE ROW =====

// ===== INICIO COMPONENT REVENUE CARD =====
function RevenueCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        background: "#020617",
        border: `1px solid ${color}`,
        display: "grid",
        gap: 4,
      }}
    >
      <div style={{ fontSize: 12, color: "#94a3b8" }}>
        {label}
      </div>

      <div
        style={{
          fontWeight: 800,
          fontSize: 18,
          color,
        }}
      >
        ${value.toLocaleString("es-MX")}
      </div>
    </div>
  );
}
// ===== FIN COMPONENT REVENUE CARD =====

// ===== INICIO COMPONENT COMMERCIAL HEALTH =====
function CommercialHealthPanel({
  opportunities,
  quotes,
  orders,
  activities,
  timeline,
  contacts,
}: {
  opportunities: CrmOpportunity[];
  quotes: CrmQuote[];
  orders: CrmOrder[];
  activities: CrmActivity[];
  timeline: TimelineItem[];
  contacts: CrmContact[];
}) {
  let score = 0;

  if (contacts.length > 0) score += 10;
  if (activities.length > 0) score += 10;
  if (timeline.length > 3) score += 10;

  if (opportunities.length > 0) score += 20;
  if (quotes.length > 0) score += 25;
  if (orders.length > 0) score += 25;

  // Momentum
  let momentum = "ESTABLE";

  if (orders.length > 0) momentum = "EN CRECIMIENTO";
  else if (quotes.length > 0) momentum = "CERCANA AL CIERRE";
  else if (opportunities.length > 0) momentum = "EN PROSPECCIÓN";
  else if (activities.length === 0) momentum = "ABANDONADA";

  // Nivel salud
  let level = "BAJA";
  let color = "#ef4444";

  if (score >= 70) {
    level = "ALTA";
    color = "#22c55e";
  } else if (score >= 40) {
    level = "MEDIA";
    color = "#f59e0b";
  }

  // Recomendación
  let recommendation = "Reactivar relación comercial.";

  if (orders.length > 0)
    recommendation = "Mantener cliente activo y detectar upsell.";
  else if (quotes.length > 0)
    recommendation = "Dar seguimiento a cotización.";
  else if (opportunities.length > 0)
    recommendation = "Convertir oportunidad en propuesta.";
  else if (contacts.length === 0)
    recommendation = "Identificar contacto clave.";
  else if (activities.length === 0)
    recommendation = "Programar interacción.";

  return (
    <div
      style={{
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        background: "#020617",
        border: `1px solid ${color}`,
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ fontWeight: 800, color }}>
        SALUD COMERCIAL
      </div>

      <div>
        Nivel: <strong>{level}</strong>
      </div>

      <div>
        Momentum: <strong>{momentum}</strong>
      </div>

      <div style={{ color: "#cbd5e1" }}>
        {recommendation}
      </div>
    </div>
  );
}
// ===== FIN COMPONENT COMMERCIAL HEALTH =====

// ===== INICIO COMPONENT RISK OPPORTUNITY =====
function RiskOpportunityPanel({
  opportunities,
  quotes,
  orders,
  activities,
  timeline,
  contacts,
  revenue,
}: {
  opportunities: CrmOpportunity[];
  quotes: CrmQuote[];
  orders: CrmOrder[];
  activities: CrmActivity[];
  timeline: TimelineItem[];
  contacts: CrmContact[];
  revenue?: AccountRevenue;
}) {
  const hasSales = orders.length > 0;
  const hasPipeline = opportunities.length > 0 || quotes.length > 0;
  const inactive = activities.length === 0;
  const noContacts = contacts.length === 0;
  const lowHistory = timeline.length < 2;

  const highValue =
    revenue?.tier === "STRATEGIC" || revenue?.tier === "HIGH";

  let risk: string | null = null;
  let opportunity: string | null = null;
  let sleeper: string | null = null;

  // 🔴 Riesgo de churn
  if (!hasSales && inactive && noContacts) {
    risk = "Cuenta en alto riesgo de pérdida";
  } else if (inactive && lowHistory) {
    risk = "Cuenta sin actividad reciente";
  }

  // 🟢 Oportunidad
  if (hasSales && hasPipeline) {
    opportunity = "Potencial de expansión o upsell";
  } else if (!hasSales && hasPipeline) {
    opportunity = "Cercana a conversión";
  }

  // 🟡 Dormida valiosa
  if (highValue && !hasPipeline && inactive) {
    sleeper = "Cuenta valiosa sin seguimiento";
  }

  return (
    <div
      style={{
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        background: "#020617",
        border: "1px solid #1f2937",
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ fontWeight: 800, color: "#a78bfa" }}>
        RADAR ESTRATÉGICO IA
      </div>

      {risk && (
        <div style={{ color: "#ef4444" }}>
          🔴 {risk}
        </div>
      )}

      {opportunity && (
        <div style={{ color: "#22c55e" }}>
          🟢 {opportunity}
        </div>
      )}

      {sleeper && (
        <div style={{ color: "#f59e0b" }}>
          🟡 {sleeper}
        </div>
      )}

      {!risk && !opportunity && !sleeper && (
        <div style={{ color: "#94a3b8" }}>
          Sin alertas estratégicas.
        </div>
      )}
    </div>
  );
}
// ===== FIN COMPONENT RISK OPPORTUNITY =====
