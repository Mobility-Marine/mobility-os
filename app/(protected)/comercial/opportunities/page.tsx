"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useOpportunitiesController } from "./services/opportunities.controller";
import { filterOpportunities } from "./services/opportunities.normalization";
import type { Opportunity, OpportunityFilters } from "./types/opportunities.types";
import { DEFAULT_OPP_FILTERS } from "./types/opportunities.types";

import OpportunityCommandCenter  from "./components/OpportunityCommandCenter";
import OpportunityRevenueInsights from "./components/OpportunityRevenueInsights";
import OpportunityAIPanel        from "./components/OpportunityAIPanel";
import OpportunitySidebar        from "./components/OpportunitySidebar";
import OpportunityWorkspace      from "./components/OpportunityWorkspace";
import OpportunityCopilot        from "./components/OpportunityCopilot";
import OpportunityPipelineBoard  from "./components/OpportunityPipelineBoard";
import OpportunityCreateDrawer   from "./components/OpportunityCreateDrawer";

export default function OpportunitiesPage() {
  const { t } = useTranslation();
  const ctrl  = useOpportunitiesController();
  const {
    loading, opportunities, selected, setSelected,
    activities, actLoading,
    createOpportunity, updateOpportunity, updateStage,
    archiveOpportunity, addActivity, toggleActivity,
  } = ctrl;

  const [filters, setFilters]         = useState<OpportunityFilters>(DEFAULT_OPP_FILTERS);
  const [showCreateDrawer, setCreate] = useState(false);

  const filtered = useMemo(
    () => filterOpportunities(opportunities, {
      search:   filters.search,
      stage:    filters.stage === "all" ? undefined : filters.stage,
      onlyOpen: filters.onlyOpen,
    }),
    [opportunities, filters]
  );

  if (loading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "20px 32px",
        fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)",
      }}>
        {(t.opportunities as any)?.loading ?? "Cargando pipeline…"}
      </div>
    </div>
  );

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gridTemplateRows: "auto 400px 560px 380px",
      gap: "16px",
      paddingBottom: "32px",
    }}>
      {/* STRIP — Command Center */}
      <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "16px" }}>
        <OpportunityCommandCenter opportunities={opportunities} onSelect={setSelected} />
      </div>

      {/* ROW 2 — Insights + AI */}
      <div style={{ gridColumn: "1 / 3", minHeight: 0, overflow: "hidden" }}>
        <OpportunityRevenueInsights opportunities={opportunities} />
      </div>
      <div style={{ gridColumn: "3 / 5", minHeight: 0, overflow: "hidden" }}>
        <OpportunityAIPanel opportunities={opportunities} onSelect={setSelected} />
      </div>

      {/* ROW 3 — Sidebar + Workspace + Copilot */}
      <div style={{ gridColumn: "1 / 2", minHeight: 0, overflow: "hidden" }}>
        <OpportunitySidebar
          search={filters.search}
          setSearch={(v) => setFilters((f) => ({ ...f, search: v }))}
          opportunities={filtered}
          selected={selected}
          setSelected={setSelected}
          onOpenCreate={() => setCreate(true)}
        />
      </div>
      <div style={{ gridColumn: "2 / 4", minHeight: 0, overflow: "hidden" }}>
        <OpportunityWorkspace
          opportunity={selected}
          activities={activities}
          actLoading={actLoading}
          onUpdate={updateOpportunity}
          onStageChange={(id, stage) => updateStage(id, stage as any)}
          onArchive={archiveOpportunity}
          onAddActivity={addActivity}
          onToggleActivity={toggleActivity}
        />
      </div>
      <div style={{ gridColumn: "4 / 5", minHeight: 0, overflow: "hidden" }}>
        <OpportunityCopilot opportunity={selected} />
      </div>

      {/* ROW 4 — Pipeline Board */}
      <div style={{ gridColumn: "1 / -1", minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px", flexShrink: 0 }}>
          {(t.opportunities as any)?.pipelineTitle ?? "Pipeline de oportunidades"}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <OpportunityPipelineBoard
            opportunities={opportunities}
            onSelect={setSelected}
            onStageChange={(id, stage) => updateStage(id, stage as any)}
          />
        </div>
      </div>

      {/* DRAWER */}
      <OpportunityCreateDrawer
        open={showCreateDrawer}
        onClose={() => setCreate(false)}
        onCreate={createOpportunity}
      />
    </div>
  );
}
