"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useRouter } from "next/navigation";
import type { ComprasAlert } from "../types/compras.types";

type Props = { alerts: ComprasAlert[]; loading: boolean };

const PRIORITY_COLORS = {
  high:   { color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)",  dot: "#ef4444" },
  medium: { color: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)", dot: "#f59e0b" },
  low:    { color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)",   dot: "#94a3b8" },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  overdue_po:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  pending_approval: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  stock_critical:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>,
  discrepancy:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  urgent_req:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/></svg>,
};

export default function ComprasAlertas({ alerts, loading }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";
  const router = useRouter();

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          {es ? "Alertas prioritarias" : "Priority alerts"}
        </div>
        {alerts.length > 0 && (
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: "var(--color-danger-bg)", color: "var(--color-danger-text)", border: "1px solid var(--color-danger-border)" }}>
            {alerts.length}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>
          {es ? "Cargando alertas…" : "Loading alerts…"}
        </div>
      ) : alerts.length === 0 ? (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", marginBottom: "6px" }}>✅</div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success-text)" }}>
            {es ? "Sin alertas activas" : "No active alerts"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "3px" }}>
            {es ? "Todo el área de compras opera con normalidad." : "All procurement operations running normally."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {alerts.map((alert) => {
            const pc = PRIORITY_COLORS[alert.priority];
            return (
              <div key={alert.id} onClick={() => router.push(alert.path)}
                style={{ display: "flex", gap: "10px", padding: "10px 12px", borderRadius: "var(--radius-md)", background: pc.bg, border: `1px solid ${pc.border}`, cursor: "pointer", alignItems: "flex-start", transition: "opacity 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                <div style={{ marginTop: "1px", color: pc.color, flexShrink: 0 }}>
                  {TYPE_ICONS[alert.type]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: pc.color, lineHeight: 1.3 }}>{alert.title}</div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>{alert.subtitle}</div>
                </div>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: pc.dot, flexShrink: 0, marginTop: "4px" }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
