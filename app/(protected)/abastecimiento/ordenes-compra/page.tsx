"use client";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import { fetchCompanySettings } from "@/app/(protected)/comercial/cotizaciones/services/quotations.service";
import type { POFilters } from "./types/ordenes-compra.types";
import { DEFAULT_PO_FILTERS } from "./types/ordenes-compra.types";
import { usePOController } from "./services/ordenes-compra.controller";
import OrdenesCompraStats      from "./components/OrdenesCompraStats";
import OrdenesCompraList       from "./components/OrdenesCompraList";
import OrdenCompraCreateDrawer from "./components/OrdenCompraCreateDrawer";
import OrdenCompraWorkspace    from "./components/OrdenCompraWorkspace";

export default function OrdenesCompraPage() {
  const { lang } = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [userId,     setUserId]     = useState("");
  const [filters,    setFilters]    = useState<POFilters>(DEFAULT_PO_FILTERS);
  const [showCreate, setShowCreate] = useState(false);
  const [settings,   setSettings]   = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  useEffect(() => {
    if (!companyId) return;
    fetchCompanySettings(companyId).then(setSettings);
  }, [companyId]);

  const ctrl = usePOController(companyId ?? "", userId);

  useEffect(() => {
    if (!companyId) return;
    ctrl.load(filters);
  }, [companyId, filters]);

  const handleFilter = useCallback((partial: Partial<POFilters>) => {
    setFilters((p) => ({ ...p, ...partial }));
  }, []);

  // Vista workspace
  if (ctrl.selected) {
    return (
      <div style={{ padding: "24px 32px", height: "100%", overflowY: "auto" }}>
        <OrdenCompraWorkspace
          order={ctrl.selected}
          saving={ctrl.saving}
          filters={filters}
          settings={settings}
          onUpdate={ctrl.handleUpdate}
          onApprove={ctrl.handleApprove}
          onSend={ctrl.handleSend}
          onCancel={ctrl.handleCancel}
          onClose={() => ctrl.setSelected(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
          {es ? "Órdenes de Compra" : "Purchase Orders"}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
          {es
            ? "Gestión completa del ciclo de compras: creación, aprobación, envío y seguimiento."
            : "Complete purchase cycle management: creation, approval, sending and tracking."}
        </p>
      </div>

      {ctrl.error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
          {ctrl.error}
        </div>
      )}

      <OrdenesCompraStats stats={ctrl.stats} />

      <OrdenesCompraList
        orders={ctrl.orders}
        suppliers={ctrl.suppliers}
        loading={ctrl.loading}
        filters={filters}
        onFilter={handleFilter}
        onSelect={(o) => ctrl.loadDetail(o.id)}
        onNew={() => setShowCreate(true)}
      />

      <OrdenCompraCreateDrawer
        open={showCreate}
        suppliers={ctrl.suppliers}
        saving={ctrl.saving}
        onClose={() => setShowCreate(false)}
        onCreate={async (payload, items) => {
          await ctrl.handleCreate(payload, items, filters);
          setShowCreate(false);
        }}
      />
    </div>
  );
}
