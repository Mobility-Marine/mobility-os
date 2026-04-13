"use client";
import { useState } from "react";
import { useTranslation }       from "@/lib/i18n/useTranslation";
import { useSupplierController } from "./services/supplier.controller";
import SupplierCommandCenter    from "./components/SupplierCommandCenter";
import SupplierSidebar          from "./components/SupplierSidebar";
import SupplierWorkspace        from "./components/SupplierWorkspace";
import SupplierCreateDrawer     from "./components/SupplierCreateDrawer";

export default function ProveedoresPage() {
  const { t } = useTranslation();
  const tp    = (t.procurement as any) ?? {};
  const ctrl  = useSupplierController();
  const {
    filtered, selected, evaluations, contracts,
    loading, saving, filters, setFilters,
    handleSelectSupplier, handleUpdateSupplier,
    handleCreateEvaluation, handleDeleteEvaluation,
    handleCreateContract, handleUpdateContract,
    handleUpsertContractItem, handleDeleteContractItem,
    reload,
  } = ctrl;

  const [showCreate, setShowCreate] = useState(false);

  if (loading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 32px", fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        {tp.loading ?? "Cargando proveedores…"}
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
      <SupplierCommandCenter suppliers={filtered} />

      <div style={{ gridColumn: "1 / 2", minHeight: 0, overflow: "hidden" }}>
        <SupplierSidebar
          suppliers={filtered}
          selected={selected}
          onSelect={handleSelectSupplier}
          filters={filters}
          setFilters={setFilters}
          onNew={() => setShowCreate(true)}
        />
      </div>

      <div style={{ gridColumn: "2 / 5", minHeight: 0, overflow: "hidden" }}>
        <SupplierWorkspace
          supplier={selected}
          evaluations={evaluations}
          contracts={contracts}
          saving={saving}
          onUpdate={handleUpdateSupplier}
          onCreateEvaluation={handleCreateEvaluation}
          onDeleteEvaluation={handleDeleteEvaluation}
          onCreateContract={handleCreateContract}
          onUpdateContract={handleUpdateContract}
          onUpsertContractItem={handleUpsertContractItem}
          onDeleteContractItem={handleDeleteContractItem}
        />
      </div>

      <SupplierCreateDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { reload(); setShowCreate(false); }}
      />
    </div>
  );
}
