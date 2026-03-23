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
        display: "grid",
        gridTemplateColumns: "320px minmax(0, 1fr) 340px",
        gap: 16,
        padding: 16,
        background: "#020617",
      }}
    >
      {/* ===================================================== */}
      {/* SIDEBAR — LISTA + CREACIÓN */}
      {/* ===================================================== */}

      <ProspectsSidebar
        search={search}
        setSearch={setSearch}
        prospects={filteredProspects}
        selected={selected}
        setSelected={setSelected}
        createProspect={createProspect}   // ⭐ IMPORTANTE
      />

      {/* ===================================================== */}
      {/* WORKSPACE — DETALLE */}
      {/* ===================================================== */}

      <ProspectWorkspace
        prospect={selected}
        createProspect={createProspect}
        updateProspect={updateProspect}
        archiveProspect={archiveProspect}
      />

      {/* ===================================================== */}
      {/* COPILOT IA */}
      {/* ===================================================== */}

      <ProspectCopilot prospect={selected} />
    </div>
    {/* ================= PIPELINE BOARD ================= */}

<div style={{ marginTop: 16 }}>
  <ProspectPipelineBoard
    prospects={prospects}
    onSelect={setSelected}
  />
</div>
  );
}
