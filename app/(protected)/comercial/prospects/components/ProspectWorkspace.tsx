"use client";

// ============================================================
// 👤 PROSPECT WORKSPACE — Enterprise Final
// Panel central del módulo Prospectos
// Compatible con Customer 360 + Auditoría
// ============================================================

import type { Prospect } from "../types/prospects.types";

type Props = {
  prospect: Prospect | null;

  createProspect: (payload: any) => Promise<any>;
  updateProspect: (id: string, payload: any) => Promise<any>;
  archiveProspect: (id: string) => Promise<any>;
};

export default function ProspectWorkspace({
  prospect,
  updateProspect,
  archiveProspect,
}: Props) {
  // ==========================================================
  // SIN SELECCIÓN
  // ==========================================================

  if (!prospect) {
    return (
      <div
        style={{
          background: "#020617",
          border: "1px solid #1f2937",
          borderRadius: 12,
          padding: 20,
          color: "#94a3b8",
        }}
      >
        Selecciona un prospecto para ver su detalle.
      </div>
    );
  }

  // ==========================================================
  // WORKSPACE
  // ==========================================================

  return (
    <div
      style={{
        background: "#020617",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 20,
        display: "grid",
        gap: 16,
      }}
    >
      {/* HEADER */}
      <div>
        <div style={{ fontSize: 24, fontWeight: 800 }}>
          {prospect.company_name || prospect.name || "Sin nombre"}
        </div>

        <div style={{ color: "#94a3b8", marginTop: 6 }}>
          {prospect.email || "Sin email"} ·{" "}
          {prospect.phone || "Sin teléfono"}
        </div>
      </div>

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0,1fr))",
          gap: 12,
        }}
      >
        <InfoCard
          label="Etapa"
          value={prospect.stage || prospect.status || "new"}
        />

        <InfoCard
          label="Origen"
          value={
            prospect.lead_source ||
            prospect.sourceNormalized ||
            "manual"
          }
        />

        <InfoCard
          label="Valor estimado"
          value={
            prospect.estimated_value
              ? `$${Number(
                  prospect.estimated_value
                ).toLocaleString("es-MX")}`
              : "Sin estimación"
          }
        />
      </div>

      {/* NOTAS */}
      <div
        style={{
          background: "#0b1220",
          border: "1px solid #1f2937",
          borderRadius: 10,
          padding: 14,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          Notas
        </div>

        <div style={{ color: "#cbd5e1" }}>
          {prospect.notes || "Sin notas registradas."}
        </div>
      </div>

      {/* ACCIONES ENTERPRISE */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 6,
        }}
      >
        <button
          style={primaryButton}
          onClick={() =>
            updateProspect(prospect.id, {
              status: "qualified",
            })
          }
        >
          Marcar como calificado
        </button>

        <button
          style={dangerButton}
          onClick={() => archiveProspect(prospect.id)}
        >
          Marcar como perdido
        </button>
      </div>
    </div>
  );
}

// ============================================================
// UI HELPERS
// ============================================================

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#0b1220",
        border: "1px solid #1f2937",
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, color: "#94a3b8" }}>
        {label}
      </div>

      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const primaryButton: React.CSSProperties = {
  background: "#3b82f6",
  border: "none",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
};

const dangerButton: React.CSSProperties = {
  background: "#ef4444",
  border: "none",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
};
