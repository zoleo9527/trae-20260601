import { ChevronDown, User } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store";
import { USERS, ROLE_META } from "@/constants";
import type { UserRole } from "@/types";
import { cn } from "@/utils";
import Avatar from "./Avatar";

const roleLabels: Record<UserRole, string> = {
  admin: "教务",
  teacher: "舞蹈老师",
  principal: "校长",
};

export default function UserSwitcher() {
  const { currentUser, setCurrentUser } = useAppStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream-100 transition-colors"
      >
        <Avatar name={currentUser.name} role={currentUser.role} size="sm" />
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium text-ink-800">{currentUser.name}</div>
          <div className="text-xs text-ink-500">{ROLE_META[currentUser.role].label}</div>
        </div>
        <ChevronDown size={16} className={cn("text-ink-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 card py-2 z-20 shadow-card-hover">
            <div className="px-3 py-2 text-xs text-ink-400 border-b border-cream-200 mb-1">
              切换身份以模拟不同角色操作
            </div>
            {(Object.keys(USERS) as UserRole[]).map((role) => (
              <div key={role} className="px-2">
                <div className="text-[11px] text-ink-400 px-2 py-1.5 pt-2">
                  {roleLabels[role]}
                </div>
                {USERS[role].map((u) => {
                  const active = u.name === currentUser.name && u.role === currentUser.role;
                  return (
                    <button
                      key={u.name}
                      onClick={() => {
                        setCurrentUser(u);
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors text-left",
                        active ? "bg-wine-50 text-wine-800" : "hover:bg-cream-100 text-ink-700"
                      )}
                    >
                      <Avatar name={u.name} role={u.role} size="sm" />
                      <span>{u.name}</span>
                      {active && <User size={14} className="ml-auto text-wine-600" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
