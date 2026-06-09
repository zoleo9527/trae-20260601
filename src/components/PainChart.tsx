import type { PainRecord } from '@/types';

interface PainChartProps {
  data: PainRecord[];
  width?: number;
  height?: number;
}

export default function PainChart({ data, width = 280, height = 80 }: PainChartProps) {
  if (data.length < 2) return null;

  const padding = { top: 8, right: 8, bottom: 20, left: 24 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const xStep = chartW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartH - (d.score / 10) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="painGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D9488" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0D9488" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {[0, 2, 4, 6, 8, 10].map((v) => {
        const y = padding.top + chartH - (v / 10) * chartH;
        return (
          <g key={v}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#E2E8F0" strokeWidth="0.5" />
            <text x={padding.left - 4} y={y + 3} textAnchor="end" className="text-[9px] fill-slate-400">{v}</text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#painGrad)" />
      <path d={linePath} fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="white" stroke="#0D9488" strokeWidth="1.5" />
          {i === 0 || i === points.length - 1 ? (
            <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[9px] fill-teal-700 font-medium font-mono">{p.score}</text>
          ) : null}
          <text x={p.x} y={height - 2} textAnchor="middle" className="text-[8px] fill-slate-400">{p.date}</text>
        </g>
      ))}
    </svg>
  );
}
