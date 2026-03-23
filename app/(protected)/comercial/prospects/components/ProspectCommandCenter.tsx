"use client";

import type { Prospect } from "../types/prospects.types";

type Props = {
  prospects: Prospect[];
  onSelect: (p: Prospect) => void;
};

export default function ProspectCommandCenter({
  prospects,
  onSelect,
}: Props) {
  const now = new Date();

  // ==========================================================
  // 🔥 HOT — alto valor + activos + no perdidos
  // ==========================================================

  const hot = prospects
    .filter(
      (p) =>
        (p.estimated_value || 0) >= 50000 &&
        p.is_active &&
        p.stage !== "lost"
    )
    .sort(
      (a, b) =>
        (b.estimated_value || 0) - (a.estimated_value || 0)
    );

  // ==========================================================
  // ⏰ OVERDUE — seguimiento vencido
  // ==========================================================

  const overdue = prospects
    .filter((p) => {
      if (!p.next_follow_up) return false;
      return new Date(p.next_follow_up) < now;
    })
    .sort(
      (a, b) =>
        new Date(a.next_follow_up || "").getTime() -
        new Date(b.next_follow_up || "").getTime()
    );

  // ==========================================================
  // 💤 INACTIVE — sin seguimiento en 30 días
  // ==========================================================

  const inactive = prospects.filter((p) => {
    const refDate =
      p.next_follow_up || p.created_at;

    if (!refDate) return false;

    const days =
      (Date.now() - new Date(refDate).getTime()) /
      (1000 * 60 * 60 * 24);

    return days > 30 && p.stage !== "lost";
  });

  // ==========================================================
  // 🎯 CONVERTIBLE — etapas finales
  // ==========================================================

  const convertible = prospects
    .filter((p) =>
      ["qualified", "proposal", "negotiation"].includes(
        (p.stage || p.status || "").toLowerCase()
      )
    )
    .sort(
      (a, b) =>
        (b.estimated_value || 0) - (a.estimated_value || 0)
    );

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div style={container}>
      <Card
        title="🔥 Calientes"
        value={hot.length}
        hint="Alto valor y activos"
        onClick={() => hot[0] && onSelect(hot[0])}
      />

      <Card
        title="⏰ Vencidos"
        value={overdue.length}
        hint="Seguimientos atrasados"
        onClick={() => overdue[0] && onSelect(overdue[0])}
      />

      <Card
        title="💤 Sin actividad"
        value={inactive.length}
        hint="Riesgo de abandono"
        onClick={() => inactive[0] && onSelect(inactive[0])}
      />

      <Card
        title="🎯 Convertibles"
        value={convertible.length}
        hint="Listos para avanzar"
        onClick={() =>
          convertible[0] && onSelect(convertible[0])
        }
      />
    </div>
  );
}

// ============================================================
// CARD — ENTERPRISE UI
// ============================================================

function Card({
  title,
  value,
  hint,
  onClick,
}: {
  title: string;
  value: number;
  hint: string;
  onClick: () => void;
}) {
  return (
    <div style={card} onClick={onClick}>
      <div style={cardHeader}>
        <div style={cardTitle}>{title}</div>
        <div style={badge}>{value}</div>
      </div>

      <div style={cardHint}>{hint}</div>
    </div>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const container: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 14,
};

const card: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #1f2937",
  borderRadius: 14,
  padding: 16,
  cursor: "pointer",
  transition: "all .15s ease",
};

const cardHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const cardTitle: React.CSSProperties = {
  fontSize: 13,
  color: "#cbd5f5",
  fontWeight: 600,
};

const badge: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: "#fff",
};

const cardHint: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  marginTop: 8,
};
