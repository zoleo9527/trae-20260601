import { ReactNode, useState } from 'react';
import { useStore } from '@/store';
import { User, UserRole } from '@/types';
import { 
  Wrench, 
  Bell, 
  User as UserIcon, 
  ChevronDown, 
  Settings,
  Download,
  Upload,
  Database
} from 'lucide-react';
import { BackupRestoreModal } from './BackupRestoreModal';
import { NotificationPanel } from './NotificationPanel';

interface LayoutProps {
  children: ReactNode;
}

const roleLabels: Record<UserRole, string> = {
  dorm_manager: '宿管',
  repair_worker: '维修师傅',
  logistics_supervisor: '后勤主管'
};

export function Layout({ children }: LayoutProps) {
  const { currentUser, users, setCurrentUser, notifications } = useStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read && 
    (n.relatedUserId === currentUser?.id || !n.relatedUserId)
  ).length;

  const handleUserSwitch = (user: User) => {
    setCurrentUser(user);
    setShowUserMenu(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">校园维修管理系统</h1>
                <p className="text-xs text-gray-500">完工确认与二次返修管理</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationPanel onClose={() => setShowNotifications(false)} />
                )}
              </div>

              <button
                onClick={() => setShowBackupModal(true)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="备份恢复"
              >
                <Database className="w-5 h-5 text-gray-600" />
              </button>

              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
                    <p className="text-xs text-gray-500">
                      {currentUser ? roleLabels[currentUser.role as UserRole] : ''}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500">切换角色</p>
                    </div>
                    {users.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleUserSwitch(user)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                          currentUser?.id === user.id ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{roleLabels[user.role as UserRole]}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            校园维修管理系统 · 数据本地存储，可随时备份导出
          </p>
        </div>
      </footer>

      {showBackupModal && (
        <BackupRestoreModal onClose={() => setShowBackupModal(false)} />
      )}
    </div>
  );
}
