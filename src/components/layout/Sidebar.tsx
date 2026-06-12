import { LayoutDashboard, FolderOpen, FileText, Wallet, Settings, LogOut } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { roleNames } from '../../data/mockData';

interface SidebarProps {
  currentPath: string;
}

const menuItems = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, path: '/' },
  { id: 'projects', label: '项目管理', icon: FolderOpen, path: '/projects' },
  { id: 'settings', label: '系统设置', icon: Settings, path: '/settings' },
];

export default function Sidebar({ currentPath }: SidebarProps) {
  const { currentUser, logout } = useProjectStore();

  return (
    <aside className="w-64 bg-slate-800 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-blue-400">招标代理系统</h1>
        <p className="text-sm text-slate-400 mt-1">中标通知与保证金管理</p>
      </div>

      {currentUser && (
        <div className="p-4 border-b border-slate-700 bg-slate-750">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{currentUser.name}</p>
              <p className="text-xs text-slate-400">{roleNames[currentUser.role]}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
            return (
              <li key={item.id}>
                <a
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="mt-8">
          <p className="text-xs text-slate-500 px-4 mb-2">快捷入口</p>
          <ul className="space-y-2">
            <li>
              <a
                href="/projects?tab=notice"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-slate-300 hover:bg-slate-700 ${
                  currentPath.includes('notice') ? 'bg-blue-600 text-white' : ''
                }`}
              >
                <FileText className="w-4 h-4" />
                中标通知处理
              </a>
            </li>
            <li>
              <a
                href="/projects?tab=refund"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-slate-300 hover:bg-slate-700 ${
                  currentPath.includes('refund') ? 'bg-blue-600 text-white' : ''
                }`}
              >
                <Wallet className="w-4 h-4" />
                保证金退还
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {currentUser && (
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={logout}
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
