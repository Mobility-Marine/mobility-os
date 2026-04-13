"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useQuotationsController } from "./services/quotations.controller";
import { generateAndDownloadPDF } from "./services/quotations.pdf";
import type { CreateItemPayload, CreateServicePayload, CreateQuotationPayload } from "./types/quotations.types";

import QuotationCommandCenter from "./components/QuotationCommandCenter";
import QuotationsSidebar      from "./components/QuotationsSidebar";
import QuotationWorkspace     from "./components/QuotationWorkspace";
import QuotationCreateDrawer  from "./components/QuotationCreateDrawer";
import QuotationCopilot       from "./components/QuotationCopilot";

export default function CotizacionesPage() {
  const { t } = useTranslation();
  const ctrl  = useQuotationsController();
  const {
    filtered, selected, setSelected,
    settings, loading, saving, detailLoading,
    filters, setFilters,
    createQuotation, updateStatus, acceptQuotation,
    createItem, removeItem,
    createService, removeService,
  } = ctrl;

  const [showCreate, setShowCreate] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  async function handleCreate(
    payload: CreateQuotationPayload,
    items?:    Omit<CreateItemPayload,    "quotation_id">[],
    services?: Omit<CreateServicePayload, "quotation_id">[],
  ) {
    const q = await createQuotation(payload);
    if (!q) return;

    // Crear items en paralelo
    if (items?.length) {
      await Promise.all(items.map((item) => createItem({ ...item, quotation_id: q.id })));
    }
    if (services?.length) {
      await Promise.all(services.map((svc) => createService({ ...svc, quotation_id: q.id })));
    }

    setSelected(q);
  }

  async function handleOpenPDF(q: typeof selected) {
    if (!q) return;
    setGeneratingPDF(true);
    try {
      await generateAndDownloadPDF(q, settings);
    } finally {
      setGeneratingPDF(false);
    }
  }

  if (loading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "20px 32px",
        fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)",
      }}>
        {(t.quot as any)?.loading ?? "Cargando cotizaciones…"}
      </div>
    </div>
  );

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gridTemplateRows: "auto 560px",
      gap: "16px",
      paddingBottom: "32px",
    }}>

      {/* STRIP — Command Center */}
      <QuotationCommandCenter quotations={ctrl.quotations} />

      {/* ROW_M */}
      <div style={{ gridColumn: "1 / 2", minHeight: 0, overflow: "hidden" }}>
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
          onNew={() => setShowCreate(true)}
        />
      </div>

      <div style={{ gridColumn: "2 / 4", minHeight: 0, overflow: "hidden" }}>
        <QuotationWorkspace
          quotation={selected}
          detailLoading={detailLoading}
          onUpdateStatus={updateStatus}
          onAccept={acceptQuotation}
          onRemoveItem={removeItem}
          onRemoveService={removeService}
          onOpenPDF={handleOpenPDF}
          saving={saving || generatingPDF}
        />
      </div>

      <div style={{ gridColumn: "4 / 5", minHeight: 0, overflow: "hidden" }}>
        <QuotationCopilot quotation={selected} />
      </div>

      {/* DRAWER */}
      <QuotationCreateDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
        defaultTemplate={settings?.template_services ?? "elegante"}
      />
    </div>
  );
}
