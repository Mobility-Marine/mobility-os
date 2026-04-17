"use client";

import { useRouter } from "next/navigation";
import { DashboardMetrics } from "../hooks/useDashboard";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface DomainCardsProps { metrics: DashboardMetrics; }

export default function DomainCards({ metrics }: DomainCardsProps) {
  const router = useRouter();
  const { t }  = useTranslation();

  const domains = [
    {
      key:    "commercial",
      title:  t.dashboard.commercial,
      status: t.dashboard.pipelineActive,
      color:  "var(--color-brand-blue)",
      path:   "/comercial/prospects",
      kpis: [
        { label: t.dashboard.activeProspects,    value: metrics.activeProspects },
        { label: t.dashboard.openQuotationsKPI,  value: metrics.openQuotations },
        { label: t.dashboard.activeOrdersKPI,    value: "—" },
        { label: t.dashboard.estimatedConversion,value: metrics.activeProspects > 0
            ? `${Math.round((metrics.openQuotations / metrics.activeProspects) * 100)}%`
            : "—" },
      ],
    },
    {
      key:    "logistics",
      title:  t.dashboard.logistics,
      status: t.dashboard.operationStable,
      color:  "var(--color-warning-text)",
      path:   "/logistica/embarques",
      kpis: [
        { label: t.dashboard.activeShipmentsKPI, value: metrics.activeShipments },
        { label: t.dashboard.scheduled,          value: "—" },
        { label: t.dashboard.delays,             value: metrics.delayedShipments },
        { label: t.dashboard.sla,                value: "—" },
      ],
    },
    {
      key:    "finances",
      title:  t.dashboard.finances,
      status: t.dashboard.noAlertsDomain,
      color:  "var(--color-success-text)",
      path:   "/finanzas/facturacion",
      kpis: [
        { label: t.dashboard.invoicesIssued,   value: metrics.pendingInvoices },
        { label: t.dashboard.toCollect,        value: metrics.cxcBalance > 0 ? `$${Math.round(metrics.cxcBalance).toLocaleString("es-MX")}` : "—" },
        { label: t.dashboard.pendingPayments,  value: "—" },
        { label: t.dashboard.liquidity,        value: "—" },
      ],
    },
    {
      key:    "agenda",
      title:  t.nav.agenda,
      status: t.dashboard.controlledLoad,
      color:  "var(--color-info-text)",
      path:   "/agenda",
      kpis: [
        { label: t.dashboard.eventsToday,  value: "—" },
        { label: t.dashboard.meetings,     value: "—" },
        { label: t.dashboard.nextEvent,    value: "—" },
        { label: t.dashboard.availability, value: "—" },
      ],
    },
  ];

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <div style={{
        fontSize: "10px", fontWeight: 600,
        letterSpacing: "1px", textTransform: "uppercase",
        color: "var(--color-text-muted)",
      }}>
        {t.dashboard.strategicDomains}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px" }}>
        {domains.map((domain) => (
          <div
            key={domain.key}
            onClick={() => router.push(domain.path)}
            style={{
              background: "var(--color-bg-base)",
              border: "1px solid var(--color-border-faint)",
              borderRadius: "var(--radius-lg)",
              padding: "16px",
              cursor: "pointer",
              boxShadow: "var(--shadow-sm)",
              transition: "var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border-faint)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                {domain.title}
              </div>
              <span style={{
                fontSize: "10px", fontWeight: 600,
                padding: "2px 8px", borderRadius: "var(--radius-full)",
                background: domain.color + "20",
                color: domain.color,
              }}>
                {domain.status}
              </span>
            </div>
            <div style={{ display: "grid", gap: "6px" }}>
              {domain.kpis.map((kpi) => (
                <div key={kpi.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{kpi.label}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{kpi.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
