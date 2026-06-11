import { NavLink } from "react-router-dom";
import { Building2, ClipboardCheck, History } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    path: "/",
    label: "房源销控",
    icon: Building2,
  },
  {
    path: "/approval",
    label: "锁定审批",
    icon: ClipboardCheck,
  },
  {
    path: "/history",
    label: "历史记录",
    icon: History,
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-[#0F4C5C] flex flex-col fixed left-0 top-0 z-40">
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-white font-bold text-lg tracking-wide">
            售楼处销控系统
          </h1>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                      isActive
                        ? "bg-white/15 text-white shadow-lg"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          "w-5 h-5 transition-colors",
                          isActive ? "text-white" : "text-white/70 group-hover:text-white"
                        )}
                      />
                      <span className="font-medium text-sm">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="text-white/50 text-xs text-center">
          © 2026 销控系统 v1.0
        </div>
      </div>
    </aside>
  );
}
