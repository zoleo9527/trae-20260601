import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Car,
  Search,
  X,
} from 'lucide-react';
import type { Vehicle } from '@/types';
import { vehiclesApi } from '@/lib/api';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: '今日施工', path: '/', icon: <LayoutDashboard size={20} />, roles: ['all'] },
  { label: '开单登记', path: '/create-order', icon: <FilePlus size={20} />, roles: ['reception'] },
  { label: '施工处理', path: '/workshop', icon: <Wrench size={20} />, roles: ['technician'] },
  { label: '质检交车', path: '/inspection', icon: <ClipboardCheck size={20} />, roles: ['inspector'] },
  { label: '数据报表', path: '/stats', icon: <BarChart3 size={20} />, roles: ['manager'] },
];

function PlateSearchModal({
  isOpen,
  onClose,
  onSelectVehicle,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
}) {
  const [search, setSearch] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (value: string) => {
    setSearch(value);
    if (value.length >= 2) {
      setLoading(true);
      try {
        const data = await vehiclesApi.list(value);
        setVehicles(data);
      } catch {
        setVehicles([]);
      }
      setLoading(false);
    } else {
      setVehicles([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">车牌快速查询</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="输入车牌号（至少2位）..."
              className="w-full pl-10 pr-4 py-3 border border-gray-444 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <div className="mt-4 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4 text-gray-444">搜索中...</div>
            ) : vehicles.length > 0 ? (
              <div className="space-y-2">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      onSelectVehicle(v);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-lg border border-gray-444 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-blue-600 text-lg">{v.plate}</span>
                        <div className="text-sm text-gray-444 mt-1">
                          {v.brand} {v.model} · {v.color}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{v.customer_name}</div>
                        <div className="text-xs text-gray-444">{v.customer_phone}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : search.length >= 2 ? (
              <div className="text-center py-8 text-gray-444">
                未找到匹配的车辆
              </div>
            ) : (
              <div className="text-center py-8 text-gray-444">
                请输入车牌号进行搜索
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [plateModalOpen, setPlateModalOpen] = useState(false);

  const handleSelectVehicle = (vehicle: Vehicle) => {
    window.location.href = `/vehicle/${vehicle.id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed left-0 top-0 h-full w-60 bg-gray-800 text-white z-40">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">汽车美容管理</h1>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="ml-60">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {navItems.find((n) => n.path === location.pathname)?.label || '汽车美容管理'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPlateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Search size={18} />
              <span>车牌搜索</span>
            </button>
            <div className="flex items-center gap-2">
              <Car size={20} className="text-gray-400" />
              <span className="text-sm text-gray-400">门店系统</span>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>

      <PlateSearchModal
        isOpen={plateModalOpen}
        onClose={() => setPlateModalOpen(false)}
        onSelectVehicle={handleSelectVehicle}
      />
    </div>
  );
}
