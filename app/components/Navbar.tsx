import { Form, Link, useLocation } from "@remix-run/react";
import type { Role } from "~/utils/constants";
import { RoleLabel, RoleColor } from "~/utils/constants";

interface NavbarProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
  };
}

export function Navbar({ user }: NavbarProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: "/", label: "工单列表", roles: ["RECEPTIONIST", "TECHNICIAN", "MANAGER"] },
    { path: "/orders/new", label: "新建工单", roles: ["RECEPTIONIST", "MANAGER"] },
    { path: "/alerts", label: "异常提醒", roles: ["MANAGER", "RECEPTIONIST", "TECHNICIAN"] },
  ];

  const filteredItems = menuItems.filter((item) => item.roles.includes(user.role));

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
                修
              </div>
              <span className="font-semibold text-slate-800 text-lg">手机维修店管理系统</span>
            </Link>
            <div className="flex items-center gap-1">
              {filteredItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${RoleColor[user.role]}`}>
                {RoleLabel[user.role]}
              </span>
              <span className="text-sm text-slate-700 font-medium">{user.name}</span>
            </div>
            <Form action="/logout" method="post">
              <button
                type="submit"
                className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                退出登录
              </button>
            </Form>
          </div>
        </div>
      </div>
    </nav>
  );
}
