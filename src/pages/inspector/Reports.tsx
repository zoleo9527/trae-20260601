import { useState } from 'react';
import { Search } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardContent } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { useData } from '../../contexts/DataContext';
import { INSPECTOR_SIDEBAR } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

export function InspectorReports() {
  const { vehicles, reports } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredReports = reports.filter(report => {
    const vehicle = vehicles.find(v => v.id === report.vehicleId);
    const matchesSearch = vehicle?.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle?.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getVehicle = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const statusCounts = {
    all: reports.length,
    '待审核': reports.filter(r => r.status === '待审核').length,
    '已通过': reports.filter(r => r.status === '已通过').length,
    '已驳回': reports.filter(r => r.status === '已驳回').length,
  };

  return (
    <AppLayout role="inspector" sidebarItems={INSPECTOR_SIDEBAR}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">我的报告</h1>
          <p className="text-gray-500 mt-1">查看已提交的检测报告</p>
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

        {filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => {
              const vehicle = getVehicle(report.vehicleId);
              return (
                <Card key={report.id}>
                  <CardContent>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {vehicle?.plateNumber}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {vehicle?.ownerName}
                        </p>
                      </div>
                      <StatusBadge status={report.status} />
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-20">检测结论：</span>
                        <span className={`font-medium ${
                          report.conclusion === '合格' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {report.conclusion}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-20">提交时间：</span>
                        <span className="text-gray-900">{formatDate(report.submittedAt || '')}</span>
                      </div>
                      {report.auditorName && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-500 w-20">审核员：</span>
                          <span className="text-gray-900">{report.auditorName}</span>
                        </div>
                      )}
                    </div>

                    {report.status === '已驳回' && report.rejectReason && (
                      <div className="p-3 bg-red-50 rounded-lg mb-4">
                        <p className="text-sm text-red-600">
                          <span className="font-medium">驳回原因：</span>
                          {report.rejectReason}
                        </p>
                      </div>
                    )}

                    {report.status === '已通过' && report.auditedAt && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600">
                          审核通过 · {formatDate(report.auditedAt)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="暂无报告"
            description={searchTerm ? '没有找到匹配的报告' : '还没有提交任何检测报告'}
          />
        )}
      </div>
    </AppLayout>
  );
}
