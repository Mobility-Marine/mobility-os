"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Opportunity = {
  id: string;
  name: string;
  company_name: string;
  stage: string;
  value: number;
  probability: number;
  created_at: string;
};

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

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const { data } = await supabase
      .from("opportunities")
      .select("*")
      .order("created_at", { ascending: false });

    setItems(data || []);
    setLoading(false);
  }

  async function createOpportunity() {
    const name = prompt("Nombre de la oportunidad");
    if (!name) return;

    const company = prompt("Empresa");
    const value = Number(prompt("Valor estimado (USD)") || 0);

    await supabase.from("opportunities").insert({
      name,
      company_name: company,
      value,
      stage: "Qualification",
      probability: 0.1,
    });

    load();
  }

  async function move(id: string, newStage: string) {
    await supabase
      .from("opportunities")
      .update({ stage: newStage })
      .eq("id", id);

    load();
  }

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

  function ActivityPanel({ opportunity }: { opportunity: Opportunity }) {
    const [activities, setActivities] = useState<any[]>([]);
    const [text, setText] = useState("");

    useEffect(() => {
      void loadActivities();
    }, [opportunity.id]);

    async function loadActivities() {
      const { data } = await supabase
        .from("opportunity_activities")
        .select("*")
        .eq("opportunity_id", opportunity.id)
        .order("created_at", { ascending: false });

      setActivities(data || []);
    }

    async function addActivity() {
      if (!text.trim()) return;

      await supabase.from("opportunity_activities").insert({
        opportunity_id: opportunity.id,
        description: text,
        type: "task",
      });

      setText("");
      loadActivities();
    }

    async function toggle(id: string, completed: boolean) {
      await supabase
        .from("opportunity_activities")
        .update({ completed: !completed })
        .eq("id", id);

      loadActivities();
    }

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
                  onClick={() => setSelected(i)}
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
          </div>
        </div>
      )}
    </div>
  );
}
