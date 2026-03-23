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
  // ==========================================================
  // CÁLCULOS INTELIGENTES
  // ==========================================================

  const hot = prospects.filter(
    (p) => (p.estimated_value || 0) >= 50000 && p.is_active
  );

  const overdue = prospects.filter((p) => {
    if (!p.next_follow_up) return false;
    return new Date(p.next_follow_up) < new Date();
  });

  const inactive = prospects.filter((p) => {
    if (!p.created_at) return false;
    const days =
      (Date.now() - new Date(p.created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    return days > 30;
  });

  const convertible = prospects.filter(
    (p) => p.stage === "qualified" || p.status === "qualified"
  );

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div style={container}>
      <Card
        title="🔥 Calientes"
        value={hot.length}
        onClick={() => hot[0] && onSelect(hot[0])}
      />

      <Card
        title="⏰ Vencidos"
        value={overdue.length}
        onClick={() => overdue[0] && onSelect(overdue[0])}
      />

      <Card
        title="💤 Sin actividad"
        value={inactive.length}
        onClick={() => inactive[0] && onSelect(inactive[0])}
      />

      <Card
        title="🎯 Convertibles"
        value={convertible.length}
        onClick={() =>
          convertible[0] && onSelect(convertible[0])
        }
      />
    </div>
  );
}

// ============================================================
// SUBCOMPONENTE
// ============================================================

function Card({
  title,
  value,
  onClick,
}: {
  title: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <div style={card} onClick={onClick}>
      <div style={cardTitle}>{title}</div>
      <div style={cardValue}>{value}</div>
    </div>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const container: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 12,
};

const card: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #1f2937",
  borderRadius: 12,
  padding: 16,
  cursor: "pointer",
};

const cardTitle: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
};

const cardValue: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  marginTop: 4,
};
