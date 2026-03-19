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
  
  // ===== INICIO RENDER =====

  if (loading) return <div style={{ padding: 40 }}>Cargando CRM...</div>;

  return (
    <div style={{ padding: 24, display: "grid", gap: 20 }}>

      <h1>CRM — Empresas / Cuentas</h1>

     {/* ===== LISTA DE CUENTAS ===== */}
<div style={{ display: "grid", gap: 10 }}>
  {accounts.map((a) => (
    <div
      key={a.id}
      onClick={() => setSelected(a)}
      style={{
        padding: 14,
        borderRadius: 12,
        background: "#0b1220",
        border: "1px solid #1f2937",
        cursor: "pointer",
      }}
    >
      <strong>{a.name}</strong>
      <div style={{ fontSize: 12, color: "#94a3b8" }}>
        {a.industry || "Sin industria"} — {a.country || "-"}
      </div>
    </div>
  ))}
</div>


{/* ===== DETALLE COMPLETO CON SCROLL ===== */}
{selected && (
  <div
    style={{
      marginTop: 20,
      maxHeight: "70vh",
      overflowY: "auto",
      paddingRight: 8,
    }}
  >
    <h2>{selected.name}</h2>

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
