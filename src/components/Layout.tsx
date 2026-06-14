import { NavLink, Outlet } from "react-router-dom"
import { useExamStore } from "@/store"
import { LayoutDashboard, Building2, Armchair, FileText, ChevronLeft, ChevronRight, Shield, UserCheck, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OperatorRole } from "@/data/types"

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "工作台" },
  { to: "/arrangement", icon: Building2, label: "考场编排" },
  { to: "/seat-allocation", icon: Armchair, label: "座位分配" },
  { to: "/audit-trail", icon: FileText, label: "流转记录" },
]

const roleConfig: Record<OperatorRole, { icon: typeof Shield; label: string; color: string }> = {
  exam_staff: { icon: Shield, label: "考务专员", color: "text-teal-700" },
  invigilator: { icon: UserCheck, label: "监考老师", color: "text-blue-700" },
  tech_support: { icon: Wrench, label: "技术支持", color: "text-amber-700" },
}

export default function Layout() {
  const { sidebarCollapsed, toggleSidebar, currentRole, currentOperatorName, setRole } = useExamStore()
  const rc = roleConfig[currentRole]
  const RoleIcon = rc.icon

  return (
    <div className="flex h-screen bg-slate-50">
      <aside
        className={cn(
          "flex flex-col border-r border-slate-200 bg-white transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-56"
        )}
      >
        <div className={cn("flex h-14 items-center border-b border-slate-200 px-4", sidebarCollapsed ? "justify-center" : "gap-3")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white text-sm font-bold shrink-0">
            考
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate">考务中心</div>
              <div className="text-[10px] text-slate-400 truncate">考场编排与座位分配</div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-teal-50 text-teal-700 font-medium"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800",
                  sidebarCollapsed && "justify-center px-0"
                )
              }
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={cn("border-t border-slate-200 p-3", sidebarCollapsed && "px-2")}>
          {!sidebarCollapsed && (
            <div className="mb-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">当前角色</div>
              <div className="flex gap-1">
                {(Object.keys(roleConfig) as OperatorRole[]).map((role) => {
                  const cfg = roleConfig[role]
                  const RIcon = cfg.icon
                  return (
                    <button
                      key={role}
                      onClick={() => setRole(role)}
                      className={cn(
                        "flex items-center gap-1 rounded-md px-2 py-1.5 text-xs transition-colors",
                        currentRole === role
                          ? "bg-teal-50 text-teal-700 font-medium ring-1 ring-teal-200"
                          : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      <RIcon className="h-3 w-3" />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <div className={cn("flex items-center gap-2", sidebarCollapsed && "justify-center")}>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600 shrink-0">
              {currentOperatorName[0]}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-700 truncate">{currentOperatorName}</div>
                <div className={cn("text-[10px] truncate", rc.color)}>{rc.label}</div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={toggleSidebar}
          className="flex h-8 items-center justify-center border-t border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-2">
            <RoleIcon className={cn("h-4 w-4", rc.color)} />
            <span className="text-sm text-slate-600">{rc.label}工作台</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>{new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
