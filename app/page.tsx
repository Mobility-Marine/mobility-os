"use client";

import React from "react";
import Agenda from "./components/Agenda";
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
  stage_position: number | null;
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
  /* =========================================================
   * ESTADOS GENERALES
   * =======================================================*/
  const [status, setStatus] = useState("Conectando con Supabase...");
  const [companyCount, setCompanyCount] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<ViewName>("Dashboard");

  /* =========================================================
   * CRM
   * =======================================================*/
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  /* =========================================================
   * PROSPECTOS
   * =======================================================*/
  const [prospects, setProspects] = useState<ProspectRow[]>([]);
  const pipelineStages = [
    "Nuevo",
    "Contactado",
    "Cotización",
    "Negociación",
    "Ganado",
    "Perdido",
  ];
  const [followups, setFollowups] = useState<any[]>([]);
  const [prospectHistory, setProspectHistory] = useState<any[]>([]);
  const [loadingProspects, setLoadingProspects] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<ProspectRow | null>(
    null
  );

  const [newActivityType, setNewActivityType] = useState("");
  const [newActivityNotes, setNewActivityNotes] = useState("");

  const [tasks, setTasks] = useState<any[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

/* =========================================================
 * AGENDA — SAAS EMPRESARIAL
 * =======================================================*/

const [events, setEvents] = useState<any[]>([]);
const [loadingEvents, setLoadingEvents] = useState(false);
const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

/* ===== DATOS PRINCIPALES ===== */

const [newEventTitle, setNewEventTitle] = useState("");
const [eventDescription, setEventDescription] = useState("");
const [eventColor, setEventColor] = useState("#2563eb");

const [showEventModal, setShowEventModal] = useState(false);

const [modalDateTime, setModalDateTime] = useState("");
const [newEventStart, setNewEventStart] = useState("");
const [newEventEnd, setNewEventEnd] = useState("");

/* ===== TIPO DE ACTIVIDAD ===== */

const [eventType, setEventType] = useState<
  "Reunión" | "Llamada" | "Visita" | "Seguimiento" | "Operación" | "Personal"
>("Reunión");

/* ===== PRIORIDAD ===== */

const [eventPriority, setEventPriority] = useState<
  "Baja" | "Media" | "Alta" | "Crítica"
>("Media");

/* ===== ESTADO ===== */

const [eventStatus, setEventStatus] = useState<
  "Programado" | "Confirmado" | "Completado" | "Cancelado"
>("Programado");

/* ===== VINCULACIÓN CRM ===== */

const [linkedProspectId, setLinkedProspectId] = useState<string | null>(null);
const [linkedClientId, setLinkedClientId] = useState<string | null>(null);

/* ===== VISTA CALENDARIO ===== */

const [calendarView, setCalendarView] = useState<
  "day" | "week" | "month" | "year"
>("day");

/* ===== FECHA SELECCIONADA ===== */

function getLocalDateISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const [selectedDate, setSelectedDate] = useState(getLocalDateISO());

useEffect(() => {
  if (calendarView === "day") {
    setSelectedDate(getLocalDateISO());
  }
}, [calendarView]);
  
  /* =========================================================
   * FORMULARIOS
   * =======================================================*/
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
    stage_position: 0,
  });

  /* =========================================================
   * MÓDULOS
   * =======================================================*/
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

  /* =========================================================
   * EFFECTS
   * =======================================================*/
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
  }, [activeView]);

  useEffect(() => {
    if (activeView === "Agenda") {
      loadCalendarEvents();
    }
  }, [activeView]);

  useEffect(() => {
    if (calendarView === "day") {
      setSelectedDate(getLocalDateISO());
    }
  }, [calendarView]);

  /* =========================================================
   * CARGAS DE DATOS
   * =======================================================*/
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
    setLoadingEvents(true);

    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .order("start_datetime", { ascending: true });

    if (error) {
      alert("Error cargando calendario");
      return;
    }

    setEvents(data || []);
    setLoadingEvents(false);
  }

  async function loadFollowups(prospectId: string) {
    const { data, error } = await supabase
      .from("prospect_followups")
      .select("*")
      .eq("prospect_id", prospectId)
      .order("activity_date", { ascending: false });

    if (error) {
      alert("Error cargando historial");
      return;
    }

    setProspectHistory(data || []);
  }

  async function loadTasks(prospectId: string) {
    const { data, error } = await supabase
      .from("prospect_tasks")
      .select("*")
      .eq("prospect_id", prospectId)
      .order("due_date", { ascending: true });

    if (error) {
      alert("Error cargando tareas");
      return;
    }

    setTasks(data || []);
  }

  async function loadCalendarEvents() {
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .order("start_datetime", { ascending: true });

    if (error) {
      alert("Error cargando calendario");
      return;
    }

    setCalendarEvents(data || []);
  }

  /* =========================================================
   * ACCIONES CRM / PROSPECTOS
   * =======================================================*/
  async function convertToClient() {
    if (!selectedProspect) return;

    const { data: companyData } = await supabase
      .from("companies")
      .select("id")
      .limit(1);

    const companyId = companyData?.[0]?.id ?? null;

    const { error } = await supabase.from("clients").insert({
      company_id: companyId,
      name: selectedProspect.company_name || selectedProspect.name,
      contact: selectedProspect.name,
      email: selectedProspect.email,
      address: null,
      rfc: null,
    });

    if (error) {
      alert("Error creando cliente: " + error.message);
      return;
    }

    await supabase
      .from("prospects")
      .update({ status: "Ganado" })
      .eq("id", selectedProspect.id);

    alert("Prospecto convertido a cliente");

    loadClients();
    loadProspects();
    setSelectedProspect(null);
  }

  async function createNewClient() {
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
    const prospectId = e.dataTransfer.getData("prospectId");

    const { data: lastItems } = await supabase
      .from("prospects")
      .select("stage_position")
      .eq("status", newStage)
      .order("stage_position", { ascending: false })
      .limit(1);

    const nextPosition =
      lastItems && lastItems.length > 0
        ? (lastItems[0].stage_position || 0) + 1
        : 1;

    const { error } = await supabase
      .from("prospects")
      .update({
        status: newStage,
        stage_position: nextPosition,
      })
      .eq("id", prospectId);

    if (error) {
      alert("Error moviendo prospecto");
      return;
    }

    loadProspects();
  }

  /* =========================================================
   * MÉTRICAS
   * =======================================================*/
  function getStageTotal(stage: string) {
    return prospects
      .filter((p) => p.status === stage)
      .reduce((sum, p) => sum + (p.estimated_value || 0), 0);
  }

  function getProspectScore(p: ProspectRow) {
    let score = 0;

    score += (p.estimated_value || 0) / 1000;

    const stageWeights: Record<string, number> = {
      Nuevo: 5,
      Contactado: 10,
      Cotización: 20,
      Negociación: 30,
      Ganado: 50,
      Perdido: 0,
    };

    score += stageWeights[p.status || "Nuevo"] || 0;

    return Math.round(score);
  }

  function getPipelineTotal() {
    return prospects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
  }

  function getForecastTotal() {
    const probabilities: Record<string, number> = {
      Nuevo: 0.1,
      Contactado: 0.25,
      Cotización: 0.5,
      Negociación: 0.75,
      Ganado: 1,
      Perdido: 0,
    };

    return prospects.reduce((sum, p) => {
      const value = p.estimated_value || 0;
      const prob = probabilities[p.status || "Nuevo"] || 0;
      return sum + value * prob;
    }, 0);
  }

  function getTodayTasks() {
    const today = new Date().toDateString();

    return tasks.filter((t) => {
      if (!t.due_date) return false;
      return new Date(t.due_date).toDateString() === today;
    });
  }

  /* =========================================================
   * HELPERS DE CALENDARIO
   * =======================================================*/
  function generateHours() {
    const hours = [];

    for (let h = 8; h <= 20; h++) {
      const label = h.toString().padStart(2, "0") + ":00";
      hours.push(label);
    }

    return hours;
  }

  function getWeekDays() {
    const base = new Date(selectedDate + "T12:00:00");

    const start = new Date(base);
    start.setDate(base.getDate() - base.getDay() + 1);

    const days = [];

    for (let i = 0; i < 5; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }

    return days;
  }

  function getMonthDays() {
    const base = new Date(selectedDate);

    const year = base.getFullYear();
    const month = base.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDay = (firstDay.getDay() + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();

    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        currentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        currentMonth: true,
      });
    }

    while (days.length < 42) {
      const d = days.length - daysInMonth - startDay + 1;
      days.push({
        date: new Date(year, month + 1, d),
        currentMonth: false,
      });
    }

    return days;
  }

  /* =========================================================
   * CREAR PROSPECTO
   * =======================================================*/
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
      status: "Nuevo",
      notes: "",
      estimated_value: 0,
      stage_position: 0,
    });

    setStatus("Prospecto creado correctamente");
    loadProspects();
  }

  /* =========================================================
   * CARDS DASHBOARD
   * =======================================================*/
  const cards = [
    { title: "Cotizaciones abiertas", value: "0" },
    { title: "Embarques activos", value: "0" },
    { title: "Facturas pendientes", value: "0" },
    { title: "Empresas registradas", value: companyCount ?? "-" },
  ];

/* =========================================================
 * RENDER
 * =======================================================*/

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
      {/* =====================================================
       * SIDEBAR
       * ===================================================*/}
      <aside
        style={{
          background: "#0b1b3a",
          borderRight: "1px solid #1e335c",
          padding: "24px 18px",
          height: "100vh",
          overflowY: "auto",
          scrollbarWidth: "thin",
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

      {/* =====================================================
       * CONTENIDO PRINCIPAL
       * ===================================================*/}
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

        {/* =====================================================
         * DASHBOARD
         * ===================================================*/}
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
                  <div
                    style={{ fontSize: 30, fontWeight: 700, marginTop: 10 }}
                  >
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
                marginTop: 16,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Agenda de hoy</h3>

              {getTodayTasks().length === 0 ? (
                <p style={{ color: "#9fb3d9" }}>
                  No hay actividades programadas hoy
                </p>
              ) : (
                getTodayTasks().map((task) => (
                  <div
                    key={task.id}
                    style={{
                      borderBottom: "1px solid #243a63",
                      padding: "8px 0",
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

        {/* =====================================================
         * PROSPECTOS
         * ===================================================*/}
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
                    setProspectForm({
                      ...prospectForm,
                      status: e.target.value,
                    })
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
                  fontWeight: "bold",
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
                  fontWeight: "bold",
                }}
              >
                Forecast estimado: ${getForecastTotal().toLocaleString()}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: 16,
                  marginTop: 20,
                  marginBottom: 30,
                }}
              >
                {pipelineStages.map((stage) => (
                  <div
                    key={stage}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, stage)}
                    style={{
                      background: "#0f1f3d",
                      border: "1px solid #2f5aa6",
                      borderRadius: 10,
                      padding: 12,
                      minHeight: 180,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        marginBottom: 10,
                        borderBottom: "1px solid #2f5aa6",
                        paddingBottom: 6,
                      }}
                    >
                      {stage}

                      <div
                        style={{
                          fontSize: 12,
                          color: "#9fb3d9",
                          marginTop: 4,
                        }}
                      >
                        ${getStageTotal(stage).toLocaleString()} USD
                      </div>
                    </div>

                    {prospects
                      .filter((p) => p.status === stage)
                      .sort((a, b) => getProspectScore(b) - getProspectScore(a))
                      .map((p) => (
                        <div
                          key={p.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("prospectId", p.id);
                          }}
                          onClick={() => setSelectedProspect(p)}
                          style={{
                            background: "#162a52",
                            padding: 10,
                            borderRadius: 8,
                            marginBottom: 8,
                            cursor: "grab",
                          }}
                        >
                          <div style={{ fontWeight: "bold" }}>
                            {p.company_name || p.name}
                          </div>

                          <div
                            style={{
                              fontSize: 11,
                              color: "#60a5fa",
                              marginTop: 4,
                            }}
                          >
                            Score: {getProspectScore(p)}
                          </div>

                          <div style={{ fontSize: 12, color: "#9fb3d9" }}>
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
                            setSelectedProspect(prospect);
                            loadFollowups(prospect.id);
                            loadTasks(prospect.id);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <td style={tdStyle}>{prospect.name || "-"}</td>
                          <td style={tdStyle}>
                            {prospect.company_name || "-"}
                          </td>
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
                                const newStatus = e.target.value;

                                const { data: lastItems } = await supabase
                                  .from("prospects")
                                  .select("stage_position")
                                  .eq("status", newStatus)
                                  .order("stage_position", { ascending: false })
                                  .limit(1);

                                const nextPosition =
                                  lastItems && lastItems.length > 0
                                    ? (lastItems[0].stage_position || 0) + 1
                                    : 1;

                                await supabase
                                  .from("prospects")
                                  .update({
                                    status: newStatus,
                                    stage_position: nextPosition,
                                  })
                                  .eq("id", prospect.id);

                                loadProspects();
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
                                const activity = prompt(
                                  "Tipo de actividad (llamada, correo, reunión)"
                                );

                                const notes = prompt("Notas de la actividad");

                                if (!activity) return;

                                const { error } = await supabase
                                  .from("prospect_followups")
                                  .insert({
                                    prospect_id: prospect.id,
                                    activity_type: activity,
                                    notes: notes,
                                  });

                                if (error) {
                                  alert(
                                    "Error guardando actividad: " + error.message
                                  );
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

        {/* =====================================================
         * CRM
         * ===================================================*/}
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
                onClick={createNewClient}
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

        {/* =====================================================
         * AGENDA
         * ===================================================*/}
        {activeView === "Agenda" && (
  <>
    <Agenda />

    <div style={{ display: "grid", gap: 16 }}>
            {/* ===== SELECTOR ===== */}
            <div style={{ display: "flex", gap: 8 }}>
              {(["day", "week", "month", "year"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setCalendarView(v)}
                  style={{
                    background: calendarView === v ? "#2563eb" : "#0f1f3d",
                    border: "1px solid #2f5aa6",
                    padding: "6px 12px",
                    color: "#fff",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {v === "day" && "Día"}
                  {v === "week" && "Semana"}
                  {v === "month" && "Mes"}
                  {v === "year" && "Año"}
                </button>
              ))}
            </div>

            {/* ===== CONTENEDOR ===== */}
            <section
              style={{
                background: "#12284d",
                border: "1px solid #284577",
                borderRadius: 16,
                padding: 22,
              }}
            >
              {/* ===== TITULO ===== */}
              <h3 style={{ marginTop: 0 }}>
                {calendarView === "day" &&
                  new Date(selectedDate + "T12:00:00").toLocaleDateString(
                    "es-MX",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}

                {calendarView === "week" &&
                  (() => {
                    const start = new Date(selectedDate + "T12:00:00");
                    start.setDate(start.getDate() - start.getDay() + 1);

                    const end = new Date(start);
                    end.setDate(start.getDate() + 6);

                    return `${start.toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                    })} — ${end.toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}`;
                  })()}

                {calendarView === "month" &&
                  new Date(selectedDate + "T12:00:00").toLocaleDateString(
                    "es-MX",
                    {
                      month: "long",
                      year: "numeric",
                    }
                  )}

                {calendarView === "year" &&
                  new Date(selectedDate + "T12:00:00").getFullYear()}
              </h3>

              {/* ===== NAV ===== */}
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <button
                  onClick={() => {
                    const d = new Date(selectedDate + "T12:00:00");

                    if (calendarView === "day") d.setDate(d.getDate() - 1);
                    else if (calendarView === "week")
                      d.setDate(d.getDate() - 7);
                    else if (calendarView === "month")
                      d.setMonth(d.getMonth() - 1);
                    else if (calendarView === "year")
                      d.setFullYear(d.getFullYear() - 1);

                    setSelectedDate(getLocalDateISO(d));
                  }}
                  style={navButtonStyle}
                >
                  ◀ Anterior
                </button>

                <button
                  onClick={() => {
                    setSelectedDate(getLocalDateISO());
                  }}
                  style={navButtonStyle}
                >
                  Hoy
                </button>

                <button
                  onClick={() => {
                    const d = new Date(selectedDate + "T12:00:00");

                    if (calendarView === "day") d.setDate(d.getDate() + 1);
                    else if (calendarView === "week")
                      d.setDate(d.getDate() + 7);
                    else if (calendarView === "month")
                      d.setMonth(d.getMonth() + 1);
                    else if (calendarView === "year")
                      d.setFullYear(d.getFullYear() + 1);

                    setSelectedDate(getLocalDateISO(d));
                  }}
                  style={navButtonStyle}
                >
                  Siguiente ▶
                </button>
              </div>

              {/* ===== DÍA — EVENTOS CON DURACIÓN REAL PRO ===== */}
              {calendarView === "day" && (
                <div
                  style={{
                    border: "1px solid #284577",
                    borderRadius: 12,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {/* ===== ENCABEZADO ===== */}
                  <div
                    style={{
                      background: "#0f1f3d",
                      padding: 12,
                      fontWeight: "bold",
                      borderBottom: "1px solid #284577",
                    }}
                  >
                    {new Date(
                      selectedDate + "T12:00:00"
                    ).toLocaleDateString("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>

                  {/* ===== GRID HORAS ===== */}
                  {generateHours().map((hour) => (
                    <div
                      key={hour}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        const eventId = e.dataTransfer.getData("eventId");
                        if (!eventId) return;

                        const date = new Date(selectedDate + "T12:00:00");
                        const [h, m] = hour.split(":");
                        date.setHours(Number(h), Number(m), 0, 0);

                        const iso = date.toISOString().slice(0, 16);

                        await supabase
                          .from("calendar_events")
                          .update({
                            start_datetime: iso,
                            end_datetime: iso,
                          })
                          .eq("id", eventId);

                        loadCalendarEvents();
                      }}
                      onClick={() => {
                        const date = new Date(selectedDate + "T12:00:00");
                        const [h, m] = hour.split(":");
                        date.setHours(Number(h), Number(m), 0, 0);

                        const iso = date.toISOString().slice(0, 16);

                        setModalDateTime(iso);
                        setShowEventModal(true);
                        setNewEventStart(iso);
                        setNewEventEnd(iso);
                      }}
                      style={{
                        borderBottom: "1px solid #284577",
                        minHeight: 64,
                        display: "grid",
                        gridTemplateColumns: "100px 1fr",
                      }}
                    >
                      <div
                        style={{
                          padding: "10px 12px",
                          background: "#102244",
                          borderRight: "1px solid #284577",
                          fontWeight: "bold",
                        }}
                      >
                        {hour}
                      </div>

                      <div />
                    </div>
                  ))}

                  {/* ===== EVENTOS CON DURACIÓN ===== */}
                  {calendarEvents.map((ev) => {
                    const start = new Date(ev.start_datetime);
                    const end = new Date(ev.end_datetime);
                    const selected = new Date(selectedDate + "T12:00:00");

                    if (
                      start.getFullYear() !== selected.getFullYear() ||
                      start.getMonth() !== selected.getMonth() ||
                      start.getDate() !== selected.getDate()
                    )
                      return null;

                    const HOUR_HEIGHT = 64;
                    const START_HOUR = 8;
                    const END_HOUR = 20;

                    let startMinutes =
                      (start.getHours() - START_HOUR) * 60 + start.getMinutes();

                    let endMinutes =
                      (end.getHours() - START_HOUR) * 60 + end.getMinutes();

                    startMinutes = Math.max(startMinutes, 0);
                    endMinutes = Math.min(
                      endMinutes,
                      (END_HOUR - START_HOUR) * 60
                    );

                    const durationMinutes = Math.max(
                      endMinutes - startMinutes,
                      30
                    );

                    const top = (startMinutes / 60) * HOUR_HEIGHT;
                    const height = (durationMinutes / 60) * HOUR_HEIGHT;

                    return (
                      <div
                        key={ev.id}
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData("eventId", ev.id)
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalDateTime(ev.start_datetime);
                          setShowEventModal(true);
                        }}
                        style={{
                          position: "absolute",
                          top: 44 + top,
                          left: 105,
                          right: 10,
                          height,
                          background: ev.color || "#2563eb",
                          borderRadius: 6,
                          padding: "4px 8px",
                          fontSize: 12,
                          color: "#fff",
                          cursor: "grab",
                          zIndex: 50,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                          overflow: "hidden",
                        }}
                      >
                        {ev.title}
                      </div>
                    );
                  })}

                  {/* ===== LÍNEA HORA ACTUAL ===== */}
                  {(() => {
                    const now = new Date();
                    const selected = new Date(selectedDate + "T12:00:00");

                    if (now.toDateString() !== selected.toDateString())
                      return null;

                    const hour = now.getHours();
                    const minute = now.getMinutes();

                    if (hour < 8 || hour > 20) return null;

                    const HOUR_HEIGHT = 64;

                    const offsetTop =
                      (hour - 8) * HOUR_HEIGHT +
                      (minute / 60) * HOUR_HEIGHT;

                    return (
                      <div
                        style={{
                          position: "absolute",
                          top: 44 + offsetTop,
                          left: 100,
                          right: 0,
                          height: 2,
                          background: "red",
                          zIndex: 100,
                          pointerEvents: "none",
                        }}
                      />
                    );
                  })()}
                </div>
              )}

              {/* ===== SEMANA — EVENTOS CON DURACIÓN REAL ===== */}
              {calendarView === "week" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px repeat(5, 1fr)",
                    border: "1px solid #284577",
                    borderRadius: 12,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div />

                  {getWeekDays().map((day, i) => {
                    const today = new Date();

                    const isToday =
                      day.getFullYear() === today.getFullYear() &&
                      day.getMonth() === today.getMonth() &&
                      day.getDate() === today.getDate();

                    return (
                      <div
                        key={i}
                        style={{
                          background: isToday ? "#1d4ed8" : "#0f1f3d",
                          padding: 10,
                          textAlign: "center",
                          fontWeight: "bold",
                          borderLeft: "1px solid #284577",
                        }}
                      >
                        {day.toLocaleDateString("es-MX", {
                          weekday: "short",
                          day: "numeric",
                        })}
                      </div>
                    );
                  })}

                  {generateHours().map((hour) => (
                    <React.Fragment key={hour}>
                      <div
                        style={{
                          borderTop: "1px solid #284577",
                          padding: 6,
                          fontSize: 12,
                          color: "#9fb3d9",
                        }}
                      >
                        {hour}
                      </div>

                      {getWeekDays().map((day, i) => (
                        <div
                          key={i}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={async (e) => {
                            const eventId = e.dataTransfer.getData("eventId");
                            if (!eventId) return;

                            const date = new Date(day);
                            const [h, m] = hour.split(":");
                            date.setHours(Number(h), Number(m), 0, 0);

                            const iso = date.toISOString().slice(0, 16);

                            await supabase
                              .from("calendar_events")
                              .update({
                                start_datetime: iso,
                                end_datetime: iso,
                              })
                              .eq("id", eventId);

                            loadCalendarEvents();
                          }}
                          onClick={() => {
                            const date = new Date(day);
                            const [h, m] = hour.split(":");
                            date.setHours(Number(h), Number(m), 0, 0);

                            const iso = date.toISOString().slice(0, 16);

                            setModalDateTime(iso);
                            setShowEventModal(true);
                          }}
                          style={{
                            borderTop: "1px solid #284577",
                            borderLeft: "1px solid #284577",
                            minHeight: 40,
                            cursor: "pointer",
                          }}
                        />
                      ))}
                    </React.Fragment>
                  ))}

                  {calendarEvents.map((ev) => {
                    const start = new Date(ev.start_datetime);
                    const end = new Date(ev.end_datetime);

                    const weekDays = getWeekDays();

                    const dayIndex = weekDays.findIndex(
                      (d) =>
                        d.getFullYear() === start.getFullYear() &&
                        d.getMonth() === start.getMonth() &&
                        d.getDate() === start.getDate()
                    );

                    if (dayIndex === -1) return null;

                    const hourHeight = 40;

                    const startOffset =
                      (start.getHours() - 8) * hourHeight +
                      (start.getMinutes() / 60) * hourHeight;

                    const durationMinutes =
                      (end.getTime() - start.getTime()) / 60000 || 30;

                    const height = (durationMinutes / 60) * hourHeight;

                    return (
                      <div
                        key={ev.id}
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData("eventId", ev.id)
                        }
                        style={{
                          position: "absolute",
                          top: 40 + startOffset,
                          left: `calc(80px + ${dayIndex} * ((100% - 80px) / 5))`,
                          width: `calc((100% - 80px) / 5 - 8px)`,
                          height: Math.max(height, 20),
                          background: ev.color || "#2563eb",
                          borderRadius: 6,
                          padding: "4px 6px",
                          fontSize: 11,
                          color: "#fff",
                          cursor: "grab",
                          zIndex: 50,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                        }}
                      >
                        {ev.title}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ===== MES — EVENTOS PRO ===== */}
              {calendarView === "month" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    border: "1px solid #284577",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(
                    (d) => (
                      <div
                        key={d}
                        style={{
                          background: "#0f1f3d",
                          padding: 10,
                          textAlign: "center",
                          fontWeight: "bold",
                          borderBottom: "1px solid #284577",
                          borderRight: "1px solid #284577",
                        }}
                      >
                        {d}
                      </div>
                    )
                  )}

                  {getMonthDays().map((day, i) => {
                    const today = new Date();

                    const isToday =
                      day.date.getFullYear() === today.getFullYear() &&
                      day.date.getMonth() === today.getMonth() &&
                      day.date.getDate() === today.getDate();

                    const dayEvents = calendarEvents.filter((e) => {
                      const d = new Date(e.start_datetime);
                      return d.toDateString() === day.date.toDateString();
                    });

                    return (
                      <div
                        key={i}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={async (e) => {
                          const eventId = e.dataTransfer.getData("eventId");
                          if (!eventId) return;

                          const d = new Date(day.date);
                          d.setHours(9, 0, 0, 0);

                          const yyyy = d.getFullYear();
                          const mm = String(d.getMonth() + 1).padStart(2, "0");
                          const dd = String(d.getDate()).padStart(2, "0");

                          const newDateTime = `${yyyy}-${mm}-${dd}T09:00`;

                          await supabase
                            .from("calendar_events")
                            .update({
                              start_datetime: newDateTime,
                              end_datetime: newDateTime,
                            })
                            .eq("id", eventId);

                          loadCalendarEvents();
                        }}
                        onClick={() => {
                          const d = new Date(day.date);
                          d.setHours(9, 0, 0, 0);

                          const yyyy = d.getFullYear();
                          const mm = String(d.getMonth() + 1).padStart(2, "0");
                          const dd = String(d.getDate()).padStart(2, "0");

                          setModalDateTime(`${yyyy}-${mm}-${dd}T09:00`);
                          setShowEventModal(true);
                        }}
                        style={{
                          minHeight: 140,
                          padding: 6,
                          borderTop: "1px solid #284577",
                          borderRight: "1px solid #284577",
                          background: day.currentMonth ? "#08142c" : "#0b1b3a",
                          opacity: day.currentMonth ? 1 : 0.35,
                          cursor: "pointer",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: "bold",
                            background: isToday ? "#2563eb" : "transparent",
                            borderRadius: 6,
                            display: "inline-block",
                            padding: "3px 7px",
                            marginBottom: 6,
                            color: "#fff",
                          }}
                        >
                          {day.date.getDate()}
                        </div>

                        {dayEvents.slice(0, 4).map((ev) => {
                          const start = new Date(ev.start_datetime);
                          const end = new Date(ev.end_datetime);

                          const durationMin =
                            (end.getTime() - start.getTime()) / 60000 || 30;

                          const hours = Math.floor(durationMin / 60);
                          const mins = durationMin % 60;

                          const durationLabel =
                            hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

                          const timeLabel =
                            start.getHours().toString().padStart(2, "0") +
                            ":" +
                            start.getMinutes().toString().padStart(2, "0");

                          return (
                            <div
                              key={ev.id}
                              draggable
                              onDragStart={(e) =>
                                e.dataTransfer.setData("eventId", ev.id)
                              }
                              style={{
                                background: ev.color || "#2563eb",
                                padding: "5px 7px",
                                borderRadius: 6,
                                marginBottom: 5,
                                fontSize: 11,
                                cursor: "grab",
                                color: "#fff",
                                lineHeight: 1.2,
                              }}
                            >
                              <div style={{ fontWeight: "bold" }}>
                                {timeLabel}
                              </div>

                              <div
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {ev.title}
                              </div>

                              <div
                                style={{
                                  fontSize: 10,
                                  opacity: 0.8,
                                }}
                              >
                                {durationLabel}
                              </div>
                            </div>
                          );
                        })}

                        {dayEvents.length > 4 && (
                          <div style={{ fontSize: 10, opacity: 0.7 }}>
                            +{dayEvents.length - 4} más
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ===== VISTA AÑO — INTERACTIVA PRO ===== */}
              {calendarView === "year" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 16,
                  }}
                >
                  {Array.from({ length: 12 }).map((_, monthIndex) => {
                    const year = new Date(
                      selectedDate + "T12:00:00"
                    ).getFullYear();

                    const firstDay = new Date(year, monthIndex, 1);
                    const startDay = (firstDay.getDay() + 6) % 7;
                    const daysInMonth = new Date(
                      year,
                      monthIndex + 1,
                      0
                    ).getDate();

                    const days = [];
                    const prevMonthDays = new Date(
                      year,
                      monthIndex,
                      0
                    ).getDate();

                    for (let i = startDay - 1; i >= 0; i--) {
                      days.push({
                        date: new Date(
                          year,
                          monthIndex - 1,
                          prevMonthDays - i
                        ),
                        currentMonth: false,
                      });
                    }

                    for (let i = 1; i <= daysInMonth; i++) {
                      days.push({
                        date: new Date(year, monthIndex, i),
                        currentMonth: true,
                      });
                    }

                    while (days.length < 42) {
                      const d = days.length - daysInMonth - startDay + 1;
                      days.push({
                        date: new Date(year, monthIndex + 1, d),
                        currentMonth: false,
                      });
                    }

                    return (
                      <div
                        key={monthIndex}
                        style={{
                          background: "#0f1f3d",
                          padding: 10,
                          borderRadius: 8,
                        }}
                      >
                        <div
                          style={{
                            textAlign: "center",
                            fontWeight: "bold",
                            marginBottom: 6,
                            textTransform: "capitalize",
                          }}
                        >
                          {new Date(year, monthIndex).toLocaleString("es-MX", {
                            month: "long",
                          })}
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            fontSize: 10,
                            marginBottom: 4,
                            opacity: 0.7,
                          }}
                        >
                          {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                            <div key={d} style={{ textAlign: "center" }}>
                              {d}
                            </div>
                          ))}
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            gap: 2,
                          }}
                        >
                          {days.map((day, i) => {
                            const today = new Date();

                            const isToday =
                              day.date.getFullYear() === today.getFullYear() &&
                              day.date.getMonth() === today.getMonth() &&
                              day.date.getDate() === today.getDate();

                            const dayEvents = calendarEvents.filter((ev) => {
                              const d = new Date(ev.start_datetime);
                              return (
                                d.getFullYear() === day.date.getFullYear() &&
                                d.getMonth() === day.date.getMonth() &&
                                d.getDate() === day.date.getDate()
                              );
                            });

                            return (
                              <div
                                key={i}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={async (e) => {
                                  const eventId =
                                    e.dataTransfer.getData("eventId");
                                  if (!eventId) return;

                                  const d = new Date(day.date);
                                  d.setHours(9, 0, 0, 0);

                                  const iso = d.toISOString().slice(0, 16);

                                  await supabase
                                    .from("calendar_events")
                                    .update({
                                      start_datetime: iso,
                                      end_datetime: iso,
                                    })
                                    .eq("id", eventId);

                                  loadCalendarEvents();
                                }}
                                onClick={() => {
                                  const d = new Date(day.date);
                                  d.setHours(9, 0, 0, 0);

                                  const iso = d.toISOString().slice(0, 16);

                                  setModalDateTime(iso);
                                  setShowEventModal(true);
                                }}
                                style={{
                                  padding: 4,
                                  textAlign: "center",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  background: isToday ? "#2563eb" : "#08142c",
                                  opacity: day.currentMonth ? 1 : 0.3,
                                  border: "1px solid #1e335c",
                                  fontSize: 11,
                                  position: "relative",
                                  transition: "background 0.2s",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = "#0b1f44")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background = isToday
                                    ? "#2563eb"
                                    : "#08142c")
                                }
                              >
                                {day.date.getDate()}

                                {dayEvents.length > 0 && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      bottom: 2,
                                      left: "50%",
                                      transform: "translateX(-50%)",
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      background: "#60a5fa",
                                    }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

{/* ===== MODAL EVENTO — SAAS EMPRESARIAL ULTRA ===== */}
{showEventModal && (

  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3000,
      backdropFilter: "blur(4px)"
    }}
    onClick={() => setShowEventModal(false)}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#0f172a",
        padding: 28,
        borderRadius: 16,
        width: 520,
        border: "1px solid #284577",
        boxShadow: "0 30px 80px rgba(0,0,0,0.8)"
      }}
    >

  <h2 style={{ marginTop: 0, marginBottom: 18 }}>
    Actividad / Evento
  </h2>

  {/* ===== TITULO ===== */}
  <input
    placeholder="Título"
    value={newEventTitle}
    onChange={(e) => setNewEventTitle(e.target.value)}
    style={{ ...inputStyle, marginBottom: 12 }}
  />

  {/* ===== DESCRIPCIÓN ===== */}
  <textarea
    placeholder="Descripción"
    value={eventDescription}
    onChange={(e) => setEventDescription(e.target.value)}
    style={{
      ...inputStyle,
      height: 80,
      resize: "none",
      marginBottom: 14
    }}
  />

  {/* ===== TIPO ===== */}
  <label style={{ fontSize: 13 }}>Tipo de actividad</label>
  <select
    value={eventType}
    onChange={(e) => setEventType(e.target.value as any)}
    style={{ ...inputStyle, marginBottom: 12 }}
  >
    <option>Reunión</option>
    <option>Llamada</option>
    <option>Visita</option>
    <option>Seguimiento</option>
    <option>Operación</option>
    <option>Personal</option>
  </select>

  {/* ===== PRIORIDAD ===== */}
  <label style={{ fontSize: 13 }}>Prioridad</label>
  <select
    value={eventPriority}
    onChange={(e) => setEventPriority(e.target.value as any)}
    style={{ ...inputStyle, marginBottom: 12 }}
  >
    <option>Baja</option>
    <option>Media</option>
    <option>Alta</option>
    <option>Crítica</option>
  </select>

  {/* ===== ESTADO ===== */}
  <label style={{ fontSize: 13 }}>Estado</label>
  <select
    value={eventStatus}
    onChange={(e) => setEventStatus(e.target.value as any)}
    style={{ ...inputStyle, marginBottom: 14 }}
  >
    <option>Programado</option>
    <option>Confirmado</option>
    <option>Completado</option>
    <option>Cancelado</option>
  </select>

  {/* ===== COLOR ===== */}
  <label style={{ fontSize: 13 }}>Color</label>
  <input
    type="color"
    value={eventColor}
    onChange={(e) => setEventColor(e.target.value)}
    style={{ marginBottom: 16 }}
  />

  {/* ===== FECHAS ===== */}
  <label style={{ fontSize: 13 }}>Inicio</label>
  <input
    type="datetime-local"
    value={modalDateTime}
    onChange={(e) => {
      setModalDateTime(e.target.value)
      setNewEventStart(e.target.value)
    }}
    style={{ ...inputStyle, marginBottom: 12 }}
  />

  <label style={{ fontSize: 13 }}>Fin</label>
  <input
    type="datetime-local"
    value={newEventEnd || modalDateTime}
    onChange={(e) => setNewEventEnd(e.target.value)}
    style={{ ...inputStyle, marginBottom: 20 }}
  />

  {/* ===== BOTONES ===== */}
  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>

    <button
      onClick={() => setShowEventModal(false)}
      style={{
        background: "#475569",
        border: "none",
        padding: "10px 16px",
        color: "#fff",
        borderRadius: 8,
        cursor: "pointer"
      }}
    >
      Cancelar
    </button>

    <button
      onClick={async () => {

        if (!modalDateTime) return
        if (!confirm("Eliminar evento?")) return

        await supabase
          .from("calendar_events")
          .delete()
          .eq("start_datetime", modalDateTime)

        setShowEventModal(false)
        loadCalendarEvents()

      }}
      style={{
        background: "#dc2626",
        border: "none",
        padding: "10px 16px",
        color: "#fff",
        borderRadius: 8,
        cursor: "pointer"
      }}
    >
      Eliminar
    </button>

    <button
      onClick={async () => {

        const start = newEventStart || modalDateTime
        const end = newEventEnd || start

        if (!newEventTitle || !start) {
          alert("Completa los campos")
          return
        }

        const { error } = await supabase
          .from("calendar_events")
          .insert({
            title: newEventTitle,
            description: eventDescription,
            type: eventType,
            priority: eventPriority,
            status: eventStatus,
            color: eventColor,
            start_datetime: start,
            end_datetime: end
          })

        if (error) {
          alert("Error creando evento")
          return
        }

        setShowEventModal(false)

        setNewEventTitle("")
        setEventDescription("")
        setNewEventStart("")
        setNewEventEnd("")

        loadCalendarEvents()

      }}
      style={{
        background: "#2563eb",
        border: "none",
        padding: "10px 16px",
        color: "#fff",
        borderRadius: 8,
        cursor: "pointer",
        fontWeight: "bold"
      }}
    >
      Guardar actividad
    </button>

  </div>

    </div> {/* FIN GRID */}
  </>
)}

        {/* =====================================================
         * MÓDULOS PENDIENTES
         * ===================================================*/}
        {!["Dashboard", "CRM", "Prospectos", "Agenda"].includes(activeView) && (
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

        {/* =====================================================
         * DRAWER DE PROSPECTO
         * ===================================================*/}
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
              zIndex: 1000,
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
                cursor: "pointer",
              }}
            >
              ✕
            </button>

            <h2 style={{ marginBottom: 20 }}>Prospecto</h2>

            <div style={{ marginBottom: 15 }}>
              <strong>Nombre</strong>
              <input
                value={selectedProspect.name || ""}
                onChange={(e) =>
                  setSelectedProspect({
                    ...selectedProspect,
                    name: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 15 }}>
              <strong>Empresa</strong>
              <input
                value={selectedProspect.company_name || ""}
                onChange={(e) =>
                  setSelectedProspect({
                    ...selectedProspect,
                    company_name: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 15 }}>
              <strong>Correo</strong>
              <input
                value={selectedProspect.email || ""}
                onChange={(e) =>
                  setSelectedProspect({
                    ...selectedProspect,
                    email: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 15 }}>
              <strong>Teléfono</strong>
              <input
                value={selectedProspect.phone || ""}
                onChange={(e) =>
                  setSelectedProspect({
                    ...selectedProspect,
                    phone: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 15 }}>
              <strong>Estatus</strong>
              <div>{selectedProspect.status}</div>
            </div>

            <h3 style={{ marginTop: 30 }}>Historial</h3>

            {prospectHistory.length === 0 && (
              <p style={{ color: "#9fb3d9" }}>Sin actividades registradas</p>
            )}

            {prospectHistory.map((item) => (
              <div
                key={item.id}
                style={{
                  borderBottom: "1px solid #243a63",
                  padding: "10px 0",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{item.activity_type}</div>

                <div style={{ fontSize: 14, color: "#9fb3d9" }}>
                  {item.notes}
                </div>

                <div
                  style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}
                >
                  {new Date(item.activity_date).toLocaleString()}
                </div>
              </div>
            ))}

            <h3 style={{ marginTop: 25 }}>Agregar actividad</h3>

            <h3 style={{ marginTop: 30 }}>Tareas pendientes</h3>

            {tasks.length === 0 && (
              <p style={{ color: "#9fb3d9" }}>Sin tareas</p>
            )}

            {tasks
              .filter((t) => t.status !== "done")
              .map((task) => (
                <div
                  key={task.id}
                  style={{
                    borderBottom: "1px solid #243a63",
                    padding: "10px 0",
                  }}
                >
                  <div style={{ fontWeight: "bold" }}>{task.title}</div>

                  <div style={{ fontSize: 14, color: "#9fb3d9" }}>
                    {task.description}
                  </div>

                  <div
                    style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}
                  >
                    Vence:{" "}
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString()
                      : "Sin fecha"}
                  </div>
                </div>
              ))}

            <select
              value={newActivityType}
              onChange={(e) => setNewActivityType(e.target.value)}
              style={{ ...inputStyle, marginBottom: 10 }}
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
              onChange={(e) => setNewActivityNotes(e.target.value)}
              style={{ ...inputStyle, marginBottom: 10 }}
            />

            <h3 style={{ marginTop: 25 }}>Tareas programadas</h3>

            <input
              placeholder="Título"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              style={{ ...inputStyle, marginBottom: 10 }}
            />

            <input
              placeholder="Descripción"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              style={{ ...inputStyle, marginBottom: 10 }}
            />

            <input
              type="datetime-local"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              style={{ ...inputStyle, marginBottom: 10 }}
            />

            <button
              onClick={async () => {
                if (!taskTitle || !taskDueDate) {
                  alert("Completa título y fecha");
                  return;
                }

                const { error } = await supabase
                  .from("prospect_tasks")
                  .insert({
                    prospect_id: selectedProspect.id,
                    title: taskTitle,
                    description: taskDescription,
                    due_date: taskDueDate,
                    status: "pending",
                  });

                if (error) {
                  alert("Error guardando tarea");
                  return;
                }

                setTaskTitle("");
                setTaskDescription("");
                setTaskDueDate("");

                loadTasks(selectedProspect.id);
              }}
              style={{
                background: "#2563eb",
                border: "none",
                padding: "10px 14px",
                color: "#fff",
                borderRadius: 6,
              }}
            >
              Crear tarea
            </button>

            {tasks.length === 0 && (
              <p style={{ color: "#9fb3d9" }}>Sin tareas programadas</p>
            )}

            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  borderBottom: "1px solid #243a63",
                  padding: "10px 0",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{task.title}</div>

                <div style={{ fontSize: 14, color: "#9fb3d9" }}>
                  {task.description}
                </div>

                <div
                  style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}
                >
                  {new Date(task.due_date).toLocaleString()}
                </div>

                {task.status !== "done" && (
                  <button
                    onClick={async () => {
                      await supabase
                        .from("prospect_tasks")
                        .update({ status: "done" })
                        .eq("id", task.id);

                      loadTasks(selectedProspect.id);
                    }}
                    style={{
                      marginTop: 6,
                      background: "#16a34a",
                      border: "none",
                      padding: "6px 10px",
                      color: "#fff",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Marcar completada
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={async () => {
                if (!newActivityType) {
                  alert("Selecciona un tipo de actividad");
                  return;
                }

                const { error } = await supabase
                  .from("prospect_followups")
                  .insert({
                    prospect_id: selectedProspect.id,
                    activity_type: newActivityType,
                    notes: newActivityNotes,
                    activity_date: new Date(),
                  });

                if (error) {
                  alert("Error guardando actividad");
                  return;
                }

                setNewActivityType("");
                setNewActivityNotes("");

                loadFollowups(selectedProspect.id);
              }}
              style={{
                background: "#2563eb",
                border: "none",
                padding: "10px 14px",
                color: "#fff",
                borderRadius: 6,
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
                    phone: selectedProspect.phone,
                  })
                  .eq("id", selectedProspect.id);

                if (error) {
                  alert("Error actualizando prospecto");
                  return;
                }

                alert("Prospecto actualizado");

                await loadProspects();

                setSelectedProspect(null);
              }}
              style={{
                marginTop: 10,
                background: "#16a34a",
                border: "none",
                padding: "10px 14px",
                color: "#fff",
                borderRadius: 6,
                marginRight: 10,
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
                borderRadius: 6,
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

const navButtonStyle: React.CSSProperties = {
  background: "#1d4ed8",
  border: "none",
  padding: "8px 12px",
  color: "#fff",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
};
