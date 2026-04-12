interface SparkChartProps {
  data: number[];
  title: string;
  label: string;
  color?: string;
}

export default function SparkChart({
  data, title, label,
  color = "var(--color-brand-blue)",
}: SparkChartProps) {
  const max    = Math.max(...data, 1);
  const last   = data[data.length - 1];
  const prev   = data[data.length - 2];
  const trend  = last > prev ? "up" : last < prev ? "down" : "neutral";
  const trendColor = trend === "up"
    ? "var(--color-success-text)"
    : trend === "down"
    ? "var(--color-danger-text)"
    : "var(--color-text-muted)";

  return (
    <div style={{
      background: "var(--color-bg-subtle)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-md)",
      padding: "14px",
      display: "grid",
      gap: "8px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-second)" }}>
          {title}
        </div>
        {trend !== "neutral" && (
          <svg
            width="12" height="12" viewBox="0 0 24 24"
            fill="none" stroke={trendColor} strokeWidth="2.5"
          >
            {trend === "up"
              ? <polyline points="18 15 12 9 6 15"/>
              : <polyline points="6 9 12 15 18 9"/>
            }
          </svg>
        )}
      </div>

      <div style={{ height: "56px", display: "flex", alignItems: "flex-end", gap: "3px" }}>
        {data.map((val, i) => {
          const isLast = i === data.length - 1;
          const h = Math.max((val / max) * 100, 6);
          return (
            <div key={i} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }}>
              <div style={{
                width: "100%",
                height: `${h}%`,
                background: isLast ? color : color,
                opacity: isLast ? 1 : 0.2 + (i / (data.length - 1)) * 0.6,
                borderRadius: "3px 3px 0 0",
                transition: "height 0.4s ease",
              }} />
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
        {label}
      </div>
    </div>
  );
}
