import { LayoutDashboard, Stethoscope, ShieldCheck, History, Milk, Utensils } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: '工作台', icon: LayoutDashboard, path: '/' },
  { id: 'veterinary', label: '兽医巡诊', icon: Stethoscope, path: '/veterinary' },
  { id: 'quarantine', label: '隔离管理', icon: ShieldCheck, path: '/quarantine' },
  { id: 'traceability', label: '数据追溯', icon: History, path: '/traceability' },
  { id: 'milking', label: '挤奶记录', icon: Milk, path: '/milking' },
  { id: 'feeding', label: '饲喂计划', icon: Utensils, path: '/feeding' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-pasture-600 flex items-center gap-2">
          <span className="w-8 h-8 bg-pasture-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
            牧
          </span>
          牧场运营管理
        </h1>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-pasture-50 text-pasture-700 font-medium shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pasture-100 rounded-full flex items-center justify-center">
            <span className="text-pasture-600 font-medium">张</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">张三</p>
            <p className="text-xs text-gray-500">一线操作员</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
