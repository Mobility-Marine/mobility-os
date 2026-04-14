"use client";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import type { CostFilters } from "./types/costos.types";
import { DEFAULT_COST_FILTERS } from "./types/costos.types";
import { useCostosController } from "./services/costos.controller";
import CostosStats        from "./components/CostosStats";
import CostosAnalisis     from "./components/CostosAnalisis";
import CostosTendencias   from "./components/CostosTendencias";
import CostosImportExport from "./components/CostosImportExport";

type Tab = "analisis" | "tendencias" | "importexport";

export default function CostosPage() {
  const { lang } = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [userId,  setUserId]  = useState("");
  const [tab,     setTab]     = useState<Tab>("analisis");
  const [filters, setFilters] = useState<CostFilters>(DEFAULT_COST_FILTERS);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  const ctrl = useCostosController(companyId ?? "", userId);

  useEffect(() => {
    if (!companyId) return;
    ctrl.load();
  }, [companyId]);

  const handleFilter = useCallback((partial: Partial<CostFilters>) => {
    setFilters((p) => ({ ...p, ...partial }));
  }, []);

  const TABS: { key: Tab; labelEs: string; labelEn: string }[] = [
    { key: "analisis",    labelEs: "Análisis",         labelEn: "Analysis"         },
    { key: "tendencias",  labelEs: "Tendencias",        labelEn: "Trends"           },
    { key: "importexport",labelEs: "Importar / Exportar", labelEn: "Import / Export"},
  ];

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
          {es ? "Costos" : "Costs"}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
          {es
            ? "Análisis de costos, márgenes, historial de precios e importación masiva."
            : "Cost analysis, margins, price history and bulk import."}
        </p>
      </div>

      {ctrl.error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
          {ctrl.error}
        </div>
      )}

      {/* STATS */}
      <CostosStats stats={ctrl.stats} />

      {/* TABS */}
      <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--color-border-faint)", paddingBottom: "1px" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ height: "34px", padding: "0 16px", borderRadius: "var(--radius-md) var(--radius-md) 0 0", background: tab === t.key ? "var(--color-bg-base)" : "transparent", border: tab === t.key ? "1px solid var(--color-border-faint)" : "none", borderBottom: tab === t.key ? "1px solid var(--color-bg-base)" : "none", color: tab === t.key ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: tab === t.key ? 700 : 400, cursor: "pointer", marginBottom: tab === t.key ? "-1px" : "0" }}>
            {es ? t.labelEs : t.labelEn}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      {tab === "analisis" && (
        <CostosAnalisis
          items={ctrl.items}
          loading={ctrl.loading}
          filters={filters}
          onFilter={handleFilter}
          onSelect={(item) => { ctrl.handleSelectItem(item); setTab("tendencias"); }}
        />
      )}

      {tab === "tendencias" && (
        <CostosTendencias
          items={ctrl.items}
          selected={ctrl.selectedItem}
          history={ctrl.history}
          suppliers={ctrl.suppliers}
          loading={ctrl.loading}
          saving={ctrl.saving}
          onSelect={ctrl.handleSelectItem}
          onAddPrice={ctrl.handleAddManualPrice}
        />
      )}

      {tab === "importexport" && (
        <CostosImportExport
          items={ctrl.items}
          importRows={ctrl.importRows}
          saving={ctrl.saving}
          onResolve={ctrl.handleResolveImport}
          onApply={ctrl.handleApplyImport}
          onClear={() => ctrl.setImportRows([])}
        />
      )}

    </div>
  );
}
