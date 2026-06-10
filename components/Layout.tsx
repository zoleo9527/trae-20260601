import Link from "next/link";
import { useRouter } from "next/router";
import { SessionUser, roleLabel } from "@/lib/auth";

interface LayoutProps {
  user: SessionUser;
  children: React.ReactNode;
}

export default function Layout({ user, children }: LayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                BIKE
              </div>
              <div>
                <div className="font-bold text-gray-900">共享单车运维调度</div>
                <div className="text-xs text-gray-500">热点区域 · 调度派单</div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  router.pathname === "/"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                热点区域
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{roleLabel(user.role)}</div>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.name.charAt(0)}
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-600 transition px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}
