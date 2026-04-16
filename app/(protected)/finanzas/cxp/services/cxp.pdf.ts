import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import type { AccountPayable } from "../types/cxp.types";
import type { CompanySettings } from "../../../comercial/cotizaciones/types/quotations.types";

export async function generateEstadoCuentaProveedorPDF(
  supplier: { name: string; rfc?: string | null; type: string },
  records:  AccountPayable[],
  payments: any[],
  settings: CompanySettings | null,
): Promise<void> {
  const { default: Template } = await import("../components/CxPEstadoCuentaPDF");
  const generatedAt = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
  const doc  = createElement(Template, { supplier, records, payments, settings, generatedAt });
  const blob = await pdf(doc as any).toBlob();
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = `Estado-Proveedor-${supplier.name.replace(/\s+/g, "_")}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
