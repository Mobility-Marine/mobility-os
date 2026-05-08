"use client";

import React, { useState } from "react";
import type {
  Quotation,
  CreateItemPayload,
  CreateServicePayload,
  QuotationStatus,
} from "../../types/quotations.types";

import QuotationActionBar from "../QuotationActionBar";
import WorkspaceHeader from "./components/WorkspaceHeader";
import WorkspaceTabs, { WorkspaceTab } from "./components/WorkspaceTabs";
import WorkspaceEmptyState from "./components/WorkspaceEmptyState";
import TabDetalle from "./tabs/TabDetalle";
import TabConceptos from "./tabs/TabConceptos";
import TabTotales from "./tabs/TabTotales";
import TabPDF from "./tabs/TabPDF";

// ═══════════════════════════════════════════════════════════════════
// QUOTATION WORKSPACE — Orquestador delgado nivel ERP
//
// Patrón Container/Presentational:
//   Este componente es solo un orquestador (~250 líneas).
//   Delega la presentación a los componentes hijos:
//     - ActionBar (acciones)
//     - WorkspaceHeader (cabecera con folio/cliente/totales)
//     - WorkspaceTabs (navegación)
//     - TabDetalle / TabConceptos / TabTotales / TabPDF (vistas)
//
// API 100% compatible con la versión anterior (mismas Props).
// ═══════════════════════════════════════════════════════════════════

type Props = {
  quotation: Quotation | null;
  detailLoading: boolean;
  onUpdateStatus: (id: string, status: QuotationStatus) => Promise<void>;
  onUpdateFields: (id: string, fields: Partial<Quotation>) => Promise<void>;
  onAccept: (q: Quotation) => Promise<void>;
  onUpdateItem: (id: string, quotationId: string, payload: any) => Promise<void>;
  onUpdateService: (id: string, quotationId: string, payload: any) => Promise<void>;
  onRemoveItem: (id: string, quotationId: string) => Promise<void>;
  onRemoveService: (id: string, quotationId: string) => Promise<void>;
  onRemoveQuotation: (id: string) => Promise<void>;
  onAddItem: (quotationId: string, payload: any) => Promise<void>;
  onOpenPDF: (q: Quotation) => void;
  onEdit?: () => void;
  onDuplicate?: () => Promise<void>;
  saving: boolean;
};

export default function QuotationWorkspace(props: Props) {
  const {
    quotation,
    detailLoading,
    onAccept,
    onRemoveQuotation,
    onOpenPDF,
    onEdit,
    onDuplicate,
    onUpdateStatus,
    saving,
  } = props;

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("detalle");

  // EMPTY STATE — sin selección
  if (!quotation) {
    return (
      <div
        style={{
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-border-faint)",
          borderRadius: "var(--radius-lg)",
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <WorkspaceEmptyState loading={detailLoading} />
      </div>
    );
  }

  const isServices = quotation.type === "services";
  const concepts = (quotation as any).billing_concepts ?? [];
  const items = quotation.items ?? [];

  return (
    <div
      style={{
        background: "var(--color-bg-base)",
        border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* ─── ACTION BAR (acciones jerárquicas ERP) ─── */}
      {(onEdit || onDuplicate) && (
        <div style={{ padding: "12px 14px 0", flexShrink: 0 }}>
          <QuotationActionBar
            quotation={quotation}
            onEdit={onEdit ?? (() => {})}
            onDuplicate={onDuplicate ?? (async () => {})}
            onDownloadPDF={() => onOpenPDF(quotation)}
            onDelete={async () => {
              await onRemoveQuotation(quotation.id);
            }}
            onAccept={
              quotation.status === "draft" ||
              quotation.status === "sent" ||
              quotation.status === "viewed"
                ? () => onAccept(quotation)
                : undefined
            }
            onMarkSent={
              quotation.status === "draft"
                ? () => onUpdateStatus(quotation.id, "sent")
                : undefined
            }
            onReject={
              quotation.status === "sent" || quotation.status === "viewed"
                ? () => onUpdateStatus(quotation.id, "rejected")
                : undefined
            }
            saving={saving}
          />
        </div>
      )}

      {/* ─── HEADER (folio + cliente + total grande) ─── */}
      <WorkspaceHeader quotation={quotation} />

      {/* ─── TABS NAV (Detalle · Conceptos · Totales · PDF/Envío) ─── */}
      <WorkspaceTabs
        active={activeTab}
        onChange={setActiveTab}
        conceptsCount={concepts.length}
        itemsCount={items.length}
        isServices={isServices}
      />

      {/* ─── TAB CONTENT ─── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "16px",
          background: "var(--color-bg-base)",
        }}
      >
        {activeTab === "detalle" && <TabDetalle quotation={quotation} />}
        {activeTab === "conceptos" && <TabConceptos quotation={quotation} />}
        {activeTab === "totales" && <TabTotales quotation={quotation} />}
        {activeTab === "pdf" && (
          <TabPDF
            quotation={quotation}
            onDownload={() => onOpenPDF(quotation)}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}