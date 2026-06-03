import { useEventStore } from '@/store/useEventStore'
import { Bell, Search } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
  { id: 'supervisor', name: '门店督导', icon: '🏪' },
  { id: 'production', name: '生产班长', icon: '👨‍🍳' },
  { id: 'procurement', name: '采购主管', icon: '📦' },
];

const navItems: Record<string, { label: string; href: string; icon: string }[]> = {
  supervisor: [
    { label: '报量录入', href: '/supervisor/orders', icon: '📝' },
    { label: '临时加单', href: '/supervisor/urgent', icon: '⚡' },
    { label: '历史记录', href: '/supervisor/history', icon: '📋' },
  ],
  production: [
    { label: '生产排程', href: '/production/schedule', icon: '📅' },
    { label: '生产看板', href: '/production/board', icon: '📊' },
    { label: '历史回看', href: '/production/history', icon: '📋' },
  ],
  procurement: [
    { label: '报量汇总', href: '/procurement/summary', icon: '📊' },
    { label: '采购清单', href: '/procurement/purchase', icon: '📋' },
    { label: '历史记录', href: '/procurement/history', icon: '📜' },
  ],
};

export default function Layout({ children, currentRole: initialRole }: { children: React.ReactNode; currentRole?: string }) {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState(initialRole || 'supervisor');

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-800">🏭 中央厨房管理系统</h1>
          </div>
          <div className="flex items-center space-x-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => {
                  setCurrentRole(role.id);
                  router.push(navItems[role.id][0].href);
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentRole === role.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {role.icon} {role.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-56 bg-white shadow-sm min-h-screen">
          <nav className="p-4 space-y-2">
            {navItems[currentRole].map((item) => (
              <Link key={item.href} href={item.href}>
                <span
                  className={`flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                    router.pathname === item.href
                      ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
