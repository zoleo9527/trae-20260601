import { Form, Link, useLocation } from "@remix-run/react";
import { ROLE_LABELS } from "~/utils/types";
import clsx from "clsx";

type User = {
  id: string;
  username: string;
  name: string;
  role: string;
};

interface LayoutProps {
  user: User;
  children: React.ReactNode;
}

export function Layout({ user, children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { name: "卫生检查", href: "/", icon: "📋" },
    { name: "入住名单", href: "/students", icon: "👥" },
    { name: "钥匙台账", href: "/keys", icon: "🔑" },
    { name: "晚归记录", href: "/late-returns", icon: "🌙" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800">宿舍管理系统</h1>
            <p className="text-sm text-gray-500 mt-1">卫生检查 · 整改复查</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={clsx(
                  "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href))
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user.name}</p>
                  <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
                </div>
              </div>
            </div>
            <Form action="/logout" method="post" className="mt-3">
              <button
                type="submit"
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                退出登录
              </button>
            </Form>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
