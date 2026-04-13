"use client";
import { useState } from "react";
import { useTranslation }           from "@/lib/i18n/useTranslation";
import { useRequisitionController } from "./services/requisition.controller";
import RequisitionCommandCenter     from "./components/RequisitionCommandCenter";
import RequisitionSidebar           from "./components/RequisitionSidebar";
import RequisitionWorkspace         from "./components/RequisitionWorkspace";
import RequisitionCreateDrawer      from "./components/RequisitionCreateDrawer";

export default function RequisicionesPage() {
  const { t } = useTranslation();
  const tp    = (t.procurement as any) ?? {};
  const ctrl  = useRequisitionController();
  const {
    filtered, selected,
    loading, saving, filters, setFilters,
    handleCreate, handleUpdate, handleStatusChange,
    handleDelete, handleUpsertItem, handleDeleteItem,
    handleSelect,
  } = ctrl;

  const [showCreate, setShowCreate] = useState(false);

  if (loading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 32px", fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        {tp.loading ?? "Cargando requisiciones…"}
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
      <RequisitionCommandCenter requisitions={filtered} />

      <div style={{ gridColumn: "1 / 2", minHeight: 0, overflow: "hidden" }}>
        <RequisitionSidebar
          requisitions={filtered}
          selected={selected}
          onSelect={handleSelect}
          filters={filters}
          setFilters={setFilters}
          onNew={() => setShowCreate(true)}
        />
      </div>

      <div style={{ gridColumn: "2 / 5", minHeight: 0, overflow: "hidden" }}>
        <RequisitionWorkspace
          requisition={selected}
          saving={saving}
          onUpdate={handleUpdate}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onUpsertItem={handleUpsertItem}
          onDeleteItem={handleDeleteItem}
        />
      </div>

      <RequisitionCreateDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
