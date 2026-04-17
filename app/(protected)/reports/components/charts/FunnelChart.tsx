type FunnelChartProps = {
  stages: { label: string; value: number; color: string; pct?: number }[];
};

export default function FunnelChart({ stages }: FunnelChartProps) {
  const maxVal = Math.max(...stages.map(s => s.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {stages.map((s, i) => {
        const pct = (s.value / maxVal) * 100;
        const tasa = i > 0 && stages[i-1].value > 0 ? Math.round((s.value / stages[i-1].value) * 100) : null;
        return (
          <div key={s.label}>
            {i > 0 && tasa !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "2px 0", paddingLeft: `${(100 - pct) / 2}%` }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                <span style={{ fontSize: "9px", color: "var(--color-text-muted)", fontWeight: 600 }}>{tasa}% conversión</span>
              </div>
            )}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div style={{ width: `${pct}%`, minWidth: "60px", height: "32px", borderRadius: "var(--radius-md)", background: s.color, opacity: 0.85, display: "flex", alignItems: "center", paddingLeft: "10px", transition: "width 0.5s", margin: "0 auto", maxWidth: "100%" }}>
                <span style={{ fontSize: "10px", fontWeight: 800, color: "#fff", whiteSpace: "nowrap" }}>
                  {s.value.toLocaleString("es-MX")}
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--color-text-second)", whiteSpace: "nowrap", minWidth: "100px" }}>{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
