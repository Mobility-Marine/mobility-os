import type { Order } from "../types/orders.types";
import type { POTemplate } from "../types/orders.types";

export async function generateAndDownloadPO(
  order: Order, settings: any, template: POTemplate = "elegante"
): Promise<void> {
  const { pdf }           = await import("@react-pdf/renderer");
  const { createElement } = await import("react");

  let Template: any;
  if (template === "moderna")      Template = (await import("../components/templates/POModerna")).default;
  else if (template === "corporativa") Template = (await import("../components/templates/POCorporativa")).default;
  else                             Template = (await import("../components/templates/POElegante")).default;

  const doc  = createElement(Template, { order, settings });
  const blob = await pdf(doc as any).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${order.order_number}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
