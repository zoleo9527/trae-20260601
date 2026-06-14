"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import {
  FileCheck,
  Calendar,
  AlertTriangle,
  History,
  LogOut,
  UserCircle,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useUser();

  if (pathname === "/login") return null;

  const navItems = [
    { href: "/", label: "放款确认", icon: FileCheck },
    { href: "/repayment", label: "还款计划", icon: Calendar },
    { href: "/exceptions", label: "异常处理", icon: AlertTriangle },
    { href: "/trace", label: "数据追溯", icon: History },
  ];

  return (
    <nav className="bg-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <FileCheck className="w-8 h-8" />
            <span className="text-xl font-bold">小贷管理系统</span>
          </div>

          <div className="flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "hover:bg-white/10 text-white/80"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <UserCircle className="w-5 h-5" />
                <span className="text-sm">{user.name}</span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded">
                  {user.role === "ADMIN" ? "管理员" : "操作员"}
                </span>
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">退出</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}