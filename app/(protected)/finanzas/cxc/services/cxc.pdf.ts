import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import type { AccountReceivable, ARPayment } from "../types/cxc.types";
import type { CompanySettings } from "../../../comercial/cotizaciones/types/quotations.types";

export async function generateEstadoCuentaPDF(
  client:   { name: string; rfc?: string | null; email?: string | null },
  records:  AccountReceivable[],
  payments: ARPayment[],
  settings: CompanySettings | null,
): Promise<void> {
  const { default: Template } = await import("../components/CxCEstadoCuentaPDF");
  const generatedAt = new Date().toLocaleDateString("es-MX", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const doc  = createElement(Template, { client, records, payments, settings, generatedAt });
  const blob = await pdf(doc as any).toBlob();
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = `Estado-Cuenta-${client.name.replace(/\s+/g, "_")}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
