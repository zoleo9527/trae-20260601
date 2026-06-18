import type { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Props {
  title: string;
  value: number | string;
  icon: ReactNode;
  accent: string;
  trend?: { value: string; up: boolean };
  onClick?: () => void;
}

export default function StatCard({ title, value, icon, accent, trend, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 shadow-card border-l-4 ${accent} hover:shadow-pop transition-all cursor-pointer`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-ink-500">{title}</div>
          <div className="text-3xl font-bold text-ink-900 mt-2 font-mono tabular-nums">{value}</div>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend.up ? "text-green-600" : "text-red-600"}`}>
              {trend.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-ink-50 flex items-center justify-center text-ink-500">
          {icon}
        </div>
      </div>
    </div>
  );
}
