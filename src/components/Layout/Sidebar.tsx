import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Palette, 
  RefreshCw, 
  Clock,
  AlertTriangle,
  UserCheck,
  Package,
  CheckSquare
} from 'lucide-react';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRoleType } from '@/types';

const Sidebar = () => {
  const location = useLocation();
  const { orders } = useOrderStore();
  const { currentUser } = useAuthStore();
  
  const reworkCount = orders.filter(o => o.status === 'rework').length;
  const pendingModelCount = orders.filter(o => !o.modelReceived).length;
  const pendingColorCount = orders.filter(o => o.modelReceived && !o.shade).length;
  const qualityCheckCount = orders.filter(o => o.status === 'quality_check').length;
  
  const getNavItems = (role: UserRoleType | undefined) => {
    const baseItems = [
      { 
        path: '/delayed', 
        label: '交付预警', 
        icon: AlertTriangle,
        badge: null,
        roles: ['customer_service', 'designer', 'inspector']
      }
    ];
    
    const roleItems: Record<string, typeof baseItems> = {
      customer_service: [
        { 
          path: '/', 
          label: '订单总览', 
          icon: LayoutDashboard,
          badge: null,
          roles: ['customer_service']
        },
        { 
          path: '/rework', 
          label: '返工追踪', 
          icon: RefreshCw,
          badge: reworkCount,
          roles: ['customer_service']
        }
      ],
      designer: [
        { 
          path: '/', 
          label: '我的工作台', 
          icon: LayoutDashboard,
          badge: null,
          roles: ['designer']
        },
        { 
          path: '/color-pending', 
          label: '待色号确认', 
          icon: Palette,
          badge: pendingColorCount,
          roles: ['designer']
        },
        { 
          path: '/rework', 
          label: '返工处理', 
          icon: RefreshCw,
          badge: reworkCount,
          roles: ['designer']
        },
        { 
          path: '/', 
          label: '模型接收', 
          icon: Package,
          badge: pendingModelCount,
          roles: ['designer']
        }
      ],
      inspector: [
        { 
          path: '/', 
          label: '质检工作台', 
          icon: CheckSquare,
          badge: null,
          roles: ['inspector']
        },
        { 
          path: '/rework', 
          label: '返工管理', 
          icon: RefreshCw,
          badge: reworkCount,
          roles: ['inspector']
        },
        { 
          path: '/', 
          label: '待质检', 
          icon: UserCheck,
          badge: qualityCheckCount,
          roles: ['inspector']
        }
      ]
    };
    
    const roleSpecific = role ? roleItems[role] || [] : [];
    return [...roleSpecific, ...baseItems.filter(item => 
      item.roles.includes(role || '')
    )];
  };
  
  const navItems = getNavItems(currentUser?.role);
  
  return (
    <aside className="w-64 bg-slate-800 min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-sky-400" />
          义齿管理系统
        </h1>
        <p className="text-slate-400 text-sm mt-1">色号确认与返工追踪</p>
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path + item.label}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge !== null && item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="pt-4 border-t border-slate-700">
        <div className="text-slate-400 text-xs space-y-1">
          <p>共 {orders.length} 个订单</p>
          <p>返工中: {reworkCount} 单</p>
          <p>待色号: {pendingColorCount} 单</p>
          <p>待质检: {qualityCheckCount} 单</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
