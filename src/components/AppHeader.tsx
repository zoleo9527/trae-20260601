'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Role } from '@/lib/types';
import { roleLabels } from '@/lib/utils';

interface CurrentUser {
  id: number;
  name: string;
  role: Role;
  brandId?: number | null;
}

export function AppHeader() {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const stored = document.cookie.match(/currentUser=([^;]+)/);
    if (stored) {
      try {
        setUser(JSON.parse(decodeURIComponent(stored[1])));
      } catch {
        setUser(null);
      }
    } else {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }, []);

  const handleLogout = () => {
    document.cookie = 'currentUser=; path=/; max-age=0';
    window.location.href = '/login';
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">
                奥
              </div>
              <span className="text-lg font-semibold text-slate-900">
                奥特莱斯运营系统
              </span>
            </Link>
            {user && (
              <nav className="hidden md:flex space-x-6">
                <Link
                  href="/reports"
                  className="text-slate-600 hover:text-brand-600 font-medium"
                >
                  销售上报
                </Link>
                {(user.role === Role.LEASING_MANAGER || user.role === Role.OPERATION_SUPERVISOR) && (
                  <Link
                    href="/reports?tab=abnormal"
                    className="text-slate-600 hover:text-brand-600 font-medium"
                  >
                    异常单
                  </Link>
                )}
              </nav>
            )}
          </div>
          {user && (
            <div className="flex items-center space-x-4">
              <div className="text-sm text-right">
                <p className="font-medium text-slate-900">{user.name}</p>
                <p className="text-slate-500">{roleLabels[user.role]}</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn-ghost text-sm"
              >
                切换角色
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
