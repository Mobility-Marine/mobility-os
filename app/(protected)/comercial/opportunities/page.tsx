"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";

// ===== INICIO TYPE Opportunity — modelo enterprise =====
type Opportunity = {
  id: string;
  name: string;
  company_name: string;
  stage: string;
  value: number;
  probability: number;
  created_at: string;
  next_action?: string;

  // 🏢 Enterprise fields
  owner?: string;       // responsable del deal
  archived?: boolean;   // soft delete
};
// ===== FIN TYPE Opportunity =====

const stages = [
  "Qualification",
  "Discovery",
  "Proposal",
  "Negotiation",
  "Commit",
  "Closed Won",
  "Closed Lost",
];

export default function OpportunitiesPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // 🧠 WAR ROOM — oportunidad seleccionada
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [editProbability, setEditProbability] = useState<number>(0);
  const [nextAction, setNextAction] = useState("");
  // ===== INICIO STATE edición etapa =====
  const [editStage, setEditStage] = useState<string>("");
  const [editOwner, setEditOwner] = useState<string>("");
  // ===== FIN STATE edición etapa =====
  // ===== INICIO STATE guardado visual =====
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // ===== FIN STATE guardado visual =====
  const { companyId } = useTenant();

 useEffect(() => {
   if (companyId) load();
 }, [companyId]);

useEffect(() => {
  if (!companyId) return;

  const channel = supabase
    .channel("opportunities-live")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "opportunities",
        filter: `company_id=eq.${companyId}`,
      },
      () => load()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [companyId]);
  
  async function createOpportunity() {
    const name = prompt("Nombre de la oportunidad");
    if (!name) return;

    const company = prompt("Empresa");
    const value = Number(prompt("Valor estimado (USD)") || 0);

 if (!companyId) {
  alert("No hay empresa activa");
  return;
}

await supabase.from("opportunities").insert({
  name,
  company_name: company,
  value,
  stage: "Qualification",
  probability: 10,
  company_id: companyId,
});

    load();
  }
  
 // ===== INICIO move() — actualización segura por empresa =====
async function move(id: string, newStage: string) {
  if (!companyId) return;

  await supabase
    .from("opportunities")
    .update({ stage: newStage })
    .eq("id", id)
    .eq("company_id", companyId); // 🔐 filtro SaaS

  load();
}
// ===== FIN move() =====

  function stageTotal(stage: string) {
    return items
      .filter((i) => i.stage === stage)
      .reduce((sum, i) => sum + (i.value || 0), 0);
  }

  function pipelineTotal() {
    return items.reduce((sum, i) => sum + (i.value || 0), 0);
  }

  function weightedForecast() {
    return items.reduce(
      (sum, i) => sum + (i.value || 0) * ((i.probability || 0) / 100),
      0
    );
  }

  function openOpportunities() {
    return items.filter(
      (i) => i.stage !== "Closed Won" && i.stage !== "Closed Lost"
    );
  }

  function riskOpportunities() {
    return openOpportunities().filter(
      (i) => (i.probability || 0) < 40 && (i.value || 0) > 0
    );
  }

  function wonOpportunities() {
    return items.filter((i) => i.stage === "Closed Won");
  }

 if (!companyId) return <div>Cargando empresa…</div>;
if (loading) return <div>Cargando pipeline…</div>;

  function Metric({ label, value }: { label: string; value: string }) {
    return (
      <div
        style={{
          background: "#0b1220",
          border: "1px solid #1f2937",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div style={{ fontSize: 12, color: "#94a3b8" }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
      </div>
    );
  }

async function load() {
  if (!companyId) return;

  setLoading(true);

  const { data } = await supabase
    .from("opportunities")
    .select("*")
.eq("company_id", companyId)
.eq("archived", false) // 👈 evita mostrar archivadas

  setItems(data || []);
  setLoading(false);
}
  
  function ActivityPanel({ opportunity }: { opportunity: Opportunity }) {
    const { companyId } = useTenant();
  const [activities, setActivities] = useState<any[]>([]);
const [text, setText] = useState("");

async function loadActivities() {
 const { data } = await supabase
  .from("opportunity_activities")
  .select("*")
  .eq("opportunity_id", opportunity.id)
  .eq("company_id", companyId)   // 👈 AQUÍ
  .order("created_at", { ascending: false });

  setActivities(data || []);
}

useEffect(() => {
  void loadActivities();

  const channel = supabase
    .channel(`activities-${opportunity.id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "opportunity_activities",
        filter: `opportunity_id=eq.${opportunity.id},company_id=eq.${companyId}`,
      },
      () => loadActivities()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [opportunity.id, companyId]);
    
   // ===== INICIO addActivity() — inserción segura =====
async function addActivity() {
  if (!text.trim()) return;
  if (!companyId) return;

  await supabase.from("opportunity_activities").insert({
    opportunity_id: opportunity.id,
    description: text,
    type: "task",
    company_id: companyId,
  });

  setText("");
  loadActivities();
}
// ===== FIN addActivity() =====

  // ===== INICIO toggle() — actividad segura por empresa =====
async function toggle(id: string, completed: boolean) {
  if (!companyId) return;

  await supabase
    .from("opportunity_activities")
    .update({ completed: !completed })
    .eq("id", id)
    .eq("company_id", companyId); // 🔐 filtro SaaS

  loadActivities();
}
// ===== FIN toggle() =====

    return (
      <div
        style={{
          background: "#0f172a",
          borderRadius: 12,
          padding: 16,
          border: "1px solid #1e293b",
          display: "grid",
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 800 }}>Ejecución comercial</div>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nueva actividad…"
            style={{
              flex: 1,
              background: "#020617",
              border: "1px solid #1e293b",
              borderRadius: 8,
              padding: 10,
              color: "#fff",
            }}
          />

          <button
            onClick={addActivity}
            style={{
              background: "#7aa2ff",
              border: "none",
              borderRadius: 8,
              padding: "0 14px",
              fontWeight: 700,
              cursor: "pointer",
              color: "#0a0d12",
            }}
          >
            Agregar
          </button>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {activities.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 14 }}>
              No hay actividades registradas todavía.
            </div>
          ) : (
            activities.map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: 10,
                  borderRadius: 8,
                  background: "#020617",
                  border: "1px solid #1e293b",
                }}
              >
                <input
                  type="checkbox"
                  checked={!!a.completed}
                  onChange={() => toggle(a.id, !!a.completed)}
                />

                <div
                  style={{
                    textDecoration: a.completed ? "line-through" : "none",
                    color: a.completed ? "#64748b" : "#fff",
                  }}
                >
                  {a.description}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  function Autopilot({ opportunity }: { opportunity: Opportunity }) {
    const risk =
      opportunity.probability < 40 ? "Alto riesgo" : "Riesgo moderado";

    return (
      <div
        style={{
          background: "#020617",
          border: "1px solid #1e293b",
          borderRadius: 12,
          padding: 16,
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ fontWeight: 800, color: "#f59e0b" }}>
          AUTOPILOT DE CIERRE
        </div>

        <div style={{ fontSize: 18, fontWeight: 800 }}>
          Si solo haces una cosa hoy:
        </div>

        <div style={{ color: "#cbd5e1" }}>
          Contactar al decisor y validar condiciones de cierre.
        </div>

        <div style={{ fontSize: 13, color: "#94a3b8" }}>
          Impacto estimado: $
          {(
            ((opportunity.value || 0) * (opportunity.probability || 0)) /
            100
          ).toLocaleString()}
        </div>

        <div style={{ color: "#f87171" }}>{risk}</div>
      </div>
    );
  }

// ===== INICIO saveOpportunity() — guardado enterprise =====
async function saveOpportunity() {
  if (!selected) return;

  setSaving(true);
  setSaved(false);

  const updates = {
    value: editValue,
    probability: editProbability,
    next_action: nextAction,
    stage: editStage,
    owner: editOwner,
  };

  const { error } = await supabase
    .from("opportunities")
    .update(updates)
    .eq("id", selected.id);

  if (!error) {
    // 🧠 Actualización optimista (no cerrar War Room)
    setSelected({ ...selected, ...updates });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    load(); // sincroniza pipeline
  }

  setSaving(false);
}
// ===== FIN saveOpportunity() =====

  // ===== INICIO archiveOpportunity() — soft delete =====
async function archiveOpportunity() {
  if (!selected) return;

  const confirmArchive = confirm(
    "¿Archivar esta oportunidad? Se podrá recuperar posteriormente."
  );
  if (!confirmArchive) return;

  await supabase
    .from("opportunities")
    .update({ archived: true })
    .eq("id", selected.id);

  setSelected(null);
  load();
}
// ===== FIN archiveOpportunity() =====

  function closingScore(o: Opportunity) {
  const valueScore = Math.min(o.value / 100000, 1) * 40;
  const probScore = (o.probability || 0) * 0.6;
  return Math.round(valueScore + probScore);
}

function riskLevel(o: Opportunity) {
  if (o.probability < 30) return "ALTO";
  if (o.probability < 60) return "MEDIO";
  return "BAJO";
}

// ===== INICIO agingDays() — días desde creación =====
function agingDays(o: Opportunity) {
  const created = new Date(o.created_at).getTime();
  const now = Date.now();
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}
// ===== FIN agingDays() =====

  // ===== INICIO dealPriority() — score estratégico =====
function dealPriority(o: Opportunity) {
  const valueScore = Math.min(o.value / 50000, 1) * 40;
  const probScore = (o.probability || 0) * 0.4;
  const agePenalty = Math.min(agingDays(o) / 30, 1) * 20;

  return Math.round(valueScore + probScore + agePenalty);
}
// ===== FIN dealPriority() =====

  // ===== INICIO criticalDeal() — oportunidad más estratégica =====
function criticalDeal() {
  if (items.length === 0) return null;

  const open = items.filter(
    (i) => i.stage !== "Closed Won" && i.stage !== "Closed Lost"
  );

  if (open.length === 0) return null;

  return open.sort(
    (a, b) => dealPriority(b) - dealPriority(a)
  )[0];
}
// ===== FIN criticalDeal() =====

// ===== INICIO suggestedProbability() — probabilidad sugerida por etapa =====
function suggestedProbability(stage: string) {
  const map: Record<string, number> = {
    Qualification: 10,
    Discovery: 20,
    Proposal: 45,
    Negotiation: 70,
    Commit: 90,
    "Closed Won": 100,
    "Closed Lost": 0,
  };

  return map[stage] ?? 10;
}
// ===== FIN suggestedProbability() =====

  // ===== INICIO stalledDeals() — oportunidades estancadas =====
function stalledDeals() {
  return items.filter((i) => {
    if (i.stage === "Closed Won" || i.stage === "Closed Lost") return false;
    return agingDays(i) > 30;
  });
}
// ===== FIN stalledDeals() =====

  // ===== INICIO pipelineAutopilot() — recomendación global del día =====
function pipelineAutopilot() {
  const deal = criticalDeal();

  if (!deal) {
    return {
      title: "Sin deal prioritario",
      message: "No hay oportunidades abiertas para priorizar en este momento.",
      urgency: "Baja",
    };
  }

  const stale = agingDays(deal) > 30;
  const suggestedProb = suggestedProbability(deal.stage);

  if (deal.probability < suggestedProb) {
    return {
      title: "Actualizar estrategia de cierre",
      message: `La oportunidad ${deal.company_name || deal.name} está por debajo de la probabilidad sugerida para su etapa. Revisa si debe avanzar o descalificarse.`,
      urgency: "Alta",
    };
  }

  if (stale) {
    return {
      title: "Reactivar deal estancado",
      message: `La oportunidad ${deal.company_name || deal.name} lleva ${agingDays(deal)} días abierta. Necesita acción inmediata.`,
      urgency: "Alta",
    };
  }

  return {
    title: "Empujar deal prioritario",
    message: `Hoy enfócate en ${deal.company_name || deal.name}. Es la oportunidad con mayor impacto estratégico del pipeline.`,
    urgency: "Media",
  };
}
// ===== FIN pipelineAutopilot() =====

  // ===== INICIO averageAging() — promedio de antigüedad del pipeline =====
function averageAging() {
  const open = items.filter(
    (i) => i.stage !== "Closed Won" && i.stage !== "Closed Lost"
  );

  if (open.length === 0) return 0;

  const total = open.reduce((sum, i) => sum + agingDays(i), 0);
  return Math.round(total / open.length);
}
// ===== FIN averageAging() =====
  
  return (
    <div style={{ padding: 24 }}>
      <h1>Pipeline de oportunidades</h1>

      <button onClick={createOpportunity}>+ Nueva oportunidad</button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginTop: 24,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: "#0b1220",
            border: "1px solid #1f2937",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Pipeline total</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            ${pipelineTotal().toLocaleString()}
          </div>
        </div>

        <div
          style={{
            background: "#0b1220",
            border: "1px solid #1f2937",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            Forecast ponderado
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            ${weightedForecast().toLocaleString()}
          </div>
        </div>

        <div
          style={{
            background: "#0b1220",
            border: "1px solid #1f2937",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            Oportunidades abiertas
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {openOpportunities().length}
          </div>
        </div>

        <div
          style={{
            background: "#0b1220",
            border: "1px solid #1f2937",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 12, color: "#94a3b8" }}>En riesgo</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#f87171" }}>
            {riskOpportunities().length}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#0b1220",
          border: "1px solid #1f2937",
          borderRadius: 14,
          padding: 18,
          marginBottom: 20,
          display: "grid",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 12, color: "#60a5fa", fontWeight: 800 }}>
          REVENUE AI DIRECTOR
        </div>

        <div style={{ fontSize: 20, fontWeight: 800 }}>
          Resumen comercial inteligente
        </div>

        <div style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
          {riskOpportunities().length > 0
            ? `Hay ${riskOpportunities().length} oportunidad(es) en riesgo dentro del pipeline. Conviene atacar primero las de mayor valor con menor probabilidad.`
            : "El pipeline no presenta oportunidades críticas en riesgo inmediato."}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "rgba(96,165,250,0.10)",
              border: "1px solid rgba(96,165,250,0.25)",
            }}
          >
            Acción sugerida: revisar oportunidades en Proposal y Negotiation.
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "rgba(74,222,128,0.10)",
              border: "1px solid rgba(74,222,128,0.25)",
            }}
          >
            Cierre esperado ponderado: ${weightedForecast().toLocaleString()}
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "rgba(250,204,21,0.10)",
              border: "1px solid rgba(250,204,21,0.25)",
            }}
          >
            Negocios ganados: {wonOpportunities().length}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${stages.length}, 1fr)`,
          gap: 12,
          marginTop: 24,
        }}
      >
        {stages.map((stage) => (
          <div
            key={stage}
            style={{
              background: "#0b1220",
              padding: 12,
              borderRadius: 12,
              minHeight: 400,
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: 8 }}>
              {stage}
              <div style={{ fontSize: 12 }}>
                ${stageTotal(stage).toLocaleString()}
              </div>
            </div>

            {items
              .filter((i) => i.stage === stage)
              .map((i) => (
                <div
                  key={i.id}
                  style={{
                    background: "#1f2937",
                    padding: 10,
                    borderRadius: 8,
                    marginBottom: 8,
                    cursor: "pointer",
                  }}
                 // ===== INICIO apertura War Room — carga valores editables =====
onClick={() => {
  setSelected(i);
  setEditValue(i.value || 0);
  setEditProbability(i.probability || 0);
  setNextAction(i.next_action || "");
  setEditStage(i.stage);
  setEditOwner(i.owner || "");
}}
// ===== FIN apertura War Room =====
                >
                  <div style={{ fontWeight: "bold" }}>
                    {i.company_name || i.name}
                  </div>

                  <div>${i.value?.toLocaleString()}</div>

                  <div style={{ fontSize: 12 }}>
                    Prob: {(i.probability || 0).toFixed(0)}%
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>

{/* ===== INICIO DEAL CRÍTICO ===== */}
{criticalDeal() && (
  <div
    style={{
      background: "#020617",
      border: "1px solid #1e293b",
      borderRadius: 14,
      padding: 18,
      marginBottom: 20,
      display: "grid",
      gap: 10,
    }}
  >
    <div style={{ fontWeight: 800, color: "#f59e0b" }}>
      DEAL CRÍTICO DEL PIPELINE
    </div>

    <div style={{ fontSize: 20, fontWeight: 800 }}>
      {criticalDeal()?.company_name || criticalDeal()?.name}
    </div>

    <div style={{ color: "#cbd5e1" }}>
      Valor: ${criticalDeal()?.value?.toLocaleString()}
    </div>

    <div style={{ color: "#cbd5e1" }}>
      Probabilidad: {criticalDeal()?.probability?.toFixed(0)}%
    </div>

    <div style={{ color: "#94a3b8", fontSize: 13 }}>
      Antigüedad: {agingDays(criticalDeal()!)} días
    </div>

    <div style={{ color: "#22c55e" }}>
      Prioridad estratégica: {dealPriority(criticalDeal()!)} / 100
    </div>
  </div>
)}
{/* ===== FIN DEAL CRÍTICO ===== */}

      {/* ===== INICIO AUTOPILOT GLOBAL DEL PIPELINE ===== */}
<div
  style={{
    background: "#020617",
    border: "1px solid #1e293b",
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    display: "grid",
    gap: 10,
  }}
>
  <div style={{ fontWeight: 800, color: "#38bdf8" }}>
    AUTOPILOT GLOBAL DEL PIPELINE
  </div>

  <div style={{ fontSize: 20, fontWeight: 800 }}>
    {pipelineAutopilot().title}
  </div>

  <div style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
    {pipelineAutopilot().message}
  </div>

  <div style={{ color: "#f59e0b", fontWeight: 700 }}>
    Urgencia: {pipelineAutopilot().urgency}
  </div>
</div>
{/* ===== FIN AUTOPILOT GLOBAL DEL PIPELINE ===== */}

      {/* ===== INICIO SALUD DEL PIPELINE ===== */}
<div
  style={{
    background: "#020617",
    border: "1px solid #1e293b",
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    display: "grid",
    gap: 10,
  }}
>
  <div style={{ fontWeight: 800, color: "#22c55e" }}>
    SALUD DEL PIPELINE
  </div>

  <div style={{ color: "#cbd5e1" }}>
    Oportunidades estancadas: {stalledDeals().length}
  </div>

  <div style={{ color: "#cbd5e1" }}>
    Antigüedad promedio abierta: {averageAging()} días
  </div>

  <div style={{ color: "#cbd5e1" }}>
    Probabilidad sugerida promedio:
    {" "}
    {items.length > 0
      ? Math.round(
          items.reduce((sum, i) => sum + suggestedProbability(i.stage), 0) /
            items.length
        )
      : 0}
    %
  </div>
</div>
{/* ===== FIN SALUD DEL PIPELINE ===== */}
      
      {/* 🧠 WAR ROOM DE OPORTUNIDAD */}
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(5,8,12,0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              width: "min(1100px, 95vw)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#0b1220",
              borderRadius: 18,
              border: "1px solid #1f2937",
              padding: 24,
              display: "grid",
              gap: 18,
            }}
          >
            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  WAR ROOM COMERCIAL
                </div>

                <div style={{ fontSize: 26, fontWeight: 800 }}>
                  {selected.name}
                </div>

                <div style={{ color: "#cbd5e1" }}>{selected.company_name}</div>
              </div>

              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "#1f2937",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 14px",
                  cursor: "pointer",
                  color: "#fff",
                }}
              >
                Cerrar
              </button>
            </div>

            {/* SNAPSHOT EJECUTIVO */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
              }}
            >
              <Metric
                label="Valor"
                value={`$${selected.value?.toLocaleString()}`}
              />
              <Metric
                label="Probabilidad"
                value={`${selected.probability?.toFixed(0)}%`}
              />
              <Metric label="Etapa" value={selected.stage} />
              <Metric
                label="Forecast"
                value={`$${(
                  selected.value * (selected.probability / 100)
                ).toLocaleString()}`}
              />
            </div>

            {/* IA DIRECTOR */}
            <div
              style={{
                background: "#0f172a",
                padding: 16,
                borderRadius: 12,
                border: "1px solid #1e293b",
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ fontWeight: 800, color: "#60a5fa" }}>
                REVENUE AI DIRECTOR
              </div>

              <div style={{ color: "#cbd5e1" }}>
                {selected.probability < 40
                  ? "Alta probabilidad de pérdida si no hay actividad inmediata."
                  : "Oportunidad viable. Mantener seguimiento cercano."}
              </div>

              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: "rgba(250,204,21,0.1)",
                  border: "1px solid rgba(250,204,21,0.25)",
                }}
              >
                Acción recomendada: agendar reunión decisoria.
              </div>
            </div>

            {/* 🧾 ACTIVIDADES */}
            <ActivityPanel opportunity={selected} />

            {/* 🤖 AUTOPILOT */}
            <Autopilot opportunity={selected} />
                  {/* ✏️ EDICIÓN DE OPORTUNIDAD */}
      <div
        style={{
          background: "#020617",
          border: "1px solid #1e293b",
          borderRadius: 12,
          padding: 16,
          display: "grid",
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 800 }}>Configuración del deal</div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>Valor estimado</label>
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(Number(e.target.value))}
            style={{
              background: "#020617",
              border: "1px solid #1e293b",
              borderRadius: 8,
              padding: 10,
              color: "#fff",
            }}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>Probabilidad (%)</label>
          <input
            type="number"
            value={editProbability}
            onChange={(e) => setEditProbability(Number(e.target.value))}
            style={{
              background: "#020617",
              border: "1px solid #1e293b",
              borderRadius: 8,
              padding: 10,
              color: "#fff",
            }}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>Próxima acción obligatoria</label>
          <input
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="Ej: Reunión con director financiero"
            style={{
              background: "#020617",
              border: "1px solid #1e293b",
              borderRadius: 8,
              padding: 10,
              color: "#fff",
            }}
          />
        </div>

{/* ===== INICIO CAMPOS AVANZADOS ENTERPRISE ===== */}

<div style={{ display: "grid", gap: 8 }}>
  <label>Etapa</label>
  <select
    value={editStage}
    onChange={(e) => setEditStage(e.target.value)}
    style={{
      background: "#020617",
      border: "1px solid #1e293b",
      borderRadius: 8,
      padding: 10,
      color: "#fff",
    }}
  >
    {stages.map((s) => (
      <option key={s} value={s}>
        {s}
      </option>
    ))}
  </select>
</div>

<div style={{ display: "grid", gap: 8 }}>
  <label>Responsable del deal</label>
  <input
    value={editOwner}
    onChange={(e) => setEditOwner(e.target.value)}
    placeholder="Ej: Juan Pérez"
    style={{
      background: "#020617",
      border: "1px solid #1e293b",
      borderRadius: 8,
      padding: 10,
      color: "#fff",
    }}
  />
</div>

{/* ===== FIN CAMPOS AVANZADOS ENTERPRISE ===== */}
        
        <button
          onClick={saveOpportunity}
          style={{
            background: "#7aa2ff",
            border: "none",
            borderRadius: 10,
            padding: "12px 16px",
            fontWeight: 800,
            cursor: "pointer",
            color: "#0a0d12",
          }}
        >
          Guardar cambios
        </button>

        {/* ===== INICIO FEEDBACK DE GUARDADO ===== */}
{saving && (
  <div style={{ color: "#60a5fa" }}>Guardando cambios…</div>
)}

{saved && (
  <div style={{ color: "#22c55e", fontWeight: 700 }}>
    ✓ Cambios guardados
  </div>
)}
{/* ===== FIN FEEDBACK DE GUARDADO ===== */}

        {/* ===== INICIO BOTÓN ARCHIVAR ===== */}
<button
  onClick={archiveOpportunity}
  style={{
    background: "#7f1d1d",
    border: "none",
    borderRadius: 10,
    padding: "12px 16px",
    fontWeight: 800,
    cursor: "pointer",
    color: "#fff",
  }}
>
  Archivar oportunidad
</button>
{/* ===== FIN BOTÓN ARCHIVAR ===== */}
        
      </div>
                  {/* 🧠 INTELIGENCIA DE CIERRE */}
      <div
        style={{
          background: "#0f172a",
          borderRadius: 12,
          padding: 16,
          border: "1px solid #1e293b",
          display: "grid",
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 800, color: "#22c55e" }}>
          CLOSING INTELLIGENCE
        </div>

        <div>
          Score de cierre:{" "}
          <strong>{closingScore(selected)}</strong> / 100
        </div>

        <div>
          Nivel de riesgo:{" "}
          <strong style={{ color: "#f87171" }}>
            {riskLevel(selected)}
          </strong>
        </div>

        <div>
  Antigüedad del deal:{" "}
  <strong>{agingDays(selected)}</strong> días
</div>

<div>
  Probabilidad sugerida por etapa:{" "}
  <strong>{suggestedProbability(selected.stage)}%</strong>
</div>

<div>
  Prioridad estratégica:{" "}
  <strong>{dealPriority(selected)}</strong> / 100
</div>
        
        {nextAction && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "rgba(96,165,250,0.1)",
              border: "1px solid rgba(96,165,250,0.25)",
            }}
          >
            Próxima acción: {nextAction}
          </div>
        )}
      </div>
          </div>
        </div>
      )}
    </div>
  );
}
