"use client";

// ============================================================
// 🕒 PROSPECT ACTIVITY TIMELINE — Enterprise Audit Ready
// Seguimiento operativo universal (Prospectos)
// ============================================================

import type { ProspectActivity } from "../types/prospects.types";

type Props = {
  activities?: ProspectActivity[];
};

export default function ProspectActivityTimeline({
  activities = [],
}: Props) {
  if (!activities.length) {
    return <div style={emptyBox}>Sin actividad registrada.</div>;
  }

  return (
    <div style={container}>
      <div style={title}>Actividad</div>

      <div style={list}>
        {activities.map((a) => (
          <div key={a.id} style={item}>
            <div style={icon}>{getIcon(a.activity_type)}</div>

            <div style={{ flex: 1 }}>
              <div style={desc}>
                {a.comments || "Actividad registrada"}
              </div>

              <div style={meta}>
                Sistema ·{" "}
                {a.activity_date
                  ? new Date(a.activity_date).toLocaleString("es-MX")
                  : "Sin fecha"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ICONOS SEGÚN ACTIVIDAD
// ============================================================

function getIcon(type: string | null) {
  const t = (type || "").toLowerCase();

  if (t.includes("call")) return "📞";
  if (t.includes("email")) return "✉️";
  if (t.includes("meeting")) return "📅";
  if (t.includes("task")) return "✔";

  return "📝";
}

// ============================================================
// ESTILOS
// ============================================================

const container: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #1f2937",
  borderRadius: 12,
  padding: 16,
};

const title: React.CSSProperties = {
  fontWeight: 800,
  marginBottom: 12,
};

const list: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const item: React.CSSProperties = {
  display: "flex",
  gap: 12,
  padding: 12,
  borderRadius: 10,
  background: "#0b1220",
  border: "1px solid #1f2937",
};

const icon: React.CSSProperties = {
  fontSize: 18,
};

const desc: React.CSSProperties = {
  fontWeight: 600,
};

const meta: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
};

const emptyBox: React.CSSProperties = {
  padding: 20,
  borderRadius: 10,
  border: "1px dashed #334155",
  color: "#94a3b8",
  textAlign: "center",
};
