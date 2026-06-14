import { useState, useEffect } from 'react';
import type { MetaFunction, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useRevalidator } from '@remix-run/react';
import VehicleCard from '~/components/VehicleCard';
import { getStatusLabel } from '~/utils/formatters';
import { filterVehicles, getUsersByRole, getVehiclesWithDetails } from '~/utils/db.server';

export const meta: MetaFunction = () => {
  return [
    { title: '车辆列表 - 二手车检测管理系统' },
    { name: 'description', content: '二手车检测报告与整备计划管理系统' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const role = url.searchParams.get('role') || undefined;
  const managerId = url.searchParams.get('managerId') || undefined;
  const assessorId = url.searchParams.get('assessorId') || undefined;
  const financeId = url.searchParams.get('financeId') || undefined;

  const vehicles = await getVehiclesWithDetails({
    search,
    status,
    currentAssigneeRole: role,
    managerId,
    assessorId,
    financeId
  });

  const managers = await getUsersByRole('manager');
  const assessors = await getUsersByRole('assessor');
  const finance = await getUsersByRole('finance');

  const stats = {
    total: vehicles.length,
    pending: vehicles.filter(v => v.status === 'pending').length,
    preparing: vehicles.filter(v => v.status === 'preparing').length,
    completed: vehicles.filter(v => v.status === 'completed').length,
    totalCost: vehicles.reduce((sum, v) => sum + (v.totalCost || 0), 0),
    totalTaskCount: vehicles.reduce((sum, v) => sum + (v.taskCount || 0), 0),
    totalCompletedTasks: vehicles.reduce((sum, v) => sum + (v.completedTasks || 0), 0)
  };

  return json({
    vehicles,
    managers,
    assessors,
    finance,
    filters: { search, status, role, managerId, assessorId, financeId },
    stats
  });
}

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待检测' },
  { value: 'inspected', label: '已检测' },
  { value: 'preparing', label: '整备中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const roleOptions = [
  { value: '', label: '全部负责人' },
  { value: 'manager', label: '收车经理' },
  { value: 'assessor', label: '评估师' },
  { value: 'finance', label: '金融专员' },
];

export default function Index() {
  const { vehicles, managers, assessors, finance, filters, stats } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || '');
  const [roleFilter, setRoleFilter] = useState(filters.role || '');
  const [managerFilter, setManagerFilter] = useState(filters.managerId || '');
  const [assessorFilter, setAssessorFilter] = useState(filters.assessorId || '');
  const [financeFilter, setFinanceFilter] = useState(filters.financeId || '');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter) params.set('status', statusFilter);
    if (roleFilter) params.set('role', roleFilter);
    if (managerFilter) params.set('managerId', managerFilter);
    if (assessorFilter) params.set('assessorId', assessorFilter);
    if (financeFilter) params.set('financeId', financeFilter);

    const currentUrl = new URL(window.location.href);
    const newSearch = params.toString();

    if (currentUrl.search !== `?${newSearch}` && currentUrl.search !== newSearch) {
      window.history.replaceState(null, '', `/?${newSearch}`);
      revalidator.revalidate();
    }
  }, [searchTerm, statusFilter, roleFilter, managerFilter, assessorFilter, financeFilter, revalidator]);

  const getManagerName = (id: string) => {
    return managers.find(m => m.id === id)?.name || '未知';
  };

  const getAssessorName = (id: string | null) => {
    if (!id) return '未分配';
    return assessors.find(a => a.id === id)?.name || '未知';
  };

  const getFinanceName = (id: string | null) => {
    if (!id) return '未分配';
    return finance.find(f => f.id === id)?.name || '未知';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">车辆列表</h1>
          <p className="text-gray-500 mt-1">管理所有收购车辆的检测和整备进度</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500">总车辆</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-xs text-gray-500">待检测</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.preparing}</div>
              <div className="text-xs text-gray-500">整备中</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-xs text-gray-500">已完成</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索车牌、品牌、车型..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setManagerFilter('');
                setAssessorFilter('');
                setFinanceFilter('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {showAdvancedFilters ? '收起筛选' : '高级筛选'}
            </button>
          </div>

          {showAdvancedFilters && (
            <div className="border-t border-gray-200 pt-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    收车经理
                  </label>
                  <select
                    value={managerFilter}
                    onChange={(e) => setManagerFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">全部</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    评估师
                  </label>
                  <select
                    value={assessorFilter}
                    onChange={(e) => setAssessorFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">全部</option>
                    {assessors.map((assessor) => (
                      <option key={assessor.id} value={assessor.id}>
                        {assessor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    金融专员
                  </label>
                  <select
                    value={financeFilter}
                    onChange={(e) => setFinanceFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">全部</option>
                    {finance.map((financeStaff) => (
                      <option key={financeStaff.id} value={financeStaff.id}>
                        {financeStaff.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    任务统计:
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{stats.totalCompletedTasks}</span>
                    <span className="text-gray-500"> / </span>
                    <span className="font-medium">{stats.totalTaskCount}</span>
                    <span className="text-gray-500 ml-1">已完成任务</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    成本统计:
                  </div>
                  <div className="text-sm font-medium text-blue-600">
                    ¥{stats.totalCost.toLocaleString()}
                  </div>
                </div>
              </div>
              {(managerFilter || assessorFilter || financeFilter || roleFilter) && (
                <div className="mt-3 flex items-center space-x-2 flex-wrap">
                  <span className="text-sm text-gray-600">当前筛选:</span>
                  {managerFilter && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      收车经理: {getManagerName(managerFilter)}
                    </span>
                  )}
                  {assessorFilter && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      评估师: {getAssessorName(assessorFilter)}
                    </span>
                  )}
                  {financeFilter && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      金融专员: {getFinanceName(financeFilter)}
                    </span>
                  )}
                  {roleFilter && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      当前负责人: {getStatusLabel(roleFilter)}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setManagerFilter('');
                      setAssessorFilter('');
                      setFinanceFilter('');
                      setRoleFilter('');
                    }}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    清除筛选
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle: any) => {
          const manager = managers.find(m => m.id === vehicle.managerId);
          const taskCount = vehicle.taskCount || 0;
          const completedTasks = vehicle.completedTasks || 0;
          const totalCost = vehicle.totalCost || 0;

          return (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              manager={manager}
              taskCount={taskCount}
              completedTasks={completedTasks}
              totalCost={totalCost}
            />
          );
        })}
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚗</div>
          <h3 className="text-lg font-medium text-gray-900">暂无车辆</h3>
          <p className="text-gray-500 mt-1">没有找到匹配的车辆记录</p>
        </div>
      )}
    </div>
  );
}