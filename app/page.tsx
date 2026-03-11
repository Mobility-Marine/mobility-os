"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type ClientRow = {
  id: string;
  name: string | null;
  rfc: string | null;
  address: string | null;
  contact: string | null;
  email: string | null;
  company_id: string | null;
};

type ProspectRow = {
  id: string;
  name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  lead_source: string | null;
  interested_service: string | null;
  status: string | null;
  notes: string | null;
  company_id: string | null;
  estimated_value: number | null;
  stage_position: number | null
};

type ViewName =
  | "Dashboard"
  | "Prospectos"
  | "CRM"
  | "Agenda"
  | "Cotizaciones"
  | "Embarques"
  | "Facturación"
  | "Reportes"
  | "Proveedores"
  | "Comercio Exterior";

export default function Home() {
  const [status, setStatus] = useState("Conectando con Supabase...");
  const [companyCount, setCompanyCount] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<ViewName>("Dashboard");

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  const [prospects, setProspects] = useState<ProspectRow[]>([]);
  const pipelineStages = [
"Nuevo",
"Contactado",
"Cotización",
"Negociación",
"Ganado",
"Perdido"
]
  const [followups, setFollowups] = useState<any[]>([]);
  const [prospectHistory, setProspectHistory] = useState<any[]>([]);
  const [loadingProspects, setLoadingProspects] = useState(false);

  const [events, setEvents] = useState<any[]>([])
const [loadingEvents, setLoadingEvents] = useState(false)
  
  const [selectedProspect, setSelectedProspect] = useState<ProspectRow | null>(null);

  const [newActivityType, setNewActivityType] = useState("");
const [newActivityNotes, setNewActivityNotes] = useState("");

  const [tasks, setTasks] = useState<any[]>([])
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  
const [taskTitle, setTaskTitle] = useState("")
const [taskDescription, setTaskDescription] = useState("")
const [taskDueDate, setTaskDueDate] = useState("")

const [newEventTitle, setNewEventTitle] = useState("")
const [newEventStart, setNewEventStart] = useState("")
const [newEventEnd, setNewEventEnd] = useState("")
  const [selectedDate, setSelectedDate] = useState(
  new Date().toISOString().slice(0, 10)
)

  const [clientForm, setClientForm] = useState({
    name: "",
    rfc: "",
    address: "",
    contact: "",
    email: "",
  });

  const [prospectForm, setProspectForm] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    lead_source: "",
    interested_service: "",
    status: "Nuevo",
    notes: "",
    estimated_value: 0,
    stage_position: 0
  });

  const modules: ViewName[] = useMemo(
  () => [
    "Dashboard",
    "Prospectos",
    "CRM",
    "Agenda",
    "Cotizaciones",
    "Embarques",
    "Facturación",
    "Reportes",
    "Proveedores",
    "Comercio Exterior",
  ],
  []
);

  useEffect(() => {
    async function testConnection() {
      try {
        const { count, error } = await supabase
          .from("companies")
          .select("*", { count: "exact", head: true });

        if (error) {
          setStatus(`Error de conexión: ${error.message}`);
          return;
        }

        setCompanyCount(count ?? 0);
        setStatus("Supabase conectado correctamente");
      } catch {
        setStatus("No se pudo conectar con Supabase");
      }
    }

    testConnection();
  }, []);

 useEffect(() => {
  if (activeView === "CRM") loadClients();
  if (activeView === "Prospectos") loadProspects();
  if (activeView === "Agenda") loadCalendarEvents();
}, [activeView]);

 async function loadClients() {
  setLoadingClients(true);

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, rfc, address, contact, email, company_id")
    .order("created_at", { ascending: false });

  if (error) {
    setStatus(`Error cargando clientes: ${error.message}`);
    setLoadingClients(false);
    return;
  }

  setClients((data as ClientRow[]) || []);
  setLoadingClients(false);
}

async function loadProspects() {
  setLoadingProspects(true);

  const { data, error } = await supabase
    .from("prospects")
  .select(
"id, name, company_name, email, phone, lead_source, interested_service, status, notes, company_id, estimated_value, stage_position"
)
    .order("created_at", { ascending: false });

  if (error) {
    setStatus(`Error cargando prospectos: ${error.message}`);
    setLoadingProspects(false);
    return;
  }

  setProspects((data as ProspectRow[]) || []);
  setLoadingProspects(false);
}

async function loadEvents() {
  setLoadingEvents(true)

  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .order("start_datetime", { ascending: true })

  if (error) {
    alert("Error cargando calendario")
    return
  }

  setEvents(data || [])
  setLoadingEvents(false)
}
  
async function loadFollowups(prospectId: string) {

const { data, error } = await supabase
.from("prospect_followups")
.select("*")
.eq("prospect_id", prospectId)
.order("activity_date", { ascending: false });

if(error){
alert("Error cargando historial")
return
}

setProspectHistory(data || [])

}

async function loadTasks(prospectId: string) {

  const { data, error } = await supabase
    .from("prospect_tasks")
    .select("*")
    .eq("prospect_id", prospectId)
    .order("due_date", { ascending: true })

  if (error) {
    alert("Error cargando tareas")
    return
  }

  setTasks(data || [])
}

async function loadCalendarEvents() {

  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .order("start_datetime", { ascending: true })

  if (error) {
    alert("Error cargando calendario")
    return
  }

  setCalendarEvents(data || [])
}
  
async function convertToClient() {
  if (!selectedProspect) return;

  const { data: companyData } = await supabase
    .from("companies")
    .select("id")
    .limit(1);

  const companyId = companyData?.[0]?.id ?? null;

  const { error } = await supabase
    .from("clients")
    .insert({
      company_id: companyId,
      name: selectedProspect.company_name || selectedProspect.name,
      contact: selectedProspect.name,
      email: selectedProspect.email,
      address: null,
      rfc: null
    });

  if (error) {
    alert("Error creando cliente: " + error.message);
    return;
  }

  // Opcional: marcar prospecto como ganado
  await supabase
    .from("prospects")
    .update({ status: "Ganado" })
    .eq("id", selectedProspect.id);

  alert("Prospecto convertido a cliente");

  loadClients();
  loadProspects();
  setSelectedProspect(null);
}
  
  async function createClient() {
    const { data: companyData } = await supabase
      .from("companies")
      .select("id")
      .limit(1);

    const firstCompanyId = companyData?.[0]?.id;

    if (!firstCompanyId) {
      setStatus("No existe una empresa base en la tabla companies.");
      return;
    }

    const { error } = await supabase.from("clients").insert({
      company_id: firstCompanyId,
      name: clientForm.name,
      rfc: clientForm.rfc,
      address: clientForm.address,
      contact: clientForm.contact,
      email: clientForm.email,
    });

    if (error) {
      setStatus(`Error creando cliente: ${error.message}`);
      return;
    }

    setClientForm({
      name: "",
      rfc: "",
      address: "",
      contact: "",
      email: "",
    });

    setStatus("Cliente creado correctamente");
    loadClients();
  }
  
async function handleDrop(e: React.DragEvent, newStage: string) {
  const prospectId = e.dataTransfer.getData("prospectId")

  const { data: lastItems } = await supabase
    .from("prospects")
    .select("stage_position")
    .eq("status", newStage)
    .order("stage_position", { ascending: false })
    .limit(1)

  const nextPosition =
    lastItems && lastItems.length > 0
      ? (lastItems[0].stage_position || 0) + 1
      : 1

  const { error } = await supabase
    .from("prospects")
    .update({
      status: newStage,
      stage_position: nextPosition
    })
    .eq("id", prospectId)

  if (error) {
    alert("Error moviendo prospecto")
    return
  }

  loadProspects()
}
  function getStageTotal(stage: string) {
  return prospects
    .filter(p => p.status === stage)
    .reduce((sum, p) => sum + (p.estimated_value || 0), 0)
}
  function getProspectScore(p: ProspectRow) {
  let score = 0

  // Valor económico
  score += (p.estimated_value || 0) / 1000

  // Etapa del pipeline
  const stageWeights: Record<string, number> = {
    "Nuevo": 5,
    "Contactado": 10,
    "Cotización": 20,
    "Negociación": 30,
    "Ganado": 50,
    "Perdido": 0
  }

  score += stageWeights[p.status || "Nuevo"] || 0

  return Math.round(score)
}
  function getPipelineTotal() {
  return prospects.reduce(
    (sum, p) => sum + (p.estimated_value || 0),
    0
  )
}
  function getForecastTotal() {

  const probabilities: Record<string, number> = {
    "Nuevo": 0.1,
    "Contactado": 0.25,
    "Cotización": 0.5,
    "Negociación": 0.75,
    "Ganado": 1,
    "Perdido": 0
  };

  return prospects.reduce((sum, p) => {
    const value = p.estimated_value || 0;
    const prob = probabilities[p.status || "Nuevo"] || 0;
    return sum + value * prob;
  }, 0);
}
  function getTodayTasks() {

  const today = new Date().toDateString();

  return tasks.filter(t => {
    if (!t.due_date) return false;
    return new Date(t.due_date).toDateString() === today;
  });

}
  function generateHours() {
  const hours = []

  for (let h = 8; h <= 20; h++) {
    const label = h.toString().padStart(2, "0") + ":00"
    hours.push(label)
  }

  return hours
}
  function getWeekDays() {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() + 1)

  const days = []

  for (let i = 0; i < 5; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)

    days.push(d)
  }

  return days
}
  async function createProspect() {
    const { data: companyData } = await supabase
      .from("companies")
      .select("id")
      .limit(1);

    const firstCompanyId = companyData?.[0]?.id ?? null;

    const { error } = await supabase.from("prospects").insert({
      company_id: firstCompanyId,
      name: prospectForm.name,
      company_name: prospectForm.company_name,
      email: prospectForm.email,
      phone: prospectForm.phone,
      lead_source: prospectForm.lead_source,
      interested_service: prospectForm.interested_service,
      status: prospectForm.status,
      notes: prospectForm.notes,
      estimated_value: prospectForm.estimated_value,
    });

    if (error) {
      setStatus(`Error creando prospecto: ${error.message}`);
      return;
    }

    setProspectForm({
      name: "",
      company_name: "",
      email: "",
      phone: "",
      lead_source: "",
      interested_service: "",
      status: "nuevo",
      notes: "",
      estimated_value: 0,
       stage_position: 0
    });

    setStatus("Prospecto creado correctamente");
    loadProspects();
  }

  const cards = [
    { title: "Cotizaciones abiertas", value: "0" },
    { title: "Embarques activos", value: "0" },
    { title: "Facturas pendientes", value: "0" },
    { title: "Empresas registradas", value: companyCount ?? "-" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08142c",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        display: "grid",
        gridTemplateColumns: "260px 1fr",
      }}
    >
    <aside
style={{
background: "#0b1b3a",
borderRight: "1px solid #1e335c",
padding: "24px 18px",
height: "100vh",
overflowY: "auto",
scrollbarWidth: "thin"
}}
>
        <h2 style={{ marginTop: 0, marginBottom: 6 }}>Mobility OS</h2>
        <p style={{ color: "#9fb3d9", fontSize: 14, marginTop: 0 }}>
          Mobility Marine
        </p>

        <div style={{ marginTop: 28 }}>
          {modules.map((item) => (
            <div
              key={item}
              onClick={() => setActiveView(item)}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                marginBottom: 8,
                background: activeView === item ? "#16315f" : "transparent",
                color: "#c9d7f2",
                border:
                  activeView === item
                    ? "1px solid #2f5aa6"
                    : "1px solid transparent",
                cursor: "pointer",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </aside>

      <main style={{ padding: 28 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>{activeView}</h1>
            <p style={{ margin: "6px 0 0", color: "#aab9d6" }}>
              ERP logístico y de comercio exterior
            </p>
          </div>

          <div
            style={{
              background: "#102244",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #284577",
              color: "#dbe7ff",
              fontSize: 14,
            }}
          >
            {status}
          </div>
        </header>

        {activeView === "Dashboard" && (
          <>
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {cards.map((card) => (
                <div
                  key={card.title}
                  style={{
                    background: "#12284d",
                    border: "1px solid #284577",
                    borderRadius: 16,
                    padding: 20,
                  }}
                >
                  <div style={{ color: "#9fb3d9", fontSize: 14 }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 700, marginTop: 10 }}>
                    {card.value}
                  </div>
                </div>
              ))}
            </section>

<div
  style={{
    background: "#12284d",
    border: "1px solid #284577",
    borderRadius: 16,
    padding: 22,
    marginTop: 16
  }}
>
  <h3 style={{ marginTop: 0 }}>Agenda de hoy</h3>

  {getTodayTasks().length === 0 ? (
    <p style={{ color: "#9fb3d9" }}>
      No hay actividades programadas hoy
    </p>
  ) : (
    getTodayTasks().map(task => (
      <div
        key={task.id}
        style={{
          borderBottom: "1px solid #243a63",
          padding: "8px 0"
        }}
      >
        <strong>{task.title}</strong>
        <div style={{ fontSize: 12, color: "#9fb3d9" }}>
          {task.description}
        </div>
      </div>
    ))
  )}

</div>
            
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: 16,
              }}
            >
              <div
                style={{
                  background: "#12284d",
                  border: "1px solid #284577",
                  borderRadius: 16,
                  padding: 22,
                }}
              >
                <h3 style={{ marginTop: 0 }}>Resumen general</h3>
                <p style={{ color: "#c5d3ee", lineHeight: 1.6 }}>
                  Mobility OS ya está conectado con Supabase y listo para
                  comenzar a construir los módulos reales del sistema.
                </p>
                <p style={{ color: "#9fb3d9" }}>
                  Empresas registradas: <strong>{companyCount ?? "-"}</strong>
                </p>
              </div>

              <div
                style={{
                  background: "#12284d",
                  border: "1px solid #284577",
                  borderRadius: 16,
                  padding: 22,
                }}
              >
                <h3 style={{ marginTop: 0 }}>Accesos rápidos</h3>
                <ul
                  style={{
                    paddingLeft: 18,
                    color: "#d8e3fb",
                    lineHeight: 1.8,
                  }}
                >
                  <li>Nuevo cliente</li>
                  <li>Nuevo prospecto</li>
                  <li>Nueva cotización</li>
                  <li>Nuevo embarque</li>
                </ul>
              </div>
            </section>
          </>
        )}

        {activeView === "Prospectos" && (
          <div style={{ display: "grid", gap: 16 }}>
            <section
              style={{
                background: "#12284d",
                border: "1px solid #284577",
                borderRadius: 16,
                padding: 22,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Nuevo prospecto</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                <input
                  placeholder="Nombre"
                  value={prospectForm.name}
                  onChange={(e) =>
                    setProspectForm({ ...prospectForm, name: e.target.value })
                  }
                  style={inputStyle}
                />
                <input
                  placeholder="Empresa"
                  value={prospectForm.company_name}
                  onChange={(e) =>
                    setProspectForm({
                      ...prospectForm,
                      company_name: e.target.value,
                    })
                  }
                  style={inputStyle}
                />
                <input
                  placeholder="Correo"
                  value={prospectForm.email}
                  onChange={(e) =>
                    setProspectForm({ ...prospectForm, email: e.target.value })
                  }
                  style={inputStyle}
                />
                <input
                  placeholder="Teléfono"
                  value={prospectForm.phone}
                  onChange={(e) =>
                    setProspectForm({ ...prospectForm, phone: e.target.value })
                  }
                  style={inputStyle}
                />
                <input
                  placeholder="Origen del lead"
                  value={prospectForm.lead_source}
                  onChange={(e) =>
                    setProspectForm({
                      ...prospectForm,
                      lead_source: e.target.value,
                    })
                  }
                  style={inputStyle}
                />
                <input
                  placeholder="Servicio de interés"
                  value={prospectForm.interested_service}
                  onChange={(e) =>
                    setProspectForm({
                      ...prospectForm,
                      interested_service: e.target.value,
                    })
                  }
                  style={inputStyle}
                />
                <input
  placeholder="Valor estimado por operación (USD)"
  type="number"
  value={prospectForm.estimated_value || ""}
  onChange={(e) =>
    setProspectForm({
      ...prospectForm,
      estimated_value: Number(e.target.value),
    })
  }
  style={inputStyle}
/>
                <select
value={prospectForm.status}
onChange={(e) =>
setProspectForm({ ...prospectForm, status: e.target.value })
}
style={inputStyle}
>
<option value="Nuevo">Nuevo</option>
<option value="Contactado">Contactado</option>
<option value="Cotización">Cotización</option>
<option value="Negociación">Negociación</option>
<option value="Ganado">Ganado</option>
<option value="Perdido">Perdido</option>
</select>
               
                <input
                  placeholder="Notas"
                  value={prospectForm.notes}
                  onChange={(e) =>
                    setProspectForm({ ...prospectForm, notes: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>

              <button
                onClick={createProspect}
                style={{
                  marginTop: 16,
                  background: "#2f5aa6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 18px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Guardar prospecto
              </button>
            </section>

            <section
              style={{
                background: "#12284d",
                border: "1px solid #284577",
                borderRadius: 16,
                padding: 22,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Prospectos registrados</h3>

<div
  style={{
    background: "#0f1f3d",
    border: "1px solid #2f5aa6",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    fontWeight: "bold"
  }}
>
  Valor total del pipeline: ${getPipelineTotal().toLocaleString()}
</div>

              <div
  style={{
    background: "#0b3a2b",
    border: "1px solid #16a34a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    fontWeight: "bold"
  }}
>
  Forecast estimado: ${getForecastTotal().toLocaleString()}
</div>
              
              <div
style={{
display:"grid",
gridTemplateColumns:"repeat(6, 1fr)",
gap:16,
marginTop:20,
marginBottom:30
}}
>

{pipelineStages.map(stage => (

<div
  key={stage}
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => handleDrop(e, stage)}
  style={{
    background: "#0f1f3d",
    border: "1px solid #2f5aa6",
    borderRadius: 10,
    padding: 12,
    minHeight: 180
  }}
>

<div style={{
  fontWeight:"bold",
  marginBottom:10,
  borderBottom:"1px solid #2f5aa6",
  paddingBottom:6
}}>
  {stage}

  <div style={{
    fontSize:12,
    color:"#9fb3d9",
    marginTop:4
  }}>
    ${getStageTotal(stage).toLocaleString()} USD
  </div>
</div>

{prospects
  .filter(p => p.status === stage)
  .sort((a, b) => getProspectScore(b) - getProspectScore(a))
  .map(p => (

<div
key={p.id}
draggable
onDragStart={(e)=>{
e.dataTransfer.setData("prospectId", p.id)
}}
onClick={()=>setSelectedProspect(p)}
style={{
background:"#162a52",
padding:10,
borderRadius:8,
marginBottom:8,
cursor:"grab"
}}
>

<div style={{fontWeight:"bold"}}>
  {p.company_name || p.name}
</div>

<div style={{
  fontSize: 11,
  color: "#60a5fa",
  marginTop: 4
}}>
  Score: {getProspectScore(p)}
</div>

<div style={{fontSize:12,color:"#9fb3d9"}}>
{p.name}
</div>

</div>

))}

</div>

))}

</div>

              {loadingProspects ? (
                <p>Cargando prospectos...</p>
              ) : prospects.length === 0 ? (
                <p>No hay prospectos registrados todavía.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: 12,
                    }}
                  >
                    <thead>
                      <tr style={{ textAlign: "left", color: "#9fb3d9" }}>
                        <th style={thStyle}>Nombre</th>
                        <th style={thStyle}>Empresa</th>
                        <th style={thStyle}>Correo</th>
                        <th style={thStyle}>Teléfono</th>
                        <th style={thStyle}>Origen</th>
                        <th style={thStyle}>Servicio</th>
                        <th style={thStyle}>Estatus</th>
                        <th style={thStyle}>Seguimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prospects.map((prospect) => (
                       <tr
key={prospect.id}
onClick={() => {
setSelectedProspect(prospect)
loadFollowups(prospect.id)
  loadTasks(prospect.id)
}}
style={{ cursor: "pointer" }}
>
                          <td style={tdStyle}>{prospect.name || "-"}</td>
                          <td style={tdStyle}>{prospect.company_name || "-"}</td>
                          <td style={tdStyle}>{prospect.email || "-"}</td>
                          <td style={tdStyle}>{prospect.phone || "-"}</td>
                          <td style={tdStyle}>{prospect.lead_source || "-"}</td>
                          <td style={tdStyle}>
                            {prospect.interested_service || "-"}
                          </td>
                         <td style={tdStyle}>
<select
value={prospect.status || "Nuevo"}
onChange={async (e) => {

  const newStatus = e.target.value

  // Obtener última posición de esa columna
  const { data: lastItems } = await supabase
    .from("prospects")
    .select("stage_position")
    .eq("status", newStatus)
    .order("stage_position", { ascending: false })
    .limit(1)

  const nextPosition =
    lastItems && lastItems.length > 0
      ? (lastItems[0].stage_position || 0) + 1
      : 1

  // Actualizar prospecto correcto
  await supabase
    .from("prospects")
    .update({
      status: newStatus,
      stage_position: nextPosition
    })
    .eq("id", prospect.id)

  loadProspects()
}}
>
<option value="Nuevo">Nuevo</option>
<option value="Contactado">Contactado</option>
<option value="Cotización">Cotización</option>
<option value="Negociación">Negociación</option>
<option value="Ganado">Ganado</option>
<option value="Perdido">Perdido</option>
</select>
</td>

<td style={tdStyle}>
 <button
onClick={async () => {

const activity = prompt("Tipo de actividad (llamada, correo, reunión)");

const notes = prompt("Notas de la actividad");

if (!activity) return;

const { error } = await supabase
.from("prospect_followups")
.insert({
prospect_id: prospect.id,
activity_type: activity,
notes: notes
});

if (error) {
alert("Error guardando actividad: " + error.message);
} else {
alert("Actividad guardada correctamente");
}

}}
style={{
background: "#2f5aa6",
border: "none",
color: "#fff",
padding: "6px 10px",
borderRadius: "6px",
cursor: "pointer",
}}
>
Seguimiento
</button>
</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {activeView === "CRM" && (
          <div style={{ display: "grid", gap: 16 }}>
            <section
              style={{
                background: "#12284d",
                border: "1px solid #284577",
                borderRadius: 16,
                padding: 22,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Nuevo cliente</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                <input
                  placeholder="Nombre o razón social"
                  value={clientForm.name}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, name: e.target.value })
                  }
                  style={inputStyle}
                />
                <input
                  placeholder="RFC"
                  value={clientForm.rfc}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, rfc: e.target.value })
                  }
                  style={inputStyle}
                />
                <input
                  placeholder="Dirección"
                  value={clientForm.address}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, address: e.target.value })
                  }
                  style={inputStyle}
                />
                <input
                  placeholder="Contacto"
                  value={clientForm.contact}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, contact: e.target.value })
                  }
                  style={inputStyle}
                />
                <input
                  placeholder="Correo"
                  value={clientForm.email}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, email: e.target.value })
                  }
                  style={{ ...inputStyle, gridColumn: "1 / span 2" }}
                />
              </div>

              <button
                onClick={createClient}
                style={{
                  marginTop: 16,
                  background: "#2f5aa6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 18px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Guardar cliente
              </button>
            </section>

            <section
              style={{
                background: "#12284d",
                border: "1px solid #284577",
                borderRadius: 16,
                padding: 22,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Clientes registrados</h3>

              {loadingClients ? (
                <p>Cargando clientes...</p>
              ) : clients.length === 0 ? (
                <p>No hay clientes registrados todavía.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: 12,
                    }}
                  >
                    <thead>
                      <tr style={{ textAlign: "left", color: "#9fb3d9" }}>
                        <th style={thStyle}>Nombre</th>
                        <th style={thStyle}>RFC</th>
                        <th style={thStyle}>Dirección</th>
                        <th style={thStyle}>Contacto</th>
                        <th style={thStyle}>Correo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client) => (
                        <tr key={client.id}>
                          <td style={tdStyle}>{client.name || "-"}</td>
                          <td style={tdStyle}>{client.rfc || "-"}</td>
                          <td style={tdStyle}>{client.address || "-"}</td>
                          <td style={tdStyle}>{client.contact || "-"}</td>
                          <td style={tdStyle}>{client.email || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

{activeView === "Agenda" && (
  <div style={{ display: "grid", gap: 16 }}>

    <section
      style={{
        background: "#12284d",
        border: "1px solid #284577",
        borderRadius: 16,
        padding: 22,
      }}
    >
      <h3 style={{ marginTop: 0 }}>Calendario semanal</h3>

<div style={{ overflowX: "auto" }}>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "80px repeat(5, 1fr)",
      border: "1px solid #284577",
      borderRadius: 12,
      overflow: "hidden"
    }}
  >

    {/* Encabezado */}
    <div style={{ background: "#0f1f3d" }} />

    {getWeekDays().map(day => (
      <div
        key={day.toISOString()}
        style={{
          background: "#0f1f3d",
          padding: 10,
          borderLeft: "1px solid #284577",
          textAlign: "center",
          fontWeight: "bold"
        }}
      >
        {day.toLocaleDateString("es-MX", {
          weekday: "short",
          day: "numeric"
        })}
      </div>
    ))}

    {/* Filas por hora */}
{generateHours().map(hour => (
  <React.Fragment key={hour}>

    {/* Columna de horas */}
    <div
      style={{
        padding: 8,
        borderTop: "1px solid #284577",
        background: "#0b1b3a",
        fontSize: 12
      }}
    >
      {hour}
    </div>

    {/* Columnas por día */}
    {getWeekDays().map(day => (
      <div
        key={hour + day.toISOString()}
        style={{
          borderLeft: "1px solid #284577",
          borderTop: "1px solid #284577",
          minHeight: 60,
          padding: 4,
          position: "relative"
        }}
      >
        {calendarEvents
          .filter(ev => {
            const evDate = new Date(ev.start_datetime)

            return (
              evDate.toDateString() === day.toDateString() &&
              evDate.toTimeString().slice(0, 5) === hour
            )
          })
          .map(ev => (
            <div
              key={ev.id}
              style={{
                background: ev.color || "#2563eb",
                padding: 4,
                borderRadius: 6,
                fontSize: 12,
                color: "#fff"
              }}
            >
              {ev.title}
            </div>
          ))}
      </div>
    ))}

  </React.Fragment>
))}
))}
  </div>
</div>
</section>
    </section>

    <section
      style={{
        background: "#12284d",
        border: "1px solid #284577",
        borderRadius: 16,
        padding: 22,
      }}
    >
      <h3 style={{ marginTop: 0 }}>Crear evento</h3>

      <input
        placeholder="Título"
        value={newEventTitle}
        onChange={(e) => setNewEventTitle(e.target.value)}
        style={{ ...inputStyle, marginBottom: 10 }}
      />

      <input
        type="datetime-local"
        value={newEventStart}
        onChange={(e) => setNewEventStart(e.target.value)}
        style={{ ...inputStyle, marginBottom: 10 }}
      />

      <input
        type="datetime-local"
        value={newEventEnd}
        onChange={(e) => setNewEventEnd(e.target.value)}
        style={{ ...inputStyle, marginBottom: 10 }}
      />

      <button
        onClick={async () => {

          if (!newEventTitle || !newEventStart || !newEventEnd) {
            alert("Completa todos los campos");
            return;
          }

          const { error } = await supabase
            .from("calendar_events")
            .insert({
              title: newEventTitle,
              start_datetime: newEventStart,
              end_datetime: newEventEnd
            });

          if (error) {
            alert("Error creando evento");
            return;
          }

          setNewEventTitle("");
          setNewEventStart("");
          setNewEventEnd("");

          loadCalendarEvents();

        }}
        style={{
          background: "#2563eb",
          border: "none",
          padding: "10px 14px",
          color: "#fff",
          borderRadius: 6
        }}
      >
        Crear evento
      </button>

    </section>

  </div>
)}
        
        {!["Dashboard", "CRM", "Prospectos"].includes(activeView) && (
          <section
            style={{
              background: "#12284d",
              border: "1px solid #284577",
              borderRadius: 16,
              padding: 22,
            }}
          >
            <h3 style={{ marginTop: 0 }}>{activeView}</h3>
            <p style={{ color: "#c5d3ee" }}>
              Este módulo será construido en la siguiente fase.
            </p>
          </section>
        )}

{selectedProspect && (
<div
style={{
position: "fixed",
right: 0,
top: 0,
width: "420px",
height: "100vh",
background: "#0f172a",
borderLeft: "2px solid #2f5aa6",
padding: "24px",
overflowY: "auto",
boxSizing: "border-box",
zIndex: 1000
}}
>
  <button
  onClick={() => setSelectedProspect(null)}
  style={{
    position: "absolute",
    top: 10,
    right: 10,
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: 22,
    cursor: "pointer"
  }}
>
  ✕
</button>

<h2 style={{marginBottom:20}}>Prospecto</h2>

<div style={{marginBottom:15}}>
<strong>Nombre</strong>
<input
value={selectedProspect.name || ""}
onChange={(e) =>
setSelectedProspect({...selectedProspect, name: e.target.value})
}
style={inputStyle}
/>
</div>

<div style={{marginBottom:15}}>
<strong>Empresa</strong>
<input
value={selectedProspect.company_name || ""}
onChange={(e) =>
setSelectedProspect({...selectedProspect, company_name: e.target.value})
}
style={inputStyle}
/>
</div>

<div style={{marginBottom:15}}>
<strong>Correo</strong>
<input
value={selectedProspect.email || ""}
onChange={(e) =>
setSelectedProspect({...selectedProspect, email: e.target.value})
}
style={inputStyle}
/>
</div>

<div style={{marginBottom:15}}>
<strong>Teléfono</strong>
<input
value={selectedProspect.phone || ""}
onChange={(e) =>
setSelectedProspect({...selectedProspect, phone: e.target.value})
}
style={inputStyle}
/>
</div>

<div style={{marginBottom:15}}>
<strong>Estatus</strong>
<div>{selectedProspect.status}</div>
</div>

<h3 style={{marginTop:30}}>Historial</h3>

{prospectHistory.length === 0 && (
<p style={{color:"#9fb3d9"}}>Sin actividades registradas</p>
)}

{prospectHistory.map((item) => (
<div
key={item.id}
style={{
borderBottom:"1px solid #243a63",
padding:"10px 0"
}}
>
<div style={{fontWeight:"bold"}}>
{item.activity_type}
</div>

<div style={{fontSize:14,color:"#9fb3d9"}}>
{item.notes}
</div>
  
<div style={{fontSize:12,color:"#64748b",marginTop:4}}>
{new Date(item.activity_date).toLocaleString()}
</div>
</div>
))}
  
<h3 style={{marginTop:25}}>Agregar actividad</h3>

  <h3 style={{marginTop:30}}>Tareas pendientes</h3>

{tasks.length === 0 && (
  <p style={{ color: "#9fb3d9" }}>Sin tareas</p>
)}

{tasks.filter(t => t.status !== "done").map(task => (
  <div
    key={task.id}
    style={{
      borderBottom: "1px solid #243a63",
      padding: "10px 0"
    }}
  >
    <div style={{ fontWeight: "bold" }}>
      {task.title}
    </div>

    <div style={{ fontSize: 14, color: "#9fb3d9" }}>
      {task.description}
    </div>

    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
      Vence: {task.due_date ? new Date(task.due_date).toLocaleDateString() : "Sin fecha"}
    </div>
  </div>
))}

<select
value={newActivityType}
onChange={(e)=>setNewActivityType(e.target.value)}
style={{...inputStyle, marginBottom:10}}
>
<option value="">Tipo de actividad</option>
<option value="Llamada">Llamada</option>
<option value="Correo">Correo</option>
<option value="Reunión">Reunión</option>
<option value="Cotización">Cotización</option>
</select>

<input
placeholder="Notas"
value={newActivityNotes}
onChange={(e)=>setNewActivityNotes(e.target.value)}
style={{...inputStyle, marginBottom:10}}
/>

<h3 style={{marginTop:25}}>Tareas programadas</h3>

<input
  placeholder="Título"
  value={taskTitle}
  onChange={(e)=>setTaskTitle(e.target.value)}
  style={{...inputStyle, marginBottom:10}}
/>

<input
  placeholder="Descripción"
  value={taskDescription}
  onChange={(e)=>setTaskDescription(e.target.value)}
  style={{...inputStyle, marginBottom:10}}
/>

<input
  type="datetime-local"
  value={taskDueDate}
  onChange={(e)=>setTaskDueDate(e.target.value)}
  style={{...inputStyle, marginBottom:10}}
/>

<button
  onClick={async ()=>{

    if(!taskTitle || !taskDueDate){
      alert("Completa título y fecha")
      return
    }

   const { error } = await supabase
  .from("prospect_tasks")
  .insert({
    prospect_id: selectedProspect.id,
    title: taskTitle,
    description: taskDescription,
    due_date: taskDueDate,
    status: "pending"   // ⭐ NUEVO
  })

    if(error){
      alert("Error guardando tarea")
      return
    }

    setTaskTitle("")
    setTaskDescription("")
    setTaskDueDate("")

    loadTasks(selectedProspect.id)

  }}
  style={{
    background:"#2563eb",
    border:"none",
    padding:"10px 14px",
    color:"#fff",
    borderRadius:6
  }}
>
  Crear tarea
</button>

  {tasks.length === 0 && (
  <p style={{color:"#9fb3d9"}}>Sin tareas programadas</p>
)}

{tasks.map((task)=>(
  <div
    key={task.id}
    style={{
      borderBottom:"1px solid #243a63",
      padding:"10px 0"
    }}
  >

    <div style={{fontWeight:"bold"}}>
      {task.title}
    </div>

    <div style={{fontSize:14,color:"#9fb3d9"}}>
      {task.description}
    </div>

    <div style={{fontSize:12,color:"#64748b",marginTop:4}}>
      {new Date(task.due_date).toLocaleString()}
    </div>

    {/* BOTÓN COMPLETAR */}
    {!task.completed && (
      <button
        onClick={async () => {
          await supabase
            .from("prospect_tasks")
            .update({ status: "done" })
            .eq("id", task.id)

          loadTasks(selectedProspect.id)
        }}
        style={{
          marginTop: 6,
          background: "#16a34a",
          border: "none",
          padding: "6px 10px",
          color: "#fff",
          borderRadius: 6,
          cursor: "pointer"
        }}
      >
        Marcar completada
      </button>
    )}

  </div>
))}
  
<button
onClick={async ()=>{

if(!newActivityType){
alert("Selecciona un tipo de actividad")
return
}

const { error } = await supabase
.from("prospect_followups")
.insert({
prospect_id: selectedProspect.id,
activity_type: newActivityType,
notes: newActivityNotes,
activity_date: new Date()
})

if(error){
alert("Error guardando actividad")
return
}

setNewActivityType("")
setNewActivityNotes("")

loadFollowups(selectedProspect.id)

}}
style={{
background:"#2563eb",
border:"none",
padding:"10px 14px",
color:"#fff",
borderRadius:6
}}
>
Guardar actividad
</button>

<button
onClick={async () => {

const { error } = await supabase
.from("prospects")
.update({
name: selectedProspect.name,
company_name: selectedProspect.company_name,
email: selectedProspect.email,
phone: selectedProspect.phone
})
.eq("id", selectedProspect.id)

if(error){
alert("Error actualizando prospecto")
return
}

alert("Prospecto actualizado")

await loadProspects()

setSelectedProspect(null)

}}
style={{
marginTop:10,
background:"#16a34a",
border:"none",
padding:"10px 14px",
color:"#fff",
borderRadius:6,
marginRight:10
}}
>
Guardar cambios
</button>

  <button
  onClick={convertToClient}
  style={{
    marginTop: 10,
    background: "#2563eb",
    border: "none",
    padding: "10px 14px",
    color: "#fff",
    borderRadius: 6
  }}
>
  Convertir a cliente
</button>
  
</div>
)}

</main>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#0b1220",
  color: "#fff",
  border: "1px solid #334155",
  borderRadius: 10,
  padding: "12px 14px",
  outline: "none",
};

const thStyle: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "1px solid #334155",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "1px solid #22314f",
};
