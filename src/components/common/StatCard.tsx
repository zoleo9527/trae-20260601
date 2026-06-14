import type { ReactNode } from "react";
import { cn } from "@/utils";

interface Props {
  label: string;
  value: number | string;
  icon?: ReactNode;
  tone?: "wine" | "forest" | "gold" | "ochre" | "ink";
  className?: string;
  onClick?: () => void;
}

const toneMap = {
  wine: "text-wine-700",
  forest: "text-forest-700",
  gold: "text-gold-700",
  ochre: "text-ochre-600",
  ink: "text-ink-700",
};

export default function StatCard({ label, value, icon, tone = "wine", className, onClick }: Props) {
  return (
    <div
      className={cn(
        "card p-5 flex flex-col gap-1 relative overflow-hidden",
        onClick && "card-hover",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <div className={cn("absolute top-0 left-0 right-0 h-0.5", toneMap[tone].replace("text-", "bg-"))} />
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-500 font-medium tracking-wide">{label}</span>
        {icon && <span className={cn(toneMap[tone])}>{icon}</span>}
      </div>
      <div className={cn("font-serif text-3xl font-semibold mt-1", toneMap[tone])}>{value}</div>
    </div>
  );
}
