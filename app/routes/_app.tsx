import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, NavLink, Outlet, useLocation, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import type { Role } from "~/types";
import { ROLE_ICONS, ROLE_LABELS, ROLE_DEFAULT_NAMES, ROLE_COLORS } from "~/types";
import { useRoleStore } from "~/store/roleStore";
import { getRoleFromRequest } from "~/utils/role.server";

const NAV_ITEMS = [
  { to: "/", label: "到期提醒看板", icon: "📅" },
  { to: "/analysis", label: "续约分析", icon: "📊" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const currentRole = getRoleFromRequest(request);
  return json({ currentRole });
}

export default function AppLayout() {
  const { currentRole: serverRole } = useLoaderData<typeof loader>();
  const { currentRole, setCurrentRole } = useRoleStore();
  const location = useLocation();
  const roleFetcher = useFetcher();
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (serverRole && serverRole !== currentRole) {
      setCurrentRole(serverRole as Role);
    }
  }, [serverRole, currentRole, setCurrentRole]);

  const handleSwitchRole = (role: Role) => {
    if (role === currentRole || isSwitching) return;
    setIsSwitching(true);
    const formData = new FormData();
    formData.append("role", role);
    roleFetcher.submit(formData, {
      method: "post",
      action: "/api/set-role",
    });
    setCurrentRole(role);
    setTimeout(() => setIsSwitching(false), 300);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* 侧边导航 */}
      <aside className="w-64 shrink-0 bg-gradient-to-b from-slate-900 to-slate-800 text-slate-100 flex flex-col">
        <Link to="/" className="p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center text-xl">
              🔥
            </div>
            <div>
              <div className="font-serif text-lg font-bold leading-tight">消防维保</div>
              <div className="text-xs text-slate-400 mt-0.5">到期提醒与续约跟进</div>
            </div>
          </div>
        </Link>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              (item.to === "/" && location.pathname === "/") ||
              (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-brand-500/20 text-brand-100 border border-brand-500/30"
                    : "text-slate-300 hover:bg-slate-700/40 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* 角色切换 */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="text-xs text-slate-400 mb-2 px-1">当前角色</div>
          <div className="space-y-1.5">
            {(Object.keys(ROLE_LABELS) as Role[]).map((role) => {
              const active = currentRole === role;
              return (
                <button
                  key={role}
                  onClick={() => handleSwitchRole(role)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    active
                      ? "bg-white/10 border border-white/20 text-white"
                      : "text-slate-400 hover:bg-slate-700/30 hover:text-slate-200"
                  } ${isSwitching ? "opacity-70 cursor-wait" : ""}`}
                >
                  <span className="text-base">{ROLE_ICONS[role]}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium leading-tight">{ROLE_LABELS[role]}</div>
                    <div className="text-xs opacity-70">{ROLE_DEFAULT_NAMES[role]}</div>
                  </div>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶栏 */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-800 font-serif">
              {NAV_ITEMS.find(
                (i) =>
                  (i.to === "/" && location.pathname === "/") ||
                  (i.to !== "/" && location.pathname.startsWith(i.to))
              )?.label || "消防维保系统"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`tag ${ROLE_COLORS[currentRole]} !border-transparent !py-1 !px-3`}
            >
              <span>{ROLE_ICONS[currentRole]}</span>
              <span className="font-medium">
                {ROLE_LABELS[currentRole]} · {ROLE_DEFAULT_NAMES[currentRole]}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              🔔
            </div>
          </div>
        </header>

        {/* 内容 */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
