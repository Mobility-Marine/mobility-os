// ============================================================
// QUOTATIONS PDF — Mobility OS
// Template universal por tipo de cotización
// ============================================================
import { pdf } from "@react-pdf/renderer";
import type { Quotation, CompanySettings } from "../types/quotations.types";

async function getTemplate(quotation: Quotation) {
  if (quotation.type === "products") {
    return (await import("../components/templates/TemplateEleganteProductos")).default;
  }
  // Servicios — template universal con soporte para todos los subtipos
  return (await import("../components/templates/TemplateServicios")).default;
}

export async function generateAndDownloadPDF(
  quotation: Quotation,
  settings?: CompanySettings | null
): Promise<void> {
  const Template = await getTemplate(quotation);
  const { createElement } = await import("react");
  const doc  = createElement(Template, { quotation, settings });
  const blob = await pdf(doc as any).toBlob();
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = `${quotation.quote_number}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
