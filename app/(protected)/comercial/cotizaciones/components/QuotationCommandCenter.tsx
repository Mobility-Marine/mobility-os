"use client";

import type { Quotation } from "../types/quotations.types";
import { computeQuotationDataQuality } from "../types/quotations.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  computeTotalsByCurrency,
  sumTotalsByCurrency,
} from "../utils/computeTotalsByCurrency";
import {
  IconBarChart,
  IconTrendingUp,
  IconTarget,
  IconHash,
  IconClock,
  IconShieldCheck,
} from "./Icons";

type Props = { quotations: Quotation[] };

// ═══════════════════════════════════════════════════════════════════
// QUOTATION COMMAND CENTER — 6 KPIs NIVEL ERP MUNDIAL
// Inspirado en: SAP CRM, Oracle CX, Salesforce CPQ, NetSuite, HubSpot
//
// 1. Pipeline Activo  — Σ borradores+enviadas por moneda
// 2. Cerrado / Won    — Σ aceptadas + tendencia vs mes anterior
// 3. Win Rate         — % conversión aceptadas/(aceptadas+rechazadas)
// 4. Ticket Promedio  — Avg deal size (ADS) por moneda
// 5. Sales Velocity   — Días promedio creación → aceptación
// 6. Data Quality     — % cotizaciones completas (SAT codes + RFC)
//
// Totales por moneda → usa helper centralizado `computeTotalsByCurrency`
// para mantener consistencia con sidebar, filtros y copilot.
// ═══════════════════════════════════════════════════════════════════

function avgByCurrency(quotations: Quotation[]): Record<string, number> {
  const acc: Record<string, { total: number; count: number }> = {};
  for (const q of quotations) {
    const t = computeTotalsByCurrency(q);
    for (const [cur, val] of Object.entries(t)) {
      if (val <= 0) continue;
      if (!acc[cur]) acc[cur] = { total: 0, count: 0 };
      acc[cur].total += val;
      acc[cur].count += 1;
    }
  }
  const avg: Record<string, number> = {};
  for (const [cur, data] of Object.entries(acc)) {
    if (data.count > 0) avg[cur] = data.total / data.count;
  }
  return avg;
}

export default function QuotationCommandCenter({ quotations }: Props) {
  const { t, lang } = useTranslation();
  const locale = lang === "en" ? "en-US" : "es-MX";

  // ── BUCKETS ───────────────────────────────────────────────
  const drafts = quotations.filter((q) => q.status === "draft");
  const sent = quotations.filter((q) => q.status === "sent" || q.status === "viewed");
  const accepted = quotations.filter((q) => q.status === "accepted");
  const rejected = quotations.filter((q) => q.status === "rejected");

  // ── KPI 1: PIPELINE ACTIVO ────────────────────────────────
  const pipelineQuots = [...drafts, ...sent];
  const pipelineByCurrency = sumTotalsByCurrency(pipelineQuots);
  const pipelineCount = pipelineQuots.length;

  // ── KPI 2: CERRADO / WON + TENDENCIA ──────────────────────
  const acceptedByCurrency = sumTotalsByCurrency(accepted);
  const acceptedCount = accepted.length;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).getTime();

  const acceptedThisMonth = accepted.filter(
    (q) => q.accepted_at && new Date(q.accepted_at).getTime() >= thisMonthStart,
  ).length;
  const acceptedLastMonth = accepted.filter((q) => {
    if (!q.accepted_at) return false;
    const ts = new Date(q.accepted_at).getTime();
    return ts >= lastMonthStart && ts <= lastMonthEnd;
  }).length;
  const trendPct =
    acceptedLastMonth > 0
      ? Math.round(((acceptedThisMonth - acceptedLastMonth) / acceptedLastMonth) * 100)
      : acceptedThisMonth > 0
        ? 100
        : 0;
  const trendUp = trendPct >= 0;

  // ── KPI 3: WIN RATE ───────────────────────────────────────
  const decidedCount = acceptedCount + rejected.length;
  const winRate = decidedCount > 0 ? Math.round((acceptedCount / decidedCount) * 100) : 0;
  // Benchmark industria SaaS B2B: 40-60% es óptimo
  const winRateBenchmark =
    winRate >= 60
      ? { label: "Excelente", color: "var(--color-success-text)" }
      : winRate >= 40
        ? { label: "Óptimo", color: "var(--color-success-text)" }
        : winRate >= 25
          ? { label: "Mejorable", color: "var(--color-warning-text)" }
          : { label: "Bajo", color: "var(--color-danger-text)" };

  // ── KPI 4: TICKET PROMEDIO (ADS) ──────────────────────────
  const adsByCurrency = avgByCurrency(accepted);

  // ── KPI 5: SALES VELOCITY (días promedio cierre) ──────────
  const closureDays = accepted
    .filter((q) => q.accepted_at && q.created_at)
    .map((q) => {
      const created = new Date(q.created_at).getTime();
      const acc = new Date(q.accepted_at!).getTime();
      return Math.max(0, (acc - created) / (1000 * 60 * 60 * 24));
    });
  const avgClosureDays =
    closureDays.length > 0
      ? Math.round(closureDays.reduce((a, b) => a + b, 0) / closureDays.length)
      : 0;
  // Benchmark logística: 5-7 días es típico
  const velocityBenchmark =
    avgClosureDays === 0
      ? { label: "Sin datos", color: "var(--color-text-muted)" }
      : avgClosureDays <= 3
        ? { label: "Muy rápido", color: "var(--color-success-text)" }
        : avgClosureDays <= 7
          ? { label: "Óptimo", color: "var(--color-success-text)" }
          : avgClosureDays <= 14
            ? { label: "Lento", color: "var(--color-warning-text)" }
            : { label: "Crítico", color: "var(--color-danger-text)" };

  // ── KPI 6: DATA QUALITY ───────────────────────────────────
  const dqScores = quotations.map(computeQuotationDataQuality);
  const dqAvg =
    dqScores.length > 0
      ? Math.round(dqScores.reduce((s, q) => s + q.score, 0) / dqScores.length)
      : 0;
  const dqComplete = dqScores.filter((s) => s.score >= 85).length;
  const dqBenchmark =
    dqAvg >= 85
      ? { label: "Excelente", color: "var(--color-success-text)" }
      : dqAvg >= 65
        ? { label: "Bueno", color: "var(--color-warning-text)" }
        : { label: "Requiere atención", color: "var(--color-danger-text)" };

  // ── HELPERS DE FORMATO ────────────────────────────────────
  const fmtCur = (n: number, currency: string) => {
    const symbol = currency === "USD" ? "USD $" : currency === "EUR" ? "EUR €" : "$";
    return `${symbol}${n.toLocaleString(locale, { maximumFractionDigits: 0 })}`;
  };

  const renderMultiCurrency = (
    byCurrency: Record<string, number>,
    color: string,
    fontSize = "22px",
  ) => {
    const entries = Object.entries(byCurrency).filter(([, v]) => v > 0);
    if (entries.length === 0)
      return (
        <span style={{ fontSize, fontWeight: 800, color, lineHeight: 1.1 }}>$0</span>
      );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {entries.map(([cur, val]) => (
          <div key={cur} style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
            <span
              style={{
                fontSize,
                fontWeight: 800,
                color,
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.1,
              }}
            >
              {fmtCur(val, cur)}
            </span>
            {entries.length > 1 && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color,
                  opacity: 0.7,
                  textTransform: "uppercase",
                }}
              >
                {cur}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
        gap: "12px",
        gridColumn: "1 / -1",
      }}
    >
      {/* ═══ KPI 1 — PIPELINE ACTIVO ═══ */}
      <KPICard
        icon={<IconBarChart size={16} />}
        accentColor="var(--color-brand-blue)"
        label="Pipeline activo"
        mainValue={renderMultiCurrency(pipelineByCurrency, "var(--color-brand-blue)", "22px")}
        sub={`${pipelineCount} cotizacion${pipelineCount === 1 ? "" : "es"} · ${drafts.length} borr · ${sent.length} env`}
        progress={
          quotations.length > 0
            ? Math.min((pipelineCount / quotations.length) * 100, 100)
            : 0
        }
      />

      {/* ═══ KPI 2 — CERRADO / WON ═══ */}
      <KPICard
        icon={<IconTrendingUp size={16} />}
        accentColor="var(--color-success-text)"
        label="Cerrado (won)"
        mainValue={renderMultiCurrency(acceptedByCurrency, "var(--color-success-text)", "22px")}
        sub={
          acceptedLastMonth > 0 || acceptedThisMonth > 0 ? (
            <>
              {acceptedCount} ganada{acceptedCount === 1 ? "" : "s"} ·{" "}
              <span
                style={{
                  color: trendUp ? "var(--color-success-text)" : "var(--color-danger-text)",
                  fontWeight: 700,
                }}
              >
                {trendUp ? "↑" : "↓"} {Math.abs(trendPct)}% vs mes ant.
              </span>
            </>
          ) : (
            `${acceptedCount} aceptadas`
          )
        }
        progress={
          quotations.length > 0
            ? Math.min((acceptedCount / quotations.length) * 100, 100)
            : 0
        }
      />

      {/* ═══ KPI 3 — WIN RATE ═══ */}
      <KPICard
        icon={<IconTarget size={16} />}
        accentColor={winRateBenchmark.color}
        label="Win rate"
        mainValue={
          <span
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: winRateBenchmark.color,
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {winRate}%
          </span>
        }
        sub={
          <>
            <span style={{ color: winRateBenchmark.color, fontWeight: 700 }}>
              {winRateBenchmark.label}
            </span>{" "}
            · benchmark 40–60%
          </>
        }
        progress={Math.min(winRate, 100)}
        progressColor={winRateBenchmark.color}
      />

      {/* ═══ KPI 4 — TICKET PROMEDIO (ADS) ═══ */}
      <KPICard
        icon={<IconHash size={16} />}
        accentColor="#a78bfa"
        label="Ticket promedio"
        mainValue={renderMultiCurrency(adsByCurrency, "#a78bfa", "22px")}
        sub={
          acceptedCount > 0
            ? `Avg deal size · ${acceptedCount} aceptadas`
            : "Sin cotizaciones aceptadas"
        }
        progress={
          quotations.length > 0
            ? Math.min((acceptedCount / quotations.length) * 100, 100)
            : 0
        }
        progressColor="#a78bfa"
      />

      {/* ═══ KPI 5 — SALES VELOCITY ═══ */}
      <KPICard
        icon={<IconClock size={16} />}
        accentColor={velocityBenchmark.color}
        label="Velocidad de cierre"
        mainValue={
          <span
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: velocityBenchmark.color,
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {avgClosureDays === 0 ? "—" : `${avgClosureDays}d`}
          </span>
        }
        sub={
          <>
            <span style={{ color: velocityBenchmark.color, fontWeight: 700 }}>
              {velocityBenchmark.label}
            </span>
            {avgClosureDays > 0 && " · industria 5–7d"}
          </>
        }
        progress={
          avgClosureDays === 0 ? 0 : Math.min((7 / Math.max(avgClosureDays, 1)) * 100, 100)
        }
        progressColor={velocityBenchmark.color}
      />

      {/* ═══ KPI 6 — DATA QUALITY ═══ */}
      <KPICard
        icon={<IconShieldCheck size={16} />}
        accentColor={dqBenchmark.color}
        label="Calidad de datos"
        mainValue={
          <span
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: dqBenchmark.color,
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {dqAvg}%
          </span>
        }
        sub={
          <>
            <span style={{ color: dqBenchmark.color, fontWeight: 700 }}>
              {dqBenchmark.label}
            </span>{" "}
            · {dqComplete}/{quotations.length} completas
          </>
        }
        progress={dqAvg}
        progressColor={dqBenchmark.color}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// KPI CARD — Componente reutilizable nivel ERP
// ═══════════════════════════════════════════════════════════════════
function KPICard({
  icon,
  accentColor,
  label,
  mainValue,
  sub,
  progress = 0,
  progressColor,
}: {
  icon: React.ReactNode;
  accentColor: string;
  label: string;
  mainValue: React.ReactNode;
  sub: React.ReactNode;
  progress?: number;
  progressColor?: string;
}) {
  return (
    <div
      style={{
        background: "var(--color-bg-base)",
        border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        minWidth: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent bar superior */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: accentColor,
          opacity: 0.6,
        }}
      />

      {/* Header — icono + label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "var(--radius-sm)",
            background: `${accentColor}15`,
            border: `1px solid ${accentColor}25`,
            color: accentColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      </div>

      {/* Valor principal */}
      <div style={{ minHeight: "30px" }}>{mainValue}</div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: "10px",
          color: "var(--color-text-muted)",
          lineHeight: 1.4,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {sub}
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "3px",
          background: "var(--color-border-faint)",
          borderRadius: "var(--radius-full)",
          overflow: "hidden",
          marginTop: "2px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: progressColor ?? accentColor,
            borderRadius: "var(--radius-full)",
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}