// ============================================================
// QUOTATIONS PDF — Plantilla única Mobility OS
// ============================================================
import { pdf } from "@react-pdf/renderer";
import type { Quotation, CompanySettings } from "../types/quotations.types";

async function getTemplate(type: "products" | "services") {
  if (type === "products") {
    return (await import("../components/templates/TemplateEleganteProductos")).default;
  } else {
    return (await import("../components/templates/TemplateEleganteServicios")).default;
  }
}

export async function generateAndDownloadPDF(
  quotation: Quotation,
  settings?: CompanySettings | null
): Promise<void> {
  const Template = await getTemplate(quotation.type);
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
