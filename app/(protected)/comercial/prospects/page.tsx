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

export default function ProspectsPage() {
  const { t } = useTranslation();

  const ctrl = useProspectsController();
  const {
    loading,
    prospects, selected, setSelected,
    createProspect, updateProspect, archiveProspect,
    updateStage, addActivity,
  } = ctrl;

  const [filters, setFilters]               = useState<ProspectFilters>(DEFAULT_FILTERS);
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
      <div style={{ display: "grid", placeItems: "center", height: "400px" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "32px" }}>

      {/* ── CAPA 1: COMMAND CENTER ── */}
      <ProspectCommandCenter
        prospects={prospects}
        onSelect={setSelected}
      />

      {/* ── CAPA 2: INTELIGENCIA (3 columnas) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "16px", alignItems: "start" }}>
        <ProspectRevenueInsights prospects={prospects} />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <ProspectDailyActionPanel prospects={prospects} onSelect={setSelected} />
          <ProspectAutomationPanel  prospects={prospects} onSelect={setSelected} />
        </div>
      </div>

      {/* ── CAPA 3: OPERATIVA ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "300px minmax(0, 1fr) 300px",
        gap: "16px",
        height: "600px",
        minHeight: 0,
      }}>
        {/* SIDEBAR */}
        <div style={{ minWidth: 0, minHeight: 0, height: "100%", display: "flex", overflow: "hidden" }}>
          <ProspectsSidebar
            search={filters.search}
            setSearch={(v) => setFilters((f) => ({ ...f, search: v }))}
            prospects={filteredProspects}
            selected={selected}
            setSelected={setSelected}
            onOpenCreate={() => setShowCreateDrawer(true)}
          />
        </div>

        {/* WORKSPACE */}
        <div style={{ minWidth: 0, minHeight: 0, height: "100%", display: "flex", overflow: "hidden" }}>
          <ProspectWorkspace
            prospect={selected}
            createProspect={createProspect}
            updateProspect={updateProspect}
            archiveProspect={archiveProspect}
            onStageChange={(id, stage) => updateStage(id, stage as any)}
            onAddActivity={addActivity}
          />
        </div>

        {/* COPILOT */}
        <div style={{ minWidth: 0, minHeight: 0, height: "100%", display: "flex", overflow: "hidden" }}>
          <ProspectCopilot prospect={selected} />
        </div>
      </div>

      {/* ── CAPA 4: PIPELINE BOARD ── */}
      <div>
        <div style={{
          fontSize: "12px", fontWeight: 700,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginBottom: "10px",
          paddingLeft: "2px",
        }}>
          {t.prospects.pipelineTitle}
        </div>
        <div style={{ overflowX: "auto", paddingBottom: "8px" }}>
          <ProspectPipelineBoard
            prospects={prospects}
            onSelect={setSelected}
            onStageChange={(id, stage) => updateStage(id, stage as any)}
          />
        </div>
      </div>

      {/* ── DRAWER ── */}
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
