"use client";

// ============================================================
// 🤖 PROSPECT COPILOT — SaaS AI Panel
// Inteligencia comercial contextual
// Layout estable + scroll interno
// ============================================================

import type { Prospect } from "../types/prospects.types";
import ProspectHealthPanel from "../services/ProspectHealthPanel";

type Props = {
  prospect: Prospect | null;
};

export default function ProspectCopilot({ prospect }: Props) {
  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (!prospect) {
    return (
      <div style={shell}>
        <div style={container}>
          <div style={title}>Copilot Prospecting</div>

          <div style={empty}>
            Selecciona un prospecto para ver recomendaciones
            inteligentes.
          </div>
        </div>

        <ProspectHealthPanel prospect={null} />
      </div>
    );
  }

  // ==========================================================
  // AI LOGIC
  // ==========================================================

  const hasContact = !!(prospect.email || prospect.phone);
  const hasValue = !!prospect.estimated_value;

  const recommendation = hasValue
    ? "Avanzar a propuesta comercial"
    : "Calificar prospecto y levantar necesidad";

  const nextStep = hasContact
    ? "Programar seguimiento"
    : "Conseguir datos de contacto";

  const risk =
    !hasContact
      ? "Alto — Sin datos de contacto"
      : !hasValue
      ? "Medio — Sin valor estimado"
      : "Bajo";

  const priority =
    (prospect.estimated_value || 0) >= 100000
      ? "CRÍTICA"
      : (prospect.estimated_value || 0) >= 50000
      ? "ALTA"
      : "MEDIA";

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div style={shell}>
      <div style={container}>
        <div style={title}>Copilot Prospecting</div>

        <Card label="Recomendación" value={recommendation} />
        <Card label="Siguiente paso" value={nextStep} />
        <Card label="Prioridad" value={priority} />
        <Card label="Riesgo comercial" value={risk} />

        <div style={contextBox}>
          <div style={contextTitle}>Contexto</div>

          <div style={contextText}>
            Servicio:{" "}
            {prospect.interested_service || "No especificado"}
          </div>

          <div style={contextText}>
            Origen: {prospect.lead_source || "Manual"}
          </div>

          <div style={contextText}>
            Estatus: {prospect.stage || prospect.status || "new"}
          </div>
        </div>
      </div>

      <ProspectHealthPanel
        prospect={prospect}
        activities={prospect.activities || []}
        tasks={prospect.tasks || []}
        followups={prospect.followups || []}
      />
    </div>
  );
}

// ============================================================
// COMPONENTES UI
// ============================================================

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div style={card}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  );
}

// ============================================================
// STYLES — SaaS Layout Safe
// ============================================================

// 🔥 Contenedor externo compatible con Page
const shell: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,

  height: "100%",
  minHeight: 0,

  overflow: "hidden",
};

// 🔥 Panel principal con scroll interno
const container: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #1f2937",
  borderRadius: 14,
  padding: 16,

  display: "flex",
  flexDirection: "column",
  gap: 12,

  flex: "1 1 auto",
  minHeight: 0,

  overflowY: "auto",
};

const title: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 14,
  letterSpacing: 0.4,
  textTransform: "uppercase",
  color: "#e5e7eb",
};

const empty: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 13,
};

const card: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: 10,
  padding: 12,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const valueStyle: React.CSSProperties = {
  fontWeight: 700,
  marginTop: 4,
};

const contextBox: React.CSSProperties = {
  background: "rgba(96,165,250,0.10)",
  border: "1px solid rgba(96,165,250,0.25)",
  borderRadius: 10,
  padding: 12,
};

const contextTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "#60a5fa",
  marginBottom: 6,
  textTransform: "uppercase",
};

const contextText: React.CSSProperties = {
  color: "#dbeafe",
  fontSize: 13,
};
