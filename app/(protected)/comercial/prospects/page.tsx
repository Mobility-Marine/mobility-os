"use client";

// ============================================================
// 👤 PROSPECTS PAGE — Enterprise Revenue OS
// Arquitectura en capas (NO monolítica)
// ============================================================

import { useMemo, useState } from "react";

import ProspectsSidebar from "./components/ProspectsSidebar";
import ProspectWorkspace from "./components/ProspectWorkspace";
import ProspectCopilot from "./components/ProspectCopilot";

import { useProspectsController } from "./services/prospects.controller";

import type { Prospect } from "./types/prospects.types";

import ProspectPipelineBoard from "./components/ProspectPipelineBoard";

import ProspectCommandCenter from "./components/ProspectCommandCenter";

import ProspectRevenueInsights from "./components/ProspectRevenueInsights";

import ProspectDailyActionPanel from "./components/ProspectDailyActionPanel";

import ProspectAutomationPanel from "./components/ProspectAutomationPanel";

import ProspectCreateDrawer from "./components/ProspectCreateDrawer";

// ============================================================
// PAGE
// ============================================================

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

  // ==========================================================
  // FILTERED LIST
  // ==========================================================

  const filteredProspects = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return prospects;

    return prospects.filter((p) =>
      p.name?.toLowerCase().includes(q) ||
      p.company_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  }, [prospects, search]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        Cargando prospectos...
      </div>
    );
  }

  // ==========================================================
  // LAYOUT
  // ==========================================================

  return (
  <div
    style={{
      height: "calc(100vh - 40px)",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      padding: 16,
      background: "#020617",
    }}
  >

{/* ================= COMMAND CENTER ================= */}

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
    
    {/* ===================================================== */}
    {/* FILA SUPERIOR — OPERACIÓN */}
    {/* ===================================================== */}

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "320px minmax(0, 1fr) 340px",
        gap: 16,
        flex: "0 0 auto",
      }}
    >
     <ProspectsSidebar
  search={search}
  setSearch={setSearch}
  prospects={filteredProspects}
  selected={selected}
  setSelected={setSelected}
  createProspect={createProspect}
  onOpenCreate={() => setShowCreateDrawer(true)}
/>

      <ProspectWorkspace
        prospect={selected}
        createProspect={createProspect}
        updateProspect={updateProspect}
        archiveProspect={archiveProspect}
      />

      <ProspectCopilot prospect={selected} />
    </div>

    {/* ===================================================== */}
    {/* FILA INFERIOR — PIPELINE */}
    {/* ===================================================== */}

    <div
      style={{
        flex: 1,
        minHeight: 0,
      }}
    >
      <ProspectPipelineBoard
        prospects={prospects}
        onSelect={setSelected}
      />
      {/* ================= CREATE PROSPECT DRAWER ================= */}

<ProspectCreateDrawer
  open={showCreateDrawer}
  onClose={() => setShowCreateDrawer(false)}
  createProspect={createProspect}
/>
    </div>
  </div>
);}
