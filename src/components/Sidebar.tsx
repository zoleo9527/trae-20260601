import { 
  LayoutDashboard, 
  ClipboardList, 
  CalendarCheck, 
  CheckCircle, 
  FileText,
  Users,
  Star
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: '总览', icon: LayoutDashboard },
  { id: 'orders', label: '订单管理', icon: ClipboardList },
  { id: 'scheduling', label: '服务排班', icon: CalendarCheck },
  { id: 'checkin', label: '到岗确认', icon: CheckCircle },
  { id: 'logs', label: '操作日志', icon: FileText },
  { id: 'staff', label: '人员管理', icon: Users },
  { id: 'reviews', label: '客户评价', icon: Star },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
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
