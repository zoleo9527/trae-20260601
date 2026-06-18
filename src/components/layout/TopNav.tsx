import { Link, useLocation } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { LayoutDashboard, ReceiptText, MessageSquareWarning, Bell, Search } from "lucide-react";

const navItems = [
  { path: "/", label: "工作台", icon: LayoutDashboard },
  { path: "/verification", label: "团购核销", icon: ReceiptText },
  { path: "/complaints", label: "客诉回访", icon: MessageSquareWarning },
];

export default function TopNav() {
  const loc = useLocation();
  const { currentRole } = useAppStore();
  const roleName = { cashier: "张婷（收银）", kitchen_lead: "赵刚（后厨主管）", floor_manager: "陈静（前厅经理）" }[currentRole];

  return (
    <header className="h-16 bg-white border-b border-ink-200 flex items-center px-6 sticky top-0 z-20">
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = loc.pathname === item.path || (item.path !== "/" && loc.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                active ? "bg-flame-50 text-flame-700" : "text-ink-600 hover:bg-ink-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 flex justify-center">
        <div className="relative w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="搜索核销单号、客诉单号、桌号..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-ink-100 border border-transparent focus:border-brand-300 focus:bg-white focus:outline-none text-sm transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-ink-100 transition-colors">
          <Bell className="w-5 h-5 text-ink-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-flame-500 animate-pulse-dot"></span>
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-ink-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-flame-600 flex items-center justify-center text-white text-sm font-bold">
            {roleName[0]}
          </div>
          <span className="text-sm text-ink-700">{roleName}</span>
        </div>
      </div>
    </header>
  );
}
