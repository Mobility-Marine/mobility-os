"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useQuotationsController } from "./services/quotations.controller";
import { generateAndDownloadPDF } from "./services/quotations.pdf";
import type {
  CreateItemPayload,
  CreateServicePayload,
  CreateQuotationPayload,
  Quotation,
} from "./types/quotations.types";
import type { BillingConceptDraft } from "./components/drawer/drawerState";
import { useTenant } from "@/lib/tenant/TenantProvider";

import QuotationCommandCenter from "./components/QuotationCommandCenter";
import QuotationsSidebar from "./components/QuotationsSidebar";
import QuotationWorkspace from "./components/QuotationWorkspace";
import QuotationCreateDrawer from "./components/QuotationCreateDrawer";
import QuotationEditDrawer from "./components/QuotationEditDrawer";
import QuotationCopilot from "./components/QuotationCopilot";
import { IconPlus, IconUpload, IconDownload } from "./components/Icons";

export default function CotizacionesPage() {
  const { t } = useTranslation();
  const { companyId } = useTenant();
  const ctrl = useQuotationsController();
  const {
    filtered,
    selected,
    setSelected,
    settings,
    loading,
    saving,
    detailLoading,
    filters,
    setFilters,
    createQuotation,
    updateStatus,
    acceptQuotation,
    updateFields,
    createItem,
    updateItem: updateItemFn,
    removeItem,
    createService,
    updateService: updateServiceFn,
    removeService,
    removeQuotation,
    duplicateQuotation,
    updateQuotationFull,
    reload,
    reloadDetail,
  } = ctrl;

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [lastCreated, setLastCreated] = useState<Quotation | null>(null);

  // ── Crear nueva cotización ───────────────────────────────
  async function handleCreate(
    payload: CreateQuotationPayload,
    items?: Omit<CreateItemPayload, "quotation_id">[],
    services?: Omit<CreateServicePayload, "quotation_id">[],
    billingConcepts?: BillingConceptDraft[],
  ) {
    const q = await createQuotation(payload, items, services, billingConcepts);
    if (!q) return;
    setSelected(q);
    setLastCreated(q);
  }

  // ── Editar cotización existente ──────────────────────────
  async function handleSaveEdit(
    id: string,
    payload: CreateQuotationPayload,
    items?: Omit<CreateItemPayload, "quotation_id">[],
    billingConcepts?: BillingConceptDraft[],
  ) {
    await updateQuotationFull(id, payload, items, billingConcepts);
    setShowEdit(false);
  }

  // ── Duplicar cotización ──────────────────────────────────
  async function handleDuplicate() {
    if (!selected) return;
    const newQuot = await duplicateQuotation(selected.id);
    if (newQuot) {
      // La controller ya hace setSelected. Abrimos el editor para revisar.
      setShowEdit(true);
    }
  }

  // ── Descargar PDF ────────────────────────────────────────
  async function handleOpenPDF(q: Quotation | null) {
    if (!q || !companyId) return;
    setGeneratingPDF(true);
    try {
      const { fetchQuotation } = await import("./services/quotations.service");
      const fresh = await fetchQuotation(companyId, q.id);
      await generateAndDownloadPDF(fresh ?? q, settings);
    } finally {
      setGeneratingPDF(false);
    }
  }

  // ── Importar/Exportar (placeholder próximo sprint) ───────
  function handleImportExport() {
    alert(
      "Importar/Exportar — Próximamente.\n\nSe agregará en próximo sprint con plantilla XLSX y CSV.",
    );
  }

  // ─────────────────────────────────────────────────────────
  if (loading)
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
        <div
          style={{
            background: "var(--color-bg-base)",
            border: "1px solid var(--color-border-faint)",
            borderRadius: "var(--radius-lg)",
            padding: "20px 32px",
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--color-text-primary)",
          }}
        >
          {(t.quot as any)?.loading ?? "Cargando cotizaciones…"}
        </div>
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "32px" }}>
      {/* ═══ HEADER ERP ═══ */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              marginBottom: "4px",
            }}
          >
            COMERCIAL
          </div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            Cotizaciones
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: "var(--color-text-muted)",
              marginTop: "4px",
              margin: "4px 0 0 0",
            }}
          >
            Pipeline comercial · Gestión de cotizaciones nivel ERP
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleImportExport}
            style={{
              height: "38px",
              padding: "0 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-bg-base)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-second)",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "var(--transition-fast)",
            }}
          >
            <IconUpload size={14} />
            Importar
          </button>
          <button
            onClick={handleImportExport}
            style={{
              height: "38px",
              padding: "0 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-bg-base)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-second)",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "var(--transition-fast)",
            }}
          >
            <IconDownload size={14} />
            Exportar
          </button>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              height: "38px",
              padding: "0 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-brand-blue)",
              border: "1px solid var(--color-brand-blue)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              transition: "var(--transition-fast)",
            }}
          >
            <IconPlus size={15} strokeWidth={2.5} />
            Nueva cotización
          </button>
        </div>
      </div>

      {/* ═══ KPI ROW (6 cols) — span completo ═══ */}
      <QuotationCommandCenter quotations={ctrl.quotations} />

      {/* ═══ MAIN GRID (sidebar 1 · workspace 2 · copilot 1) ═══ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)",
          gap: "16px",
          height: "640px",
        }}
      >
        {/* SIDEBAR */}
        <div style={{ minHeight: 0, overflow: "hidden" }}>
          <QuotationsSidebar
            quotations={filtered}
            selected={selected}
            setSelected={setSelected}
            search={filters.search}
            setSearch={(v) => setFilters((p) => ({ ...p, search: v }))}
            filterType={filters.type}
            setFilterType={(v) => setFilters((p) => ({ ...p, type: v }))}
            filterStatus={filters.status}
            setFilterStatus={(v) => setFilters((p) => ({ ...p, status: v }))}
          />
        </div>

        {/* WORKSPACE */}
        <div style={{ minHeight: 0, overflow: "hidden" }}>
          <QuotationWorkspace
            quotation={selected}
            detailLoading={detailLoading}
            onUpdateStatus={updateStatus}
            onUpdateFields={updateFields}
            onUpdateItem={updateItemFn}
            onUpdateService={updateServiceFn}
            onAccept={acceptQuotation}
            onRemoveItem={removeItem}
            onRemoveService={removeService}
            onRemoveQuotation={removeQuotation}
            onAddItem={createItem}
            onOpenPDF={handleOpenPDF}
            onEdit={() => setShowEdit(true)}
            onDuplicate={handleDuplicate}
            saving={saving || generatingPDF}
          />
        </div>

        {/* COPILOT */}
        <div style={{ minHeight: 0, overflow: "hidden" }}>
          <QuotationCopilot quotation={selected} />
        </div>
      </div>

      {/* ═══ DRAWERS ═══ */}
      <QuotationCreateDrawer
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          setLastCreated(null);
        }}
        onCreate={handleCreate}
        onDownloadPDF={() => lastCreated && handleOpenPDF(lastCreated)}
      />

      <QuotationEditDrawer
        open={showEdit}
        quotation={selected}
        onClose={() => setShowEdit(false)}
        onSave={handleSaveEdit}
        saving={saving}
      />
    </div>
  );
}