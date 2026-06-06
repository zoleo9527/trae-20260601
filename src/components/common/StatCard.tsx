import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  onClick?: () => void;
}

export function StatCard({ title, value, icon: Icon, color, bgColor, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg border p-5 shadow-card transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className={cn("text-3xl font-bold", color)}>{value}</p>
        </div>
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", bgColor)}>
          <Icon className={cn("w-6 h-6", color)} />
        </div>
      </div>
    </div>
  );
}
