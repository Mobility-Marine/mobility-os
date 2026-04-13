"use client";
import { useState } from "react";
import { useTranslation }       from "@/lib/i18n/useTranslation";
import { useTransportController } from "./services/transport.controller";
import TransportCommandCenter    from "./components/TransportCommandCenter";
import TransportSidebar          from "./components/TransportSidebar";
import TransportWorkspace        from "./components/TransportWorkspace";
import TransportCreateDrawer     from "./components/TransportCreateDrawer";

export default function TransportePage() {
  const { t } = useTranslation();
  const tl    = (t.logistics as any) ?? {};
  const ctrl  = useTransportController();
  const {
    units, filtered, selected, setSelected,
    loading, saving, filters, setFilters,
    handleCreate, handleUpdate, handleDelete,
  } = ctrl;

  const [showCreate, setShowCreate] = useState(false);

  if (loading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 32px", fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        {tl.loading ?? "Cargando transporte…"}
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
      <TransportCommandCenter units={units} />

      <div style={{ gridColumn: "1 / 2", minHeight: 0, overflow: "hidden" }}>
        <TransportSidebar
          units={filtered}
          selected={selected}
          setSelected={setSelected}
          filters={filters}
          setFilters={setFilters}
          onNew={() => setShowCreate(true)}
        />
      </div>

      <div style={{ gridColumn: "2 / 5", minHeight: 0, overflow: "hidden" }}>
        <TransportWorkspace
          unit={selected}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          saving={saving}
        />
      </div>

      <TransportCreateDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
