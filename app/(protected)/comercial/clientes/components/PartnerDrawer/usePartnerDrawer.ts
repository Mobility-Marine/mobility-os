// ════════════════════════════════════════════════════════════════════════
// usePartnerDrawer — Hook con estado del wizard multi-paso
// ════════════════════════════════════════════════════════════════════════
// Maneja:
//   - Estado del partner en edición/creación
//   - Tab activo y navegación
//   - Validación inline por tab
//   - Detección de duplicados por RFC
//   - Persistencia (create/update) vía partner.service.ts
//   - Loading/saving/error states
// ════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type {
  Partner,
  PartnerTab,
  TabValidationState,
  CreatePartnerPayload,
} from "./types";
import { PARTNER_TABS } from "./types";
import {
  createPartner,
  updatePartner,
  fetchPartnerById,
  findPartnerByRFC,
} from "./services/partner.service";

// ── Estado por defecto en modo CREATE ────────────────────────────────
function getDefaultPartner(): Partial<Partner> {
  return {
    name:                  "",
    is_customer:           true,
    is_supplier:           false,
    is_logistics_provider: false,
    is_active:             true,
    currency:              "MXN",
    country:               "México",
    payment_form:          "PPD",
    validation_sat_status: "not_verified",
    validation_69b_status: "not_verified",
  };
}

// ── Validación por tab ────────────────────────────────────────────────
function validateTab(
  tab: PartnerTab,
  partner: Partial<Partner>,
): TabValidationState {
  switch (tab) {
    case "identity": {
      if (!partner.name || partner.name.trim().length < 2) {
        return {
          isValid:      false,
          isComplete:   false,
          errorMessage: "El nombre es obligatorio.",
        };
      }
      const hasRole =
        partner.is_customer ||
        partner.is_supplier ||
        partner.is_logistics_provider;
      if (!hasRole) {
        return {
          isValid:      false,
          isComplete:   false,
          errorMessage: "Debe seleccionar al menos un rol.",
        };
      }
      return { isValid: true, isComplete: true };
    }

    case "fiscal": {
      // Solo obligatorio si el partner es cliente (se le facturará).
      // Si NO es customer, este tab es opcional pero puede llenarse.
      if (!partner.is_customer) {
        return { isValid: true, isComplete: true };
      }
      const missing: string[] = [];
      if (!partner.rfc)        missing.push("RFC");
      if (!partner.legal_name) missing.push("razón social");
      if (!partner.tax_regime) missing.push("régimen fiscal");
      if (!partner.zip_code)   missing.push("CP fiscal");
      if (missing.length > 0) {
        return {
          isValid:      false,
          isComplete:   false,
          errorMessage: `Faltan campos fiscales: ${missing.join(", ")}.`,
        };
      }
      return { isValid: true, isComplete: true };
    }

    // Demás tabs: opcionales en MVP. Sub-fases siguientes agregan reglas.
    default:
      return { isValid: true, isComplete: false };
  }
}

// ── Opciones del hook ────────────────────────────────────────────────
export type UsePartnerDrawerOptions = {
  open:       boolean;
  companyId?: string;
  partnerId?: string; // Si viene → modo EDIT. Si no → modo CREATE.
  userId?:    string;
  onSaved?:   (p: Partner) => void;
  onClose?:   () => void;
};

// ── Resultado del hook ───────────────────────────────────────────────
export type UsePartnerDrawerReturn = {
  partner:       Partial<Partner>;
  activeTab:     PartnerTab;
  visibleTabs:   typeof PARTNER_TABS;
  tabValidation: Record<PartnerTab, TabValidationState>;
  loading:       boolean;
  saving:        boolean;
  error:         string | null;
  duplicateRFC:  Partner | null;
  canSave:       boolean;
  isEditMode:    boolean;

  patchPartner:     (patch: Partial<Partner>) => void;
  setActiveTab:     (tab: PartnerTab) => void;
  goToNextTab:      () => void;
  goToPreviousTab:  () => void;
  checkDuplicateRFC: (rfc: string) => Promise<void>;
  save:             () => Promise<Partner | null>;
  reset:            () => void;
};

// ── HOOK principal ───────────────────────────────────────────────────
export function usePartnerDrawer(
  opts: UsePartnerDrawerOptions,
): UsePartnerDrawerReturn {
  const { open, companyId, partnerId, userId, onSaved } = opts;

  const [partner,      setPartner]      = useState<Partial<Partner>>(getDefaultPartner());
  const [activeTab,    setActiveTab]    = useState<PartnerTab>("identity");
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [duplicateRFC, setDuplicateRFC] = useState<Partner | null>(null);

  const isEditMode = Boolean(partnerId);

  // ── Cargar partner si modo EDIT, reset a defaults si CREATE ───────
  useEffect(() => {
    if (!open) return;

    if (!partnerId) {
      // Modo CREATE: reset
      setPartner(getDefaultPartner());
      setActiveTab("identity");
      setError(null);
      setDuplicateRFC(null);
      return;
    }
    if (!companyId) return;

    // Modo EDIT: cargar de BD
    setLoading(true);
    setError(null);
    fetchPartnerById(companyId, partnerId)
      .then((p) => {
        if (p) {
          setPartner(p);
          setActiveTab("identity");
        } else {
          setError("Partner no encontrado.");
        }
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : String(e)),
      )
      .finally(() => setLoading(false));
  }, [open, companyId, partnerId]);

  // ── Tabs visibles según roles del partner ─────────────────────────
  const visibleTabs = useMemo(() => {
    return PARTNER_TABS.filter((t) => !t.showWhen || t.showWhen(partner));
  }, [partner]);

  // ── Validación de cada tab ────────────────────────────────────────
  const tabValidation = useMemo(() => {
    const map = {} as Record<PartnerTab, TabValidationState>;
    for (const t of PARTNER_TABS) {
      map[t.id] = validateTab(t.id, partner);
    }
    return map;
  }, [partner]);

  // ── Habilitar guardar (todos los required deben ser válidos) ──────
  const canSave = useMemo(() => {
    return visibleTabs
      .filter((t) => t.required)
      .every((t) => tabValidation[t.id].isValid);
  }, [visibleTabs, tabValidation]);

  // ── Patch parcial al partner ──────────────────────────────────────
  const patchPartner = useCallback((patch: Partial<Partner>) => {
    setPartner((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── Verificar duplicado por RFC ───────────────────────────────────
  // Llamar desde el tab Fiscal cuando el RFC pierde foco (onBlur).
  const checkDuplicateRFC = useCallback(
    async (rfc: string) => {
      if (!companyId) {
        setDuplicateRFC(null);
        return;
      }
      const cleanRfc = rfc.trim().toUpperCase();
      if (cleanRfc.length < 12) {
        setDuplicateRFC(null);
        return;
      }
      try {
        const found = await findPartnerByRFC(companyId, cleanRfc, partnerId);
        setDuplicateRFC(found);
      } catch (e) {
        // Silencioso — el duplicado es advisory, no debe bloquear flujo
        // eslint-disable-next-line no-console
        console.warn("[usePartnerDrawer] checkDuplicateRFC error:", e);
        setDuplicateRFC(null);
      }
    },
    [companyId, partnerId],
  );

  // ── Navegación entre tabs ─────────────────────────────────────────
  const goToNextTab = useCallback(() => {
    const idx = visibleTabs.findIndex((t) => t.id === activeTab);
    if (idx >= 0 && idx < visibleTabs.length - 1) {
      setActiveTab(visibleTabs[idx + 1].id);
    }
  }, [visibleTabs, activeTab]);

  const goToPreviousTab = useCallback(() => {
    const idx = visibleTabs.findIndex((t) => t.id === activeTab);
    if (idx > 0) {
      setActiveTab(visibleTabs[idx - 1].id);
    }
  }, [visibleTabs, activeTab]);

  // ── Reset completo ────────────────────────────────────────────────
  const reset = useCallback(() => {
    setPartner(getDefaultPartner());
    setActiveTab("identity");
    setError(null);
    setDuplicateRFC(null);
  }, []);

  // ── Guardar (create o update según modo) ──────────────────────────
  const save = useCallback(async (): Promise<Partner | null> => {
    if (!companyId) {
      setError("No se ha seleccionado empresa activa.");
      return null;
    }
    if (!canSave) {
      setError("Hay tabs obligatorios sin completar.");
      return null;
    }

    setSaving(true);
    setError(null);
    try {
      let saved: Partner;
      if (isEditMode && partnerId) {
        saved = await updatePartner(companyId, partnerId, partner);
      } else {
        // En CREATE necesitamos un payload con name garantizado
        const payload: CreatePartnerPayload = {
          ...partner,
          name:                  partner.name ?? "",
          is_customer:           partner.is_customer           ?? false,
          is_supplier:           partner.is_supplier           ?? false,
          is_logistics_provider: partner.is_logistics_provider ?? false,
          is_active:             partner.is_active             ?? true,
        };
        saved = await createPartner(companyId, payload, userId);
      }
      onSaved?.(saved);
      return saved;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setSaving(false);
    }
  }, [companyId, canSave, isEditMode, partnerId, partner, userId, onSaved]);

  return {
    partner,
    activeTab,
    visibleTabs,
    tabValidation,
    loading,
    saving,
    error,
    duplicateRFC,
    canSave,
    isEditMode,
    patchPartner,
    setActiveTab,
    goToNextTab,
    goToPreviousTab,
    checkDuplicateRFC,
    save,
    reset,
  };
}