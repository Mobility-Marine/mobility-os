"use client";

// ============================================================
// 👤 PROSPECTS PAGE — REVENUE OS ELITE
// Control central del módulo comercial
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

  // 👉 Drawer ELITE state
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);

  // ==========================================================
  // FILTRADO
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
      {/* FILA OPERATIVA — RADAR + WORKSPACE + AI */}
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
      {/* PIPELINE — EJECUCIÓN COMERCIAL */}
      {/* ===================================================== */}

      <div
        style={{
          flex: "1 1 auto",
minHeight: 0,
overflow: "hidden",
        }}
      >
        <ProspectPipelineBoard
          prospects={prospects}
          onSelect={setSelected}
        />
      </div>

            {/* ===================================================== */}
      {/* CREATE PROSPECT DRAWER — GLOBAL */}
      {/* ===================================================== */}

      <ProspectCreateDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        createProspect={createProspect}
        onCreated={(p: Prospect) => {
          setSelected(p);      // auto-selección
        }}
      />
    </div>
  );
}
