import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Film,
  MonitorPlay,
  Ticket,
  History,
  LayoutDashboard,
  User,
  ChevronDown,
} from 'lucide-react';
import { useRoleStore } from '@/store/roleStore';
import { roleLabels, type UserRole } from '@/types/common';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '工作台' },
  { path: '/schedule', icon: Film, label: '影片排片' },
  { path: '/hall', icon: MonitorPlay, label: '影厅资源' },
  { path: '/ticket', icon: Ticket, label: '票务核销' },
  { path: '/history', icon: History, label: '历史回看' },
];

const roles: UserRole[] = ['schedule_manager', 'ticket_manager', 'duty_manager'];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { currentRole, setRole, getRoleName } = useRoleStore();
  const [roleDropdownOpen, setRoleDropdownOpen] = React.useState(false);

  return (
    <div className="w-64 bg-cinema-darker min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cinema-red rounded-xl flex items-center justify-center">
            <Film className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">影院运营</h1>
            <p className="text-gray-400 text-xs">工作面系统</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cinema-red text-white shadow-lg shadow-red-900/20'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 bg-cinema-red rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white text-sm font-medium">{getRoleName()}</p>
              <p className="text-gray-400 text-xs">当前身份</p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                roleDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {roleDropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setRole(role);
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    currentRole === role
                      ? 'bg-cinema-red text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <User className="w-4 h-4" />
                  {roleLabels[role]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
