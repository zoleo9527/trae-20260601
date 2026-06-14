"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { User } from "@/types";
import { UserCircle, Shield } from "lucide-react";

export default function LoginPage() {
  const [users, setUsers] = useState<User[]>([]);
  const { login } = useUser();
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("获取用户列表失败:", error);
    }
  };

  const handleLogin = async (userId: string) => {
    await login(userId);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2 text-primary">
          小贷管理系统
        </h1>
        <p className="text-center text-gray-500 mb-8">选择角色登录系统</p>

        <div className="space-y-4">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleLogin(user.id)}
              className="w-full p-6 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all duration-300 flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                {user.role === "ADMIN" ? (
                  <Shield className="w-6 h-6 text-primary" />
                ) : (
                  <UserCircle className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">
                  {user.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {user.role === "ADMIN" ? "管理员" : "一线操作员"}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>演示环境 - 快速角色切换</p>
        </div>
      </div>
    </div>
  );
}