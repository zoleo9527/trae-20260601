import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  FolderHeart, 
  ClipboardList, 
  Package, 
  CheckSquare, 
  PlayCircle,
  PawPrint
} from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: '工作台' },
  { path: '/review', icon: CheckSquare, label: '复核中心' },
  { path: '/demo', icon: PlayCircle, label: '流程演示' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 bg-white border-r border-warm-100 h-screen flex flex-col fixed left-0 top-0 z-30">
      <div className="p-6 border-b border-warm-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-warm-800 text-lg">动物救助站</h1>
            <p className="text-xs text-warm-500">寄养与物资管理</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-warm-600 hover:bg-warm-50 hover:text-warm-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="mt-6 px-4">
          <p className="text-xs font-medium text-warm-400 uppercase tracking-wider mb-2">
            快捷入口
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-warm-500 opacity-60">
              <FolderHeart className="w-5 h-5" />
              <span className="text-sm">寄养家庭管理</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-warm-500 opacity-60">
              <ClipboardList className="w-5 h-5" />
              <span className="text-sm">医疗记录</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-warm-500 opacity-60">
              <Package className="w-5 h-5" />
              <span className="text-sm">物资库存</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-warm-100">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
            张
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-warm-800 truncate">张志愿</p>
            <p className="text-xs text-warm-500">救助志愿者</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
