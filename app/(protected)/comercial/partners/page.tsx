// ════════════════════════════════════════════════════════════════════════
// /comercial/partners/page.tsx — Página principal del módulo unificado
// ════════════════════════════════════════════════════════════════════════
// Layout completo del módulo (Sub-lote 5D):
//   ┌──────────────────────────────────────────────────────────────────┐
//   │  PartnerCommandCenter (KPIs + Acciones)                          │
//   ├──────────────────────────────────────────────────────────────────┤
//   │ Sidebar (340px)        │  Workspace (flex: 1)                    │
//   │ - Tabs por rol         │  - PartnerWorkspace (con tabs internos) │
//   │ - Búsqueda + filtros   │  - Botón "✎ Editar" abre PartnerDrawer  │
//   │ - Lista                │                                         │
//   └──────────────────────────────────────────────────────────────────┘
//
// El PartnerDrawer wizard ERP-grade ahora SÍ está conectado:
//   - Botón "+ Nuevo Partner" en CommandCenter → abre drawer en CREATE
//   - Botón "✎ Editar" en Workspace → abre drawer en EDIT
//   - Al guardar, refresca el listado y mantiene la selección
// ════════════════════════════════════════════════════════════════════════
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import { usePartnersController } from "./services/partners.controller";
import {
  filterPartners,
  sortPartners,
  computeStats,
} from "./services/partners.normalization";
import {
  DEFAULT_PARTNER_FILTERS,
} from "./types/partners.types";
import type {
  PartnerFilters,
  PartnerRoleFilter,
} from "./types/partners.types";

import PartnerCommandCenter from "./components/PartnerCommandCenter";
import PartnerSidebar       from "./components/PartnerSidebar";
import PartnerWorkspace     from "./components/PartnerWorkspace";
import PartnerImportExport  from "./components/PartnerImportExport";
import { PartnerDrawer }    from "./components/PartnerDrawer";

// ── Estilos ───────────────────────────────────────────────────────────
const PAGE: CSSProperties = {
  display:        "flex",
  flexDirection:  "column",
  gap:            "16px",
  padding:        "20px 24px",
  height:         "100vh",
  background:     "var(--color-bg-base)",
  boxSizing:      "border-box",
};

const LAYOUT: CSSProperties = {
  display:        "grid",
  gridTemplateColumns: "340px 1fr",
  gap:            "16px",
  flex:           1,
  minHeight:      0,
};

const WORKSPACE_PLACEHOLDER: CSSProperties = {
  display:         "flex",
  alignItems:      "center",
  justifyContent:  "center",
  height:          "100%",
  borderRadius:    "var(--radius-lg, 12px)",
  border:          "1px dashed var(--color-border)",
  background:      "var(--color-bg-elevated)",
  color:           "var(--color-text-muted)",
  fontSize:        "14px",
  textAlign:       "center",
  padding:         "40px",
  flexDirection:   "column",
  gap:             "8px",
};

// ── Wrapper con Suspense (requerido por useSearchParams en Next.js 14) ──
// Next.js 14 requiere que cualquier componente que use useSearchParams()
// esté envuelto en <Suspense> para soportar el prerender estático.
// Aunque esta página siempre se renderiza dinámicamente (está dentro de
// (protected) y depende del tenant activo), el wrapper es obligatorio
// para que Next.js no marque la build como fallida.
export default function PartnersPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            height:         "100vh",
            color:          "var(--color-text-muted)",
            fontSize:       "13px",
          }}
        >
          ⏳ Cargando módulo Partners...
        </div>
      }
    >
      <PartnersPageContent />
    </Suspense>
  );
}

// ── Página real ──────────────────────────────────────────────────────
function PartnersPageContent() {
  const ctrl                  = usePartnersController();
  const searchParams          = useSearchParams();
  const tenant                = useTenant() as Record<string, unknown>;
  const companyName           = (tenant?.company_name as string | undefined)
                             ?? (tenant?.companyName  as string | undefined)
                             ?? undefined;
  const [showImportExport, setShowImportExport] = useState(false);

  // ── Estado del PartnerDrawer ─────────────────────────────────────
  // partnerIdToEdit:
  //   - undefined  → drawer cerrado
  //   - null       → drawer abierto en modo CREATE
  //   - "uuid..."  → drawer abierto en modo EDIT
  const [drawerPartnerId, setDrawerPartnerId] = useState<string | null | undefined>(undefined);
  const drawerOpen = drawerPartnerId !== undefined;

  // Leer ?role= del URL para filtro inicial
  const roleParam: PartnerRoleFilter = (() => {
    const r = searchParams.get("role") ?? "all";
    const valid: PartnerRoleFilter[] = ["all", "customer", "supplier", "logistics"];
    return valid.includes(r as PartnerRoleFilter) ? (r as PartnerRoleFilter) : "all";
  })();

  const [filters, setFilters] = useState<PartnerFilters>({
    ...DEFAULT_PARTNER_FILTERS,
    role: roleParam,
  });

  useEffect(() => {
    if (roleParam !== filters.role) {
      setFilters((f) => ({ ...f, role: roleParam }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleParam]);

  const filtered = useMemo(
    () => sortPartners(filterPartners(ctrl.partners, filters), "name"),
    [ctrl.partners, filters],
  );
  const stats = useMemo(() => computeStats(ctrl.partners), [ctrl.partners]);

  // ── Handlers del drawer ──────────────────────────────────────────
  // Abrir en modo CREATE (sin partnerId)
  const handleNewPartner = () => {
    setDrawerPartnerId(null);
  };

  // Abrir en modo EDIT con un partner específico
  const handleEditPartner = (partnerId: string) => {
    setDrawerPartnerId(partnerId);
  };

  const handleCloseDrawer = () => {
    setDrawerPartnerId(undefined);
  };

  // Tras guardar (CREATE o EDIT), refrescamos el listado y seleccionamos
  // el partner guardado para mantener al usuario en contexto.
  const handlePartnerSaved = async (saved: { id?: string }) => {
    if (saved.id) {
      await ctrl.onPartnerSaved(saved.id);
    }
  };

  // Toggle activar/desactivar partner directamente en BD
  const handleToggleActive = async (partnerId: string, newActive: boolean) => {
    if (!ctrl.companyId) return;
    const { error } = await supabase
      .from("business_partners")
      .update({ is_active: newActive })
      .eq("id", partnerId)
      .eq("company_id", ctrl.companyId);
    if (error) {
      // eslint-disable-next-line no-alert
      alert("Error al actualizar el estado: " + error.message);
      return;
    }
    await ctrl.refresh();
  };

  return (
    <div style={PAGE}>
      <PartnerCommandCenter
        stats={stats}
        loading={ctrl.loading}
        companyName={companyName}
        onNewPartner={handleNewPartner}
        onImportExport={() => setShowImportExport(true)}
      />

      <div style={LAYOUT}>
        <PartnerSidebar
          partners={filtered}
          allPartners={ctrl.partners}
          stats={stats}
          filters={filters}
          selectedId={ctrl.selectedId}
          onFiltersChange={setFilters}
          onSelectPartner={ctrl.selectPartner}
        />

        {ctrl.selectedPartner ? (
          <PartnerWorkspace
            partner={ctrl.selectedPartner}
            companyId={ctrl.companyId}
            onEditPartner={handleEditPartner}
            onToggleActive={handleToggleActive}
          />
        ) : (
          <div style={WORKSPACE_PLACEHOLDER}>
            <div style={{ fontSize: "48px", opacity: 0.3 }}>👈</div>
            <div>Selecciona un partner del sidebar para ver su detalle</div>
          </div>
        )}
      </div>

      {/* ─── Modal Import/Export ─── */}
      <PartnerImportExport
        open={showImportExport}
        onClose={() => setShowImportExport(false)}
        companyId={ctrl.companyId}
        partners={filtered}
        onImportDone={() => {
          void ctrl.refresh();
        }}
      />

      {/* ─── PartnerDrawer ERP-grade (wizard de 10 tabs) ─── */}
      <PartnerDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        companyId={ctrl.companyId}
        partnerId={drawerPartnerId ?? undefined}
        userId={ctrl.userId}
        onSaved={handlePartnerSaved}
      />
    </div>
  );
}