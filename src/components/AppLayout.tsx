import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/auth"
import { ROLE_LABELS } from "@/types"
import { cn } from "@/lib/utils"
import {
  Flower2,
  Truck,
  HeadphonesIcon,
  LogOut,
  Search,
  Home,
} from "lucide-react"

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  if (!user) {
    navigate("/")
    return null
  }

  const roleColor: Record<string, string> = {
    FLORIST: "text-pink-400",
    DISPATCHER: "text-amber-400",
    AFTERCARE: "text-emerald-400",
  }

  const navItems = [
    {
      role: "FLORIST",
      path: "/florist",
      icon: <Flower2 size={18} />,
      label: "花艺工作台",
    },
    {
      role: "DISPATCHER",
      path: "/dispatcher",
      icon: <Truck size={18} />,
      label: "调度工作台",
    },
    {
      role: "AFTERCARE",
      path: "/aftercare",
      icon: <HeadphonesIcon size={18} />,
      label: "售后工作台",
    },
  ]

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const activeNav = navItems.find((n) => location.pathname.startsWith(n.path))

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-zinc-100 flex">
      <aside className="w-64 border-r border-zinc-800 bg-[#14141f] flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-amber-500 flex items-center justify-center">
              <Search size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm">鲜花配送站</h1>
              <p className="text-[10px] text-zinc-500">采购分级系统</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => navigate("/")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
            )}
          >
            <Home size={18} />
            角色切换
          </button>

          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                activeNav?.path === item.path
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
                user.role === item.role ? "ring-1 ring-inset ring-zinc-700" : ""
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div
              className={cn(
                "w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-lg",
                roleColor[user.role]
              )}
            >
              {user.role === "FLORIST" && <Flower2 size={18} />}
              {user.role === "DISPATCHER" && <Truck size={18} />}
              {user.role === "AFTERCARE" && <HeadphonesIcon size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-[10px] text-zinc-500">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors"
          >
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
