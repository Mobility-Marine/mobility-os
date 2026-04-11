"use client";

import { useState } from "react";
import { useLayout, WidgetSize } from "../hooks/useLayout";
import { DashboardMetrics } from "../hooks/useDashboard";
import WidgetShell from "./WidgetShell";
import CommandStrip from "./CommandStrip";
import HeroPanel from "./HeroPanel";
import AIPanel from "./AIPanel";
import ActivityFeed from "./ActivityFeed";
import AlertsPanel from "./AlertsPanel";
import QuickActions from "./QuickActions";
import DomainCards from "./DomainCards";
import RevenueGoalBar from "./RevenueGoalBar";
import HealthScore from "./HealthScore";
import PipelineFunnel from "./PipelineFunnel";
import UpcomingEvents from "./UpcomingEvents";
import TeamActivity from "./TeamActivity";

interface DashboardGridProps {
  metrics: DashboardMetrics;
  companyState?: any;
}

function renderWidget(id: string, metrics: DashboardMetrics, companyState: any) {
  switch (id) {
    case "command_strip":   return <CommandStrip metrics={metrics} />;
    case "revenue_goal":    return <RevenueGoalBar />;
    case "hero_panel":      return <HeroPanel metrics={metrics} />;
    case "ai_panel":        return <AIPanel companyState={companyState} />;
    case "health_score":    return <HealthScore metrics={metrics} />;
    case "pipeline_funnel": return <PipelineFunnel metrics={metrics} />;
    case "upcoming_events": return <UpcomingEvents />;
    case "activity_feed":   return <ActivityFeed />;
    case "alerts_panel":    return <AlertsPanel metrics={metrics} />;
    case "quick_actions":   return <QuickActions />;
    case "team_activity":   return <TeamActivity />;
    case "domain_cards":    return <DomainCards metrics={metrics} />;
    default:                return null;
  }
}

export default function DashboardGrid({ metrics, companyState }: DashboardGridProps) {
  const { layout, loaded, reorder, resizeWidget, toggleWidget, resetLayout } = useLayout();
  const [editMode, setEditMode] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overTargetId, setOverTargetId] = useState<string>("");

  if (!loaded) return null;

  const visible = layout.filter((w) => w.visible);
  const hidden  = layout.filter((w) => !w.visible);

  function handleDrop(toId: string) {
    if (draggingId && draggingId !== toId) {
      reorder(draggingId, toId);
    }
    setDraggingId(null);
    setOverTargetId("");
  }

  return (
    <div>
      {/* TOOLBAR */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "8px",
        marginBottom: "16px",
      }}>
        {editMode && hidden.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flex: 1, flexWrap: "wrap" }}>
            {hidden.map((w) => (
              <button
                key={w.id}
                onClick={() => toggleWidget(w.id)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "var(--radius-full)",
                  border: "1px dashed var(--color-border)",
                  background: "transparent",
                  color: "var(--color-text-muted)",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                + {w.id.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        )}

        {editMode && (
          <button
            onClick={resetLayout}
            style={{
              height: "34px",
              padding: "0 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-subtle)",
              color: "var(--color-text-muted)",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Restablecer
          </button>
        )}

        <button
          onClick={() => setEditMode((v) => !v)}
          style={{
            height: "34px",
            padding: "0 16px",
            borderRadius: "var(--radius-md)",
            border: editMode
              ? "1px solid var(--color-brand-blue)"
              : "1px solid var(--color-border)",
            background: editMode
              ? "var(--color-brand-blue-light)"
              : "var(--color-bg-subtle)",
            color: editMode
              ? "var(--color-brand-blue)"
              : "var(--color-text-second)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          {editMode ? "Listo" : "Editar"}
        </button>
      </div>

      {/* GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: "16px",
        alignItems: "start",
      }}>
        {visible.map((widget) => (
          <WidgetShell
            key={widget.id}
            id={widget.id}
            size={widget.size}
            editMode={editMode}
            isDraggingOver={overTargetId === widget.id && draggingId !== widget.id}
            onDragStart={(id) => setDraggingId(id)}
            onDragOver={(id) => setOverTargetId(id)}
            onDrop={handleDrop}
            onResize={(id, size) => resizeWidget(id, size as WidgetSize)}
            onHide={(id) => toggleWidget(id)}
          >
            {renderWidget(widget.id, metrics, companyState)}
          </WidgetShell>
        ))}
      </div>
    </div>
  );
}
