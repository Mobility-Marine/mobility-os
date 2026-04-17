type DonutChartProps = {
  data:       { label: string; value: number; color: string }[];
  size?:      number;
  centerLabel?:string;
  centerValue?:string;
};

export default function DonutChart({ data, size = 140, centerLabel, centerValue }: DonutChartProps) {
  const total  = data.reduce((s, d) => s + d.value, 0);
  if (!total) return null;
  const cx = size / 2, cy = size / 2, r = size * 0.36, innerR = size * 0.22;

  let startAngle = -90;
  const slices = data.map(d => {
    const pct   = d.value / total;
    const angle = pct * 360;
    const sa    = startAngle;
    startAngle += angle;
    return { ...d, pct, startAngle: sa, endAngle: startAngle };
  });

  function arc(sa: number, ea: number, r: number, ir: number): string {
    const toRad = (a: number) => (a * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(sa));
    const y1 = cy + r * Math.sin(toRad(sa));
    const x2 = cx + r * Math.cos(toRad(ea));
    const y2 = cy + r * Math.sin(toRad(ea));
    const xi1 = cx + ir * Math.cos(toRad(sa));
    const yi1 = cy + ir * Math.sin(toRad(sa));
    const xi2 = cx + ir * Math.cos(toRad(ea));
    const yi2 = cy + ir * Math.sin(toRad(ea));
    const lg  = ea - sa > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${ir} ${ir} 0 ${lg} 0 ${xi1} ${yi1} Z`;
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: `${size}px`, height: `${size}px` }}>
      {slices.map((s, i) => (
        <path key={i} d={arc(s.startAngle, s.endAngle - 0.5, r, innerR)} fill={s.color} opacity="0.9">
          <title>{s.label}: {(s.pct * 100).toFixed(1)}%</title>
        </path>
      ))}
      {centerValue && (
        <>
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--color-text-primary)">{centerValue}</text>
          {centerLabel && <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fill="var(--color-text-muted)">{centerLabel}</text>}
        </>
      )}
    </svg>
  );
}
