// ════════════════════════════════════════════════════════════════════════
// /abastecimiento/proveedores — Redirect al módulo unificado Partners
// ════════════════════════════════════════════════════════════════════════
// Antes este módulo gestionaba proveedores como entidad separada.
// Después del Commit #5 (Fase 7), proveedores se unificaron con clientes
// y proveedores logísticos en business_partners (regla ERP nivel SAP/Oracle:
// una persona/empresa = un registro, sin importar rol).
//
// Esta página redirige a /comercial/partners?role=supplier para que los
// links existentes, bookmarks o enlaces internos sigan funcionando.
// ════════════════════════════════════════════════════════════════════════

import { redirect } from "next/navigation";

export default function ProveedoresRedirectPage() {
  redirect("/comercial/partners?role=supplier");
}