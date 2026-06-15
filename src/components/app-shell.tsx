"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ROLE_LABEL } from "@/lib/constants";
import Link from "next/link";
import { AuthProvider } from "@/components/auth-provider";

const NAV = [
  { href: "/", label: "工作台", match: "^/$" },
  { href: "/bargain", label: "议价复核", match: "^/bargain" },
  { href: "/payment", label: "打款申请", match: "^/payment" },
];

function ShellInner({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) {
    router.replace("/login");
    return null;
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <span className="font-display text-white text-lg">R</span>
              </div>
              <span className="font-display text-xl tracking-wide">数码回收店</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map((n) => {
                const active = new RegExp(n.match).test(pathname);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-slate-500">{ROLE_LABEL[user.role]}</div>
            </div>
            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="text-sm px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              切换角色
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ShellInner>{children}</ShellInner>
    </AuthProvider>
  );
}
