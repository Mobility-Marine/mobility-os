// ════════════════════════════════════════════════════════════════════════
// PartnerDrawer — Componente principal del wizard unificado
// ════════════════════════════════════════════════════════════════════════
// Drawer lateral con wizard multi-paso para crear/editar Business Partners.
// Funciona en modo CREATE (sin partnerId) o EDIT (con partnerId).
//
// Estructura visual:
//   ┌─────────────────────────────────────────┐
//   │ Header: 🤝 Nuevo partner | Cerrar (✕)   │
//   ├─────────────────────────────────────────┤
//   │ TabsNav: 🆔 Identidad | 📋 Fiscal | ... │
//   ├─────────────────────────────────────────┤
//   │                                         │
//   │  Contenido del tab activo               │
//   │  (TabIdentity, TabFiscal, ...)          │
//   │                                         │
//   ├─────────────────────────────────────────┤
//   │ WizardFooter: ← Anterior | Sig → | Save │
//   └─────────────────────────────────────────┘
//
// Cierre con ESC o clic fuera del drawer.
// ════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";
import type { Partner } from "./types";
import { usePartnerDrawer } from "./usePartnerDrawer";
import { TabsNav } from "./components/TabsNav";
import { WizardFooter } from "./components/WizardFooter";
import { TabIdentity } from "./tabs/TabIdentity";

// ── Props ─────────────────────────────────────────────────────────────
export type PartnerDrawerProps = {
  open:       boolean;
  onClose:    () => void;
  companyId?: string;
  partnerId?: string;            // Si presente: modo EDIT
  userId?:    string;
  onSaved?:   (p: Partner) => void;
};

// ── Estilos: overlay + drawer ─────────────────────────────────────────
const OVERLAY_STYLE: CSSProperties = {
  position:        "fixed",
  inset:           0,
  background:      "rgba(0, 0, 0, 0.5)",
  zIndex:          1000,
  display:         "flex",
  justifyContent:  "flex-end",
  animation:       "partnerDrawerOverlayIn 0.2s ease-out",
};

const DRAWER_STYLE: CSSProperties = {
  position:        "relative",
  width:           "min(1100px, 100vw)",
  height:          "100vh",
  background:      "var(--color-bg-base)",
  borderLeft:      "1px solid var(--color-border)",
  display:         "flex",
  flexDirection:   "column",
  boxShadow:       "-8px 0 24px rgba(0, 0, 0, 0.25)",
  animation:       "partnerDrawerIn 0.25s ease-out",
};

const HEADER_STYLE: CSSProperties = {
  display:         "flex",
  alignItems:      "center",
  justifyContent:  "space-between",
  gap:             "12px",
  padding:         "16px 20px",
  borderBottom:    "1px solid var(--color-border)",
  background:      "var(--color-bg-elevated)",
  flexShrink:      0,
};

const TITLE_STYLE: CSSProperties = {
  display:         "flex",
  alignItems:      "center",
  gap:             "10px",
  fontSize:        "16px",
  fontWeight:      700,
  color:           "var(--color-text-primary)",
  letterSpacing:   "-0.2px",
};

const CLOSE_BUTTON_STYLE: CSSProperties = {
  display:         "inline-flex",
  alignItems:      "center",
  justifyContent:  "center",
  width:           "32px",
  height:          "32px",
  borderRadius:    "var(--radius-md)",
  border:          "none",
  background:      "transparent",
  color:           "var(--color-text-muted)",
  fontSize:        "20px",
  cursor:          "pointer",
  outline:         "none",
  transition:      "background 0.15s, color 0.15s",
};

const CONTENT_STYLE: CSSProperties = {
  flex:            1,
  overflowY:       "auto",
  overflowX:       "hidden",
  background:      "var(--color-bg-base)",
};

const PLACEHOLDER_STYLE: CSSProperties = {
  display:         "flex",
  flexDirection:   "column",
  alignItems:      "center",
  justifyContent:  "center",
  gap:             "12px",
  padding:         "60px 20px",
  textAlign:       "center",
  color:           "var(--color-text-muted)",
};

const LOADING_STYLE: CSSProperties = {
  ...PLACEHOLDER_STYLE,
  fontSize:        "14px",
};

// ── Estilo de animación inyectado una sola vez ───────────────────────
const ANIMATION_KEYFRAMES = `
@keyframes partnerDrawerOverlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes partnerDrawerIn {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
`;

// ── Helper: placeholder para tabs aún no implementados ───────────────
function TabPlaceholder({ tabName, phase }: { tabName: string; phase: string }) {
  return (
    <div style={PLACEHOLDER_STYLE}>
      <div style={{ fontSize: "32px", opacity: 0.4 }}>🚧</div>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>
        Tab «{tabName}» — Próximamente
      </div>
      <div style={{ fontSize: "12px", maxWidth: "440px", lineHeight: 1.55 }}>
        Este tab se implementará en la {phase}. La estructura del wizard ya está
        lista para recibirlo.
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────
export function PartnerDrawer({
  open,
  onClose,
  companyId,
  partnerId,
  userId,
  onSaved,
}: PartnerDrawerProps) {
  const drawer = usePartnerDrawer({
    open,
    companyId,
    partnerId,
    userId,
    onSaved,
    onClose,
  });

  // ── Cerrar con ESC ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !drawer.saving) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, drawer.saving]);

  if (!open) return null;

  // ── Click en overlay (no dentro del drawer) cierra ────────────────
  const onOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !drawer.saving) {
      onClose();
    }
  };

  // ── Handler del save: cierra el drawer al guardar exitosamente ────
  const handleSave = async () => {
    const saved = await drawer.save();
    if (saved) onClose();
  };

  // ── Render del tab activo ──────────────────────────────────────────
  const renderActiveTab = () => {
    if (drawer.loading) {
      return <div style={LOADING_STYLE}>⏳ Cargando...</div>;
    }
    switch (drawer.activeTab) {
      case "identity":
        return (
          <TabIdentity
            partner={drawer.partner}
            validation={drawer.tabValidation.identity}
            onPatch={drawer.patchPartner}
          />
        );
      case "fiscal":
        return <TabPlaceholder tabName="Fiscal"      phase="Sub-fase 7.2" />;
      case "contacts":
        return <TabPlaceholder tabName="Contactos"   phase="Sub-fase 7.3" />;
      case "addresses":
        return <TabPlaceholder tabName="Direcciones" phase="Sub-fase 7.3" />;
      case "commercial":
        return <TabPlaceholder tabName="Comerciales" phase="Sub-fase 7.4" />;
      case "banking":
        return <TabPlaceholder tabName="Bancarios"   phase="Sub-fase 7.4" />;
      case "documents":
        return <TabPlaceholder tabName="Documentos"  phase="Sub-fase 7.5" />;
      case "evaluation":
        return <TabPlaceholder tabName="Evaluación"  phase="Sub-fase 7.6" />;
      case "logistics":
        return <TabPlaceholder tabName="Logística"   phase="Sub-fase 7.6" />;
      case "summary":
        return <TabPlaceholder tabName="Resumen"     phase="Sub-fase 7.7" />;
      default:
        return null;
    }
  };

  // ── Título dinámico según modo ─────────────────────────────────────
  const titleText = drawer.isEditMode ? "Editar partner" : "Nuevo partner";

  return (
    <>
      <style>{ANIMATION_KEYFRAMES}</style>
      <div style={OVERLAY_STYLE} onClick={onOverlayClick} role="presentation">
        <aside
          style={DRAWER_STYLE}
          role="dialog"
          aria-modal="true"
          aria-labelledby="partner-drawer-title"
        >
          {/* ── Header ─────────────────────────────────────────────── */}
          <header style={HEADER_STYLE}>
            <div style={TITLE_STYLE} id="partner-drawer-title">
              <span style={{ fontSize: "20px" }}>🤝</span>
              {titleText}
              {drawer.partner.name && (
                <span
                  style={{
                    fontSize:    "13px",
                    fontWeight:  500,
                    color:       "var(--color-text-muted)",
                    marginLeft:  "4px",
                  }}
                >
                  · {drawer.partner.name}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={drawer.saving}
              style={{
                ...CLOSE_BUTTON_STYLE,
                opacity: drawer.saving ? 0.4 : 1,
                cursor:  drawer.saving ? "not-allowed" : "pointer",
              }}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </header>

          {/* ── Tabs nav ────────────────────────────────────────────── */}
          <TabsNav
            tabs={drawer.visibleTabs}
            activeTab={drawer.activeTab}
            onTabClick={drawer.setActiveTab}
            validation={drawer.tabValidation}
          />

          {/* ── Contenido del tab activo ───────────────────────────── */}
          <div style={CONTENT_STYLE}>{renderActiveTab()}</div>

          {/* ── Footer del wizard ──────────────────────────────────── */}
          <WizardFooter
            visibleTabs={drawer.visibleTabs}
            activeTab={drawer.activeTab}
            canSave={drawer.canSave}
            saving={drawer.saving}
            isEditMode={drawer.isEditMode}
            errorMessage={drawer.error}
            onPrevious={drawer.goToPreviousTab}
            onNext={drawer.goToNextTab}
            onSave={handleSave}
            onCancel={onClose}
          />
        </aside>
      </div>
    </>
  );
}