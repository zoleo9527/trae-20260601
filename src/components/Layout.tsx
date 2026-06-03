import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const roles = [
  { id: 'supervisor', name: '\u95e8\u5e97\u7763\u5bfc', icon: '\U0001f3ea' },
  { id: 'production', name: '\u751f\u4ea7\u73ed\u957f', icon: '\U0001f468\u200d\U0001f373' },
  { id: 'procurement', name: '\u91c7\u8d2d\u4e3b\u7ba1', icon: '\U0001f4e6' },
];

const navItems: Record<string, { label: string; href: string; icon: string }[]> = {
  supervisor: [
    { label: '\u62a5\u91cf\u5f55\u5165', href: '/supervisor/orders', icon: '\U0001f4dd' },
    { label: '\u4e34\u65f6\u52a0\u5355', href: '/supervisor/urgent', icon: '\u26a1' },
    { label: '\u6536\u8d27\u786e\u8ba4', href: '/supervisor/delivery', icon: '\U0001f69a' },
    { label: '\u5386\u53f2\u8bb0\u5f55', href: '/supervisor/history', icon: '\U0001f4cb' },
  ],
  production: [
    { label: '\u751f\u4ea7\u6392\u7a0b', href: '/production/schedule', icon: '\U0001f4c5' },
    { label: '\u751f\u4ea7\u770b\u677f', href: '/production/board', icon: '\U0001f4ca' },
    { label: '\u5386\u53f2\u56de\u770b', href: '/production/history', icon: '\U0001f4cb' },
  ],
  procurement: [
    { label: '\u62a5\u91cf\u6c47\u603b', href: '/procurement/summary', icon: '\U0001f4ca' },
    { label: '\u91c7\u8d2d\u6e05\u5355', href: '/procurement/purchase', icon: '\U0001f4cb' },
    { label: '\u5386\u53f2\u8bb0\u5f55', href: '/procurement/history', icon: '\U0001f4dc' },
  ],
};

export default function Layout({ children, currentRole: initialRole }: { children: React.ReactNode; currentRole?: string }) {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState(initialRole || 'supervisor');

  const handleRoleChange = (roleId: string) => {
    setCurrentRole(roleId);
    router.push(navItems[roleId][0].href);
  };

  const currentNav = navItems[currentRole] || navItems.supervisor;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">🏭 中央厨房管理系统</h1>
          <div className="flex items-center space-x-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleChange(role.id)}
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
            {currentNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                  router.pathname === item.href
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
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
