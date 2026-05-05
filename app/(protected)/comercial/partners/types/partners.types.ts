// ════════════════════════════════════════════════════════════════════════
// PARTNERS MODULE — Types
// ════════════════════════════════════════════════════════════════════════
// Módulo unificado /comercial/partners — gestión multi-rol de
// business_partners (clientes, proveedores, logísticos).
//
// Reutiliza los tipos del PartnerDrawer (Partner, PartnerContact,
// PartnerAddress, etc.) y agrega los específicos del módulo de listado:
//   - PartnerStatus
//   - PartnerRoleFilter (filtro por rol del sidebar tabs)
//   - PartnerFilters (búsqueda + status + industry + país)
//   - PartnerStats (KPIs del CommandCenter)
//   - PartnerListItem (proyección ligera para sidebar)
// ════════════════════════════════════════════════════════════════════════

import type { Partner, Industry } from "../components/PartnerDrawer/types";

export type { Partner, Industry } from "../components/PartnerDrawer/types";

// ── Status ────────────────────────────────────────────────────────────
// Estado simplificado calculado a partir de business_partners.is_active
// y otros flags. Útil para badges en el listado.
export type PartnerStatus = "active" | "inactive" | "lead";

// ── Filtro por rol (Tabs del sidebar) ────────────────────────────────
export type PartnerRoleFilter = "all" | "customer" | "supplier" | "logistics";

export const ROLE_FILTER_LABELS: Record<PartnerRoleFilter, { label: string; emoji: string }> = {
  all:       { label: "Todos",       emoji: "🌐" },
  customer:  { label: "Clientes",    emoji: "🤝" },
  supplier:  { label: "Proveedores", emoji: "🏭" },
  logistics: { label: "Logísticos",  emoji: "🚚" },
};

// ── Filtros del listado ──────────────────────────────────────────────
export type PartnerFilters = {
  role:        PartnerRoleFilter;
  search:      string;
  status:      PartnerStatus | "all";
  industry:    Industry | "all";
  country:     string | "all";
  // Filtro avanzado: solo partners con saldo pendiente, etc. (futuro)
  hasOverdue?: boolean;
};

export const DEFAULT_PARTNER_FILTERS: PartnerFilters = {
  role:     "all",
  search:   "",
  status:   "all",
  industry: "all",
  country:  "all",
};

// ── KPIs del CommandCenter ───────────────────────────────────────────
export type PartnerStats = {
  total:                number;
  active:               number;
  inactive:             number;
  customers:            number;
  suppliers:            number;
  logistics:            number;
  dual_roles:           number;
  created_last_30_days: number;
  with_rfc:             number;
  with_email:           number;
  with_69b_validation:  number;
};

export function emptyPartnerStats(): PartnerStats {
  return {
    total:                0,
    active:               0,
    inactive:             0,
    customers:            0,
    suppliers:            0,
    logistics:            0,
    dual_roles:           0,
    created_last_30_days: 0,
    with_rfc:             0,
    with_email:           0,
    with_69b_validation:  0,
  };
}

// ── Proyección ligera para el sidebar ────────────────────────────────
export type PartnerListItem = Pick<
  Partner,
  | "id"
  | "name"
  | "legal_name"
  | "rfc"
  | "email"
  | "phone"
  | "industry"
  | "country"
  | "is_customer"
  | "is_supplier"
  | "is_logistics_provider"
  | "is_active"
  | "rating"
  | "validation_69b_status"
  | "created_at"
> & {
  status:     PartnerStatus;
  role_count: number;
};

// ── Helpers ──────────────────────────────────────────────────────────
export function computePartnerStatus(p: Pick<Partner, "is_active">): PartnerStatus {
  if (p.is_active === false) return "inactive";
  return "active";
}

export function countRoles(p: Pick<Partner, "is_customer" | "is_supplier" | "is_logistics_provider">): number {
  let n = 0;
  if (p.is_customer)           n++;
  if (p.is_supplier)           n++;
  if (p.is_logistics_provider) n++;
  return n;
}

export function rolesText(p: Pick<Partner, "is_customer" | "is_supplier" | "is_logistics_provider">): string {
  const roles: string[] = [];
  if (p.is_customer)           roles.push("Cliente");
  if (p.is_supplier)           roles.push("Proveedor");
  if (p.is_logistics_provider) roles.push("Logístico");
  return roles.length > 0 ? roles.join(" + ") : "Sin rol";
}

export function rolesEmojis(p: Pick<Partner, "is_customer" | "is_supplier" | "is_logistics_provider">): string {
  const out: string[] = [];
  if (p.is_customer)           out.push("🤝");
  if (p.is_supplier)           out.push("🏭");
  if (p.is_logistics_provider) out.push("🚚");
  return out.join("");
}