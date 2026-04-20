import type { Order } from "../types/orders.types";

export async function generateAndDownloadPO(order: Order, settings: any): Promise<void> {
  const { pdf }           = await import("@react-pdf/renderer");
  const { createElement } = await import("react");
  const { default: POMobilityOS } = await import("../components/templates/POMobilityOS");

  const doc  = createElement(POMobilityOS, { order, settings });
  const blob = await pdf(doc as any).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${order.order_number}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
