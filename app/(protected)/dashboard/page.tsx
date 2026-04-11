"use client";

import { useDashboard } from "./hooks/useDashboard";
import DashboardGrid from "./components/DashboardGrid";

function LoadingState() {
  return (
    <div style={{
      padding: "60px 40px",
      display: "grid",
      placeItems: "center",
      gap: "8px",
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
    <DashboardGrid
      metrics={metrics}
      companyState={companyState}
    />
  );
}
