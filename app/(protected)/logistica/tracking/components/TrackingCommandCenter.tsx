"use client";
import type { TrackingShipment } from "../types/tracking.types";
import { useTranslation }        from "@/lib/i18n/useTranslation";

type Props = { shipments: TrackingShipment[]; pendingNotifs: number };

export default function TrackingCommandCenter({ shipments, pendingNotifs }: Props) {
  const { t } = useTranslation();
  const tl    = (t.logistics as any) ?? {};

  const total     = shipments.length;
  const inTransit = shipments.filter((s) => s.lastEvent?.event_type === "in_transit" || s.lastEvent?.event_type === "departed_origin").length;
  const atCustoms = shipments.filter((s) => s.lastEvent?.event_type === "customs_entry").length;

  const cards = [
    { label: tl.activeShipmentsTracking ?? "Embarques activos", value: total,     sub: "Con tracking activo",          color: "var(--color-brand-blue)",   bar: 1 },
    { label: tl.inTransitTracking       ?? "En tránsito",       value: inTransit, sub: "Moviéndose a destino",          color: "#0891b2",                   bar: total > 0 ? inTransit/total : 0 },
    { label: tl.atCustomsTracking       ?? "En aduana",         value: atCustoms, sub: "En proceso aduanal",            color: "#d97706",                   bar: total > 0 ? atCustoms/total : 0 },
    { label: tl.pendingNotifKPI         ?? "Notif. pendientes", value: pendingNotifs, sub: "Esperan confirmación",      color: pendingNotifs > 0 ? "var(--color-warning-text)" : "var(--color-text-muted)", bar: 0 },
  ];

  return (
    <>
      {cards.map((c) => (
        <div key={c.label} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: c.color, lineHeight: 1.1 }}>{c.value}</div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{c.sub}</div>
          {c.bar > 0 && (
            <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
              <div style={{ height: "100%", borderRadius: "var(--radius-full)", background: c.color, width: `${Math.min(c.bar * 100, 100)}%`, transition: "width 0.5s ease" }} />
            </div>
          )}
        </div>
      ))}
    </>
  );
}
