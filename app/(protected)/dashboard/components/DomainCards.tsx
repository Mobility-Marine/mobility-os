"use client";

import { useRouter } from "next/navigation";
import { DashboardMetrics } from "../hooks/useDashboard";

type Tone = "success" | "warning" | "danger" | "info";

const toneMap: Record<Tone, { text: string; bg: string }> = {
  success: { text: "var(--color-success-text)", bg: "var(--color-success-bg)" },
  warning: { text: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
  danger:  { text: "var(--color-danger-text)",  bg: "var(--color-danger-bg)"  },
  info:    { text: "var(--color-info-text)",    bg: "var(--color-info-bg)"    },
};

interface KpiRowProps { label: string; value: string; }

function KpiRow({ label, value }: KpiRowProps) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      paddingBottom: "8px",
      borderBottom: "1px solid var(--color-border-faint)",
    }}>
      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{value}</span>
    </div>
  );
}

interface DomainCardsProps {
  metrics: DashboardMetrics;
}

export default function DomainCards({ metrics }: DomainCardsProps) {
  const router = useRouter();

  const domains = [
    {
      title: "Comercial",
      badge: "Pipeline activo",
      tone: "info" as Tone,
      path: "/comercial/prospects",
      kpis: [
        { label: "Prospectos activos",   value: String(metrics.activeProspects) },
        { label: "Cotizaciones abiertas", value: String(metrics.openQuotations) },
        { label: "Pedidos activos",      value: "—" },
        { label: "Conversión estimada",  value: "—" },
      ],
    },
    {
      title: "Logística",
      badge: "Operación estable",
      tone: "success" as Tone,
      path: "/logistica/embarques",
      kpis: [
        { label: "Embarques activos", value: String(metrics.activeShipments) },
        { label: "Programados",       value: "—" },
        { label: "Retrasos",          value: "0" },
        { label: "SLA",               value: "—" },
      ],
    },
    {
      title: "Finanzas",
      badge: metrics.pendingInvoices > 0 ? "Vigilar cobranza" : "Sin alertas",
      tone: (metrics.pendingInvoices > 0 ? "warning" : "success") as Tone,
      path: "/finanzas/facturacion",
      kpis: [
        { label: "Facturas pendientes", value: String(metrics.pendingInvoices) },
        { label: "Por cobrar",          value: "—" },
        { label: "Pagos pendientes",    value: "—" },
        { label: "Liquidez",            value: "—" },
      ],
    },
    {
      title: "Agenda",
      badge: "Carga controlada",
      tone: "info" as Tone,
      path: "/agenda",
      kpis: [
        { label: "Eventos hoy",     value: "—" },
        { label: "Reuniones",       value: "—" },
        { label: "Próximo evento",  value: "—" },
        { label: "Disponibilidad",  value: "—" },
      ],
    },
  ];

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
        Dominios estratégicos
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "16px" }}>
        {domains.map((domain) => {
          const colors = toneMap[domain.tone];
          return (
            <div
              key={domain.title}
              onClick={() => router.push(domain.path)}
              style={{
                background: "var(--color-bg-base)",
                border: "1px solid var(--color-border-faint)",
                borderRadius: "var(--radius-lg)",
                padding: "18px",
                boxShadow: "var(--shadow-sm)",
                cursor: "pointer",
                transition: "var(--transition-fast)",
                display: "grid",
                gap: "14px",
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                  {domain.title}
                </div>
                <div style={{
                  padding: "3px 10px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: colors.text,
                  background: colors.bg,
                  flexShrink: 0,
                }}>
                  {domain.badge}
                </div>
              </div>
              <div style={{ display: "grid", gap: "8px" }}>
                {domain.kpis.map((kpi) => (
                  <KpiRow key={kpi.label} label={kpi.label} value={kpi.value} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
