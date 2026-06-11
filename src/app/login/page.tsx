'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Role } from '@/lib/types';

interface UserOption {
  id: number;
  name: string;
  role: Role;
  brandId?: number | null;
  brandName?: string | null;
  description: string;
}

const roleDescriptions: Record<Role, string> = {
  [Role.LEASING_MANAGER]: '招商经理 - 负责复核和费用结算',
  [Role.OPERATION_SUPERVISOR]: '营运督导 - 负责材料收取和初审',
  [Role.BRAND_MANAGER]: '品牌店长 - 提交销售上报',
};

const roleGroups = [
  { role: Role.LEASING_MANAGER, label: '招商经理', color: 'bg-purple-50 border-purple-200' },
  { role: Role.OPERATION_SUPERVISOR, label: '营运督导', color: 'bg-blue-50 border-blue-200' },
  { role: Role.BRAND_MANAGER, label: '品牌店长', color: 'bg-green-50 border-green-200' },
];

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => {
        setUsers(
          data.map((u: any) => ({
            id: u.id,
            name: u.name,
            role: u.role,
            brandId: u.brandId,
            brandName: u.brandName,
            description: u.brandName
              ? `${u.brandName}品牌店长 - 提交销售上报`
              : roleDescriptions[u.role as Role],
          }))
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogin = (user: UserOption) => {
    setSelectedId(user.id);
    document.cookie = `currentUser=${encodeURIComponent(JSON.stringify(user))}; path=/`;
    setTimeout(() => {
      router.push('/reports');
    }, 300);
  };

  return (
    <div className="min-h-[calc(100vh-129px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-brand-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
            奥
          </div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            奥特莱斯运营系统
          </h1>
          <p className="mt-2 text-slate-500">
            销售上报 · 材料审核 · 费用结算
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">加载中...</div>
        ) : (
          <div className="mt-8 space-y-8">
            {roleGroups.map((group) => {
              const groupUsers = users.filter((u) => u.role === group.role);
              if (groupUsers.length === 0) return null;
              return (
                <div key={group.role} className={`rounded-xl border p-6 ${group.color}`}>
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">
                    {group.label}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {groupUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleLogin(user)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedId === user.id
                            ? 'border-brand-500 bg-white shadow-sm'
                            : 'border-slate-200 bg-white hover:border-brand-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-600">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{user.name}</p>
                            <p className="text-sm text-slate-500">{user.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 text-center text-sm text-slate-400">
          演示环境 - 点击任一角色即可登录体验
        </div>
      </div>
    </div>
  );
}
