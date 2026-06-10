import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "登录失败");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: "巡检员", username: "inspector01", name: "张巡检" },
    { role: "巡检员", username: "inspector02", name: "李巡检" },
    { role: "调度员", username: "dispatcher01", name: "王调度" },
    { role: "区域经理", username: "manager01", name: "赵经理" },
  ];

  return (
    <>
      <Head>
        <title>登录 - 共享单车运维调度系统</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
              <h1 className="text-2xl font-bold">共享单车运维调度系统</h1>
              <p className="text-blue-100 text-sm mt-1">热点区域 · 调度派单 · 全程留痕</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="请输入用户名"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="请输入密码"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-2.5 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                {loading ? "登录中..." : "登 录"}
              </button>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-3">演示账号（密码均为 123456）：</p>
                <div className="grid grid-cols-2 gap-2">
                  {demoAccounts.map((a) => (
                    <button
                      key={a.username}
                      type="button"
                      onClick={() => {
                        setUsername(a.username);
                        setPassword("123456");
                      }}
                      className="text-left px-3 py-2 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition text-sm"
                    >
                      <div className="font-medium text-gray-800">{a.name}</div>
                      <div className="text-xs text-gray-500">{a.role} · {a.username}</div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
