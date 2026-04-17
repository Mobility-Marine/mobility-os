type LineChartProps = {
  data:        { label: string; value: number; value2?: number }[];
  height?:     number;
  color1?:     string;
  color2?:     string;
  label1?:     string;
  label2?:     string;
  formatValue?:(v: number) => string;
  area?:       boolean;
};

export default function LineChart({ data, height = 180, color1 = "var(--color-brand-blue)", color2 = "var(--color-danger-text)", label1, label2, formatValue, area = true }: LineChartProps) {
  if (!data.length) return null;
  const fmt     = formatValue ?? ((v: number) => v.toLocaleString("es-MX", { minimumFractionDigits: 0 }));
  const allVals = data.flatMap(d => [d.value, d.value2 ?? 0]);
  const maxVal  = Math.max(...allVals, 1);
  const minVal  = 0;
  const W       = 500;
  const H       = height;
  const PAD     = { top: 16, right: 16, bottom: 28, left: 50 };
  const chartW  = W - PAD.left - PAD.right;
  const chartH  = H - PAD.top - PAD.bottom;

  function xPos(i: number) { return PAD.left + (i / (data.length - 1)) * chartW; }
  function yPos(v: number) { return PAD.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH; }

  const path1 = data.map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yPos(d.value)}`).join(" ");
  const area1 = path1 + ` L${xPos(data.length - 1)},${PAD.top + chartH} L${xPos(0)},${PAD.top + chartH} Z`;
  const hasDual = data.some(d => d.value2 !== undefined);
  const path2   = hasDual ? data.map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yPos(d.value2 ?? 0)}`).join(" ") : "";
  const area2   = hasDual ? path2 + ` L${xPos(data.length - 1)},${PAD.top + chartH} L${xPos(0)},${PAD.top + chartH} Z` : "";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: `${H}px` }}>
      <defs>
        <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color1} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color1} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color2} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color2} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = PAD.top + chartH * (1 - pct);
        return (
          <g key={pct}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--color-border-faint)" strokeWidth="1" strokeDasharray="3,3" />
            <text x={PAD.left - 4} y={y + 3} fontSize="8" fill="var(--color-text-muted)" textAnchor="end">
              {fmt(maxVal * pct)}
            </text>
          </g>
        );
      })}
      {/* Áreas */}
      {area && <path d={area1} fill="url(#grad1)" />}
      {area && hasDual && <path d={area2} fill="url(#grad2)" />}
      {/* Líneas */}
      <path d={path1} fill="none" stroke={color1} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {hasDual && <path d={path2} fill="none" stroke={color2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5,3" />}
      {/* Puntos */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xPos(i)} cy={yPos(d.value)} r="3.5" fill={color1} stroke="var(--color-bg-base)" strokeWidth="1.5">
            <title>{d.label}: {fmt(d.value)}</title>
          </circle>
          {hasDual && d.value2 !== undefined && (
            <circle cx={xPos(i)} cy={yPos(d.value2)} r="3" fill={color2} stroke="var(--color-bg-base)" strokeWidth="1.5">
              <title>{d.label}: {fmt(d.value2)}</title>
            </circle>
          )}
          <text x={xPos(i)} y={H - 6} fontSize="8" fill="var(--color-text-muted)" textAnchor="middle">{d.label}</text>
        </g>
      ))}
      {/* Leyenda */}
      {label1 && (
        <g>
          <line x1={PAD.left} y1={H - PAD.bottom + 14} x2={PAD.left + 16} y2={H - PAD.bottom + 14} stroke={color1} strokeWidth="2.5" />
          <text x={PAD.left + 20} y={H - PAD.bottom + 17} fontSize="8" fill="var(--color-text-muted)">{label1}</text>
          {label2 && (
            <>
              <line x1={PAD.left + 80} y1={H - PAD.bottom + 14} x2={PAD.left + 96} y2={H - PAD.bottom + 14} stroke={color2} strokeWidth="2" strokeDasharray="4,2" />
              <text x={PAD.left + 100} y={H - PAD.bottom + 17} fontSize="8" fill="var(--color-text-muted)">{label2}</text>
            </>
          )}
        </g>
      )}
    </svg>
  );
}
