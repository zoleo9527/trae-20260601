import { useState } from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  ClipboardList, 
  Package, 
  FileText, 
  AlertTriangle,
  LogOut,
  User
} from 'lucide-react';
import { User as UserType } from '../types';

interface LayoutProps {
  currentUser: UserType;
  children: React.ReactNode;
  onLogout: () => void;
  currentPage: string;
  onPageChange: (page: string) => void;
  pendingExceptions: number;
}

const allMenuItems = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, roles: ['maintenance_manager', 'field_technician', 'warehouse_manager'] },
  { id: 'equipment', label: '设备档案', icon: Wrench, roles: ['maintenance_manager', 'field_technician'] },
  { id: 'maintenance', label: '保养计划', icon: ClipboardList, roles: ['maintenance_manager', 'field_technician'] },
  { id: 'parts', label: '配件库存', icon: Package, roles: ['maintenance_manager', 'warehouse_manager'] },
  { id: 'logs', label: '操作日志', icon: FileText, roles: ['maintenance_manager', 'field_technician', 'warehouse_manager'] },
  { id: 'exceptions', label: '异常处理', icon: AlertTriangle, roles: ['maintenance_manager', 'field_technician', 'warehouse_manager'] },
];

const roleLabels: Record<string, string> = {
  maintenance_manager: '维保主管',
  field_technician: '现场技师',
  warehouse_manager: '仓库管理员',
};

const roleDescriptions: Record<string, string> = {
  maintenance_manager: '可查看所有页面，创建/编辑设备档案、保养计划，处理所有异常',
  field_technician: '可查看设备档案、保养计划、异常处理，执行保养、上报停机、维修完成',
  warehouse_manager: '可查看配件库存、异常处理，发放配件、登记错发、处理库存异常',
};

export function Layout({ currentUser, children, onLogout, currentPage, onPageChange, pendingExceptions }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = allMenuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-gray-800">维保系统</h1>
                <p className="text-xs text-gray-500">叉车设备管理</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const hasBadge = item.id === 'exceptions' && pendingExceptions > 0;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onPageChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-primary-50 text-primary-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {sidebarOpen && (
                      <>
                        <span>{item.label}</span>
                        {hasBadge && (
                          <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {pendingExceptions}
                          </span>
                        )}
                      </>
                    )}
                    {!sidebarOpen && hasBadge && (
                      <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {pendingExceptions}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full mb-4 text-gray-500 hover:text-gray-700"
          >
            {sidebarOpen ? '收起菜单' : '展开菜单'}
          </button>
          <div className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentUser.role === 'maintenance_manager' ? 'bg-blue-200' :
              currentUser.role === 'field_technician' ? 'bg-green-200' :
              'bg-yellow-200'
            }`}>
              <User className={`w-5 h-5 ${
                currentUser.role === 'maintenance_manager' ? 'text-blue-600' :
                currentUser.role === 'field_technician' ? 'text-green-600' :
                'text-yellow-600'
              }`} />
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="font-medium text-gray-800">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{roleLabels[currentUser.role]}</p>
              </div>
            )}
            <button
              onClick={onLogout}
              className="text-gray-500 hover:text-red-500 transition-colors"
              title="退出登录"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          {sidebarOpen && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600">
                <strong>权限说明：</strong>{roleDescriptions[currentUser.role]}
              </p>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}