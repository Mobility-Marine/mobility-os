"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useOrdersController } from "./services/orders.controller";
import type { Order } from "./types/orders.types";

import OrderCommandCenter from "./components/OrderCommandCenter";
import OrdersSidebar      from "./components/OrdersSidebar";
import OrderWorkspace     from "./components/OrderWorkspace";
import OrderCopilot       from "./components/OrderCopilot";
import OrderCreateDrawer  from "./components/OrderCreateDrawer";

export default function PedidosPage() {
  const { t } = useTranslation();
  const to    = (t.orders as any) ?? {};
  const ctrl  = useOrdersController();
  const {
    filtered, selected, setSelected,
    kpis, loading, saving,
    filters, setFilters,
    handleStatusChange, handleUpdate,
    reload,
  } = ctrl;

  const [showCreate, setShowCreate] = useState(false);

  if (loading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "20px 32px",
        fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)",
      }}>
        {to.loading ?? "Cargando pedidos…"}
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
      <OrderCommandCenter kpis={kpis} />

      {/* SIDEBAR */}
      <div style={{ gridColumn: "1 / 2", minHeight: 0, overflow: "hidden" }}>
        <OrdersSidebar
          orders={filtered}
          selected={selected}
          setSelected={setSelected}
          filters={filters}
          setFilters={setFilters}
          onNew={() => setShowCreate(true)}
        />
      </div>

      {/* WORKSPACE */}
      <div style={{ gridColumn: "2 / 4", minHeight: 0, overflow: "hidden" }}>
        <OrderWorkspace
          order={selected}
          onStatusChange={handleStatusChange}
          onUpdate={handleUpdate}
          saving={saving}
        />
      </div>

      {/* COPILOT */}
      <div style={{ gridColumn: "4 / 5", minHeight: 0, overflow: "hidden" }}>
        <OrderCopilot order={selected} />
      </div>

      {/* DRAWER — Nueva orden */}
      <OrderCreateDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(order: Order) => {
          setShowCreate(false);
          reload();
          setSelected(order);
        }}
      />
    </div>
  );
}
