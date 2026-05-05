// ════════════════════════════════════════════════════════════════════════
// PartnerDrawer — Barrel export
// ════════════════════════════════════════════════════════════════════════
// Punto de entrada único del módulo. Permite importar desde fuera con:
//   import { PartnerDrawer } from "@/.../PartnerDrawer";
//   import type { Partner } from "@/.../PartnerDrawer";
// ════════════════════════════════════════════════════════════════════════

// Componente principal
export { PartnerDrawer } from "./PartnerDrawer";
export type { PartnerDrawerProps } from "./PartnerDrawer";

// Tipos del dominio
export type {
  Partner,
  PartnerTab,
  PartnerRoleFlag,
  PartnerContactRole,
  CreatePartnerPayload,
  UpdatePartnerPayload,
  TabValidationState,
  TabConfig,
  ValidationSATStatus,
  Validation69BStatus,
  Incoterm,
  Industry,
} from "./types";

// Constantes útiles
export {
  PARTNER_TABS,
  INCOTERMS,
  INDUSTRIES,
  INDUSTRY_LABELS,
  VALIDATION_69B_CONFIG,
} from "./types";

// Hook (por si se quiere usar el wizard sin el drawer visual)
export { usePartnerDrawer } from "./usePartnerDrawer";
export type {
  UsePartnerDrawerOptions,
  UsePartnerDrawerReturn,
} from "./usePartnerDrawer";

// Service (por si se quiere usar fuera del drawer)
export {
  createPartner,
  updatePartner,
  fetchPartnerById,
  findPartnerByRFC,
  validateSATData,
} from "./services/partner.service";
export type { SATValidationResult } from "./services/partner.service";