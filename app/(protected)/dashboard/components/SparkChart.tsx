interface SparkChartProps {
  data: number[];
  title: string;
  label: string;
}

export default function SparkChart({ data, title, label }: SparkChartProps) {
  const max = Math.max(...data, 1);

  return (
    <div style={{
      background: "var(--color-bg-subtle)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-md)",
      padding: "14px",
      display: "grid",
      gap: "10px",
    }}>
      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-second)" }}>
        {title}
      </div>
      <div style={{ height: "60px", display: "flex", alignItems: "flex-end", gap: "4px" }}>
        {data.map((val, i) => (
          <div key={i} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }}>
            <div style={{
              width: "100%",
              height: `${Math.max((val / max) * 100, 6)}%`,
              background: "var(--color-brand-blue)",
              opacity: 0.25 + (i / (data.length - 1)) * 0.75,
              borderRadius: "3px 3px 0 0",
            }} />
          </div>
        ))}
      </div>
      <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
        {label}
      </div>
    </div>
  );
}
