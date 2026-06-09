import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, FilePlus, ArrowLeftRight, LogOut, Stethoscope } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { ROLE_LABELS } from "@/types";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "工作台", icon: LayoutDashboard },
  { to: "/referral/new", label: "转诊申请", icon: FilePlus },
  { to: "/returns", label: "结果回传", icon: ArrowLeftRight },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-zinc-50">
      <aside className="w-60 bg-zinc-900 text-zinc-300 flex flex-col shrink-0">
        <div className="h-14 flex items-center gap-2 px-5 border-b border-zinc-700">
          <Stethoscope className="w-5 h-5 text-teal-400" />
          <span className="text-sm font-bold text-white tracking-wide">
            社区卫生站转诊系统
          </span>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-teal-600 text-white font-medium"
                    : "hover:bg-zinc-800 text-zinc-400"
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="border-t border-zinc-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{user.displayName}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-zinc-700 text-zinc-300">
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="min-w-[1024px] p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
