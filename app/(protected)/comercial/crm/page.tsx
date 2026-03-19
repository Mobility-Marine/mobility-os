"use client";

// ===== INICIO IMPORTS =====
import { useEffect, useMemo, useState } from "react";
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
}, [selected]);
// ===== FIN LOAD DETALLE COMPLETO CRM =====

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

      {/* ===== DETALLE ===== */}
      {selected && (
        <div style={{ marginTop: 20 }}>
          <h2>{selected.name}</h2>

          {/* ===== INICIO CRM 360 PANEL ===== */}
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
{/* ===== FIN CRM 360 PANEL ===== */}

{/* ===== INICIO CONTACTOS ===== */}
<div style={{ marginTop: 24 }}>
  <h3>Contactos</h3>

  <button
    onClick={createContact}
    style={{
      padding: "6px 12px",
      borderRadius: 6,
      border: "none",
      background: "#2563eb",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 600,
      marginBottom: 10,
    }}
  >
    + Nuevo contacto
  </button>

  {contacts.length === 0 && (
    <p>No hay contactos registrados.</p>
  )}

  {contacts.map((c) => (
    <div
      key={c.id}
      style={{
        padding: 10,
        borderRadius: 8,
        border: "1px solid #1f2937",
        marginBottom: 8,
        background: "#0b1220",
      }}
    >
      <strong>{c.name}</strong>

      {c.position && (
        <div style={{ fontSize: 12 }}>{c.position}</div>
      )}

      {c.email && (
        <div style={{ fontSize: 12 }}>{c.email}</div>
      )}

      {c.phone && (
        <div style={{ fontSize: 12 }}>{c.phone}</div>
      )}

      {c.role && (
        <div style={{ fontSize: 11, color: "#94a3b8" }}>
          Rol: {c.role}
        </div>
      )}
    </div>
  ))}
</div>
{/* ===== FIN CONTACTOS ===== */}
          
          {/* ===== FIN DETALLE ===== */}

          {/* ===== UPLOAD ===== */}
          <input
            type="file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadDocument(f);
            }}
          />

{/* ===== ACTIVIDADES CRM ===== */}
<div style={{ marginTop: 24 }}>

  <h3>Actividades</h3>

  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>

    <input
      placeholder="Descripción de la actividad"
      value={newActivityTitle}
      onChange={(e) => setNewActivityTitle(e.target.value)}
      style={{ padding: 8 }}
    />

    <select
      value={newActivityType}
      onChange={(e) => setNewActivityType(e.target.value)}
    >
      <option value="call">Llamada</option>
      <option value="meeting">Reunión</option>
      <option value="email">Email</option>
      <option value="task">Tarea</option>
    </select>

    <input
      type="datetime-local"
      value={newActivityDate}
      onChange={(e) => setNewActivityDate(e.target.value)}
    />

    <button onClick={createActivity}>
      Agregar
    </button>

  </div>

  {activities.length === 0 && <p>No hay actividades.</p>}

  {activities.map((a) => (
    <ActivityRow key={a.id} activity={a} />
  ))}

</div>
          
          {/* ===== DOCUMENTOS ===== */}
          <div style={{ marginTop: 16 }}>
            <h3>Documentos</h3>

            {documents.length === 0 && <p>No hay documentos.</p>}

            {documents.map((d) => (
              <DocumentRow key={d.id} doc={d} />
            ))}
          </div>
        </div>
      )}

    </div>
  );

{/* ===== INICIO OPORTUNIDADES RELACIONADAS ===== */}
<div style={{ marginTop: 20 }}>
  <h3>Oportunidades</h3>

  {opportunities.length === 0 && (
    <p>No hay oportunidades vinculadas.</p>
  )}

  {opportunities.map((o) => (
    <div key={o.id} style={{ padding: 8 }}>
      <strong>{o.name}</strong> — {o.stage} — $
      {(o.estimated_value || 0).toLocaleString("es-MX")}
    </div>
  ))}
</div>
{/* ===== FIN OPORTUNIDADES RELACIONADAS ===== */}

  {/* ===== INICIO COTIZACIONES RELACIONADAS ===== */}
<div style={{ marginTop: 20 }}>
  <h3>Cotizaciones</h3>

  {quotes.length === 0 && <p>No hay cotizaciones.</p>}

  {quotes.map((q) => (
    <div key={q.id} style={{ padding: 8 }}>
      {q.quote_number} — {q.status} — $
      {(q.total_amount || 0).toLocaleString("es-MX")}
    </div>
  ))}
</div>
{/* ===== FIN COTIZACIONES RELACIONADAS ===== */}

  {/* ===== INICIO PEDIDOS RELACIONADOS ===== */}
<div style={{ marginTop: 20 }}>
  <h3>Pedidos</h3>

  {orders.length === 0 && <p>No hay pedidos.</p>}

  {orders.map((o) => (
    <div key={o.id} style={{ padding: 8 }}>
      {o.order_number} — {o.status} — $
      {(o.total_amount || 0).toLocaleString("es-MX")}
    </div>
  ))}
</div>
{/* ===== FIN PEDIDOS RELACIONADOS ===== */}
  
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
