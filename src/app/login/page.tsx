"use client";

import { AuthProvider, useAuth } from "@/components/auth-provider";
import { ROLE_LABEL } from "@/lib/constants";
import type { Role } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ListUser {
  id: string;
  username: string;
  name: string;
  role: Role;
}

function LoginInner() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<ListUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) router.replace("/");
    fetch("/api/auth/users")
      .then((r) => r.json())
      .then(setUsers);
  }, [user, router]);

  async function handleLogin(u: ListUser) {
    try {
      setLoading(true);
      setError("");
      await login(u.username);
      router.replace("/");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-brand-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-4">
            <span className="font-display text-white text-3xl">R</span>
          </div>
          <h1 className="font-display text-3xl tracking-wider">数码回收店</h1>
          <p className="text-sm text-slate-500 mt-1">议价复核与打款申请系统</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-medium text-slate-500 mb-4">简化登录 · 选择角色进入</h2>
          {error && (
            <div className="mb-4 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <div className="space-y-2">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => handleLogin(u)}
                disabled={loading}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 transition disabled:opacity-50"
              >
                <div className="text-left">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">账号：{u.username}</div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {ROLE_LABEL[u.role]}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400 leading-relaxed">
            为聚焦议价复核与打款申请的交接断点，登录使用简化模式（无密码）。生产环境请接入真实身份认证。
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginInner />
    </AuthProvider>
  );
}
