"use client";
import type { ServiceOrder } from "../types/service-orders.types";
import { SO_TYPE_CONFIG } from "../types/service-orders.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = { orders: ServiceOrder[] };

export default function SOCommandCenter({ orders }: Props) {
  const { t } = useTranslation();
  const tl    = (t.logistics as any) ?? {};

  const total    = orders.length;
  const drafts   = orders.filter((o) => o.status === "draft").length;
  const sent     = orders.filter((o) => o.status === "sent").length;
  const ccp      = orders.filter((o) => o.order_type === "ccp_carta").length;
  const bol      = orders.filter((o) => o.order_type === "bol_usa").length;
  const aduanal  = orders.filter((o) => o.order_type === "carta_aduanal").length;

  const cards = [
    { label: tl.serviceOrders ?? "Órdenes de servicio", value: total, sub: `${drafts} borradores · ${sent} enviadas`, color: "var(--color-brand-blue)", bar: total > 0 ? sent / total : 0 },
    { label: tl.typeCcpCarta  ?? "CCP + Carta",         value: ccp,   sub: "Transportista MX",         color: SO_TYPE_CONFIG.ccp_carta.color,     bar: total > 0 ? ccp / total : 0 },
    { label: tl.typeBolUsa    ?? "BOL USA",              value: bol,   sub: "Carriers americanos",      color: SO_TYPE_CONFIG.bol_usa.color,        bar: total > 0 ? bol / total : 0 },
    { label: tl.typeCartaAduanal ?? "Carta Aduanal",     value: aduanal,sub: "Agentes aduanales",       color: SO_TYPE_CONFIG.carta_aduanal.color,  bar: total > 0 ? aduanal / total : 0 },
  ];

  return (
    <>
      {cards.map((card) => (
        <div key={card.label} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: card.color, lineHeight: 1.1 }}>{card.value}</div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{card.sub}</div>
          <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
            <div style={{ height: "100%", borderRadius: "var(--radius-full)", background: card.color, width: `${Math.min(card.bar * 100, 100)}%`, transition: "width 0.5s ease" }} />
          </div>
        </div>
      ))}
    </>
  );
}
