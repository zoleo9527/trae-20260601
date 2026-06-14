import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FilePlus, ListTodo, ClipboardCheck, FileText, ClipboardList, Send, PhoneCall, History, BarChart3 } from 'lucide-react';
import { Role, SidebarItem } from '../../types';
import { ROLE_CONFIG } from '../../utils/constants';

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-5 h-5" />,
  FilePlus: <FilePlus className="w-5 h-5" />,
  ListTodo: <ListTodo className="w-5 h-5" />,
  ClipboardCheck: <ClipboardCheck className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
  ClipboardList: <ClipboardList className="w-5 h-5" />,
  Send: <Send className="w-5 h-5" />,
  PhoneCall: <PhoneCall className="w-5 h-5" />,
  History: <History className="w-5 h-5" />,
  BarChart3: <BarChart3 className="w-5 h-5" />,
};

interface SidebarProps {
  role: Role;
  items: SidebarItem[];
}

export function Sidebar({ role, items }: SidebarProps) {
  const config = ROLE_CONFIG[role];
  const roleColor = config.color;

  return (
    <aside className={`w-64 bg-${roleColor} text-white flex flex-col`}>
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg">{config.name}</h1>
            <p className="text-xs text-white/70">{config.description}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20 font-semibold'
                      : 'hover:bg-white/10'
                  }`
                }
              >
                {iconMap[item.icon]}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-white/60 text-center">
          车辆年检站管理系统 v1.0
        </p>
      </div>
    </aside>
  );
}
