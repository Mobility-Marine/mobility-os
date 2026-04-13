"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useProspectsController } from "./services/prospects.controller";
import { filterProspects } from "./services/prospects.normalization";
import type { Prospect, ProspectFilters } from "./types/prospects.types";
import { DEFAULT_FILTERS } from "./types/prospects.types";

import ProspectsSidebar        from "./components/ProspectsSidebar";
import ProspectWorkspace       from "./components/ProspectWorkspace";
import ProspectCopilot         from "./components/ProspectCopilot";
import ProspectPipelineBoard   from "./components/ProspectPipelineBoard";
import ProspectCommandCenter   from "./components/ProspectCommandCenter";
import ProspectRevenueInsights from "./components/ProspectRevenueInsights";
import ProspectDailyActionPanel from "./components/ProspectDailyActionPanel";
import ProspectAutomationPanel from "./components/ProspectAutomationPanel";
import ProspectCreateDrawer    from "./components/ProspectCreateDrawer";

export default function ProspectsPage() {
  const { t } = useTranslation();

  const ctrl = useProspectsController();
  const {
    loading, saving,
    prospects, selected, setSelected,
    activities, notes, tasks, snapshotLoading,
    createProspect, updateProspect, archiveProspect,
    updateStage, convertProspect,
    addActivity, addNote, addTask,
  } = ctrl;

  const [filters, setFilters]         = useState<ProspectFilters>(DEFAULT_FILTERS);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);

  const filteredProspects = useMemo(
    () => filterProspects(prospects, {
      search:     filters.search,
      stage:      filters.stage === "all" ? undefined : filters.stage,
      onlyActive: filters.onlyActive,
    }),
    [prospects, filters]
  );

  // ── LOADING ──
  if (loading) {
    return (
      <div style={{
        height: "100%", minHeight: 0,
        display: "grid", placeItems: "center",
        background: "var(--color-bg-page)",
      }}>
        <div style={{
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-border-faint)",
          borderRadius: "var(--radius-lg)",
          padding: "20px 32px",
          fontSize: "14px", fontWeight: 700,
          color: "var(--color-text-primary)",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <div style={{
            width: "16px", height: "16px", borderRadius: "50%",
            border: "2px solid var(--color-brand-blue)",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }} />
          {t.prospects.loading}
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrap}>

      {/* ════════════════════════════════════════════════════
          CAPA 1 — INTELIGENCIA EJECUTIVA
      ════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gap: "14px" }}>
        <ProspectCommandCenter
          prospects={prospects}
          onSelect={setSelected}
        />
      </div>

      {/* ════════════════════════════════════════════════════
          CAPA 2 — INSIGHTS + ACCIONES
      ════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <ProspectRevenueInsights prospects={prospects} />
        <div style={{ display: "grid", gap: "14px", alignContent: "start" }}>
          <ProspectDailyActionPanel
            prospects={prospects}
            onSelect={setSelected}
          />
          <ProspectAutomationPanel
            prospects={prospects}
            onSelect={setSelected}
          />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          CAPA 3 — OPERATIVA (SIDEBAR + WORKSPACE + COPILOT)
      ════════════════════════════════════════════════════ */}
      <div style={workRow}>
        {/* SIDEBAR */}
        <div style={panelShell}>
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
        <div style={panelShell}>
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
        <div style={panelShell}>
          <ProspectCopilot prospect={selected} />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          CAPA 4 — PIPELINE BOARD
      ════════════════════════════════════════════════════ */}
      <div style={pipelineArea}>
        <ProspectPipelineBoard
          prospects={prospects}
          onSelect={setSelected}
          onStageChange={(id, stage) => updateStage(id, stage as any)}
        />
      </div>

      {/* ════════════════════════════════════════════════════
          DRAWER GLOBAL
      ════════════════════════════════════════════════════ */}
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

// ─── STYLES ─────────────────────────────────────────────────

const pageWrap: React.CSSProperties = {
  height: "100%", minHeight: 0,
  width: "100%", maxWidth: "100%",
  overflow: "auto",
  display: "flex", flexDirection: "column",
  gap: "16px",
  paddingBottom: "16px",
};

const workRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "300px minmax(0, 1fr) 300px",
  gap: "14px",
  alignItems: "stretch",
  minHeight: 0,
  height: "clamp(480px, 48vh, 580px)",
};

const panelShell: React.CSSProperties = {
  minWidth: 0, minHeight: 0,
  height: "100%",
  display: "flex",
  overflow: "hidden",
};

const pipelineArea: React.CSSProperties = {
  minHeight: 0,
  overflow: "auto",
  display: "flex",
  borderRadius: "var(--radius-lg)",
  paddingBottom: "4px",
};
