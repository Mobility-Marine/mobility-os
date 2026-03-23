"use client";

import type { Prospect } from "../types/prospects.types";
import { buildProspectAutomationAlerts } from "../services/prospects.automation";

type Props = {
  prospects: Prospect[];
  onSelect: (p: Prospect) => void;
};

export default function ProspectAutomationPanel({
  prospects,
  onSelect,
}: Props) {
  const alerts = buildProspectAutomationAlerts(prospects);

  return (
    <div style={container}>
      <div style={title}>Automatización comercial</div>

      {alerts.length === 0 ? (
        <div style={empty}>
          No hay alertas automáticas activas.
        </div>
      ) : (
        <div style={list}>
          {alerts.slice(0, 8).map((alert) => {
            const prospect = prospects.find((p) => p.id === alert.prospectId);
            if (!prospect) return null;

            return (
              <div
                key={alert.id}
                style={item}
                onClick={() => onSelect(prospect)}
              >
                <div style={itemHeader}>
                  <span style={severity(alert.severity)}>
                    {alert.severity}
                  </span>
                  <span style={itemTitle}>{alert.title}</span>
                </div>

                <div style={itemDesc}>{alert.description}</div>
              </div>
            );
          })}
        </div>
      )}
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

const empty: React.CSSProperties = {
  color: "#94a3b8",
};

const list: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const item: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: 10,
  padding: 12,
  cursor: "pointer",
};

const itemHeader: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  marginBottom: 6,
};

const itemTitle: React.CSSProperties = {
  fontWeight: 700,
};

const itemDesc: React.CSSProperties = {
  fontSize: 13,
  color: "#cbd5e1",
};

function severity(level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"): React.CSSProperties {
  const map = {
    LOW: { color: "#93c5fd" },
    MEDIUM: { color: "#facc15" },
    HIGH: { color: "#fb923c" },
    CRITICAL: { color: "#f87171" },
  };

  return {
    fontSize: 11,
    fontWeight: 800,
    ...map[level],
  };
}
