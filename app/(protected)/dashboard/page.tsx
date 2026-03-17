"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Tone = "green" | "yellow" | "blue" | "red" | "neutral";

type StatusItemProps = {
  label: string;
  value: string;
  tone?: Tone;
};

type MetricCardProps = {
  title: string;
  value: string;
  delta?: string;
  subtitle?: string;
};

type FeedItemProps = {
  text: string;
  time: string;
  tone?: Tone;
};

type AlertItemProps = {
  title: string;
  detail: string;
  tone: Tone;
};

type QuickActionProps = {
  label: string;
  hint: string;
};

type KpiRowProps = {
  label: string;
  value: string;
};

type SignalItemProps = {
  label: string;
  value: string;
  tone?: Tone;
};

type SparkBarProps = {
  value: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void checkCompany();
  }, []);

  async function checkCompany() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("company_users")
      .select("company_id")
      .limit(1);

    if (error || !data || data.length === 0) {
      router.replace("/create-company");
      return;
    }

    setLoading(false);
  }

  const now = useMemo(
    () =>
      new Date().toLocaleString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  const opsTrend = [58, 64, 61, 72, 78, 74, 84];
  const revenueTrend = [42, 48, 51, 56, 60, 58, 67];
  const logisticsTrend = [70, 68, 66, 74, 73, 79, 82];

  if (loading) {
    return (
      <div style={loadingWrap}>
        <div style={loadingTitle}>Inicializando Command Center…</div>
        <div style={loadingSubtitle}>
          Cargando contexto operativo de la empresa
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      {/* TOP STATUS STRIP */}
      <div style={statusBar}>
        <div style={statusBarLeft}>
          <div style={eyebrow}>COMMAND CENTER</div>
          <div style={statusBarTitle}>Mobility OS</div>
          <div style={statusBarSubtitle}>
            Centro operativo inteligente — {now}
          </div>
        </div>

        <div style={statusBarRight}>
          <StatusItem label="Estado" value="Operativo" tone="green" />
          <StatusItem label="Alertas" value="2 activas" tone="yellow" />
          <StatusItem label="Servicios" value="9 hoy" tone="blue" />
          <StatusItem label="IA" value="Online" tone="blue" />
          <StatusItem label="Cobranza crítica" value="1" tone="red" />
        </div>
      </div>

      {/* HERO GRID */}
      <div style={heroGrid}>
        {/* MAIN COMMAND PANEL */}
        <div style={heroPanel}>
          <div style={heroHeader}>
            <div>
              <div style={heroTitle}>Situación operativa</div>
              <div style={heroSubtitle}>
                Visión ejecutiva consolidada de la empresa activa
              </div>
            </div>

            <div style={heroStatePill}>
              <span style={heroStateDot} />
              Actividad alta
            </div>
          </div>

          <div style={heroMainRow}>
            <div style={heroBigMetricWrap}>
              <div style={heroBigMetric}>Alta</div>
              <div style={heroBigMetricLabel}>Actividad global</div>
            </div>

            <div style={heroMetricsGrid}>
              <MetricCard
                title="Pendientes críticos"
                value="3"
                delta="+1"
                subtitle="requieren seguimiento"
              />
              <MetricCard
                title="Incidencias"
                value="0"
                delta="estable"
                subtitle="sin bloqueos activos"
              />
              <MetricCard
                title="Servicios hoy"
                value="9"
                delta="+2"
                subtitle="vs promedio diario"
              />
              <MetricCard
                title="Reuniones próximas"
                value="3"
                delta="10:30"
                subtitle="próximo compromiso"
              />
            </div>
          </div>

          <div style={chartsGrid}>
            <ChartPanel title="Pulso operativo">
              <div style={sparkRow}>
                {opsTrend.map((value, index) => (
                  <SparkBar key={`ops-${index}`} value={value} />
                ))}
              </div>
              <div style={chartFooter}>Últimos 7 días</div>
            </ChartPanel>

            <ChartPanel title="Ingresos / tendencia">
              <div style={sparkRow}>
                {revenueTrend.map((value, index) => (
                  <SparkBar key={`rev-${index}`} value={value} />
                ))}
              </div>
              <div style={chartFooter}>Ritmo comercial mensual</div>
            </ChartPanel>

            <ChartPanel title="Capacidad logística">
              <div style={sparkRow}>
                {logisticsTrend.map((value, index) => (
                  <SparkBar key={`log-${index}`} value={value} />
                ))}
              </div>
              <div style={chartFooter}>Carga vs disponibilidad</div>
            </ChartPanel>
          </div>
        </div>

        {/* AI SIDE PANEL */}
        <div style={aiPanel}>
          <div style={aiTitle}>Mobility AI</div>
          <div style={aiSubtitle}>
            Asistente operativo proactivo listo para consultar, detectar y
            ejecutar.
          </div>

          <div style={aiPromptBox}>
            ¿Qué está en riesgo hoy y a quién debo asignarlo?
          </div>

          <div style={aiSuggestionTitle}>Sugerencias</div>
          <div style={aiSuggestionList}>
            <button style={suggestionButton}>
              Ver pendientes críticos
            </button>
            <button style={suggestionButton}>
              Crear evento de seguimiento
            </button>
            <button style={suggestionButton}>
              Mostrar cuentas por cobrar
            </button>
            <button style={suggestionButton}>
              Revisar servicios en tránsito
            </button>
          </div>

          <div style={aiInsightBox}>
            <div style={aiInsightLabel}>Insight IA</div>
            <div style={aiInsightText}>
              Si no se generan nuevas cotizaciones hoy, la proyección semanal
              podría caer frente al ritmo esperado.
            </div>
          </div>
        </div>
      </div>

      {/* MID GRID */}
      <div style={midGrid}>
        <Panel title="Actividad en tiempo real">
          <FeedItem
            text="Servicio MX-921 iniciado"
            time="09:12"
            tone="blue"
          />
          <FeedItem
            text="Cotización enviada a ACME"
            time="09:07"
            tone="neutral"
          />
          <FeedItem
            text="Factura F-201 generada"
            time="09:02"
            tone="green"
          />
          <FeedItem
            text="Usuario Juan inició sesión"
            time="08:58"
            tone="neutral"
          />
          <FeedItem
            text="Seguimiento programado con cliente Delta"
            time="08:44"
            tone="blue"
          />
        </Panel>

        <Panel title="Alertas inteligentes">
          <AlertItem
            title="Cobranza vencida"
            detail="1 factura prioritaria requiere atención de finanzas hoy."
            tone="red"
          />
          <AlertItem
            title="Capacidad logística"
            detail="Mañana se observa presión operativa por carga programada."
            tone="yellow"
          />
          <AlertItem
            title="Pipeline comercial"
            detail="Actividad comercial estable, pero la velocidad de cierre puede mejorar."
            tone="blue"
          />
        </Panel>

        <Panel title="Acciones rápidas">
          <QuickAction
            label="Crear tarea"
            hint="Delegar acción inmediata"
          />
          <QuickAction
            label="Agendar evento"
            hint="Coordinar equipo o cliente"
          />
          <QuickAction
            label="Nueva cotización"
            hint="Abrir flujo comercial"
          />
          <QuickAction
            label="Programar servicio"
            hint="Asignar operación logística"
          />
          <QuickAction
            label="Mensaje interno"
            hint="Comunicación enterprise"
          />
          <QuickAction
            label="Solicitar reporte IA"
            hint="Resumen ejecutivo instantáneo"
          />
        </Panel>
      </div>

      {/* STRATEGIC GRID */}
      <div style={sectionLabel}>Dominios estratégicos</div>

      <div style={secondaryGrid}>
        <DomainCard
          title="Comercial"
          tone="blue"
          footer="Pipeline saludable"
        >
          <KpiRow label="Prospects nuevos" value="12" />
          <KpiRow label="Cotizaciones abiertas" value="8" />
          <KpiRow label="Pedidos activos" value="5" />
          <KpiRow label="Conversión estimada" value="41%" />
        </DomainCard>

        <DomainCard
          title="Logística"
          tone="green"
          footer="Operación estable"
        >
          <KpiRow label="Servicios en curso" value="4" />
          <KpiRow label="Programados" value="5" />
          <KpiRow label="Retrasos" value="0" />
          <KpiRow label="Cumplimiento SLA" value="96%" />
        </DomainCard>

        <DomainCard
          title="Finanzas"
          tone="yellow"
          footer="Vigilar cobranza"
        >
          <KpiRow label="Ingresos del mes" value="$1.24M" />
          <KpiRow label="Por cobrar" value="$320K" />
          <KpiRow label="Pagos pendientes" value="6" />
          <KpiRow label="Liquidez" value="Positiva" />
        </DomainCard>

        <DomainCard
          title="Agenda"
          tone="neutral"
          footer="Carga controlada"
        >
          <KpiRow label="Eventos hoy" value="7" />
          <KpiRow label="Reuniones" value="3" />
          <KpiRow label="Próximo evento" value="10:30" />
          <KpiRow label="Disponibilidad" value="Media" />
        </DomainCard>
      </div>

      {/* SIGNALS GRID */}
      <div style={sectionLabel}>Señales externas y control expandido</div>

      <div style={signalsGrid}>
        <Panel title="Tracking logístico">
          <SignalItem
            label="Contenedor MSCU-4821"
            value="En tránsito"
            tone="blue"
          />
          <SignalItem
            label="Buque / ETA"
            value="Arribo estimado 22 Mar"
            tone="neutral"
          />
          <SignalItem
            label="Puerto"
            value="Manzanillo"
            tone="neutral"
          />
          <SignalItem
            label="Riesgo"
            value="Bajo"
            tone="green"
          />
        </Panel>

        <Panel title="Pulso digital">
          <SignalItem
            label="Interacciones recientes"
            value="Crecimiento moderado"
            tone="green"
          />
          <SignalItem
            label="Mensajes pendientes"
            value="2 por responder"
            tone="yellow"
          />
          <SignalItem
            label="Reputación"
            value="Sin alertas"
            tone="green"
          />
          <SignalItem
            label="Menciones clave"
            value="Cliente ACME / seguimiento"
            tone="blue"
          />
        </Panel>

        <Panel title="Radar ejecutivo">
          <SignalItem
            label="Empresa"
            value="Estado estable"
            tone="green"
          />
          <SignalItem
            label="Comercial"
            value="Buen ritmo"
            tone="blue"
          />
          <SignalItem
            label="Logística"
            value="Sin bloqueos"
            tone="green"
          />
          <SignalItem
            label="Finanzas"
            value="1 foco de atención"
            tone="yellow"
          />
        </Panel>
      </div>
    </div>
  );
}

/* ===== COMPONENTES ===== */

function StatusItem({
  label,
  value,
  tone = "neutral",
}: StatusItemProps) {
  return (
    <div style={statusItem}>
      <div style={statusLabel}>{label}</div>
      <div style={{ ...statusValue, color: getToneColor(tone) }}>
        {value}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  delta,
  subtitle,
}: MetricCardProps) {
  return (
    <div style={metricCard}>
      <div style={metricCardTitle}>{title}</div>
      <div style={metricCardValue}>{value}</div>
      {delta ? <div style={metricCardDelta}>{delta}</div> : null}
      {subtitle ? <div style={metricCardSubtitle}>{subtitle}</div> : null}
    </div>
  );
}

function ChartPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={chartPanel}>
      <div style={chartTitle}>{title}</div>
      {children}
    </div>
  );
}

function SparkBar({ value }: SparkBarProps) {
  return (
    <div style={sparkBarWrap}>
      <div
        style={{
          ...sparkBar,
          height: `${Math.max(value, 12)}%`,
        }}
      />
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={panel}>
      <div style={panelTitle}>{title}</div>
      <div style={panelContent}>{children}</div>
    </div>
  );
}

function FeedItem({
  text,
  time,
  tone = "neutral",
}: FeedItemProps) {
  return (
    <div style={feedItem}>
      <div style={feedLeft}>
        <span
          style={{
            ...feedDot,
            background: getToneColor(tone),
          }}
        />
        <span style={feedText}>{text}</span>
      </div>
      <span style={feedTime}>{time}</span>
    </div>
  );
}

function AlertItem({
  title,
  detail,
  tone,
}: AlertItemProps) {
  return (
    <div style={alertItem}>
      <div style={alertHeader}>
        <span
          style={{
            ...alertTone,
            background: getToneSoft(tone),
            color: getToneColor(tone),
          }}
        >
          {title}
        </span>
      </div>
      <div style={alertDetail}>{detail}</div>
    </div>
  );
}

function QuickAction({
  label,
  hint,
}: QuickActionProps) {
  return (
    <button style={quickActionButton}>
      <span style={quickActionLabel}>{label}</span>
      <span style={quickActionHint}>{hint}</span>
    </button>
  );
}

function DomainCard({
  title,
  tone,
  footer,
  children,
}: {
  title: string;
  tone: Tone;
  footer: string;
  children: React.ReactNode;
}) {
  return (
    <div style={domainCard}>
      <div style={domainHeader}>
        <div style={domainTitle}>{title}</div>
        <div
          style={{
            ...domainBadge,
            color: getToneColor(tone),
            background: getToneSoft(tone),
          }}
        >
          {footer}
        </div>
      </div>
      <div style={domainContent}>{children}</div>
    </div>
  );
}

function KpiRow({
  label,
  value,
}: KpiRowProps) {
  return (
    <div style={kpiRow}>
      <span style={kpiLabel}>{label}</span>
      <span style={kpiValue}>{value}</span>
    </div>
  );
}

function SignalItem({
  label,
  value,
  tone = "neutral",
}: SignalItemProps) {
  return (
    <div style={signalRow}>
      <div style={signalLabel}>{label}</div>
      <div style={{ ...signalValue, color: getToneColor(tone) }}>
        {value}
      </div>
    </div>
  );
}

/* ===== HELPERS ===== */

function getToneColor(tone: Tone): string {
  switch (tone) {
    case "green":
      return "#4ade80";
    case "yellow":
      return "#facc15";
    case "blue":
      return "#60a5fa";
    case "red":
      return "#f87171";
    default:
      return "#f3f4f6";
  }
}

function getToneSoft(tone: Tone): string {
  switch (tone) {
    case "green":
      return "rgba(74, 222, 128, 0.12)";
    case "yellow":
      return "rgba(250, 204, 21, 0.12)";
    case "blue":
      return "rgba(96, 165, 250, 0.12)";
    case "red":
      return "rgba(248, 113, 113, 0.12)";
    default:
      return "rgba(255,255,255,0.06)";
  }
}

/* ===== ESTILOS ===== */

const loadingWrap: React.CSSProperties = {
  padding: 32,
  display: "grid",
  gap: 8,
};

const loadingTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
};

const loadingSubtitle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 14,
};

const container: React.CSSProperties = {
  padding: 28,
  display: "grid",
  gap: 22,
};

const statusBar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  flexWrap: "wrap",
  background:
    "linear-gradient(180deg, rgba(12,16,22,0.98) 0%, rgba(9,12,17,0.98) 100%)",
  border: "1px solid #1f2937",
  borderRadius: 18,
  padding: "18px 20px",
  boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
};

const statusBarLeft: React.CSSProperties = {
  display: "grid",
  gap: 4,
};

const eyebrow: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.16em",
  color: "#6b7280",
  fontWeight: 700,
};

const statusBarTitle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
  lineHeight: 1,
};

const statusBarSubtitle: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: 14,
};

const statusBarRight: React.CSSProperties = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "center",
};

const statusItem: React.CSSProperties = {
  minWidth: 110,
  display: "grid",
  gap: 3,
};

const statusLabel: React.CSSProperties = {
  fontSize: 11,
  color: "#9ca3af",
};

const statusValue: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: "#f3f4f6",
};

const heroGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 2.2fr) minmax(320px, 1fr)",
  gap: 20,
  alignItems: "stretch",
};

const heroPanel: React.CSSProperties = {
  background:
    "radial-gradient(circle at top left, rgba(255,255,255,0.03), transparent 24%), linear-gradient(180deg, #0b0f14 0%, #090d12 100%)",
  border: "1px solid #1f2937",
  borderRadius: 22,
  padding: 24,
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  display: "grid",
  gap: 20,
};

const heroHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const heroTitle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  lineHeight: 1,
};

const heroSubtitle: React.CSSProperties = {
  marginTop: 6,
  color: "#94a3b8",
  fontSize: 14,
};

const heroStatePill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid #1f2937",
  borderRadius: 999,
  padding: "8px 12px",
  color: "#d1d5db",
  background: "rgba(255,255,255,0.02)",
  fontSize: 13,
  fontWeight: 700,
};

const heroStateDot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: "#4ade80",
  boxShadow: "0 0 16px rgba(74,222,128,0.55)",
};

const heroMainRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, 0.8fr) minmax(0, 1.2fr)",
  gap: 20,
  alignItems: "stretch",
};

const heroBigMetricWrap: React.CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: 8,
  minHeight: 220,
  padding: 6,
};

const heroBigMetric: React.CSSProperties = {
  fontSize: 82,
  fontWeight: 900,
  lineHeight: 0.94,
  letterSpacing: "-0.05em",
};

const heroBigMetricLabel: React.CSSProperties = {
  fontSize: 22,
  color: "#9ca3af",
};

const heroMetricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14,
};

const metricCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.025)",
  border: "1px solid #1f2937",
  borderRadius: 16,
  padding: 16,
  display: "grid",
  gap: 6,
};

const metricCardTitle: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
};

const metricCardValue: React.CSSProperties = {
  fontSize: 34,
  lineHeight: 1,
  fontWeight: 800,
};

const metricCardDelta: React.CSSProperties = {
  fontSize: 13,
  color: "#e5e7eb",
  fontWeight: 700,
};

const metricCardSubtitle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
};

const chartsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 14,
};

const chartPanel: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid #1f2937",
  borderRadius: 16,
  padding: 14,
  display: "grid",
  gap: 12,
};

const chartTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#e5e7eb",
};

const sparkRow: React.CSSProperties = {
  height: 90,
  display: "flex",
  alignItems: "flex-end",
  gap: 8,
};

const sparkBarWrap: React.CSSProperties = {
  flex: 1,
  height: "100%",
  display: "flex",
  alignItems: "flex-end",
};

const sparkBar: React.CSSProperties = {
  width: "100%",
  borderRadius: 999,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(148,163,184,0.55) 100%)",
  boxShadow: "0 8px 24px rgba(255,255,255,0.08)",
};

const chartFooter: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
};

const aiPanel: React.CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(10,13,18,1) 0%, rgba(8,11,15,1) 100%)",
  border: "1px solid #1f2937",
  borderRadius: 22,
  padding: 22,
  display: "grid",
  gap: 16,
  boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
};

const aiTitle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
};

const aiSubtitle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 14,
  lineHeight: 1.5,
};

const aiPromptBox: React.CSSProperties = {
  border: "1px solid #263041",
  borderRadius: 14,
  padding: 14,
  background: "rgba(255,255,255,0.02)",
  color: "#e5e7eb",
  fontWeight: 600,
  lineHeight: 1.5,
};

const aiSuggestionTitle: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.1em",
  color: "#6b7280",
  fontWeight: 800,
  textTransform: "uppercase",
};

const aiSuggestionList: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const suggestionButton: React.CSSProperties = {
  textAlign: "left",
  border: "1px solid #1f2937",
  borderRadius: 12,
  background: "rgba(255,255,255,0.02)",
  color: "#f3f4f6",
  padding: "12px 14px",
  cursor: "pointer",
  fontWeight: 600,
};

const aiInsightBox: React.CSSProperties = {
  border: "1px solid #1f2937",
  borderRadius: 14,
  background: "rgba(255,255,255,0.025)",
  padding: 14,
  display: "grid",
  gap: 8,
};

const aiInsightLabel: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const aiInsightText: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.5,
  color: "#e5e7eb",
};

const midGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 18,
};

const panel: React.CSSProperties = {
  background: "#0b0f14",
  border: "1px solid #1f2937",
  borderRadius: 18,
  padding: 18,
  display: "grid",
  gap: 14,
};

const panelTitle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 18,
};

const panelContent: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const feedItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  paddingBottom: 10,
  borderBottom: "1px solid #1f2937",
};

const feedLeft: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 0,
};

const feedDot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  flexShrink: 0,
};

const feedText: React.CSSProperties = {
  fontSize: 14,
  color: "#e5e7eb",
};

const feedTime: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  whiteSpace: "nowrap",
};

const alertItem: React.CSSProperties = {
  border: "1px solid #1f2937",
  borderRadius: 14,
  padding: 14,
  background: "rgba(255,255,255,0.02)",
  display: "grid",
  gap: 8,
};

const alertHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const alertTone: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};

const alertDetail: React.CSSProperties = {
  fontSize: 14,
  color: "#cbd5e1",
  lineHeight: 1.5,
};

const quickActionButton: React.CSSProperties = {
  border: "1px solid #1f2937",
  borderRadius: 14,
  background: "rgba(255,255,255,0.02)",
  padding: "14px 14px",
  textAlign: "left",
  display: "grid",
  gap: 4,
  cursor: "pointer",
};

const quickActionLabel: React.CSSProperties = {
  color: "#f3f4f6",
  fontWeight: 700,
};

const quickActionHint: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 13,
};

const sectionLabel: React.CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#6b7280",
  fontWeight: 800,
};

const secondaryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 18,
};

const domainCard: React.CSSProperties = {
  background: "#0b0f14",
  border: "1px solid #1f2937",
  borderRadius: 18,
  padding: 18,
  display: "grid",
  gap: 14,
};

const domainHeader: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const domainTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
};

const domainBadge: React.CSSProperties = {
  justifySelf: "start",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};

const domainContent: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const kpiRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};

const kpiLabel: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: 14,
};

const kpiValue: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 15,
};

const signalsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 18,
};

const signalRow: React.CSSProperties = {
  display: "grid",
  gap: 4,
  paddingBottom: 10,
  borderBottom: "1px solid #1f2937",
};

const signalLabel: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 13,
};

const signalValue: React.CSSProperties = {
  color: "#f3f4f6",
  fontWeight: 700,
  fontSize: 14,
};
