import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  MessageCircle, 
  History,
  User,
  ChevronDown
} from 'lucide-react';
import { useAppStore, roleLabels } from '../lib/store';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { path: '/registrations', label: '投标报名', icon: FileText },
  { path: '/clarifications', label: '答疑澄清', icon: MessageCircle },
  { path: '/logs', label: '操作记录', icon: History },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { currentUser, currentRole, setCurrentRole } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">招标管理系统</h1>
          <p className="text-sm text-gray-500 mt-1">投标报名与答疑澄清</p>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="ml-64">
        <header className="sticky top-0 bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {navItems.find(item => item.path === location.pathname)?.label || '工作台'}
              </h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <select
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value as any)}
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="project_specialist">项目专员</option>
                  <option value="review_secretary">评审秘书</option>
                  <option value="finance">财务</option>
                  <option value="admin">管理员</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
                  <p className="text-xs text-gray-500">{roleLabels[currentRole]}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}