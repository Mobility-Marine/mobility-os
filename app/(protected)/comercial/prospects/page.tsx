"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useProspectsController } from "./services/prospects.controller";
import { filterProspects } from "./services/prospects.normalization";
import type { Prospect, ProspectFilters } from "./types/prospects.types";
import { DEFAULT_FILTERS } from "./types/prospects.types";

import ProspectsSidebar         from "./components/ProspectsSidebar";
import ProspectWorkspace        from "./components/ProspectWorkspace";
import ProspectCopilot          from "./components/ProspectCopilot";
import ProspectPipelineBoard    from "./components/ProspectPipelineBoard";
import ProspectCommandCenter    from "./components/ProspectCommandCenter";
import ProspectRevenueInsights  from "./components/ProspectRevenueInsights";
import ProspectDailyActionPanel from "./components/ProspectDailyActionPanel";
import ProspectAutomationPanel  from "./components/ProspectAutomationPanel";
import ProspectCreateDrawer     from "./components/ProspectCreateDrawer";

// ─── GRID SYSTEM ─────────────────────────────────────────────
// 4 columnas iguales — todo se alinea a esta base
// Col 1 = Calientes / Sidebar / Pipeline[1]
// Col 2 = Vencidos  / Workspace[start]
// Col 3 = Sin act.  / Workspace[end] / Daily
// Col 4 = Convert.  / Copilot / Auto
// ─────────────────────────────────────────────────────────────

export default function ProspectsPage() {
  const { t } = useTranslation();

  const ctrl = useProspectsController();
  const {
    loading, prospects, selected, setSelected,
    createProspect, updateProspect, archiveProspect,
    updateStage, addActivity,
  } = ctrl;

  const [filters, setFilters] = useState<ProspectFilters>(DEFAULT_FILTERS);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);

  const filteredProspects = useMemo(
    () => filterProspects(prospects, {
      search:     filters.search,
      stage:      filters.stage === "all" ? undefined : filters.stage,
      onlyActive: filters.onlyActive,
    }),
    [prospects, filters]
  );

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
        <div style={{
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-border-faint)",
          borderRadius: "var(--radius-lg)",
          padding: "20px 32px",
          fontSize: "14px", fontWeight: 700,
          color: "var(--color-text-primary)",
        }}>
          {t.prospects.loading}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gridTemplateRows: "auto 400px 560px 380px",
      gap: "16px",
      paddingBottom: "32px",
    }}>

      {/* ══ ROW 1: COMMAND CENTER — span 4 ══ */}
      <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "16px" }}>
        <ProspectCommandCenter
          prospects={prospects}
          onSelect={setSelected}
        />
      </div>

      {/* ══ ROW 2: INTELIGENCIA ══
          Col 1-2: Pipeline Insights
          Col 3:   Acciones prioritarias
          Col 4:   Automatización        */}
      <div style={{ gridColumn: "1 / 3", minHeight: 0, overflow: "hidden" }}>
        <ProspectRevenueInsights prospects={prospects} />
      </div>
      <div style={{ gridColumn: "3 / 4", minHeight: 0, overflow: "hidden" }}>
        <ProspectDailyActionPanel prospects={prospects} onSelect={setSelected} />
      </div>
      <div style={{ gridColumn: "4 / 5", minHeight: 0, overflow: "hidden" }}>
        <ProspectAutomationPanel prospects={prospects} onSelect={setSelected} />
      </div>

      {/* ══ ROW 3: OPERATIVA ══
          Col 1:   Sidebar
          Col 2-3: Workspace
          Col 4:   Copilot              */}
      <div style={{ gridColumn: "1 / 2", minHeight: 0, overflow: "hidden" }}>
        <ProspectsSidebar
          search={filters.search}
          setSearch={(v) => setFilters((f) => ({ ...f, search: v }))}
          prospects={filteredProspects}
          selected={selected}
          setSelected={setSelected}
          onOpenCreate={() => setShowCreateDrawer(true)}
        />
      </div>
      <div style={{ gridColumn: "2 / 4", minHeight: 0, overflow: "hidden" }}>
        <ProspectWorkspace
          prospect={selected}
          createProspect={createProspect}
          updateProspect={updateProspect}
          archiveProspect={archiveProspect}
          onStageChange={(id, stage) => updateStage(id, stage as any)}
          onAddActivity={addActivity}
        />
      </div>
      <div style={{ gridColumn: "4 / 5", minHeight: 0, overflow: "hidden" }}>
        <ProspectCopilot prospect={selected} />
      </div>

      {/* ══ ROW 4: PIPELINE BOARD — span 4, sin scroll horizontal ══ */}
      <div style={{ gridColumn: "1 / -1", minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{
          fontSize: "11px", fontWeight: 700,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}>
          {t.prospects.pipelineTitle}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ProspectPipelineBoard
            prospects={prospects}
            onSelect={setSelected}
            onStageChange={(id, stage) => updateStage(id, stage as any)}
          />
        </div>
      </div>

      {/* ══ DRAWER ══ */}
      <ProspectCreateDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        createProspect={createProspect}
        onCreated={(p: Prospect) => {
          setSelected(p);
          setShowCreateDrawer(false);
        }}
      />
    </div>
  );
}
