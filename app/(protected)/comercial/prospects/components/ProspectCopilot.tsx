"use client";

// ============================================================
// 🤖 PROSPECT COPILOT — Enterprise AI Panel
// Inteligencia comercial previa a CRM
// Compatible con Auditoría + Customer 360
// ============================================================

import type { Prospect } from "../types/prospects.types";

type Props = {
  prospect: Prospect | null;
};

export default function ProspectCopilot({ prospect }: Props) {
  // ==========================================================
  // SIN SELECCIÓN
  // ==========================================================

  if (!prospect) {
    return (
      <div style={container}>
        <div style={title}>COPILOT PROSPECTING</div>

        <div style={empty}>
          Selecciona un prospecto para ver recomendaciones.
        </div>
      </div>
    );
  }

  // ==========================================================
  // LÓGICA DE IA COMERCIAL
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
      ? "Alto — No hay información de contacto"
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
    <div style={container}>
      <div style={title}>COPILOT PROSPECTING</div>

      {/* RECOMENDACIÓN */}
      <Card label="Recomendación" value={recommendation} />

      {/* SIGUIENTE PASO */}
      <Card label="Siguiente paso" value={nextStep} />

      {/* PRIORIDAD */}
      <Card label="Prioridad" value={priority} />

      {/* RIESGO */}
      <Card label="Riesgo comercial" value={risk} />

      {/* CONTEXTO */}
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
// ESTILOS
// ============================================================

const container: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #1f2937",
  borderRadius: 12,
  padding: 16,
  display: "grid",
  gap: 12,
};

const title: React.CSSProperties = {
  fontWeight: 800,
};

const empty: React.CSSProperties = {
  color: "#94a3b8",
};

const card: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: 10,
  padding: 12,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
};

const valueStyle: React.CSSProperties = {
  fontWeight: 700,
  marginTop: 6,
};

const contextBox: React.CSSProperties = {
  background: "rgba(96,165,250,0.10)",
  border: "1px solid rgba(96,165,250,0.25)",
  borderRadius: 10,
  padding: 12,
};

const contextTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#60a5fa",
  marginBottom: 6,
};

const contextText: React.CSSProperties = {
  color: "#dbeafe",
  fontSize: 13,
};
