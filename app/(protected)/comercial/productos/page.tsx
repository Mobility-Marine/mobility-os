"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useProductsController } from "./services/products.controller";

import ProductCommandCenter from "./components/ProductCommandCenter";
import ProductsSidebar      from "./components/ProductsSidebar";
import ProductWorkspace     from "./components/ProductWorkspace";
import ProductCreateDrawer  from "./components/ProductCreateDrawer";
import ProductImportExport  from "./components/ProductImportExport";

export default function ProductosPage() {
  const { t } = useTranslation();
  const tp    = (t.products as any) ?? {};
  const ctrl  = useProductsController();
  const {
    filtered, categories, selected, setSelected,
    kpis, loading, saving,
    filters, setFilters,
    handleCreate, handleUpdate, handleDelete, handleToggle,
    handleBulkImport, handleExport,
  } = ctrl;

  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);

  if (loading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "20px 32px",
        fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)",
      }}>
        {tp.loading ?? "Cargando productos…"}
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
      <ProductCommandCenter kpis={kpis} />

      {/* SIDEBAR */}
      <div style={{ gridColumn: "1 / 2", minHeight: 0, overflow: "hidden" }}>
        <ProductsSidebar
          products={filtered}
          selected={selected}
          setSelected={setSelected}
          filters={filters}
          setFilters={setFilters}
          categories={categories}
          onNew={() => setShowCreate(true)}
          onImport={() => setShowImport(true)}
          onExport={handleExport}
        />
      </div>

      {/* WORKSPACE */}
      <div style={{ gridColumn: "2 / 5", minHeight: 0, overflow: "hidden" }}>
        <ProductWorkspace
          product={selected}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onToggle={handleToggle}
          saving={saving}
        />
      </div>

      {/* DRAWERS */}
      <ProductCreateDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={async (payload) => { await handleCreate(payload); }}
      />
      <ProductImportExport
        open={showImport}
        onClose={() => setShowImport(false)}
        onBulkImport={handleBulkImport}
      />
    </div>
  );
}
