type Tone = "default" | "success" | "warning" | "danger" | "info";

const toneColor: Record<Tone, string> = {
  default:  "var(--color-text-primary)",
  success:  "var(--color-success-text)",
  warning:  "var(--color-warning-text)",
  danger:   "var(--color-danger-text)",
  info:     "var(--color-info-text)",
};

interface MetricCardProps {
  title: string;
  value: string;
  delta?: string;
  subtitle?: string;
  tone?: Tone;
}

export default function MetricCard({ title, value, delta, subtitle, tone = "default" }: MetricCardProps) {
  return (
    <div style={{
      background: "var(--color-bg-subtle)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-md)",
      padding: "16px",
      display: "grid",
      gap: "4px",
    }}>
      <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
        {title}
      </div>
      <div style={{ fontSize: "30px", fontWeight: 700, lineHeight: 1, color: toneColor[tone] }}>
        {value}
      </div>
      {delta && (
        <div style={{ fontSize: "13px", color: "var(--color-text-second)", fontWeight: 500 }}>
          {delta}
        </div>
      )}
      {subtitle && (
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
