// ============================================================
// QUOTATIONS PDF — Selector de plantilla + descarga
// 6 plantillas: 3 productos × 3 servicios
// ============================================================

import { pdf } from "@react-pdf/renderer";
import type { Quotation, CompanySettings, QuotationTemplate } from "../types/quotations.types";

// Importaciones dinámicas para reducir bundle size
async function getTemplate(type: "products" | "services", template: QuotationTemplate) {
  if (type === "products") {
    if (template === "elegante")     return (await import("../components/templates/TemplateEleganteProductos")).default;
    if (template === "moderna")      return (await import("../components/templates/TemplateModernaProductos")).default;
    return (await import("../components/templates/TemplateCorporativaProductos")).default;
  } else {
    if (template === "elegante")     return (await import("../components/templates/TemplateEleganteServicios")).default;
    if (template === "moderna")      return (await import("../components/templates/TemplateModernaServicios")).default;
    return (await import("../components/templates/TemplateCorporativaServicios")).default;
  }
}

export async function generateAndDownloadPDF(
  quotation: Quotation,
  settings?: CompanySettings | null
): Promise<void> {
  const Template = await getTemplate(quotation.type, quotation.template ?? "elegante");
  const { createElement } = await import("react");

  const doc   = createElement(Template, { quotation, settings });
  const blob  = await pdf(doc as any).toBlob();
  const url   = URL.createObjectURL(blob);
  const link  = document.createElement("a");
  link.href     = url;
  link.download = `${quotation.quote_number}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
