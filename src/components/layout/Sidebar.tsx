import { LayoutDashboard, FolderOpen, FileText, Wallet, Settings, LogOut, ChevronDown, UserCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProjectStore } from '../../stores/projectStore';
import { roleNames, mockUsers } from '../../data/mockData';
import { useState } from 'react';

interface SidebarProps {
  currentPath: string;
  onQuickAction?: (tab: string) => void;
  currentTab?: string;
}

const menuItems = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, path: '/' },
  { id: 'projects', label: '项目管理', icon: FolderOpen, path: '/projects' },
  { id: 'settings', label: '系统设置', icon: Settings, path: '/settings' },
];

export default function Sidebar({ currentPath, onQuickAction, currentTab = 'all' }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, setCurrentUser } = useProjectStore();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const handleRoleSwitch = (user: typeof mockUsers[0]) => {
    setCurrentUser(user);
    setShowRoleSwitcher(false);
    
    if (location.pathname !== '/projects') {
      navigate('/projects');
    }

    if (user.role === 'project_manager') {
      navigate('/projects?tab=notice_rejected');
    } else if (user.role === 'review_secretary') {
      navigate('/projects?tab=notice_pending');
    } else if (user.role === 'finance') {
      navigate('/projects?tab=refund_pending');
    }
  };

  const handleQuickAction = (tab: string) => {
    if (onQuickAction) {
      onQuickAction(tab);
    }
    if (location.pathname !== '/projects') {
      navigate(`/projects?tab=${tab}`);
    }
  };

  const handleMenuClick = (path: string) => {
    if (path === '/projects') {
      const currentTabParam = new URLSearchParams(window.location.search).get('tab');
      if (currentTabParam) {
        navigate(`${path}?tab=${currentTabParam}`);
      } else {
        navigate(path);
      }
    } else {
      navigate(path);
    }
  };

  return (
    <aside className="w-64 bg-slate-800 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-blue-400">招标代理系统</h1>
        <p className="text-sm text-slate-400 mt-1">中标通知与保证金管理</p>
      </div>

      {currentUser && (
        <div className="p-4 border-b border-slate-700 bg-slate-750">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium">{currentUser.name}</p>
                <p className="text-xs text-slate-400">{roleNames[currentUser.role]}</p>
              </div>
            </div>
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="p-1 hover:bg-slate-600 rounded transition-colors"
              title="切换角色"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {showRoleSwitcher && (
            <div className="mt-3 pt-3 border-t border-slate-600">
              <p className="text-xs text-slate-400 mb-2">切换角色（演示用）</p>
              <div className="space-y-1">
                {mockUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleRoleSwitch(user)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      currentUser.id === user.id 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4" />
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs opacity-75">{roleNames[user.role]}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item.path)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-8">
          <p className="text-xs text-slate-500 px-4 mb-2">快捷入口</p>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => handleQuickAction('notice_pending')}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors w-full text-left ${
                  currentTab?.startsWith('notice')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                中标通知处理
              </button>
            </li>
            <li>
              <button
                onClick={() => handleQuickAction('refund_pending')}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors w-full text-left ${
                  currentTab?.startsWith('refund')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Wallet className="w-4 h-4" />
                保证金退还
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {currentUser && (
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => {
              useProjectStore.getState().logout();
              navigate('/');
            }}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>
      )}
    </aside>
  );
}