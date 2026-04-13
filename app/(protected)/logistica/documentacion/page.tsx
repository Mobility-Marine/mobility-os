"use client";
import { useState } from "react";
import { useTranslation }    from "@/lib/i18n/useTranslation";
import { useDocsController } from "./services/docs.controller";
import DocsCommandCenter     from "./components/DocsCommandCenter";
import DocsSidebar           from "./components/DocsSidebar";
import DocsWorkspace         from "./components/DocsWorkspace";
import DocsCreateDrawer      from "./components/DocsCreateDrawer";

export default function DocumentacionPage() {
  const { t } = useTranslation();
  const tl    = (t.logistics as any) ?? {};
  const ctrl  = useDocsController();
  const {
    docs, filtered, selected, setSelected,
    loading, saving,
    filters, setFilters,
    handleCreate, handleUpdate, handleDelete,
    reload,
  } = ctrl;

  const [showCreate, setShowCreate] = useState(false);

  if (loading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 32px", fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        Cargando documentación…
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
      {/* KPIs */}
      <DocsCommandCenter docs={docs} />

      {/* SIDEBAR */}
      <div style={{ gridColumn: "1 / 2", minHeight: 0, overflow: "hidden" }}>
        <DocsSidebar
          docs={filtered}
          selected={selected}
          setSelected={setSelected}
          filters={filters}
          setFilters={setFilters}
          onNew={() => setShowCreate(true)}
        />
      </div>

      {/* WORKSPACE */}
      <div style={{ gridColumn: "2 / 5", minHeight: 0, overflow: "hidden" }}>
        <DocsWorkspace
          doc={selected}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onReload={reload}
          saving={saving}
        />
      </div>

      {/* DRAWER */}
      <DocsCreateDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
