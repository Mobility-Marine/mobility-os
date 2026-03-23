"use client";

import type { Prospect } from "../types/prospects.types";

type Props = {
  prospects: Prospect[];
  onSelect: (p: Prospect) => void;
};

const stages = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "converted",
  "lost",
];

export default function ProspectPipelineBoard({
  prospects,
  onSelect,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${stages.length}, 260px)`,
        gap: 12,
        overflowX: "auto",
        paddingBottom: 4,
      }}
    >
      {stages.map((stage) => {
        const items = prospects.filter(
          (p) => (p.stage || p.status) === stage
        );

        return (
          <div key={stage} style={column}>
            <div style={columnTitle}>
              <span>{stage.toUpperCase()}</span>
              <span style={count}>{items.length}</span>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {items.map((p) => (
                <div
                  key={p.id}
                  style={card}
                  onClick={() => onSelect(p)}
                >
                  <div style={{ fontWeight: 700 }}>
                    {p.company_name || p.name || "Sin nombre"}
                  </div>

                  {p.estimated_value ? (
                    <div style={{ fontSize: 12, color: "#86efac" }}>
                      ${Number(p.estimated_value).toLocaleString("es-MX")}
                    </div>
                  ) : null}

                  {p.email && (
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      {p.email}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const column: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #1f2937",
  borderRadius: 12,
  padding: 10,
  minHeight: 420,
};

const columnTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 10,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const count: React.CSSProperties = {
  background: "#111827",
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
};

const card: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: 8,
  padding: 10,
  cursor: "pointer",
  display: "grid",
  gap: 4,
};
