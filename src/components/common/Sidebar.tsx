import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  AlertTriangle, 
  Briefcase, 
  Users, 
  FileCheck,
  LogOut,
  User
} from 'lucide-react';
import { useStore } from '../../contexts/AppContext';

interface SidebarProps {
  role: 'operator' | 'recruiter' | 'hr';
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const navigate = useNavigate();
  const { user } = useStore();

  const getNavItems = () => {
    switch (role) {
      case 'operator':
        return [
          { path: '/operator', label: '数据概览', icon: LayoutDashboard },
          { path: '/operator/settlements', label: '返费结算审核', icon: FileText },
          { path: '/operator/appeals', label: '异常申诉仲裁', icon: AlertTriangle },
        ];
      case 'recruiter':
        return [
          { path: '/recruiter', label: '任务概览', icon: LayoutDashboard },
          { path: '/recruiter/positions', label: '岗位管理', icon: Briefcase },
          { path: '/recruiter/interviews', label: '面试名单', icon: Users },
          { path: '/recruiter/onboarding', label: '入职回执', icon: FileCheck },
          { path: '/recruiter/settlements', label: '返费结算', icon: FileText },
          { path: '/recruiter/appeals', label: '异常申诉', icon: AlertTriangle },
        ];
      case 'hr':
        return [
          { path: '/hr', label: '任务概览', icon: LayoutDashboard },
          { path: '/hr/positions', label: '岗位需求', icon: Briefcase },
          { path: '/hr/interviews', label: '面试确认', icon: Users },
          { path: '/hr/onboarding', label: '入职确认', icon: FileCheck },
          { path: '/hr/settlements', label: '返费结算', icon: FileText },
          { path: '/hr/appeals', label: '异常申诉', icon: AlertTriangle },
        ];
    }
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="w-60 bg-gradient-to-b from-blue-900 to-blue-800 flex flex-col">
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-xl font-bold text-white">蓝领招聘平台</h1>
        <p className="text-sm text-blue-200 mt-1">返费结算与异常申诉</p>
      </div>
      
      <div className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === `/operator` || item.path === `/recruiter` || item.path === `/hr`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 mx-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-blue-100 hover:bg-blue-700 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-blue-700">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-blue-200">
              {role === 'operator' ? '运营' : role === 'recruiter' ? '招聘顾问' : '企业HR'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2 text-blue-100 hover:bg-blue-700 rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">退出登录</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;