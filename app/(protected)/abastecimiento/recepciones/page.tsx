"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import type { Reception, ReceptionFilters } from "./types/recepciones.types";
import { DEFAULT_RECEPTION_FILTERS } from "./types/recepciones.types";
import { useReceptionsController } from "./services/recepciones.controller";
import RecepcionStats         from "./components/RecepcionStats";
import RecepcionesList        from "./components/RecepcionesList";
import RecepcionCreateDrawer  from "./components/RecepcionCreateDrawer";
import RecepcionWorkspace     from "./components/RecepcionWorkspace";

export default function RecepcionesPage() {
  const { lang } = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [userId,  setUserId]  = useState("");
  const [filters, setFilters] = useState<ReceptionFilters>(DEFAULT_RECEPTION_FILTERS);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  const ctrl = useReceptionsController(companyId ?? "", userId);

  // Carga inicial y cuando cambian filtros
  useEffect(() => {
    if (!companyId) return;
    ctrl.load(filters);
  }, [companyId, filters]);

  const handleFilter = useCallback((partial: Partial<ReceptionFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleSelect = useCallback((r: Reception) => {
    ctrl.loadDetail(r.id);
  }, [ctrl]);

  // Vista: workspace o lista
  if (ctrl.selected) {
    return (
      <div style={{ padding: "24px 32px", height: "100%", overflowY: "auto" }}>
        <RecepcionWorkspace
          reception={ctrl.selected}
          saving={ctrl.saving}
          onUpdate={ctrl.handleUpdate}
          onUpdateItem={ctrl.handleUpdateItem}
          onComplete={ctrl.handleComplete}
          onClose={() => ctrl.setSelected(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
            {es ? "Recepciones de Compras" : "Purchase Receptions"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {es
              ? "Control de calidad, ítems recibidos y trazabilidad completa de cada entrega."
              : "Quality control, received items and full traceability of each delivery."}
          </p>
        </div>
      </div>

      {/* ERROR */}
      {ctrl.error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
          {ctrl.error}
        </div>
      )}

      {/* STATS */}
      <RecepcionStats stats={ctrl.stats} />

      {/* LISTA */}
      <RecepcionesList
        receptions={ctrl.receptions}
        loading={ctrl.loading}
        filters={filters}
        onFilter={handleFilter}
        onSelect={handleSelect}
        onNew={() => setShowCreate(true)}
      />

      {/* DRAWER CREAR */}
      <RecepcionCreateDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={async (payload, items) => {
          await ctrl.handleCreate(payload, items);
          setShowCreate(false);
          ctrl.load(filters);
        }}
      />
    </div>
  );
}
