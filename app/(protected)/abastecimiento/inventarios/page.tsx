"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import type { InventoryFilters, MovementFilters } from "./types/inventarios.types";
import { DEFAULT_INVENTORY_FILTERS, DEFAULT_MOVEMENT_FILTERS } from "./types/inventarios.types";
import { useInventarioController } from "./services/inventarios.controller";
import InventarioStats       from "./components/InventarioStats";
import InventarioStock       from "./components/InventarioStock";
import InventarioMovimientos from "./components/InventarioMovimientos";
import InventarioAlmacenes   from "./components/InventarioAlmacenes";
import MovimientoDrawer      from "./components/MovimientoDrawer";
import ItemCreateDrawer      from "./components/ItemCreateDrawer";
import InventarioConteos from "./components/InventarioConteos";

type Tab = "stock" | "movimientos" | "almacenes" | "conteos";

export default function InventariosPage() {
  const { lang } = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [userId,       setUserId]       = useState("");
  const [tab,          setTab]          = useState<Tab>("stock");
  const [invFilters,   setInvFilters]   = useState<InventoryFilters>(DEFAULT_INVENTORY_FILTERS);
  const [movFilters,   setMovFilters]   = useState<MovementFilters>(DEFAULT_MOVEMENT_FILTERS);
  const [showMovement, setShowMovement] = useState(false);
  const [showNewItem,  setShowNewItem]  = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  const ctrl = useInventarioController(companyId ?? "", userId);

  useEffect(() => {
    if (!companyId) return;
    ctrl.loadAll(invFilters);
  }, [companyId, invFilters]);

  useEffect(() => {
    if (!companyId || tab !== "movimientos") return;
    ctrl.loadMovements(movFilters);
  }, [companyId, tab, movFilters]);

  useEffect(() => {
    if (!companyId || tab !== "conteos") return;
    ctrl.loadCounts();
  }, [companyId, tab]);

  const handleInvFilter = useCallback((partial: Partial<InventoryFilters>) => {
    setInvFilters((p) => ({ ...p, ...partial }));
  }, []);

  const handleMovFilter = useCallback((partial: Partial<MovementFilters>) => {
    setMovFilters((p) => ({ ...p, ...partial }));
  }, []);

  const TABS: { key: Tab; labelEs: string; labelEn: string }[] = [
    { key: "stock",       labelEs: "Stock",         labelEn: "Stock"        },
    { key: "movimientos", labelEs: "Movimientos",   labelEn: "Movements"    },
    { key: "almacenes",   labelEs: "Almacenes",     labelEn: "Warehouses"   },
    { key: "conteos",     labelEs: "Conteos físicos", labelEn: "Physical counts" },
  ];

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
          {es ? "Inventarios" : "Inventory"}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
          {es
            ? "Control de stock, movimientos, almacenes y conteos físicos."
            : "Stock control, movements, warehouses and physical counts."}
        </p>
      </div>

      {/* ERROR */}
      {ctrl.error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
          {ctrl.error}
        </div>
      )}

      {/* STATS */}
      <InventarioStats stats={ctrl.stats} />

      {/* TABS */}
      <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--color-border-faint)", paddingBottom: "1px" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              height: "34px", padding: "0 16px",
              borderRadius: "var(--radius-md) var(--radius-md) 0 0",
              background: tab === t.key ? "var(--color-bg-base)" : "transparent",
              border: tab === t.key ? "1px solid var(--color-border-faint)" : "none",
              borderBottom: tab === t.key ? "1px solid var(--color-bg-base)" : "none",
              color: tab === t.key ? "var(--color-text-primary)" : "var(--color-text-muted)",
              fontSize: "12px", fontWeight: tab === t.key ? 700 : 400,
              cursor: "pointer", marginBottom: tab === t.key ? "-1px" : "0",
            }}
          >
            {es ? t.labelEs : t.labelEn}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {tab === "stock" && (
        <InventarioStock
          items={ctrl.items}
          warehouses={ctrl.warehouses}
          loading={ctrl.loading}
          filters={invFilters}
          onFilter={handleInvFilter}
          onSelect={ctrl.setSelectedItem}
          onNewItem={() => setShowNewItem(true)}
          onNewMovement={() => setShowMovement(true)}
        />
      )}

      {tab === "movimientos" && (
        <InventarioMovimientos
          movements={ctrl.movements}
          warehouses={ctrl.warehouses}
          loading={ctrl.loading}
          filters={movFilters}
          onFilter={handleMovFilter}
          onNew={() => setShowMovement(true)}
        />
      )}

      {tab === "almacenes" && (
        <InventarioAlmacenes
          warehouses={ctrl.warehouses}
          saving={ctrl.saving}
          onCreate={ctrl.handleCreateWarehouse}
          onUpdate={ctrl.handleUpdateWarehouse}
        />
      )}

      {tab === "conteos" && (
  <InventarioConteos
    counts={ctrl.counts}
    warehouses={ctrl.warehouses}
    loading={ctrl.loading}
    saving={ctrl.saving}
    onCreate={ctrl.handleCreateCount}
    onLoadDetail={ctrl.loadCountDetail}
    selectedCount={ctrl.selectedCount}
    onUpdateItem={ctrl.handleUpdateCountItem}
    onComplete={ctrl.handleCompleteCount}
    onClose={() => ctrl.setSelectedCount(null)}
  />
)}

      {/* DRAWERS */}
      <MovimientoDrawer
        open={showMovement}
        items={ctrl.items}
        warehouses={ctrl.warehouses}
        saving={ctrl.saving}
        onClose={() => setShowMovement(false)}
        onCreate={(payload) => ctrl.handleRegisterMovement(payload, movFilters, invFilters)}
      />

      <ItemCreateDrawer
        open={showNewItem}
        saving={ctrl.saving}
        onClose={() => setShowNewItem(false)}
        onCreate={(payload) => ctrl.handleCreateItem(payload, invFilters)}
      />
    </div>
  );
}
