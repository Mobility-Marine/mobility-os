"use client";

import type { ProviderKPIs } from "../types/providers.types";
import { PROVIDER_TYPE_CONFIG } from "../types/providers.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = { kpis: ProviderKPIs | null };

export default function ProviderCommandCenter({ kpis }: Props) {
  const { t } = useTranslation();
  const tl    = (t.logistics as any) ?? {};

  if (!kpis) return null;

  const cards = [
    {
      label: tl.providers      ?? "Proveedores",
      value: kpis.total,
      sub:   `${kpis.active} ${tl.providerActive ?? "activos"} · ${kpis.inactive} ${tl.providerInactive ?? "inactivos"}`,
      color: "var(--color-brand-blue)",
      bar:   kpis.total > 0 ? kpis.active / kpis.total : 0,
    },
    {
      label: "Transportistas",
      value: (kpis.byType?.carrier_mx ?? 0) + (kpis.byType?.carrier_usa ?? 0),
      sub:   `MX: ${kpis.byType?.carrier_mx ?? 0} · USA: ${kpis.byType?.carrier_usa ?? 0}`,
      color: PROVIDER_TYPE_CONFIG.carrier_mx.color,
      bar:   kpis.active > 0 ? ((kpis.byType?.carrier_mx ?? 0) + (kpis.byType?.carrier_usa ?? 0)) / kpis.active : 0,
    },
    {
      label: tl.typeCustomsBroker ?? "Agentes aduanales",
      value: kpis.byType?.customs_broker ?? 0,
      sub:   `${kpis.byType?.warehouse ?? 0} almacenes · ${kpis.byType?.insurance ?? 0} seguros`,
      color: PROVIDER_TYPE_CONFIG.customs_broker.color,
      bar:   kpis.active > 0 ? (kpis.byType?.customs_broker ?? 0) / kpis.active : 0,
    },
    {
      label: "Documentos por vencer",
      value: kpis.pendingDocs,
      sub:   kpis.pendingDocs > 0 ? "Revisar en los próximos 30 días" : "Todo al corriente",
      color: kpis.pendingDocs > 0 ? "var(--color-warning-text)" : "var(--color-success-text)",
      bar:   0,
    },
  ];

  return (
    <>
      {cards.map((card) => (
        <div key={card.label} style={{
          background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
          borderRadius: "var(--radius-lg)", padding: "16px 20px",
          display: "flex", flexDirection: "column", gap: "4px",
        }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {card.label}
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: card.color, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
            {card.value}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{card.sub}</div>
          <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
            <div style={{
              height: "100%", borderRadius: "var(--radius-full)", background: card.color,
              width: `${Math.min(card.bar * 100, 100)}%`, transition: "width 0.5s ease",
            }} />
          </div>
        </div>
      ))}
    </>
  );
}
