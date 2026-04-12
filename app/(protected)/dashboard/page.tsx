"use client";

import { useDashboard } from "./hooks/useDashboard";
import { useTranslation } from "@/lib/i18n/useTranslation";
import DashboardGrid from "./components/DashboardGrid";

function LoadingState() {
  const { t } = useTranslation();
  return (
    <div style={{
      padding: "60px 40px",
      display: "grid",
      placeItems: "center",
      gap: "8px",
    }}>
      <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)" }}>
        {t.dashboard.commandCenter}…
      </div>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
        {t.general.loading}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { metrics, loading, companyState } = useDashboard();
  if (loading) return <LoadingState />;
  return <DashboardGrid metrics={metrics} companyState={companyState} />;
}
