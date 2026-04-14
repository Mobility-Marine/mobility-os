import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import type { PurchaseOrder } from "../types/ordenes-compra.types";
import TemplateOrdenCompra from "../components/TemplateOrdenCompra";

export async function generateAndDownloadPOPDF(
  order: PurchaseOrder,
  settings?: any
): Promise<void> {
  const doc  = createElement(TemplateOrdenCompra, { order, settings });
  const blob = await pdf(doc as any).toBlob();
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = `${order.po_number}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
