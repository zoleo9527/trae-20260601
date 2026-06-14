import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FilePlus } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';

import { useData } from '../../contexts/DataContext';
import { DISPATCHER_SIDEBAR } from '../../utils/constants';
import { InspectionTask } from '../../types';
import { formatDate } from '../../utils/helpers';

export function DispatcherTasks() {
  const navigate = useNavigate();
  const { vehicles, tasks } = useData();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const filteredTasks = tasks.filter(task => {
    const vehicle = vehicles.find(v => v.id === task.vehicleId);
    const matchesSearch = vehicle?.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle?.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'plateNumber',
      header: '车牌号',
      render: (task: InspectionTask) => {
        const vehicle = vehicles.find(v => v.id === task.vehicleId);
        return (
          <div>
            <p className="font-medium text-gray-900">{vehicle?.plateNumber}</p>
            <p className="text-xs text-gray-500">{vehicle?.brand} {vehicle?.model}</p>
          </div>
        );
      },
    },
    {
      key: 'ownerName',
      header: '车主',
      render: (task: InspectionTask) => {
        const vehicle = vehicles.find(v => v.id === task.vehicleId);
        return (
          <div>
            <p className="text-gray-900">{vehicle?.ownerName}</p>
            <p className="text-xs text-gray-500">{vehicle?.ownerPhone}</p>
          </div>
        );
      },
    },
    {
      key: 'inspectorName',
      header: '检测员',
      render: (task: InspectionTask) => (
        <span className="text-gray-900">{task.inspectorName}</span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (task: InspectionTask) => (
        <StatusBadge status={task.status} />
      ),
    },
    {
      key: 'createdAt',
      header: '登记时间',
      render: (task: InspectionTask) => (
        <span className="text-gray-500 text-sm">{formatDate(task.createdAt)}</span>
      ),
    },
  ];

  const statusCounts = {
    all: tasks.length,
    '待执行': tasks.filter(t => t.status === '待执行').length,
    '进行中': tasks.filter(t => t.status === '进行中').length,
    '已完成': tasks.filter(t => t.status === '已完成').length,
  };

  return (
    <AppLayout role="dispatcher" sidebarItems={DISPATCHER_SIDEBAR}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">任务列表</h1>
            <p className="text-gray-500 mt-1">管理所有车辆检测任务</p>
          </div>
          
          <Button onClick={() => navigate('/dispatcher/register')}>
            <FilePlus className="w-4 h-4" />
            新建登记
          </Button>
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      ? 'bg-blue-600 text-white'
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
          <DataTable
            data={filteredTasks}
            columns={columns}
            onRowClick={(task) => {
              const vehicle = vehicles.find(v => v.id === task.vehicleId);
              console.log('View task:', task, vehicle);
            }}
          />
        ) : (
          <EmptyState
            title="暂无任务"
            description={searchTerm ? '没有找到匹配的任务，请尝试其他搜索条件' : '还没有登记任何车辆'}
            action={{
              label: '登记车辆',
              onClick: () => navigate('/dispatcher/register'),
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
