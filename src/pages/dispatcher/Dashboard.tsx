
import { useNavigate } from 'react-router-dom';
import { FilePlus, ListTodo, CheckCircle, AlertCircle, Car } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { StatsCard } from '../../components/common/StatsCard';
import { Button } from '../../components/common/Button';
import { useData } from '../../contexts/DataContext';
import { DISPATCHER_SIDEBAR } from '../../utils/constants';

export function DispatcherDashboard() {
  const navigate = useNavigate();
  const { vehicles, tasks } = useData();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayVehicles = vehicles.filter(v => new Date(v.createdAt) >= today);
  const pendingTasks = tasks.filter(t => t.status === '待执行');
  const completedToday = vehicles.filter(v => 
    v.status === '已完成' && new Date(v.updatedAt) >= today
  );

  return (
    <AppLayout role="dispatcher" sidebarItems={DISPATCHER_SIDEBAR}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">接车员工作台</h1>
            <p className="text-gray-500 mt-1">欢迎回来，今天的工作已经开始</p>
          </div>
          
          <Button onClick={() => navigate('/dispatcher/register')}>
            <FilePlus className="w-4 h-4" />
            新建登记
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="今日登记"
            value={todayVehicles.length}
            icon={<FilePlus className="w-6 h-6" />}
            color="blue"
          />
          
          <StatsCard
            title="待分配任务"
            value={pendingTasks.length}
            icon={<ListTodo className="w-6 h-6" />}
            color="orange"
          />
          
          <StatsCard
            title="今日完成"
            value={completedToday.length}
            icon={<CheckCircle className="w-6 h-6" />}
            color="green"
          />
          
          <StatsCard
            title="总登记数"
            value={vehicles.length}
            icon={<Car className="w-6 h-6" />}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
            <div className="space-y-3">
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => navigate('/dispatcher/register')}
              >
                <FilePlus className="w-4 h-4" />
                快速登记车辆
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => navigate('/dispatcher/tasks')}
              >
                <ListTodo className="w-4 h-4" />
                查看待分配任务
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">待处理事项</h2>
            <div className="space-y-3">
              {pendingTasks.length > 0 ? (
                pendingTasks.slice(0, 3).map(task => {
                  const vehicle = vehicles.find(v => v.id === task.vehicleId);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {vehicle?.plateNumber || '未知车牌'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {vehicle?.ownerName}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status="待执行" size="sm" />
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 text-center py-4">暂无待处理事项</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatusBadge({ status, size = 'md' }: { status: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium bg-blue-100 text-blue-700 ${sizeClasses[size]}`}>
      {status}
    </span>
  );
}
