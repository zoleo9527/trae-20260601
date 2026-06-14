import { ROLE_META } from "@/constants";
import type { UserRole } from "@/types";
import { cn } from "@/utils";

interface Props {
  role: UserRole;
  className?: string;
}

export default function RoleBadge({ role, className }: Props) {
  const meta = ROLE_META[role];
  return <span className={cn("chip", meta.color, className)}>{meta.label}</span>;
}
