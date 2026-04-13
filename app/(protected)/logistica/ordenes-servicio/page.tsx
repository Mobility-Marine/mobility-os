"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useServiceOrdersController } from "./services/service-orders.controller";

import SOCommandCenter from "./components/SOCommandCenter";
import SOSidebar       from "./components/SOSidebar";
import SOWorkspace     from "./components/SOWorkspace";
import SOCreateDrawer  from "./components/SOCreateDrawer";

export default function OrdenesServicioPage() {
  const { t } = useTranslation();
  const tl    = (t.logistics as any) ?? {};
  const ctrl  = useServiceOrdersController();
  const {
    orders, filtered, selected, setSelected,
    loading, saving,
    filters, setFilters,
    handleCreate, handleUpdate, handleDelete,
    reloadSelected,
  } = ctrl;

  const [showCreate, setShowCreate] = useState(false);

  if (loading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 32px", fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        {tl.loading ?? "Cargando órdenes de servicio…"}
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
      <SOCommandCenter orders={orders} />

      {/* SIDEBAR */}
      <div style={{ gridColumn: "1 / 2", minHeight: 0, overflow: "hidden" }}>
        <SOSidebar
          orders={filtered}
          selected={selected}
          setSelected={setSelected}
          filters={filters}
          setFilters={setFilters}
          onNew={() => setShowCreate(true)}
        />
      </div>

      {/* WORKSPACE — ocupa 3 columnas porque no hay copilot */}
      <div style={{ gridColumn: "2 / 5", minHeight: 0, overflow: "hidden" }}>
        <SOWorkspace
          order={selected}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onReload={reloadSelected}
          saving={saving}
        />
      </div>

      {/* DRAWER */}
      <SOCreateDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
