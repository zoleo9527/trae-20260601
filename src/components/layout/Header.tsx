import { useState, useRef, useEffect } from "react";
import { Bell, Search, ChevronDown, User } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { ROLE_MAP } from "@/utils/status";
import type { UserRole } from "@/types";
import { mockUsers } from "@/utils/mock";
import { cn } from "@/lib/utils";

export function Header() {
  const { currentUser, switchRole } = useUserStore();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchRole = (role: UserRole) => {
    switchRole(role);
    setShowRoleMenu(false);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索场次号、主播、订单号..."
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md w-80 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-gray-100 rounded-md transition-colors">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-status-error rounded-full"></span>
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center">
              <User size={16} className="text-navy-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
              <p className={cn("text-xs", ROLE_MAP[currentUser.role].color)}>
                {ROLE_MAP[currentUser.role].label}
              </p>
            </div>
            <ChevronDown size={16} className={cn("text-gray-400 transition-transform", showRoleMenu && "rotate-180")} />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg border shadow-lg py-2 z-50">
              <p className="px-4 py-2 text-xs text-gray-500 font-medium">切换角色（测试用）</p>
              {mockUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSwitchRole(user.role)}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2",
                    currentUser.role === user.role && "bg-navy-50 text-navy-700"
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-navy-100 flex items-center justify-center">
                    <User size={12} className="text-navy-600" />
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className={cn("text-xs", ROLE_MAP[user.role].color)}>
                      {ROLE_MAP[user.role].label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
