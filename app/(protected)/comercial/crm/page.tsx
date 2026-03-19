"use client";

// ===== INICIO IMPORTS =====
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
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

// ===== INICIO TYPE CRM ACTIVITY =====
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
// ===== FIN TYPE CRM ACTIVITY =====

// ===== INICIO TYPES RELACIONADOS CRM 360 =====
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
// ===== FIN TYPES RELACIONADOS CRM 360 =====

// ===== INICIO TYPE TIMELINE ITEM =====
type TimelineItem = {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  date: string;
};
// ===== FIN TYPE TIMELINE ITEM =====

// ===== INICIO TYPE CRM ACCOUNT INSIGHTS =====
type CrmAccountInsights = {
  healthScore: number;
  priority: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  churnRisk: "BAJO" | "MEDIO" | "ALTO";
  nextBestAction: string;
  executiveSummary: string;
};
// ===== FIN TYPE CRM ACCOUNT INSIGHTS =====

type CustomerAlert = {
  level: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";
  title: string;
  message: string;
};

// ===== INICIO TYPE AI DIRECTOR =====
type AiDirectorAdvice = {
  urgency: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  accountTemperature: "FRIA" | "TIBIA" | "CALIENTE";
  recommendedAction: string;
  alerts: string[];
  opportunitiesDetected: string[];
  risksDetected: string[];
};
// ===== FIN TYPE AI DIRECTOR =====

// ===== FIN TYPES =====

// ===== INICIO TYPES CONTACTOS =====
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
// ===== FIN TYPES CONTACTOS =====

// ===== INICIO TYPE ACCOUNT RADAR =====
type AccountRadar = {
  accountId: string;
  temperature: "FRIA" | "TIBIA" | "CALIENTE";
  urgency: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  hasOpportunity: boolean;
  hasQuote: boolean;
  hasOrder: boolean;
  hasContacts: boolean;
};
// ===== FIN TYPE ACCOUNT RADAR =====

// ===== INICIO TYPE ACCOUNT REVENUE =====
type AccountRevenue = {
  accountId: string;
  pipelineValue: number;
  quotedValue: number;
  wonValue: number;
  totalPotential: number;
  tier: "LOW" | "MEDIUM" | "HIGH" | "STRATEGIC";
};
// ===== FIN TYPE ACCOUNT REVENUE =====

// ===== INICIO TYPE ACCOUNT PRIORITY =====
type AccountPriority = {
  accountId: string;
  score: number;
  label: "CRITICA" | "ALTA" | "MEDIA" | "BAJA";
};
// ===== FIN TYPE ACCOUNT PRIORITY =====

// ===== INICIO TYPE ACCOUNT ACTION =====
type AccountAction = {
  accountId: string;
  action: string;
  reason: string;
  urgency: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
};
// ===== FIN TYPE ACCOUNT ACTION =====

// ===== INICIO TYPE COMMAND CENTER =====
type CommandCenterData = {
  criticalAccounts: CrmAccount[];
  urgentActions: CrmAccount[];
  noFollowUp: CrmAccount[];
  highValue: CrmAccount[];
  coldAccounts: CrmAccount[];
};
// ===== FIN TYPE COMMAND CENTER =====

export default function CRMPage() {

  // ===== INICIO TENANT =====
  const { companyId } = useTenant();
  // ===== FIN TENANT =====

  // ===== INICIO STATE =====
  const [accounts, setAccounts] = useState<CrmAccount[]>([]);
  const [selected, setSelected] = useState<CrmAccount | null>(null);
  const [documents, setDocuments] = useState<CrmDocument[]>([]);
  const [loading, setLoading] = useState(true);
  // ===== INICIO STATE ACTIVITIES =====
const [activities, setActivities] = useState<CrmActivity[]>([]);
const [newActivityTitle, setNewActivityTitle] = useState("");
const [newActivityType, setNewActivityType] = useState("call");
const [newActivityDate, setNewActivityDate] = useState("");
// ===== FIN STATE ACTIVITIES =====
  // ===== INICIO STATE TIMELINE =====
const [timeline, setTimeline] = useState<TimelineItem[]>([]);
// ===== FIN STATE TIMELINE =====
  // ===== INICIO STATE INSIGHTS IA =====
const [insights, setInsights] = useState<CrmAccountInsights | null>(null);
// ===== FIN STATE INSIGHTS IA =====
const [director, setDirector] = useState<AiDirectorAdvice | null>(null);
const [alerts, setAlerts] = useState<CustomerAlert[]>([]);
  // ===== FIN STATE =====

  // ===== INICIO STATE RELACIONES CRM =====
const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([]);
const [quotes, setQuotes] = useState<CrmQuote[]>([]);
const [orders, setOrders] = useState<CrmOrder[]>([]);
// ===== FIN STATE RELACIONES CRM =====

  // ===== INICIO STATE CONTACTOS =====
const [contacts, setContacts] = useState<CrmContact[]>([]);
// ===== FIN STATE CONTACTOS =====
// ===== INICIO STATE RADAR =====
const [radarMap, setRadarMap] = useState<Record<string, AccountRadar>>({});
// ===== FIN STATE RADAR =====
// ===== INICIO STATE REVENUE =====
const [revenueMap, setRevenueMap] =
  useState<Record<string, AccountRevenue>>({});
// ===== FIN STATE REVENUE =====
// ===== INICIO STATE PRIORITY =====
const [priorityMap, setPriorityMap] =
  useState<Record<string, AccountPriority>>({});
// ===== FIN STATE PRIORITY =====
// ===== INICIO STATE ACTION MAP =====
const [actionMap, setActionMap] =
  useState<Record<string, AccountAction>>({});
// ===== FIN STATE ACTION MAP =====
// ===== INICIO STATE COMMAND CENTER =====
const [commandCenter, setCommandCenter] =
  useState<CommandCenterData | null>(null);
// ===== FIN STATE COMMAND CENTER =====

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

async function loadActivities(accountId: string) {
  const { data } = await supabase
    .from("crm_activities")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  setActivities(data || []);
}
// ===== FIN LOAD ACTIVITIES =====
  
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

  // ===== INICIO LOAD DOCUMENTS =====
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
}, [activities, documents, opportunities, quotes, orders]);
// ===== FIN RECALCULAR TIMELINE AUTOMATICO =====

// ===== INICIO RECALCULAR INSIGHTS =====
useEffect(() => {
  if (!selected) return;
  buildAccountInsights(selected);
}, [selected, contacts, activities, documents, opportunities, quotes, orders, timeline]);
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

  useEffect(() => {
  if (!selected) return;
  buildCustomerAlerts();
}, [insights, activities, contacts, opportunities, quotes, orders]);

  function buildCustomerAlerts() {
  const list: CustomerAlert[] = [];

  // 🔴 Riesgo alto
  if (insights && insights.churnRisk === "ALTO") {
    list.push({
      level: "CRITICAL",
      title: "Riesgo alto de pérdida",
      message: "La cuenta presenta baja actividad o engagement.",
    });
  }

  // 🟡 Sin actividades futuras
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

  // ❌ Sin contactos
  if (contacts.length === 0) {
    list.push({
      level: "CRITICAL",
      title: "Sin contactos clave",
      message: "La cuenta no tiene personas registradas.",
    });
  }

  // ⭐ Prioridad comercial
  if (opportunities.length > 0 || quotes.length > 0) {
    list.push({
      level: "INFO",
      title: "Oportunidad activa",
      message: "Existen procesos comerciales abiertos.",
    });
  }

  // 🟢 Cliente activo
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
  // ===== FIN LOAD DOCUMENTS =====

  // ===== INICIO LOAD RELACIONES CRM =====
async function loadRelations(accountId: string) {
  // 🔹 Oportunidades
  const { data: opps } = await supabase
    .from("sales_opportunities")
    .select("id, name, stage, estimated_value")
    .eq("account_id", accountId);

  setOpportunities(opps || []);

  // 🔹 Cotizaciones
  const { data: qts } = await supabase
    .from("quotes")
    .select("id, quote_number, total_amount, status")
    .eq("account_id", accountId);

  setQuotes(qts || []);

  // 🔹 Pedidos
  const { data: ords } = await supabase
    .from("orders")
    .select("id, order_number, status, total_amount")
    .eq("account_id", accountId);

  setOrders(ords || []);
}
// ===== FIN LOAD RELACIONES CRM =====

// ===== INICIO BUILD TIMELINE 360 =====
async function buildTimeline(accountId: string) {
  const items: TimelineItem[] = [];

  // 🔹 Actividades
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

  // 🔹 Documentos
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

  // 🔹 Oportunidades
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

  // 🔹 Cotizaciones
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

  // 🔹 Pedidos
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

  // 🔹 Ordenar cronológicamente
  items.sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  setTimeline(items);
}
// ===== FIN BUILD TIMELINE 360 =====

// ===== INICIO BUILD CRM ACCOUNT INSIGHTS =====
function buildAccountInsights(account: CrmAccount) {
  let score = 0;

  // 🔹 Base de completitud
  if (account.legal_name) score += 10;
  if (account.industry) score += 10;
  if (account.country) score += 8;
  if (account.city) score += 6;
  if (account.notes) score += 6;

  // 🔹 Contactos
  if (contacts.length >= 1) score += 10;
  if (contacts.length >= 3) score += 6;

  const decisionMakers = contacts.filter(
    (c) =>
      c.role?.toLowerCase().includes("decision") ||
      c.role?.toLowerCase().includes("director") ||
      c.role?.toLowerCase().includes("buyer")
  ).length;

  if (decisionMakers > 0) score += 10;

  // 🔹 Actividades
  if (activities.length >= 1) score += 8;
  if (activities.length >= 5) score += 6;

  const futureActivities = activities.filter(
    (a) => a.scheduled_at && !a.completed
  ).length;

  if (futureActivities > 0) score += 8;

  // 🔹 Documentos
  if (documents.length >= 1) score += 8;
  if (documents.length >= 3) score += 4;

  // 🔹 Comercial
  if (opportunities.length >= 1) score += 10;
  if (quotes.length >= 1) score += 8;
  if (orders.length >= 1) score += 12;

  // 🔹 Timeline / vida del cliente
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
    nextBestAction = "Crear una oportunidad comercial vinculada a esta cuenta.";
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
// ===== FIN BUILD CRM ACCOUNT INSIGHTS =====
  
  // ===== INICIO LOAD CONTACTOS =====
async function loadContacts(accountId: string) {
  const { data } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  setContacts(data || []);
}
// ===== FIN LOAD CONTACTOS =====

  // ===== INICIO UPLOAD DOCUMENT =====
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
  // ===== FIN UPLOAD DOCUMENT =====

// ===== INICIO CREATE CONTACT =====
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
// ===== FIN CREATE CONTACT =====
  
// ===== INICIO CREATE ACTIVITY =====
async function createActivity() {
  if (!selected || !companyId) return;
  if (!newActivityTitle.trim()) return;

  const scheduled = newActivityDate
    ? new Date(newActivityDate).toISOString()
    : null;

  // 🔹 1. Crear actividad CRM
  const { data, error } = await supabase
    .from("crm_activities")
    .insert({
      company_id: companyId,
      account_id: selected.id,
      type: newActivityType,
      title: newActivityTitle,
      scheduled_at: scheduled,
      completed: false,
    })
    .select()
    .single();

  if (error) {
    alert("Error creando actividad");
    return;
  }

  // 🔹 2. Crear evento en Agenda (SI tiene fecha)
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
// ===== FIN CREATE ACTIVITY =====

// ===== INICIO BUILD DIRECTOR IA =====
function buildDirectorAdvice(account: CrmAccount) {
  const alerts: string[] = [];
  const opportunitiesDetected: string[] = [];
  const risksDetected: string[] = [];

  let urgency: AiDirectorAdvice["urgency"] = "BAJA";
  let accountTemperature: AiDirectorAdvice["accountTemperature"] = "FRIA";
  let recommendedAction = "Monitorear actividad.";

  const recentActivity = activities.length > 0;

  if (recentActivity) accountTemperature = "TIBIA";

  // 🔹 Oportunidades activas
  if (opportunities.length > 0) {
    accountTemperature = "CALIENTE";
    opportunitiesDetected.push("Oportunidad comercial activa");
  }

  // 🔹 Cotización sin pedido
  if (quotes.length > 0 && orders.length === 0) {
    opportunitiesDetected.push("Cotización enviada sin cierre");
    recommendedAction = "Dar seguimiento a cotización";
    urgency = "ALTA";
  }

  // 🔹 Pedidos activos
  if (orders.length > 0) {
    opportunitiesDetected.push("Cliente activo con pedidos");
    recommendedAction = "Mantener relación y detectar upsell";
  }

  // 🔹 Sin contactos
  if (contacts.length === 0) {
    risksDetected.push("No hay contactos registrados");
    alerts.push("Cuenta sin relación identificada");
    urgency = "ALTA";
    recommendedAction = "Identificar contacto clave";
  }

  // 🔹 Sin actividad
  if (!recentActivity) {
    risksDetected.push("Sin actividad registrada");
    alerts.push("Cuenta inactiva");
    urgency = "MEDIA";
    recommendedAction = "Programar contacto";
  }

  // 🔹 Poco historial
  if (timeline.length < 2) {
    risksDetected.push("Poco historial del cliente");
  }

  // 🔹 Cuenta estratégica
  if (account.status === "strategic") {
    urgency = "CRITICA";
    alerts.push("Cuenta estratégica");
  }

  setDirector({
    urgency,
    accountTemperature,
    recommendedAction,
    alerts,
    opportunitiesDetected,
    risksDetected,
  });
}
// ===== FIN BUILD DIRECTOR IA =====

  // ===== INICIO BUILD ACCOUNT RADAR =====
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
// ===== FIN BUILD ACCOUNT RADAR =====

// ===== INICIO BUILD ACCOUNT REVENUE =====
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
// ===== FIN BUILD ACCOUNT REVENUE =====

  // ===== INICIO BUILD ACCOUNT PRIORITY =====
function buildAccountPriority(account: CrmAccount) {
  const id = account.id;

  const radar = radarMap[id];
  const rev = revenueMap[id];

  let score = 0;

 // 🔥 Temperatura comercial
if (radar?.temperature === "CALIENTE") score += 30;
else if (radar?.temperature === "TIBIA") score += 15;
// "FRIA" no suma

// ⚠️ Urgencia
if (radar?.urgency === "CRITICA") score += 30;
else if (radar?.urgency === "ALTA") score += 25;
else if (radar?.urgency === "MEDIA") score += 10;
// "BAJA" no suma

// 💰 Valor económico
if (rev?.tier === "STRATEGIC") score += 35;
else if (rev?.tier === "HIGH") score += 25;
else if (rev?.tier === "MEDIUM") score += 10;
// "LOW" no suma

// 🧠 Actividad (cuenta dormida = más prioridad)
if (activities.length === 0) score += 10;

// 📊 Clasificación final
let label: AccountPriority["label"] = "BAJA";

if (score >= 70) label = "CRITICA";
else if (score >= 50) label = "ALTA";
else if (score >= 30) label = "MEDIA";

  setPriorityMap((prev) => ({
    ...prev,
    [id]: { accountId: id, score, label },
  }));
}
// ===== FIN BUILD ACCOUNT PRIORITY =====

  // ===== INICIO BUILD ACCOUNT ACTION =====
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
      [id]: {
        accountId: id,
        action,
        reason,
        urgency,
      },
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
    [id]: {
      accountId: id,
      action,
      reason,
      urgency,
    },
  }));
}
// ===== FIN BUILD ACCOUNT ACTION =====

  // ===== INICIO BUILD COMMAND CENTER =====
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
// ===== FIN BUILD COMMAND CENTER =====
  
// ===== INICIO RENDER =====

if (loading) return <div style={{ padding: 40 }}>Cargando CRM...</div>;

return (
  <div
    style={{
      height: "calc(100vh - 40px)",
      display: "grid",
      gridTemplateColumns: "320px 1fr 340px",
      gap: 16,
      padding: 16,
      background: "#020617",
    }}
  >

    {/* ===== PANEL IZQUIERDO — RADAR ===== */}

    <div
      style={{
        background: "#020617",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8 }}>
        CUENTAS
      </div>

      <input
        placeholder="Buscar cuenta..."
        style={{
          padding: 8,
          borderRadius: 8,
          border: "1px solid #1f2937",
          background: "#0b1220",
          color: "#fff",
          marginBottom: 10,
        }}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button>Importar</button>
        <button>Exportar</button>
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        <div style={{ display: "grid", gap: 10 }}>
          {[...accounts]
            .sort((a, b) => {
              const pa = priorityMap[a.id]?.score || 0;
              const pb = priorityMap[b.id]?.score || 0;
              return pb - pa;
            })
            .map((a) => {
              const r = radarMap[a.id];
              const rev = revenueMap[a.id];
              const p = priorityMap[a.id];

              return (
                <div
                  key={a.id}
                  onClick={() => setSelected(a)}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    background: "#0b1220",
                    border: "1px solid #1f2937",
                    cursor: "pointer",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <strong>{a.name}</strong>

                  {p && (
                    <span style={{ fontSize: 11 }}>
                      Prioridad: {p.label}
                    </span>
                  )}

                  {rev && (
                    <span style={{ fontSize: 11 }}>
                      Tier: {rev.tier}
                    </span>
                  )}

                  {r && (
                    <span style={{ fontSize: 11 }}>
                      Temp: {r.temperature} · Urg: {r.urgency}
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>

    {/* ===== PANEL CENTRAL ===== */}

    <div
      style={{
        background: "#020617",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {!selected && (
        <div style={{ color: "#94a3b8" }}>
          Selecciona una cuenta para ver detalles.
        </div>
      )}

      {selected && (
        <div style={{ overflowY: "auto", display: "grid", gap: 16 }}>
          <h2>{selected.name}</h2>

          <div>Industria: {selected.industry || "-"}</div>
          <div>
            Ubicación: {selected.city || "-"}, {selected.country || "-"}
          </div>
          <div>Estado: {selected.status}</div>

          {selected.notes && <div>Notas: {selected.notes}</div>}
        </div>
      )}
    </div>

    {/* ===== PANEL DERECHO — AI ===== */}

    <div
      style={{
        background: "#020617",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        overflowY: "auto",
      }}
    >
      <div style={{ fontWeight: 800, color: "#38bdf8" }}>
        COPILOT COMERCIAL IA
      </div>

      {!selected && (
        <div style={{ color: "#94a3b8" }}>
          Selecciona una cuenta para ver recomendaciones.
        </div>
      )}

      {director && (
        <div>
          <div>
            Urgencia: <strong>{director.urgency}</strong>
          </div>

          <div>
            Temperatura:{" "}
            <strong>{director.accountTemperature}</strong>
          </div>

          <div>{director.recommendedAction}</div>
        </div>
      )}

      {alerts.length > 0 && (
        <div>
          <strong>Alertas</strong>

          {alerts.map((a, i) => (
            <div key={i}>• {a.title}</div>
          ))}
        </div>
      )}
    </div>

  </div>
);

// ===== FIN RENDER =====

      {/* ===== COMMERCIAL COMMAND CENTER ===== */}
{commandCenter && (
  <div
    style={{
      padding: 16,
      borderRadius: 12,
      background: "#020617",
      border: "1px solid #1f2937",
      display: "grid",
      gap: 12,
    }}
  >
    <div style={{ fontWeight: 900, color: "#38bdf8" }}>
      COMMERCIAL COMMAND CENTER
    </div>

    {/* 🔴 Cuentas críticas */}
    <CommandList
      title="Cuentas críticas"
      color="#ef4444"
      accounts={commandCenter.criticalAccounts}
      onSelect={setSelected}
    />

    {/* ⚡ Acciones urgentes */}
    <CommandList
      title="Acciones urgentes"
      color="#f97316"
      accounts={commandCenter.urgentActions}
      onSelect={setSelected}
    />

    {/* ⏰ Sin seguimiento */}
    <CommandList
      title="Sin seguimiento comercial"
      color="#eab308"
      accounts={commandCenter.noFollowUp}
      onSelect={setSelected}
    />

    {/* 💰 Alto valor */}
    <CommandList
      title="Mayor potencial económico"
      color="#22c55e"
      accounts={commandCenter.highValue}
      onSelect={setSelected}
    />

    {/* 🧊 Cuentas frías */}
    <CommandList
      title="Cuentas frías"
      color="#64748b"
      accounts={commandCenter.coldAccounts}
      onSelect={setSelected}
    />
  </div>
)}
          <strong>{a.name}</strong>

          {/* ===== INICIO ACCION RAPIDA EN RADAR ===== */}
{act && (
  <div style={{ fontSize: 12, color: "#cbd5e1" }}>
    {act.action}
  </div>
)}
{/* ===== FIN ACCION RAPIDA EN RADAR ===== */}

          {/* PRIORIDAD */}
          {p && (
            <span
              style={{
                background:
                  p.label === "CRITICA"
                    ? "#dc2626"
                    : p.label === "ALTA"
                    ? "#f97316"
                    : p.label === "MEDIA"
                    ? "#eab308"
                    : "#64748b",
                padding: "2px 6px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 800,
                color: "#fff",
                width: "fit-content",
              }}
            >
              {p.label}
            </span>
          )}

          {/* TEMPERATURA */}
          {r && (
            <span style={{ color: tempColor }}>
              🌡 {r.temperature}
            </span>
          )}

          {/* URGENCIA */}
          {r && (
            <span style={{ color: urgencyColor }}>
              ⚠️ {r.urgency}
            </span>
          )}

          {/* VALOR */}
          {rev && (
            <span style={{ color: "#22c55e" }}>
              💰 {rev.tier}
            </span>
          )}

          {/* ICONOS */}
          {r && (
            <div>
              {r.hasOpportunity && <span>💰 </span>}
              {r.hasQuote && <span>📄 </span>}
              {r.hasOrder && <span>📦 </span>}
              {!r.hasContacts && <span>⚠️ </span>}
            </div>
          )}
        </div>
      );
    })}
</div>

    {/* ===== CRM 360 PANEL ===== */}
    <div
      style={{
        marginTop: 12,
        padding: 14,
        borderRadius: 12,
        background: "#0f172a",
        border: "1px solid #1f2937",
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ fontWeight: 700 }}>Resumen del cliente</div>

      <div style={{ fontSize: 13 }}>
        Industria: {selected.industry || "-"}
      </div>

      <div style={{ fontSize: 13 }}>
        Ubicación: {selected.city || "-"}, {selected.country || "-"}
      </div>

      <div style={{ fontSize: 13 }}>
        Estado: {selected.status}
      </div>

      {selected.notes && (
        <div style={{ fontSize: 13 }}>
          Notas: {selected.notes}
        </div>
      )}
    </div>

{/* ===== CRM AI DIRECTOR ===== */}
{director && (
  <div
    style={{
      marginTop: 16,
      padding: 14,
      borderRadius: 12,
      background: "#020617",
      border: "1px solid #1f2937",
      display: "grid",
      gap: 8,
    }}
  >
    <div style={{ fontWeight: 800, color: "#38bdf8" }}>
      DIRECTOR COMERCIAL IA
    </div>

    <div>
      Urgencia: <strong>{director.urgency}</strong>
    </div>

    <div>
      Temperatura: <strong>{director.accountTemperature}</strong>
    </div>

    <div>
      Acción recomendada: {director.recommendedAction}
    </div>

    {director.alerts.length > 0 && (
      <div>
        ⚠️ Alertas:
        {director.alerts.map((a, i) => (
          <div key={i}>• {a}</div>
        ))}
      </div>
    )}

    {director.opportunitiesDetected.length > 0 && (
      <div>
        🚀 Oportunidades:
        {director.opportunitiesDetected.map((o, i) => (
          <div key={i}>• {o}</div>
        ))}
      </div>
    )}

    {director.risksDetected.length > 0 && (
      <div>
        🔥 Riesgos:
        {director.risksDetected.map((r, i) => (
          <div key={i}>• {r}</div>
        ))}
      </div>
    )}
  </div>
)}

{/* ===== INICIO ACTION ENGINE PANEL ===== */}
{selected && actionMap[selected.id] && (
  <div
    style={{
      marginTop: 16,
      padding: 14,
      borderRadius: 12,
      background: "#111827",
      border: "1px solid #1f2937",
      display: "grid",
      gap: 8,
    }}
  >
    <div style={{ fontWeight: 800, color: "#22c55e" }}>
      ACTION ENGINE IA
    </div>

    <div>
      Acción sugerida:{" "}
      <strong>{actionMap[selected.id].action}</strong>
    </div>

    <div>
      Urgencia:{" "}
      <strong>{actionMap[selected.id].urgency}</strong>
    </div>

    <div style={{ color: "#cbd5e1", fontSize: 13 }}>
      {actionMap[selected.id].reason}
    </div>
  </div>
)}
{/* ===== FIN ACTION ENGINE PANEL ===== */}
    
{/* ===== CUSTOMER SUCCESS ALERTS ===== */}
    
    {alerts.length > 0 && (
  <div
    style={{
      marginTop: 16,
      padding: 14,
      borderRadius: 12,
      background: "#0b1220",
      border: "1px solid #1f2937",
      display: "grid",
      gap: 10,
    }}
  >
    <div style={{ fontWeight: 800, color: "#f59e0b" }}>
      CUSTOMER SUCCESS ALERTS
    </div>

    {alerts.map((a, i) => {
      const colorMap = {
        CRITICAL: "#ef4444",
        WARNING: "#f59e0b",
        INFO: "#60a5fa",
        SUCCESS: "#34d399",
      };

      return (
        <div
          key={i}
          style={{
            padding: 10,
            borderRadius: 8,
            border: `1px solid ${colorMap[a.level]}`,
            background: "#020617",
          }}
        >
          <div style={{ fontWeight: 700, color: colorMap[a.level] }}>
            {a.title}
          </div>

          <div style={{ fontSize: 12, color: "#cbd5e1" }}>
            {a.message}
          </div>
        </div>
      );
    })}
  </div>
)}
    
    {/* ===== CONTACTOS ===== */}
    <div style={{ marginTop: 24 }}>
      <h3>Contactos</h3>

      <button onClick={createContact}>
        + Nuevo contacto
      </button>

      {contacts.map((c) => (
        <div key={c.id} style={{ padding: 10 }}>
          <strong>{c.name}</strong>
          {c.position && <div>{c.position}</div>}
          {c.email && <div>{c.email}</div>}
        </div>
      ))}
    </div>


    {/* ===== UPLOAD ===== */}
    <input
      type="file"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) uploadDocument(f);
      }}
    />


    {/* ===== ACTIVIDADES ===== */}
    <div style={{ marginTop: 24 }}>
      <h3>Actividades</h3>

      <button onClick={createActivity}>
        Agregar
      </button>

      {activities.map((a) => (
        <ActivityRow key={a.id} activity={a} />
      ))}
    </div>


    {/* ===== DOCUMENTOS ===== */}
    <div style={{ marginTop: 16 }}>
      <h3>Documentos</h3>

      {documents.map((d) => (
        <DocumentRow key={d.id} doc={d} />
      ))}
    </div>


    {/* ===== OPORTUNIDADES ===== */}
    <div style={{ marginTop: 20 }}>
      <h3>Oportunidades</h3>

      {opportunities.map((o) => (
        <div key={o.id}>
          {o.name} — {o.stage}
        </div>
      ))}
    </div>


    {/* ===== COTIZACIONES ===== */}
    <div style={{ marginTop: 20 }}>
      <h3>Cotizaciones</h3>

      {quotes.map((q) => (
        <div key={q.id}>
          {q.quote_number} — {q.status}
        </div>
      ))}
    </div>


    {/* ===== PEDIDOS ===== */}
    <div style={{ marginTop: 20 }}>
      <h3>Pedidos</h3>

      {orders.map((o) => (
        <div key={o.id}>
          {o.order_number} — {o.status}
        </div>
      ))}
    </div>


    {/* ===== TIMELINE ===== */}
    <div style={{ marginTop: 28 }}>
      <h3>Historial del cliente</h3>

      {timeline.map((t) => (
        <TimelineRow key={`${t.type}-${t.id}`} item={t} />
      ))}
    </div>

  </div>
)}
    </div>
  );
  
  // ===== FIN RENDER =====
}

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
          <a href={url} target="_blank">
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
      <div style={{ fontWeight: 600, color }}>
        {item.title}
      </div>

      {item.description && (
        <div style={{ fontSize: 12 }}>
          {item.description}
        </div>
      )}

      <div style={{ fontSize: 11, color: "#94a3b8" }}>
        {new Date(item.date).toLocaleString("es-MX")}
      </div>
    </div>
  );
}
// ===== FIN COMPONENT TIMELINE ROW =====
