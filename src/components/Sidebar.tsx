import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  ShoppingCart,
  Receipt,
  Wrench,
  FileText,
  MessageSquareWarning,
  Users,
  Wallet,
  BarChart3,
} from 'lucide-react';
import { useStore } from '../store/useStore';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/properties', icon: Building2, label: '房源管理' },
  { path: '/orders', icon: ShoppingCart, label: '订单管理' },
  { path: '/expenses', icon: Receipt, label: '费用管理' },
  { path: '/repairs', icon: Wrench, label: '维修工单' },
  { path: '/advances', icon: Wallet, label: '垫付记录' },
  { path: '/bills', icon: FileText, label: '账单管理' },
  { path: '/disputes', icon: MessageSquareWarning, label: '异议处理' },
  { path: '/landlord-summary', icon: BarChart3, label: '房东汇总' },
];

export default function Sidebar() {
  const { currentRole, setCurrentRole, currentLandlordId, landlords, setCurrentLandlordId } = useStore();

  return (
    <div className="w-64 bg-slate-900 min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">民宿托管系统</h1>
        <p className="text-slate-400 text-sm mt-1">房东对账管理</p>
      </div>

      <div className="p-4 border-b border-slate-700">
        <label className="text-slate-400 text-xs uppercase tracking-wider">当前角色</label>
        <select
          value={currentRole}
          onChange={(e) => setCurrentRole(e.target.value as typeof currentRole)}
          className="w-full mt-2 bg-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="operator">运营人员</option>
          <option value="finance">财务人员</option>
          <option value="landlord">房东</option>
        </select>

        {currentRole === 'landlord' && (
          <div className="mt-4">
            <label className="text-slate-400 text-xs uppercase tracking-wider">选择房东</label>
            <select
              value={currentLandlordId}
              onChange={(e) => setCurrentLandlordId(e.target.value)}
              className="w-full mt-2 bg-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {landlords.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">
              {currentRole === 'operator' ? '运营小王' : currentRole === 'finance' ? '财务小张' : landlords.find((l) => l.id === currentLandlordId)?.name}
            </p>
            <p className="text-slate-400 text-xs">
              {currentRole === 'operator' ? '运营人员' : currentRole === 'finance' ? '财务人员' : '房东'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
