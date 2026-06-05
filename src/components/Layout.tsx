import { NavLink, Outlet } from "react-router-dom"
import { Flower2, ClipboardList, BarChart3 } from "lucide-react"
import { useCurrentRole, useComplaintStore } from "@/store/complaintStore"
import { ROLE_LABELS, ROLE_COLORS, ROLE_DEFAULT_NAMES } from "@/types"
import type { Role } from "@/types"

const roles: Role[] = ["cs", "florist", "dispatcher"]

export default function Layout() {
  const { currentRole, setCurrentRole } = useCurrentRole()
  const complaints = useComplaintStore((s) => s.complaints)

  const pendingCount = complaints.filter((c) => c.status === "pending").length
  const processingCount = complaints.filter((c) => c.status === "processing").length

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="w-64 bg-moss-800 text-white flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-moss-700">
          <div className="flex items-center gap-2.5">
            <Flower2 className="w-6 h-6 text-brand-400" />
            <div>
              <h1 className="font-serif text-lg font-semibold tracking-wide">鲜花配送站</h1>
              <p className="text-xs text-moss-300 mt-0.5">客诉补偿 · 花材复盘</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : "sidebar-link-inactive"}`
            }
          >
            <ClipboardList className="w-4.5 h-4.5" />
            <span>客诉工单</span>
            {(pendingCount + processingCount) > 0 && (
              <span className="ml-auto bg-blush-400 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">
                {pendingCount + processingCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/review"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : "sidebar-link-inactive"}`
            }
          >
            <BarChart3 className="w-4.5 h-4.5" />
            <span>复盘分析</span>
          </NavLink>
        </nav>

        <div className="px-4 py-4 border-t border-moss-700">
          <p className="text-xs text-moss-400 mb-2.5">当前角色</p>
          <div className="space-y-1.5">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setCurrentRole(role)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  currentRole === role
                    ? "bg-moss-600 text-white"
                    : "text-moss-300 hover:bg-moss-700 hover:text-white"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${ROLE_COLORS[role]}`} />
                <span>{ROLE_LABELS[role]}</span>
                <span className="text-moss-400 text-xs">{ROLE_DEFAULT_NAMES[role]}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
