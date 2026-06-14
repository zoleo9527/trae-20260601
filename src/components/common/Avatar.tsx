import { ROLE_META } from "@/constants";
import type { UserRole } from "@/types";
import { cn } from "@/utils";

interface Props {
  name: string;
  role: UserRole;
  size?: "xs" | "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const sizeMap = {
  xs: "w-4 h-4 text-[9px]",
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
};

export default function Avatar({ name, role, size = "md", showName = false, className }: Props) {
  const meta = ROLE_META[role];
  const initial = name.slice(-2);
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-semibold shadow-sm",
          meta.avatarColor,
          sizeMap[size]
        )}
        title={`${name}（${meta.label}）`}
      >
        {initial}
      </div>
      {showName && <span className="text-sm text-ink-700">{name}</span>}
    </div>
  );
}
