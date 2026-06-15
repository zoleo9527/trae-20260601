import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, AlertTriangle, User } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_LABELS, Role } from '@/types';

export const Header: React.FC = () => {
  const location = useLocation();
  const currentRole = useAppStore((state) => state.currentRole);
  const setCurrentRole = useAppStore((state) => state.setCurrentRole);
  const anomalies = useAppStore((state) => state.anomalies);

  const pendingCount = anomalies.filter((a) => a.status === 'pending').length;

  const roles: Role[] = ['manager', 'dispatcher', 'repairer'];

  return (
    <header className="bg-[#1e3a5f] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <AlertTriangle className="text-yellow-400" size={24} />
              <span className="text-lg font-bold">工程机械租赁管理系统</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className={`px-3 py-2 rounded text-sm transition-all ${
                  location.pathname === '/'
                    ? 'bg-white/20 font-medium'
                    : 'hover:bg-white/10'
                }`}
              >
                异常单看板
                {pendingCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setCurrentRole(role)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                    currentRole === role
                      ? 'bg-white text-[#1e3a5f] font-medium shadow'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <User size={14} />
                    {ROLE_LABELS[role]}
                  </span>
                </button>
              ))}
            </div>
            <Link
              to="/settings"
              className={`p-2 rounded-lg transition-all ${
                location.pathname === '/settings'
                  ? 'bg-white/20'
                  : 'hover:bg-white/10'
              }`}
            >
              <Settings size={20} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
