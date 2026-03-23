"use client";

// ============================================================
// 🕒 PROSPECT ACTIVITY TIMELINE — Enterprise Audit Ready
// Seguimiento operativo universal
// Compatible con cualquier industria
// ============================================================

type Activity = {
  id: string;
  type: "call" | "email" | "meeting" | "note" | "task";
  description: string;
  created_at: string;
  user?: string;
};

type Props = {
  activities?: Activity[];
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
            <div style={icon}>{getIcon(a.type)}</div>

            <div style={{ flex: 1 }}>
              <div style={desc}>{a.description}</div>

              <div style={meta}>
                {a.user || "Sistema"} ·{" "}
                {new Date(a.created_at).toLocaleString("es-MX")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getIcon(type: Activity["type"]) {
  switch (type) {
    case "call":
      return "📞";
    case "email":
      return "✉️";
    case "meeting":
      return "📅";
    case "task":
      return "✔";
    default:
      return "📝";
  }
}

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
