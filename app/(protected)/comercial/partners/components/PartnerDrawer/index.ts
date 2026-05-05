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

// Banking + Documents (servicios + tipos)
export type { PartnerBanking } from "./services/partner-banking.service";
export type { PartnerDocument, DocumentTypeOption } from "./services/partner-documents.service";
export { DOCUMENT_TYPES } from "./services/partner-documents.service";

// Evaluations (multi-criterio histórico)
export type {
  PartnerEvaluation,
  EvaluationRecommendation,
  PartnerEvaluationStats,
} from "./services/partner-evaluations.service";
export {
  EVALUATION_CRITERIA,
  RECOMMENDATION_OPTIONS,
  computeOverallScore,
  computeEvaluationStats,
  suggestRecommendation,
} from "./services/partner-evaluations.service";

// Customer 360
export type { PartnerSummary, RecentOperation } from "./services/partner-summary.service";
export { computePartnerSummary } from "./services/partner-summary.service";