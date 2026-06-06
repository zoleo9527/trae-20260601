import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number;
  color: "amber" | "red" | "navy" | "green";
  onClick?: () => void;
}

const colorClasses = {
  amber: "bg-amber-50 border-amber-200 text-amber-700",
  red: "bg-red-50 border-red-200 text-status-error",
  navy: "bg-navy-50 border-navy-200 text-navy-700",
  green: "bg-green-50 border-green-200 text-status-success",
};

const iconBgClasses = {
  amber: "bg-amber-500 text-white",
  red: "bg-status-error text-white",
  navy: "bg-navy-600 text-white",
  green: "bg-status-success text-white",
};

export function StatCard({ title, value, icon: Icon, trend, color, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg border p-5 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer",
        colorClasses[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold font-serif">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <TrendingUp size={14} className="text-status-success" />
              ) : (
                <TrendingDown size={14} className="text-status-error" />
              )}
              <span
                className={cn(
                  "text-xs",
                  trend >= 0 ? "text-status-success" : "text-status-error"
                )}
              >
                {trend >= 0 ? "+" : ""}
                {trend}%
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            iconBgClasses[color]
          )}
        >
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
