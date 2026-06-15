import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Calendar, Package, TrendingUp, Wrench } from 'lucide-react';
import { Equipment, MaintenancePlan, PartsInventory, Exception } from '../types';

interface DashboardProps {
  equipment: Equipment[];
  maintenancePlans: MaintenancePlan[];
  partsInventory: PartsInventory[];
  exceptions: Exception[];
  onNavigate: (page: string) => void;
}

export function Dashboard({ equipment, maintenancePlans, partsInventory, exceptions, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    totalEquipment: 0,
    runningEquipment: 0,
    warningEquipment: 0,
    downEquipment: 0,
    pendingPlans: 0,
    overduePlans: 0,
    completedPlans: 0,
    lowStockParts: 0,
    pendingExceptions: 0,
    highPriorityExceptions: 0,
  });

  useEffect(() => {
    const running = equipment.filter(e => e.status === 'running').length;
    const warning = equipment.filter(e => e.status === 'warning').length;
    const down = equipment.filter(e => e.status === 'down').length;
    
    const pending = maintenancePlans.filter(p => p.status === 'pending').length;
    const overdue = maintenancePlans.filter(p => p.status === 'overdue').length;
    const completed = maintenancePlans.filter(p => p.status === 'completed').length;
    
    const lowStock = partsInventory.filter(p => p.quantity <= p.minStock).length;
    
    const pendingEx = exceptions.filter(e => e.status === 'pending').length;
    const highPriority = exceptions.filter(e => e.status === 'pending' && e.priority === 'high').length;

    setStats({
      totalEquipment: equipment.length,
      runningEquipment: running,
      warningEquipment: warning,
      downEquipment: down,
      pendingPlans: pending,
      overduePlans: overdue,
      completedPlans: completed,
      lowStockParts: lowStock,
      pendingExceptions: pendingEx,
      highPriorityExceptions: highPriority,
    });
  }, [equipment, maintenancePlans, partsInventory, exceptions]);

  const recentExceptions = exceptions.filter(e => e.status === 'pending').slice(0, 5);

  const statCards = [
    { label: '设备总数', value: stats.totalEquipment, icon: Wrench, color: 'bg-blue-500' },
    { label: '运行中', value: stats.runningEquipment, icon: Activity, color: 'bg-green-500' },
    { label: '预警', value: stats.warningEquipment, icon: AlertTriangle, color: 'bg-yellow-500' },
    { label: '停机', value: stats.downEquipment, icon: Activity, color: 'bg-red-500' },
    { label: '待执行保养', value: stats.pendingPlans, icon: Calendar, color: 'bg-purple-500' },
    { label: '逾期保养', value: stats.overduePlans, icon: AlertTriangle, color: 'bg-orange-500' },
    { label: '库存不足', value: stats.lowStockParts, icon: Package, color: 'bg-pink-500' },
    { label: '待处理异常', value: stats.pendingExceptions, icon: AlertTriangle, color: 'bg-red-600' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>
        <p className="text-gray-500 mt-1">实时监控设备状态和保养进度</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className={`${color} text-white rounded-xl p-4 cursor-pointer hover:opacity-90 transition-opacity`}
            onClick={() => {
              if (label === '逾期保养' || label === '待执行保养') {
                onNavigate('maintenance');
              } else if (label === '库存不足') {
                onNavigate('parts');
              } else if (label === '待处理异常') {
                onNavigate('exceptions');
              } else {
                onNavigate('equipment');
              }
            }}
          >
            <div className="flex items-center justify-between">
              <Icon className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{value}</span>
            </div>
            <p className="text-sm opacity-90 mt-2">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">设备状态分布</h2>
            <button 
              onClick={() => onNavigate('equipment')}
              className="text-primary-500 hover:text-primary-600 text-sm"
            >
              查看全部
            </button>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <div className="relative w-full h-32 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-green-500 transition-all"
                  style={{ width: `${(stats.runningEquipment / stats.totalEquipment) * 100}%` }}
                />
                <div 
                  className="absolute inset-y-0 bg-yellow-500 transition-all"
                  style={{ 
                    left: `${(stats.runningEquipment / stats.totalEquipment) * 100}%`,
                    width: `${(stats.warningEquipment / stats.totalEquipment) * 100}%`
                  }}
                />
                <div 
                  className="absolute inset-y-0 bg-red-500 transition-all"
                  style={{ 
                    left: `${((stats.runningEquipment + stats.warningEquipment) / stats.totalEquipment) * 100}%`,
                    width: `${(stats.downEquipment / stats.totalEquipment) * 100}%`
                  }}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-gray-600">运行中</span>
                <span className="font-semibold text-gray-800">{stats.runningEquipment}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-gray-600">预警</span>
                <span className="font-semibold text-gray-800">{stats.warningEquipment}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-gray-600">停机</span>
                <span className="font-semibold text-gray-800">{stats.downEquipment}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">保养进度</h2>
            <button 
              onClick={() => onNavigate('maintenance')}
              className="text-primary-500 hover:text-primary-600 text-sm"
            >
              查看全部
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">已完成</span>
                <span className="font-medium text-gray-800">{stats.completedPlans}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(stats.completedPlans / maintenancePlans.length) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">待执行</span>
                <span className="font-medium text-gray-800">{stats.pendingPlans}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(stats.pendingPlans / maintenancePlans.length) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">已逾期</span>
                <span className="font-medium text-red-500">{stats.overduePlans}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${(stats.overduePlans / maintenancePlans.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">待处理异常</h2>
          <button 
            onClick={() => onNavigate('exceptions')}
            className="text-primary-500 hover:text-primary-600 text-sm"
          >
            查看全部
          </button>
        </div>
        {recentExceptions.length > 0 ? (
          <div className="space-y-3">
            {recentExceptions.map(exception => (
              <div 
                key={exception.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  exception.priority === 'high' ? 'bg-red-50' : 'bg-yellow-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${exception.priority === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                  <div>
                    <p className="font-medium text-gray-800">{exception.title}</p>
                    <p className="text-sm text-gray-500">{exception.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{exception.createdAt}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    exception.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {exception.priority === 'high' ? '高优先级' : '中优先级'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>暂无待处理异常</p>
          </div>
        )}
      </div>
    </div>
  );
}
