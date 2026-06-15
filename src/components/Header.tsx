import { useAppStore } from '../store';
import { Truck, LogOut, Wifi, WifiOff, Bell } from 'lucide-react';

export default function Header() {
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  const isOnline = useAppStore((state) => state.isOnline);
  const notificationMessages = useAppStore((state) => state.notificationMessages);

  if (!user) return null;

  const roleNames: Record<string, string> = {
    dispatcher: '调度员',
    teamLead: '搬运组长',
    customerService: '客服',
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">搬家管理系统</h1>
            <p className="text-xs text-gray-500">现场加项与费用确认</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">在线</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">离线</span>
              </>
            )}
          </div>

          {notificationMessages.length > 0 && (
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notificationMessages.length}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-500">{roleNames[user.role]}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="退出登录"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
