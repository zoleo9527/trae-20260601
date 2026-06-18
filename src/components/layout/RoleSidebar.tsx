import { useAppStore } from "@/store/useAppStore";
import type { UserRole } from "@/types";
import { Receipt, ChefHat, Users, Flame } from "lucide-react";

const roles: { key: UserRole; name: string; icon: typeof Receipt; desc: string }[] = [
  { key: "cashier", name: "收银台", icon: Receipt, desc: "团购核销入口" },
  { key: "kitchen_lead", name: "后厨主管", icon: ChefHat, desc: "出品与客诉处理" },
  { key: "floor_manager", name: "前厅经理", icon: Users, desc: "客诉回访与全量视图" },
];

export default function RoleSidebar() {
  const { currentRole, setCurrentRole } = useAppStore();

  return (
    <aside className="w-60 bg-gradient-to-b from-ink-900 to-ink-800 text-white min-h-screen flex flex-col">
      <div className="p-5 border-b border-ink-700/50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-flame-500 to-flame-700 flex items-center justify-center shadow-pop">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-base leading-tight">火锅运营台</div>
            <div className="text-xs text-ink-400">团购核销 · 客诉回访</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {roles.map((r) => {
          const active = currentRole === r.key;
          const Icon = r.icon;
          return (
            <button
              key={r.key}
              onClick={() => setCurrentRole(r.key)}
              className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                active
                  ? "bg-gradient-to-r from-flame-600/90 to-flame-700/90 shadow-pop"
                  : "hover:bg-ink-700/40"
              }`}
            >
              <Icon className={`w-5 h-5 mt-0.5 ${active ? "text-white" : "text-ink-400"}`} />
              <div>
                <div className={`text-sm font-medium ${active ? "text-white" : "text-ink-200"}`}>
                  {r.name}
                </div>
                <div className="text-xs text-ink-400 mt-0.5">{r.desc}</div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-ink-700/50">
        <div className="text-xs text-ink-500">当前角色</div>
        <div className="text-sm text-ink-200 mt-1">
          {roles.find((r) => r.key === currentRole)?.name}
        </div>
      </div>
    </aside>
  );
}
