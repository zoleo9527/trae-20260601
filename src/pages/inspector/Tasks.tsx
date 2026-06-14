import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Play, Eye } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardContent } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { useData } from '../../contexts/DataContext';
import { INSPECTOR_SIDEBAR } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import { InspectionTask } from '../../types';

export function InspectorTasks() {
  const navigate = useNavigate();
  const { vehicles, tasks, updateTask } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTasks = tasks.filter(task => {
    const vehicle = vehicles.find(v => v.id === task.vehicleId);
    const matchesSearch = vehicle?.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle?.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getVehicle = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const handleStartInspection = (task: InspectionTask) => {
    updateTask(task.id, {
      status: '进行中',
      startTime: new Date().toISOString(),
    });
    navigate(`/inspector/inspection/${task.id}`);
  };

  

  const statusCounts = {
    all: tasks.length,
    '待执行': tasks.filter(t => t.status === '待执行').length,
    '进行中': tasks.filter(t => t.status === '进行中').length,
    '已完成': tasks.filter(t => t.status === '已完成').length,
  };

  return (
    <AppLayout role="inspector" sidebarItems={INSPECTOR_SIDEBAR}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">检测任务</h1>
          <p className="text-gray-500 mt-1">执行车辆检测并提交报告</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索车牌号或车主姓名..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-inspector"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-inspector text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? '全部' : status} ({count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => {
              const vehicle = getVehicle(task.vehicleId);
              return (
                <Card key={task.id}>
                  <CardContent>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {vehicle?.plateNumber}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {vehicle?.brand} {vehicle?.model}
                        </p>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-20">车主：</span>
                        <span className="text-gray-900">{vehicle?.ownerName}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-20">电话：</span>
                        <span className="text-gray-900">{vehicle?.ownerPhone}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-20">检测类型：</span>
                        <span className="text-gray-900">{vehicle?.inspectionType}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-20">登记时间：</span>
                        <span className="text-gray-900">{formatDate(task.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {task.status === '待执行' && (
                        <Button
                          className="flex-1 bg-inspector hover:bg-inspector-dark"
                          onClick={() => handleStartInspection(task)}
                        >
                          <Play className="w-4 h-4" />
                          开始检测
                        </Button>
                      )}
                      {task.status === '进行中' && (
                        <Button
                          className="flex-1 bg-inspector hover:bg-inspector-dark"
                          onClick={() => navigate(`/inspector/inspection/${task.id}`)}
                        >
                          <Play className="w-4 h-4" />
                          继续检测
                        </Button>
                      )}
                      {task.status === '已完成' && (
                        <Button
                          variant="secondary"
                          className="flex-1"
                          onClick={() => console.log('View report')}
                        >
                          <Eye className="w-4 h-4" />
                          查看报告
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="暂无任务"
            description={searchTerm ? '没有找到匹配的任务' : '暂无可执行的检测任务'}
          />
        )}
      </div>
    </AppLayout>
  );
}
