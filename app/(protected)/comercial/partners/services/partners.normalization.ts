// ════════════════════════════════════════════════════════════════════════
// PARTNERS NORMALIZATION — Filtrado/búsqueda/orden in-memory
// ════════════════════════════════════════════════════════════════════════

import type {
  PartnerListItem,
  PartnerFilters,
  PartnerStats,
} from "../types/partners.types";
import {
  emptyPartnerStats,
  computePartnerStatus,
  countRoles,
} from "../types/partners.types";

function normalize(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function filterPartners(
  partners: PartnerListItem[],
  filters: PartnerFilters,
): PartnerListItem[] {
  const search = normalize(filters.search);

  return partners.filter((p) => {
    if (filters.role === "customer"  && !p.is_customer)           return false;
    if (filters.role === "supplier"  && !p.is_supplier)           return false;
    if (filters.role === "logistics" && !p.is_logistics_provider) return false;

    if (filters.status !== "all" && p.status !== filters.status) return false;
    if (filters.industry !== "all" && p.industry !== filters.industry) return false;
    if (filters.country !== "all" && p.country !== filters.country) return false;

    if (search) {
      const haystack = [
        p.name,
        p.legal_name,
        p.rfc,
        p.email,
        p.phone,
      ].map(normalize).join(" ");
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

export function sortPartners(
  partners: PartnerListItem[],
  sortBy: "name" | "recent" | "rating" = "name",
): PartnerListItem[] {
  const out = [...partners];
  switch (sortBy) {
    case "name":
      out.sort((a, b) => normalize(a.name).localeCompare(normalize(b.name)));
      break;
    case "recent":
      out.sort((a, b) => {
        const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bd - ad;
      });
      break;
    case "rating":
      out.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
  }
  return out;
}

export function computeStats(partners: PartnerListItem[]): PartnerStats {
  const stats = emptyPartnerStats();
  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  for (const p of partners) {
    stats.total++;
    if (p.status === "active")   stats.active++;
    if (p.status === "inactive") stats.inactive++;

    if (p.is_customer)           stats.customers++;
    if (p.is_supplier)           stats.suppliers++;
    if (p.is_logistics_provider) stats.logistics++;

    if (countRoles(p) >= 2)      stats.dual_roles++;

    if (p.rfc)                   stats.with_rfc++;
    if (p.email)                 stats.with_email++;
    if (p.validation_69b_status === "clean") stats.with_69b_validation++;

    if (p.created_at) {
      const created = new Date(p.created_at).getTime();
      if (now - created < THIRTY_DAYS_MS) stats.created_last_30_days++;
    }
  }

  return stats;
}

export function mapRowToListItem(row: Record<string, unknown>): PartnerListItem {
  const partner = {
    id:                    row.id                   as string,
    name:                  (row.name                as string) ?? "",
    legal_name:            row.legal_name           as string | undefined,
    rfc:                   row.rfc                  as string | undefined,
    email:                 row.email                as string | undefined,
    phone:                 row.phone                as string | undefined,
    industry:              row.industry             as PartnerListItem["industry"],
    country:               row.country              as string | undefined,
    is_customer:           Boolean(row.is_customer),
    is_supplier:           Boolean(row.is_supplier),
    is_logistics_provider: Boolean(row.is_logistics_provider),
    is_active:             Boolean(row.is_active ?? true),
    rating:                row.rating               as number | undefined,
    validation_69b_status: row.validation_69b_status as PartnerListItem["validation_69b_status"],
    created_at:            row.created_at           as string | undefined,
  };

  return {
    ...partner,
    status:     computePartnerStatus(partner),
    role_count: countRoles(partner),
  };
}

export function extractAvailableFilters(partners: PartnerListItem[]): {
  industries: string[];
  countries:  string[];
} {
  const industries = new Set<string>();
  const countries  = new Set<string>();
  for (const p of partners) {
    if (p.industry) industries.add(p.industry);
    if (p.country)  countries.add(p.country);
  }
  return {
    industries: Array.from(industries).sort(),
    countries:  Array.from(countries).sort(),
  };
}