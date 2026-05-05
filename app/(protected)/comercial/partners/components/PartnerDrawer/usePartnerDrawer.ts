// ════════════════════════════════════════════════════════════════════════
// usePartnerDrawer — Hook con estado del wizard multi-paso
// ════════════════════════════════════════════════════════════════════════
// Maneja:
//   - Estado del partner (datos principales)
//   - Estado de contactos múltiples (en memoria, persistencia al save)
//   - Estado de direcciones múltiples (en memoria, persistencia al save)
//   - Estado de bancarios múltiples (en memoria, persistencia al save)
//   - Tab activo y navegación
//   - Validación inline por tab
//   - Detección de duplicados por RFC
//   - Save coordinado (partner → contacts → addresses → banking)
//
// NOTA: Los documentos legales NO se manejan en este hook. TabDocuments
// usa CRUD inmediato porque las subidas de archivos no se pueden deferir.
// ════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type {
  Partner,
  PartnerTab,
  TabValidationState,
  CreatePartnerPayload,
  PartnerContact,
  PartnerAddress,
} from "./types";
import { PARTNER_TABS } from "./types";
import {
  createPartner,
  updatePartner,
  fetchPartnerById,
  findPartnerByRFC,
} from "./services/partner.service";
import {
  listContactsByPartner,
  bulkInsertContacts,
  syncContactsDiff,
} from "./services/partner-contacts.service";
import {
  listAddressesByPartner,
  bulkInsertAddresses,
  syncAddressesDiff,
} from "./services/partner-addresses.service";
import {
  listPartnerBanking,
  bulkInsertBanking,
  syncBankingDiff,
  type PartnerBanking,
} from "./services/partner-banking.service";

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
        return { isValid: false, isComplete: false, errorMessage: "El nombre es obligatorio." };
      }
      const hasRole = partner.is_customer || partner.is_supplier || partner.is_logistics_provider;
      if (!hasRole) {
        return { isValid: false, isComplete: false, errorMessage: "Debe seleccionar al menos un rol." };
      }
      return { isValid: true, isComplete: true };
    }

    case "fiscal": {
      // Solo obligatorio para clientes (se les facturará)
      if (!partner.is_customer) return { isValid: true, isComplete: true };
      const missing: string[] = [];
      if (!partner.rfc)        missing.push("RFC");
      if (!partner.legal_name) missing.push("razón social");
      if (!partner.tax_regime) missing.push("régimen fiscal");
      if (!partner.zip_code)   missing.push("CP fiscal");
      if (missing.length > 0) {
        return {
          isValid: false,
          isComplete: false,
          errorMessage: `Faltan campos fiscales: ${missing.join(", ")}.`,
        };
      }
      return { isValid: true, isComplete: true };
    }

    default:
      return { isValid: true, isComplete: false };
  }
}

// ── Opciones del hook ────────────────────────────────────────────────
export type UsePartnerDrawerOptions = {
  open:       boolean;
  companyId?: string;
  partnerId?: string;
  userId?:    string;
  onSaved?:   (p: Partner) => void;
  onClose?:   () => void;
};

// ── Resultado del hook ───────────────────────────────────────────────
export type UsePartnerDrawerReturn = {
  // Datos
  partner:       Partial<Partner>;
  contacts:      PartnerContact[];
  addresses:     PartnerAddress[];
  banking:       PartnerBanking[];

  // Navegación
  activeTab:     PartnerTab;
  visibleTabs:   typeof PARTNER_TABS;
  tabValidation: Record<PartnerTab, TabValidationState>;

  // Estado de UI
  loading:       boolean;
  saving:        boolean;
  error:         string | null;
  duplicateRFC:  Partner | null;
  canSave:       boolean;
  isEditMode:    boolean;

  // Setters
  patchPartner:      (patch: Partial<Partner>) => void;
  setContacts:       (next: PartnerContact[]) => void;
  setAddresses:      (next: PartnerAddress[]) => void;
  setBanking:        (next: PartnerBanking[]) => void;
  setActiveTab:      (tab: PartnerTab) => void;
  goToNextTab:       () => void;
  goToPreviousTab:   () => void;
  checkDuplicateRFC: (rfc: string) => Promise<void>;
  save:              () => Promise<Partner | null>;
  reset:             () => void;
};

// ── HOOK principal ───────────────────────────────────────────────────
export function usePartnerDrawer(
  opts: UsePartnerDrawerOptions,
): UsePartnerDrawerReturn {
  const { open, companyId, partnerId, userId, onSaved } = opts;

  const [partner,      setPartner]      = useState<Partial<Partner>>(getDefaultPartner());
  const [contacts,     setContacts]     = useState<PartnerContact[]>([]);
  const [addresses,    setAddresses]    = useState<PartnerAddress[]>([]);
  const [banking,      setBanking]      = useState<PartnerBanking[]>([]);
  const [activeTab,    setActiveTab]    = useState<PartnerTab>("identity");
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [duplicateRFC, setDuplicateRFC] = useState<Partner | null>(null);

  const isEditMode = Boolean(partnerId);

  // ── Cargar partner + contacts + addresses + banking si modo EDIT ──
  useEffect(() => {
    if (!open) return;

    if (!partnerId) {
      // Modo CREATE: reset
      setPartner(getDefaultPartner());
      setContacts([]);
      setAddresses([]);
      setBanking([]);
      setActiveTab("identity");
      setError(null);
      setDuplicateRFC(null);
      return;
    }
    if (!companyId) return;

    // Modo EDIT: cargar todo en paralelo
    setLoading(true);
    setError(null);

    Promise.all([
      fetchPartnerById(companyId, partnerId),
      listContactsByPartner(companyId, partnerId),
      listAddressesByPartner(companyId, partnerId),
      listPartnerBanking(companyId, partnerId).catch(() => [] as PartnerBanking[]),
    ])
      .then(([p, ctcs, addrs, bnks]) => {
        if (p) {
          setPartner(p);
          setContacts(ctcs);
          setAddresses(addrs);
          setBanking(bnks);
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

  // ── Tabs visibles según roles ─────────────────────────────────────
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

  // ── Habilitar guardar ─────────────────────────────────────────────
  const canSave = useMemo(() => {
    return visibleTabs
      .filter((t) => t.required)
      .every((t) => tabValidation[t.id].isValid);
  }, [visibleTabs, tabValidation]);

  // ── Patch partner ─────────────────────────────────────────────────
  const patchPartner = useCallback((patch: Partial<Partner>) => {
    setPartner((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── Verificar duplicado por RFC ────────────────────────────────────
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

  // ── Reset ─────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setPartner(getDefaultPartner());
    setContacts([]);
    setAddresses([]);
    setBanking([]);
    setActiveTab("identity");
    setError(null);
    setDuplicateRFC(null);
  }, []);

  // ── Guardar (create o update) ─────────────────────────────────────
  // En CREATE: insert partner → bulkInsert contacts → addresses → banking
  // En EDIT:   update partner → syncDiff contacts → addresses → banking
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
        // ── UPDATE ─────────────────────────────────────────────────
        saved = await updatePartner(companyId, partnerId, partner);
        await syncContactsDiff(companyId, partnerId, contacts, userId);
        await syncAddressesDiff(companyId, partnerId, addresses, userId);
        await syncBankingDiff(companyId, partnerId, banking);
      } else {
        // ── CREATE ─────────────────────────────────────────────────
        const payload: CreatePartnerPayload = {
          ...partner,
          name:                  partner.name ?? "",
          is_customer:           partner.is_customer           ?? false,
          is_supplier:           partner.is_supplier           ?? false,
          is_logistics_provider: partner.is_logistics_provider ?? false,
          is_active:             partner.is_active             ?? true,
        };
        saved = await createPartner(companyId, payload, userId);

        // Insertar todos los hijos referenciando el nuevo partner
        if (saved.id) {
          if (contacts.length > 0) {
            await bulkInsertContacts(companyId, saved.id, contacts, userId);
          }
          if (addresses.length > 0) {
            await bulkInsertAddresses(companyId, saved.id, addresses, userId);
          }
          if (banking.length > 0) {
            await bulkInsertBanking(companyId, saved.id, banking);
          }
        }
      }

      onSaved?.(saved);
      return saved;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setSaving(false);
    }
  }, [companyId, canSave, isEditMode, partnerId, partner, contacts, addresses, banking, userId, onSaved]);

  return {
    partner,
    contacts,
    addresses,
    banking,
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
    setContacts,
    setAddresses,
    setBanking,
    setActiveTab,
    goToNextTab,
    goToPreviousTab,
    checkDuplicateRFC,
    save,
    reset,
  };
}