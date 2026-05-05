// ════════════════════════════════════════════════════════════════════════
// /logistica/proveedores-logisticos — Redirect al módulo unificado Partners
// ════════════════════════════════════════════════════════════════════════
// Antes este módulo gestionaba proveedores logísticos como entidad
// separada. Después del Commit #5 (Fase 7), todos los partners viven
// en business_partners con flags de rol (is_customer, is_supplier,
// is_logistics_provider).
//
// Esta página redirige a /comercial/partners?role=logistics para que los
// links existentes, bookmarks o enlaces internos sigan funcionando.
// ════════════════════════════════════════════════════════════════════════

import { redirect } from "next/navigation";

export default function ProveedoresLogisticosRedirectPage() {
  redirect("/comercial/partners?role=logistics");
}