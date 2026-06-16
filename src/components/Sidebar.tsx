import { LayoutDashboard, Package, Truck, ClipboardCheck, AlertTriangle, MessageSquare } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: '首页', icon: LayoutDashboard },
    { id: 'stock-request', label: '缺货申领', icon: Package },
    { id: 'delivery-status', label: '配货状态', icon: Truck },
    { id: 'arrival-inspection', label: '到货验收', icon: ClipboardCheck },
    { id: 'difference-handling', label: '差异处理', icon: AlertTriangle },
    { id: 'store-feedback', label: '门店反馈', icon: MessageSquare },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">餐饮供应链系统</h1>
        <p className="text-sm text-gray-500 mt-1">缺货申领与到货验收</p>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
