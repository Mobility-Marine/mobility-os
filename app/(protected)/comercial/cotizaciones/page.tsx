"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useQuotationsController } from "./services/quotations.controller";
import { generateAndDownloadPDF } from "./services/quotations.pdf";
import type {
  CreateItemPayload, CreateServicePayload, CreateQuotationPayload,
  Quotation, QuotationItem, QuotationService,
} from "./types/quotations.types";
import type { BillingConceptDraft } from "./components/drawer/drawerState";
import { updateQuotation, updateItem, updateService } from "./services/quotations.service";
import { useTenant } from "@/lib/tenant/TenantProvider";

import QuotationCommandCenter from "./components/QuotationCommandCenter";
import QuotationsSidebar      from "./components/QuotationsSidebar";
import QuotationWorkspace     from "./components/QuotationWorkspace";
import QuotationCreateDrawer  from "./components/QuotationCreateDrawer";
import QuotationCopilot       from "./components/QuotationCopilot";

export default function CotizacionesPage() {
  const { t }         = useTranslation();
  const { companyId } = useTenant();
  const ctrl          = useQuotationsController();
  const {
  filtered, selected, setSelected,
  settings, loading, saving, detailLoading,
  filters, setFilters,
  createQuotation, updateStatus, acceptQuotation,
  updateFields,
  createItem, updateItem: updateItemFn, removeItem,
  createService, updateService: updateServiceFn, removeService,
  removeQuotation,       // ← nuevo
  reload, reloadDetail,
} = ctrl;

  const [showCreate,    setShowCreate]    = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

 async function handleCreate(
    payload:          CreateQuotationPayload,
    items?:           Omit<CreateItemPayload,    "quotation_id">[],
    services?:        Omit<CreateServicePayload, "quotation_id">[],
    billingConcepts?: BillingConceptDraft[],
  ) {
    const q = await createQuotation(payload, items, services, billingConcepts);
    if (!q) return;
    setSelected(q);
  }

 async function handleOpenPDF(q: typeof selected) {
  if (!q || !companyId) return;
  setGeneratingPDF(true);
  try {
    // Recargar datos frescos para PDF actualizado
    const { fetchQuotation } = await import("./services/quotations.service");
    const fresh = await fetchQuotation(companyId, q.id);
    await generateAndDownloadPDF(fresh ?? q, settings);
  } finally {
    setGeneratingPDF(false);
  }
}
  // ───────────────────────────────────────────────────────────

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

      {/* KPIs */}
      <QuotationCommandCenter quotations={ctrl.quotations} />

      {/* SIDEBAR */}
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

      {/* WORKSPACE */}
      <div style={{ gridColumn: "2 / 4", minHeight: 0, overflow: "hidden" }}>
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
          saving={saving || generatingPDF}
        />
      </div>

      {/* COPILOT */}
      <div style={{ gridColumn: "4 / 5", minHeight: 0, overflow: "hidden" }}>
        <QuotationCopilot quotation={selected} />
      </div>

      {/* DRAWER */}
      <QuotationCreateDrawer
  open={showCreate}
  onClose={() => setShowCreate(false)}
  onCreate={handleCreate}
/>
    </div>
  );
}
