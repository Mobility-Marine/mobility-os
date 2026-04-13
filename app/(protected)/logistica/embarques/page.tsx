"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useShipmentsController } from "./services/shipments.controller";
import type { Shipment } from "./types/shipments.types";

import ShipmentCommandCenter from "./components/ShipmentCommandCenter";
import ShipmentsSidebar      from "./components/ShipmentsSidebar";
import ShipmentWorkspace     from "./components/ShipmentWorkspace";
import ShipmentCopilot       from "./components/ShipmentCopilot";
import ShipmentCreateDrawer  from "./components/ShipmentCreateDrawer";

export default function EmbarquesPage() {
  const { t } = useTranslation();
  const tl    = (t.logistics as any) ?? {};
  const ctrl  = useShipmentsController();
  const {
    filtered, selected, setSelected,
    kpis, loading, saving,
    filters, setFilters,
    handleStatusChange, handleUpdate,
    reloadSelected, reload,
  } = ctrl;

  const [showCreate, setShowCreate] = useState(false);

  if (loading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "20px 32px",
        fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)",
      }}>
        {tl.loadingShipments ?? "Cargando embarques…"}
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
      <ShipmentCommandCenter kpis={kpis} />

      {/* SIDEBAR */}
      <div style={{ gridColumn: "1 / 2", minHeight: 0, overflow: "hidden" }}>
        <ShipmentsSidebar
          shipments={filtered}
          selected={selected}
          setSelected={setSelected}
          filters={filters}
          setFilters={setFilters}
          onNew={() => setShowCreate(true)}
        />
      </div>

      {/* WORKSPACE */}
      <div style={{ gridColumn: "2 / 4", minHeight: 0, overflow: "hidden" }}>
        <ShipmentWorkspace
          shipment={selected}
          onStatusChange={handleStatusChange}
          onUpdate={handleUpdate}
          onReload={reloadSelected}
          saving={saving}
        />
      </div>

      {/* COPILOT */}
      <div style={{ gridColumn: "4 / 5", minHeight: 0, overflow: "hidden" }}>
        <ShipmentCopilot shipment={selected} />
      </div>

      {/* DRAWER */}
      <ShipmentCreateDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(shipment: Shipment) => {
          setShowCreate(false);
          reload();
          setSelected(shipment);
        }}
      />
    </div>
  );
}
