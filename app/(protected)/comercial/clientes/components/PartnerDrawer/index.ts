// ════════════════════════════════════════════════════════════════════════
// PartnerDrawer — Public API
// ════════════════════════════════════════════════════════════════════════
// Punto de entrada público del módulo. Solo se exporta lo que otros
// módulos necesitan consumir.
// ════════════════════════════════════════════════════════════════════════

export { PartnerDrawer } from "./PartnerDrawer";
export type { PartnerDrawerProps } from "./PartnerDrawer";

export type {
  Partner,
  PartnerTab,
  PartnerRoleFlag,
  ValidationSATStatus,
  Validation69BStatus,
  Incoterm,
  Industry,
  PartnerContact,
  PartnerContactRole,
  PartnerAddress,
  AddressType,
  CreatePartnerPayload,
  UpdatePartnerPayload,
  TabValidationState,
  TabConfig,
} from "./types";

export {
  PARTNER_TABS,
  INCOTERMS,
  INDUSTRIES,
  INDUSTRY_LABELS,
  CONTACT_ROLE_LABELS,
  ADDRESS_TYPE_LABELS,
  VALIDATION_69B_CONFIG,
} from "./types";