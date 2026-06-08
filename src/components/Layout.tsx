import { NavLink, Outlet } from "react-router-dom"
import { LayoutDashboard, FilePlus, ShieldCheck, Train } from "lucide-react"

const navItems = [
  { to: "/", label: "到站总览", icon: LayoutDashboard },
  { to: "/arrival", label: "登记与通知", icon: FilePlus },
  { to: "/pickup", label: "提货校验", icon: ShieldCheck },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <aside className="w-60 flex-shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col">
        <div className="px-5 py-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
              <Train className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-50">货运站到站管理</h1>
              <p className="text-[10px] text-slate-500 tracking-wider">NOTICE & VERIFICATION</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-amber-500/15 text-amber-400 font-medium"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-slate-800">
          <div className="text-[10px] text-slate-600">角色：客服 / 货运员 / 装卸班长</div>
          <div className="text-[10px] text-slate-700 mt-1">v1.0.0 · 铁路货运站</div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
