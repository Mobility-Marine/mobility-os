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

// ─── LAYOUT SYSTEM ─────────────────────────────────────────
// STRIP: métricas compactas        → altura natural
// ROW_S: paneles de soporte        → 260px
// ROW_M: área operativa principal  → 560px
// ROW_L: vistas de datos amplias   → 360px
// ───────────────────────────────────────────────────────────

const ROW_S = 260;
const ROW_M = 560;
const ROW_L = 360;

const GAP = 16;

export default function ProspectsPage() {
  const { t } = useTranslation();

  const ctrl = useProspectsController();
  const {
    loading,
    prospects, selected, setSelected,
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
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          {t.prospects.loading}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: `${GAP}px`,
      paddingBottom: "32px",
    }}>

      {/* ══════════════════════════════════════════════════════
          STRIP — Command Center (altura natural)
      ══════════════════════════════════════════════════════ */}
      <ProspectCommandCenter
        prospects={prospects}
        onSelect={setSelected}
      />

      {/* ══════════════════════════════════════════════════════
          ROW_S — Inteligencia (3 columnas, 260px)
          Pipeline 2fr | Acciones 1fr | Automatización 1fr
      ══════════════════════════════════════════════════════ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr",
        gap: `${GAP}px`,
        height: `${ROW_S}px`,
        minHeight: 0,
      }}>
        <Cell>
          <ProspectRevenueInsights prospects={prospects} />
        </Cell>
        <Cell>
          <ProspectDailyActionPanel prospects={prospects} onSelect={setSelected} />
        </Cell>
        <Cell>
          <ProspectAutomationPanel prospects={prospects} onSelect={setSelected} />
        </Cell>
      </div>

      {/* ══════════════════════════════════════════════════════
          ROW_M — Operativa (3 columnas, 560px)
          Sidebar 280px | Workspace 1fr | Copilot 280px
      ══════════════════════════════════════════════════════ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "280px minmax(0, 1fr) 280px",
        gap: `${GAP}px`,
        height: `${ROW_M}px`,
        minHeight: 0,
      }}>
        <Cell>
          <ProspectsSidebar
            search={filters.search}
            setSearch={(v) => setFilters((f) => ({ ...f, search: v }))}
            prospects={filteredProspects}
            selected={selected}
            setSelected={setSelected}
            onOpenCreate={() => setShowCreateDrawer(true)}
          />
        </Cell>
        <Cell>
          <ProspectWorkspace
            prospect={selected}
            createProspect={createProspect}
            updateProspect={updateProspect}
            archiveProspect={archiveProspect}
            onStageChange={(id, stage) => updateStage(id, stage as any)}
            onAddActivity={addActivity}
          />
        </Cell>
        <Cell>
          <ProspectCopilot prospect={selected} />
        </Cell>
      </div>

      {/* ══════════════════════════════════════════════════════
          ROW_L — Pipeline Board (360px, scroll horizontal)
      ══════════════════════════════════════════════════════ */}
      <div>
        <div style={{
          fontSize: "11px", fontWeight: 700,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginBottom: "10px",
        }}>
          {t.prospects.pipelineTitle}
        </div>
        <div style={{
          height: `${ROW_L}px`,
          overflowX: "auto",
          overflowY: "hidden",
        }}>
          <ProspectPipelineBoard
            prospects={prospects}
            onSelect={setSelected}
            onStageChange={(id, stage) => updateStage(id, stage as any)}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DRAWER
      ══════════════════════════════════════════════════════ */}
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

// ─── CELL: contenedor que fuerza height 100% ─────────────
function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minWidth: 0,
      minHeight: 0,
      height: "100%",
      display: "flex",
      overflow: "hidden",
    }}>
      {children}
    </div>
  );
}
