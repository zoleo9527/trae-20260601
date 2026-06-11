import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Bell, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { users } from "@/data/users";
import type { User as UserType } from "@/types";

const pageTitleMap: Record<string, string> = {
  "/": "房源销控",
  "/approval": "锁定审批",
  "/history": "历史记录",
};

const roleOptions: Array<{ value: UserType["role"]; label: string }> = [
  { value: "consultant", label: "置业顾问" },
  { value: "manager", label: "案场经理" },
  { value: "controller", label: "销控员" },
];

interface HeaderProps {
  currentUser: UserType;
  onUserChange: (user: UserType) => void;
}

export default function Header({ currentUser, onUserChange }: HeaderProps) {
  const location = useLocation();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserType["role"]>(currentUser.role);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const pageTitle = pageTitleMap[location.pathname] || "售楼处销控系统";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setShowRoleDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRoleChange = (role: UserType["role"]) => {
    setSelectedRole(role);
    setShowRoleDropdown(false);
    const user = users.find((u) => u.role === role);
    if (user) {
      onUserChange(user);
    }
  };

  const handleUserSelect = (user: UserType) => {
    setSelectedRole(user.role);
    setShowUserMenu(false);
    onUserChange(user);
  };

  const filteredUsers = users.filter((u) => u.role === selectedRole);

  return (
    <header className="h-16 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-6 fixed top-0 left-64 right-0 z-30">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-slate-800">{pageTitle}</h2>
        <div className="h-6 w-px bg-slate-200" />
        <div className="relative" ref={roleDropdownRef}>
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-sm text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
          >
            <span className="text-slate-400">当前角色：</span>
            <span className="font-medium text-slate-700">{roleOptions.find((r) => r.value === selectedRole)?.label}</span>
            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showRoleDropdown && "rotate-180")} />
          </button>
          {showRoleDropdown && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
              {roleOptions.map((role) => (
                <button
                  key={role.value}
                  onClick={() => handleRoleChange(role.value)}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm transition-colors",
                    selectedRole === role.value
                      ? "bg-primary/5 text-primary font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {role.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-slate-700">{currentUser.name}</div>
              <div className="text-xs text-slate-400">{currentUser.roleName}</div>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showUserMenu && "rotate-180")} />
          </button>
          {showUserMenu && (
            <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-xs text-slate-400 mb-2">切换用户</div>
                <div className="space-y-1">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors",
                        currentUser.id === user.id
                          ? "bg-primary/5 text-primary"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-sm">{user.name}</span>
                      <span className="text-xs text-slate-400 ml-auto">{user.department}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-4 py-2 pt-2">
                <button className="w-full text-left text-sm text-slate-600 hover:text-danger transition-colors">
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
