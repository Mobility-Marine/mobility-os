"use client";
import { useState } from "react";
import { useTranslation }          from "@/lib/i18n/useTranslation";
import { useForeignTradeController } from "./services/foreign-trade.controller";
import FTCommandCenter              from "./components/FTCommandCenter";
import FTSidebar                   from "./components/FTSidebar";
import FTWorkspace                 from "./components/FTWorkspace";
import FTCreateDrawer              from "./components/FTCreateDrawer";

export default function ComercioExteriorPage() {
  const { t } = useTranslation();
  const tl    = (t.logistics as any) ?? {};
  const ctrl  = useForeignTradeController();
  const {
    ops, filtered, selected, setSelected,
    loading, saving, filters, setFilters,
    handleCreate, handleUpdate, handleDelete, reloadSelected,
  } = ctrl;

  const [showCreate, setShowCreate] = useState(false);

  if (loading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 32px", fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        Cargando comercio exterior…
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
      <FTCommandCenter ops={ops} />

      <div style={{ gridColumn: "1 / 2", minHeight: 0, overflow: "hidden" }}>
        <FTSidebar
          ops={filtered}
          selected={selected}
          setSelected={setSelected}
          filters={filters}
          setFilters={setFilters}
          onNew={() => setShowCreate(true)}
        />
      </div>

      <div style={{ gridColumn: "2 / 5", minHeight: 0, overflow: "hidden" }}>
        <FTWorkspace
          op={selected}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onReload={reloadSelected}
          saving={saving}
        />
      </div>

      <FTCreateDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
