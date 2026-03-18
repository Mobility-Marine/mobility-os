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

  if (loading) return <div>Cargando pipeline…</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Pipeline de oportunidades</h1>

      <button onClick={createOpportunity}>
        + Nueva oportunidad
      </button>

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
                  onClick={() => {
                    const next =
                      stages[stages.indexOf(stage) + 1];
                    if (next) move(i.id, next);
                  }}
                >
                  <div style={{ fontWeight: "bold" }}>
                    {i.company_name || i.name}
                  </div>

                  <div>${i.value?.toLocaleString()}</div>

                  <div style={{ fontSize: 12 }}>
                    Prob: {(i.probability * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
