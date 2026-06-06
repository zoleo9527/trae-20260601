import { NavLink } from "react-router-dom";
import { Home, FileText, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import { ROLE_MAP } from "@/utils/status";

const navItems = [
  { path: "/", label: "工作台", icon: Home },
  { path: "/reviews", label: "场次复盘", icon: FileText },
  { path: "/logs", label: "操作日志", icon: Clock },
];

export function Sidebar() {
  const { currentUser } = useUserStore();

  return (
    <aside className="w-64 bg-navy-900 min-h-screen flex flex-col">
      <div className="p-6 border-b border-navy-700">
        <h1 className="font-serif text-xl font-bold text-white">直播运营中心</h1>
        <p className="text-navy-300 text-sm mt-1">场次复盘与异常订单</p>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200",
                      isActive
                        ? "bg-amber-500/20 text-amber-400 border-l-2 border-amber-500"
                        : "text-navy-200 hover:bg-navy-800 hover:text-white"
                    )
                  }
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-navy-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <User className="text-amber-400" size={20} />
          </div>
          <div>
            <p className="text-white font-medium text-sm">{currentUser.name}</p>
            <p className="text-navy-400 text-xs">{ROLE_MAP[currentUser.role].label}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
