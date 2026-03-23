"use client";

import type { Prospect } from "../types/prospects.types";

type Props = {
  prospects: Prospect[];
  onSelect: (p: Prospect) => void;
};

export default function ProspectDailyActionPanel({
  prospects,
  onSelect,
}: Props) {
  const now = new Date();

  // ===============================
  // SEGUIMIENTOS VENCIDOS
  // ===============================

  const overdue = prospects.filter((p) => {
    if (!p.next_follow_up) return false;
    return new Date(p.next_follow_up) < now && p.is_active;
  });

  // ===============================
  // SIN CONTACTO
  // ===============================

  const noContact = prospects.filter(
    (p) => !p.email && !p.phone && p.is_active
  );

  // ===============================
  // ALTO VALOR SIN AVANCE
  // ===============================

  const highValue = prospects.filter(
    (p) =>
      (p.estimated_value || 0) >= 100000 &&
      (p.stage === "new" || p.status === "new")
  );

  // ===============================
  // LISTOS PARA CONVERTIR
  // ===============================

  const readyToConvert = prospects.filter(
    (p) => p.stage === "negotiation" || p.status === "negotiation"
  );

  // ===============================
  // UI
  // ===============================

  return (
    <div style={container}>
      <div style={title}>Acciones prioritarias hoy</div>

      <ActionList
        label="Seguimientos vencidos"
        color="#ef4444"
        items={overdue}
        onSelect={onSelect}
      />

      <ActionList
        label="Sin datos de contacto"
        color="#f59e0b"
        items={noContact}
        onSelect={onSelect}
      />

      <ActionList
        label="Alto valor sin avance"
        color="#a78bfa"
        items={highValue}
        onSelect={onSelect}
      />

      <ActionList
        label="Listos para convertir"
        color="#22c55e"
        items={readyToConvert}
        onSelect={onSelect}
      />
    </div>
  );
}

function ActionList({
  label,
  items,
  color,
  onSelect,
}: {
  label: string;
  items: Prospect[];
  color: string;
  onSelect: (p: Prospect) => void;
}) {
  if (!items.length) return null;

  return (
    <div style={box}>
      <div style={{ ...boxTitle, color }}>
        {label} · {items.length}
      </div>

      <div style={list}>
        {items.slice(0, 5).map((p) => (
          <div
            key={p.id}
            style={item}
            onClick={() => onSelect(p)}
          >
            {p.company_name || p.name || "Sin nombre"}
          </div>
        ))}
      </div>
    </div>
  );
}

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

const box: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: 10,
  padding: 12,
};

const boxTitle: React.CSSProperties = {
  fontWeight: 700,
  marginBottom: 8,
};

const list: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const item: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 6,
  cursor: "pointer",
  background: "#111827",
};
