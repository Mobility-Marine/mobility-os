"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { ComprasActivity, TopSupplier } from "../types/compras.types";

type Props = {
  activity:  ComprasActivity[];
  suppliers: TopSupplier[];
  loading:   boolean;
};

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  draft:            { color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)"  },
  pending_approval: { color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
  approved:         { color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)"    },
  sent:             { color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)"    },
  partial:          { color: "#a78bfa",                   bg: "#ede9fe"                 },
  complete:         { color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  po_created:        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  po_approved:       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  po_sent:           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  reception_complete:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  req_approved:      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/></svg>,
  rfq_awarded:       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

export default function ComprasActividad({ activity, suppliers, loading }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  function timeAgo(date: string): string {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60)   return es ? "hace un momento" : "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400)return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

      {/* Actividad reciente */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          {es ? "Actividad reciente" : "Recent activity"}
        </div>

        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>{es ? "Cargando…" : "Loading…"}</div>
        ) : activity.length === 0 ? (
          <div style={{ padding: "16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>
            {es ? "Sin actividad reciente" : "No recent activity"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {activity.map((act, i) => {
              const sc = act.status ? (STATUS_COLORS[act.status] ?? STATUS_COLORS.draft) : STATUS_COLORS.draft;
              return (
                <div key={act.id} style={{ display: "flex", gap: "10px", padding: "9px 0", borderBottom: i < activity.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center" }}>
                  <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: sc.bg, color: sc.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {ACTIVITY_ICONS[act.type]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{act.title}</div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{act.subtitle}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {act.amount && act.amount > 0 && (
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                        ${fmt(act.amount)}
                      </div>
                    )}
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{timeAgo(act.date)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top proveedores */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          {es ? "Top proveedores" : "Top suppliers"}
        </div>

        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>{es ? "Cargando…" : "Loading…"}</div>
        ) : suppliers.length === 0 ? (
          <div style={{ padding: "16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>
            {es ? "Sin órdenes de compra registradas" : "No purchase orders recorded"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {suppliers.map((s, i) => {
              const maxVal = suppliers[0].total_value;
              const pct = maxVal > 0 ? (s.total_value / maxVal) * 100 : 0;
              return (
                <div key={s.id} style={{ padding: "9px 0", borderBottom: i < suppliers.length - 1 ? "1px solid var(--color-border-faint)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 800, color: "var(--color-text-muted)", flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "8px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                        ${fmt(s.total_value)}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                        {s.po_count} {es ? "OCs" : "POs"}
                      </div>
                    </div>
                  </div>
                  <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: pct + "%", background: i === 0 ? "var(--color-brand-blue)" : "var(--color-border)", borderRadius: "2px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
