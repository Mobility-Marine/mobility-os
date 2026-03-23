"use client";

// ============================================================
// 👤 PROSPECTS PAGE — SaaS Product Layout
// Revenue OS / Enterprise CRM / Stable viewport composition
// ============================================================

import { useMemo, useState } from "react";

import ProspectsSidebar from "./components/ProspectsSidebar";
import ProspectWorkspace from "./components/ProspectWorkspace";
import ProspectCopilot from "./components/ProspectCopilot";

import ProspectPipelineBoard from "./components/ProspectPipelineBoard";
import ProspectCommandCenter from "./components/ProspectCommandCenter";
import ProspectRevenueInsights from "./components/ProspectRevenueInsights";
import ProspectDailyActionPanel from "./components/ProspectDailyActionPanel";
import ProspectAutomationPanel from "./components/ProspectAutomationPanel";
import ProspectCreateDrawer from "./components/ProspectCreateDrawer";

import { useProspectsController } from "./services/prospects.controller";
import type { Prospect } from "./types/prospects.types";

export default function ProspectsPage() {
  const prospectsCtrl = useProspectsController();

  const {
    loading,
    prospects,
    selected,
    setSelected,
    createProspect,
    updateProspect,
    archiveProspect,
  } = prospectsCtrl;

  const [search, setSearch] = useState("");
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);

  const filteredProspects = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return prospects;

    return prospects.filter((p) =>
      p.name?.toLowerCase().includes(q) ||
      p.company_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  }, [prospects, search]);

  if (loading) {
    return (
      <div style={loadingWrap}>
        <div style={loadingCard}>Cargando prospectos...</div>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      {/* ===================================================== */}
      {/* CAPA 1 — EJECUTIVA / INTELIGENCIA */}
      {/* ===================================================== */}

      <div style={topBlocks}>
        <ProspectCommandCenter
          prospects={prospects}
          onSelect={setSelected}
        />

        <ProspectRevenueInsights prospects={prospects} />

        <ProspectDailyActionPanel
          prospects={prospects}
          onSelect={setSelected}
        />

        <ProspectAutomationPanel
          prospects={prospects}
          onSelect={setSelected}
        />
      </div>

      {/* ===================================================== */}
      {/* CAPA 2 — OPERATIVA */}
      {/* ===================================================== */}

      <div style={workRow}>
        <div style={panelShell}>
          <ProspectsSidebar
            search={search}
            setSearch={setSearch}
            prospects={filteredProspects}
            selected={selected}
            setSelected={setSelected}
            onOpenCreate={() => setShowCreateDrawer(true)}
          />
        </div>

        <div style={panelShell}>
          <ProspectWorkspace
            prospect={selected}
            createProspect={createProspect}
            updateProspect={updateProspect}
            archiveProspect={archiveProspect}
          />
        </div>

        <div style={panelShell}>
          <ProspectCopilot prospect={selected} />
        </div>
      </div>

      {/* ===================================================== */}
      {/* CAPA 3 — PIPELINE */}
      {/* ===================================================== */}

      <div style={pipelineArea}>
        <ProspectPipelineBoard
          prospects={prospects}
          onSelect={setSelected}
        />
      </div>

      {/* ===================================================== */}
      {/* DRAWER GLOBAL */}
      {/* ===================================================== */}

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

// ============================================================
// STYLES
// ============================================================

const loadingWrap: React.CSSProperties = {
  minHeight: "calc(100vh - 40px)",
  display: "grid",
  placeItems: "center",
  background: "#020617",
  padding: 24,
};

const loadingCard: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #1f2937",
  color: "#e5e7eb",
  borderRadius: 14,
  padding: "16px 20px",
  fontWeight: 700,
};

const pageWrap: React.CSSProperties = {
  height: "calc(100vh - 40px)",
  minHeight: 0,
  overflow: "hidden",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr)",
  gap: 16,
  padding: 16,
  background: "#020617",
};

const topBlocks: React.CSSProperties = {
  display: "grid",
  gap: 16,
  alignContent: "start",
};

const workRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "320px minmax(0, 1fr) 320px",
  gap: 16,
  alignItems: "stretch",
  minHeight: 420,
  maxHeight: 520,
};

const panelShell: React.CSSProperties = {
  minWidth: 0,
  minHeight: 0,
  height: "100%",
  overflow: "hidden",
  display: "flex",
};

const pipelineArea: React.CSSProperties = {
  minHeight: 0,
  overflow: "hidden",
  display: "flex",
};
