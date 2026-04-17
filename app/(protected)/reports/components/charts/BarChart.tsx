type BarChartProps = {
  data:        { label: string; value: number; value2?: number; color?: string; color2?: string }[];
  height?:     number;
  formatValue?:(v: number) => string;
  dual?:       boolean;
  label1?:     string;
  label2?:     string;
};

export default function BarChart({ data, height = 200, formatValue, dual = false, label1, label2 }: BarChartProps) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.flatMap(d => dual ? [d.value, d.value2 ?? 0] : [d.value]), 1);
  const fmt = formatValue ?? ((v: number) => v.toLocaleString("es-MX", { minimumFractionDigits: 0 }));
  const BAR_W = dual ? 8 : 14;
  const GAP   = dual ? 20 : 14;
  const W     = data.length * (dual ? BAR_W * 2 + 4 + GAP : BAR_W + GAP);

  return (
    <svg viewBox={`0 0 ${W + 20} ${height + 40}`} style={{ width: "100%", height: `${height + 40}px` }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = 10 + (height - 20) * (1 - pct);
        return (
          <g key={pct}>
            <line x1="20" y1={y} x2={W + 20} y2={y} stroke="var(--color-border-faint)" strokeWidth="1" />
            <text x="16" y={y + 3} fontSize="7" fill="var(--color-text-muted)" textAnchor="end">
              {fmt(maxVal * pct)}
            </text>
          </g>
        );
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const x     = 24 + i * (dual ? BAR_W * 2 + 4 + GAP : BAR_W + GAP);
        const barH  = Math.max(2, ((d.value / maxVal) * (height - 20)));
        const y     = 10 + (height - 20) - barH;
        const barH2 = dual && d.value2 ? Math.max(2, ((d.value2 / maxVal) * (height - 20))) : 0;
        const y2    = 10 + (height - 20) - barH2;
        return (
          <g key={i}>
            <rect x={x} y={y} width={BAR_W} height={barH}
              fill={d.color ?? "var(--color-brand-blue)"} rx="2" opacity="0.9">
              <title>{d.label}: {fmt(d.value)}</title>
            </rect>
            {dual && d.value2 !== undefined && (
              <rect x={x + BAR_W + 4} y={y2} width={BAR_W} height={barH2}
                fill={d.color2 ?? "var(--color-danger-text)"} rx="2" opacity="0.9">
                <title>{d.label}: {fmt(d.value2)}</title>
              </rect>
            )}
            <text x={x + (dual ? BAR_W + 2 : BAR_W / 2)} y={height + 26}
              fontSize="8" fill="var(--color-text-muted)" textAnchor="middle">
              {d.label.length > 5 ? d.label.substring(0, 5) + "…" : d.label}
            </text>
          </g>
        );
      })}
      {/* Leyenda dual */}
      {dual && label1 && label2 && (
        <g>
          <rect x="24" y={height + 32} width="8" height="6" fill="var(--color-brand-blue)" rx="1" />
          <text x="35" y={height + 38} fontSize="8" fill="var(--color-text-muted)">{label1}</text>
          <rect x="90" y={height + 32} width="8" height="6" fill="var(--color-danger-text)" rx="1" />
          <text x="101" y={height + 38} fontSize="8" fill="var(--color-text-muted)">{label2}</text>
        </g>
      )}
    </svg>
  );
}
