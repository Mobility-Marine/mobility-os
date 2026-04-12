type Tone = "default" | "success" | "warning" | "danger" | "info";

const toneColor: Record<Tone, string> = {
  default: "var(--color-text-primary)",
  success: "var(--color-success-text)",
  warning: "var(--color-warning-text)",
  danger:  "var(--color-danger-text)",
  info:    "var(--color-info-text)",
};

const toneBg: Record<Tone, string> = {
  default: "transparent",
  success: "var(--color-success-bg)",
  warning: "var(--color-warning-bg)",
  danger:  "var(--color-danger-bg)",
  info:    "var(--color-info-bg)",
};

const toneBorder: Record<Tone, string> = {
  default: "var(--color-border-faint)",
  success: "var(--color-success-border)",
  warning: "var(--color-warning-border)",
  danger:  "var(--color-danger-border)",
  info:    "var(--color-info-border)",
};

interface MetricCardProps {
  title: string;
  value: string;
  delta?: string;
  subtitle?: string;
  tone?: Tone;
  trend?: "up" | "down" | "neutral";
}

function TrendArrow({ direction }: { direction: "up" | "down" | "neutral" }) {
  if (direction === "neutral") return null;
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ color: direction === "up" ? "var(--color-success-text)" : "var(--color-danger-text)" }}
    >
      {direction === "up"
        ? <polyline points="18 15 12 9 6 15"/>
        : <polyline points="6 9 12 15 18 9"/>
      }
    </svg>
  );
}

export default function MetricCard({
  title, value, delta, subtitle, tone = "default", trend,
}: MetricCardProps) {
  const isColored = tone !== "default";
  return (
    <div style={{
      background:   isColored ? toneBg[tone] : "var(--color-bg-subtle)",
      border:       `1px solid ${toneBorder[tone]}`,
      borderRadius: "var(--radius-md)",
      padding:      "14px 16px",
      display:      "grid",
      gap:          "4px",
      transition:   "var(--transition-fast)",
      position:     "relative",
      overflow:     "hidden",
    }}>
      {/* ACCENT LINE */}
      {isColored && (
        <div style={{
          position:     "absolute",
          top: 0, left: 0, right: 0,
          height:       "3px",
          background:   toneColor[tone],
          opacity:      0.6,
          borderRadius: "var(--radius-md) var(--radius-md) 0 0",
        }} />
      )}

      <div style={{
        fontSize:   "11px",
        color:      "var(--color-text-muted)",
        fontWeight: 500,
        letterSpacing: "0.2px",
      }}>
        {title}
      </div>

      <div style={{
        display:    "flex",
        alignItems: "baseline",
        gap:        "6px",
        marginTop:  "2px",
      }}>
        <div style={{
          fontSize:   "28px",
          fontWeight: 700,
          lineHeight: 1,
          color:      toneColor[tone],
          fontVariantNumeric: "tabular-nums",
        }}>
          {value}
        </div>
        {trend && <TrendArrow direction={trend} />}
      </div>

      {delta && (
        <div style={{ fontSize: "13px", color: "var(--color-text-second)", fontWeight: 500 }}>
          {delta}
        </div>
      )}
      {subtitle && (
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "1px" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
