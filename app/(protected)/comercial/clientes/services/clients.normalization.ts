// ============================================================
// CLIENTS NORMALIZATION v1 — GOD LEVEL
// ============================================================

import type { Client, ClientFilters } from "../types/clients.types";

export function getClientRole(c: Client): "customer" | "supplier" | "both" | "none" {
  if (c.is_customer && c.is_supplier) return "both";
  if (c.is_customer) return "customer";
  if (c.is_supplier) return "supplier";
  return "none";
}

export function filterClients(
  clients: Client[],
  filters: Partial<ClientFilters>
): Client[] {
  const q = (filters.search ?? "").trim().toLowerCase();
  return clients.filter((c) => {
    if (filters.onlyActive && !c.is_active) return false;
    if (filters.role && filters.role !== "all") {
      if (filters.role === "customer" && !c.is_customer) return false;
      if (filters.role === "supplier" && !c.is_supplier) return false;
      if (filters.role === "both" && !(c.is_customer && c.is_supplier)) return false;
    }
    if (q) {
      return (
        c.name?.toLowerCase().includes(q) ||
        c.legal_name?.toLowerCase().includes(q) ||
        c.rfc?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

export function getClientInitials(c: Client): string {
  const parts = (c.name || "?").split(" ").filter(Boolean);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : (parts[0]?.[0] ?? "?").toUpperCase();
}

export function hasCompleteProfile(c: Client): boolean {
  return !!(c.legal_name && c.rfc && c.email && c.phone);
}
