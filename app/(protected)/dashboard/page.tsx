"use client";

import { useDashboard } from "./hooks/useDashboard";
import CommandStrip from "./components/CommandStrip";
import HeroPanel from "./components/HeroPanel";
import AIPanel from "./components/AIPanel";
import ActivityFeed from "./components/ActivityFeed";
import AlertsPanel from "./components/AlertsPanel";
import QuickActions from "./components/QuickActions";
import DomainCards from "./components/DomainCards";

function LoadingState() {
  return (
    <div style={{
      padding: "60px 40px",
      display: "grid",
      gap: "8px",
      placeItems: "center",
    }}>
      <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)" }}>
        Cargando Command Center…
      </div>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
        Inicializando contexto operativo
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { metrics, loading, companyState } = useDashboard();

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <CommandStrip metrics={metrics} />

      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 360px",
        gap: "20px",
        alignItems: "start",
      }}>
        <HeroPanel metrics={metrics} />
        <AIPanel companyState={companyState} />
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: "20px",
        alignItems: "start",
      }}>
        <ActivityFeed />
        <AlertsPanel metrics={metrics} />
        <QuickActions />
      </div>

      <DomainCards metrics={metrics} />
    </div>
  );
}
