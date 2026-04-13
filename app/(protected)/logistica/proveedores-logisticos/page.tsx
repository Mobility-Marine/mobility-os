"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useProvidersController } from "./services/providers.controller";

import ProviderCommandCenter from "./components/ProviderCommandCenter";
import ProvidersSidebar      from "./components/ProvidersSidebar";
import ProviderWorkspace     from "./components/ProviderWorkspace";
import ProviderCreateDrawer  from "./components/ProviderCreateDrawer";

export default function ProveedoresLogisticosPage() {
  const { t } = useTranslation();
  const tl    = (t.logistics as any) ?? {};
  const ctrl  = useProvidersController();
  const {
    filtered, selected, setSelected,
    kpis, loading, saving,
    filters, setFilters,
    handleCreate, handleUpdate, handleToggle, handleDelete,
    reloadSelected,
  } = ctrl;

  const [showCreate, setShowCreate] = useState(false);

  if (loading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "20px 32px",
        fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)",
      }}>
        {tl.loading ?? "Cargando proveedores…"}
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

      {/* STRIP — KPIs */}
      <ProviderCommandCenter kpis={kpis} />

      {/* SIDEBAR */}
      <div style={{ gridColumn: "1 / 2", minHeight: 0, overflow: "hidden" }}>
        <ProvidersSidebar
          providers={filtered}
          selected={selected}
          setSelected={setSelected}
          filters={filters}
          setFilters={setFilters}
          onNew={() => setShowCreate(true)}
        />
      </div>

      {/* WORKSPACE */}
      <div style={{ gridColumn: "2 / 5", minHeight: 0, overflow: "hidden" }}>
        <ProviderWorkspace
          provider={selected}
          onUpdate={handleUpdate}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onReload={reloadSelected}
          saving={saving}
        />
      </div>

      {/* DRAWER */}
      <ProviderCreateDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={async (data) => {
          await handleCreate(data);
          setShowCreate(false);
        }}
      />
    </div>
  );
}
