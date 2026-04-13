"use client";
import { useState } from "react";
import { useTranslation }    from "@/lib/i18n/useTranslation";
import { useRFQController }  from "./services/rfq.controller";
import RFQCommandCenter      from "./components/RFQCommandCenter";
import RFQSidebar            from "./components/RFQSidebar";
import RFQWorkspace          from "./components/RFQWorkspace";
import RFQCreateDrawer       from "./components/RFQCreateDrawer";

export default function CotizacionesCompraPage() {
  const { t } = useTranslation();
  const tp    = (t.procurement as any) ?? {};
  const ctrl  = useRFQController();
  const {
    filtered, selected,
    loading, saving, filters, setFilters,
    handleCreate, handleUpdate, handleStatusChange,
    handleDelete, handleUpsertItem, handleDeleteItem,
    handleAddSupplier, handleRemoveSupplier,
    handleUpsertResponseItem, handleAward,
    handleSelect,
  } = ctrl;

  const [showCreate, setShowCreate] = useState(false);

  if (loading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 32px", fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        {tp.loading ?? "Cargando cotizaciones…"}
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
      <RFQCommandCenter rfqs={filtered} />

      <div style={{ gridColumn: "1 / 2", minHeight: 0, overflow: "hidden" }}>
        <RFQSidebar
          rfqs={filtered}
          selected={selected}
          onSelect={handleSelect}
          filters={filters}
          setFilters={setFilters}
          onNew={() => setShowCreate(true)}
        />
      </div>

      <div style={{ gridColumn: "2 / 5", minHeight: 0, overflow: "hidden" }}>
        <RFQWorkspace
          rfq={selected}
          saving={saving}
          onUpdate={handleUpdate}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onUpsertItem={handleUpsertItem}
          onDeleteItem={handleDeleteItem}
          onAddSupplier={handleAddSupplier}
          onRemoveSupplier={handleRemoveSupplier}
          onUpsertResponseItem={handleUpsertResponseItem}
          onAward={handleAward}
        />
      </div>

      <RFQCreateDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
